import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { CheckInWithUser } from '@/types'

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

    let query = `
      SELECT c.*, u.name as user_name, u.belt_level as belt, u.degree 
      FROM checkins c 
      JOIN users u ON c.user_id = u.id 
      WHERE 1=1
    `
    const params: any[] = []

    if (status) {
      query += ' AND c.status = ?'
      params.push(status)
    }

    if (date) {
      query += ' AND c.date = ?'
      params.push(date)
    }

    if (userId) {
      query += ' AND c.user_id = ?'
      params.push(userId)
    }

    // Se for aluno, só pode ver seus próprios check-ins
    if (authUser.role === 'student') {
      query += ' AND c.user_id = ?'
      params.push(authUser.id)
    }

    query += ' ORDER BY c.created_at DESC'

    const checkIns = await executeQuery(query, params) as any[]

    const formattedCheckIns = checkIns.map(checkIn => ({
      id: checkIn.id,
      userId: checkIn.user_id,
      date: checkIn.date,
      status: checkIn.status,
      approvedBy: checkIn.approved_by,
      approvedAt: checkIn.approved_at,
      createdAt: checkIn.created_at,
      user: {
        id: checkIn.user_id,
        name: checkIn.user_name,
        belt: checkIn.belt,
        degree: checkIn.degree,
      }
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
    const existingCheckIn = await executeQuery(
      'SELECT id FROM checkins WHERE user_id = ? AND date = ?',
      [authUser.id, today]
    ) as any[]

    if (existingCheckIn.length > 0) {
      return NextResponse.json({ 
        error: 'Você já fez check-in hoje' 
      }, { status: 400 })
    }

    // Criar check-in
    const result = await executeQuery(
      'INSERT INTO checkins (user_id, date) VALUES (?, ?)',
      [authUser.id, today]
    ) as any

    return NextResponse.json({
      id: result.insertId,
      userId: authUser.id,
      date: today,
      status: 'pending',
      createdAt: new Date(),
    })
  } catch (error) {
    console.error('Create checkin error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}