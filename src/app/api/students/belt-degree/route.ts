import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { Belt } from '@prisma/client'

// Força renderização dinâmica para evitar Dynamic Server Error
export const dynamic = 'force-dynamic'

// Função para mapear cores de faixa
function mapBeltColor(belt: string): Belt {
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
  return beltMap[belt.toLowerCase()] || 'branca'
}

export async function PUT(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 })
    }

    const authUser = verifyToken(token)
    if (!authUser) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Apenas admin e professor podem editar faixa e grau
    if (authUser.role !== 'admin' && authUser.role !== 'instructor') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { studentId, belt, degree } = await request.json()

    if (!studentId) {
      return NextResponse.json({ error: 'ID do aluno é obrigatório' }, { status: 400 })
    }

    if (!belt && degree === undefined) {
      return NextResponse.json({ error: 'Faixa ou grau deve ser fornecido' }, { status: 400 })
    }

    // Verificar se o usuário existe e é um aluno
    const student = await prisma.user.findUnique({
      where: { id: parseInt(studentId) }
    })

    if (!student) {
      return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 })
    }

    if (student.role !== 'student') {
      return NextResponse.json({ error: 'Usuário não é um aluno' }, { status: 400 })
    }

    // Preparar dados para atualização
    const updateData: any = {
      updatedAt: new Date()
    }

    if (belt) {
      updateData.belt = mapBeltColor(belt)
    }

    if (degree !== undefined) {
      updateData.degree = parseInt(degree)
    }

    // Atualizar faixa e grau do aluno
    const updatedStudent = await prisma.user.update({
      where: { id: parseInt(studentId) },
      data: updateData,
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
      message: 'Faixa e grau atualizados com sucesso',
      student: updatedStudent
    })

  } catch (error) {
    console.error('Erro ao atualizar faixa e grau:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}