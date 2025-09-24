import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'

// Força renderização dinâmica
export const dynamic = 'force-dynamic'

// Função para calcular faltas consecutivas
function calculateConsecutiveAbsences(checkIns: any[], expectedTrainingDays: number = 2) {
  // Ordenar check-ins por data (mais recente primeiro)
  const sortedCheckIns = checkIns
    .filter(c => c.status === 'approved')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Se não tem nenhum check-in aprovado, retornar 0 faltas
  // Um aluno novo não deveria ter faltas no primeiro dia
  if (sortedCheckIns.length === 0) {
    return 0
  }

  // Calcular dias desde o último check-in aprovado
  const lastCheckIn = new Date(sortedCheckIns[0].date)
  const today = new Date()
  const daysSinceLastCheckIn = Math.floor((today.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24))

  // Se passou mais de 3 dias sem check-in, considerar como faltas consecutivas
  if (daysSinceLastCheckIn > 3) {
    // Calcular faltas baseado na frequência esperada (3 treinos por semana)
    const weeksSinceLastCheckIn = daysSinceLastCheckIn / 7
    const expectedTrainings = Math.floor(weeksSinceLastCheckIn * 3) // 3 treinos por semana
    return Math.min(expectedTrainings, 6) // Máximo de 6 faltas para desativação
  }

  return 0
}

