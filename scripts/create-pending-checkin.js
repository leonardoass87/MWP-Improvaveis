const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createPendingCheckIn() {
  try {
    // Buscar o aluno
    const student = await prisma.user.findFirst({
      where: { role: 'student' }
    });
    
    if (!student) {
      console.log('Nenhum aluno encontrado');
      return;
    }
    
    // Criar check-in pendente para amanhã
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const checkIn = await prisma.checkin.create({
      data: {
        userId: student.id,
        date: tomorrowStr,
        status: 'pending'
      },
      include: {
        user: true
      }
    });
    
    console.log('Check-in pendente criado:');
    console.log(`- Aluno: ${checkIn.user.name}`);
    console.log(`- Data: ${checkIn.date}`);
    console.log(`- Status: ${checkIn.status}`);
    
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createPendingCheckIn();