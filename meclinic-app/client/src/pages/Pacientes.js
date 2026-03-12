import React, { useState, useEffect, useContext } from 'react';
import { Users, Search, User, Phone, Mail, FileText, Calendar, Euro, Save, X, Activity, Clock, CheckCircle } from 'lucide-react';
import { ThemeContext } from '../ThemeContext';
import { LanguageContext } from '../LanguageContext';

const Pacientes = () => {
  const { theme } = useContext(ThemeContext);
  const { t, language } = useContext(LanguageContext);

  const [pacientes, setPacientes] = useState([]);
  const [pesquisa, setPesquisa] = useState('');
  
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [notasClinicas, setNotasClinicas] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '' });

  const activeLocale = language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'pt-PT';

  useEffect(() => { carregarPacientes(); }, []);

  const carregarPacientes = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/pacientes');
      const data = await res.json();
      setPacientes(data);
    } catch (err) { console.error(err); }
  };

  const showNotif = (msg) => {
    setNotification({ show: true, message: msg });
    setTimeout(() => setNotification({ show: false, message: '' }), 3000);
  };

  const abrirFichaPaciente = async (paciente) => {
    setSelectedPaciente(paciente);
    setNotasClinicas(paciente.notas_clinicas || '');
    try {
      const res = await fetch(`http://localhost:5000/api/pacientes/${paciente.id}/historico`);
      const data = await res.json();
      setHistorico(data);
    } catch (err) { console.error(err); }
  };

  const guardarNotas = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/pacientes/${selectedPaciente.id}/notas`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notas: notasClinicas })
      });
      if (res.ok) {
        showNotif(t('patients.modal.save_notes') + ' OK!');
        carregarPacientes(); // Atualiza a lista por trás
      }
    } catch (err) { console.error(err); }
  };

  const pacientesFiltrados = pacientes.filter(p => 
    p.nome.toLowerCase().includes(pesquisa.toLowerCase()) || 
    (p.telefone && p.telefone.includes(pesquisa))
  );

  return (
    <div style={{ padding: '20px', color: theme.text, maxWidth: '1400px', margin: '0 auto', boxSizing: 'border-box' }}>
      
      {notification.show && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', backgroundColor: '#10b981', color: 'white', padding: '15px 25px', borderRadius: '10px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '10px', animation: 'fadeIn 0.3s' }}>
          <CheckCircle size={20} /> <span style={{ fontWeight: 'bold' }}>{notification.message}</span>
        </div>
      )}

      {/* MODAL: FICHA CLÍNICA DO PACIENTE */}
      {selectedPaciente && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)', padding: '20px' }}>
          <div style={{ backgroundColor: theme.cardBg, width: '100%', maxWidth: '900px', borderRadius: '20px', border: `1px solid ${theme.border}`, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            
            <div style={{ padding: '25px 30px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, color: theme.isDark ? '#ffffff' : theme.text, fontSize: '22px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Activity size={26} color="#2563eb" /> {t('patients.modal.info')}
              </h2>
              <button onClick={() => setSelectedPaciente(null)} style={{ background: 'none', border: 'none', color: theme.subText, cursor: 'pointer' }}><X size={24} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', flex: 1, overflow: 'hidden' }}>
              
              {/* COLUNA ESQUERDA: DADOS E NOTAS */}
              <div style={{ padding: '30px', borderRight: `1px solid ${theme.border}`, overflowY: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
                  <div style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#2563eb', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '28px', fontWeight: 'bold' }}>
                    {selectedPaciente.nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '22px' }}>{selectedPaciente.nome}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', color: theme.subText, fontSize: '14px' }}>
                      {selectedPaciente.telefone && <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Phone size={14}/> {selectedPaciente.telefone}</span>}
                      {selectedPaciente.email && <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Mail size={14}/> {selectedPaciente.email}</span>}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px' }}>
                  <div style={{ backgroundColor: theme.pageBg, padding: '15px', borderRadius: '12px', border: `1px solid ${theme.border}` }}>
                    <div style={{ fontSize: '12px', color: theme.subText, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>{t('patients.table.consultations')}</div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#8b5cf6' }}>{selectedPaciente.total_consultas}</div>
                  </div>
                  <div style={{ backgroundColor: theme.pageBg, padding: '15px', borderRadius: '12px', border: `1px solid ${theme.border}` }}>
                    <div style={{ fontSize: '12px', color: theme.subText, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>{t('patients.table.billed')}</div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#10b981' }}>{selectedPaciente.total_faturado} €</div>
                  </div>
                </div>

                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: theme.subText, marginBottom: '10px', textTransform: 'uppercase' }}>
                  <FileText size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }}/> {t('patients.modal.notes')}
                </label>
                <textarea 
                  value={notasClinicas} 
                  onChange={(e) => setNotasClinicas(e.target.value)}
                  placeholder={t('patients.modal.notes_ph')}
                  style={{ width: '100%', height: '180px', padding: '15px', borderRadius: '12px', border: `1px solid ${theme.border}`, background: theme.isDark ? '#0f172a' : '#f8fafc', color: theme.text, outline: 'none', resize: 'none', boxSizing: 'border-box', fontSize: '14px', lineHeight: '1.5' }}
                />
                <button onClick={guardarNotas} style={{ width: '100%', padding: '14px', marginTop: '15px', borderRadius: '10px', border: 'none', backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)' }}>
                  <Save size={18} /> {t('patients.modal.save_notes')}
                </button>
              </div>

              {/* COLUNA DIREITA: HISTÓRICO DE CONSULTAS */}
              <div style={{ padding: '30px', backgroundColor: theme.isDark ? '#1e293b' : '#f1f5f9', overflowY: 'auto' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: theme.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('patients.modal.history')}</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {historico.length > 0 ? historico.map(c => {
                    const isFinalizada = c.status === 'FINALIZADA';
                    return (
                      <div key={c.id} style={{ backgroundColor: theme.cardBg, padding: '15px', borderRadius: '12px', border: `1px solid ${theme.border}`, borderLeft: `4px solid ${isFinalizada ? '#10b981' : '#3b82f6'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{new Date(c.data_consulta).toLocaleDateString(activeLocale)}</span>
                          <span style={{ fontSize: '12px', color: isFinalizada ? '#10b981' : '#3b82f6', fontWeight: 'bold', backgroundColor: isFinalizada ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)', padding: '2px 8px', borderRadius: '10px' }}>
                            {c.status}
                          </span>
                        </div>
                        <div style={{ color: theme.subText, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Clock size={14}/> {c.hora_consulta.substring(0,5)} • {c.procedimento_nome || 'Consulta Geral'}
                        </div>
                      </div>
                    )
                  }) : (
                    <div style={{ textAlign: 'center', padding: '30px', color: theme.subText, border: `1px dashed ${theme.border}`, borderRadius: '12px' }}>
                      <Calendar size={30} style={{ opacity: 0.3, marginBottom: '10px' }} /><br/>{t('patients.modal.empty_history')}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* CABEÇALHO DA PÁGINA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '30px', fontWeight: '800', margin: 0, color: theme.isDark ? '#ffffff' : theme.text, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Users size={32} color="#2563eb" /> {t('patients.title')}
          </h1>
          <p style={{ color: theme.subText, margin: '5px 0 0 0' }}>{t('patients.subtitle')}</p>
        </div>
        
        <div style={{ position: 'relative', width: '100%', maxWidth: '350px' }}>
          <Search size={20} color={theme.subText} style={{ position: 'absolute', left: '15px', top: '14px' }} />
          <input 
            type="text" 
            placeholder={t('patients.search')} 
            style={{ width: '100%', padding: '14px 15px 14px 45px', borderRadius: '10px', border: `1px solid ${theme.border}`, background: theme.cardBg, color: theme.text, outline: 'none', fontSize: '15px', boxSizing: 'border-box' }}
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
          />
        </div>
      </div>

      {/* TABELA DE PACIENTES */}
      <div style={{ backgroundColor: theme.cardBg, borderRadius: '16px', border: `1px solid ${theme.border}`, overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: theme.pageBg, color: theme.subText, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <th style={{ padding: '15px 20px', borderBottom: `1px solid ${theme.border}` }}>{t('patients.table.name')}</th>
                <th style={{ padding: '15px 20px', borderBottom: `1px solid ${theme.border}` }}>{t('patients.table.contact')}</th>
                <th style={{ padding: '15px 20px', borderBottom: `1px solid ${theme.border}`, textAlign: 'center' }}>{t('patients.table.consultations')}</th>
                <th style={{ padding: '15px 20px', borderBottom: `1px solid ${theme.border}`, textAlign: 'right' }}>{t('patients.table.billed')}</th>
              </tr>
            </thead>
            <tbody>
              {pacientesFiltrados.map(p => (
                <tr 
                  key={p.id} 
                  onClick={() => abrirFichaPaciente(p)}
                  style={{ borderBottom: `1px solid ${theme.border}`, cursor: 'pointer', transition: 'background-color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = theme.isDark ? '#1e293b' : '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '15px 20px', fontWeight: 'bold', color: theme.text, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' }}>
                      {p.nome.charAt(0).toUpperCase()}
                    </div>
                    {p.nome}
                  </td>
                  <td style={{ padding: '15px 20px', color: theme.subText, fontSize: '14px' }}>
                    {p.telefone || '-'}
                  </td>
                  <td style={{ padding: '15px 20px', textAlign: 'center' }}>
                    <span style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', padding: '4px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '13px' }}>
                      {p.total_consultas}
                    </span>
                  </td>
                  <td style={{ padding: '15px 20px', textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>
                    {p.total_faturado} €
                  </td>
                </tr>
              ))}
              {pacientesFiltrados.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: theme.subText }}>
                    <User size={40} style={{ opacity: 0.3, marginBottom: '10px' }} /><br/>Nenhum paciente encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Pacientes;