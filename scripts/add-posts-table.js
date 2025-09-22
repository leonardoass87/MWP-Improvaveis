const mysql = require('mysql2/promise')
require('dotenv').config()

async function addPostsTable() {
  let connection
  
  try {
    // Conectar ao MySQL
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bjj_academy'
    })

    console.log('Conectado ao MySQL')

    // Criar tabela de posts
    const createPostsTable = `
      CREATE TABLE IF NOT EXISTS posts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        author_id INT NOT NULL,
        published BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `

    await connection.execute(createPostsTable)
    console.log('Tabela de posts criada com sucesso!')

    // Inserir alguns posts de exemplo
    const insertExamplePosts = `
      INSERT INTO posts (title, content, author_id) VALUES 
      ('Bem-vindos à Academia!', 'Sejam bem-vindos à nossa academia de Jiu-Jitsu. Aqui vocês encontrarão um ambiente acolhedor para aprender e evoluir.', 4),
      ('Horários de Treino', 'Nossos treinos acontecem de segunda a sexta das 18h às 20h, e aos sábados das 9h às 11h. Não percam!', 4),
      ('Graduação de Faixas', 'No próximo mês teremos nossa cerimônia de graduação. Parabéns a todos que se dedicaram!', 4)
    `

    await connection.execute(insertExamplePosts)
    console.log('Posts de exemplo inseridos com sucesso!')

  } catch (error) {
    console.error('Erro:', error)
  } finally {
    if (connection) {
      await connection.end()
      console.log('Conexão fechada')
    }
  }
}

addPostsTable()