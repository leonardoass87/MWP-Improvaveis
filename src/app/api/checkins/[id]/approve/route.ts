import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 })
    }

    const authUser = verifyToken(token)
    if (!authUser) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Apenas professor e admin podem aprovar check-ins
    if (authUser.role !== 'instructor' && authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const checkInId = parseInt(params.id)
    const { status } = await request.json()

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ 
        error: 'Status deve ser "approved" ou "rejected"' 
      }, { status: 400 })
    }

    // Verificar se check-in existe e está pendente
    const checkIn = await executeQuery(
      'SELECT * FROM checkins WHERE id = ? AND status = "pending"',
      [checkInId]
    ) as any[]

    if (checkIn.length === 0) {
      return NextResponse.json({ 
        error: 'Check-in não encontrado ou já foi processado' 
      }, { status: 404 })
    }

    // Atualizar status do check-in
    await executeQuery(
      'UPDATE checkins SET status = ?, approved_by = ?, approved_at = NOW() WHERE id = ?',
      [status, authUser.id, checkInId]
    )

    // Retornar check-in atualizado
    const updatedCheckIn = await executeQuery(
      `SELECT c.*, u.name as user_name, u.belt_level as belt, u.degree 
       FROM checkins c 
       JOIN users u ON c.user_id = u.id 
       WHERE c.id = ?`,
      [checkInId]
    ) as any[]

    const result = updatedCheckIn[0]
    return NextResponse.json({
      id: result.id,
      userId: result.user_id,
      date: result.date,
      status: result.status,
      approvedBy: result.approved_by,
      approvedAt: result.approved_at,
      createdAt: result.created_at,
      user: {
        id: result.user_id,
        name: result.user_name,
        belt: result.belt,
        degree: result.degree,
      }
    })
  } catch (error) {
    console.error('Approve checkin error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}