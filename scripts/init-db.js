const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function initDatabase() {
  let connection;
  
  try {
    // Conectar ao MySQL sem especificar o banco
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });

    console.log('Conectado ao MySQL');

    // Criar banco de dados se não existir
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'bjj_academy'}`);
    console.log('Banco de dados criado/verificado');

    // Usar o banco de dados
    await connection.query(`USE ${process.env.DB_NAME || 'bjj_academy'}`);

    // Verificar se precisa adicionar colunas na tabela users existente
    const [columns] = await connection.query('DESCRIBE users');
    const columnNames = columns.map(col => col.Field);
    
    if (!columnNames.includes('active')) {
      await connection.query('ALTER TABLE users ADD COLUMN active BOOLEAN DEFAULT TRUE');
      console.log('Coluna active adicionada à tabela users');
    }
    
    if (!columnNames.includes('degree')) {
      await connection.query('ALTER TABLE users ADD COLUMN degree INT DEFAULT 0');
      console.log('Coluna degree adicionada à tabela users');
    }
    
    console.log('Tabela users verificada/atualizada');

    // Criar tabela checkins
    await connection.query(`
      CREATE TABLE IF NOT EXISTS checkins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        date DATE NOT NULL,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        approved_by INT NULL,
        approved_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
        UNIQUE KEY unique_user_date (user_id, date)
      )
    `);
    console.log('Tabela checkins criada/verificada');

    // Verificar se já existe usuário admin
    const [adminExists] = await connection.execute(
      'SELECT COUNT(*) as count FROM users WHERE email = ?',
      ['admin@bjj.com']
    );

    if (adminExists[0].count === 0) {
      // Inserir usuário admin padrão
      await connection.query(`
        INSERT INTO users (name, email, password, role) VALUES 
        ('Administrador', 'admin@bjj.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
      `);
      console.log('Usuário admin criado');

      // Inserir professor padrão
      await connection.query(`
        INSERT INTO users (name, email, password, role, belt_level, degree) VALUES 
        ('Professor Silva', 'professor@bjj.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'instructor', 'black', 1)
      `);
      console.log('Usuário professor criado');

      // Inserir alguns alunos de exemplo
      await connection.query(`
        INSERT INTO users (name, email, password, role, belt_level, degree) VALUES 
        ('Aluno Carlos', 'carlos@bjj.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', 'blue', 1),
        ('Aluna Maria', 'maria@bjj.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', 'purple', 0),
        ('Aluno Pedro', 'pedro@bjj.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', 'white', 2)
      `);
      console.log('Usuários de exemplo criados');

      // Inserir alguns check-ins de exemplo
      await connection.query(`
        INSERT INTO checkins (user_id, date, status, approved_by, approved_at) VALUES 
        (3, CURDATE(), 'approved', 2, NOW()),
        (4, CURDATE(), 'pending', NULL, NULL),
        (5, CURDATE() - INTERVAL 1 DAY, 'approved', 2, NOW() - INTERVAL 1 DAY),
        (3, CURDATE() - INTERVAL 1 DAY, 'approved', 2, NOW() - INTERVAL 1 DAY),
        (4, CURDATE() - INTERVAL 2 DAY, 'approved', 2, NOW() - INTERVAL 2 DAY)
      `);
      console.log('Check-ins de exemplo criados');
    } else {
      console.log('Dados já existem, pulando inserção inicial');
    }

    console.log('Banco de dados inicializado com sucesso!');

  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initDatabase();