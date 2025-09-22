# Configuração do Banco de Dados PostgreSQL na Vercel

## Problema Resolvido
O erro "Unable to open the database file" ocorria porque a aplicação estava configurada para usar SQLite, que não é suportado na Vercel. Agora a aplicação foi migrada para PostgreSQL.

## Passos para Configurar na Vercel

### 1. Criar Banco de Dados Vercel Postgres

1. Acesse o [Dashboard da Vercel](https://vercel.com/dashboard)
2. Vá para o seu projeto
3. Clique na aba **"Storage"**
4. Clique em **"Create Database"**
5. Selecione **"Postgres"**
6. Escolha um nome para o banco (ex: `bjj-academy-db`)
7. Selecione a região mais próxima
8. Clique em **"Create"**

### 2. Configurar Variáveis de Ambiente

Após criar o banco, a Vercel automaticamente criará as seguintes variáveis de ambiente:

- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL` 
- `POSTGRES_URL_NON_POOLING`

**IMPORTANTE**: Você precisa adicionar uma variável adicional:

1. Vá para **Settings** > **Environment Variables**
2. Adicione uma nova variável:
   - **Name**: `DATABASE_URL`
   - **Value**: Use o valor de `POSTGRES_PRISMA_URL`
   - **Environments**: Production, Preview, Development

### 3. Configurar JWT Secret

Adicione também a variável JWT_SECRET:

1. **Name**: `JWT_SECRET`
2. **Value**: Gere uma chave segura (ex: usando `openssl rand -base64 32`)
3. **Environments**: Production, Preview, Development

### 4. Executar Migrações

Após o deploy, execute as migrações do Prisma:

```bash
# No terminal local, com as variáveis de ambiente da Vercel
npx prisma migrate deploy
```

Ou configure um script de build que execute as migrações automaticamente.

### 5. Popular Banco com Dados Iniciais

Crie um usuário administrador inicial:

```sql
INSERT INTO "User" (name, email, password, role, belt, degree, active, "createdAt", "updatedAt") 
VALUES (
  'Admin', 
  'admin@bjjacademy.com', 
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: password
  'admin', 
  'preta', 
  5, 
  true, 
  NOW(), 
  NOW()
);
```

## Alternativas ao Vercel Postgres

Se preferir usar outro provedor:

### Supabase (Gratuito)
1. Crie conta em [supabase.com](https://supabase.com)
2. Crie novo projeto
3. Vá em Settings > Database
4. Copie a "Connection string"
5. Use como `DATABASE_URL` na Vercel

### Railway
1. Crie conta em [railway.app](https://railway.app)
2. Crie novo projeto PostgreSQL
3. Copie a connection string
4. Use como `DATABASE_URL` na Vercel

### Neon (Gratuito)
1. Crie conta em [neon.tech](https://neon.tech)
2. Crie novo projeto
3. Copie a connection string
4. Use como `DATABASE_URL` na Vercel

## Verificação

Após configurar tudo:

1. Faça um novo deploy na Vercel
2. Verifique os logs para confirmar que não há erros de banco
3. Teste o login na aplicação
4. Verifique se as tabelas foram criadas corretamente

## Troubleshooting

### Erro de Conexão
- Verifique se `DATABASE_URL` está configurada corretamente
- Confirme que o banco está acessível publicamente
- Verifique se as credenciais estão corretas

### Erro de Migração
- Execute `npx prisma generate` antes do deploy
- Certifique-se de que as migrações estão na pasta `prisma/migrations`
- Verifique se o schema está sincronizado

### Erro de Autenticação
- Confirme que `JWT_SECRET` está configurado
- Verifique se o hash da senha está correto
- Teste com um usuário recém-criado