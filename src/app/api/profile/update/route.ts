import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { Belt } from '@prisma/client'

// Força renderização dinâmica para evitar Dynamic Server Error
export const dynamic = 'force-dynamic'

// Função para mapear cores de faixa
function mapBeltColor(belt: string): Belt | null {
  const beltMap: { [key: string]: Belt } = {
    'white': 'branca',
    'branca': 'branca',
    'blue': 'azul', 
    'azul': 'azul',
    'purple': 'roxa',
    'roxa': 'roxa',
    'brown': 'marrom',
    'marrom': 'marrom',
    'black': 'preta',
    'preta': 'preta'
  }
  return beltMap[belt] || null
}

export async function PUT(request: NextRequest) {
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
      goals,
      avatar
    } = body

    // Verificar se o usuário está tentando atualizar seu próprio perfil ou se é admin/instructor
    if (authUser.id !== id && authUser.role !== 'admin' && authUser.role !== 'instructor') {
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
    const existingUser = await prisma.user.findFirst({
      where: {
        email: email,
        id: { not: id }
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'Este email já está em uso por outro usuário' },
        { status: 400 }
      )
    }

    // Buscar o usuário atual
    const currentUser = await prisma.user.findUnique({
      where: { id: id }
    })

    if (!currentUser) {
      return NextResponse.json(
        { message: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o usuário pode alterar faixa e grau
    let finalBelt = currentUser.belt
    let finalDegree = currentUser.degree

    console.log('Debug - Belt update:', {
      authUserId: authUser.id,
      targetUserId: id,
      authUserRole: authUser.role,
      receivedBelt: belt,
      receivedDegree: degree,
      currentBelt: currentUser.belt,
      currentDegree: currentUser.degree
    })

    // Permitir que todos os usuários alterem sua própria faixa e grau
    // Admins e instrutores também podem alterar de outros usuários
    if (authUser.id === id || authUser.role === 'admin' || authUser.role === 'instructor') {
      finalBelt = belt ? mapBeltColor(belt) : currentUser.belt
      finalDegree = degree !== undefined ? degree : currentUser.degree
      
      console.log('Debug - Belt mapping result:', {
        mappedBelt: mapBeltColor(belt),
        finalBelt,
        finalDegree
      })
    }

    // Preparar dados para atualização
    const updateData: any = {
      name,
      email,
      belt: finalBelt,
      degree: finalDegree,
      updatedAt: new Date()
    }

    // Adicionar campos opcionais apenas se foram fornecidos
    if (phone !== undefined) updateData.phone = phone || null
    if (address !== undefined) updateData.address = address || null
    if (emergencyContact !== undefined) updateData.emergencyContact = emergencyContact || null
    if (emergencyPhone !== undefined) updateData.emergencyPhone = emergencyPhone || null
    if (birthDate !== undefined) updateData.birthDate = birthDate || null
    if (weight !== undefined) updateData.weight = weight || null
    if (height !== undefined) updateData.height = height || null
    if (medicalInfo !== undefined) updateData.medicalInfo = medicalInfo || null
    if (goals !== undefined) updateData.goals = goals || null
    if (avatar !== undefined) updateData.avatar = avatar || null

    // Atualizar o perfil
    const updatedUser = await prisma.user.update({
      where: { id: id },
      data: updateData,
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
        active: true
      }
    })

    return NextResponse.json(updatedUser, { status: 200 })

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}