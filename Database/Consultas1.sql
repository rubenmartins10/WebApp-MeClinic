SELECT c.id, p.nome as paciente_nome, c.data_consulta, c.hora_consulta 
FROM consultas c
JOIN pacientes p ON c.paciente_id = p.id;