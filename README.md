# Impravaveis BJJ MVP

Sistema de gestão para academia de Jiu-Jitsu com design estilo Discord.

## 🥋 Funcionalidades

### Para Alunos
- ✅ Check-in diário
- 📊 Visualização de frequência
- 👥 Lista de alunos ativos
- 📱 Interface responsiva (PWA)

### Para Professores
- ✅ Aprovação de check-ins
- 👥 Gestão de alunos
- 📊 Estatísticas da academia
- ✏️ Edição de dados dos alunos

### Para Administradores
- 👤 CRUD completo de usuários
- 🎯 Gestão de roles e permissões
- 📊 Dashboard completo
- ⚙️ Configurações do sistema

## 🚀 Tecnologias

- **Frontend**: Next.js 14, TypeScript, Ant Design
- **Backend**: Next.js API Routes
- **Banco de Dados**: MySQL
- **Autenticação**: JWT + bcrypt
- **Estilo**: Tailwind CSS + tema Discord
- **PWA**: Manifest + Service Worker

## 📋 Pré-requisitos

- Node.js 18+
- MySQL (XAMPP recomendado)
- npm ou yarn

## 🛠️ Instalação

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd MVP-IMPROVAVEISBJJ
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure o banco de dados

#### Usando XAMPP:
1. Inicie o XAMPP
2. Acesse phpMyAdmin (http://localhost/phpmyadmin)
3. Crie um banco chamado `bjj_academy`
4. Execute o script SQL em `database/schema.sql`

#### Configuração manual:
```sql
CREATE DATABASE bjj_academy;
USE bjj_academy;
-- Execute o conteúdo de database/schema.sql
```

### 4. Configure as variáveis de ambiente
Copie o arquivo `.env.local` e ajuste as configurações:

```env
# Banco de dados
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=bjj_academy

# JWT
JWT_SECRET=seu_jwt_secret_super_seguro_aqui

# NextAuth (futuro)
NEXTAUTH_SECRET=seu_nextauth_secret_aqui
NEXTAUTH_URL=http://localhost:3000
```

### 5. Execute o projeto
```bash
npm run dev
```

Acesse: http://localhost:3000

## 👤 Usuários de Teste

O sistema vem com usuários pré-cadastrados:

### Admin
- **Email**: admin@bjj.com
- **Senha**: admin123
- **Acesso**: CRUD completo

### Professor
- **Email**: professor@bjj.com
- **Senha**: prof123
- **Acesso**: Gestão de alunos e aprovações

### Aluno
- **Email**: aluno@bjj.com
- **Senha**: aluno123
- **Acesso**: Check-in e visualização

## 📱 PWA (Progressive Web App)

O sistema funciona como PWA:

1. **Desktop**: Clique no ícone de instalação no navegador
2. **Mobile**: Use "Adicionar à tela inicial"
3. **Funciona offline**: Cache básico implementado

## 🎨 Design System

### Cores (Tema Discord)
- **Primary**: #5865f2 (Discord Blurple)
- **Background**: #36393f (Discord Dark)
- **Surface**: #2f3136 (Discord Darker)
- **Text**: #dcddde (Discord Light Gray)

### Responsividade
- **Mobile First**: Design otimizado para mobile
- **Breakpoints**: 480px, 768px, 1024px
- **Touch Friendly**: Botões com 44px mínimo

## 📊 Estrutura do Banco

### Tabelas
- **users**: Usuários do sistema
- **checkins**: Registros de frequência

### Relacionamentos
- User 1:N CheckIns
- Roles: admin, professor, aluno
- Status: ativo/inativo

## 🔐 Autenticação

### JWT Token
- **Expiração**: 24 horas
- **Payload**: id, email, role
- **Storage**: localStorage (frontend)

### Permissões
- **Admin**: Acesso total
- **Professor**: Gestão de alunos
- **Aluno**: Apenas próprios dados

## 🚀 Deploy

### Vercel (Recomendado)
```bash
npm install -g vercel
vercel
```

### Docker
```dockerfile
# Dockerfile incluído no projeto
docker build -t bjj-academy .
docker run -p 3000:3000 bjj-academy
```

## 📝 Scripts Disponíveis

```bash
npm run dev          # Desenvolvimento
npm run build        # Build de produção
npm run start        # Servidor de produção
npm run lint         # Linting
npm run type-check   # Verificação de tipos
```

## 🔧 Configurações Avançadas

### Customização do Tema
Edite `src/app/globals.css` para personalizar cores e estilos.

### Novas Funcionalidades
1. Adicione tipos em `src/types/index.ts`
2. Crie APIs em `src/app/api/`
3. Implemente componentes em `src/components/`

### Banco de Dados
Para adicionar novas tabelas, edite `database/schema.sql` e crie migrations.

## 🐛 Troubleshooting

### Erro de Conexão com Banco
1. Verifique se o MySQL está rodando
2. Confirme as credenciais no `.env.local`
3. Teste a conexão: `mysql -u root -p`

### Erro de Build
1. Limpe o cache: `npm run clean`
2. Reinstale dependências: `rm -rf node_modules && npm install`
3. Verifique tipos TypeScript: `npm run type-check`

### PWA não Funciona
1. Verifique se está em HTTPS (produção)
2. Confirme o manifest.json
3. Teste em modo incógnito

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique a documentação
2. Consulte os logs do console
3. Abra uma issue no repositório

## 📄 Licença

MIT License - veja LICENSE.md para detalhes.

---

**Desenvolvido com ❤️ para a comunidade BJJ**