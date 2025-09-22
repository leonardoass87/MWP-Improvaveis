import { NextRequest, NextResponse } from 'next/server'
import { generateToken } from '@/lib/auth'
import { findUserByEmail, getUserStats } from '@/lib/users'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar usuário por email (inclui mockados + registrados)
    const user = findUserByEmail(email)
    
    // Log das estatísticas para debug
    console.log('Estatísticas de usuários:', getUserStats())

    if (!user) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      )
    }

    // Verificar se o usuário está ativo
    if (!user.active) {
      return NextResponse.json(
        { error: 'Usuário desativado. Procure seu professor para reativar.' },
        { status: 401 }
      )
    }

    // VERIFICAÇÃO TEMPORÁRIA DE SENHA (SEM HASH)
    if (password !== user.password) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      )
    }

    // Gerar token
    const authUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      belt: user.belt,
      degree: user.degree,
      active: user.active,
    }

    const token = generateToken(authUser)

    return NextResponse.json({
      user: authUser,
      token,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}