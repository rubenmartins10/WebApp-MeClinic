import React, { useState, useEffect, useContext, useRef } from 'react';
import { Users, Search, User, Phone, Mail, FileText, Calendar, Save, X, Activity, Clock, CheckCircle, XCircle, File as FileIcon, Download, UploadCloud, Trash2, AlertTriangle, Eye, Edit2, Pill, Plus, MessageCircle, Smile } from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';
import { LanguageContext } from '../contexts/LanguageContext';
import jsPDF from 'jspdf';
import Odontograma from '../components/specialized/Odontograma';
import Assinatura from '../components/specialized/Assinatura';
import { getActiveLocale } from '../utils/locale';
import apiService from '../services/api';

const ALLOWED_EXAM_TYPES = ['application/pdf', 'image/png'];
const MAX_EXAM_SIZE = 10 * 1024 * 1024; // 10 MB

const Pacientes = () => {
  const { theme } = useContext(ThemeContext);
  const { t, language } = useContext(LanguageContext);

  const currentUser = (() => { try { return JSON.parse(localStorage.getItem('meclinic_user') || '{}'); } catch { return {}; } })();
  const isAdmin = currentUser?.role?.toUpperCase() === 'ADMIN';

  const [pacientes, setPacientes] = useState([]);
  const [pesquisa, setPesquisa] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 20;
  
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
  const [sendEmail, setSendEmail] = useState(false);
  const [assinaturaMedica, setAssinaturaMedica] = useState(null);

  const fileInputRef = useRef(null);
  const activeLocale = getActiveLocale(language);

  useEffect(() => { carregarPacientes(1, true); }, []);

  const carregarPacientes = async (p = 1, reset = false) => {
    try {
      if (p > 1) setLoadingMore(true);
      const data = await apiService.get(`/api/pacientes?page=${p}&limit=${PAGE_SIZE}`);
      const lista = Array.isArray(data) ? data : (data.pacientes || []);
      const pagination = data.pagination || {};
      setPacientes(prev => reset ? lista : [...prev, ...lista]);
      setPage(p);
      setHasMore(pagination.pages ? p < pagination.pages : lista.length === PAGE_SIZE);
    } catch (err) { /* silencioso */ } finally { setLoadingMore(false); }
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
    try { odontoGuardado = typeof paciente.odontograma_dados === 'string' ? JSON.parse(paciente.odontograma_dados) : (paciente.odontograma_dados || {}); } catch(e) {}
    setOdontogramaData(odontoGuardado);
    
    Promise.all([
      apiService.get(`/api/pacientes/${paciente.id}/historico`).catch(() => []),
      apiService.get(`/api/pacientes/${paciente.id}/exames`).catch(() => [])
    ]).then(([histData, examesData]) => {
      setHistorico(Array.isArray(histData) ? histData : (histData.consultas || histData.historico || []));
      setExames(Array.isArray(examesData) ? examesData : (examesData.exames || []));
    }).catch(err => {
      setHistorico([]); setExames([]);
    });
  };

  const guardarNotas = async () => {
    try {
      await apiService.put(`/api/pacientes/${selectedPaciente.id}/notas`, { notas: notasClinicas });
      showNotif(t('patients.modal.save_notes') + ' OK!'); carregarPacientes();
    } catch (err) {}
  };

  const salvarOdontograma = async (dadosDentes) => {
    try {
      await apiService.put(`/api/pacientes/${selectedPaciente.id}/odontograma`, { dados: dadosDentes });
      setOdontogramaData(dadosDentes);
      setSelectedPaciente({...selectedPaciente, odontograma_dados: JSON.stringify(dadosDentes)});
      carregarPacientes(); 
      showNotif('Odontograma guardado permanentemente!');
    } catch(err) { showNotif('Erro ao guardar o Odontograma.', 'error'); }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (!ALLOWED_EXAM_TYPES.includes(file.type)) {
      showNotif('Tipo de ficheiro não permitido. Apenas PDF ou PNG são aceites.', 'error');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_EXAM_SIZE) {
      showNotif('Ficheiro demasiado grande. Tamanho máximo: 10 MB.', 'error');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;
      try {
        await apiService.post(`/api/pacientes/${selectedPaciente.id}/exames`, { nome: file.name, base64: base64 });
        showNotif('Documento guardado com sucesso!');
        const examesData = await apiService.get(`/api/pacientes/${selectedPaciente.id}/exames`);
        setExames(Array.isArray(examesData) ? examesData : (examesData.exames || []));
      } catch (err) {
        showNotif(err.message || 'Erro ao guardar o documento. Tente novamente.', 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  const apagarExame = async (idExame) => {
    try {
      await apiService.delete(`/api/pacientes/exames/${idExame}`);
      showNotif('Documento apagado.'); setExames(exames.filter(e => e.id !== idExame));
    } catch (err) {}
  };

  const confirmarApagarPaciente = async () => {
    if (!pacienteToDelete) return;
    try {
      await apiService.delete(`/api/pacientes/${pacienteToDelete.id}`);
      showNotif('Paciente eliminado permanentemente!');
      setPacienteToDelete(null); setShowDeleteConfirm(false); setSelectedPaciente(null); carregarPacientes();
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
      await apiService.put(`/api/pacientes/${formData.id}/dados`, formData);
      showNotif('Dados atualizados!'); setShowEditModal(false); carregarPacientes();
      setSelectedPaciente({ ...selectedPaciente, nome: formData.nome, telefone: formData.telefone, email: formData.email });
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

  const gerarReceitaPDF = async () => {
    if (rxMeds.length === 0 || !rxMeds[0].nome) { showNotif('Adicione pelo menos um medicamento à receita.', 'error'); return; }

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210, H = 297, mg = 12;
    const C = {
      teal:      [14, 170, 165],
      tealDark:  [8,  120, 116],
      tealBg:    [230, 248, 248],
      white:     [255, 255, 255],
      dark:      [25,  25,  25],
      gray:      [110, 110, 110],
      lightGray: [247, 247, 247],
      midGray:   [210, 210, 210],
    };

    const clinicSettings = (() => { try { return JSON.parse(localStorage.getItem('meclinic_settings') || '{}'); } catch { return {}; } })();
    const clinicNome     = clinicSettings.nome     || 'MeClinic';
    const clinicMorada   = (clinicSettings.morada  || 'Rua Principal, 123  |  Lisboa').replace(/\n/g, '  |  ');
    const clinicEmail    = clinicSettings.email    || 'geral@meclinic.pt';
    const clinicTelefone = clinicSettings.telefone || '+351 XXX XXX XXX';
    const dataHoje       = new Date().toLocaleDateString('pt-PT', { dateStyle: 'full' });

    // ── BANNER ──────────────────────────────────
    doc.setFillColor(...C.tealDark); doc.rect(0, 0, W, 2, 'F');
    doc.setFillColor(...C.teal);     doc.rect(0, 2, W, 26, 'F');
    doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.white);
    doc.text(clinicNome.toUpperCase(), mg, 14);
    doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text('Clínica Dentária', mg, 21);
    doc.setFontSize(12); doc.setFont('helvetica', 'bold');
    doc.text('RECEITA MÉDICA', W - mg, 13, { align: 'right' });
    doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text(clinicMorada, W - mg, 19, { align: 'right' });
    doc.text(`${clinicEmail}  |  ${clinicTelefone}`, W - mg, 25, { align: 'right' });

    // ── INFO BAR ────────────────────────────────
    const nib = 28;
    doc.setFillColor(...C.tealBg); doc.rect(0, nib, W, 13, 'F');
    doc.setFillColor(...C.teal);   doc.rect(0, nib + 13, W, 0.4, 'F');
    doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.dark);
    doc.text(`Paciente: ${selectedPaciente.nome}`, mg, nib + 5);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray);
    doc.text(`Data de emissão: ${dataHoje}   |   Médico: ${currentUser.nome || 'Corpo Clínico'}`, mg, nib + 10.5);

    // ── MEDICAÇÃO ───────────────────────────────
    let y = nib + 22;
    const bW = W - 2 * mg;
    doc.setFillColor(...C.tealDark); doc.rect(mg, y, bW, 1.5, 'F');
    doc.setFillColor(...C.teal);     doc.rect(mg, y + 1.5, bW, 9, 'F');
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.white);
    doc.text('Rx  —  Medicação Prescrita', mg + 5, y + 8);
    y += 13;

    const medsFiltered = rxMeds.filter(m => m.nome);
    medsFiltered.forEach((med, index) => {
      if (y > H - 55) { doc.addPage(); y = 20; }
      doc.setFillColor(...C.tealBg); doc.setDrawColor(...C.midGray); doc.setLineWidth(0.25);
      doc.rect(mg, y, bW, 19, 'FD');
      doc.setFillColor(...C.teal); doc.rect(mg, y, 2.5, 19, 'F');
      doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.gray);
      doc.text(`${index + 1}`, mg + 7, y + 7.5, { align: 'center' });
      doc.setFontSize(10.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.dark);
      doc.text(med.nome, mg + 12, y + 8);
      doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray);
      doc.text(med.posologia || 'Tomar conforme indicação médica.', mg + 12, y + 14.5);
      y += 22;
    });

    // ── ASSINATURA ──────────────────────────────
    y += 8;
    if (y > H - 60) { doc.addPage(); y = 20; }
    if (assinaturaMedica) { doc.addImage(assinaturaMedica, 'PNG', mg, y, 65, 25); y += 27; }
    else { y += 15; }
    doc.setDrawColor(...C.dark); doc.setLineWidth(0.5);
    doc.line(mg, y, mg + 72, y);
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray);
    doc.text('Assinatura do Médico Responsável', mg, y + 5);
    doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.dark);
    doc.text(currentUser.nome || 'Corpo Clínico', mg, y + 11);

    // ── FOOTER ──────────────────────────────────
    doc.setFontSize(7); doc.setFont('helvetica', 'italic'); doc.setTextColor(...C.gray);
    doc.text('Documento confidencial. Emitido automaticamente pelo Sistema MeClinic.', W / 2, H - 22, { align: 'center' });
    doc.setDrawColor(...C.teal); doc.setLineWidth(0.4);
    doc.line(mg, H - 16, W - mg, H - 16);
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.dark);
    doc.text(`${clinicNome} — Receita Médica`, W / 2, H - 11, { align: 'center' });
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray);
    doc.text(`${dataHoje}  |  Documento confidencial`, W / 2, H - 6, { align: 'center' });
    doc.setFillColor(...C.teal); doc.rect(0, H - 3.5, W, 3.5, 'F');

    const pdfBase64 = doc.output('datauristring');
    const nomeFicheiro = `Receita_${selectedPaciente.nome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

    // Preparar mensagens (sync, antes de qualquer await)
    const clinicCfg   = (() => { try { return JSON.parse(localStorage.getItem('meclinic_settings') || '{}'); } catch { return {}; } })();
    const clinicaNome  = clinicCfg.nome     || 'MeClinic';
    const clinicaTel   = clinicCfg.telefone || '';
    const clinicaEmail = clinicCfg.email    || '';
    const primeiroNome = selectedPaciente.nome.split(' ')[0];
    const dataMensagem = new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });

    const msgWa = `Ola ${primeiroNome},\n\nA sua receita medica foi emitida em ${dataMensagem} pela ${clinicaNome}.\n\nEncontra em anexo o PDF com a receita e medicacao prescrita. Por favor cumpra a medicacao conforme indicado. Em caso de duvida ou reacao adversa, contacte-nos de imediato.${clinicaTel ? `\n\nTelefone: ${clinicaTel}` : ''}${clinicaEmail ? `\nEmail: ${clinicaEmail}` : ''}\n\nCom os melhores cumprimentos,\nEquipa ${clinicaNome}`;

    // Abrir WhatsApp e email ANTES do await (browser bloqueia window.open após operações async)
    const openLink = (url) => {
      const a = document.createElement('a');
      a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    };

    if (sendWhatsapp && selectedPaciente.telefone) {
      const numWhatsApp = selectedPaciente.telefone.replace(/\D/g, '');
      if (numWhatsApp) openLink(`https://wa.me/${numWhatsApp}?text=${encodeURIComponent(msgWa)}`);
    }

    if (sendEmail && selectedPaciente.email) {
      const emailBody = `Caro(a) ${primeiroNome},\n\nServe a presente mensagem para informar que a sua receita medica foi emitida em ${dataMensagem} pela ${clinicaNome}.\n\nEm anexo encontra o ficheiro PDF com a receita completa e a medicacao prescrita. Por favor cumpra a medicacao conforme indicado.\n\nEm caso de duvida ou reacao adversa a qualquer medicamento, entre em contacto connosco de imediato.\n\nAtenciosamente,\nEquipa ${clinicaNome}${clinicaTel ? '\n' + clinicaTel : ''}${clinicaEmail ? '\n' + clinicaEmail : ''}`;
      const assunto = encodeURIComponent(`Receita Medica - ${clinicaNome} - ${dataMensagem}`);
      openLink(`mailto:${selectedPaciente.email}?subject=${assunto}&body=${encodeURIComponent(emailBody)}`);
    }

    // Descarregar PDF e fechar modal
    doc.save(nomeFicheiro);
    setShowRxModal(false); setRxMeds([{ nome: '', posologia: '' }]); setAssinaturaMedica(null); setActiveTab('exames');

    // Guardar na ficha do paciente (em background, não bloqueia)
    try {
      await apiService.post(`/api/pacientes/${selectedPaciente.id}/exames`, { nome: nomeFicheiro, base64: pdfBase64 });
      const examesData = await apiService.get(`/api/pacientes/${selectedPaciente.id}/exames`);
      setExames(Array.isArray(examesData) ? examesData : (examesData.exames || []));
      showNotif('Receita gerada e guardada na ficha do paciente!');
    } catch {
      showNotif('PDF descarregado. Falha ao guardar na ficha (servidor).', 'error');
    }
  };

  const pacientesFiltrados = pacientes.filter(p => p.nome.toLowerCase().includes(pesquisa.toLowerCase()) || (p.telefone && p.telefone.includes(pesquisa)));
  
  const inputStyle = { width: '100%', padding: '14px', borderRadius: '10px', border: `1px solid ${theme.border}`, background: theme.isDark ? '#0f172a' : '#f8fafc', color: theme.text, outline: 'none', boxSizing: 'border-box', fontSize: '14px', marginBottom: '15px' };
  const quickBtnStyle = { padding: '5px 12px', borderRadius: '20px', border: `1px solid ${theme.border}`, background: theme.pageBg, color: theme.text, fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' };

  return (
    <div style={{ padding: '20px', color: theme.text, maxWidth: '1400px', margin: '0 auto', boxSizing: 'border-box' }}>
      
      {notification.show && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', backgroundColor: notification.type === 'error' ? '#ef4444' : '#10b981', color: 'white', padding: '15px 25px', borderRadius: '10px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '10px', animation: 'fadeIn 0.3s' }}>
          {notification.type === 'error' ? <XCircle size={20} /> : <CheckCircle size={20} />} 
          <span style={{ fontWeight: 'bold' }}>{notification.message}</span>
        </div>
      )}

      {showRxModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1020, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(8px)', padding: '20px' }}>
          <div style={{ backgroundColor: theme.cardBg, width: '100%', maxWidth: '700px', borderRadius: '24px', border: `1px solid ${theme.border}`, boxShadow: '0 30px 60px -15px rgba(0,0,0,0.6)', maxHeight: '95vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Header */}
            <div style={{ padding: '22px 28px', background: theme.isDark ? 'linear-gradient(135deg, #0a1628 0%, #1e293b 100%)' : 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)', borderBottom: `1px solid ${theme.border}`, borderLeft: '4px solid #10b981', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #059669, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(16,185,129,0.4)' }}><Pill size={20} color="white" /></div>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: theme.isDark ? '#ffffff' : '#0f172a' }}>Nova Receita Médica</h2>
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: theme.subText, paddingLeft: '50px' }}>Paciente: <span style={{ fontWeight: '600', color: '#10b981' }}>{selectedPaciente?.nome}</span></p>
              </div>
              <button onClick={() => { setShowRxModal(false); setRxMeds([{ nome: '', posologia: '' }]); setAssinaturaMedica(null); }} style={{ background: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', border: 'none', color: theme.subText, cursor: 'pointer', borderRadius: '8px', padding: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
            </div>

            <div className="custom-scrollbar" style={{ overflowY: 'auto', flex: 1, padding: '24px 28px' }}>

              {/* Farmácia Rápida */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ width: '3px', height: '16px', backgroundColor: '#10b981', borderRadius: '2px' }}></div>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: theme.subText, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Farmácia Rápida</span>
                </div>
                <div style={{ backgroundColor: theme.isDark ? '#1e293b' : '#f8fafc', borderRadius: '14px', border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
                  {[
                    { label: 'Dor / Inflamação', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', items: [
                      { label: 'Ibuprofeno 600', nome: 'Ibuprofeno 600mg', pos: '1 comp. de 8/8h, após refeições, SOS.' },
                      { label: 'Paracetamol 1g', nome: 'Paracetamol 1000mg', pos: '1 comp. de 8/8h, SOS dor ou febre.' },
                      { label: 'Clonix 250', nome: 'Clonix 250mg', pos: '1 comp. de 8/8h, SOS dor muito forte.' },
                    ]},
                    { label: 'Antibiótico', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', items: [
                      { label: 'Amox/Clav', nome: 'Amoxicilina + Ác. Clavulânico 875/125mg', pos: '1 comp. de 12/12h, durante 8 dias.' },
                      { label: 'Azitromicina 500', nome: 'Azitromicina 500mg', pos: '1 comp. por dia, durante 3 dias.' },
                      { label: 'Clindamicina', nome: 'Clindamicina 300mg', pos: '1 cáps. de 6/6h, durante 8 dias.' },
                    ]},
                    { label: 'Tópicos', color: '#10b981', bg: 'rgba(16,185,129,0.1)', items: [
                      { label: 'Clorohexidina', nome: 'Clorohexidina 0.12% (Colutório)', pos: 'Bochechar 15ml, 2x/dia após escovagem.' },
                      { label: 'Ác. Hialurónico', nome: 'Ácido Hialurónico (Gel Oral)', pos: 'Aplicar na lesão 3x/dia, não enxaguar.' },
                    ]},
                  ].map((cat, ci, arr) => (
                    <div key={ci} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', borderBottom: ci < arr.length - 1 ? `1px solid ${theme.border}` : 'none' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: cat.color, backgroundColor: cat.bg, padding: '4px 10px', borderRadius: '20px', whiteSpace: 'nowrap', minWidth: '115px', textAlign: 'center' }}>{cat.label}</span>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {cat.items.map((item, ii) => (
                          <button key={ii} onClick={() => preencherRapido(item.nome, item.pos)} style={{ padding: '5px 13px', borderRadius: '20px', border: `1.5px solid ${cat.color}`, background: 'transparent', color: cat.color, fontSize: '12px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.15s' }} onMouseEnter={e => { e.currentTarget.style.backgroundColor = cat.bg; }} onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>+ {item.label}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Medicamentos */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ width: '3px', height: '16px', backgroundColor: '#2563eb', borderRadius: '2px' }}></div>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: theme.subText, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Medicamentos Prescritos</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {rxMeds.map((med, index) => (
                    <div key={index} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', flexShrink: 0, marginTop: '11px' }}>{index + 1}</div>
                      <div style={{ flex: 1, backgroundColor: theme.isDark ? '#0f172a' : '#f8fafc', borderRadius: '12px', border: `1px solid ${theme.border}`, padding: '14px', position: 'relative' }}>
                        {rxMeds.length > 1 && <button onClick={() => removerMed(index)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px', display: 'flex' }}><Trash2 size={15}/></button>}
                        <input type="text" value={med.nome} onChange={e => updateMed(index, 'nome', e.target.value)} placeholder="Medicamento — ex: Ibuprofeno 600mg" style={{ ...inputStyle, marginBottom: '8px', padding: '10px 12px', fontWeight: '500' }} />
                        <input type="text" value={med.posologia} onChange={e => updateMed(index, 'posologia', e.target.value)} placeholder="Posologia — ex: 1 comp. de 8/8h após as refeições" style={{ ...inputStyle, marginBottom: 0, padding: '10px 12px' }} />
                      </div>
                    </div>
                  ))}
                  <button onClick={adicionarMed} style={{ marginLeft: '40px', padding: '11px', borderRadius: '10px', border: `2px dashed ${theme.border}`, background: 'transparent', color: '#2563eb', fontWeight: '600', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <Plus size={16} /> Adicionar Medicamento
                  </button>
                </div>
              </div>

              {/* Assinatura */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ width: '3px', height: '16px', backgroundColor: '#8b5cf6', borderRadius: '2px' }}></div>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: theme.subText, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Assinatura Médica</span>
                </div>
                <Assinatura onSaveSignature={setAssinaturaMedica} onNotification={showNotif} />
              </div>

              {/* Envio */}
              {(selectedPaciente?.telefone || selectedPaciente?.email) && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ width: '3px', height: '16px', backgroundColor: '#f59e0b', borderRadius: '2px' }}></div>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: theme.subText, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Enviar ao Paciente</span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {selectedPaciente?.telefone && (
                      <div onClick={() => setSendWhatsapp(!sendWhatsapp)} style={{ flex: 1, padding: '14px 16px', borderRadius: '14px', border: `2px solid ${sendWhatsapp ? '#22c55e' : theme.border}`, backgroundColor: sendWhatsapp ? (theme.isDark ? 'rgba(34,197,94,0.07)' : '#f0fdf4') : (theme.isDark ? '#1e293b' : '#f8fafc'), cursor: 'pointer', transition: 'all 0.2s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: sendWhatsapp ? '#22c55e' : (theme.isDark ? '#334155' : '#e2e8f0'), display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 }}><MessageCircle size={16} color="white" /></div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '700', fontSize: '13px', color: sendWhatsapp ? '#16a34a' : theme.text }}>WhatsApp</div>
                            <div style={{ fontSize: '11px', color: theme.subText }}>{selectedPaciente.telefone}</div>
                          </div>
                          <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: sendWhatsapp ? '#22c55e' : 'transparent', border: `2px solid ${sendWhatsapp ? '#22c55e' : theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{sendWhatsapp && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'white' }}></div>}</div>
                        </div>
                        <div style={{ fontSize: '11px', color: theme.subText, lineHeight: '1.6', backgroundColor: theme.isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.04)', padding: '8px 10px', borderRadius: '8px', fontStyle: 'italic' }}>
                          "Ola {selectedPaciente?.nome?.split(' ')[0]}, a sua receita medica foi emitida hoje. Por favor cumpra a medicacao conforme indicado. Com os melhores cumprimentos, Equipa {(() => { try { return JSON.parse(localStorage.getItem('meclinic_settings') || '{}').nome || 'MeClinic'; } catch { return 'MeClinic'; } })()}"
                        </div>
                      </div>
                    )}
                    {selectedPaciente?.email && (
                      <div onClick={() => setSendEmail(!sendEmail)} style={{ flex: 1, padding: '14px 16px', borderRadius: '14px', border: `2px solid ${sendEmail ? '#2563eb' : theme.border}`, backgroundColor: sendEmail ? (theme.isDark ? 'rgba(37,99,235,0.07)' : '#eff6ff') : (theme.isDark ? '#1e293b' : '#f8fafc'), cursor: 'pointer', transition: 'all 0.2s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: sendEmail ? '#2563eb' : (theme.isDark ? '#334155' : '#e2e8f0'), display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 }}><Mail size={16} color="white" /></div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '700', fontSize: '13px', color: sendEmail ? '#2563eb' : theme.text }}>Email</div>
                            <div style={{ fontSize: '11px', color: theme.subText }}>{selectedPaciente.email}</div>
                          </div>
                          <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: sendEmail ? '#2563eb' : 'transparent', border: `2px solid ${sendEmail ? '#2563eb' : theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{sendEmail && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'white' }}></div>}</div>
                        </div>
                        <div style={{ fontSize: '11px', color: theme.subText, lineHeight: '1.6', backgroundColor: theme.isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.04)', padding: '8px 10px', borderRadius: '8px', fontStyle: 'italic' }}>
                          "Caro(a) {selectedPaciente?.nome?.split(' ')[0]}, em anexo encontra a sua receita medica. Em caso de duvida, entre em contacto connosco de imediato."
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div style={{ display: 'flex', gap: '10px', padding: '18px 28px', borderTop: `1px solid ${theme.border}`, backgroundColor: theme.isDark ? '#0a1628' : '#f8fafc' }}>
              <button onClick={() => { setShowRxModal(false); setRxMeds([{ nome: '', posologia: '' }]); setAssinaturaMedica(null); }} style={{ flex: 1, padding: '13px', borderRadius: '10px', border: `1px solid ${theme.border}`, backgroundColor: 'transparent', color: theme.text, fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>Cancelar</button>
              <button onClick={gerarReceitaPDF} style={{ flex: 2, padding: '13px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #059669, #10b981)', color: 'white', fontWeight: '700', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', boxShadow: '0 4px 14px rgba(16,185,129,0.4)', fontSize: '14px' }}>
                <FileText size={18} /> Gerar & Guardar Receita
              </button>
            </div>
          </div>
        </div>
      )}

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
            <p style={{ color: theme.subText, marginBottom: '25px', fontSize: '14px' }}>Tem a certeza que deseja eliminar o(a) paciente <strong style={{color: theme.text}}>{pacienteToDelete.nome}</strong>? Esta ação apagará todo o histórico.</p>
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
              <h2 style={{ margin: 0, color: theme.isDark ? '#ffffff' : theme.text, fontSize: '22px', display: 'flex', alignItems: 'center', gap: '10px' }}><Activity size={26} color="#2563eb" /> Ficha do Paciente</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <button onClick={() => setShowRxModal(true)} style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', backgroundColor: '#10b981', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform='scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}><Pill size={18} /> Passar Receita</button>
                <button onClick={() => setSelectedPaciente(null)} style={{ background: 'none', border: 'none', color: theme.subText, cursor: 'pointer', transition: 'color 0.2s' }}><X size={28} /></button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '0', flex: 1, overflow: 'hidden' }}>
              <div style={{ padding: '30px', borderRight: `1px solid ${theme.border}`, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
                  <div style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#2563eb', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '28px', fontWeight: 'bold' }}>{selectedPaciente.nome.charAt(0).toUpperCase()}</div>
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
                    <div style={{ fontSize: '11px', color: theme.subText, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>Consultas</div>
                    <div style={{ fontSize: '22px', fontWeight: '900', color: '#8b5cf6' }}>{selectedPaciente.total_consultas}</div>
                  </div>
                  <div style={{ backgroundColor: theme.pageBg, padding: '15px', borderRadius: '12px', border: `1px solid ${theme.border}` }}>
                    <div style={{ fontSize: '11px', color: theme.subText, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>Faturado</div>
                    <div style={{ fontSize: '22px', fontWeight: '900', color: '#10b981' }}>{selectedPaciente.total_faturado} €</div>
                  </div>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: theme.subText, marginBottom: '10px', textTransform: 'uppercase' }}><FileText size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }}/> Notas Clínicas</label>
                  <textarea value={notasClinicas} onChange={(e) => setNotasClinicas(e.target.value)} placeholder="Alergias, histórico..." style={{ flex: 1, minHeight: '150px', width: '100%', padding: '15px', borderRadius: '12px', border: `1px solid ${theme.border}`, background: theme.isDark ? '#0f172a' : '#f8fafc', color: theme.text, outline: 'none', resize: 'none', boxSizing: 'border-box', fontSize: '14px', lineHeight: '1.5' }} />
                  <button onClick={guardarNotas} style={{ width: '100%', padding: '14px', marginTop: '15px', borderRadius: '10px', border: 'none', backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)' }}><Save size={18} /> Guardar Notas</button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: theme.isDark ? '#1e293b' : '#f1f5f9', overflow: 'hidden', minHeight: 0 }}>
                <div style={{ display: 'flex', borderBottom: `1px solid ${theme.border}`, backgroundColor: theme.cardBg }}>
                  <button onClick={() => setActiveTab('historico')} style={{ flex: 1, padding: '20px', background: 'none', border: 'none', borderBottom: activeTab === 'historico' ? '3px solid #2563eb' : '3px solid transparent', color: activeTab === 'historico' ? '#2563eb' : theme.subText, fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}><Calendar size={18} /> Histórico</button>
                  <button onClick={() => setActiveTab('exames')} style={{ flex: 1, padding: '20px', background: 'none', border: 'none', borderBottom: activeTab === 'exames' ? '3px solid #2563eb' : '3px solid transparent', color: activeTab === 'exames' ? '#2563eb' : theme.subText, fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}><FileIcon size={18} /> Exames & Ficheiros</button>
                  <button onClick={() => setActiveTab('odontograma')} style={{ flex: 1, padding: '20px', background: 'none', border: 'none', borderBottom: activeTab === 'odontograma' ? '3px solid #2563eb' : '3px solid transparent', color: activeTab === 'odontograma' ? '#2563eb' : theme.subText, fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}><Smile size={18} /> Odontograma</button>
                </div>

                {activeTab === 'historico' && (
                  <div className="custom-scrollbar" style={{ padding: '30px', overflowY: 'auto', flex: 1 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      {historico.length > 0 ? historico.map(c => {
                        const isFinalizada = c.status === 'FINALIZADA';
                        return (
                          <div key={c.id} style={{ backgroundColor: theme.cardBg, padding: '15px 18px', borderRadius: '12px', border: `1px solid ${theme.border}`, borderLeft: `4px solid ${isFinalizada ? '#10b981' : '#3b82f6'}`, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <span style={{ fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={13} color={isFinalizada ? '#10b981' : '#3b82f6'}/> {new Date(c.data_consulta).toLocaleDateString(activeLocale)}</span>
                              <span style={{ fontSize: '12px', color: isFinalizada ? '#10b981' : '#3b82f6', fontWeight: 'bold', backgroundColor: isFinalizada ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)', padding: '3px 10px', borderRadius: '20px' }}>{c.status ? c.status.charAt(0).toUpperCase() + c.status.slice(1).toLowerCase() : ''}</span>
                            </div>
                            <div style={{ fontWeight: '600', fontSize: '14px', color: theme.text, marginBottom: '4px' }}>{c.procedimento_nome || 'Consulta Geral'}</div>
                            <div style={{ color: theme.subText, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12}/> {c.hora_consulta ? c.hora_consulta.substring(0,5) : '—'}</span>
                            </div>
                            {c.diagnostico && <div style={{ marginTop: '8px', fontSize: '12px', color: theme.subText, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', padding: '6px 10px', borderRadius: '8px' }}><span style={{ fontWeight: '600', color: theme.text }}>Diagnóstico: </span>{c.diagnostico}</div>}
                          </div>
                        )
                      }) : (<div style={{ textAlign: 'center', padding: '40px', color: theme.subText, border: `1px dashed ${theme.border}`, borderRadius: '12px', backgroundColor: theme.cardBg }}><Calendar size={40} style={{ opacity: 0.3, marginBottom: '15px' }} /><br/>Sem histórico.</div>)}
                    </div>
                  </div>
                )}

                {activeTab === 'exames' && (
                  <div className="custom-scrollbar" style={{ padding: '30px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="application/pdf,image/png" onChange={handleFileUpload} />
                    <button onClick={() => fileInputRef.current.click()} style={{ width: '100%', padding: '20px', borderRadius: '12px', border: `2px dashed #2563eb`, backgroundColor: 'rgba(37,99,235,0.05)', color: '#2563eb', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '25px', transition: 'all 0.2s' }}><UploadCloud size={24} /> Fazer Upload de Exame/Documento</button>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {exames.length > 0 ? exames.map(exame => (
                        <div key={exame.id} style={{ backgroundColor: theme.cardBg, padding: '15px', borderRadius: '12px', border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', overflow: 'hidden' }}>
                            <div style={{ padding: '10px', backgroundColor: theme.pageBg, borderRadius: '10px', color: '#64748b' }}><FileIcon size={20} /></div>
                            <div style={{ overflow: 'hidden' }}>
                              <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{exame.nome_exame}</h4>
                              <span style={{ fontSize: '11px', color: theme.subText }}>{new Date(exame.data_exame).toLocaleDateString(activeLocale)}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <a href={exame.arquivo_base64} download={exame.nome_exame} style={{ padding: '8px 12px', backgroundColor: '#dbeafe', color: '#2563eb', borderRadius: '8px', textDecoration: 'none', display: 'flex', alignItems: 'center', fontWeight: 'bold', fontSize: '12px' }}><Download size={16} /></a>
                            {isAdmin && (<button onClick={() => apagarExame(exame.id)} style={{ padding: '8px', backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer' }}><Trash2 size={16} /></button>)}
                          </div>
                        </div>
                      )) : (<div style={{ textAlign: 'center', padding: '40px', color: theme.subText, border: `1px dashed ${theme.border}`, borderRadius: '12px', backgroundColor: theme.cardBg }}><FileIcon size={40} style={{ opacity: 0.3, marginBottom: '15px' }} /><br/>Sem exames.</div>)}
                    </div>
                  </div>
                )}

                {activeTab === 'odontograma' && (
                  <div className="custom-scrollbar" style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
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
          <h1 style={{ fontSize: '30px', fontWeight: '800', margin: 0, color: theme.isDark ? '#ffffff' : theme.text, display: 'flex', alignItems: 'center', gap: '12px' }}><Users size={32} color="#2563eb" /> Meus Pacientes</h1>
        </div>
        <div style={{ position: 'relative', width: '100%', maxWidth: '350px' }}>
          <Search size={20} color={theme.subText} style={{ position: 'absolute', left: '15px', top: '14px' }} />
          <input type="text" placeholder="Procurar paciente..." style={{ width: '100%', padding: '14px 15px 14px 45px', borderRadius: '10px', border: `1px solid ${theme.border}`, background: theme.cardBg, color: theme.text, outline: 'none', fontSize: '15px', boxSizing: 'border-box' }} value={pesquisa} onChange={(e) => setPesquisa(e.target.value)} />
        </div>
      </div>

      <div style={{ backgroundColor: theme.cardBg, borderRadius: '16px', border: `1px solid ${theme.border}`, overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: theme.pageBg, color: theme.subText, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <th style={{ padding: '15px 20px', borderBottom: `1px solid ${theme.border}` }}>Nome do Paciente</th>
                <th style={{ padding: '15px 20px', borderBottom: `1px solid ${theme.border}` }}>Contacto</th>
                <th style={{ padding: '15px 20px', borderBottom: `1px solid ${theme.border}`, textAlign: 'center' }}>Consultas</th>
                <th style={{ padding: '15px 20px', borderBottom: `1px solid ${theme.border}`, textAlign: 'right' }}>Faturado</th>
                <th style={{ padding: '15px 20px', borderBottom: `1px solid ${theme.border}`, textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {pacientesFiltrados.map(p => (
                <tr key={p.id} style={{ borderBottom: `1px solid ${theme.border}`, transition: 'background-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = theme.isDark ? '#1e293b' : '#f8fafc'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ padding: '15px 20px', fontWeight: 'bold', color: theme.text, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' }}>{p.nome.charAt(0).toUpperCase()}</div>
                    {p.nome}
                  </td>
                  <td style={{ padding: '15px 20px', color: theme.subText, fontSize: '14px' }}>{p.telefone || '-'}</td>
                  <td style={{ padding: '15px 20px', textAlign: 'center' }}><span style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', padding: '4px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '13px' }}>{p.total_consultas}</span></td>
                  <td style={{ padding: '15px 20px', textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>{p.total_faturado} €</td>
                  <td style={{ padding: '15px 20px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                      <button onClick={() => abrirFichaPaciente(p)} title="Ver Ficha" style={{ backgroundColor: '#dbeafe', color: '#2563eb', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Eye size={18} /></button>
                      {isAdmin && <button onClick={(e) => clickApagar(e, p)} title="Eliminar" style={{ backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Trash2 size={18} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
              {pacientesFiltrados.length === 0 && (
                <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: theme.subText }}><User size={40} style={{ opacity: 0.3, marginBottom: '10px' }} /><br/>Sem resultados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {hasMore && !pesquisa && (
          <div style={{ padding: '20px', textAlign: 'center', borderTop: `1px solid ${theme.border}` }}>
            <button
              onClick={() => carregarPacientes(page + 1)}
              disabled={loadingMore}
              style={{ padding: '10px 28px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: loadingMore ? 'not-allowed' : 'pointer', fontWeight: 'bold', opacity: loadingMore ? 0.7 : 1 }}
            >
              {loadingMore ? 'A carregar...' : 'Carregar mais'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pacientes;