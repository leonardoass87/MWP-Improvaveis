require('dotenv').config({ path: '.env.local' })
const mysql = require('mysql2/promise')
const bcrypt = require('bcryptjs')

async function addInstructor() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    })

    console.log('Conectado ao MySQL')

    // Verificar se já existe um instrutor
    const [existing] = await connection.execute(
      'SELECT * FROM users WHERE role = "instructor"'
    )

    if (existing.length > 0) {
      console.log('Instrutor já existe:')
      existing.forEach(user => {
        console.log(`Email: ${user.email} - Role: ${user.role}`)
      })
      await connection.end()
      return
    }

    // Criar senha hash
    const password = '123456'
    const hashedPassword = await bcrypt.hash(password, 10)

    // Inserir novo instrutor
    const [result] = await connection.execute(
      `INSERT INTO users (name, email, password, role, belt_level, degree, active) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['Professor Silva', 'professor@bjj.com', hashedPassword, 'instructor', 'black', 3, 1]
    )

    console.log('Instrutor criado com sucesso!')
    console.log('================================')
    console.log('Email: professor@bjj.com')
    console.log('Senha: 123456')
    console.log('Role: instructor')
    console.log('Faixa: black (3º grau)')

    await connection.end()
  } catch (error) {
    console.error('Erro:', error.message)
  }
}

addInstructor()