const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCheckInExpiration() {
  console.log('🧪 Testando sistema de expiração de check-ins...\n');

  try {
    // 1. Criar um check-in antigo (mais de 72 horas)
    const oldDate = new Date();
    oldDate.setHours(oldDate.getHours() - 80); // 80 horas atrás

    console.log('1. Criando check-in antigo para teste...');
    const oldCheckIn = await prisma.checkin.create({
      data: {
        userId: 1, // Assumindo que existe um usuário com ID 1
        date: oldDate.toISOString().split('T')[0],
        status: 'pending',
        createdAt: oldDate,
        updatedAt: oldDate
      }
    });
    console.log(`✅ Check-in antigo criado: ID ${oldCheckIn.id}, Data: ${oldCheckIn.createdAt}`);

    // 2. Criar um check-in recente (menos de 72 horas)
    const recentDate = new Date();
    recentDate.setHours(recentDate.getHours() - 24); // 24 horas atrás

    console.log('\n2. Criando check-in recente para teste...');
    const recentCheckIn = await prisma.checkin.create({
      data: {
        userId: 1,
        date: recentDate.toISOString().split('T')[0],
        status: 'pending',
        createdAt: recentDate,
        updatedAt: recentDate
      }
    });
    console.log(`✅ Check-in recente criado: ID ${recentCheckIn.id}, Data: ${recentCheckIn.createdAt}`);

    // 3. Testar a lógica de expiração
    console.log('\n3. Testando lógica de expiração...');
    
    const now = new Date();
    const expirationTime = 72 * 60 * 60 * 1000; // 72 horas em milissegundos

    // Verificar check-in antigo
    const oldTimeDiff = now - new Date(oldCheckIn.createdAt);
    const oldExpired = oldTimeDiff > expirationTime;
    console.log(`Check-in antigo (ID ${oldCheckIn.id}): ${oldExpired ? '❌ EXPIRADO' : '✅ VÁLIDO'} (${Math.round(oldTimeDiff / (60 * 60 * 1000))}h)`);

    // Verificar check-in recente
    const recentTimeDiff = now - new Date(recentCheckIn.createdAt);
    const recentExpired = recentTimeDiff > expirationTime;
    console.log(`Check-in recente (ID ${recentCheckIn.id}): ${recentExpired ? '❌ EXPIRADO' : '✅ VÁLIDO'} (${Math.round(recentTimeDiff / (60 * 60 * 1000))}h)`);

    // 4. Simular a atualização automática de check-ins expirados
    console.log('\n4. Simulando atualização automática de check-ins expirados...');
    
    const expiredCheckIns = await prisma.checkin.findMany({
      where: {
        status: 'pending',
        createdAt: {
          lt: new Date(now.getTime() - expirationTime)
        }
      }
    });

    console.log(`Encontrados ${expiredCheckIns.length} check-ins expirados`);

    if (expiredCheckIns.length > 0) {
      const updateResult = await prisma.checkin.updateMany({
        where: {
          status: 'pending',
          createdAt: {
            lt: new Date(now.getTime() - expirationTime)
          }
        },
        data: {
          status: 'rejected',
          updatedAt: new Date()
        }
      });

      console.log(`✅ ${updateResult.count} check-ins foram automaticamente rejeitados por expiração`);
    }

    // 5. Verificar o estado final
    console.log('\n5. Verificando estado final dos check-ins...');
    
    const finalOldCheckIn = await prisma.checkin.findUnique({
      where: { id: oldCheckIn.id }
    });
    
    const finalRecentCheckIn = await prisma.checkin.findUnique({
      where: { id: recentCheckIn.id }
    });

    console.log(`Check-in antigo: Status ${finalOldCheckIn.status}`);
    console.log(`Check-in recente: Status ${finalRecentCheckIn.status}`);

    // 6. Limpeza - remover check-ins de teste
    console.log('\n6. Limpando dados de teste...');
    await prisma.checkin.deleteMany({
      where: {
        id: {
          in: [oldCheckIn.id, recentCheckIn.id]
        }
      }
    });
    console.log('✅ Dados de teste removidos');

    console.log('\n🎉 Teste de expiração de check-ins concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o teste
testCheckInExpiration();