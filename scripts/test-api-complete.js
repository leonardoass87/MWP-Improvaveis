const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testAPI() {
  console.log('🧪 Testando API completa de check-ins...\n');

  try {
    // 1. Fazer login para obter token
    console.log('1. Fazendo login...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@improvaveisbjj.com',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login falhou: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login realizado com sucesso');

    // 2. Testar GET /api/checkins
    console.log('\n2. Testando GET /api/checkins...');
    const checkinsResponse = await fetch(`${BASE_URL}/api/checkins?date=${new Date().toISOString().split('T')[0]}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    if (checkinsResponse.ok) {
      const checkinsData = await checkinsResponse.json();
      console.log(`✅ GET /api/checkins funcionando - ${checkinsData.length} check-ins encontrados`);
    } else {
      console.log(`❌ GET /api/checkins falhou: ${checkinsResponse.status}`);
    }

    // 3. Testar POST /api/checkins (criar check-in)
    console.log('\n3. Testando POST /api/checkins...');
    const createResponse = await fetch(`${BASE_URL}/api/checkins`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 1,
        date: new Date().toISOString().split('T')[0]
      })
    });

    if (createResponse.ok) {
      const createData = await createResponse.json();
      console.log(`✅ POST /api/checkins funcionando - Check-in criado com ID ${createData.id}`);
      
      // 4. Testar aprovação de check-in
      console.log('\n4. Testando aprovação de check-in...');
      const approveResponse = await fetch(`${BASE_URL}/api/checkins/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          checkinId: createData.id
        })
      });

      if (approveResponse.ok) {
        console.log('✅ Aprovação de check-in funcionando');
      } else {
        console.log(`❌ Aprovação falhou: ${approveResponse.status}`);
      }

    } else {
      const errorData = await createResponse.json();
      console.log(`❌ POST /api/checkins falhou: ${createResponse.status} - ${errorData.error}`);
    }

    // 5. Testar GET /api/students/active
    console.log('\n5. Testando GET /api/students/active...');
    const studentsResponse = await fetch(`${BASE_URL}/api/students/active`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    if (studentsResponse.ok) {
      const studentsData = await studentsResponse.json();
      console.log(`✅ GET /api/students/active funcionando - ${studentsData.length} estudantes ativos`);
    } else {
      console.log(`❌ GET /api/students/active falhou: ${studentsResponse.status}`);
    }

    console.log('\n🎉 Teste da API concluído!');

  } catch (error) {
    console.error('❌ Erro durante o teste da API:', error.message);
  }
}

// Executar o teste
testAPI();