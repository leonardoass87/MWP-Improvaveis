import { NextRequest, NextResponse } from 'next/server'
import { generateToken } from '@/lib/auth'
import { executeQuery } from '@/lib/database'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar usuário por email no banco de dados
    const users = await executeQuery(
      'SELECT id, name, email, password, role, belt, degree, active, phone, address, emergency_contact, emergency_phone, birth_date, weight, height, medical_info, goals FROM users WHERE email = ?',
      [email]
    ) as any[]

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      )
    }

    const user = users[0]

    // Verificar se o usuário está ativo
    if (!user.active) {
      return NextResponse.json(
        { error: 'Usuário desativado. Procure seu professor para reativar.' },
        { status: 401 }
      )
    }

    // Verificar senha (com hash ou sem hash para compatibilidade)
    let passwordValid = false
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      // Senha com hash
      passwordValid = await bcrypt.compare(password, user.password)
    } else {
      // Senha sem hash (para dados de teste)
      passwordValid = password === user.password
    }

    if (!passwordValid) {
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
      phone: user.phone,
      address: user.address,
      emergencyContact: user.emergency_contact,
      emergencyPhone: user.emergency_phone,
      birthDate: user.birth_date,
      weight: user.weight,
      height: user.height,
      medicalInfo: user.medical_info,
      goals: user.goals,
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