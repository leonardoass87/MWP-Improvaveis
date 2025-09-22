-- Criação do banco de dados
CREATE DATABASE IF NOT EXISTS bjj_academy;
USE bjj_academy;

-- Tabela de usuários
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'professor', 'aluno') NOT NULL,
    belt ENUM('branca', 'azul', 'roxa', 'marrom', 'preta') NULL,
    degree INT DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de check-ins
CREATE TABLE checkins (
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
);

-- Inserir usuário admin padrão
INSERT INTO users (name, email, password, role) VALUES 
('Administrador', 'admin@bjj.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Inserir alguns usuários de exemplo
INSERT INTO users (name, email, password, role, belt, degree) VALUES 
('Professor João', 'professor@bjj.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'professor', 'preta', 2),
('Aluno Carlos', 'carlos@bjj.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'aluno', 'azul', 1),
('Aluna Maria', 'maria@bjj.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'aluno', 'roxa', 0),
('Aluno Pedro', 'pedro@bjj.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'aluno', 'branca', 2);

-- Inserir alguns check-ins de exemplo
INSERT INTO checkins (user_id, date, status, approved_by, approved_at) VALUES 
(3, CURDATE(), 'approved', 2, NOW()),
(4, CURDATE(), 'pending', NULL, NULL),
(5, CURDATE() - INTERVAL 1 DAY, 'approved', 2, NOW() - INTERVAL 1 DAY),
(3, CURDATE() - INTERVAL 1 DAY, 'approved', 2, NOW() - INTERVAL 1 DAY),
(4, CURDATE() - INTERVAL 2 DAY, 'approved', 2, NOW() - INTERVAL 2 DAY);