-- Atualiza as Luvas
UPDATE produtos 
SET imagem_url = 'https://images.unsplash.com/photo-1584432810601-6c7f27d2362b?w=500&q=80' 
WHERE nome ILIKE '%luva%';

-- Atualiza as Máscaras
UPDATE produtos 
SET imagem_url = 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=500&q=80' 
WHERE nome ILIKE '%m%scara%';

-- Atualiza as Seringas
UPDATE produtos 
SET imagem_url = 'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=500&q=80' 
WHERE nome ILIKE '%seringa%';

-- Atualiza Material Dentário Genérico / Compósitos
UPDATE produtos 
SET imagem_url = 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=500&q=80' 
WHERE nome ILIKE '%comp%sito%' OR nome ILIKE '%broca%';

-- Atualiza Anestesias ou Medicamentos
UPDATE produtos 
SET imagem_url = 'https://images.unsplash.com/photo-1583324113626-70df0f4deaab?w=500&q=80' 
WHERE nome ILIKE '%anestesia%' OR nome ILIKE '%medicamento%';