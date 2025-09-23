const jwt = require('jsonwebtoken')
require('dotenv').config()

const JWT_SECRET = process.env.JWT_SECRET || 'dev-super-secret-jwt-key-for-development-only'

console.log('🔍 Teste simples de JWT...\n')

// Criar token
const user = {
  id: 1,
  name: 'Aluno Teste',
  email: 'aluno.teste@bjj.com',
  role: 'student',
  active: true
}

console.log('1. Criando token...')
const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' })
console.log(`   Token: ${token}\n`)

// Verificar token
console.log('2. Verificando token...')
try {
  const decoded = jwt.verify(token, JWT_SECRET)
  console.log('   ✅ Token válido!')
  console.log('   Dados decodificados:', decoded)
} catch (error) {
  console.log('   ❌ Erro:', error.message)
}

// Testar com fetch
console.log('\n3. Testando com fetch...')
async function testFetch() {
  try {
    const response = await fetch('http://localhost:3000/api/checkins', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    console.log(`   Status: ${response.status}`)
    const data = await response.text()
    console.log(`   Resposta: ${data}`)
  } catch (error) {
    console.log(`   ❌ Erro de fetch: ${error.message}`)
  }
}

testFetch()