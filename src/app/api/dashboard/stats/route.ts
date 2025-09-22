import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database'
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
    const totalStudentsResult = await executeQuery(
      'SELECT COUNT(*) as count FROM users WHERE role = "student"'
    ) as any[]
    const totalStudents = totalStudentsResult[0].count

    // Alunos ativos (verificar se coluna active existe)
    let activeStudents = totalStudents; // fallback
    try {
      const activeStudentsResult = await executeQuery(
        'SELECT COUNT(*) as count FROM users WHERE role = "student" AND active = true'
      ) as any[]
      activeStudents = activeStudentsResult[0].count
    } catch (error) {
      // Se a coluna active não existir, usar total de alunos
      console.log('Coluna active não encontrada, usando total de alunos')
    }

    // Check-ins do dia
    const today = new Date().toISOString().split('T')[0]
    const todayCheckInsResult = await executeQuery(
      'SELECT COUNT(*) as count FROM checkins WHERE date = ? AND status = "approved"',
      [today]
    ) as any[]
    const todayCheckIns = todayCheckInsResult[0].count

    // Check-ins pendentes
    const pendingCheckInsResult = await executeQuery(
      'SELECT COUNT(*) as count FROM checkins WHERE status = "pending"'
    ) as any[]
    const pendingCheckIns = pendingCheckInsResult[0].count

    // Frequência mensal (% de alunos que fizeram pelo menos 1 check-in no mês)
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
    const monthlyFrequencyResult = await executeQuery(
      `SELECT COUNT(DISTINCT user_id) as count 
       FROM checkins 
       WHERE DATE_FORMAT(date, '%Y-%m') = ? AND status = "approved"`,
      [currentMonth]
    ) as any[]
    const studentsWithCheckIns = monthlyFrequencyResult[0].count
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