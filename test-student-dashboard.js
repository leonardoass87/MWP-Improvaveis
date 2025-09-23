const fetch = require('node-fetch');

async function testStudentDashboard() {
  try {
    console.log('🔍 Testando acesso ao dashboard do aluno...\n');

    // 1. Login como aluno
    console.log('1. Fazendo login como aluno...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'aluno@improvaveisbjj.com',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      console.error('❌ Erro no login:', await loginResponse.text());
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login realizado com sucesso!');
    console.log('👤 Usuário:', loginData.user.name, '- Role:', loginData.user.role);
    console.log('🔑 Token obtido\n');

    // 2. Verificar dados de faltas
    console.log('2. Verificando dados de faltas...');
    const absenceResponse = await fetch(`http://localhost:3000/api/students/absences?studentId=${loginData.user.id}`, {
      headers: { Authorization: `Bearer ${loginData.token}` }
    });

    if (!absenceResponse.ok) {
      console.error('❌ Erro ao buscar dados de faltas:', await absenceResponse.text());
      return;
    }

    const absenceData = await absenceResponse.json();
    console.log('✅ Dados de faltas obtidos com sucesso!\n');

    // 3. Mostrar o que deveria aparecer no dashboard
    console.log('📊 DADOS QUE DEVERIAM APARECER NO DASHBOARD:');
    console.log('=' .repeat(50));
    console.log(`👤 Aluno: ${absenceData.studentName}`);
    console.log(`🥋 Faixa: ${absenceData.belt} ${absenceData.degree}º grau`);
    console.log(`📈 Status: ${absenceData.active ? 'Ativo' : 'Inativo'}`);
    console.log('');
    console.log('📊 ESTATÍSTICAS DE FREQUÊNCIA:');
    console.log(`❌ Faltas Consecutivas: ${absenceData.absenceStats.consecutiveAbsences}`);
    console.log(`📈 Frequência Mensal: ${absenceData.monthlyStats.frequency.toFixed(1)}%`);
    console.log(`✅ Aulas Aprovadas: ${absenceData.monthlyStats.approved} / ${absenceData.monthlyStats.expectedTrainings}`);
    
    if (absenceData.absenceStats.lastCheckIn) {
      console.log(`📅 Último Check-in: ${new Date(absenceData.absenceStats.lastCheckIn).toLocaleDateString('pt-BR')}`);
    } else {
      console.log(`📅 Último Check-in: Nunca`);
    }
    
    console.log('');
    console.log('🚨 STATUS DE ALERTA:');
    console.log(`Status: ${absenceData.status}`);
    console.log(`Mensagem: ${absenceData.statusMessage}`);
    console.log('=' .repeat(50));
    console.log('');

    // 4. Instruções para o usuário
    console.log('📋 INSTRUÇÕES PARA VER NO NAVEGADOR:');
    console.log('1. Acesse: http://localhost:3000/login');
    console.log('2. Faça login com:');
    console.log('   📧 Email: aluno@improvaveisbjj.com');
    console.log('   🔒 Senha: admin123');
    console.log('3. Você será redirecionado para: http://localhost:3000/dashboard/aluno');
    console.log('4. Procure pelo card "Estatísticas de Frequência" no lado direito');
    console.log('');
    console.log('⚠️  IMPORTANTE: Certifique-se de estar logado como ALUNO, não como professor!');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testStudentDashboard();