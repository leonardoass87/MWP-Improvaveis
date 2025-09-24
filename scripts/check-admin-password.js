const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkAdminPassword() {
  console.log('🔍 Verificando senha do admin...\n');

  try {
    // Buscar o admin
    const admin = await prisma.user.findFirst({
      where: { role: 'admin' }
    });

    if (!admin) {
      console.log('❌ Nenhum usuário admin encontrado');
      return;
    }

    console.log('✅ Admin encontrado:', admin.email);
    console.log('Senha atual (hash):', admin.password);

    // Verificar se a senha está com hash
    const isHashed = admin.password.startsWith('$2a$') || admin.password.startsWith('$2b$');
    console.log('Senha está com hash:', isHashed);

    if (isHashed) {
      // Testar se a senha 'admin123' funciona
      const isValid = await bcrypt.compare('admin123', admin.password);
      console.log('Senha "admin123" é válida:', isValid);

      if (!isValid) {
        console.log('\n🔧 Atualizando senha para "admin123"...');
        const newHash = await bcrypt.hash('admin123', 10);
        
        await prisma.user.update({
          where: { id: admin.id },
          data: { password: newHash }
        });
        
        console.log('✅ Senha atualizada com sucesso!');
      }
    } else {
      // Senha não está com hash, vamos criar o hash
      console.log('\n🔧 Criando hash para a senha...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await prisma.user.update({
        where: { id: admin.id },
        data: { password: hashedPassword }
      });
      
      console.log('✅ Hash da senha criado com sucesso!');
    }

    // Verificar novamente
    const updatedAdmin = await prisma.user.findFirst({
      where: { role: 'admin' }
    });

    const finalCheck = await bcrypt.compare('admin123', updatedAdmin.password);
    console.log('\n✅ Verificação final - Senha "admin123" funciona:', finalCheck);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
checkAdminPassword();