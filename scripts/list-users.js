require('dotenv').config({ path: '.env.local' })
const mysql = require('mysql2/promise')

async function listUsers() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    })

    console.log('Conectado ao MySQL')

    // Listar todos os usuários
    const [users] = await connection.execute(
      'SELECT id, name, email, role, belt_level, degree, active FROM users ORDER BY id'
    )

    console.log('\nUsuários no banco de dados:')
    console.log('================================')
    users.forEach(user => {
      console.log(`ID: ${user.id}`)
      console.log(`Nome: ${user.name}`)
      console.log(`Email: ${user.email}`)
      console.log(`Role: ${user.role}`)
      console.log(`Faixa: ${user.belt_level}`)
      console.log(`Grau: ${user.degree}`)
      console.log(`Ativo: ${user.active ? 'Sim' : 'Não'}`)
      console.log('--------------------------------')
    })

    await connection.end()
  } catch (error) {
    console.error('Erro:', error.message)
  }
}

listUsers()