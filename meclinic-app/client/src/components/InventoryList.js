import React, { useState, useEffect } from 'react';

function InventoryList() {
  const [produtos, setProdutos] = useState([]);

  useEffect(() => {
    // Chama a tua API Node.js na porta 5000
    fetch("http://localhost:5000/api/produtos")
      .then(res => res.json())
      .then(data => setProdutos(data))
      .catch(err => console.error("Erro ao carregar inventário:", err));
  }, []);

  return (
    <div className="inventory-container">
      <h2>Inventário Real [cite: 632]</h2>
      <table>
        <thead>
          <tr>
            <th>Produto </th>
            <th>Stock </th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {produtos.map(p => (
            <tr key={p.id}>
              <td>{p.nome}</td>
              <td>{p.stock_atual} {p.unidade_medida}</td>
              <td>
                {/* Lógica do Req-10: Alerta de stock baixo  */}
                {p.stock_atual <= p.stock_minimo ? 
                  <span style={{color: 'red'}}>URGENTE [cite: 621]</span> : 
                  <span style={{color: 'green'}}>OK</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default InventoryList;