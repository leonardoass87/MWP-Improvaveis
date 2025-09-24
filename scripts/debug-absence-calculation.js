const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Função atual que está com bug
function calculateConsecutiveAbsences(checkIns, expectedTrainingDays = 2) {
  const sortedCheckIns = checkIns
    .filter(c => c.status === 'approved')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  if (sortedCheckIns.length === 0) {
    // PROBLEMA: Se não tem check-in aprovado, calcular desde o início do mês
    const today = new Date()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const daysSinceStart = Math.floor((today.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24))
    
    // PROBLEMA: Estimar faltas baseado na frequência esperada (2 treinos por semana)
    const expectedTrainings = Math.floor((daysSinceStart / 7) * expectedTrainingDays)
    return Math.min(expectedTrainings, 10) // Máximo de 10 faltas para evitar números absurdos
  }

  const lastCheckIn = new Date(sortedCheckIns[0].date)
  const today = new Date()
  const daysSinceLastCheckIn = Math.floor((today.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24))

  if (daysSinceLastCheckIn > 3) {
    const weeksSinceLastCheckIn = daysSinceLastCheckIn / 7
    const expectedTrainings = Math.floor(weeksSinceLastCheckIn * expectedTrainingDays)
    return Math.min(expectedTrainings, 10)
  }

  return 0
}

// Função corrigida
function calculateConsecutiveAbsencesFixed(checkIns, expectedTrainingDays = 2) {
  const sortedCheckIns = checkIns
    .filter(c => c.status === 'approved')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Se não tem check-ins aprovados, retornar 0 faltas
  // Um usuário novo não deveria ter faltas no primeiro dia
  if (sortedCheckIns.length === 0) {
    return 0
  }

  const lastCheckIn = new Date(sortedCheckIns[0].date)
  const today = new Date()
  const daysSinceLastCheckIn = Math.floor((today.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24))

  // Só considerar faltas se passou mais de 3 dias desde o último check-in
  if (daysSinceLastCheckIn > 3) {
    // Calcular faltas baseado em dias úteis de treino (segunda, quarta, sexta)
    // Aproximadamente 3 dias de treino por semana
    const weeksSinceLastCheckIn = daysSinceLastCheckIn / 7
    const expectedTrainings = Math.floor(weeksSinceLastCheckIn * 3) // 3 treinos por semana
    return Math.min(expectedTrainings, 6) // Máximo de 6 faltas para desativação
  }

  return 0
}

async function debugAbsenceCalculation() {
  try {
    console.log('🔍 DEBUGANDO CÁLCULO DE FALTAS\n');

    // Buscar todos os alunos
    const students = await prisma.user.findMany({
      where: { 
        role: 'student',
        active: true
      },
      include: {
        checkins: {
          select: {
            date: true,
            status: true,
            createdAt: true
          },
          orderBy: { date: 'desc' }
        }
      }
    });

    console.log(`📊 Encontrados ${students.length} alunos ativos\n`);

    for (const student of students) {
      console.log(`👤 ALUNO: ${student.name} (${student.email})`);
      console.log(`📅 Check-ins: ${student.checkins.length} total`);
      
      const approvedCheckIns = student.checkins.filter(c => c.status === 'approved');
      console.log(`✅ Check-ins aprovados: ${approvedCheckIns.length}`);
      
      if (approvedCheckIns.length > 0) {
        const lastCheckIn = new Date(approvedCheckIns[0].date);
        console.log(`📅 Último check-in aprovado: ${lastCheckIn.toLocaleDateString('pt-BR')}`);
      } else {
        console.log(`📅 Último check-in aprovado: Nunca`);
      }

      // Testar função atual (com bug)
      const currentAbsences = calculateConsecutiveAbsences(student.checkins);
      console.log(`❌ FUNÇÃO ATUAL (COM BUG): ${currentAbsences} faltas`);

      // Testar função corrigida
      const fixedAbsences = calculateConsecutiveAbsencesFixed(student.checkins);
      console.log(`✅ FUNÇÃO CORRIGIDA: ${fixedAbsences} faltas`);

      // Mostrar o problema
      if (currentAbsences !== fixedAbsences) {
        console.log(`🚨 PROBLEMA DETECTADO! Diferença de ${currentAbsences - fixedAbsences} faltas`);
      }

      console.log('─'.repeat(50));
    }

    // Demonstrar o problema específico
    console.log('\n🔍 DEMONSTRANDO O PROBLEMA:');
    console.log('Se um aluno se cadastrou hoje e nunca fez check-in:');
    
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const daysSinceStart = Math.floor((today.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24));
    const expectedTrainings = Math.floor((daysSinceStart / 7) * 2);
    
    console.log(`📅 Dias desde início do mês: ${daysSinceStart}`);
    console.log(`🏃 Treinos esperados (função atual): ${expectedTrainings}`);
    console.log(`❌ Faltas calculadas (função atual): ${Math.min(expectedTrainings, 10)}`);
    console.log(`✅ Faltas corretas (função corrigida): 0`);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAbsenceCalculation();