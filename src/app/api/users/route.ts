import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { hashPassword, getTokenFromRequest, verifyToken } from '@/lib/auth'
import { CreateUserData } from '@/types'
import { Belt } from '@prisma/client'

// Função para mapear BeltColor para o enum Belt do Prisma
function mapBeltColor(belt?: string): Belt | null {
  if (!belt) return null
  
  const beltMap: { [key: string]: Belt } = {
    'white': Belt.branca,
    'blue': Belt.azul,
    'purple': Belt.roxa,
    'brown': Belt.marrom,
    'black': Belt.preta,
    'branca': Belt.branca,
    'azul': Belt.azul,
    'roxa': Belt.roxa,
    'marrom': Belt.marrom,
    'preta': Belt.preta
  }
  
  return beltMap[belt] || null
}

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

    // Apenas admin e professor podem listar usuários
    if (authUser.role !== 'admin' && authUser.role !== 'instructor') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
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

    return NextResponse.json(users)
  } catch (error) {
    console.error('Get users error:', error)
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
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const userData: CreateUserData = await request.json()
    const { name, email, password, role, belt, degree } = userData

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Nome, email, senha e role são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email já está em uso' },
        { status: 400 }
      )
    }

    // Hash da senha
    const hashedPassword = await hashPassword(password)

    // Inserir usuário
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        belt: mapBeltColor(belt),
        degree: degree || 0,
        active: true
      }
    })

    return NextResponse.json({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      belt: newUser.belt,
      degree: newUser.degree,
      active: newUser.active,
    })
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}