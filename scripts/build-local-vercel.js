#!/usr/bin/env node

/**
 * Script para simular build da Vercel localmente
 * Funciona sem conexão real com banco de dados
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando build local simulando Vercel...');

try {
  // 1. Gerar Prisma Client
  console.log('📦 Gerando Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // 2. Verificar se as migrações estão corretas (sem aplicar)
  console.log('🔍 Verificando migrações...');
  
  // Verificar se migration_lock.toml existe e tem provider correto
  const migrationLockPath = path.join(process.cwd(), 'prisma', 'migrations', 'migration_lock.toml');
  if (fs.existsSync(migrationLockPath)) {
    const lockContent = fs.readFileSync(migrationLockPath, 'utf8');
    if (lockContent.includes('provider = "postgresql"')) {
      console.log('✅ Migration lock configurado para PostgreSQL');
    } else {
      throw new Error('❌ Migration lock não está configurado para PostgreSQL');
    }
  } else {
    throw new Error('❌ Arquivo migration_lock.toml não encontrado');
  }
  
  // 3. Build do Next.js
  console.log('🏗️ Fazendo build do Next.js...');
  execSync('npx next build', { stdio: 'inherit' });
  
  console.log('✅ Build local concluído com sucesso!');
  console.log('🎯 O projeto está pronto para deploy na Vercel');
  
} catch (error) {
  console.error('❌ Erro durante o build:', error.message);
  process.exit(1);
}