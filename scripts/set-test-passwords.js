const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setTestPasswords() {
  try {
    // Senha padrão para teste
    const defaultPassword = '123456';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Atualizar senhas de todos os usuários
    const result = await prisma.user.updateMany({
      data: {
        password: hashedPassword
      }
    });

    console.log(`Senhas atualizadas para ${result.count} usuários`);
    console.log(`Senha padrão para todos os usuários: ${defaultPassword}`);

    // Listar usuários atualizados
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      },
      orderBy: {
        id: 'asc'
      }
    });

    console.log('\nCredenciais para teste de login:');
    console.log('================================');
    users.forEach(user => {
      console.log(`Email: ${user.email}`);
      console.log(`Senha: ${defaultPassword}`);
      console.log(`Role: ${user.role}`);
      console.log('--------------------------------');
    });

  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

setTestPasswords();