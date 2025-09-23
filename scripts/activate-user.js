require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function activateUser() {
  try {
    console.log('Conectando ao banco de dados...')

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: {
        email: 'teste@teste.com'
      }
    })

    if (!user) {
      console.log('❌ Usuário teste@teste.com não encontrado!')
      return
    }

    console.log('\n📋 Status atual do usuário:')
    console.log('================================')
    console.log(`ID: ${user.id}`)
    console.log(`Nome: ${user.name}`)
    console.log(`Email: ${user.email}`)
    console.log(`Role: ${user.role}`)
    console.log(`Ativo: ${user.active ? '✅ Sim' : '❌ Não'}`)
    console.log('================================')

    if (!user.active) {
      console.log('\n🔄 Ativando usuário...')
      
      const updatedUser = await prisma.user.update({
        where: {
          email: 'teste@teste.com'
        },
        data: {
          active: true
        }
      })

      console.log('✅ Usuário ativado com sucesso!')
      console.log(`Status: ${updatedUser.active ? 'Ativo' : 'Inativo'}`)
    } else {
      console.log('✅ Usuário já está ativo!')
    }

  } catch (error) {
    console.error('❌ Erro:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

activateUser()