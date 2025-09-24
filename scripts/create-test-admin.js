const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestAdmin() {
  console.log('🔧 Criando usuário admin de teste...\n');

  try {
    // Verificar se já existe um admin
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'admin' }
    });

    if (existingAdmin) {
      console.log('✅ Usuário admin já existe:', existingAdmin.email);
      return;
    }

    // Criar hash da senha
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Criar usuário admin
    const admin = await prisma.user.create({
      data: {
        name: 'Administrador',
        email: 'admin@improvaveisbjj.com',
        password: hashedPassword,
        role: 'admin',
        active: true
      }
    });

    console.log('✅ Usuário admin criado com sucesso!');
    console.log('Email:', admin.email);
    console.log('Senha: admin123');
    console.log('ID:', admin.id);

  } catch (error) {
    console.error('❌ Erro ao criar admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
createTestAdmin();