#!/usr/bin/env node

/**
 * Script para simular o build da Vercel localmente
 * Simula as variáveis de ambiente da Vercel para testar o build
 */

const { execSync } = require('child_process');

console.log('🚀 Simulando build da Vercel...\n');

// Simula uma DATABASE_URL válida para PostgreSQL (não precisa existir para o build)
const mockDatabaseUrl = 'postgresql://user:password@localhost:5432/mockdb';

try {
  console.log('📦 Gerando Prisma Client...');
  execSync('npx prisma generate', { 
    stdio: 'inherit',
    env: { 
      ...process.env, 
      DATABASE_URL: mockDatabaseUrl 
    }
  });

  console.log('\n🏗️  Fazendo build do Next.js...');
  execSync('npm run build', { 
    stdio: 'inherit',
    env: { 
      ...process.env, 
      DATABASE_URL: mockDatabaseUrl 
    }
  });

  console.log('\n✅ Build simulado da Vercel concluído com sucesso!');
  console.log('🎉 A aplicação está pronta para deploy na Vercel!');

} catch (error) {
  console.error('\n❌ Erro no build simulado:', error.message);
  process.exit(1);
}