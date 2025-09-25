import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'

// Força renderização dinâmica para evitar Dynamic Server Error
export const dynamic = 'force-dynamic'

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

    // Apenas admin e professor podem promover usuários a alunos
    if (authUser.role !== 'admin' && authUser.role !== 'instructor') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { userId, belt = 'white', degree = 0 } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 })
    }

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Verificar se o usuário já é um aluno
    if (user.role === 'student') {
      return NextResponse.json({ error: 'Usuário já é um aluno' }, { status: 400 })
    }

    // Promover usuário a aluno
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        role: 'student',
        belt: belt,
        degree: degree,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        belt: true,
        degree: true,
        active: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      message: 'Usuário promovido a aluno com sucesso',
      user: updatedUser
    })

  } catch (error) {
    console.error('Erro ao promover usuário:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}