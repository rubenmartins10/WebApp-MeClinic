import React, { useState, useEffect, useContext } from 'react';
import { Calendar as CalendarIcon, User, Mail, Phone, FileText, Clock, CheckCircle, XCircle, Edit, Trash2, AlertTriangle, Globe } from 'lucide-react';
import { ThemeContext } from '../ThemeContext';
import { LanguageContext } from '../LanguageContext'; 
import jsPDF from 'jspdf';

const Consultas = () => {
  const { theme } = useContext(ThemeContext);
  const { t, language } = useContext(LanguageContext);

  const [consultas, setConsultas] = useState([]);
  const [modelos, setModelos] = useState([]);
  
  // ESTADO PARA O PREFIXO DO TELEFONE
  const [phonePrefix, setPhonePrefix] = useState('+351');

  const [formData, setFormData] = useState({
    nome: '', email: '', telefone: '', data: '', hora: '', motivo: '', procedimento_id: ''
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const [checkoutModal, setCheckoutModal] = useState(null);
  const [checkoutData, setCheckoutData] = useState({ metodo_pagamento: 'Multibanco' });
  const [enviarEmail, setEnviarEmail] = useState(false);
  const [emailPaciente, setEmailPaciente] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  
  const [filtro, setFiltro] = useState('dia');

  const fetchDados = () => {
    fetch('http://localhost:5000/api/consultas')
      .then(res => res.json())
      .then(data => setConsultas(data));
    
    fetch('http://localhost:5000/api/modelos-procedimento')
      .then(res => res.json())
      .then(data => setModelos(data));
  };

  useEffect(() => { fetchDados(); }, []);

  const showNotif = (msg, type = 'success') => {
    setNotification({ show: true, message: msg, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = isEditing ? `http://localhost:5000/api/consultas/${editId}` : 'http://localhost:5000/api/consultas';
    const method = isEditing ? 'PUT' : 'POST';

    // Junta o prefixo ao número antes de enviar para o servidor
    const telefoneCompleto = formData.telefone ? `${phonePrefix} ${formData.telefone}` : t('consultations.list.no_phone');

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          telefone: telefoneCompleto,
          procedimento_id: formData.procedimento_id || null
        })
      });
      if (res.ok) {
        showNotif(isEditing ? t('consultations.msg.updated') : t('consultations.msg.scheduled'));
        setFormData({ nome: '', email: '', telefone: '', data: '', hora: '', motivo: '', procedimento_id: '' });
        setPhonePrefix('+351'); // Volta ao padrão
        setIsEditing(false);
        setEditId(null);
        fetchDados();
      }
    } catch (err) { showNotif(t('consultations.msg.save_err'), 'error'); }
  };

  const handleEdit = (c) => {
    setIsEditing(true);
    setEditId(c.id);

    let dataFormatada = '';
    if (c.data_consulta) dataFormatada = new Date(c.data_consulta).toISOString().split('T')[0];
    
    let horaFormatada = '';
    if (c.hora_consulta) horaFormatada = c.hora_consulta.substring(0, 5);

    // Lógica para separar o prefixo do número de telemóvel quando editas
    let numLimpo = c.paciente_telefone || '';
    let prefixo = '+351';
    
    if (numLimpo.includes(' ')) {
      const partes = numLimpo.split(' ');
      prefixo = partes[0];
      numLimpo = partes.slice(1).join(' '); // O resto é o número
    } else if (numLimpo === t('consultations.list.no_phone')) {
      numLimpo = '';
    }

    setPhonePrefix(prefixo);
    setFormData({
      nome: c.paciente_nome || '', email: c.paciente_email || '', telefone: numLimpo,
      data: dataFormatada, hora: horaFormatada, motivo: c.motivo || '', procedimento_id: c.procedimento_id || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clickApagar = (id) => setShowDeleteConfirm(id);

  const confirmarApagar = async () => {
    if (!showDeleteConfirm) return;
    try {
      await fetch(`http://localhost:5000/api/consultas/${showDeleteConfirm}`, { method: 'DELETE' });
      showNotif(t('consultations.msg.deleted'));
      fetchDados();
    } catch (err) {
      showNotif(t('consultations.msg.delete_err'), 'error');
    } finally {
      setShowDeleteConfirm(null);
    }
  };

  const abrirCheckout = (c) => {
    setCheckoutModal(c);
    setCheckoutData({ metodo_pagamento: 'Multibanco' });
    if (c.paciente_email) {
      setEnviarEmail(true);
      setEmailPaciente(c.paciente_email);
    } else {
      setEnviarEmail(false);
      setEmailPaciente('');
    }
  };

  const finalizarCheckout = async () => {
    if (!checkoutModal) return;
    setIsProcessing(true);
    let pdfBase64 = null;

    if (enviarEmail && emailPaciente) {
      try {
        const doc = new jsPDF({ format: [100, 150] });
        doc.setTextColor(37, 99, 235);
        doc.setFontSize(18); doc.setFont(undefined, 'bold'); doc.text("MECLINIC", 50, 18, { align: 'center' });
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12); doc.setFont(undefined, 'bold'); doc.text(t('consultations.pdf.title'), 50, 32, { align: 'center' });
        doc.setFontSize(8); doc.setFont(undefined, 'normal'); doc.text(t('consultations.pdf.subtitle'), 50, 37, { align: 'center' });
        doc.setDrawColor(200, 200, 200); doc.line(10, 42, 90, 42);
        
        doc.setFontSize(10);
        doc.text(`${t('consultations.pdf.patient')}${checkoutModal.paciente_nome}`, 10, 52);
        doc.text(`${t('consultations.pdf.datetime')}${new Date().toLocaleString(language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'pt-PT')}`, 10, 62);
        doc.text(`${t('consultations.pdf.procedure')}${checkoutModal.procedimento_nome || t('consultations.general')}`, 10, 72);
        doc.text(`${t('consultations.pdf.payment')}${checkoutData.metodo_pagamento}`, 10, 82);
        doc.line(10, 92, 90, 92);
        
        doc.setFontSize(14); doc.setFont(undefined, 'bold');
        doc.text(`${t('consultations.pdf.total')}${parseFloat(checkoutModal.preco_servico || 0).toFixed(2)} EUR`, 50, 105, { align: 'center' });
        pdfBase64 = doc.output('datauristring');
      } catch (e) { console.error("Erro a gerar o PDF na página:", e); }
    }

    try {
      const res = await fetch('http://localhost:5000/api/faturacao/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consulta_id: checkoutModal.id, paciente_nome: checkoutModal.paciente_nome, procedimento_nome: checkoutModal.procedimento_nome || t('consultations.general'), valor_total: checkoutModal.preco_servico || 0, metodo_pagamento: checkoutData.metodo_pagamento, email_destino: enviarEmail ? emailPaciente : null, pdfBase64: pdfBase64
        })
      });
      const data = await res.json();
      if (res.ok) {
        showNotif(t('consultations.msg.checkout_success'));
        setCheckoutModal(null);
        fetchDados();
      } else { showNotif(data.error || t('consultations.msg.checkout_err'), 'error'); }
    } catch (err) { showNotif(t('consultations.msg.comm_err'), 'error'); } finally { setIsProcessing(false); }
  };

  const dataAtual = new Date();
  const hojeStr = dataAtual.getFullYear() + '-' + String(dataAtual.getMonth() + 1).padStart(2, '0') + '-' + String(dataAtual.getDate()).padStart(2, '0');
  const hojeObj = new Date(hojeStr + 'T00:00:00'); 

  const consultasFiltradas = consultas.filter(c => {
    const cDateStr = c.data_consulta.split('T')[0];
    const dataConsultaObj = new Date(cDateStr + 'T00:00:00');
    const diffTime = dataConsultaObj.getTime() - hojeObj.getTime();
    const diffDias = Math.round(diffTime / (1000 * 3600 * 24));

    if (filtro === 'dia') return diffDias === 0;
    if (filtro === 'semana') return diffDias >= 0 && diffDias <= 7;
    if (filtro === 'mes') return diffDias >= 0 && diffDias <= 30;
    return true;
  });

  // FUNÇÃO MÁGICA: Retorna o exemplo correto baseado no prefixo escolhido
  const getPhonePlaceholder = (prefix) => {
    switch(prefix) {
      case '+351': return 'Ex: 912 345 678'; // Portugal
      case '+34': return 'Ex: 612 345 678'; // Espanha
      case '+33': return 'Ex: 6 12 34 56 78'; // França
      case '+44': return 'Ex: 7911 123456'; // Reino Unido
      case '+49': return 'Ex: 1512 3456789'; // Alemanha
      case '+41': return 'Ex: 79 123 45 67'; // Suíça
      case '+1': return 'Ex: (555) 123-4567'; // EUA
      case '+55': return 'Ex: 11 91234-5678'; // Brasil
      case '+352': return 'Ex: 621 123 456'; // Luxemburgo
      default: return t('consultations.form.phone_ph'); // Tradução padrão
    }
  };

  const inputStyle = { width: '100%', padding: '14px 14px 14px 45px', borderRadius: '10px', border: `1px solid ${theme.border}`, backgroundColor: theme.isDark ? '#0f172a' : '#f8fafc', color: theme.text, outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box', marginBottom: '15px' };
  const iconStyle = { position: 'absolute', left: '15px', top: '14px', color: '#64748b' };

  const localeMap = { pt: 'pt-PT', en: 'en-US', es: 'es-ES' };
  const activeLocale = localeMap[language] || 'pt-PT';

  return (
    <div style={{ padding: '20px', color: theme.text, maxWidth: '1200px', margin: '0 auto' }}>
      
      {notification.show && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', backgroundColor: notification.type === 'success' ? '#10b981' : '#ef4444', color: 'white', padding: '15px 25px', borderRadius: '10px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '10px', animation: 'fadeIn 0.3s' }}>
          {notification.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
          <span style={{ fontWeight: 'bold' }}>{notification.message}</span>
        </div>
      )}

      {showDeleteConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, backdropFilter: 'blur(5px)' }}>
          <div style={{ backgroundColor: theme.cardBg, padding: '30px', borderRadius: '20px', width: '350px', textAlign: 'center', border: `1px solid ${theme.border}`, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <AlertTriangle size={50} color="#ef4444" style={{ marginBottom: '15px' }} />
            <h2 style={{ margin: '0 0 10px 0', color: theme.isDark ? '#ffffff' : theme.text }}>{t('consultations.delete.title')}</h2>
            <p style={{ color: theme.subText, marginBottom: '25px' }}>{t('consultations.delete.desc')}</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowDeleteConfirm(null)} style={{ padding: '12px 20px', borderRadius: '10px', border: 'none', backgroundColor: theme.pageBg, color: theme.text, flex: 1, fontWeight: 'bold', cursor: 'pointer' }}>{t('consultations.delete.cancel')}</button>
              <button onClick={confirmarApagar} style={{ padding: '12px 20px', borderRadius: '10px', border: 'none', backgroundColor: '#ef4444', color: 'white', flex: 1, fontWeight: 'bold', cursor: 'pointer' }}>{t('consultations.delete.confirm')}</button>
            </div>
          </div>
        </div>
      )}

      {checkoutModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9990, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
          <div style={{ backgroundColor: theme.cardBg, padding: '30px', borderRadius: '20px', width: '400px', border: `1px solid ${theme.border}`, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '22px' }}>{t('consultations.checkout.title')}</h2>
            <div style={{ backgroundColor: theme.pageBg, padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
              <p style={{ margin: '0 0 10px 0', color: theme.subText }}>{t('consultations.checkout.patient')} <strong style={{ color: theme.text }}>{checkoutModal.paciente_nome}</strong></p>
              <p style={{ margin: '0 0 10px 0', color: theme.subText }}>{t('consultations.checkout.procedure')} <strong style={{ color: theme.text }}>{checkoutModal.procedimento_nome || t('consultations.list.no_procedure')}</strong></p>
              <h3 style={{ margin: '15px 0 0 0', color: '#10b981', fontSize: '28px' }}>{parseFloat(checkoutModal.preco_servico || 0).toFixed(2)} €</h3>
            </div>
            
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>{t('consultations.checkout.payment_method')}</label>
            <select value={checkoutData.metodo_pagamento} onChange={(e) => setCheckoutData({...checkoutData, metodo_pagamento: e.target.value})} style={{ ...inputStyle, paddingLeft: '12px' }}>
              <option value={t('consultations.checkout.multibanco')}>{t('consultations.checkout.multibanco')}</option>
              <option value={t('consultations.checkout.mbway')}>{t('consultations.checkout.mbway')}</option>
              <option value={t('consultations.checkout.cash')}>{t('consultations.checkout.cash')}</option>
              <option value={t('consultations.checkout.transfer')}>{t('consultations.checkout.transfer')}</option>
            </select>

            <div style={{ marginTop: '5px', marginBottom: '20px', backgroundColor: theme.isDark ? '#0f172a' : '#f8fafc', padding: '15px', borderRadius: '10px', border: `1px solid ${theme.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="checkbox" id="enviarEmail" checked={enviarEmail} onChange={(e) => setEnviarEmail(e.target.checked)} style={{ cursor: 'pointer', width: '18px', height: '18px' }} />
                <label htmlFor="enviarEmail" style={{ cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', color: '#2563eb' }}>{t('consultations.checkout.send_email')}</label>
              </div>
              {enviarEmail && (
                <div style={{ marginTop: '15px' }}>
                  <input type="email" value={emailPaciente} onChange={(e) => setEmailPaciente(e.target.value)} placeholder={t('consultations.checkout.email_ph')} style={{ ...inputStyle, marginBottom: 0, paddingLeft: '15px' }} />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
              <button onClick={() => setCheckoutModal(null)} disabled={isProcessing} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: theme.pageBg, color: theme.text, cursor: 'pointer', fontWeight: 'bold', opacity: isProcessing ? 0.5 : 1 }}>{t('consultations.checkout.cancel')}</button>
              <button onClick={finalizarCheckout} disabled={isProcessing || (enviarEmail && !emailPaciente)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#10b981', color: 'white', cursor: (isProcessing || (enviarEmail && !emailPaciente)) ? 'not-allowed' : 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', opacity: (isProcessing || (enviarEmail && !emailPaciente)) ? 0.6 : 1 }}>
                {isProcessing ? t('consultations.checkout.processing') : t('consultations.checkout.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '40px' }}>
        <CalendarIcon color="#2563eb" size={32} />
        <h1 style={{ fontSize: '30px', fontWeight: '800', margin: 0, color: theme.isDark ? '#ffffff' : theme.text }}>{t('consultations.title')}</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '30px' }}>
        
        <div style={{ backgroundColor: theme.cardBg, padding: '30px', borderRadius: '16px', border: `1px solid ${theme.border}`, height: 'fit-content' }}>
          <h3 style={{ margin: '0 0 25px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <User size={20} color="#2563eb" /> {isEditing ? t('consultations.form.edit') : t('consultations.form.new')}
          </h3>

          <form onSubmit={handleSubmit}>
            <div style={{ position: 'relative' }}>
              <User size={18} style={iconStyle} />
              <input type="text" name="nome" value={formData.nome} onChange={handleChange} placeholder={t('consultations.form.name_ph')} style={inputStyle} required />
            </div>

            <div style={{ position: 'relative' }}>
              <Mail size={18} style={iconStyle} />
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder={t('consultations.form.email_ph')} style={inputStyle} />
            </div>

            {/* SELETOR DE PAÍSES (PREFIXOS) DINÂMICO */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <div style={{ position: 'relative', width: '130px' }}>
                <Globe size={16} style={{ position: 'absolute', left: '12px', top: '15px', color: '#64748b', zIndex: 1 }} />
                <select 
                  value={phonePrefix} 
                  onChange={(e) => setPhonePrefix(e.target.value)}
                  style={{ 
                    width: '100%', padding: '14px 10px 14px 38px', borderRadius: '10px', 
                    border: `1px solid ${theme.border}`, backgroundColor: theme.isDark ? '#0f172a' : '#f8fafc',
                    color: theme.text, fontSize: '14px', fontWeight: 'bold', outline: 'none', cursor: 'pointer',
                    appearance: 'none', position: 'relative'
                  }}
                >
                  <option value="+351">PT +351</option>
                  <option value="+34">ES +34</option>
                  <option value="+33">FR +33</option>
                  <option value="+44">UK +44</option>
                  <option value="+49">DE +49</option>
                  <option value="+41">CH +41</option>
                  <option value="+1">US +1</option>
                  <option value="+55">BR +55</option>
                  <option value="+352">LU +352</option>
                </select>
              </div>
              <div style={{ position: 'relative', flex: 1 }}>
                <Phone size={18} style={iconStyle} />
                <input 
                  type="text" name="telefone" value={formData.telefone} onChange={handleChange} 
                  placeholder={getPhonePlaceholder(phonePrefix)} 
                  style={{ ...inputStyle, marginBottom: 0 }} 
                />
              </div>
            </div>

            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold', color: theme.subText, textTransform: 'uppercase' }}>{t('consultations.form.procedure')}</label>
            <select name="procedimento_id" value={formData.procedimento_id} onChange={handleChange} style={{ ...inputStyle, paddingLeft: '12px' }} required>
              <option value="">{t('consultations.form.procedure_ph')}</option>
              {modelos.map(m => (
                <option key={m.id} value={m.id}>{m.nome}</option>
              ))}
            </select>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold', color: theme.subText, textTransform: 'uppercase' }}>{t('consultations.form.date')}</label>
                <div style={{ position: 'relative' }}>
                  <input type="date" name="data" value={formData.data} onChange={handleChange} style={{ ...inputStyle, paddingLeft: '12px' }} required />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold', color: theme.subText, textTransform: 'uppercase' }}>{t('consultations.form.time')}</label>
                <div style={{ position: 'relative' }}>
                  <input type="time" name="hora" value={formData.hora} onChange={handleChange} style={{ ...inputStyle, paddingLeft: '12px' }} required />
                </div>
              </div>
            </div>

            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold', color: theme.subText, textTransform: 'uppercase' }}>{t('consultations.form.notes')}</label>
            <textarea name="motivo" value={formData.motivo} onChange={handleChange} placeholder={t('consultations.form.notes_ph')} style={{ ...inputStyle, paddingLeft: '12px', height: '100px', resize: 'none' }}></textarea>

            <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'background-color 0.2s' }}>
              <FileText size={20} /> {isEditing ? t('consultations.form.btn_save') : t('consultations.form.btn_confirm')}
            </button>
            
            {isEditing && (
              <button type="button" onClick={() => { setIsEditing(false); setFormData({ nome: '', email: '', telefone: '', data: '', hora: '', motivo: '', procedimento_id: ''}); setPhonePrefix('+351'); }} style={{ width: '100%', padding: '12px', backgroundColor: 'transparent', color: theme.subText, border: 'none', cursor: 'pointer', marginTop: '10px', fontWeight: 'bold' }}>
                {t('consultations.form.btn_cancel')}
              </button>
            )}
          </form>
        </div>

        <div style={{ backgroundColor: theme.cardBg, padding: '30px', borderRadius: '16px', border: `1px solid ${theme.border}` }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <h3 style={{ margin: 0, fontSize: '18px' }}>{t('consultations.list.title')}</h3>
            
            <div style={{ display: 'flex', gap: '5px', backgroundColor: theme.pageBg, padding: '5px', borderRadius: '10px' }}>
              <button onClick={() => setFiltro('dia')} style={{ padding: '8px 15px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', backgroundColor: filtro === 'dia' ? '#2563eb' : 'transparent', color: filtro === 'dia' ? 'white' : theme.subText, transition: 'all 0.2s' }}>
                {t('consultations.list.filter_today')}
              </button>
              <button onClick={() => setFiltro('semana')} style={{ padding: '8px 15px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', backgroundColor: filtro === 'semana' ? '#2563eb' : 'transparent', color: filtro === 'semana' ? 'white' : theme.subText, transition: 'all 0.2s' }}>
                {t('consultations.list.filter_week')}
              </button>
              <button onClick={() => setFiltro('mes')} style={{ padding: '8px 15px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', backgroundColor: filtro === 'mes' ? '#2563eb' : 'transparent', color: filtro === 'mes' ? 'white' : theme.subText, transition: 'all 0.2s' }}>
                {t('consultations.list.filter_month')}
              </button>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {consultasFiltradas.length > 0 ? consultasFiltradas.map(c => {
              const isFinalizada = c.status === 'FINALIZADA';
              const cardBackground = isFinalizada ? (theme.isDark ? '#0f172a' : '#f1f5f9') : (theme.isDark ? '#1e293b' : '#ffffff');
              const opacityLevel = isFinalizada ? 0.6 : 1;
              
              const mesCurto = new Date(c.data_consulta).toLocaleDateString(activeLocale, { month: 'short' }).toUpperCase();
              const dia = new Date(c.data_consulta).getDate();

              return (
                <div key={c.id} style={{ backgroundColor: cardBackground, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: opacityLevel, transition: 'all 0.3s' }}>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ backgroundColor: isFinalizada ? theme.border : theme.pageBg, padding: '12px 15px', borderRadius: '10px', textAlign: 'center', minWidth: '60px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 'bold', color: isFinalizada ? theme.subText : '#2563eb' }}>{mesCurto}</div>
                      <div style={{ fontSize: '22px', fontWeight: '900', color: isFinalizada ? theme.subText : '#2563eb' }}>{dia}</div>
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 5px 0', fontSize: '16px', color: theme.text, textDecoration: isFinalizada ? 'line-through' : 'none' }}>{c.paciente_nome}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', color: theme.subText, fontSize: '13px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Clock size={14} /> {c.hora_consulta.substring(0, 5)} • {c.procedimento_nome || t('consultations.list.no_procedure')}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: theme.subText, fontSize: '13px', marginTop: '5px' }}>
                        <Phone size={14} /> {c.paciente_telefone || t('consultations.list.no_phone')}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    {isFinalizada ? (
                      <span style={{ backgroundColor: theme.pageBg, color: theme.subText, padding: '8px 15px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <CheckCircle size={16} /> {t('consultations.list.finished')}
                      </span>
                    ) : (
                      <>
                        <button onClick={() => abrirCheckout(c)} style={{ backgroundColor: '#d1fae5', color: '#10b981', border: 'none', padding: '12px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title={t('consultations.tooltip.finish')}><CheckCircle size={20} /></button>
                        <button onClick={() => handleEdit(c)} style={{ backgroundColor: '#dbeafe', color: '#2563eb', border: 'none', padding: '12px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title={t('consultations.tooltip.edit')}><Edit size={20} /></button>
                        <button onClick={() => clickApagar(c.id)} style={{ backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', padding: '12px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title={t('consultations.tooltip.delete')}><Trash2 size={20} /></button>
                      </>
                    )}
                  </div>

                </div>
              );
            }) : (
              <div style={{ textAlign: 'center', padding: '40px', color: theme.subText, border: `1px dashed ${theme.border}`, borderRadius: '12px' }}>
                {t('consultations.list.empty')}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Consultas;