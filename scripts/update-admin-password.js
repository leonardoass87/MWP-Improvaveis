require('dotenv').config({ path: '.env.local' })
const mysql = require('mysql2/promise')
const bcrypt = require('bcryptjs')

async function updateAdminPassword() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    })

    console.log('Conectado ao MySQL')

    // Nova senha do admin
    const newPassword = 'Odranoel1203'
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Atualizar senha apenas do admin
    const [result] = await connection.execute(
      'UPDATE users SET password = ? WHERE email = ? AND role = ?',
      [hashedPassword, 'admin@bjj.com', 'admin']
    )

    if (result.affectedRows > 0) {
      console.log('✅ Senha do admin atualizada com sucesso!')
      console.log('Credenciais do admin:')
      console.log('Email: admin@bjj.com')
      console.log('Senha: Odranoel1203')
    } else {
      console.log('❌ Nenhum admin encontrado para atualizar')
    }

    await connection.end()
  } catch (error) {
    console.error('Erro:', error.message)
  }
}

updateAdminPassword()