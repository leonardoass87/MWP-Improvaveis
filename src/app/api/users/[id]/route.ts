import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { UpdateUserData } from '@/types'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 })
    }

    const authUser = verifyToken(token)
    if (!authUser) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const userId = parseInt(params.id)
    const updateData: UpdateUserData = await request.json()

    // Admin pode editar qualquer usuário, professor pode editar apenas alunos
    if (authUser.role === 'admin') {
      // Admin pode editar tudo
    } else if (authUser.role === 'instructor') {
      // Professor só pode editar faixa e grau de alunos
      const userToUpdate = await executeQuery(
        'SELECT role FROM users WHERE id = ?',
        [userId]
      ) as any[]

      if (userToUpdate.length === 0) {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
      }

      if (userToUpdate[0].role !== 'student') {
        return NextResponse.json({ error: 'Professor só pode editar alunos' }, { status: 403 })
      }

      // Limitar campos que professor pode editar
      const allowedFields = ['belt', 'degree', 'active']
      Object.keys(updateData).forEach(key => {
        if (!allowedFields.includes(key)) {
          delete (updateData as any)[key]
        }
      })
    } else {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Construir query de update dinamicamente
    const updateFields = Object.keys(updateData).filter(key => updateData[key as keyof UpdateUserData] !== undefined)
    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
    }

    // Construir cláusula SET
    const setClause = updateFields.map(field => {
      return `${field} = ?`
    }).join(', ')
    const values = updateFields.map(field => updateData[field as keyof UpdateUserData])
    values.push(userId)

    await executeQuery(
      `UPDATE users SET ${setClause} WHERE id = ?`,
      values
    )

    // Retornar usuário atualizado
    const updatedUser = await executeQuery(
      'SELECT id, name, email, role, belt, degree, active, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    ) as any[]

    if (updatedUser.length === 0) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    return NextResponse.json(updatedUser[0])
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 })
    }

    const authUser = verifyToken(token)
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const userId = parseInt(params.id)

    // Verificar se usuário existe
    const user = await executeQuery(
      'SELECT id FROM users WHERE id = ?',
      [userId]
    ) as any[]

    if (user.length === 0) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Deletar usuário (cascade irá deletar check-ins relacionados)
    await executeQuery('DELETE FROM users WHERE id = ?', [userId])

    return NextResponse.json({ message: 'Usuário deletado com sucesso' })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}