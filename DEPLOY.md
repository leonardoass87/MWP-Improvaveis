# Deploy para Produção - Vercel

Este guia explica como fazer o deploy da aplicação BJJ Academy para produção na Vercel.

## Pré-requisitos

1. **Conta na Vercel**: Certifique-se de ter uma conta ativa na [Vercel](https://vercel.com)
2. **Banco de dados MySQL**: Configure um banco de dados MySQL em produção (recomendações abaixo)
3. **Repositório Git**: Seu código deve estar em um repositório Git (GitHub, GitLab, etc.)

## 1. Configuração do Banco de Dados

### Opções recomendadas para banco de dados em produção:

#### PlanetScale (Recomendado)
- Acesse [PlanetScale](https://planetscale.com)
- Crie uma nova database
- Obtenha as credenciais de conexão

#### Railway
- Acesse [Railway](https://railway.app)
- Crie um novo projeto MySQL
- Obtenha as credenciais de conexão

#### Outras opções
- AWS RDS
- Google Cloud SQL
- DigitalOcean Managed Databases

### Configuração do Schema

1. Execute o script de criação das tabelas no seu banco de produção:
```sql
-- Execute o conteúdo do arquivo database/schema.sql
-- Certifique-se de que as tabelas users, checkins e posts sejam criadas
```

2. Crie um usuário administrador:
```sql
INSERT INTO users (name, email, password, role, belt, degree, active) 
VALUES ('Admin', 'admin@bjjacademy.com', '$2b$10$hashedpassword', 'admin', 'black', 5, true);
```

## 2. Deploy na Vercel

### Método 1: Via Dashboard da Vercel (Recomendado)

1. **Conecte seu repositório**:
   - Acesse [Vercel Dashboard](https://vercel.com/dashboard)
   - Clique em "New Project"
   - Conecte seu repositório Git
   - Selecione o repositório da aplicação

2. **Configure as variáveis de ambiente**:
   - Na seção "Environment Variables", adicione:
   ```
   DB_HOST=seu-host-do-banco
   DB_PORT=3306
   DB_USER=seu-usuario-do-banco
   DB_PASSWORD=sua-senha-do-banco
   DB_NAME=bjj_academy
   JWT_SECRET=sua-chave-jwt-super-secreta
   NEXTAUTH_URL=https://seu-dominio.vercel.app
   NEXTAUTH_SECRET=sua-chave-nextauth-secreta
   ```

3. **Deploy**:
   - Clique em "Deploy"
   - Aguarde o build e deploy automático

### Método 2: Via CLI da Vercel

1. **Instale a CLI da Vercel**:
```bash
npm i -g vercel
```

2. **Login na Vercel**:
```bash
vercel login
```

3. **Configure o projeto**:
```bash
vercel
```

4. **Configure as variáveis de ambiente**:
```bash
vercel env add DB_HOST
vercel env add DB_PORT
vercel env add DB_USER
vercel env add DB_PASSWORD
vercel env add DB_NAME
vercel env add JWT_SECRET
vercel env add NEXTAUTH_URL
vercel env add NEXTAUTH_SECRET
```

5. **Deploy para produção**:
```bash
vercel --prod
```

## 3. Configurações Importantes

### Geração de Chaves Secretas

Para gerar chaves seguras para produção:

```bash
# JWT Secret
openssl rand -base64 32

# NextAuth Secret
openssl rand -base64 32
```

### Configuração do NEXTAUTH_URL

- Para produção: `https://seu-dominio.vercel.app`
- Para staging: `https://seu-branch-hash.vercel.app`

### Configuração do Banco de Dados

Certifique-se de que:
- O banco aceita conexões SSL
- As credenciais estão corretas
- O banco tem as tabelas necessárias criadas

## 4. Verificação Pós-Deploy

Após o deploy, verifique:

1. **Acesso à aplicação**: Teste se a URL está funcionando
2. **Login**: Teste o login com as credenciais do admin
3. **Funcionalidades**: Teste as principais funcionalidades:
   - Dashboard do admin
   - Gestão de usuários
   - Gestão de posts
   - Check-ins (se aplicável)

## 5. Monitoramento

### Logs da Vercel
- Acesse o dashboard da Vercel
- Vá para "Functions" > "View Function Logs"
- Monitore erros e performance

### Variáveis de Ambiente
- Nunca commite arquivos `.env` com dados reais
- Use o dashboard da Vercel para gerenciar variáveis de ambiente
- Mantenha backups seguros das configurações

## 6. Domínio Personalizado (Opcional)

1. **Configure um domínio personalizado**:
   - No dashboard da Vercel, vá para "Settings" > "Domains"
   - Adicione seu domínio personalizado
   - Configure os DNS conforme instruções

2. **Atualize NEXTAUTH_URL**:
   - Altere a variável para seu domínio personalizado
   - Redeploy a aplicação

## 7. Troubleshooting

### Problemas Comuns

1. **Erro de conexão com banco**:
   - Verifique as credenciais
   - Confirme se o banco aceita conexões externas
   - Verifique se as tabelas existem

2. **Erro de autenticação**:
   - Verifique JWT_SECRET e NEXTAUTH_SECRET
   - Confirme NEXTAUTH_URL está correto

3. **Build falha**:
   - Verifique se todas as dependências estão no package.json
   - Confirme se não há erros de TypeScript

### Comandos Úteis

```bash
# Ver logs em tempo real
vercel logs

# Listar deployments
vercel ls

# Ver informações do projeto
vercel inspect
```

## 8. Backup e Segurança

1. **Backup do banco de dados**: Configure backups automáticos
2. **Monitoramento**: Configure alertas para downtime
3. **SSL**: A Vercel fornece SSL automático
4. **Variáveis de ambiente**: Mantenha-as seguras e atualizadas

---

**Importante**: Sempre teste em um ambiente de staging antes de fazer deploy para produção!