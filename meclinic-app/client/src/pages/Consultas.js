import React, { useState, useEffect, useContext } from 'react';
import { Calendar as CalendarIcon, Clock, User, CheckCircle, XCircle, FileText, ChevronDown, Phone, Edit2, Trash2, AlertTriangle, Mail, DollarSign, X } from 'lucide-react';
import jsPDF from 'jspdf';
import { ThemeContext } from '../ThemeContext';

const countries = [
  { code: '+351', flag: '🇵🇹', name: 'Portugal' },
  { code: '+55', flag: '🇧🇷', name: 'Brasil' },
  { code: '+34', flag: '🇪🇸', name: 'Espanha' },
  { code: '+33', flag: '🇫🇷', name: 'França' },
  { code: '+44', flag: '🇬🇧', name: 'Reino Unido' },
  { code: '+41', flag: '🇨🇭', name: 'Suíça' },
  { code: '+244', flag: '🇦🇴', name: 'Angola' }
];

const Consultas = () => {
  const { theme } = useContext(ThemeContext);
  
  const [procedimentos, setProcedimentos] = useState([]);
  const [consultas, setConsultas] = useState([]);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  
  // Controlo de Edição e Eliminação
  const [consultaToEdit, setConsultaToEdit] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // MODAL DE CHECKOUT
  const [checkoutModal, setCheckoutModal] = useState({ show: false, consulta: null, valor: 0, metodo: 'Multibanco', email: '' });
  const [isProcessing, setIsProcessing] = useState(false);

  const initialForm = { nome: '', email: '', telefone: '', procedimento_id: '', data: '', hora: '', motivo: '' };
  const [formData, setFormData] = useState(initialForm);
  
  const [selectedCountry, setSelectedCountry] = useState(countries[0]); 
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetch('http://localhost:5000/api/modelos-procedimento')
      .then(res => res.json())
      .then(data => setProcedimentos(data))
      .catch(err => console.error(err));

    carregarConsultas();
  }, []);

  const carregarConsultas = () => {
    fetch('http://localhost:5000/api/consultas')
      .then(res => res.json())
      .then(data => setConsultas(data))
      .catch(err => console.error(err));
  };

  const showNotif = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: '', message: '' }), 4000);
  };
  const closeNotif = () => setNotification({ show: false, type: '', message: '' });

  // ==========================================
  // --- CHECKOUT E GERAÇÃO DE PDF ---
  // ==========================================
  const abrirCheckout = (c) => {
    setCheckoutModal({
      show: true,
      consulta: c,
      valor: c.preco_estimado || 0,
      metodo: 'Multibanco',
      email: c.paciente_email || ''
    });
  };

  const gerarReciboPDFBase64 = (consulta, valor, metodo) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(37, 99, 235);
    doc.text("MeClinic", 15, 20);
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text("Resumo de Consulta / Nota de Honorários", 15, 28);
    
    doc.setDrawColor(200, 200, 200);
    doc.line(15, 35, 195, 35);
    
    doc.setTextColor(0, 0, 0);
    doc.text(`Paciente: ${consulta.paciente_nome}`, 15, 50);
    doc.text(`Data: ${new Date(consulta.data_consulta).toLocaleDateString('pt-PT')}`, 15, 60);
    doc.text(`Procedimento: ${consulta.procedimento_nome || 'Consulta Geral'}`, 15, 70);
    doc.text(`Método de Pagamento: ${metodo}`, 15, 80);
    
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text(`Valor Total: ${parseFloat(valor).toFixed(2)} EUR`, 15, 100);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text("Obrigado pela sua preferência!", 15, 120);

    return doc.output('datauristring');
  };

  const handleConfirmCheckout = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    
    const { consulta, valor, metodo, email } = checkoutModal;
    const pdfBase64 = gerarReciboPDFBase64(consulta, valor, metodo);

    try {
      const response = await fetch('http://localhost:5000/api/faturacao/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consulta_id: consulta.id,
          paciente_nome: consulta.paciente_nome,
          procedimento_nome: consulta.procedimento_nome || 'Consulta Geral',
          valor_total: valor,
          metodo_pagamento: metodo,
          email_destino: email,
          pdfBase64: pdfBase64
        })
      });

      if (response.ok) {
        showNotif('success', 'Consulta finalizada e registada na Faturação!');
        setCheckoutModal({ show: false, consulta: null, valor: 0, metodo: '', email: '' });
        carregarConsultas(); 
      } else {
        showNotif('error', 'Erro ao finalizar consulta.');
      }
    } catch (err) {
      showNotif('error', 'Falha ao ligar ao servidor.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ==========================================
  // --- GESTÃO DA AGENDA ---
  // ==========================================
  const handleEditClick = (c) => {
    setConsultaToEdit(c.id);
    
    let ind = '+351';
    let num = c.paciente_telefone || '';
    if (num.includes(' ')) {
      const parts = num.split(' ');
      ind = parts[0];
      num = parts[1];
    }
    
    const country = countries.find(x => x.code === ind) || countries[0];
    setSelectedCountry(country);
    
    setFormData({
      nome: c.paciente_nome || '',
      email: c.paciente_email || '',
      telefone: num,
      procedimento_id: c.procedimento_id || '',
      data: c.data_consulta ? new Date(c.data_consulta).toISOString().split('T')[0] : '',
      hora: c.hora_consulta ? c.hora_consulta.substring(0, 5) : '',
      motivo: c.motivo || ''
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmarDesmarcacao = async () => {
    if (!showDeleteConfirm) return;
    try {
      const response = await fetch(`http://localhost:5000/api/consultas/${showDeleteConfirm}`, { method: 'DELETE' });
      if (response.ok) {
        showNotif('success', 'Consulta removida da agenda com sucesso.');
        carregarConsultas();
        if (consultaToEdit === showDeleteConfirm) {
          setConsultaToEdit(null);
          setFormData(initialForm);
        }
      } else {
        showNotif('error', 'Erro ao remover consulta.');
      }
    } catch (err) {
      showNotif('error', 'Falha ao ligar ao servidor.');
    } finally {
      setShowDeleteConfirm(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const telefoneLimpo = formData.telefone.replace(/\D/g, ''); 
    
    if (selectedCountry.code === '+351') {
      if (telefoneLimpo.length !== 9 || !telefoneLimpo.startsWith('9')) {
        showNotif('error', 'Número de telemóvel inválido! Um número português deve ter exatamente 9 dígitos e começar por 9.');
        return;
      }
    } else {
      if (telefoneLimpo.length < 8) {
        showNotif('error', `Número internacional inválido para ${selectedCountry.name}. Verifique os dígitos.`);
        return;
      }
    }

    const telefoneCompleto = `${selectedCountry.code} ${telefoneLimpo}`;

    try {
      const url = consultaToEdit ? `http://localhost:5000/api/consultas/${consultaToEdit}` : 'http://localhost:5000/api/consultas';
      const method = consultaToEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, telefone: telefoneCompleto })
      });

      if (response.ok) {
        showNotif('success', consultaToEdit ? 'Alterações guardadas com sucesso!' : 'Consulta agendada com sucesso!');
        setFormData(initialForm);
        setConsultaToEdit(null);
        carregarConsultas();
      } else {
        showNotif('error', 'Erro ao guardar a consulta. Tente novamente.');
      }
    } catch (err) {
      showNotif('error', 'Falha de ligação ao servidor.');
    }
  };

  const inputStyle = { width: '100%', padding: '12px 15px', borderRadius: '8px', border: `1px solid ${theme.border}`, background: theme.pageBg, color: theme.text, outline: 'none', fontSize: '15px' };
  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 'bold', color: theme.subText, textTransform: 'uppercase', marginBottom: '8px', marginTop: '15px' };

  return (
    <div style={{ padding: '20px', color: theme.text, maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* MODAL FINALIZAR / CHECKOUT */}
      {checkoutModal.show && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, backdropFilter: 'blur(5px)' }}>
          <div style={{ backgroundColor: theme.cardBg, padding: '30px', borderRadius: '15px', width: '450px', border: `1px solid ${theme.border}`, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: theme.isDark ? '#ffffff' : theme.text, display: 'flex', alignItems: 'center', gap: '10px' }}><DollarSign color="#10b981" /> Finalizar Consulta</h2>
              <button onClick={() => setCheckoutModal({...checkoutModal, show: false})} style={{ background: 'none', border: 'none', color: theme.subText, cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            <div style={{ padding: '15px', backgroundColor: theme.pageBg, borderRadius: '10px', marginBottom: '20px', border: `1px solid ${theme.border}` }}>
              <p style={{ margin: '0 0 5px 0', color: theme.subText, fontSize: '13px' }}>Paciente: <strong style={{ color: theme.text }}>{checkoutModal.consulta.paciente_nome}</strong></p>
              <p style={{ margin: 0, color: theme.subText, fontSize: '13px' }}>Procedimento: <strong style={{ color: theme.text }}>{checkoutModal.consulta.procedimento_nome || 'Geral'}</strong></p>
            </div>

            <form onSubmit={handleConfirmCheckout}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={labelStyle}>Valor a Cobrar (€)</label>
                  <input type="number" step="0.01" style={{ ...inputStyle, borderColor: '#10b981', fontWeight: 'bold' }} value={checkoutModal.valor} onChange={e => setCheckoutModal({...checkoutModal, valor: e.target.value})} required />
                </div>
                <div>
                  <label style={labelStyle}>Método</label>
                  <select style={inputStyle} value={checkoutModal.metodo} onChange={e => setCheckoutModal({...checkoutModal, metodo: e.target.value})}>
                    <option>Multibanco</option>
                    <option>Numerário</option>
                    <option>MB Way</option>
                    <option>Transferência</option>
                  </select>
                </div>
              </div>

              <label style={labelStyle}>Enviar Recibo por E-mail para:</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} color={theme.subText} style={{ position: 'absolute', left: '15px', top: '15px' }} />
                <input type="email" style={{ ...inputStyle, paddingLeft: '45px' }} placeholder="E-mail do paciente (opcional)" value={checkoutModal.email} onChange={e => setCheckoutModal({...checkoutModal, email: e.target.value})} />
              </div>

              <button type="submit" disabled={isProcessing} style={{ width: '100%', marginTop: '20px', padding: '15px', borderRadius: '10px', border: 'none', backgroundColor: '#10b981', color: 'white', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', opacity: isProcessing ? 0.7 : 1 }}>
                {isProcessing ? 'A processar...' : 'Confirmar e Fechar Consulta'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* NOTIFICAÇÃO GENÉRICA */}
      {notification.show && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: theme.cardBg, padding: '40px', borderRadius: '20px', border: `1px solid ${theme.border}`, textAlign: 'center', minWidth: '350px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', animation: 'fadeIn 0.2s ease-out' }}>
            {notification.type === 'success' ? <CheckCircle size={60} color="#059669" style={{ marginBottom: '20px' }} /> : <XCircle size={60} color="#ef4444" style={{ marginBottom: '20px' }} />}
            <h2 style={{ margin: '0 0 10px 0', fontSize: '24px', fontWeight: 'bold', color: theme.isDark ? '#ffffff' : theme.text }}>
              {notification.type === 'success' ? 'Sucesso!' : 'Atenção'}
            </h2>
            <p style={{ margin: '0 0 30px 0', color: theme.subText, fontSize: '15px' }}>{notification.message}</p>
            <button onClick={closeNotif} style={{ width: '100%', padding: '14px', borderRadius: '10px', border: 'none', backgroundColor: notification.type === 'success' ? '#059669' : '#ef4444', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
              OK, entendi
            </button>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR APAGAR */}
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div style={{ backgroundColor: theme.cardBg, padding: '30px', borderRadius: '15px', width: '350px', textAlign: 'center', border: `1px solid ${theme.border}` }}>
            <AlertTriangle size={50} color="#ef4444" style={{ marginBottom: '15px' }} />
            <h2 style={{ margin: '0 0 10px 0', color: theme.isDark ? '#ffffff' : theme.text }}>Remover Consulta?</h2>
            <p style={{ color: theme.subText, marginBottom: '25px' }}>Esta ação vai apagar a consulta permanentemente da sua agenda.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowDeleteConfirm(null)} style={{ padding: '12px 20px', borderRadius: '10px', border: 'none', backgroundColor: '#64748b', color: 'white', flex: 1, fontWeight: 'bold', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={confirmarDesmarcacao} style={{ padding: '12px 20px', borderRadius: '10px', border: 'none', backgroundColor: '#ef4444', color: 'white', flex: 1, fontWeight: 'bold', cursor: 'pointer' }}>Remover</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <CalendarIcon size={32} color="#2563eb" />
        <h1 style={{ fontSize: '30px', fontWeight: '800', margin: 0, color: theme.isDark ? '#ffffff' : theme.text }}>Gestão de Consultas</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
        
        {/* LADO ESQUERDO: FORMULÁRIO */}
        <div style={{ backgroundColor: theme.cardBg, padding: '30px', borderRadius: '16px', border: `1px solid ${consultaToEdit ? '#059669' : theme.border}`, boxShadow: consultaToEdit ? '0 0 0 2px rgba(5, 150, 105, 0.2)' : 'none', transition: 'all 0.3s' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0, fontSize: '18px', color: theme.isDark ? '#ffffff' : theme.text }}>
              {consultaToEdit ? <Edit2 size={20} color="#059669" /> : <User size={20} color={theme.subText} />}
              {consultaToEdit ? 'A Editar Consulta' : 'Nova Marcação'}
            </h2>
            {consultaToEdit && (
              <button 
                type="button" 
                onClick={() => { setConsultaToEdit(null); setFormData(initialForm); }} 
                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', textDecoration: 'underline' }}
              >
                Cancelar Edição
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ position: 'relative' }}>
              <User size={18} color={theme.subText} style={{ position: 'absolute', left: '15px', top: '15px' }} />
              <input required type="text" placeholder="Nome do Paciente" style={{ ...inputStyle, paddingLeft: '45px' }} value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
            </div>

            <div style={{ position: 'relative', marginTop: '15px' }}>
              <Mail size={18} color={theme.subText} style={{ position: 'absolute', left: '15px', top: '15px' }} />
              <input type="email" placeholder="E-mail (Recomendado)" style={{ ...inputStyle, paddingLeft: '45px' }} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>

            <div style={{ position: 'relative', marginTop: '15px', display: 'flex' }}>
              <button 
                type="button" 
                onClick={() => setShowDropdown(!showDropdown)}
                style={{ padding: '0 15px', backgroundColor: theme.pageBg, border: `1px solid ${theme.border}`, borderRight: 'none', borderRadius: '8px 0 0 8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: theme.text }}
              >
                <span style={{ fontSize: '18px' }}>{selectedCountry.flag}</span>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: theme.subText }}>{selectedCountry.code}</span>
                <ChevronDown size={14} color={theme.subText} />
              </button>

              {showDropdown && (
                <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '5px', width: '220px', backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '10px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)', zIndex: 100, overflow: 'hidden' }}>
                  {countries.map(c => (
                    <div 
                      key={c.code}
                      onClick={() => { setSelectedCountry(c); setShowDropdown(false); }}
                      style={{ padding: '12px 15px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', borderBottom: `1px solid ${theme.border}`, color: theme.text, transition: 'background 0.2s' }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = theme.pageBg}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      <span style={{ fontSize: '18px' }}>{c.flag}</span>
                      <span style={{ fontWeight: 'bold' }}>{c.name}</span>
                      <span style={{ color: theme.subText, fontSize: '12px', marginLeft: 'auto' }}>{c.code}</span>
                    </div>
                  ))}
                </div>
              )}

              <input 
                required 
                type="text" 
                placeholder={selectedCountry.code === '+351' ? "Ex: 912345678" : "Número de telemóvel..."} 
                style={{ ...inputStyle, borderRadius: '0 8px 8px 0', flex: 1, letterSpacing: '1px' }} 
                value={formData.telefone} 
                onChange={e => setFormData({...formData, telefone: e.target.value})} 
              />
            </div>
            {showDropdown && <div onClick={() => setShowDropdown(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 90 }} />}

            <label style={labelStyle}>Procedimento Clínico</label>
            <select required style={inputStyle} value={formData.procedimento_id} onChange={e => setFormData({...formData, procedimento_id: e.target.value})}>
              <option value="" disabled>Selecione um procedimento...</option>
              {procedimentos.map(p => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={labelStyle}>Data</label>
                <div style={{ position: 'relative' }}>
                  <CalendarIcon size={18} color={theme.subText} style={{ position: 'absolute', right: '15px', top: '15px', pointerEvents: 'none' }} />
                  <input required type="date" style={inputStyle} value={formData.data} onChange={e => setFormData({...formData, data: e.target.value})} />
                </div>
              </div>
              
              <div>
                <label style={labelStyle}>Hora</label>
                <div style={{ ...inputStyle, padding: 0, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                  <Clock size={18} color={theme.subText} style={{ marginLeft: '15px', flexShrink: 0 }} />
                  
                  <select 
                    required 
                    style={{ flex: 1, background: 'transparent', border: 'none', color: theme.text, padding: '12px 5px', outline: 'none', appearance: 'none', textAlign: 'center', fontSize: '15px', cursor: 'pointer' }} 
                    value={formData.hora ? formData.hora.split(':')[0] : ''} 
                    onChange={e => {
                      const m = formData.hora ? formData.hora.split(':')[1] : '00';
                      setFormData({...formData, hora: `${e.target.value}:${m}`});
                    }}
                  >
                    <option value="" disabled>HH</option>
                    {Array.from({length: 15}, (_, i) => String(i + 8).padStart(2, '0')).map(h => (
                      <option key={h} value={h} style={{ background: theme.pageBg, color: theme.text }}>{h}</option>
                    ))}
                  </select>
                  
                  <span style={{ fontWeight: 'bold', color: theme.subText }}>:</span>
                  
                  <select 
                    required 
                    style={{ flex: 1, background: 'transparent', border: 'none', color: theme.text, padding: '12px 5px', outline: 'none', appearance: 'none', textAlign: 'center', fontSize: '15px', cursor: 'pointer' }} 
                    value={formData.hora ? formData.hora.split(':')[1] : ''} 
                    onChange={e => {
                      const h = formData.hora ? formData.hora.split(':')[0] : '09';
                      setFormData({...formData, hora: `${h}:${e.target.value}`});
                    }}
                  >
                    <option value="" disabled>MM</option>
                    {['00', '10', '20', '30', '40', '50'].map(m => (
                      <option key={m} value={m} style={{ background: theme.pageBg, color: theme.text }}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

            </div>

            <label style={labelStyle}>Notas adicionais...</label>
            <textarea rows="3" style={{ ...inputStyle, resize: 'none' }} placeholder="Opcional..." value={formData.motivo} onChange={e => setFormData({...formData, motivo: e.target.value})} />

            <button type="submit" style={{ width: '100%', marginTop: '25px', backgroundColor: consultaToEdit ? '#059669' : '#2563eb', color: 'white', padding: '15px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
              {consultaToEdit ? <CheckCircle size={20} /> : <FileText size={20} />}
              {consultaToEdit ? 'Guardar Alterações' : 'Confirmar Agenda'}
            </button>
          </form>
        </div>

        {/* LADO DIREITO: LISTAGEM */}
        <div style={{ backgroundColor: theme.cardBg, padding: '30px', borderRadius: '16px', border: `1px solid ${theme.border}` }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', color: theme.isDark ? '#ffffff' : theme.text }}>Próximas Marcações</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {consultas.length > 0 ? (
              consultas.map(c => {
                const dataObj = new Date(c.data_consulta);
                return (
                  <div key={c.id} style={{ padding: '20px', backgroundColor: theme.pageBg, borderRadius: '12px', border: `1px solid ${theme.border}`, display: 'flex', gap: '20px', alignItems: 'center' }}>
                    
                    <div style={{ backgroundColor: '#dbeafe', color: '#1e40af', padding: '10px 15px', borderRadius: '10px', textAlign: 'center', minWidth: '70px' }}>
                      <span style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>{dataObj.toLocaleDateString('pt-PT', { month: 'short' })}</span>
                      <span style={{ display: 'block', fontSize: '24px', fontWeight: '900' }}>{dataObj.getDate()}</span>
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', color: theme.text }}>{c.paciente_nome}</h3>
                      <p style={{ margin: 0, fontSize: '14px', color: theme.subText, display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Clock size={14} /> {c.hora_consulta.substring(0, 5)} • {c.procedimento_nome || 'Consulta Geral'}
                      </p>
                      {c.paciente_telefone && (
                        <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: theme.subText, display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Phone size={14} /> {c.paciente_telefone}
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      {/* ESTE É O NOVO BOTÃO DE FINALIZAR! */}
                      <button 
                        onClick={() => abrirCheckout(c)} 
                        style={{ width: '40px', height: '40px', borderRadius: '10px', border: 'none', backgroundColor: '#d1fae5', color: '#059669', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.2s' }} 
                        title="Finalizar e Faturar"
                      >
                        <CheckCircle size={18} />
                      </button>

                      <button 
                        onClick={() => handleEditClick(c)} 
                        style={{ width: '40px', height: '40px', borderRadius: '10px', border: 'none', backgroundColor: theme.isDark ? '#1e3a8a' : '#dbeafe', color: '#2563eb', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.2s' }} 
                        title="Reagendar/Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      
                      <button 
                        onClick={() => setShowDeleteConfirm(c.id)} 
                        style={{ width: '40px', height: '40px', borderRadius: '10px', border: 'none', backgroundColor: theme.isDark ? '#450a0a' : '#fee2e2', color: '#ef4444', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.2s' }} 
                        title="Remover Consulta"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                  </div>
                )
              })
            ) : (
              <div style={{ padding: '50px 0', textAlign: 'center', color: theme.subText }}>
                <CalendarIcon size={40} style={{ opacity: 0.3, margin: '0 auto 10px auto' }} />
                <p style={{ margin: 0, fontStyle: 'italic' }}>Nenhuma consulta agendada.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Consultas;