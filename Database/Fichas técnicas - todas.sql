-- Limpar dados anteriores se necessário (opcional)
-- DELETE FROM modelos_procedimento;

-- 1. Restauracao (Total: 4.33€)
WITH proc AS (INSERT INTO modelos_procedimento (nome, custo_total_estimado) VALUES ('Restauração', 4.33) RETURNING id)
INSERT INTO modelo_procedimento_itens (modelo_id, nome_item, quantidade, preco_unitario)
SELECT id, item, qtd, preco FROM proc, (VALUES 
    ('Composito', 1, 1.83), ('Acido', 1, 0.12), ('Bonding', 1, 0.25), ('Cunha', 1, 0.06), 
    ('Matriz', 1, 0.12), ('Ionoseal', 1, 0.91), ('Flow', 1, 0.91), ('Broca laminada', 1, 0.02), 
    ('Broca Esferica', 1, 0.02), ('Broca Polimento', 1, 0.02), ('Broca Chama', 1, 0.02), 
    ('Porta Matriz', 1, 0.02), ('Micro Brush', 1, 0.03)
) AS t(item, qtd, preco);

-- 2. Endo Sessão 1 (Total: 5.72€)
WITH proc AS (INSERT INTO modelos_procedimento (nome, custo_total_estimado) VALUES ('Endo Sessão 1', 5.72) RETURNING id)
INSERT INTO modelo_procedimento_itens (modelo_id, nome_item, quantidade, preco_unitario)
SELECT id, item, qtd, preco FROM proc, (VALUES 
    ('Anestubo', 1, 2.76), ('Agulha', 1, 0.08), ('Lima Reciproc', 1, 1.68), ('Hipoclorito', 1, 0.09), 
    ('Cavit', 1, 0.16), ('Dique borracha', 1, 0.27), ('Borracha Raio X', 1, 0.02), 
    ('Limas Manuais', 1, 0.48), ('Canula de irrigacao', 1, 0.18)
) AS t(item, qtd, preco);

-- 3. Endo Sessão 2 (Total: 4.52€)
WITH proc AS (INSERT INTO modelos_procedimento (nome, custo_total_estimado) VALUES ('Endo Sessão 2', 4.52) RETURNING id)
INSERT INTO modelo_procedimento_itens (modelo_id, nome_item, quantidade, preco_unitario)
SELECT id, item, qtd, preco FROM proc, (VALUES 
    ('Cones Papel', 1, 0.38), ('Gutta Percha', 1, 0.55), ('Hipoclorito', 1, 0.09), 
    ('Cimento Radicular', 1, 1.96), ('Cavit', 1, 0.16), ('Ionoseal', 1, 0.91), 
    ('Borracha Raio X', 1, 0.02), ('Dique borracha', 1, 0.27), ('Canula de irrigacao', 1, 0.18)
) AS t(item, qtd, preco);

-- 4. Ortodontia Tradicional TP (Total: 187.10€)
WITH proc AS (INSERT INTO modelos_procedimento (nome, custo_total_estimado) VALUES ('Ortodontia Tradicional TP', 187.10) RETURNING id)
INSERT INTO modelo_procedimento_itens (modelo_id, nome_item, quantidade, preco_unitario)
SELECT id, item, qtd, preco FROM proc, (VALUES 
    ('Kit Brackets', 1, 98.95), ('Arco 0,12 x2 Niti', 1, 1.56), ('Arco 0,14 x2 Niti', 1, 1.56), 
    ('Arco 0,16 x2 Niti', 1, 1.56), ('Arco 0,18 x2 Niti', 1, 1.56), ('Arco 0,20 x2 Niti', 1, 1.56), 
    ('Arco 0,16 Aco com loop', 1, 14.68), ('Arco 0,18 Aco', 1, 1.56), ('Composito', 1, 10.98), 
    ('Acido', 1, 2.88), ('Bonding', 1, 6.00), ('Elasticos Cores Brackets', 1, 0.21), 
    ('Elasticos Tracao mandibular', 1, 0.30), ('Arco 19,75 Aco', 1, 1.56), ('Bandas x4', 1, 27.30), 
    ('24 Consultas', 1, 14.88)
) AS t(item, qtd, preco);

-- 5. Cirurgia Implante (Total: 246.29€)
WITH proc AS (INSERT INTO modelos_procedimento (nome, custo_total_estimado) VALUES ('Cirurgia Implante', 246.29) RETURNING id)
INSERT INTO modelo_procedimento_itens (modelo_id, nome_item, quantidade, preco_unitario)
SELECT id, item, qtd, preco FROM proc, (VALUES 
    ('Anestubo', 1, 2.76), ('Bisturi', 1, 0.08), ('Sutura Poliamida', 1, 5.06), 
    ('Kit Cirúrgico', 1, 9.82), ('Kit Implantologia', 1, 0.08), ('Soro', 1, 0.02), 
    ('Implante', 1, 202.01), ('Aspirador cirúrgico', 1, 0.02), ('Broca Piloto', 1, 1.05), 
    ('Broca 1', 1, 1.05), ('Broca 2', 1, 1.05), ('Broca 3', 1, 1.05), ('Broca 4', 1, 1.05), 
    ('Linha de irrigação', 1, 10.39), ('Agulha', 1, 0.08), ('Osso', 1, 10.72)
) AS t(item, qtd, preco);