// Função para calcular estatísticas de faltas de um aluno
function calculateStudentAbsenceStats(student: any) {
  const now = new Date()
  const currentMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0')
  
  // Check-ins do mês atual
  const monthlyCheckIns = student.checkins.filter((c: any) => c.date.startsWith(currentMonth))
  const approvedMonthlyCheckIns = monthlyCheckIns.filter((c: any) => c.status === 'approved')
  const pendingMonthlyCheckIns = monthlyCheckIns.filter((c: any) => c.status === 'pending')
  const rejectedMonthlyCheckIns = monthlyCheckIns.filter((c: any) => c.status === 'rejected')

  // Calcular faltas consecutivas
  const consecutiveAbsences = calculateConsecutiveAbsences(student.checkins)

  // Calcular frequência mensal (baseado em 8 treinos esperados por mês)
  const expectedMonthlyTrainings = 8
  const monthlyFrequency = Math.min(100, Math.round((approvedMonthlyCheckIns.length / expectedMonthlyTrainings) * 100))

  // Determinar status do aluno
  let status = 'active'
  let statusMessage = 'Aluno ativo'
  
  if (consecutiveAbsences >= 6) {
    status = 'at_risk'
    statusMessage = `${consecutiveAbsences} faltas consecutivas - Risco de desativação`
  } else if (consecutiveAbsences >= 4) {
    status = 'warning'
    statusMessage = `${consecutiveAbsences} faltas consecutivas - Atenção necessária`
  } else if (monthlyFrequency < 50) {
    status = 'low_frequency'
    statusMessage = 'Frequência baixa este mês'
  }

  return {
    studentId: student.id,
    studentName: student.name,
    belt: student.belt,
    degree: student.degree,
    active: student.active,
    monthlyStats: {
      approved: approvedMonthlyCheckIns.length,
      pending: pendingMonthlyCheckIns.length,
      rejected: rejectedMonthlyCheckIns.length,
      frequency: monthlyFrequency,
      expectedTrainings: expectedMonthlyTrainings
    },
    absenceStats: {
      consecutiveAbsences,
      lastCheckIn: approvedMonthlyCheckIns.length > 0 
        ? approvedMonthlyCheckIns[approvedMonthlyCheckIns.length - 1].date 
        : null,
      daysSinceLastCheckIn: approvedMonthlyCheckIns.length > 0 
        ? Math.floor((now.getTime() - new Date(approvedMonthlyCheckIns[approvedMonthlyCheckIns.length - 1].date).getTime()) / (1000 * 60 * 60 * 24))
        : null
    },
    status,
    statusMessage
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 })
    }

    const authUser = verifyToken(token)
    if (!authUser) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')

    // Se for aluno, só pode ver suas próprias faltas
    if (authUser.role === 'student') {
      const student = await prisma.user.findUnique({
        where: { id: authUser.id },
        include: {
          checkins: {
            select: {
              date: true,
              status: true,
              createdAt: true
            },
            orderBy: { date: 'desc' }
          }
        }
      })

      if (!student) {
        return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 })
      }

      const absenceStats = calculateStudentAbsenceStats(student)
      return NextResponse.json(absenceStats)
    }

    // Para professores/admins
    if (authUser.role !== 'instructor' && authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    if (studentId) {
      // Buscar faltas de um aluno específico
      const student = await prisma.user.findUnique({
        where: { 
          id: parseInt(studentId),
          role: 'student'
        },
        include: {
          checkins: {
            select: {
              date: true,
              status: true,
              createdAt: true
            },
            orderBy: { date: 'desc' }
          }
        }
      })

      if (!student) {
        return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 })
      }

      const absenceStats = calculateStudentAbsenceStats(student)
      return NextResponse.json(absenceStats)
    } else {
      // Buscar faltas de todos os alunos
      const students = await prisma.user.findMany({
        where: { 
          role: 'student',
          active: true
        },
        include: {
          checkins: {
            select: {
              date: true,
              status: true,
              createdAt: true
            },
            orderBy: { date: 'desc' }
          }
        },
        orderBy: { name: 'asc' }
      })

      const allAbsenceStats = students.map(calculateStudentAbsenceStats)
      
      // Separar por status para facilitar análise
      const summary = {
        total: allAbsenceStats.length,
        active: allAbsenceStats.filter(s => s.status === 'active').length,
        warning: allAbsenceStats.filter(s => s.status === 'warning').length,
        atRisk: allAbsenceStats.filter(s => s.status === 'at_risk').length,
        lowFrequency: allAbsenceStats.filter(s => s.status === 'low_frequency').length
      }

      return NextResponse.json({
        summary,
        students: allAbsenceStats
      })
    }
  } catch (error) {
    console.error('Get absences error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// Endpoint para desativar aluno automaticamente (será chamado por um cron job ou manualmente)
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 })
    }

    const authUser = verifyToken(token)
    if (!authUser) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Apenas admins e instrutores podem desativar alunos
    if (authUser.role !== 'instructor' && authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { studentId, reason } = await request.json()

    if (!studentId) {
      return NextResponse.json({ error: 'ID do aluno é obrigatório' }, { status: 400 })
    }

    // Buscar aluno e verificar faltas
    const student = await prisma.user.findUnique({
      where: { 
        id: studentId,
        role: 'student'
      },
      include: {
        checkins: {
          select: {
            date: true,
            status: true,
            createdAt: true
          },
          orderBy: { date: 'desc' }
        }
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 })
    }

    const absenceStats = calculateStudentAbsenceStats(student)

    // Verificar se realmente tem 6 ou mais faltas consecutivas
    if (absenceStats.absenceStats.consecutiveAbsences < 6) {
      return NextResponse.json({ 
        error: 'Aluno não tem faltas suficientes para desativação automática',
        consecutiveAbsences: absenceStats.absenceStats.consecutiveAbsences
      }, { status: 400 })
    }

    // Desativar aluno
    const updatedStudent = await prisma.user.update({
      where: { id: studentId },
      data: { active: false }
    })

    return NextResponse.json({
      message: 'Aluno desativado com sucesso',
      student: {
        id: updatedStudent.id,
        name: updatedStudent.name,
        active: updatedStudent.active
      },
      reason: reason || `Desativado automaticamente por ${absenceStats.absenceStats.consecutiveAbsences} faltas consecutivas`,
      absenceStats
    })
  } catch (error) {
    console.error('Deactivate student error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}