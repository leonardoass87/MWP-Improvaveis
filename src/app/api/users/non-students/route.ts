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

    // Apenas admin e professor podem listar usuários não-alunos
    if (authUser.role !== 'admin' && authUser.role !== 'instructor') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Buscar usuários que não são alunos (role diferente de 'student')
    const nonStudentUsers = await prisma.user.findMany({
      where: {
        role: {
          not: 'student'
        },
        active: true
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
        updatedAt: true,
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(nonStudentUsers)

  } catch (error) {
    console.error('Erro ao buscar usuários não-alunos:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}