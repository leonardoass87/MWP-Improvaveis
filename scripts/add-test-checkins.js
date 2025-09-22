require('dotenv').config({ path: '.env.local' })
const mysql = require('mysql2/promise')

async function addTestCheckIns() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    })

    console.log('Conectado ao MySQL')

    // Buscar usuários estudantes
    const [students] = await connection.execute(
      'SELECT id, name, email FROM users WHERE role = "student"'
    )

    if (students.length === 0) {
      console.log('Nenhum estudante encontrado')
      await connection.end()
      return
    }

    console.log(`Encontrados ${students.length} estudantes`)

    // Criar check-ins para os últimos 7 dias
    const today = new Date()
    const checkInsToCreate = []

    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      // Para cada dia, criar check-ins para alguns estudantes aleatórios
      const numCheckIns = Math.floor(Math.random() * students.length) + 1
      const selectedStudents = students.sort(() => 0.5 - Math.random()).slice(0, numCheckIns)

      for (const student of selectedStudents) {
        // Status aleatório: 70% pending, 20% approved, 10% rejected
        const rand = Math.random()
        let status = 'pending'
        if (rand < 0.2) status = 'approved'
        else if (rand < 0.3) status = 'rejected'

        checkInsToCreate.push({
          user_id: student.id,
          date: dateStr,
          status: status,
          student_name: student.name
        })
      }
    }

    // Inserir check-ins (ignorar duplicatas)
    let insertedCount = 0
    for (const checkIn of checkInsToCreate) {
      try {
        await connection.execute(
          'INSERT IGNORE INTO checkins (user_id, date, status) VALUES (?, ?, ?)',
          [checkIn.user_id, checkIn.date, checkIn.status]
        )
        insertedCount++
        console.log(`Check-in criado: ${checkIn.student_name} - ${checkIn.date} (${checkIn.status})`)
      } catch (error) {
        // Ignorar erros de duplicata
        if (!error.message.includes('Duplicate')) {
          console.error('Erro ao inserir check-in:', error.message)
        }
      }
    }

    console.log(`\n${insertedCount} check-ins criados com sucesso!`)

    // Mostrar estatísticas
    const [stats] = await connection.execute(`
      SELECT 
        status,
        COUNT(*) as count
      FROM checkins 
      GROUP BY status
    `)

    console.log('\nEstatísticas de check-ins:')
    stats.forEach(stat => {
      console.log(`${stat.status}: ${stat.count}`)
    })

    await connection.end()
  } catch (error) {
    console.error('Erro:', error.message)
  }
}

addTestCheckIns()