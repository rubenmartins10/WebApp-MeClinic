
-- Criar uma categoria e dois produtos de teste
INSERT INTO categorias (nome) VALUES ('Consumíveis');

INSERT INTO produtos (categoria_id, nome, codigo_barras, stock_atual, stock_minimo, unidade_medida) 
VALUES 
(1, 'Luvas de Látex M', '123456789', 100, 20, 'un'),
(1, 'Máscaras Cirúrgicas', '987654321', 10, 50, 'un'); -- Este vai disparar alerta de stock baixo!