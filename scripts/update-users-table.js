require('dotenv').config({ path: '.env.local' })
const mysql = require('mysql2/promise')

async function updateUsersTable() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    })

    console.log('Conectado ao MySQL')

    // Verificar colunas existentes
    const [columns] = await connection.execute('DESCRIBE users')
    const columnNames = columns.map(col => col.Field)
    
    console.log('Colunas existentes:', columnNames)

    // Lista de novas colunas para adicionar
    const newColumns = [
      { name: 'phone', definition: 'VARCHAR(20) NULL' },
      { name: 'address', definition: 'TEXT NULL' },
      { name: 'emergency_contact', definition: 'VARCHAR(255) NULL' },
      { name: 'emergency_phone', definition: 'VARCHAR(20) NULL' },
      { name: 'birth_date', definition: 'DATE NULL' },
      { name: 'weight', definition: 'DECIMAL(5,2) NULL' },
      { name: 'height', definition: 'DECIMAL(5,2) NULL' },
      { name: 'medical_info', definition: 'TEXT NULL' },
      { name: 'goals', definition: 'TEXT NULL' }
    ]

    // Adicionar colunas que não existem
    for (const column of newColumns) {
      if (!columnNames.includes(column.name)) {
        await connection.execute(`ALTER TABLE users ADD COLUMN ${column.name} ${column.definition}`)
        console.log(`✓ Coluna ${column.name} adicionada`)
      } else {
        console.log(`- Coluna ${column.name} já existe`)
      }
    }

    // Verificar se a coluna belt existe com o nome correto
    if (columnNames.includes('belt_level') && !columnNames.includes('belt')) {
      await connection.execute('ALTER TABLE users CHANGE belt_level belt ENUM("white", "blue", "purple", "brown", "black") NULL')
      console.log('✓ Coluna belt_level renomeada para belt')
    } else if (!columnNames.includes('belt') && !columnNames.includes('belt_level')) {
      await connection.execute('ALTER TABLE users ADD COLUMN belt ENUM("white", "blue", "purple", "brown", "black") NULL')
      console.log('✓ Coluna belt adicionada')
    }

    // Verificar estrutura final
    const [finalColumns] = await connection.execute('DESCRIBE users')
    console.log('\nEstrutura final da tabela users:')
    finalColumns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} ${col.Null} ${col.Key} ${col.Default}`)
    })

    await connection.end()
    console.log('\n✓ Atualização da tabela users concluída!')

  } catch (error) {
    console.error('Erro ao atualizar tabela users:', error.message)
  }
}

updateUsersTable()