import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'

// Força renderização dinâmica para evitar Dynamic Server Error
export const dynamic = 'force-dynamic'

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
    if (!authUser) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Apenas admins podem deletar qualquer post
    // Professores podem deletar apenas seus próprios posts
    const postId = parseInt(params.id)

    // Verificar se o post existe
    const post = await executeQuery(
      'SELECT id, author_id FROM posts WHERE id = ?',
      [postId]
    ) as any[]

    if (post.length === 0) {
      return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 })
    }

    // Verificar permissões
    if (authUser.role !== 'admin' && post[0].author_id !== authUser.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Deletar post
    await executeQuery('DELETE FROM posts WHERE id = ?', [postId])

    return NextResponse.json({ message: 'Post deletado com sucesso' })
  } catch (error) {
    console.error('Delete post error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

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

    const postId = parseInt(params.id)
    const { title, content, published } = await request.json()

    // Verificar se o post existe
    const post = await executeQuery(
      'SELECT id, author_id FROM posts WHERE id = ?',
      [postId]
    ) as any[]

    if (post.length === 0) {
      return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 })
    }

    // Verificar permissões (apenas o autor ou admin pode editar)
    if (authUser.role !== 'admin' && post[0].author_id !== authUser.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Atualizar post
    await executeQuery(
      'UPDATE posts SET title = ?, content = ?, published = ? WHERE id = ?',
      [title, content, published, postId]
    )

    // Buscar o post atualizado com informações do autor
    const updatedPost = await executeQuery(`
      SELECT 
        p.id,
        p.title,
        p.content,
        p.published,
        p.created_at,
        p.updated_at,
        u.name as author_name,
        u.email as author_email,
        u.role as author_role
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.id = ?
    `, [postId]) as any[]

    return NextResponse.json(updatedPost[0])
  } catch (error) {
    console.error('Update post error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}