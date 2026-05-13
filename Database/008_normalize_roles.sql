-- Migration 008: Normalizar roles para sistema simplificado (ADMIN / ASSISTENTE)
-- DENTISTA → ASSISTENTE, SUPER_ADMIN → ADMIN

UPDATE utilizadores SET role = 'ASSISTENTE' WHERE role = 'DENTISTA';
UPDATE utilizadores SET role = 'ADMIN'      WHERE role = 'SUPER_ADMIN';
