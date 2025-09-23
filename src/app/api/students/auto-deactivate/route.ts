import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'

// Força renderização dinâmica
export const dynamic = 'force-dynamic'

// Função para calcular faltas consecutivas (mesma lógica da API de absences)
function calculateConsecutiveAbsences(checkIns: any[], expectedTrainingDays: number = 2) {
  const sortedCheckIns = checkIns
    .filter(c => c.status === 'approved')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  if (sortedCheckIns.length === 0) {
    const today = new Date()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const daysSinceStart = Math.floor((today.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24))
    const expectedTrainings = Math.floor((daysSinceStart / 7) * expectedTrainingDays)
    return Math.min(expectedTrainings, 10)
  }

  const lastCheckIn = new Date(sortedCheckIns[0].date)
  const today = new Date()
  const daysSinceLastCheckIn = Math.floor((today.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24))

  if (daysSinceLastCheckIn > 3) {
    const weeksSinceLastCheckIn = daysSinceLastCheckIn / 7
    const expectedTrainings = Math.floor(weeksSinceLastCheckIn * expectedTrainingDays)
    return Math.min(expectedTrainings, 10)
  }

  return 0
}

// Endpoint para verificar e desativar automaticamente alunos com 3+ faltas consecutivas
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

    // Apenas admins e instrutores podem executar desativação automática
    if (authUser.role !== 'instructor' && authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Buscar todos os alunos ativos
    const activeStudents = await prisma.user.findMany({
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
      }
    })

    const studentsToDeactivate = []
    const studentsAtRisk = []

    // Verificar cada aluno
    for (const student of activeStudents) {
      const consecutiveAbsences = calculateConsecutiveAbsences(student.checkins)
      
      if (consecutiveAbsences >= 3) {
        studentsToDeactivate.push({
          id: student.id,
          name: student.name,
          email: student.email,
          consecutiveAbsences,
          lastCheckIn: student.checkins.find(c => c.status === 'approved')?.date || null
        })
      } else if (consecutiveAbsences >= 2) {
        studentsAtRisk.push({
          id: student.id,
          name: student.name,
          email: student.email,
          consecutiveAbsences,
          lastCheckIn: student.checkins.find(c => c.status === 'approved')?.date || null
        })
      }
    }

    // Desativar alunos com 3+ faltas consecutivas
    const deactivatedStudents = []
    for (const student of studentsToDeactivate) {
      try {
        await prisma.user.update({
          where: { id: student.id },
          data: { active: false }
        })
        deactivatedStudents.push(student)
      } catch (error) {
        console.error(`Erro ao desativar aluno ${student.name}:`, error)
      }
    }

    return NextResponse.json({
      message: `Verificação automática concluída`,
      summary: {
        totalActiveStudents: activeStudents.length,
        studentsDeactivated: deactivatedStudents.length,
        studentsAtRisk: studentsAtRisk.length
      },
      deactivatedStudents,
      studentsAtRisk,
      executedBy: authUser.name,
      executedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Auto deactivate error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// Endpoint para verificar quais alunos estão em risco (sem desativar)
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

    // Apenas admins e instrutores podem ver relatório de risco
    if (authUser.role !== 'instructor' && authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Buscar todos os alunos ativos
    const activeStudents = await prisma.user.findMany({
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
      }
    })

    const riskAnalysis = {
      safe: [],
      warning: [], // 2 faltas consecutivas
      critical: [] // 3+ faltas consecutivas
    }

    // Analisar cada aluno
    for (const student of activeStudents) {
      const consecutiveAbsences = calculateConsecutiveAbsences(student.checkins)
      const lastApprovedCheckIn = student.checkins.find(c => c.status === 'approved')
      
      const studentData = {
        id: student.id,
        name: student.name,
        email: student.email,
        belt: student.belt,
        consecutiveAbsences,
        lastCheckIn: lastApprovedCheckIn?.date || null,
        daysSinceLastCheckIn: lastApprovedCheckIn 
          ? Math.floor((new Date().getTime() - new Date(lastApprovedCheckIn.date).getTime()) / (1000 * 60 * 60 * 24))
          : null
      }
      
      if (consecutiveAbsences >= 3) {
        riskAnalysis.critical.push(studentData)
      } else if (consecutiveAbsences >= 2) {
        riskAnalysis.warning.push(studentData)
      } else {
        riskAnalysis.safe.push(studentData)
      }
    }

    return NextResponse.json({
      summary: {
        totalStudents: activeStudents.length,
        safe: riskAnalysis.safe.length,
        warning: riskAnalysis.warning.length,
        critical: riskAnalysis.critical.length
      },
      riskAnalysis,
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Get risk analysis error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}