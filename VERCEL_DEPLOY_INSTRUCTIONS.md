# Instruções de Deploy na Vercel

## Pré-requisitos
- Conta na Vercel (https://vercel.com)
- Repositório Git (GitHub, GitLab ou Bitbucket)
- Código commitado e enviado para o repositório

## Passos para Deploy

### 1. Preparar o Repositório
```bash
git add .
git commit -m "Preparando para deploy na Vercel"
git push origin main
```

### 2. Conectar na Vercel
1. Acesse https://vercel.com/dashboard
2. Clique em "New Project"
3. Conecte seu repositório Git
4. Selecione o repositório do projeto

### 3. Configurar Variáveis de Ambiente
Na Vercel, adicione as seguintes variáveis de ambiente:

**Obrigatórias:**
- `DATABASE_URL` - URL do banco PostgreSQL
- `NEXTAUTH_SECRET` - Chave secreta para autenticação
- `NEXTAUTH_URL` - URL da aplicação (será preenchida automaticamente)

**Opcionais:**
- `NODE_ENV=production`

### 4. Configurar Banco de Dados

#### Opção 1: Vercel Postgres (Recomendado)
1. No dashboard da Vercel, vá em "Storage"
2. Clique em "Create Database"
3. Selecione "Postgres"
4. As variáveis de ambiente serão configuradas automaticamente

#### Opção 2: Banco Externo
Configure a `DATABASE_URL` com a string de conexão do seu provedor:
```
postgresql://username:password@host:port/database
```

### 5. Deploy
1. Clique em "Deploy"
2. Aguarde o build e deploy
3. A aplicação estará disponível na URL fornecida

## Comandos Importantes

### Build Local (para teste)
```bash
npm run build:local
```

### Build para Produção (com migrações)
```bash
npm run build
```

## Troubleshooting

### Erro de Migração
Se houver erro nas migrações, verifique:
1. Se a `DATABASE_URL` está correta
2. Se o banco está acessível
3. Se as permissões estão corretas

### Erro de Build
1. Verifique se todas as dependências estão no package.json
2. Execute `npm run build:local` localmente primeiro
3. Verifique os logs de build na Vercel

## Pós-Deploy

### Criar Usuário Administrador
Após o deploy, acesse a aplicação e registre o primeiro usuário como administrador.

### Verificar Funcionalidades
1. Login/Registro
2. Dashboard
3. Criação de posts
4. Check-ins
5. Ranking

## URLs Importantes
- Dashboard da Vercel: https://vercel.com/dashboard
- Documentação: https://vercel.com/docs
- Suporte: https://vercel.com/support