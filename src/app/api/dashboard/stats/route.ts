import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'

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

    // Apenas professor e admin podem ver estatísticas
    if (authUser.role !== 'instructor' && authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Total de alunos
    const totalStudents = await prisma.user.count({
      where: { role: 'student' }
    })

    // Alunos ativos
    const activeStudents = await prisma.user.count({
      where: { 
        role: 'student',
        active: true
      }
    })

    // Check-ins do dia
    const today = new Date().toISOString().split('T')[0]
    const todayCheckIns = await prisma.checkin.count({
      where: {
        date: today,
        status: 'approved'
      }
    })

    // Check-ins pendentes
    const pendingCheckIns = await prisma.checkin.count({
      where: { status: 'pending' }
    })

    // Frequência mensal (% de alunos que fizeram pelo menos 1 check-in no mês)
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
    const studentsWithCheckIns = await prisma.checkin.groupBy({
      by: ['userId'],
      where: {
        date: {
          startsWith: currentMonth
        },
        status: 'approved'
      }
    }).then(result => result.length)
    const monthlyFrequency = activeStudents > 0 ? Math.round((studentsWithCheckIns / activeStudents) * 100) : 0

    return NextResponse.json({
      totalStudents,
      activeStudents,
      monthlyFrequency,
      todayCheckIns,
      pendingCheckIns,
    })
  } catch (error) {
    console.error('Get dashboard stats error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}