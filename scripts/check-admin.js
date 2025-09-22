require('dotenv').config({ path: '.env.local' })
const mysql = require('mysql2/promise')
const bcrypt = require('bcryptjs')

async function checkAdmin() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  })

  console.log('Conectado ao MySQL')

  try {
    // Buscar o admin
    const [rows] = await connection.execute(
      'SELECT id, name, email, password, role FROM users WHERE email = ?',
      ['admin@bjj.com']
    )

    if (rows.length === 0) {
      console.log('Admin não encontrado!')
      return
    }

    const admin = rows[0]
    console.log('\nDados do Admin:')
    console.log('ID:', admin.id)
    console.log('Nome:', admin.name)
    console.log('Email:', admin.email)
    console.log('Role:', admin.role)
    console.log('Password hash:', admin.password)
    console.log('Password starts with hash?', admin.password.startsWith('$2'))

    // Testar várias senhas possíveis
    const testPasswords = ['123456', 'admin123', 'admin', 'password']
    
    for (const testPassword of testPasswords) {
      console.log(`\nTestando senha "${testPassword}":`)
      
      if (admin.password.startsWith('$2')) {
        const isValid = await bcrypt.compare(testPassword, admin.password)
        console.log('Senha válida com bcrypt:', isValid)
        if (isValid) {
          console.log(`✅ SENHA CORRETA: ${testPassword}`)
          break
        }
      } else {
        const isValid = testPassword === admin.password
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

checkAdmin()