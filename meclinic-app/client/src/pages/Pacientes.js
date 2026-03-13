import React, { useState, useEffect, useContext, useRef } from 'react';
import { Users, Search, User, Phone, Mail, FileText, Calendar, Save, X, Activity, Clock, CheckCircle, XCircle, File, Download, UploadCloud, Trash2, AlertTriangle, Eye, Edit2, Pill, Plus, MessageCircle, Smile } from 'lucide-react';
import { ThemeContext } from '../ThemeContext';
import { LanguageContext } from '../LanguageContext';
import jsPDF from 'jspdf'; 
import Odontograma from '../components/Odontograma';
import Assinatura from '../components/Assinatura'; // <-- IMPORTA O NOVO QUADRO MÁGICO

const Pacientes = () => {
  const { theme } = useContext(ThemeContext);
  const { t, language } = useContext(LanguageContext);

  const currentUser = JSON.parse(localStorage.getItem('meclinic_user')) || {};
  const isAdmin = currentUser?.role?.toUpperCase() === 'ADMIN';

  const [pacientes, setPacientes] = useState([]);
  const [pesquisa, setPesquisa] = useState('');
  
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [exames, setExames] = useState([]); 
  const [notasClinicas, setNotasClinicas] = useState('');
  const [odontogramaData, setOdontogramaData] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [activeTab, setActiveTab] = useState('historico'); 
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pacienteToDelete, setPacienteToDelete] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({ id: null, nome: '', telefone: '', email: '' });

  // ESTADOS DA RECEITA MÉDICA E ASSINATURA
  const [showRxModal, setShowRxModal] = useState(false);
  const [rxMeds, setRxMeds] = useState([{ nome: '', posologia: '' }]);
  const [sendWhatsapp, setSendWhatsapp] = useState(true); 
  const [assinaturaMedica, setAssinaturaMedica] = useState(null); // <-- GUARDA O DESENHO DA ASSINATURA

  const fileInputRef = useRef(null);
  const activeLocale = language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'pt-PT';

  useEffect(() => { carregarPacientes(); }, []);

  const carregarPacientes = async () => {
    try {
      const res = await fetch('/api/pacientes');
      const data = await res.json();
      setPacientes(data);
    } catch (err) { console.error(err); }
  };

  const showNotif = (msg, type = 'success') => {
    setNotification({ show: true, message: msg, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 4000);
  };

  const abrirFichaPaciente = (paciente) => {
    setSelectedPaciente(paciente);
    setNotasClinicas(paciente.notas_clinicas || '');
    setActiveTab('historico');
    
    let odontoGuardado = {};
    try {
      odontoGuardado = typeof paciente.odontograma_dados === 'string' ? JSON.parse(paciente.odontograma_dados) : (paciente.odontograma_dados || {});
    } catch(e) {}
    setOdontogramaData(odontoGuardado);
    
    Promise.all([
      fetch(`/api/pacientes/${paciente.id}/historico`).then(r => r.ok ? r.json() : []),
      fetch(`/api/pacientes/${paciente.id}/exames`).then(r => r.ok ? r.json() : [])
    ]).then(([histData, examesData]) => {
      setHistorico(Array.isArray(histData) ? histData : []);
      setExames(Array.isArray(examesData) ? examesData : []);
    }).catch(err => {
      setHistorico([]); setExames([]);
    });
  };

  const guardarNotas = async () => {
    try {
      const res = await fetch(`/api/pacientes/${selectedPaciente.id}/notas`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notas: notasClinicas })
      });
      if (res.ok) { showNotif(t('patients.modal.save_notes') + ' OK!'); carregarPacientes(); }
    } catch (err) {}
  };

  const salvarOdontograma = async (dadosDentes) => {
    try {
      const res = await fetch(`/api/pacientes/${selectedPaciente.id}/odontograma`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dados: dadosDentes })
      });
      if (res.ok) {
        setOdontogramaData(dadosDentes);
        setSelectedPaciente({...selectedPaciente, odontograma_dados: JSON.stringify(dadosDentes)});
        carregarPacientes(); 
        showNotif('Odontograma guardado permanentemente!');
      }
    } catch(err) { showNotif('Erro ao guardar o Odontograma.', 'error'); }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;
      try {
        const res = await fetch(`/api/pacientes/${selectedPaciente.id}/exames`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: file.name, base64: base64 })
        });
        if (res.ok) {
          showNotif('Documento guardado com sucesso!');
          const resE = await fetch(`/api/pacientes/${selectedPaciente.id}/exames`);
          setExames(await resE.json());
        }
      } catch (err) {}
    };
    reader.readAsDataURL(file);
  };

  const apagarExame = async (idExame) => {
    try {
      const res = await fetch(`/api/pacientes/exames/${idExame}`, { method: 'DELETE' });
      if (res.ok) { showNotif('Documento apagado.'); setExames(exames.filter(e => e.id !== idExame)); }
    } catch (err) {}
  };

  const confirmarApagarPaciente = async () => {
    if (!pacienteToDelete) return;
    try {
      const res = await fetch(`/api/pacientes/${pacienteToDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        showNotif('Paciente eliminado permanentemente!');
        setPacienteToDelete(null); setShowDeleteConfirm(false); setSelectedPaciente(null); carregarPacientes();
      }
    } catch (err) {}
  };

  const clickApagar = (e, paciente) => { e.stopPropagation(); setPacienteToDelete(paciente); setShowDeleteConfirm(true); };

  const abrirEdicao = () => {
    setFormData({ id: selectedPaciente.id, nome: selectedPaciente.nome, telefone: selectedPaciente.telefone || '', email: selectedPaciente.email || '' });
    setShowEditModal(true);
  };

  const salvarEdicao = async (e) => {
    e.preventDefault();
    const partesNome = formData.nome.trim().split(' ');
    if (partesNome.length < 2) { showNotif('É obrigatório preencher o Primeiro e Último nome.', 'error'); return; }
    if (!formData.telefone || formData.telefone.replace(/\s+/g, '').length < 9) { showNotif('O número de telemóvel é obrigatório.', 'error'); return; }
    try {
      const res = await fetch(`/api/pacientes/${formData.id}/dados`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData)
      });
      if (res.ok) {
        showNotif('Dados atualizados!'); setShowEditModal(false); carregarPacientes();
        setSelectedPaciente({ ...selectedPaciente, nome: formData.nome, telefone: formData.telefone, email: formData.email });
      }
    } catch (err) {}
  };

  const adicionarMed = () => setRxMeds([...rxMeds, { nome: '', posologia: '' }]);
  const removerMed = (index) => { const novos = [...rxMeds]; novos.splice(index, 1); setRxMeds(novos); };
  const updateMed = (index, field, value) => { const novos = [...rxMeds]; novos[index][field] = value; setRxMeds(novos); };

  const preencherRapido = (nome, posologia) => {
    const vazios = rxMeds.filter(m => m.nome === '');
    if (vazios.length > 0) {
      const novos = [...rxMeds]; novos[rxMeds.length - 1] = { nome, posologia }; setRxMeds(novos);
    } else { setRxMeds([...rxMeds, { nome, posologia }]); }
  };

  // --- MAGIA: GERAÇÃO DA RECEITA COM CARIMBO DE ASSINATURA ---
  const gerarReceitaPDF = async () => {
    if (rxMeds.length === 0 || !rxMeds[0].nome) {
      showNotif('Adicione pelo menos um medicamento à receita.', 'error'); return;
    }

    const doc = new jsPDF();
    
    // CABEÇALHO
    doc.setTextColor(37, 99, 235); doc.setFontSize(22); doc.setFont(undefined, 'bold'); doc.text("MECLINIC", 20, 20);
    doc.setTextColor(0, 0, 0); doc.setFontSize(14); doc.text(t('patients.rx.title') || "RECEITA MÉDICA", 20, 32);

    // INFO PACIENTE E MÉDICO
    doc.setFontSize(10); doc.setFont(undefined, 'normal'); doc.setTextColor(100, 116, 139);
    const dataHoje = new Date().toLocaleDateString(activeLocale);
    doc.text(`Data: ${dataHoje}`, 20, 42);
    doc.text(`Paciente: ${selectedPaciente.nome}`, 20, 48);
    doc.text(`Médico Responsável: ${currentUser.nome || 'Corpo Clínico'}`, 20, 54);

    doc.setDrawColor(200, 200, 200); doc.line(20, 60, 190, 60);

    // LISTA DE MEDICAMENTOS
    doc.setTextColor(0, 0, 0);
    let y = 75;

    doc.setFontSize(16); doc.setFont(undefined, 'bold'); doc.setTextColor(37, 99, 235); doc.text("Rx", 20, y); y += 10;

    doc.setTextColor(0, 0, 0);
    rxMeds.forEach((med, index) => {
      if(y > 250) { doc.addPage(); y = 20; }
      if(med.nome) {
        doc.setFontSize(12); doc.setFont(undefined, 'bold'); doc.text(`${index + 1}. ${med.nome}`, 20, y); y += 6;
        doc.setFontSize(10); doc.setFont(undefined, 'normal'); doc.text(med.posologia || 'Tomar conforme indicação médica.', 25, y); y += 14;
      }
    });

    // ASSINATURA DIGITAL APLICADA NO PDF
    y += 20;
    if(y > 250) { doc.addPage(); y = 30; }
    
    if (assinaturaMedica) {
      // Injeta a imagem transparente da assinatura! (x=20, y=..., width=60, height=25)
      doc.addImage(assinaturaMedica, 'PNG', 20, y - 15, 60, 25);
    }
    
    doc.setDrawColor(0, 0, 0);
    doc.line(20, y + 10, 90, y + 10);
    doc.text("Assinatura do Médico", 20, y + 16);

    const pdfBase64 = doc.output('datauristring');
    const nomeFicheiro = `Receita_${selectedPaciente.nome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    doc.save(nomeFicheiro);

    try {
      await fetch(`/api/pacientes/${selectedPaciente.id}/exames`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: nomeFicheiro, base64: pdfBase64 })
      });
      const resE = await fetch(`/api/pacientes/${selectedPaciente.id}/exames`);
      setExames(await resE.json());
      
      showNotif('Receita gerada com sucesso!');
      setShowRxModal(false); setRxMeds([{ nome: '', posologia: '' }]); setAssinaturaMedica(null); setActiveTab('exames'); 
      
      if (sendWhatsapp && selectedPaciente.telefone) {
        const numWhatsApp = selectedPaciente.telefone.replace(/\D/g, ''); 
        if (numWhatsApp) {
          const primeiroNome = selectedPaciente.nome.split(' ')[0];
          const mensagemMsg = `Olá ${primeiroNome}, aqui está a sua Receita Médica emitida pela clínica MeClinic. \n\nPor favor, veja o documento em anexo. As melhoras!`;
          const urlWhatsapp = `https://wa.me/${numWhatsApp}?text=${encodeURIComponent(mensagemMsg)}`;
          window.open(urlWhatsapp, '_blank');
        }
      }
    } catch (err) { showNotif('Receita gerada, mas falha ao guardar.', 'error'); }
  };

  const pacientesFiltrados = pacientes.filter(p => p.nome.toLowerCase().includes(pesquisa.toLowerCase()) || (p.telefone && p.telefone.includes(pesquisa)));
  const inputStyle = { width: '100%', padding: '14px', borderRadius: '10px', border: `1px solid ${theme.border}`, background: theme.isDark ? '#0f172a' : '#f8fafc', color: theme.text, outline: 'none', boxSizing: 'border-box', fontSize: '14px', marginBottom: '15px' };

  return (
    <div style={{ padding: '20px', color: theme.text, maxWidth: '1400px', margin: '0 auto', boxSizing: 'border-box' }}>
      
      {notification.show && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', backgroundColor: notification.type === 'error' ? '#ef4444' : '#10b981', color: 'white', padding: '15px 25px', borderRadius: '10px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '10px', animation: 'fadeIn 0.3s' }}>
          {notification.type === 'error' ? <XCircle size={20} /> : <CheckCircle size={20} />} 
          <span style={{ fontWeight: 'bold' }}>{notification.message}</span>
        </div>
      )}

      {/* MODAL: GERADOR DE RECEITAS MÉDICAS COM ASSINATURA */}
      {showRxModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1020, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)', padding: '20px' }}>
          <div style={{ backgroundColor: theme.cardBg, width: '100%', maxWidth: '650px', borderRadius: '20px', padding: '35px', border: `1px solid ${theme.border}`, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', maxHeight: '95vh', display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: theme.isDark ? '#ffffff' : theme.text, fontSize: '22px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Pill size={24} color="#10b981" /> {t('patients.rx.title') || 'Nova Receita Médica'}
              </h2>
              <button onClick={() => { setShowRxModal(false); setRxMeds([{ nome: '', posologia: '' }]); setAssinaturaMedica(null); }} style={{ background: 'none', border: 'none', color: theme.subText, cursor: 'pointer' }}><X size={24} /></button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '10px' }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: theme.subText, width: '100%', textTransform: 'uppercase' }}>Adição Rápida:</span>
                <button onClick={() => preencherRapido('Ibuprofeno 600mg', '1 comprimido de 8 em 8 horas, se tiver dor.')} style={{ padding: '6px 12px', borderRadius: '20px', border: `1px solid ${theme.border}`, background: theme.pageBg, color: theme.text, fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>+ Ibuprofeno 600mg</button>
                <button onClick={() => preencherRapido('Amoxicilina 875mg + Ácido Clavulânico 125mg', '1 comprimido de 12 em 12 horas, durante 8 dias.')} style={{ padding: '6px 12px', borderRadius: '20px', border: `1px solid ${theme.border}`, background: theme.pageBg, color: theme.text, fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>+ Amoxicilina</button>
                <button onClick={() => preencherRapido('Paracetamol 1000mg', '1 comprimido em caso de dor ou febre (máx 3/dia).')} style={{ padding: '6px 12px', borderRadius: '20px', border: `1px solid ${theme.border}`, background: theme.pageBg, color: theme.text, fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>+ Paracetamol 1g</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px' }}>
                {rxMeds.map((med, index) => (
                  <div key={index} style={{ padding: '15px', backgroundColor: theme.isDark ? '#0f172a' : '#f8fafc', borderRadius: '12px', border: `1px solid ${theme.border}`, position: 'relative' }}>
                    {rxMeds.length > 1 && (
                      <button onClick={() => removerMed(index)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16}/></button>
                    )}
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: theme.subText, marginBottom: '5px', textTransform: 'uppercase' }}>{t('patients.rx.med') || 'Medicamento'}</label>
                    <input type="text" value={med.nome} onChange={e => updateMed(index, 'nome', e.target.value)} placeholder="Ex: Ibuprofeno 600mg" style={{ ...inputStyle, marginBottom: '10px', padding: '10px' }} />
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: theme.subText, marginBottom: '5px', textTransform: 'uppercase' }}>{t('patients.rx.dos') || 'Posologia'}</label>
                    <input type="text" value={med.posologia} onChange={e => updateMed(index, 'posologia', e.target.value)} placeholder="Ex: 1 comprimido de 8/8h após as refeições" style={{ ...inputStyle, marginBottom: 0, padding: '10px' }} />
                  </div>
                ))}
                <button onClick={adicionarMed} style={{ padding: '12px', borderRadius: '10px', border: `2px dashed ${theme.border}`, background: 'transparent', color: '#2563eb', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  <Plus size={18} /> {t('patients.rx.add') || 'Adicionar Medicamento'}
                </button>
              </div>

              {/* BLOCO DA ASSINATURA NO ECRÃ */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: theme.text, marginBottom: '10px', textTransform: 'uppercase' }}>Assinatura Médica</label>
                <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: theme.subText }}>Assine no quadro abaixo. A assinatura será colocada no PDF final.</p>
                <Assinatura onSaveSignature={setAssinaturaMedica} />
              </div>

              <div style={{ marginTop: '15px', backgroundColor: theme.isDark ? 'rgba(34, 197, 94, 0.1)' : '#f0fdf4', padding: '15px', borderRadius: '10px', border: `1px solid #22c55e` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input type="checkbox" id="sendWa" checked={sendWhatsapp} onChange={(e) => setSendWhatsapp(e.target.checked)} style={{ cursor: 'pointer', width: '18px', height: '18px', accentColor: '#22c55e' }} />
                  <label htmlFor="sendWa" style={{ cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MessageCircle size={18} /> Preparar envio por WhatsApp
                  </label>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', borderTop: `1px solid ${theme.border}`, paddingTop: '20px' }}>
              <button onClick={() => { setShowRxModal(false); setRxMeds([{ nome: '', posologia: '' }]); setAssinaturaMedica(null); }} style={{ flex: 1, padding: '14px', borderRadius: '10px', border: 'none', backgroundColor: theme.pageBg, color: theme.text, fontWeight: 'bold', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={gerarReceitaPDF} style={{ flex: 2, padding: '14px', borderRadius: '10px', border: 'none', backgroundColor: '#10b981', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)' }}>
                <FileText size={18} /> {t('patients.rx.generate') || 'Assinar, Gerar & Guardar Receita'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESTO DA PÁGINA DOS PACIENTES... */}
      {showEditModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1010, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)', padding: '20px' }}>
          <div style={{ backgroundColor: theme.cardBg, width: '100%', maxWidth: '450px', borderRadius: '20px', padding: '35px', border: `1px solid ${theme.border}`, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h2 style={{ margin: 0, color: theme.isDark ? '#ffffff' : theme.text, fontSize: '22px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Edit2 size={24} color="#2563eb" /> Editar Dados
              </h2>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', color: theme.subText, cursor: 'pointer' }}><X size={24} /></button>
            </div>
            <form onSubmit={salvarEdicao}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: theme.subText, marginBottom: '8px', textTransform: 'uppercase' }}>Nome Completo *</label>
              <input type="text" value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} placeholder="Ex: David Fonseca" style={inputStyle} required />
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: theme.subText, marginBottom: '8px', textTransform: 'uppercase' }}>Telemóvel *</label>
              <input type="text" value={formData.telefone} onChange={(e) => setFormData({...formData, telefone: e.target.value})} placeholder="Ex: +351 912 345 678" style={inputStyle} required />
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: theme.subText, marginBottom: '8px', textTransform: 'uppercase' }}>Email (Opcional)</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="Ex: david@email.com" style={inputStyle} />
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowEditModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '10px', border: 'none', backgroundColor: theme.pageBg, color: theme.text, fontWeight: 'bold', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ flex: 1, padding: '14px', borderRadius: '10px', border: 'none', backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Guardar Dados</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && pacienteToDelete && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)' }}>
          <div style={{ backgroundColor: theme.cardBg, padding: '30px', borderRadius: '20px', width: '380px', textAlign: 'center', border: `1px solid ${theme.border}`, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <AlertTriangle size={50} color="#ef4444" style={{ marginBottom: '15px' }} />
            <h2 style={{ margin: '0 0 10px 0', color: theme.isDark ? '#ffffff' : theme.text }}>Eliminar Paciente</h2>
            <p style={{ color: theme.subText, marginBottom: '25px', fontSize: '14px' }}>
              Tem a certeza que deseja eliminar o(a) paciente <strong style={{color: theme.text}}>{pacienteToDelete.nome}</strong>? Esta ação apagará todo o histórico e exames para sempre.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setShowDeleteConfirm(false); setPacienteToDelete(null); }} style={{ padding: '12px 20px', borderRadius: '10px', border: 'none', backgroundColor: theme.pageBg, color: theme.text, flex: 1, fontWeight: 'bold', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={confirmarApagarPaciente} style={{ padding: '12px 20px', borderRadius: '10px', border: 'none', backgroundColor: '#ef4444', color: 'white', flex: 1, fontWeight: 'bold', cursor: 'pointer' }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {selectedPaciente && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)', padding: '20px' }}>
          <div style={{ backgroundColor: theme.cardBg, width: '100%', maxWidth: '1000px', borderRadius: '20px', border: `1px solid ${theme.border}`, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div style={{ padding: '25px 30px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.isDark ? '#0f172a' : '#f8fafc', borderTopLeftRadius: '20px', borderTopRightRadius: '20px' }}>
              <h2 style={{ margin: 0, color: theme.isDark ? '#ffffff' : theme.text, fontSize: '22px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Activity size={26} color="#2563eb" /> {t('patients.modal.info')}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <button onClick={() => setShowRxModal(true)} style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', backgroundColor: '#10b981', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform='scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>
                  <Pill size={18} /> {t('patients.rx.btn') || 'Passar Receita'}
                </button>
                <button onClick={() => setSelectedPaciente(null)} style={{ background: 'none', border: 'none', color: theme.subText, cursor: 'pointer', transition: 'color 0.2s' }}><X size={28} /></button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '0', flex: 1, overflow: 'hidden' }}>
              <div style={{ padding: '30px', borderRight: `1px solid ${theme.border}`, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
                  <div style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#2563eb', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '28px', fontWeight: 'bold' }}>
                    {selectedPaciente.nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h3 style={{ margin: '0 0 5px 0', fontSize: '22px' }}>{selectedPaciente.nome}</h3>
                      <button onClick={abrirEdicao} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }} title="Editar Dados"><Edit2 size={16} /></button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', color: theme.subText, fontSize: '14px' }}>
                      {selectedPaciente.telefone && <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Phone size={14}/> {selectedPaciente.telefone}</span>}
                      {selectedPaciente.email && <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Mail size={14}/> {selectedPaciente.email}</span>}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px' }}>
                  <div style={{ backgroundColor: theme.pageBg, padding: '15px', borderRadius: '12px', border: `1px solid ${theme.border}` }}>
                    <div style={{ fontSize: '11px', color: theme.subText, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>{t('patients.table.consultations')}</div>
                    <div style={{ fontSize: '22px', fontWeight: '900', color: '#8b5cf6' }}>{selectedPaciente.total_consultas}</div>
                  </div>
                  <div style={{ backgroundColor: theme.pageBg, padding: '15px', borderRadius: '12px', border: `1px solid ${theme.border}` }}>
                    <div style={{ fontSize: '11px', color: theme.subText, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>{t('patients.table.billed')}</div>
                    <div style={{ fontSize: '22px', fontWeight: '900', color: '#10b981' }}>{selectedPaciente.total_faturado} €</div>
                  </div>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: theme.subText, marginBottom: '10px', textTransform: 'uppercase' }}>
                    <FileText size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }}/> {t('patients.modal.notes')}
                  </label>
                  <textarea 
                    value={notasClinicas} 
                    onChange={(e) => setNotasClinicas(e.target.value)}
                    placeholder={t('patients.modal.notes_ph')}
                    style={{ flex: 1, minHeight: '150px', width: '100%', padding: '15px', borderRadius: '12px', border: `1px solid ${theme.border}`, background: theme.isDark ? '#0f172a' : '#f8fafc', color: theme.text, outline: 'none', resize: 'none', boxSizing: 'border-box', fontSize: '14px', lineHeight: '1.5' }}
                  />
                  <button onClick={guardarNotas} style={{ width: '100%', padding: '14px', marginTop: '15px', borderRadius: '10px', border: 'none', backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)' }}>
                    <Save size={18} /> {t('patients.modal.save_notes')}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: theme.isDark ? '#1e293b' : '#f1f5f9' }}>
                <div style={{ display: 'flex', borderBottom: `1px solid ${theme.border}`, backgroundColor: theme.cardBg }}>
                  <button onClick={() => setActiveTab('historico')} style={{ flex: 1, padding: '20px', background: 'none', border: 'none', borderBottom: activeTab === 'historico' ? '3px solid #2563eb' : '3px solid transparent', color: activeTab === 'historico' ? '#2563eb' : theme.subText, fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={18} /> {t('patients.tabs.history')}
                  </button>
                  <button onClick={() => setActiveTab('exames')} style={{ flex: 1, padding: '20px', background: 'none', border: 'none', borderBottom: activeTab === 'exames' ? '3px solid #2563eb' : '3px solid transparent', color: activeTab === 'exames' ? '#2563eb' : theme.subText, fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                    <File size={18} /> {t('patients.tabs.exams')}
                  </button>
                  <button onClick={() => setActiveTab('odontograma')} style={{ flex: 1, padding: '20px', background: 'none', border: 'none', borderBottom: activeTab === 'odontograma' ? '3px solid #2563eb' : '3px solid transparent', color: activeTab === 'odontograma' ? '#2563eb' : theme.subText, fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                    <Smile size={18} /> Odontograma
                  </button>
                </div>

                {activeTab === 'historico' && (
                  <div style={{ padding: '30px', overflowY: 'auto', flex: 1 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      {historico.length > 0 ? historico.map(c => {
                        const isFinalizada = c.status === 'FINALIZADA';
                        return (
                          <div key={c.id} style={{ backgroundColor: theme.cardBg, padding: '15px', borderRadius: '12px', border: `1px solid ${theme.border}`, borderLeft: `4px solid ${isFinalizada ? '#10b981' : '#3b82f6'}`, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{new Date(c.data_consulta).toLocaleDateString(activeLocale)}</span>
                              <span style={{ fontSize: '12px', color: isFinalizada ? '#10b981' : '#3b82f6', fontWeight: 'bold', backgroundColor: isFinalizada ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)', padding: '4px 10px', borderRadius: '20px' }}>{c.status}</span>
                            </div>
                            <div style={{ color: theme.subText, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <Clock size={14}/> {c.hora_consulta.substring(0,5)} • <span style={{ fontWeight: 'bold', color: theme.text }}>{c.procedimento_nome || 'Consulta Geral'}</span>
                            </div>
                          </div>
                        )
                      }) : (
                        <div style={{ textAlign: 'center', padding: '40px', color: theme.subText, border: `1px dashed ${theme.border}`, borderRadius: '12px', backgroundColor: theme.cardBg }}>
                          <Calendar size={40} style={{ opacity: 0.3, marginBottom: '15px' }} /><br/>{t('patients.modal.empty_history')}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'exames' && (
                  <div style={{ padding: '30px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
                    <button onClick={() => fileInputRef.current.click()} style={{ width: '100%', padding: '20px', borderRadius: '12px', border: `2px dashed #2563eb`, backgroundColor: 'rgba(37,99,235,0.05)', color: '#2563eb', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '25px', transition: 'all 0.2s' }}>
                      <UploadCloud size={24} /> {t('patients.exams.upload')}
                    </button>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {exames.length > 0 ? exames.map(exame => (
                        <div key={exame.id} style={{ backgroundColor: theme.cardBg, padding: '15px', borderRadius: '12px', border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', overflow: 'hidden' }}>
                            <div style={{ padding: '10px', backgroundColor: theme.pageBg, borderRadius: '10px', color: '#64748b' }}>
                              <File size={20} />
                            </div>
                            <div style={{ overflow: 'hidden' }}>
                              <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{exame.nome_exame}</h4>
                              <span style={{ fontSize: '11px', color: theme.subText }}>{new Date(exame.data_exame).toLocaleDateString(activeLocale)}</span>
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <a href={exame.arquivo_base64} download={exame.nome_exame} style={{ padding: '8px 12px', backgroundColor: '#dbeafe', color: '#2563eb', borderRadius: '8px', textDecoration: 'none', display: 'flex', alignItems: 'center', fontWeight: 'bold', fontSize: '12px' }}>
                              <Download size={16} />
                            </a>
                            {isAdmin && (
                              <button onClick={() => apagarExame(exame.id)} style={{ padding: '8px', backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      )) : (
                        <div style={{ textAlign: 'center', padding: '40px', color: theme.subText, border: `1px dashed ${theme.border}`, borderRadius: '12px', backgroundColor: theme.cardBg }}>
                          <File size={40} style={{ opacity: 0.3, marginBottom: '15px' }} /><br/>{t('patients.exams.empty')}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'odontograma' && (
                  <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <p style={{ color: theme.subText, fontSize: '14px', marginBottom: '10px', marginTop: 0 }}>Desenhe o estado clínico do paciente clicando nas faces dos dentes.</p>
                    <Odontograma onSave={salvarOdontograma} initialData={odontogramaData} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '30px', fontWeight: '800', margin: 0, color: theme.isDark ? '#ffffff' : theme.text, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Users size={32} color="#2563eb" /> {t('patients.title')}
          </h1>
          <p style={{ color: theme.subText, margin: '5px 0 0 0' }}>{t('patients.subtitle')}</p>
        </div>
        
        <div style={{ position: 'relative', width: '100%', maxWidth: '350px' }}>
          <Search size={20} color={theme.subText} style={{ position: 'absolute', left: '15px', top: '14px' }} />
          <input type="text" placeholder={t('patients.search')} style={{ width: '100%', padding: '14px 15px 14px 45px', borderRadius: '10px', border: `1px solid ${theme.border}`, background: theme.cardBg, color: theme.text, outline: 'none', fontSize: '15px', boxSizing: 'border-box' }} value={pesquisa} onChange={(e) => setPesquisa(e.target.value)} />
        </div>
      </div>

      <div style={{ backgroundColor: theme.cardBg, borderRadius: '16px', border: `1px solid ${theme.border}`, overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: theme.pageBg, color: theme.subText, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <th style={{ padding: '15px 20px', borderBottom: `1px solid ${theme.border}` }}>{t('patients.table.name')}</th>
                <th style={{ padding: '15px 20px', borderBottom: `1px solid ${theme.border}` }}>{t('patients.table.contact')}</th>
                <th style={{ padding: '15px 20px', borderBottom: `1px solid ${theme.border}`, textAlign: 'center' }}>{t('patients.table.consultations')}</th>
                <th style={{ padding: '15px 20px', borderBottom: `1px solid ${theme.border}`, textAlign: 'right' }}>{t('patients.table.billed')}</th>
                <th style={{ padding: '15px 20px', borderBottom: `1px solid ${theme.border}`, textAlign: 'center' }}>{t('patients.table.actions') || 'Ações'}</th>
              </tr>
            </thead>
            <tbody>
              {pacientesFiltrados.map(p => (
                <tr key={p.id} style={{ borderBottom: `1px solid ${theme.border}`, transition: 'background-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = theme.isDark ? '#1e293b' : '#f8fafc'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ padding: '15px 20px', fontWeight: 'bold', color: theme.text, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' }}>
                      {p.nome.charAt(0).toUpperCase()}
                    </div>
                    {p.nome}
                  </td>
                  <td style={{ padding: '15px 20px', color: theme.subText, fontSize: '14px' }}>{p.telefone || '-'}</td>
                  <td style={{ padding: '15px 20px', textAlign: 'center' }}><span style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', padding: '4px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '13px' }}>{p.total_consultas}</span></td>
                  <td style={{ padding: '15px 20px', textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>{p.total_faturado} €</td>
                  <td style={{ padding: '15px 20px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                      <button onClick={() => abrirFichaPaciente(p)} title="Ver Ficha e Exames" style={{ backgroundColor: '#dbeafe', color: '#2563eb', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Eye size={18} /></button>
                      {isAdmin && <button onClick={(e) => clickApagar(e, p)} title="Eliminar Paciente" style={{ backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Trash2 size={18} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
              {pacientesFiltrados.length === 0 && (
                <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: theme.subText }}><User size={40} style={{ opacity: 0.3, marginBottom: '10px' }} /><br/>Nenhum paciente encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Pacientes;