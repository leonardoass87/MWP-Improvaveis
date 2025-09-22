import { User } from '@/types'
import fs from 'fs'
import path from 'path'

// Caminho para o arquivo de dados temporário
const DATA_FILE = path.join(process.cwd(), 'temp-users.json')

// DADOS TEMPORÁRIOS PARA TESTE (SEM BANCO DE DADOS)
const mockUsers: User[] = [
  {
    id: 1,
    name: 'Administrador',
    email: 'admin@bjj.com',
    password: 'password', // Em produção seria hash
    role: 'admin',
    belt: 'black',
    degree: 1,
    active: true,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 2,
    name: 'Professor Silva',
    email: 'professor@bjj.com',
    password: 'password',
    role: 'professor',
    belt: 'brown',
    degree: 0,
    active: true,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 3,
    name: 'João Aluno',
    email: 'aluno@bjj.com',
    password: 'password',
    role: 'student',
    belt: 'blue',
    degree: 2,
    active: true,
    created_at: new Date(),
    updated_at: new Date()
  }
]

// Função para carregar usuários do arquivo
function loadRegisteredUsers(): User[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Erro ao carregar usuários:', error)
  }
  return []
}

// Função para salvar usuários no arquivo
function saveRegisteredUsers(users: User[]): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2))
  } catch (error) {
    console.error('Erro ao salvar usuários:', error)
  }
}

// Lista de usuários registrados dinamicamente (carregada do arquivo)
let registeredUsers: User[] = loadRegisteredUsers()

// Função para obter todos os usuários (mockados + registrados)
export function getAllUsers(): User[] {
  return [...mockUsers, ...registeredUsers]
}

// Função para adicionar novo usuário
export function addUser(user: User): void {
  registeredUsers.push(user)
  saveRegisteredUsers(registeredUsers) // Salvar no arquivo
  console.log('Usuário adicionado ao sistema:', {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  })
}

// Função para buscar usuário por email
export function findUserByEmail(email: string): User | undefined {
  return getAllUsers().find(user => user.email === email)
}

// Função para verificar se email já existe
export function emailExists(email: string): boolean {
  return getAllUsers().some(user => user.email === email)
}

// Função para obter próximo ID
export function getNextUserId(): number {
  const allUsers = getAllUsers()
  const existingIds = allUsers.map(u => u.id)
  return existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1
}

// Função para listar usuários registrados (para debug)
export function getRegisteredUsers(): User[] {
  return registeredUsers
}

// Função para obter estatísticas
export function getUserStats() {
  const allUsers = getAllUsers()
  return {
    total: allUsers.length,
    mockUsers: mockUsers.length,
    registeredUsers: registeredUsers.length,
    byRole: {
      admin: allUsers.filter(u => u.role === 'admin').length,
      instructor: allUsers.filter(u => u.role === 'instructor').length,
      student: allUsers.filter(u => u.role === 'student').length
    }
  }
}