require('dotenv').config({ path: '.env.local' })
const mysql = require('mysql2/promise')
const bcrypt = require('bcryptjs')

async function checkStudent() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  })

  console.log('Conectado ao MySQL')

  try {
    // Buscar um aluno
    const [rows] = await connection.execute(
      'SELECT id, name, email, password, role FROM users WHERE email = ?',
      ['teste@exemplo.com']
    )

    if (rows.length === 0) {
      console.log('Aluno não encontrado!')
      return
    }

    const student = rows[0]
    console.log('\nDados do Aluno:')
    console.log('ID:', student.id)
    console.log('Nome:', student.name)
    console.log('Email:', student.email)
    console.log('Role:', student.role)
    console.log('Password hash:', student.password)
    console.log('Password starts with hash?', student.password.startsWith('$2'))

    // Testar várias senhas possíveis
    const testPasswords = ['123456', 'teste123', 'teste', 'password']
    
    for (const testPassword of testPasswords) {
      console.log(`\nTestando senha "${testPassword}":`)
      
      if (student.password.startsWith('$2')) {
        const isValid = await bcrypt.compare(testPassword, student.password)
        console.log('Senha válida com bcrypt:', isValid)
        if (isValid) {
          console.log(`✅ SENHA CORRETA: ${testPassword}`)
          break
        }
      } else {
        const isValid = testPassword === student.password
        console.log('Senha válida (texto plano):', isValid)
        if (isValid) {
          console.log(`✅ SENHA CORRETA: ${testPassword}`)
          break
        }
      }
    }

  } catch (error) {
    console.error('Erro:', error)
  } finally {
    await connection.end()
  }
}

checkStudent()