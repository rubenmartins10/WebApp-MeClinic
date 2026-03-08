// client/src/pages/Consultas.js
import React, { useState, useEffect, useContext } from 'react';
import { Calendar as CalendarIcon, UserPlus, Save } from 'lucide-react';
import 'react-phone-number-input/style.css';
import PhoneInput from 'react-phone-number-input';
import { ThemeContext } from '../ThemeContext';

const Consultas = () => {
  const { theme } = useContext(ThemeContext);
  const [consultas, setConsultas] = useState([]);
  const [procedimentos, setProcedimentos] = useState([]);
  const [formData, setFormData] = useState({
    nome: '', telefone: '', data: '', hora: '', motivo: '', procedimento_id: ''
  });

  const API_CONSULTAS = 'http://localhost:5000/api/consultas';
  const API_PROCEDIMENTOS = 'http://localhost:5000/api/modelos-procedimento';

  const inputStyle = {
    border: `1px solid ${theme.border}`,
    padding: '12px',
    borderRadius: '8px',
    width: '100%',
    boxSizing: 'border-box',
    marginBottom: '15px',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: theme.pageBg,
    color: theme.text
  };

  const carregarDados = () => {
    fetch(API_CONSULTAS)
      .then(res => res.json())
      .then(data => setConsultas(Array.isArray(data) ? data : []))
      .catch(err => console.error("Erro consultas:", err));

    fetch(API_PROCEDIMENTOS)
      .then(res => res.json())
      .then(data => setProcedimentos(Array.isArray(data) ? data : []))
      .catch(err => console.error("Erro procedimentos:", err));
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(API_CONSULTAS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        alert("Consulta agendada com sucesso!");
        setFormData({ nome: '', telefone: '', data: '', hora: '', motivo: '', procedimento_id: '' });
        carregarDados();
      }
    } catch (err) {
      alert("Erro ao conectar ao servidor.");
    }
  };

  return (
    <div style={{ padding: '10px', transition: 'all 0.3s ease' }}>
      <style>{`
        .custom-phone-wrapper {
          border: 1px solid ${theme.border};
          padding: 12px;
          border-radius: 8px;
          width: 100%;
          box-sizing: border-box;
          margin-bottom: 15px;
          font-size: 14px;
          background-color: ${theme.pageBg};
          display: flex;
          align-items: center;
        }
        .custom-phone-wrapper .PhoneInputInput {
          border: none;
          outline: none;
          background: transparent;
          font-size: 14px;
          width: 100%;
          color: ${theme.text};
        }
      `}</style>

      <h1 style={{ fontSize: '26px', fontWeight: 'bold', marginBottom: '30px', color: theme.text, display: 'flex', alignItems: 'center', gap: '12px' }}>
        <CalendarIcon size={28} color="#2563eb" /> Gestão de Consultas
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '30px', alignItems: 'start' }}>
        
        <div style={{ backgroundColor: theme.cardBg, padding: '25px', borderRadius: '15px', border: `1px solid ${theme.border}` }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: theme.text, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <UserPlus size={20} /> Nova Marcação
          </h2>
          <form onSubmit={handleSubmit}>
            <input 
              style={inputStyle} type="text" placeholder="Nome do Paciente" required
              value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})}
            />
            
            <PhoneInput
              international
              defaultCountry="PT"
              placeholder="Telemóvel"
              className="custom-phone-wrapper"
              value={formData.telefone}
              onChange={value => setFormData({...formData, telefone: value})}
            />
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: theme.subText, display: 'block', marginBottom: '5px', textTransform: 'uppercase' }}>Procedimento Clínico</label>
              <select 
                style={inputStyle} 
                required
                value={formData.procedimento_id} 
                onChange={e => setFormData({...formData, procedimento_id: e.target.value})}
              >
                <option value="" style={{color: theme.text, background: theme.pageBg}}>Selecione o procedimento...</option>
                {procedimentos.map(p => (
                  <option key={p.id} value={p.id} style={{color: theme.text, background: theme.pageBg}}>{p.nome}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <input style={{...inputStyle, colorScheme: theme.isDark ? 'dark' : 'light'}} type="date" required value={formData.data} onChange={e => setFormData({...formData, data: e.target.value})} />
              <input style={{...inputStyle, colorScheme: theme.isDark ? 'dark' : 'light'}} type="time" required value={formData.hora} onChange={e => setFormData({...formData, hora: e.target.value})} />
            </div>
            <textarea 
              style={{...inputStyle, height: '80px', resize: 'none'}} placeholder="Notas adicionais..."
              value={formData.motivo} onChange={e => setFormData({...formData, motivo: e.target.value})}
            />
            <button type="submit" style={{ backgroundColor: '#2563eb', color: 'white', padding: '14px', borderRadius: '8px', border: 'none', cursor: 'pointer', width: '100%', fontWeight: '600' }}>
              <Save size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Confirmar Agenda
            </button>
          </form>
        </div>

        <div style={{ backgroundColor: theme.cardBg, padding: '25px', borderRadius: '15px', border: `1px solid ${theme.border}`, minHeight: '500px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: theme.text }}>Próximas Marcações</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {consultas.length === 0 ? (
              <p style={{ color: theme.subText, fontStyle: 'italic', textAlign: 'center', marginTop: '50px' }}>Nenhuma consulta agendada.</p>
            ) : (
              consultas.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px', borderLeft: '5px solid #2563eb', backgroundColor: theme.pageBg, borderRadius: '10px', border: `1px solid ${theme.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ backgroundColor: theme.isDark ? '#1e3a8a' : '#eff6ff', padding: '8px 12px', borderRadius: '6px', marginRight: '15px', textAlign: 'center', minWidth: '60px' }}>
                      <span style={{ fontWeight: 'bold', color: theme.isDark ? '#bfdbfe' : '#2563eb' }}>{c.hora_consulta.substring(0,5)}</span>
                    </div>
                    <div>
                      <h4 style={{ margin: 0, color: theme.text, fontSize: '16px' }}>{c.paciente_nome}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px' }}>
                        <span style={{ fontSize: '12px', backgroundColor: theme.isDark ? '#064e3b' : '#dcfce7', color: theme.isDark ? '#6ee7b7' : '#166534', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>
                          {c.procedimento_nome || 'Consulta Geral'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', color: theme.subText, fontWeight: '500' }}>
                    {new Date(c.data_consulta).toLocaleDateString('pt-PT')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Consultas;