const { execSync } = require('child_process');

console.log('🔄 Criando migrações para PostgreSQL...');

// Definir uma DATABASE_URL temporária válida para PostgreSQL
const tempDatabaseUrl = 'postgres://78b395b4842b964e29f64ac841eaf47eb4a95b559b59afaae00010c96cf0192c:sk_P_aFRQ8M_XJvqYiKjX254@db.prisma.io:5432/postgres?sslmode=require';

// Definir a variável de ambiente temporariamente
process.env.DATABASE_URL = tempDatabaseUrl;

try {
  console.log('📦 Gerando Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('🗄️ Criando migração inicial para PostgreSQL...');
  execSync('npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/init.sql', { stdio: 'inherit' });
  
  console.log('✅ Migrações PostgreSQL criadas com sucesso!');
  console.log('📁 Arquivo de migração: prisma/init.sql');
  
} catch (error) {
  console.error('❌ Erro ao criar migrações:', error.message);
  process.exit(1);
}