const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

// Credenciais de teste
const ADMIN_CREDENTIALS = {
  email: 'admin@improvaveisbjj.com',
  password: 'admin123'
};

const STUDENT_CREDENTIALS = {
  email: 'aluno@improvaveisbjj.com', 
  password: 'admin123'
};

let adminToken = '';
let studentToken = '';
let studentId = '';

async function login(credentials) {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ Login realizado com sucesso para ${credentials.email}`);
      return { token: data.token, user: data.user };
    } else {
      console.log(`❌ Erro no login para ${credentials.email}:`, data.error);
      return null;
    }
  } catch (error) {
    console.log(`❌ Erro de conexão no login para ${credentials.email}:`, error.message);
    return null;
  }
}

async function testAbsenceAPI(token, studentId = null) {
  try {
    const url = studentId 
      ? `${BASE_URL}/api/students/absences?studentId=${studentId}`
      : `${BASE_URL}/api/students/absences`;
      
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ API de faltas funcionando:');
      if (Array.isArray(data)) {
        console.log(`   📊 ${data.length} alunos encontrados`);
        data.forEach(student => {
          console.log(`   👤 ${student.studentName}: ${student.absenceStats.consecutiveAbsences} faltas consecutivas`);
        });
      } else {
        console.log(`   👤 ${data.studentName}: ${data.absenceStats.consecutiveAbsences} faltas consecutivas`);
        console.log(`   📈 Frequência: ${data.monthlyStats.frequency.toFixed(1)}%`);
        console.log(`   ⚠️  Status: ${data.status} - ${data.statusMessage}`);
      }
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

async function testAutoDeactivateAPI(token) {
  try {
    // Verificar alunos em risco
    const response = await fetch(`${BASE_URL}/api/students/auto-deactivate`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ API de desativação automática funcionando:');
      console.log(`   ⚠️  ${data.studentsAtRisk.length} alunos em risco de desativação`);
      data.studentsAtRisk.forEach(student => {
        console.log(`   👤 ${student.studentName}: ${student.absenceStats.consecutiveAbsences} faltas consecutivas`);
      });
      return data;
    } else {
      console.log('❌ Erro na API de desativação automática:', data.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Erro de conexão na API de desativação automática:', error.message);
    return null;
  }
}

async function testCheckInWithAbsenceAlert(token) {
  try {
    const response = await fetch(`${BASE_URL}/api/checkins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Check-in realizado com sucesso');
      if (data.alert) {
        console.log(`   ⚠️  Alerta de faltas: ${data.alert.type} - ${data.alert.message}`);
      } else {
        console.log('   ℹ️  Nenhum alerta de faltas');
      }
      return data;
    } else {
      console.log('❌ Erro no check-in:', data.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Erro de conexão no check-in:', error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Iniciando testes do sistema de controle de faltas...\n');

  // 1. Login como admin
  console.log('1️⃣ Testando login como admin...');
  const adminLogin = await login(ADMIN_CREDENTIALS);
  if (!adminLogin) {
    console.log('❌ Não foi possível fazer login como admin. Encerrando testes.');
    return;
  }
  adminToken = adminLogin.token;
  console.log('');

  // 2. Login como aluno
  console.log('2️⃣ Testando login como aluno...');
  const studentLogin = await login(STUDENT_CREDENTIALS);
  if (!studentLogin) {
    console.log('❌ Não foi possível fazer login como aluno. Encerrando testes.');
    return;
  }
  studentToken = studentLogin.token;
  studentId = studentLogin.user.id;
  console.log('');

  // 3. Testar API de faltas (admin - todos os alunos)
  console.log('3️⃣ Testando API de faltas (admin - todos os alunos)...');
  await testAbsenceAPI(adminToken);
  console.log('');

  // 4. Testar API de faltas (aluno específico)
  console.log('4️⃣ Testando API de faltas (aluno específico)...');
  await testAbsenceAPI(adminToken, studentId);
  console.log('');

  // 5. Testar API de desativação automática
  console.log('5️⃣ Testando API de desativação automática...');
  await testAutoDeactivateAPI(adminToken);
  console.log('');

  // 6. Testar check-in com alertas de faltas
  console.log('6️⃣ Testando check-in com alertas de faltas...');
  await testCheckInWithAbsenceAlert(studentToken);
  console.log('');

  console.log('✅ Testes concluídos!');
}

// Executar testes
runTests().catch(error => {
  console.error('❌ Erro durante os testes:', error);
});