import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'

// Força renderização dinâmica para evitar Dynamic Server Error
export const dynamic = 'force-dynamic'

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
    const status = searchParams.get('status')
    const date = searchParams.get('date')
    const userId = searchParams.get('userId')

    const whereClause: any = {}

    if (status) {
      whereClause.status = status
    }

    if (date) {
      whereClause.date = date
    }

    if (userId) {
      whereClause.userId = parseInt(userId)
    }

    // Se for aluno, só pode ver seus próprios check-ins
    if (authUser.role === 'student') {
      whereClause.userId = authUser.id
    }

    const checkIns = await prisma.checkin.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            belt: true,
            degree: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const formattedCheckIns = checkIns.map(checkIn => ({
      id: checkIn.id,
      userId: checkIn.userId,
      date: checkIn.date,
      status: checkIn.status,
      approvedBy: checkIn.approvedBy,
      approvedAt: checkIn.approvedAt,
      createdAt: checkIn.createdAt,
      user: checkIn.user
    }))

    return NextResponse.json(formattedCheckIns)
  } catch (error) {
    console.error('Get checkins error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

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

    // Apenas alunos podem fazer check-in
    if (authUser.role !== 'student') {
      return NextResponse.json({ error: 'Apenas alunos podem fazer check-in' }, { status: 403 })
    }

    // Verificar se usuário está ativo
    if (!authUser.active) {
      return NextResponse.json({ 
        error: 'Usuário desativado. Procure seu professor para reativar.' 
      }, { status: 403 })
    }

    const today = new Date().toISOString().split('T')[0]

    // Verificar se já fez check-in hoje
    const existingCheckIn = await prisma.checkin.findFirst({
      where: {
        userId: authUser.id,
        date: today
      }
    })

    if (existingCheckIn) {
      return NextResponse.json({ 
        error: 'Você já fez check-in hoje' 
      }, { status: 400 })
    }

    // Verificar histórico de check-ins para calcular faltas consecutivas
    const userCheckIns = await prisma.checkin.findMany({
      where: { userId: authUser.id },
      select: {
        date: true,
        status: true,
        createdAt: true
      },
      orderBy: { date: 'desc' }
    })

    // Calcular faltas consecutivas antes do check-in de hoje
    const approvedCheckIns = userCheckIns.filter(c => c.status === 'approved')
    let consecutiveAbsences = 0
    
    if (approvedCheckIns.length > 0) {
      const lastCheckIn = new Date(approvedCheckIns[0].date)
      const today = new Date()
      const daysSinceLastCheckIn = Math.floor((today.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysSinceLastCheckIn > 3) {
        const weeksSinceLastCheckIn = daysSinceLastCheckIn / 7
        consecutiveAbsences = Math.floor(weeksSinceLastCheckIn * 2) // 2 treinos por semana
      }
    }

    // Criar check-in
    const newCheckIn = await prisma.checkin.create({
      data: {
        userId: authUser.id,
        date: today,
        status: 'pending'
      }
    })

    // Preparar resposta com alertas se necessário
    const response: any = {
      id: newCheckIn.id,
      userId: newCheckIn.userId,
      date: newCheckIn.date,
      status: newCheckIn.status,
      createdAt: newCheckIn.createdAt,
    }

    // Adicionar alertas baseados nas faltas consecutivas
    if (consecutiveAbsences >= 2) {
      response.warning = {
        type: consecutiveAbsences >= 3 ? 'critical' : 'warning',
        message: consecutiveAbsences >= 3 
          ? `Atenção! Você teve ${consecutiveAbsences} faltas consecutivas. Risco de desativação.`
          : `Você teve ${consecutiveAbsences} faltas consecutivas. Mantenha a frequência!`,
        consecutiveAbsences
      }
    } else if (consecutiveAbsences === 1) {
      response.info = {
        message: 'Que bom te ver de volta! Mantenha a frequência regular.',
        consecutiveAbsences
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Create checkin error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}