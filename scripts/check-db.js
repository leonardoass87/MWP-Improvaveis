require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function checkDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });

    console.log('Conectado ao MySQL');

    // Verificar se o banco existe
    const [databases] = await connection.query('SHOW DATABASES LIKE ?', [process.env.DB_NAME || 'bjj_academy']);
    console.log('Bancos encontrados:', databases);

    if (databases.length > 0) {
      // Usar o banco de dados
      await connection.query(`USE ${process.env.DB_NAME || 'bjj_academy'}`);
      
      // Verificar tabelas
      const [tables] = await connection.query('SHOW TABLES');
      console.log('Tabelas encontradas:', tables);

      // Verificar estrutura da tabela users se existir
      if (tables.some(table => Object.values(table)[0] === 'users')) {
        const [columns] = await connection.query('DESCRIBE users');
        console.log('Estrutura da tabela users:');
        columns.forEach(col => {
          console.log(`- ${col.Field}: ${col.Type} ${col.Null} ${col.Key} ${col.Default}`);
        });
      }
    }

    await connection.end();
  } catch (error) {
    console.error('Erro ao verificar banco de dados:', error);
  }
}

checkDatabase();