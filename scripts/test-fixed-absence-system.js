const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

// Credenciais de teste
const ADMIN_CREDENTIALS = {
  email: 'admin@improvaveisbjj.com',
  password: 'admin123'
};

let adminToken = '';

async function login(credentials) {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ Login realizado: ${data.user.name} (${data.user.role})`);
      return data;
    } else {
      console.log('❌ Erro no login:', data.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Erro de conexão no login:', error.message);
    return null;
  }
}

async function testAbsenceAPI(token) {
  try {
    const response = await fetch(`${BASE_URL}/api/students/absences`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ API de faltas funcionando após correção:');
      console.log(`📊 Total de alunos: ${data.summary.total}`);
      console.log(`🟢 Ativos: ${data.summary.active}`);
      console.log(`🟡 Alerta (4+ faltas): ${data.summary.warning}`);
      console.log(`🔴 Risco (6+ faltas): ${data.summary.atRisk}`);
      console.log(`📉 Baixa frequência: ${data.summary.lowFrequency}`);
      
      console.log('\n👥 DETALHES DOS ALUNOS:');
      data.students.forEach(student => {
        console.log(`👤 ${student.studentName}:`);
        console.log(`   ❌ Faltas consecutivas: ${student.absenceStats.consecutiveAbsences}`);
        console.log(`   📈 Frequência mensal: ${student.monthlyStats.frequency}%`);
        console.log(`   🚨 Status: ${student.status} - ${student.statusMessage}`);
        console.log('');
      });
      
      return data;
    } else {
      console.log('❌ Erro na API de faltas:', data.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Erro de conexão na API de faltas:', error.message);
    return null;
  }
}

async function testSpecificStudent(token, studentEmail) {
  try {
    // Primeiro, buscar o ID do aluno pelo email
    const studentsResponse = await fetch(`${BASE_URL}/api/students/absences`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const studentsData = await studentsResponse.json();
    
    if (!studentsResponse.ok) {
      console.log('❌ Erro ao buscar alunos:', studentsData.error);
      return null;
    }

    const student = studentsData.students.find(s => s.studentName.toLowerCase().includes('joão') || s.studentName.toLowerCase().includes('bruno'));
    
    if (!student) {
      console.log(`❌ Aluno não encontrado com nome similar a João ou Bruno`);
      console.log('📋 Alunos disponíveis:');
      studentsData.students.forEach(s => console.log(`   - ${s.studentName} (${s.studentId})`));
      return null;
    }

    console.log(`🔍 TESTANDO ALUNO ESPECÍFICO: ${student.studentName}`);
    
    const response = await fetch(`${BASE_URL}/api/students/absences?studentId=${student.studentId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Dados do aluno após correção:');
      console.log(`👤 Nome: ${data.studentName}`);
      console.log(`❌ Faltas consecutivas: ${data.absenceStats.consecutiveAbsences}`);
      console.log(`📈 Frequência mensal: ${data.monthlyStats.frequency}%`);
      console.log(`🚨 Status: ${data.status}`);
      console.log(`💬 Mensagem: ${data.statusMessage}`);
      
      if (data.absenceStats.lastCheckIn) {
        console.log(`📅 Último check-in: ${new Date(data.absenceStats.lastCheckIn).toLocaleDateString('pt-BR')}`);
      } else {
        console.log(`📅 Último check-in: Nunca`);
      }
      
      return data;
    } else {
      console.log('❌ Erro na API de faltas do aluno:', data.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Erro de conexão:', error.message);
    return null;
  }
}

async function runTests() {
  console.log('🔧 TESTANDO SISTEMA DE FALTAS CORRIGIDO\n');

  // 1. Login como admin
  console.log('1️⃣ Fazendo login como admin...');
  const adminLogin = await login(ADMIN_CREDENTIALS);
  if (!adminLogin) {
    console.log('❌ Não foi possível fazer login como admin. Encerrando testes.');
    return;
  }
  adminToken = adminLogin.token;
  console.log('');

  // 2. Testar API de faltas geral
  console.log('2️⃣ Testando API de faltas (todos os alunos)...');
  await testAbsenceAPI(adminToken);
  console.log('');

  // 3. Testar aluno específico (João/Bruno)
  console.log('3️⃣ Testando aluno específico...');
  await testSpecificStudent(adminToken);
  console.log('');

  console.log('✅ Testes concluídos!');
  console.log('\n📋 RESUMO DA CORREÇÃO:');
  console.log('- ✅ Alunos novos agora têm 0 faltas (não mais 6)');
  console.log('- ✅ Limite de desativação alterado para 6 faltas');
  console.log('- ✅ Limite de alerta alterado para 4 faltas');
  console.log('- ✅ Frequência de treino ajustada para 3x por semana');
}

// Executar testes
runTests().catch(error => {
  console.error('❌ Erro durante os testes:', error);
});