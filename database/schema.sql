-- Visita360 - Schema para MariaDB/MySQL
-- Baseado nas migrações do Supabase

-- Criar banco de dados
CREATE DATABASE IF NOT EXISTS visita360 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE visita360;

-- Tabela de segmentos
CREATE TABLE IF NOT EXISTS segmentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de responsáveis
CREATE TABLE IF NOT EXISTS responsaveis (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de estágios
CREATE TABLE IF NOT EXISTS estagios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de classificações
CREATE TABLE IF NOT EXISTS classificacoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(20) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de status de follow-up
CREATE TABLE IF NOT EXISTS followup_status (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de motivos de perda
CREATE TABLE IF NOT EXISTS motivos_perda (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir dados padrão nos enums
INSERT IGNORE INTO segmentos (nome) VALUES 
  ('Empreiteiras'), ('Engenharias'), ('Arquitetura'), ('Particular'), ('Condomínio');

INSERT IGNORE INTO responsaveis (nome) VALUES 
  ('Eng Civil'), ('Mestre de Obras'), ('Arquiteto'), ('Outros'), ('Síndico'), ('Zelador');

INSERT IGNORE INTO estagios (nome) VALUES 
  ('Inicial'), ('Intermediário'), ('Final'), ('Reforma');

INSERT IGNORE INTO classificacoes (nome) VALUES 
  ('Forte'), ('Médio'), ('Fraco');

INSERT IGNORE INTO followup_status (nome) VALUES 
  ('Retornou'), ('Fechou pedido'), ('Orçamento'), ('Consulta preço'), ('Sem retorno');

INSERT IGNORE INTO motivos_perda (nome) VALUES 
  ('Preço menor'), ('Sem retorno'), ('Produto em falta'), ('Entrega'), ('Edu não cobriu'), ('Outros');

-- Tabela principal de visitas
CREATE TABLE IF NOT EXISTS visitas (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  data DATE NOT NULL,
  endereco TEXT NOT NULL,
  lat DOUBLE PRECISION NULL,
  lng DOUBLE PRECISION NULL,
  empresa VARCHAR(255) NOT NULL,
  segmento_id INT NOT NULL,
  responsavel_id INT NOT NULL,
  estagio_id INT NOT NULL,
  concorrencia TEXT DEFAULT '',
  classificacao_id INT NOT NULL,
  contato TEXT DEFAULT '',
  obs TEXT DEFAULT '',
  fotos JSON DEFAULT '[]',
  vendedor VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (segmento_id) REFERENCES segmentos(id),
  FOREIGN KEY (responsavel_id) REFERENCES responsaveis(id),
  FOREIGN KEY (estagio_id) REFERENCES estagios(id),
  FOREIGN KEY (classificacao_id) REFERENCES classificacoes(id)
);

-- Tabela de follow-ups
CREATE TABLE IF NOT EXISTS followups (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  visita_id BIGINT NOT NULL,
  data DATE NOT NULL,
  status_id INT NOT NULL,
  valor DECIMAL(10,2) NULL,
  motivo_perda_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (visita_id) REFERENCES visitas(id) ON DELETE CASCADE,
  FOREIGN KEY (status_id) REFERENCES followup_status(id),
  FOREIGN KEY (motivo_perda_id) REFERENCES motivos_perda(id)
);

-- Índices para performance
CREATE INDEX idx_visitas_data ON visitas(data);
CREATE INDEX idx_visitas_vendedor ON visitas(vendedor);
CREATE INDEX idx_visitas_segmento ON visitas(segmento_id);
CREATE INDEX idx_followups_visita_id ON followups(visita_id);
CREATE INDEX idx_followups_data ON followups(data);

-- View para facilitar consultas
CREATE OR REPLACE VIEW visitas_completa AS
SELECT 
  v.*,
  s.nome as segmento_nome,
  r.nome as responsavel_nome,
  e.nome as estagio_nome,
  c.nome as classificacao_nome
FROM visitas v
JOIN segmentos s ON v.segmento_id = s.id
JOIN responsaveis r ON v.responsavel_id = r.id
JOIN estagios e ON v.estagio_id = e.id
JOIN classificacoes c ON v.classificacao_id = c.id;

-- View para follow-ups completos
CREATE OR REPLACE VIEW followups_completo AS
SELECT 
  f.*,
  fs.nome as status_nome,
  mp.nome as motivo_perda_nome
FROM followups f
JOIN followup_status fs ON f.status_id = fs.id
LEFT JOIN motivos_perda mp ON f.motivo_perda_id = mp.id;
