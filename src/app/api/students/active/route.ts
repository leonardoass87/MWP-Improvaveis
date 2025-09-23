import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'

// Força renderização dinâmica
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

    // Buscar todos os alunos ativos
    const students = await prisma.user.findMany({
      where: {
        role: 'student',
        active: true
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        belt: true,
        degree: true,
        createdAt: true,
        checkins: {
          select: {
            id: true,
            date: true,
            status: true,
            createdAt: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    // Calcular estatísticas para cada aluno
    const now = new Date()
    const currentMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0')
    const currentWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const studentsWithStats = students.map(student => {
      const allCheckIns = student.checkins
      const approvedCheckIns = allCheckIns.filter(c => c.status === 'approved')
      const monthlyCheckIns = approvedCheckIns.filter(c => c.date.startsWith(currentMonth))
      const weeklyCheckIns = approvedCheckIns.filter(c => new Date(c.date) >= currentWeek)
      
      // Calcular frequência baseada nos últimos 30 dias
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const recentCheckIns = approvedCheckIns.filter(c => new Date(c.date) >= thirtyDaysAgo)
      
      // Academia tem 2 treinos por semana como ideal (8 treinos em 30 dias)
      const idealCheckIns = 8
      const frequency = Math.min(100, Math.round((recentCheckIns.length / idealCheckIns) * 100))
      
      // Último check-in
      const lastCheckIn = approvedCheckIns.length > 0 
        ? approvedCheckIns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
        : null

      // Mapear faixa para exibição
      const beltDisplay = student.belt === 'branca' ? 'Branca' :
                         student.belt === 'azul' ? 'Azul' :
                         student.belt === 'roxa' ? 'Roxa' :
                         student.belt === 'marrom' ? 'Marrom' :
                         student.belt === 'preta' ? 'Preta' : 'Branca'

      return {
        id: student.id,
        name: student.name,
        avatar: student.avatar,
        totalCheckIns: approvedCheckIns.length,
        weeklyCheckIns: weeklyCheckIns.length,
        monthlyCheckIns: monthlyCheckIns.length,
        frequency: frequency,
        lastCheckIn: lastCheckIn || 'Nunca',
        belt: beltDisplay,
        beltLevel: student.belt,
        joinDate: student.createdAt.toISOString().split('T')[0]
      }
    })

    // Filtrar apenas alunos que tiveram atividade recente (últimos 30 dias)
    const activeStudents = studentsWithStats.filter(student => 
      student.lastCheckIn !== 'Nunca' && 
      new Date(student.lastCheckIn) >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    )

    // Calcular estatísticas gerais
    const totalActiveStudents = activeStudents.length
    const averageFrequency = totalActiveStudents > 0 
      ? Math.round(activeStudents.reduce((acc, s) => acc + s.frequency, 0) / totalActiveStudents)
      : 0

    // Buscar frequência do usuário atual se for aluno
    let currentUserFrequency = 0
    if (authUser.role === 'student') {
      const currentUserStats = studentsWithStats.find(s => s.id === authUser.id)
      currentUserFrequency = currentUserStats?.frequency || 0
    }

    return NextResponse.json({
      students: activeStudents,
      stats: {
        totalActiveStudents,
        averageFrequency,
        currentUserFrequency
      }
    })
  } catch (error) {
    console.error('Get active students error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}