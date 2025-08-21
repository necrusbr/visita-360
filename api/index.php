<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Configurações do banco de dados
$db_config = [
    'host' => 'localhost',
    'port' => 3306,
    'database' => 'visita360',
    'username' => 'root',
    'password' => ''
];

// Conectar ao banco de dados
function getConnection() {
    global $db_config;
    
    try {
        $dsn = "mysql:host={$db_config['host']};port={$db_config['port']};dbname={$db_config['database']};charset=utf8mb4";
        $pdo = new PDO($dsn, $db_config['username'], $db_config['password']);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        return $pdo;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Erro de conexão com banco de dados: ' . $e->getMessage()]);
        exit;
    }
}

// Função para obter dados de enum
function getEnumData($table, $pdo) {
    $stmt = $pdo->prepare("SELECT id, nome FROM {$table} ORDER BY nome");
    $stmt->execute();
    return $stmt->fetchAll();
}

// Função para obter ID do enum por nome
function getEnumId($table, $nome, $pdo) {
    $stmt = $pdo->prepare("SELECT id FROM {$table} WHERE nome = ?");
    $stmt->execute([$nome]);
    $result = $stmt->fetch();
    return $result ? $result['id'] : null;
}

// Roteamento da API
$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);
$path_parts = explode('/', trim($path, '/'));
$endpoint = end($path_parts);

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getConnection();

try {
    switch ($endpoint) {
        case 'enums':
            // Retornar todos os enums
            $enums = [
                'segmentos' => getEnumData('segmentos', $pdo),
                'responsaveis' => getEnumData('responsaveis', $pdo),
                'estagios' => getEnumData('estagios', $pdo),
                'classificacoes' => getEnumData('classificacoes', $pdo),
                'followup_status' => getEnumData('followup_status', $pdo),
                'motivos_perda' => getEnumData('motivos_perda', $pdo)
            ];
            echo json_encode($enums);
            break;

        case 'visitas':
            if ($method === 'GET') {
                // Listar visitas
                $stmt = $pdo->query("SELECT * FROM visitas_completa ORDER BY created_at DESC");
                $visitas = $stmt->fetchAll();
                echo json_encode($visitas);
            } elseif ($method === 'POST') {
                // Criar nova visita
                $data = json_decode(file_get_contents('php://input'), true);
                
                $stmt = $pdo->prepare("
                    INSERT INTO visitas (data, endereco, lat, lng, empresa, segmento_id, responsavel_id, estagio_id, concorrencia, classificacao_id, contato, obs, fotos, vendedor)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                
                $stmt->execute([
                    $data['data'],
                    $data['endereco'],
                    $data['lat'] ?? null,
                    $data['lng'] ?? null,
                    $data['empresa'],
                    getEnumId('segmentos', $data['segmento'], $pdo),
                    getEnumId('responsaveis', $data['responsavel'], $pdo),
                    getEnumId('estagios', $data['estagio'], $pdo),
                    $data['concorrencia'] ?? '',
                    getEnumId('classificacoes', $data['classificacao'], $pdo),
                    $data['contato'] ?? '',
                    $data['obs'] ?? '',
                    json_encode($data['fotos'] ?? []),
                    $data['vendedor']
                ]);
                
                $id = $pdo->lastInsertId();
                echo json_encode(['id' => $id, 'message' => 'Visita criada com sucesso']);
            }
            break;

        case 'followups':
            if ($method === 'GET') {
                // Listar follow-ups
                $stmt = $pdo->query("SELECT * FROM followups_completo ORDER BY created_at DESC");
                $followups = $stmt->fetchAll();
                echo json_encode($followups);
            } elseif ($method === 'POST') {
                // Criar novo follow-up
                $data = json_decode(file_get_contents('php://input'), true);
                
                $stmt = $pdo->prepare("
                    INSERT INTO followups (visita_id, data, status_id, valor, motivo_perda_id)
                    VALUES (?, ?, ?, ?, ?)
                ");
                
                $stmt->execute([
                    $data['visita_id'],
                    $data['data'],
                    getEnumId('followup_status', $data['status'], $pdo),
                    $data['valor'] ?? null,
                    $data['motivo_perda'] ? getEnumId('motivos_perda', $data['motivo_perda'], $pdo) : null
                ]);
                
                $id = $pdo->lastInsertId();
                echo json_encode(['id' => $id, 'message' => 'Follow-up criado com sucesso']);
            }
            break;

        case 'reset':
            if ($method === 'POST') {
                // Resetar dados (apenas para desenvolvimento)
                $pdo->exec("DELETE FROM followups");
                $pdo->exec("DELETE FROM visitas");
                echo json_encode(['message' => 'Dados resetados com sucesso']);
            }
            break;

        default:
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint não encontrado']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro interno: ' . $e->getMessage()]);
}
?>
