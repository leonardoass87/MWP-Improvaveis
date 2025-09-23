import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json(
        { message: 'Token de autorização necessário' },
        { status: 401 }
      )
    }

    const authUser = verifyToken(token)
    if (!authUser) {
      return NextResponse.json(
        { message: 'Token inválido' },
        { status: 401 }
      )
    }

    // Buscar dados completos do usuário
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        belt: true,
        degree: true,
        phone: true,
        address: true,
        emergencyContact: true,
        emergencyPhone: true,
        birthDate: true,
        weight: true,
        height: true,
        medicalInfo: true,
        goals: true,
        avatar: true,
        active: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(user, { status: 200 })

  } catch (error) {
    console.error('Erro ao buscar perfil:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}