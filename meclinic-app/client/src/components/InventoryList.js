import React, { useState, useEffect } from 'react';

function InventoryList() {
  const [produtos, setProdutos] = useState([]);

  // Função para carregar os produtos da Base de Dados
  const carregarProdutos = () => {
    fetch("http://localhost:5000/api/produtos")
      .then(res => res.json())
      .then(data => setProdutos(data))
      .catch(err => console.error("Erro ao carregar inventário:", err));
  };

  useEffect(() => {
    carregarProdutos();
  }, []);

  // FUNÇÃO NOVA: Envia um produto para o Backend (POST)
  const adicionarProdutoTeste = async () => {
    const novoProduto = {
      nome: "Seringa 5ml (Teste)",
      codigo_barras: "555666",
      stock_atual: 50,
      stock_minimo: 10,
      unidade_medida: "un",
      categoria_id: 1
    };

    try {
      const response = await fetch("http://localhost:5000/api/produtos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novoProduto)
      });

      if (response.ok) {
        carregarProdutos(); // Atualiza a lista no ecrã
        alert("Produto gravado no PostgreSQL!");
      }
    } catch (err) {
      console.error("Erro ao adicionar:", err);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Inventário Real</h2>
      
      {/* ESTE É O BOTÃO QUE FALTA */}
      <button 
        onClick={adicionarProdutoTeste} 
        style={{ 
          marginBottom: '20px', 
          padding: '10px 20px', 
          backgroundColor: '#2563eb', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        + Adicionar Seringa (Teste de Escrita)
      </button>

      <table border="1" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ backgroundColor: '#f3f4f6' }}>
            <th style={{ padding: '10px' }}>Produto</th>
            <th style={{ padding: '10px' }}>Stock</th>
            <th style={{ padding: '10px' }}>Estado</th>
          </tr>
        </thead>
        <tbody>
          {produtos.map(p => (
            <tr key={p.id}>
              <td style={{ padding: '10px' }}>{p.nome}</td>
              <td style={{ padding: '10px' }}>{p.stock_atual} {p.unidade_medida}</td>
              <td style={{ padding: '10px' }}>
                {p.stock_atual <= p.stock_minimo ? 
                  <span style={{ color: 'red', fontWeight: 'bold' }}>URGENTE</span> : 
                  <span style={{ color: 'green' }}>OK</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default InventoryList;