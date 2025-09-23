const jwt = require('jsonwebtoken')
require('dotenv').config()

// Simular tokens JWT para teste
const JWT_SECRET = process.env.JWT_SECRET || 'dev-super-secret-jwt-key-for-development-only'

function createTestToken(user) {
  console.log(`   Criando token para: ${user.name} (${user.role})`)
  console.log(`   JWT_SECRET: ${JWT_SECRET}`)
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' })
  console.log(`   Token criado: ${token.substring(0, 50)}...`)
  
  // Testar se conseguimos decodificar o token
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    console.log(`   Token válido! Decodificado: ${decoded.name}`)
  } catch (error) {
    console.log(`   ❌ Erro ao verificar token: ${error.message}`)
  }
  
  return token
}

async function testAPI() {
  try {
    console.log('🔍 Testando APIs de check-in...\n')

    // Criar tokens de teste
    const studentToken = createTestToken({
      id: 1,
      name: 'Aluno Teste',
      email: 'aluno.teste@bjj.com',
      role: 'student',
      active: true
    })

    const instructorToken = createTestToken({
      id: 2,
      name: 'Professor Teste',
      email: 'professor.teste@bjj.com',
      role: 'instructor',
      active: true
    })

    const baseUrl = 'http://localhost:3000'

    // 1. Testar busca de check-ins pendentes (como professor)
    console.log('1. Testando busca de check-ins pendentes (como professor)...')
    try {
      const response = await fetch(`${baseUrl}/api/checkins?status=pending`, {
        headers: {
          'Authorization': `Bearer ${instructorToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`   ✅ Sucesso! Encontrados ${data.length} check-ins pendentes:`)
        data.forEach(checkin => {
          console.log(`   - ID: ${checkin.id}, Aluno: ${checkin.user.name}, Data: ${checkin.date}`)
        })
      } else {
        const error = await response.text()
        console.log(`   ❌ Erro ${response.status}: ${error}`)
      }
    } catch (error) {
      console.log(`   ❌ Erro de conexão: ${error.message}`)
    }

    // 2. Testar busca de todos os check-ins (como professor)
    console.log('\n2. Testando busca de todos os check-ins (como professor)...')
    try {
      const response = await fetch(`${baseUrl}/api/checkins`, {
        headers: {
          'Authorization': `Bearer ${instructorToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`   ✅ Sucesso! Encontrados ${data.length} check-ins totais:`)
        data.forEach(checkin => {
          console.log(`   - ID: ${checkin.id}, Aluno: ${checkin.user.name}, Status: ${checkin.status}`)
        })
      } else {
        const error = await response.text()
        console.log(`   ❌ Erro ${response.status}: ${error}`)
      }
    } catch (error) {
      console.log(`   ❌ Erro de conexão: ${error.message}`)
    }

    // 3. Testar busca de check-ins como aluno
    console.log('\n3. Testando busca de check-ins (como aluno)...')
    try {
      const response = await fetch(`${baseUrl}/api/checkins`, {
        headers: {
          'Authorization': `Bearer ${studentToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`   ✅ Sucesso! Aluno vê ${data.length} check-ins próprios:`)
        data.forEach(checkin => {
          console.log(`   - ID: ${checkin.id}, Data: ${checkin.date}, Status: ${checkin.status}`)
        })
      } else {
        const error = await response.text()
        console.log(`   ❌ Erro ${response.status}: ${error}`)
      }
    } catch (error) {
      console.log(`   ❌ Erro de conexão: ${error.message}`)
    }

    // 4. Testar criação de novo check-in (como aluno)
    console.log('\n4. Testando criação de novo check-in (como aluno)...')
    try {
      const response = await fetch(`${baseUrl}/api/checkins`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${studentToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`   ✅ Sucesso! Check-in criado:`)
        console.log(`   - ID: ${data.id}, Data: ${data.date}, Status: ${data.status}`)
      } else {
        const error = await response.text()
        console.log(`   ❌ Erro ${response.status}: ${error}`)
      }
    } catch (error) {
      console.log(`   ❌ Erro de conexão: ${error.message}`)
    }

    // 5. Testar aprovação de check-in (como professor)
    console.log('\n5. Testando aprovação de check-in (como professor)...')
    try {
      const response = await fetch(`${baseUrl}/api/checkins/1/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${instructorToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'approved' })
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`   ✅ Sucesso! Check-in aprovado:`)
        console.log(`   - ID: ${data.id}, Status: ${data.status}, Aprovado por: ${data.approvedBy}`)
      } else {
        const error = await response.text()
        console.log(`   ❌ Erro ${response.status}: ${error}`)
      }
    } catch (error) {
      console.log(`   ❌ Erro de conexão: ${error.message}`)
    }

    console.log('\n✅ Teste de APIs concluído!')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testAPI()