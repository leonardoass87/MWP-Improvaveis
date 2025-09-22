import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database'
import { hashPassword, getTokenFromRequest, verifyToken } from '@/lib/auth'
import { User, CreateUserData } from '@/types'

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

    const users = await executeQuery(
      'SELECT id, name, email, role, belt_level as belt, degree, active, created_at, updated_at FROM users ORDER BY name'
    ) as User[]

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
    const existingUsers = await executeQuery(
      'SELECT id FROM users WHERE email = ?',
      [email]
    ) as User[]

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'Email já está em uso' },
        { status: 400 }
      )
    }

    // Hash da senha
    const hashedPassword = await hashPassword(password)

    // Inserir usuário
    const result = await executeQuery(
      'INSERT INTO users (name, email, password, role, belt_level, degree) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, role, belt || null, degree || 0]
    ) as any

    return NextResponse.json({
      id: result.insertId,
      name,
      email,
      role,
      belt,
      degree,
      active: true,
    })
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}