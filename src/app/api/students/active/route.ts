import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'

// Força renderização dinâmica
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const userId = parseInt(request.nextUrl.searchParams.get('userId') || '0')

    // Buscar todos os alunos com check-ins nos últimos 30 dias
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const activeStudents = await prisma.user.findMany({
      where: {
        role: 'student',
        checkins: {
          some: {
            createdAt: {
              gte: thirtyDaysAgo
            }
          }
        }
      },
      include: {
        checkins: {
          where: {
            createdAt: {
              gte: thirtyDaysAgo
            }
          }
        }
      }
    })

    // Definir hierarquia das faixas para ordenação
    const beltHierarchy: { [key: string]: number } = {
      'Branca': 1,
      'Azul': 2,
      'Roxa': 3,
      'Marrom': 4,
      'Preta': 5
    }

    // Calcular frequência para cada aluno
    const studentsWithFrequency = activeStudents.map(student => {
      const frequency = student.checkins.length
      const lastCheckIn = student.checkins.length > 0 
        ? student.checkins.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt
        : null

      return {
        id: student.id,
        name: student.name,
        email: student.email,
        avatar: student.avatar,
        beltLevel: student.belt,
        frequency,
        lastCheckIn: lastCheckIn ? lastCheckIn.toISOString() : 'Nunca'
      }
    })

    // Ordenar por frequência (maior primeiro) e depois por faixa (superior primeiro)
    const sortedStudents = studentsWithFrequency.sort((a, b) => {
      // Primeiro critério: frequência (maior primeiro)
      if (b.frequency !== a.frequency) {
        return b.frequency - a.frequency
      }
      
      // Segundo critério: faixa (superior primeiro)
      const aBeltLevel = beltHierarchy[a.beltLevel as keyof typeof beltHierarchy] || 0
      const bBeltLevel = beltHierarchy[b.beltLevel as keyof typeof beltHierarchy] || 0
      return bBeltLevel - aBeltLevel
    })

    // Calcular estatísticas gerais da academia
    const totalActiveStudents = activeStudents.length
    const allFrequencies = studentsWithFrequency.map(student => student.frequency)
    const averageFrequency = allFrequencies.length > 0 
      ? allFrequencies.reduce((sum, freq) => sum + freq, 0) / allFrequencies.length 
      : 0

    // Obter frequência do usuário atual
    const currentUserData = studentsWithFrequency.find(student => student.id === userId)
    const currentUserFrequency = currentUserData ? currentUserData.frequency : 0

    return NextResponse.json({
      students: sortedStudents,
      totalActiveStudents,
      averageFrequency: Math.round(averageFrequency * 100) / 100,
      currentUserFrequency
    })
  } catch (error) {
    console.error('Get active students error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}