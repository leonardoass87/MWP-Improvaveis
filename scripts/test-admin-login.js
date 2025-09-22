require('dotenv').config({ path: '.env.local' })
const mysql = require('mysql2/promise')
const bcrypt = require('bcryptjs')

async function testAdminLogin() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    })

    console.log('Conectado ao MySQL')

    // Buscar admin
    const [users] = await connection.execute(
      'SELECT id, name, email, password, role FROM users WHERE email = ? AND role = ?',
      ['admin@bjj.com', 'admin']
    )

    if (users.length === 0) {
      console.log('❌ Admin não encontrado')
      return
    }

    const admin = users[0]
    console.log('\nDados do Admin:')
    console.log('ID:', admin.id)
    console.log('Nome:', admin.name)
    console.log('Email:', admin.email)
    console.log('Role:', admin.role)
    console.log('Password hash:', admin.password)

    // Testar senha Odranoel1203
    const testPassword = 'Odranoel1203'
    const isValid = await bcrypt.compare(testPassword, admin.password)
    
    console.log(`\nTestando senha "${testPassword}":`)
    console.log('Senha válida:', isValid ? '✅ SIM' : '❌ NÃO')

    if (isValid) {
      console.log('\n🎉 CREDENCIAIS CORRETAS:')
      console.log('Email: admin@bjj.com')
      console.log('Senha: Odranoel1203')
    }

    await connection.end()
  } catch (error) {
    console.error('Erro:', error.message)
  }
}

testAdminLogin()