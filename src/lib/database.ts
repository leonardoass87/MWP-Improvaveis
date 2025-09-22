import { PrismaClient } from '@prisma/client'

// Singleton pattern para Prisma Client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Função para executar queries customizadas (compatibilidade com código existente)
export async function executeQuery(query: string, params: any[] = []) {
  try {
    // Para queries customizadas, use prisma.$queryRaw ou prisma.$executeRaw
    const results = await prisma.$queryRawUnsafe(query, ...params)
    return results
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}

// Função para obter conexão (compatibilidade)
export async function getConnection() {
  return prisma
}

export default prisma