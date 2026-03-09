-- 1. Limpar procedimentos antigos e testes para não haver duplicados
TRUNCATE TABLE modelos_procedimento CASCADE;

-- 2. Criar os Procedimentos baseados no PDF (Custo e Preço de Venda ao Público fictício para testares o lucro)
INSERT INTO modelos_procedimento (id, nome, custo_total_estimado, preco_servico) VALUES
(1, 'Consulta Avaliação', 0.58, 30.00),
(2, 'Exodontia', 5.47, 60.00),
(3, 'Restauracao', 4.33, 70.00),
(4, 'Endo Sessão 1', 5.72, 120.00),
(5, 'Endo Sessão 2', 4.52, 120.00),
(6, 'Ortodontia Tradicional TP', 187.10, 800.00),
(7, 'Cirurgia Implante', 246.29, 900.00);

-- 3. Injetar todos os materiais e os cêntimos ao milímetro para cada procedimento
INSERT INTO modelo_procedimento_itens (modelo_id, nome_item, quantidade, preco_unitario) VALUES
-- =====================================
-- 1. CONSULTA DE AVALIAÇÃO
-- =====================================
(1, 'Manga Esterilizacao (200 mts)', 1, 0.33),
(1, 'Caixa Luvas (100 un)', 2, 0.075), 
(1, 'Aspirador Saliva (100 un)', 1, 0.03),
(1, 'Babetes (500 un)', 1, 0.03),
(1, 'Copos Plastico (3000 un)', 1, 0.02),
(1, 'Garrafao Colotorio (10 lts)', 1, 0.02),

-- =====================================
-- 2. EXODONTIA
-- =====================================
(2, 'Caixa suturas Seda (12 un)', 1, 1.53),
(2, 'Caixa Spongostan (24 un)', 1, 0.96),
(2, 'Caixa Anestubos (50 un)', 3, 0.92), 
(2, 'Caixa Agulhas (100 un)', 1, 0.08),
(2, 'Alavanca', 1, 0.02),
(2, 'Boticao', 1, 0.02),
(2, 'Sindesmotomo', 1, 0.02),
(2, 'Broca Osso', 1, 0.02),
(2, 'Tesoura', 1, 0.02),
(2, 'Porta Agulhas', 1, 0.02),

-- =====================================
-- 3. RESTAURAÇÃO
-- =====================================
(3, 'Bisnaga Composito (4 grs)', 1, 1.83),
(3, 'Bisnaga Acido (12 grs)', 1, 0.12),
(3, 'Bisnaga Bonding (5 ml)', 1, 0.25),
(3, 'Cunha Madeira (100 un)', 1, 0.06),
(3, 'Matriz Metalica (3 mts)', 1, 0.12),
(3, 'Bisnaga Ionoseal (4 ml)', 1, 0.91),
(3, 'Bisnaga Flow (1 gr)', 1, 0.91),
(3, 'Broca Laminada', 1, 0.02),
(3, 'Broca Esferica', 1, 0.02),
(3, 'Broca Polimento', 1, 0.02),
(3, 'Broca Chama', 1, 0.02),
(3, 'Porta Matriz', 1, 0.02),
(3, 'Caixa Micro Brush (100 un)', 1, 0.03),

-- =====================================
-- 4. ENDO SESSÃO 1
-- =====================================
(4, 'Caixa Anestubos (50 un)', 1, 2.76),
(4, 'Caixa Agulhas (100 un)', 1, 0.08),
(4, 'Caixa Limas Reciproc (3 un)', 1, 1.68),
(4, 'Hipoclorito (250 ml)', 1, 0.09),
(4, 'Cavit (38 grs)', 1, 0.16),
(4, 'Caixas de Dique (36 un)', 1, 0.27),
(4, 'Saco Borrachas Raio X (100 un)', 1, 0.02),
(4, 'Caixa Limas Manuais (6 un)', 1, 0.48),
(4, 'Caixa Canulas Irrigação (100 un)', 1, 0.18),

-- =====================================
-- 5. ENDO SESSÃO 2
-- =====================================
(5, 'Caixa Cones Papel (100 un)', 1, 0.38),
(5, 'Caixa Gutta Percha (60 un)', 1, 0.55),
(5, 'Hipoclorito (250 ml)', 1, 0.09),
(5, 'Bisnaga Cimento Radicular (16 grs)', 1, 1.96),
(5, 'Cavit (38 grs)', 1, 0.16),
(5, 'Bisnaga Ionoseal (4 ml)', 1, 0.91),
(5, 'Saco Borrachas Raio X (100 un)', 1, 0.02),
(5, 'Caixas de Dique (36 un)', 1, 0.27),
(5, 'Caixa Canulas Irrigação (100 un)', 1, 0.18),

-- =====================================
-- 6. ORTODONTIA TRADICIONAL TP
-- =====================================
(6, 'Kit Brackets TP (1 un)', 1, 98.95),
(6, 'Arco 0,16 Aco com loop', 1, 14.68),
(6, 'Caixa de Arcos (10 un)', 5, 1.56), 
(6, 'Bisnaga Composito (4 grs)', 1, 10.98),
(6, 'Bisnaga Acido (12 grs)', 1, 2.88),
(6, 'Bisnaga Bonding (5 ml)', 1, 6.00),
(6, 'Elásticos Cores Brackets', 1, 0.21),
(6, 'Elásticos Tracao Mandibular', 1, 0.30),
(6, 'Arco 19,75 Aco', 1, 1.56),
(6, 'Bandas Ortodonticas', 4, 6.82),

-- =====================================
-- 7. CIRURGIA IMPLANTE
-- =====================================
(7, 'Caixa Anestubos (50 un)', 1, 2.76),
(7, 'Bisturi', 1, 0.08),
(7, 'Caixa Suturas Poliamida (12 un)', 1, 5.06),
(7, 'Kit Cirúrgico', 1, 9.82),
(7, 'Kit Implantologia', 1, 0.08),
(7, 'Soro', 1, 0.02),
(7, 'Implante (1 un)', 1, 202.01),
(7, 'Aspirador Cirúrgico', 1, 0.02),
(7, 'Broca Piloto', 1, 1.05),
(7, 'Broca Implante 1', 1, 1.05),
(7, 'Broca Implante 2', 1, 1.05),
(7, 'Broca Implante 3', 1, 1.05),
(7, 'Broca Implante 4', 1, 1.05),
(7, 'Caixa Linhas Irrigação (10 un)', 1, 10.39),
(7, 'Caixa Agulhas (100 un)', 1, 0.08),
(7, 'Osso (1 un)', 1, 10.72);

-- Atualiza a contagem dos IDs para que o próximo procedimento que cries não dê erro
SELECT setval('modelos_procedimento_id_seq', (SELECT MAX(id) FROM modelos_procedimento));