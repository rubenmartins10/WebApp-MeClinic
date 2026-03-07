-- 1. Criar um paciente
INSERT INTO pacientes (nome, telefone, email) 
VALUES ('Rúben Martins', '912345678', 'ruben@email.com') 
RETURNING id;

-- 2. Marcar uma consulta para esse paciente (Usa o ID que aparecer, ex: 1)
INSERT INTO consultas (paciente_id, data_consulta, hora_consulta, motivo) 
VALUES (1, CURRENT_DATE, '14:30:00', 'Limpeza de rotina');