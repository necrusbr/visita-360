#!/bin/bash

echo "🚀 Instalando e configurando MariaDB/MySQL para Visita360..."

# Verificar se MariaDB/MySQL está instalado
if ! command -v mysql &> /dev/null && ! command -v mariadb &> /dev/null; then
    echo "📦 Instalando MariaDB..."
    sudo apt update
    sudo apt install -y mariadb-server mariadb-client
    sudo systemctl start mariadb
    sudo systemctl enable mariadb
else
    echo "✅ MariaDB/MySQL já está instalado"
fi

# Configurar MariaDB
echo "🔧 Configurando MariaDB..."
sudo mysql_secure_installation

# Criar banco de dados e usuário
echo "🗄️ Criando banco de dados..."
sudo mysql -u root -p << EOF
CREATE DATABASE IF NOT EXISTS visita360 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'visita360'@'localhost' IDENTIFIED BY 'visita360123';
GRANT ALL PRIVILEGES ON visita360.* TO 'visita360'@'localhost';
FLUSH PRIVILEGES;
EOF

# Executar schema SQL
echo "📋 Executando schema do banco..."
sudo mysql -u root -p visita360 < database/schema.sql

echo "✅ Instalação concluída!"
echo ""
echo "📝 Próximos passos:"
echo "1. Iniciar servidor PHP: php -S localhost:8000 -t api/"
echo "2. Rodar o projeto: npm run dev"
echo "3. Acessar: http://localhost:8080"
echo ""
echo "🔗 phpMyAdmin: http://localhost/phpmyadmin (se instalado)"
