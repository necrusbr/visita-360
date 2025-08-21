# 🚀 Migração do Visita360: Supabase → MariaDB/MySQL Local

Este projeto foi migrado do Supabase para MariaDB/MySQL local com API PHP para funcionar offline e com phpMyAdmin.

## 📋 **O que foi alterado:**

### **1. Banco de Dados**
- ✅ **Schema SQL** para MariaDB/MySQL (`database/schema.sql`)
- ✅ **Tabelas normalizadas** com foreign keys
- ✅ **Views** para facilitar consultas
- ✅ **Índices** para performance

### **2. Backend API**
- ✅ **API PHP** (`api/index.php`) para substituir Supabase
- ✅ **Endpoints REST** para CRUD de visitas e follow-ups
- ✅ **CORS configurado** para desenvolvimento local
- ✅ **Tratamento de erros** robusto

### **3. Frontend**
- ✅ **Hook atualizado** (`useMariaDBData.ts`) para API local
- ✅ **Tipos compatíveis** com a nova estrutura
- ✅ **Fallback** para localStorage quando API não disponível

## 🛠️ **Como configurar:**

### **Passo 1: Instalar MariaDB/MySQL**
```bash
# Executar script de instalação
./install-mariadb.sh

# OU instalar manualmente:
sudo apt install mariadb-server mariadb-client
sudo systemctl start mariadb
sudo systemctl enable mariadb
sudo mysql_secure_installation
```

### **Passo 2: Criar banco de dados**
```sql
CREATE DATABASE visita360 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'visita360'@'localhost' IDENTIFIED BY 'visita360123';
GRANT ALL PRIVILEGES ON visita360.* TO 'visita360'@'localhost';
FLUSH PRIVILEGES;
```

### **Passo 3: Executar schema**
```bash
sudo mysql -u root -p visita360 < database/schema.sql
```

### **Passo 4: Iniciar servidor PHP**
```bash
cd api
php -S localhost:8000
```

### **Passo 5: Rodar projeto React**
```bash
npm run dev
```

## 🌐 **URLs de acesso:**

- **Frontend**: http://localhost:8080
- **API Backend**: http://localhost:8000/api
- **phpMyAdmin**: http://localhost/phpmyadmin (se instalado)

## 📊 **Estrutura do Banco:**

### **Tabelas principais:**
- `segmentos` - Tipos de segmento (Empreiteiras, Engenharias, etc.)
- `responsaveis` - Tipos de responsável (Eng Civil, Arquiteto, etc.)
- `estagios` - Estágios da visita (Inicial, Intermediário, etc.)
- `classificacoes` - Classificação do cliente (Forte, Médio, Fraco)
- `followup_status` - Status dos follow-ups
- `motivos_perda` - Motivos de perda de vendas
- `visitas` - Visitas principais
- `followups` - Follow-ups das visitas

### **Views úteis:**
- `visitas_completa` - Visitas com nomes dos enums
- `followups_completo` - Follow-ups com nomes dos enums

## 🔧 **Configurações:**

### **Arquivo de configuração:**
```javascript
// config.local.js
export const DB_CONFIG = {
  host: 'localhost',
  port: 3306,
  database: 'visita360',
  user: 'root',
  password: ''
};
```

### **Variáveis de ambiente:**
```bash
VITE_DB_HOST=localhost
VITE_DB_PORT=3306
VITE_DB_NAME=visita360
VITE_DB_USER=root
VITE_DB_PASSWORD=
VITE_API_URL=http://localhost:8000/api
```

## 📱 **Funcionalidades mantidas:**

- ✅ Dashboard com KPIs e gráficos
- ✅ Cadastro de visitas com geolocalização
- ✅ Gestão de follow-ups
- ✅ Mapa interativo
- ✅ Relatórios e exportações
- ✅ Configurações personalizáveis
- ✅ Tema claro/escuro
- ✅ Interface responsiva

## 🚧 **Funcionalidades a implementar:**

- [ ] Endpoints PUT/DELETE para edição/exclusão
- [ ] Upload de imagens para servidor local
- [ ] Sistema de usuários e autenticação
- [ ] Backup automático do banco
- [ ] Logs de auditoria

## 🔍 **Endpoints da API:**

### **GET /api/enums**
Retorna todos os valores dos enums (segmentos, responsáveis, etc.)

### **GET /api/visitas**
Lista todas as visitas

### **POST /api/visitas**
Cria uma nova visita

### **GET /api/followups**
Lista todos os follow-ups

### **POST /api/followups**
Cria um novo follow-up

### **POST /api/reset**
Reseta todos os dados (apenas desenvolvimento)

## 🐛 **Solução de problemas:**

### **Erro de conexão com banco:**
1. Verificar se MariaDB está rodando: `sudo systemctl status mariadb`
2. Verificar credenciais no arquivo `api/index.php`
3. Testar conexão: `mysql -u root -p`

### **Erro de CORS:**
1. Verificar se servidor PHP está rodando na porta 8000
2. Verificar arquivo `.htaccess` na pasta `api/`
3. Verificar headers no `index.php`

### **Erro de permissão:**
1. Verificar se usuário tem acesso ao banco
2. Executar: `GRANT ALL PRIVILEGES ON visita360.* TO 'root'@'localhost';`

## 📈 **Vantagens da migração:**

- 🚀 **Performance local** - Sem latência de rede
- 💰 **Sem custos** - Banco local gratuito
- 🔒 **Controle total** - Dados em sua infraestrutura
- 🛠️ **Personalização** - Modificar estrutura conforme necessário
- 📱 **Offline** - Funciona sem internet
- 🎯 **phpMyAdmin** - Interface visual para gerenciar dados

## 🎉 **Status da migração:**

**✅ COMPLETO** - Sistema funcional com MariaDB/MySQL local
**🔄 PRÓXIMO** - Implementar endpoints de edição/exclusão
**📱 FUTURO** - Sistema de usuários e autenticação

---

**Desenvolvido por:** necrusbr  
**Data da migração:** Agosto 2025  
**Versão:** 1.0.0
