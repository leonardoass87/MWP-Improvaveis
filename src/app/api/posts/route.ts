import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'

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

    // Buscar todos os posts com informações do autor
    const posts = await executeQuery(`
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
      ORDER BY p.created_at DESC
    `) as any[]

    return NextResponse.json(posts)
  } catch (error) {
    console.error('Get posts error:', error)
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
    if (!authUser) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Apenas professores e admins podem criar posts
    if (authUser.role !== 'instructor' && authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { title, content, published = true } = await request.json()

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Título e conteúdo são obrigatórios' },
        { status: 400 }
      )
    }

    // Criar post
    const result = await executeQuery(
      'INSERT INTO posts (title, content, author_id, published) VALUES (?, ?, ?, ?)',
      [title, content, authUser.id, published]
    ) as any

    // Buscar o post criado com informações do autor
    const newPost = await executeQuery(`
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
    `, [result.insertId]) as any[]

    return NextResponse.json(newPost[0])
  } catch (error) {
    console.error('Create post error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}