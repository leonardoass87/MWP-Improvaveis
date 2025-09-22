import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Token de autorização necessário' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    
    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return NextResponse.json(
        { message: 'Token inválido' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      id,
      name,
      email,
      phone,
      address,
      emergencyContact,
      emergencyPhone,
      belt,
      degree,
      birthDate,
      weight,
      height,
      medicalInfo,
      goals
    } = body

    // Verificar se o usuário está tentando atualizar seu próprio perfil ou se é admin/instructor
    if (decoded.id !== id && decoded.role !== 'admin' && decoded.role !== 'instructor') {
      return NextResponse.json(
        { message: 'Não autorizado a atualizar este perfil' },
        { status: 403 }
      )
    }

    // Validações básicas
    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { message: 'Nome deve ter pelo menos 2 caracteres' },
        { status: 400 }
      )
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { message: 'Email inválido' },
        { status: 400 }
      )
    }

    // Verificar se o email já está em uso por outro usuário
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, id]
    )

    if (existingUser.length > 0) {
      return NextResponse.json(
        { message: 'Este email já está em uso por outro usuário' },
        { status: 400 }
      )
    }

    // Buscar o usuário atual
    const currentUser = await db.query(
      'SELECT * FROM users WHERE id = ?',
      [id]
    )

    if (currentUser.length === 0) {
      return NextResponse.json(
        { message: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    const user = currentUser[0]

    // Verificar se o usuário pode alterar faixa e grau
    let finalBelt = user.belt
    let finalDegree = user.degree

    if (decoded.role === 'admin' || decoded.role === 'instructor') {
      // Admins e instrutores podem alterar faixa e grau
      finalBelt = belt || user.belt
      finalDegree = degree !== undefined ? degree : user.degree
    }

    // Atualizar o perfil
    await db.query(`
      UPDATE users SET 
        name = ?,
        email = ?,
        phone = ?,
        address = ?,
        emergency_contact = ?,
        emergency_phone = ?,
        belt = ?,
        degree = ?,
        birth_date = ?,
        weight = ?,
        height = ?,
        medical_info = ?,
        goals = ?,
        updated_at = NOW()
      WHERE id = ?
    `, [
      name,
      email,
      phone || null,
      address || null,
      emergencyContact || null,
      emergencyPhone || null,
      finalBelt,
      finalDegree,
      birthDate || null,
      weight || null,
      height || null,
      medicalInfo || null,
      goals || null,
      id
    ])

    // Buscar o usuário atualizado
    const updatedUser = await db.query(
      'SELECT id, name, email, role, belt, degree, phone, address, emergency_contact as emergencyContact, emergency_phone as emergencyPhone, birth_date as birthDate, weight, height, medical_info as medicalInfo, goals, active FROM users WHERE id = ?',
      [id]
    )

    if (updatedUser.length === 0) {
      return NextResponse.json(
        { message: 'Erro ao buscar usuário atualizado' },
        { status: 500 }
      )
    }

    const userResponse = updatedUser[0]

    return NextResponse.json(userResponse, { status: 200 })

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}