require('dotenv').config({ path: '.env.local' })
const mysql = require('mysql2/promise')
const bcrypt = require('bcryptjs')

async function checkPassword() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  })

  console.log('Conectado ao MySQL')

  try {
    // Buscar o professor
    const [rows] = await connection.execute(
      'SELECT id, name, email, password, role FROM users WHERE email = ?',
      ['professor@bjj.com']
    )

    if (rows.length === 0) {
      console.log('Professor não encontrado!')
      return
    }

    const professor = rows[0]
    console.log('\nDados do Professor:')
    console.log('ID:', professor.id)
    console.log('Nome:', professor.name)
    console.log('Email:', professor.email)
    console.log('Role:', professor.role)
    console.log('Password hash:', professor.password)
    console.log('Password starts with hash?', professor.password.startsWith('$2'))

    // Testar senha
    const testPassword = '123456'
    console.log('\nTestando senha "123456":')
    
    if (professor.password.startsWith('$2')) {
      const isValid = await bcrypt.compare(testPassword, professor.password)
      console.log('Senha válida com bcrypt:', isValid)
    } else {
      const isValid = testPassword === professor.password
      console.log('Senha válida (texto plano):', isValid)
    }

  } catch (error) {
    console.error('Erro:', error)
  } finally {
    await connection.end()
  }
}

checkPassword()