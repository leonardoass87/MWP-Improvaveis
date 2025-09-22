require('dotenv').config({ path: '.env.local' })
const mysql = require('mysql2/promise')
const bcrypt = require('bcryptjs')

async function addPasswords() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    })

    console.log('Conectado ao MySQL')

    // Senhas padrão para teste
    const defaultPassword = '123456'
    const hashedPassword = await bcrypt.hash(defaultPassword, 10)

    // Atualizar senhas de TODOS os usuários
    const [result] = await connection.execute(
      'UPDATE users SET password = ?',
      [hashedPassword]
    )

    console.log(`Senhas atualizadas para ${result.affectedRows} usuários`)
    console.log(`Senha padrão para todos os usuários: ${defaultPassword}`)

    // Listar usuários atualizados
    const [users] = await connection.execute(
      'SELECT id, name, email, role FROM users ORDER BY id'
    )

    console.log('\nCredenciais para teste de login:')
    console.log('================================')
    users.forEach(user => {
      console.log(`Email: ${user.email}`)
      console.log(`Senha: ${defaultPassword}`)
      console.log(`Role: ${user.role}`)
      console.log('--------------------------------')
    })

    await connection.end()
  } catch (error) {
    console.error('Erro:', error.message)
  }
}

addPasswords()