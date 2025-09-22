import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
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
    const checkIn = await prisma.checkin.findFirst({
      where: {
        id: checkInId,
        status: 'pending'
      }
    })

    if (!checkIn) {
      return NextResponse.json({ 
        error: 'Check-in não encontrado ou já foi processado' 
      }, { status: 404 })
    }

    // Atualizar status do check-in
    await prisma.checkin.update({
      where: { id: checkInId },
      data: {
        status,
        approvedBy: authUser.id,
        approvedAt: new Date()
      }
    })

    // Retornar check-in atualizado
    const updatedCheckIn = await prisma.checkin.findUnique({
      where: { id: checkInId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            belt: true,
            degree: true,
          }
        }
      }
    })

    return NextResponse.json({
      id: updatedCheckIn!.id,
      userId: updatedCheckIn!.userId,
      date: updatedCheckIn!.date,
      status: updatedCheckIn!.status,
      approvedBy: updatedCheckIn!.approvedBy,
      approvedAt: updatedCheckIn!.approvedAt,
      createdAt: updatedCheckIn!.createdAt,
      user: updatedCheckIn!.user
    })
  } catch (error) {
    console.error('Approve checkin error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}