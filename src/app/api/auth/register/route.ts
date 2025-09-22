import { NextRequest, NextResponse } from 'next/server'
import { User } from '@/types'
import { addUser, emailExists, getNextUserId } from '@/lib/users'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    // Validações básicas
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nome, email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Verificar se email já existe
    if (emailExists(email)) {
      return NextResponse.json(
        { error: 'Este email já está cadastrado' },
        { status: 409 }
      )
    }

    // Criar novo usuário
    const newUser: User = {
      id: getNextUserId(),
      name,
      email,
      password, // Em produção seria hash
      role: 'student', // Novos usuários são sempre estudantes
      belt: 'branca', // Faixa branca por padrão
      degree: 0,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Adicionar à lista de usuários
    addUser(newUser)

    console.log('Novo usuário cadastrado:', {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    })

    // Retornar sucesso (sem dados sensíveis)
    return NextResponse.json({
      message: 'Usuário cadastrado com sucesso',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        belt: newUser.belt,
        degree: newUser.degree
      }
    })

  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}