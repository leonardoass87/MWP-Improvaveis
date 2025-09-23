const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Hash da senha "admin123"
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Criar usuário admin
    const admin = await prisma.user.upsert({
      where: { email: 'admin@improvaveisbjj.com' },
      update: {},
      create: {
        name: 'Administrador',
        email: 'admin@improvaveisbjj.com',
        password: hashedPassword,
        role: 'admin',
        belt: 'preta',
        degree: 5,
        active: true
      }
    });
    
    console.log('✅ Usuário admin criado:', admin.email);
    
    // Criar usuário instrutor
    const instructor = await prisma.user.upsert({
      where: { email: 'professor@improvaveisbjj.com' },
      update: {},
      create: {
        name: 'Professor Silva',
        email: 'professor@improvaveisbjj.com',
        password: hashedPassword,
        role: 'instructor',
        belt: 'preta',
        degree: 3,
        active: true
      }
    });
    
    console.log('✅ Usuário instrutor criado:', instructor.email);
    
    // Criar usuário aluno
    const student = await prisma.user.upsert({
      where: { email: 'aluno@improvaveisbjj.com' },
      update: {},
      create: {
        name: 'João Silva',
        email: 'aluno@improvaveisbjj.com',
        password: hashedPassword,
        role: 'student',
        belt: 'azul',
        degree: 1,
        active: true
      }
    });
    
    console.log('✅ Usuário aluno criado:', student.email);
    
    console.log('\n🎉 Usuários de teste criados com sucesso!');
    console.log('📧 Email: admin@improvaveisbjj.com | Senha: admin123');
    console.log('📧 Email: professor@improvaveisbjj.com | Senha: admin123');
    console.log('📧 Email: aluno@improvaveisbjj.com | Senha: admin123');
    
  } catch (error) {
    console.error('❌ Erro ao criar usuários:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();