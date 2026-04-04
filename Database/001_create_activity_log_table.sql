-- Tabela para rastrear login/atividade de utilizadores
-- Deve ser executada antes dos endpoints de activity

CREATE TABLE IF NOT EXISTS activity_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES utilizadores(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- 'LOGIN', 'LOGOUT', 'UPDATE', 'DELETE', etc
    description TEXT,
    location VARCHAR(255), -- Localização geográfica (ex: Lisboa, PT)
    device_info VARCHAR(255), -- Info do dispositivo (ex: Chrome - Windows)
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    status VARCHAR(20) DEFAULT 'success', -- 'success', 'failed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_id VARCHAR(100), -- Para rastrear sessões activas
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_session_id (session_id)
);

-- Inserir alguns registos de teste (OPCIONAL - apenas para teste)
INSERT INTO activity_log (user_id, action_type, description, location, device_info, ip_address, status, session_id, created_at)
SELECT 
    u.id,
    'LOGIN',
    'Login bem-sucedido',
    CASE 
        WHEN u.nome = 'Admin' THEN 'Lisboa, PT'
        WHEN u.nome = 'Assistente 1' THEN 'Porto, PT'
        ELSE 'Lisboa, PT'
    END as location,
    'Chrome - Windows' as device_info,
    '192.168.1.' || CAST((RANDOM() * 254 + 1)::INT as VARCHAR) as ip_address,
    'success',
    MD5(u.id::TEXT || NOW()::TEXT),
    NOW() - INTERVAL '2 hours'
FROM utilizadores u
WHERE NOT EXISTS (SELECT 1 FROM activity_log WHERE user_id = u.id)
LIMIT 1;
