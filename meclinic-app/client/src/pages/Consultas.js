import React, { useState, useEffect, useContext, useRef } from 'react';
import { Calendar as CalendarIcon, User, Mail, Phone, FileText, Clock, CheckCircle, XCircle, Edit, Trash2, AlertTriangle, Globe, Grid, List as ListIcon, ChevronLeft, ChevronRight, Plus, Minus, Package, X, UploadCloud, File, Pill, MessageCircle, Smile, Save } from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';
import { LanguageContext } from '../contexts/LanguageContext'; 
import { useTimeFormat } from '../contexts/TimeFormatContext';
import jsPDF from 'jspdf';
import Odontograma from '../components/specialized/Odontograma';
import Assinatura from '../components/specialized/Assinatura';
import { getActiveLocale } from '../utils/locale';
import { flattenToWhite } from '../utils/signatureUtils';
import { PRECO_CARIE, PRECO_EXTRACAO, PRECO_ENDO, PRECO_COROA, PRECO_IMPLANTE } from '../utils/treatmentPrices';
import apiService from '../services/api';

const ALLOWED_EXAM_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif'];
const MAX_EXAM_SIZE = 10 * 1024 * 1024; // 10 MB

const Consultas = () => {
  const { theme } = useContext(ThemeContext);
  const { t, language } = useContext(LanguageContext);
  const { formatTime } = useTimeFormat();
  const currentUser = (() => { try { return JSON.parse(localStorage.getItem('meclinic_user') || '{}'); } catch { return {}; } })();

  const [consultas, setConsultas] = useState([]);
  const [modelos, setModelos] = useState([]);
  
  const [phonePrefix, setPhonePrefix] = useState('+351');
  const [formData, setFormData] = useState({ nome: '', email: '', telefone: '', data: '', hora: '', motivo: '', procedimento_id: '' });
  
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  // ESTADOS DO CHECKOUT
  const [checkoutModal, setCheckoutModal] = useState(null);
  const [isAvaliacao, setIsAvaliacao] = useState(false); 
  const [checkoutData, setCheckoutData] = useState({ metodo_pagamento: 'Multibanco' });
  const [checkoutMateriais, setCheckoutMateriais] = useState([]); 
  const [checkoutExame, setCheckoutExame] = useState(null); 
  const checkoutFileInputRef = useRef(null);
  
  // ESTADOS DE RECEITA E ASSINATURA
  const [rxMeds, setRxMeds] = useState([{ nome: '', posologia: '' }]);
  const [recommendations, setRecommendations] = useState('');
  const [assinaturaMedica, setAssinaturaMedica] = useState(null);
  const [assinaturaMedicaNome, setAssinaturaMedicaNome] = useState('');

  const [odontogramaAvaliacao, setOdontogramaAvaliacao] = useState({});
  const [orcamentoEstimado, setOrcamentoEstimado] = useState({ caries: 0, extracoes: 0, endo: 0, coroas: 0, implantes: 0, total: 0 });

  const [sendWhatsapp, setSendWhatsapp] = useState(true);
  const [sendEmail, setSendEmail] = useState(false);
  const [emailPaciente, setEmailPaciente] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [showUrgenciaModal, setShowUrgenciaModal] = useState(false);
  const [urgStep, setUrgStep] = useState(1);
  const [urgCriada, setUrgCriada] = useState(null);
  const nowDate = new Date();
  const [urgForm, setUrgForm] = useState({ nome: '', telefone: '', email: '', procedimento_id: '', data: nowDate.toLocaleDateString('sv-SE'), hora: `${String(nowDate.getHours()).padStart(2,'0')}:${String(nowDate.getMinutes()).padStart(2,'0')}`, motivo: '' });
  const [urgProcessing, setUrgProcessing] = useState(false);
  const [urgMetodoPagamento, setUrgMetodoPagamento] = useState('Multibanco');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  
  const [viewMode, setViewMode] = useState('list'); 
  const [filtro, setFiltro] = useState('dia');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const activeLocale = getActiveLocale(language);

  const fetchDados = () => {
    apiService.get('/api/consultas?limit=500')
      .then(data => setConsultas(Array.isArray(data) ? data : (data.consultas || [])));
    apiService.get('/api/modelos-procedimento')
      .then(data => setModelos(Array.isArray(data) ? data : (data.modelos || [])));
  };

  useEffect(() => { fetchDados(); }, []);

  useEffect(() => {
    if (!currentUser.id) return;
    const token = localStorage.getItem('meclinic_token');
    fetch(`/api/utilizadores/${currentUser.id}/assinatura`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(async data => {
        const raw = data.assinatura;
        if (!raw) return;
        let sig = null, nome = '';
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.signatures) && parsed.signatures.length > 0) {
            sig = parsed.signatures[0].signature;
            nome = parsed.signatures[0].nome || '';
          } else if (parsed.signature) {
            sig = parsed.signature;
            nome = parsed.nome || '';
          }
        } catch {
          if (typeof raw === 'string' && raw.startsWith('data:')) sig = raw;
        }
        if (sig) { setAssinaturaMedica(await flattenToWhite(sig)); setAssinaturaMedicaNome(nome); }
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const showNotif = (msg, type = 'success') => {
    setNotification({ show: true, message: msg, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 4000);
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const partesNome = formData.nome.trim().split(' ');
    if (partesNome.length < 2) { showNotif('Insira o Primeiro e Último nome.', 'error'); return; }
    if (!formData.telefone || formData.telefone.replace(/\s+/g, '').length < 9) { showNotif('O telemóvel é obrigatório.', 'error'); return; }
    if (!formData.data) { showNotif('Selecione uma data.', 'error'); return; }
    if (!formData.hora || formData.hora.length < 5) { showNotif('Selecione uma hora válida.', 'error'); return; }

    const url = isEditing ? `/api/consultas/${editId}` : '/api/consultas';
    const method = isEditing ? 'PUT' : 'POST';
    const telefoneCompleto = `${phonePrefix} ${formData.telefone}`;

    try {
      setIsProcessing(true);
      const payload = { ...formData, telefone: telefoneCompleto, procedimento_id: formData.procedimento_id || null };
      if (isEditing) {
        await apiService.put(url, payload);
      } else {
        await apiService.post(url, payload);
      }

      showNotif(isEditing ? t('consultations.msg.updated') : t('consultations.msg.scheduled'));
      // Auto-switch filter so the new/edited consultation is visible
      if (formData.data) {
        const hojeStr = new Date().toLocaleDateString('sv-SE');
        const diffDias = (new Date(formData.data) - new Date(hojeStr)) / (1000 * 60 * 60 * 24);
        if (formData.data === hojeStr) setFiltro('dia');
        else if (diffDias >= 0 && diffDias <= 7) setFiltro('semana');
        else setFiltro('mes');
      }
      setFormData({ nome: '', email: '', telefone: '', data: '', hora: '', motivo: '', procedimento_id: '' });
      setPhonePrefix('+351'); 
      setIsEditing(false); 
      setEditId(null); 
      fetchDados();
    } catch (err) { 
      showNotif(err.message || t('consultations.msg.save_err'), 'error'); 
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEdit = (c) => {
    setIsEditing(true); setEditId(c.id);
    let dataFormatada = ''; if (c.data_consulta) dataFormatada = String(c.data_consulta).substring(0, 10);
    let horaFormatada = ''; if (c.hora_consulta) horaFormatada = c.hora_consulta.substring(0, 5);
    let numLimpo = c.telefone || ''; let prefixo = '+351';
    if (numLimpo.includes(' ')) { const partes = numLimpo.split(' '); prefixo = partes[0]; numLimpo = partes.slice(1).join(' '); } 
    else if (numLimpo === t('consultations.list.no_phone')) { numLimpo = ''; }

    setPhonePrefix(prefixo);
    setFormData({ nome: c.paciente_nome || '', email: c.email || '', telefone: numLimpo, data: dataFormatada, hora: horaFormatada, motivo: c.motivo || '', procedimento_id: c.procedimento_id || '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clickApagar = (id) => setShowDeleteConfirm(id);
  const confirmarApagar = async () => {
    if (!showDeleteConfirm) return;
    try {
      await apiService.delete(`/api/consultas/${showDeleteConfirm}`);
      showNotif(t('consultations.msg.deleted')); fetchDados();
    } catch (err) { showNotif(t('consultations.msg.delete_err'), 'error'); } finally { setShowDeleteConfirm(null); }
  };

  // --- MAGIA DO COPYWRITING: LEMBRETE DE CONSULTA ---
  const enviarLembreteWhatsapp = (c, e) => {
    e.stopPropagation(); 
    if (!c.telefone || c.telefone === t('consultations.list.no_phone')) { showNotif('Sem número válido.', 'error'); return; }
    const numWhatsApp = c.telefone.replace(/\D/g, '');
    const primeiroNome = c.paciente_nome.split(' ')[0];
    const dataC = new Date(c.data_consulta).toLocaleDateString(activeLocale, { day: '2-digit', month: '2-digit', year: 'numeric' });
    const horaC = formatTime(c.hora_consulta);
    
    const procedimento = c.procedimento_nome || 'Avaliação Geral';

    const msg = `Ola ${primeiroNome},\n\nLembramos que tem uma consulta de ${procedimento} marcada para o dia ${dataC} as ${horaC}.\n\nPara confirmar a sua presenca, responda com SIM. Para reagendar, contacte-nos.\n\nMeClinic`;
    
    window.open(`https://wa.me/${numWhatsApp}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const abrirCheckout = async (c) => {
    setCheckoutModal(c);
    
    const nomeProc = (c.procedimento_nome || '').toLowerCase();
    const eAvaliacao = nomeProc.includes('avalia');
    setIsAvaliacao(eAvaliacao);

    setCheckoutData({ metodo_pagamento: 'Multibanco' });
    setCheckoutMateriais([]); 
    setCheckoutExame(null); 
    setRxMeds([{ nome: '', posologia: '' }]);
    setRecommendations('');
    setOdontogramaAvaliacao({});
    setOrcamentoEstimado({ caries: 0, extracoes: 0, endo: 0, coroas: 0, implantes: 0, total: 0 });

    setSendWhatsapp(true);
    if (c.email) { setSendEmail(true); setEmailPaciente(c.email); } else { setSendEmail(false); setEmailPaciente(''); }

    if (!eAvaliacao && c.procedimento_id) {
      try {
        const materiais = await apiService.get(`/api/modelos-procedimento/${c.procedimento_id}/itens`);
        setCheckoutMateriais(Array.isArray(materiais) ? materiais : []);
      } catch (err) {
        showNotif('Erro ao carregar materiais do procedimento.', 'error');
      }
    }
  };

  const handleMudancaOdontograma = (novosDadosDentes) => {
    setOdontogramaAvaliacao(novosDadosDentes);
    let caries = 0, extracoes = 0, endo = 0, coroas = 0, implantes = 0;
    Object.values(novosDadosDentes).forEach(dente => {
      if (dente.EXTRACTED) {
        extracoes++;
      } else {
        let hasEndo = false, hasCoroa = false, hasImplante = false;
        ['T', 'R', 'B', 'L', 'C'].forEach(f => {
          if (dente[f] === 'CARIE') caries++;
          if (dente[f] === 'ENDO') hasEndo = true;
          if (dente[f] === 'COROA') hasCoroa = true;
          if (dente[f] === 'IMPLANTE') hasImplante = true;
        });
        if (hasEndo) endo++;
        if (hasCoroa) coroas++;
        if (hasImplante) implantes++;
      }
    });

    const valorTotal = (caries * PRECO_CARIE) + (extracoes * PRECO_EXTRACAO) + (endo * PRECO_ENDO) + (coroas * PRECO_COROA) + (implantes * PRECO_IMPLANTE);
    setOrcamentoEstimado({ caries, extracoes, endo, coroas, implantes, total: valorTotal });
  };

  const handleCheckoutFileUpload = (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (!ALLOWED_EXAM_TYPES.includes(file.type)) {
      showNotif('Tipo de ficheiro não permitido. Use PDF, JPG, PNG ou GIF.', 'error');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_EXAM_SIZE) {
      showNotif('Ficheiro demasiado grande. Tamanho máximo: 10 MB.', 'error');
      e.target.value = '';
      return;
    }
    const reader = new FileReader(); reader.onloadend = () => { setCheckoutExame({ name: file.name, base64: reader.result }); };
    reader.readAsDataURL(file);
  };

  const alterarQuantidadeMaterial = (index, delta) => {
    const novos = [...checkoutMateriais];
    const novaQtd = parseFloat(novos[index].quantidade) + delta;
    if (novaQtd >= 0) { novos[index].quantidade = novaQtd; setCheckoutMateriais(novos); }
  };

  const preencherRapidoMed = (nome, posologia) => {
    const vazios = rxMeds.filter(m => m.nome === '');
    if (vazios.length > 0) {
      const novos = [...rxMeds]; novos[rxMeds.length - 1] = { nome, posologia }; setRxMeds(novos);
    } else { setRxMeds([...rxMeds, { nome, posologia }]); }
  };

  const finalizarCheckout = async () => {
    if (!checkoutModal) return;
    if (sendEmail && !emailPaciente) { showNotif('Insira o email para onde enviar os documentos.', 'error'); return; }
    
    setIsProcessing(true);
    
    const hasMeds = rxMeds.some(m => m.nome.trim() !== '');
    const hasRecs = recommendations.trim() !== '';
    const hasReceita = hasMeds || hasRecs;

    let pdfFaturaBase64 = null;
    let pdfReceitaBase64 = null;
    let nomeReceita = null;

    try {
      const doc = new jsPDF({ format: [148, 210] }); 
      
      doc.setFillColor(37, 99, 235); 
      doc.rect(0, 0, 148, 25, 'F'); 
      doc.setTextColor(255, 255, 255); 
      doc.setFontSize(18); doc.setFont(undefined, 'bold'); 
      doc.text("MECLINIC", 74, 16, { align: 'center' });
      
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(14); doc.setFont(undefined, 'bold'); 
      doc.text(isAvaliacao ? "PLANO DE TRATAMENTO E ORÇAMENTO" : t('consultations.pdf.title'), 74, 40, { align: 'center' });
      
      doc.setFontSize(10); doc.setFont(undefined, 'normal'); doc.setTextColor(100, 116, 139);
      doc.text(`Data de Emissão: ${new Date().toLocaleString(activeLocale)}`, 15, 55);
      doc.text(`Paciente: ${checkoutModal.paciente_nome}`, 15, 62);
      doc.text(`Procedimento: ${checkoutModal.procedimento_nome || t('consultations.general')}`, 15, 69);
      
      doc.setDrawColor(226, 232, 240); doc.line(15, 76, 133, 76); 

      doc.setTextColor(15, 23, 42);
      let curY = 88;
      
      if (isAvaliacao) {
        doc.setFont(undefined, 'bold'); doc.text(`Análise Clínica & Tratamentos Propostos:`, 15, curY); curY+=8;
        doc.setFont(undefined, 'normal');
        if (orcamentoEstimado.caries > 0) { doc.text(`• Restaurações: ${orcamentoEstimado.caries} dente(s)`, 20, curY); doc.text(`${(orcamentoEstimado.caries*50).toFixed(2)} €`, 133, curY, {align: 'right'}); curY+=7; }
        if (orcamentoEstimado.endo > 0) { doc.text(`• Endodontias: ${orcamentoEstimado.endo} dente(s)`, 20, curY); doc.text(`${(orcamentoEstimado.endo*150).toFixed(2)} €`, 133, curY, {align: 'right'}); curY+=7; }
        if (orcamentoEstimado.coroas > 0) { doc.text(`• Coroas/Próteses: ${orcamentoEstimado.coroas} dente(s)`, 20, curY); doc.text(`${(orcamentoEstimado.coroas*400).toFixed(2)} €`, 133, curY, {align: 'right'}); curY+=7; }
        if (orcamentoEstimado.implantes > 0) { doc.text(`• Implantes: ${orcamentoEstimado.implantes} dente(s)`, 20, curY); doc.text(`${(orcamentoEstimado.implantes*600).toFixed(2)} €`, 133, curY, {align: 'right'}); curY+=7; }
        if (orcamentoEstimado.extracoes > 0) { doc.text(`• Extrações: ${orcamentoEstimado.extracoes} dente(s)`, 20, curY); doc.text(`${(orcamentoEstimado.extracoes*40).toFixed(2)} €`, 133, curY, {align: 'right'}); curY+=7; }
      } else {
        doc.setFont(undefined, 'bold'); doc.text(`Detalhes da Faturação:`, 15, curY); curY+=8;
        doc.setFont(undefined, 'normal');
        doc.text(`Serviço Clínico Efetuado`, 20, curY); doc.text(`${parseFloat(checkoutModal.preco_servico || 0).toFixed(2)} €`, 133, curY, {align: 'right'}); curY+=7;
        doc.text(`Método de Pagamento:`, 20, curY); doc.text(`${checkoutData.metodo_pagamento}`, 133, curY, {align: 'right'}); curY+=7;
      }
      
      curY += 5;
      doc.setFillColor(241, 245, 249); doc.rect(15, curY, 118, 15, 'F'); 
      doc.setFontSize(14); doc.setFont(undefined, 'bold'); doc.setTextColor(37, 99, 235);
      doc.text(`TOTAL:`, 20, curY + 10);
      doc.text(`${(isAvaliacao ? orcamentoEstimado.total : parseFloat(checkoutModal.preco_servico || 0)).toFixed(2)} €`, 133, curY + 10, { align: 'right' });

      if (assinaturaMedica) {
        const sigY = curY + 23;
        doc.addImage(assinaturaMedica, 44, sigY, 60, 15);
        const lineY = sigY + 12;
        doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.3); doc.line(44, lineY, 104, lineY);
        if (assinaturaMedicaNome) {
          doc.setFontSize(9); doc.setFont(undefined, 'bold'); doc.setTextColor(15, 23, 42);
          doc.text(assinaturaMedicaNome, 74, lineY + 5, { align: 'center' });
          doc.setFontSize(7); doc.setFont(undefined, 'normal'); doc.setTextColor(148, 163, 184);
          doc.text('Assinatura do Responsável', 74, lineY + 10, { align: 'center' });
        } else {
          doc.setFontSize(7); doc.setFont(undefined, 'normal'); doc.setTextColor(148, 163, 184);
          doc.text('Assinatura do Responsável', 74, lineY + 5, { align: 'center' });
        }
      }

      doc.setFontSize(8); doc.setFont(undefined, 'normal'); doc.setTextColor(148, 163, 184);
      doc.text("MeClinic - Medicina Dentária Avançada | NIF: 500 123 456", 74, 195, { align: 'center' });
      doc.text("Avenida da Liberdade, 123, Lisboa | +351 912 345 678 | www.meclinic.pt", 74, 200, { align: 'center' });
      doc.text("Processado por programa certificado.", 74, 205, { align: 'center' });
      
      pdfFaturaBase64 = doc.output('datauristring');
      const nomeDoc = isAvaliacao ? `Orcamento_${checkoutModal.paciente_nome.replace(/\s+/g, '_')}.pdf` : `Fatura_${checkoutModal.paciente_nome.replace(/\s+/g, '_')}.pdf`;
      if (sendWhatsapp) doc.save(nomeDoc);
    } catch (e) { console.error("Erro PDF Fatura/Orcamento:", e); }

    if (hasReceita) {
      try {
        const docRx = new jsPDF({ format: [148, 210] });
        
        docRx.setFillColor(37, 99, 235);
        docRx.rect(0, 0, 148, 25, 'F'); 
        docRx.setTextColor(255, 255, 255); 
        docRx.setFontSize(18); docRx.setFont(undefined, 'bold'); 
        docRx.text("MECLINIC", 74, 16, { align: 'center' });

        docRx.setTextColor(15, 23, 42);
        docRx.setFontSize(14); docRx.setFont(undefined, 'bold'); 
        docRx.text("RECEITA / RELATÓRIO MÉDICO", 74, 40, { align: 'center' });

        docRx.setFontSize(10); docRx.setFont(undefined, 'normal'); docRx.setTextColor(100, 116, 139);
        docRx.text(`Data: ${new Date().toLocaleDateString(activeLocale)}`, 15, 55);
        docRx.text(`Paciente: ${checkoutModal.paciente_nome}`, 15, 62);
        docRx.text(`Médico: ${assinaturaMedicaNome || currentUser.nome || 'Corpo Clínico'}`, 15, 69);
        
        docRx.setDrawColor(226, 232, 240); docRx.line(15, 76, 133, 76);

        let y = 88;
        if (hasMeds) {
          docRx.setFontSize(14); docRx.setFont(undefined, 'bold'); docRx.setTextColor(37, 99, 235); docRx.text("Rx (Prescrição Médica)", 15, y); y += 8;
          docRx.setTextColor(15, 23, 42);
          rxMeds.forEach((med, index) => {
            if (med.nome) {
              if(y > 180) { docRx.addPage(); y = 20; }
              docRx.setFontSize(11); docRx.setFont(undefined, 'bold'); docRx.text(`• ${med.nome}`, 20, y); y += 6;
              docRx.setFontSize(9); docRx.setFont(undefined, 'normal'); docRx.setTextColor(100, 116, 139); docRx.text(med.posologia || 'Tomar conforme indicação médica.', 25, y); y += 8;
              docRx.setTextColor(15, 23, 42);
            }
          });
          y += 5;
        }

        if (hasRecs) {
          if(y > 170) { docRx.addPage(); y = 20; }
          docRx.setFontSize(14); docRx.setFont(undefined, 'bold'); docRx.setTextColor(37, 99, 235); docRx.text("Recomendações Clínicas:", 15, y); y += 8;
          docRx.setTextColor(15, 23, 42); docRx.setFontSize(9); docRx.setFont(undefined, 'normal');
          const splitRecs = docRx.splitTextToSize(recommendations, 115);
          docRx.text(splitRecs, 20, y);
          y += (splitRecs.length * 5) + 15;
        }

        if(y > 170) { docRx.addPage(); y = 30; }
        if (assinaturaMedica) { docRx.addImage(assinaturaMedica, 44, y, 60, 15); }

        y += 12;
        docRx.setDrawColor(200, 200, 200); docRx.line(44, y, 104, y);
        if (assinaturaMedicaNome) {
          docRx.setFontSize(9); docRx.setFont(undefined, 'bold'); docRx.setTextColor(15, 23, 42);
          docRx.text(assinaturaMedicaNome, 74, y + 5, { align: 'center' });
          docRx.setFontSize(7); docRx.setFont(undefined, 'normal'); docRx.setTextColor(148, 163, 184);
          docRx.text('Assinatura do Médico', 74, y + 10, { align: 'center' });
        } else {
          docRx.setFontSize(8); docRx.setFont(undefined, 'normal'); docRx.setTextColor(148, 163, 184);
          docRx.text('Assinatura do Médico', 74, y + 5, { align: 'center' });
        }
        
        pdfReceitaBase64 = docRx.output('datauristring');
        nomeReceita = `Relatorio_${checkoutModal.paciente_nome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        
        if (sendWhatsapp) docRx.save(nomeReceita); 
      } catch (e) { console.error("Erro PDF Receita:", e); }
    }

    try {
      if (isAvaliacao && Object.keys(odontogramaAvaliacao).length > 0) {
        const todosPacientes = await apiService.get(`/api/pacientes`);
        const pacienteExato = (Array.isArray(todosPacientes) ? todosPacientes : (todosPacientes.pacientes || [])).find(p => p.nome === checkoutModal.paciente_nome);
        if(pacienteExato) {
          await apiService.put(`/api/pacientes/${pacienteExato.id}/odontograma`, { dados: odontogramaAvaliacao });
        }
      }

      const payload = {
        consulta_id: checkoutModal.id, paciente_nome: checkoutModal.paciente_nome, procedimento_nome: checkoutModal.procedimento_nome || t('consultations.general'), 
        valor_total: isAvaliacao ? orcamentoEstimado.total : (checkoutModal.preco_servico || 0), 
        metodo_pagamento: isAvaliacao ? 'Orçamento a Aprovar' : checkoutData.metodo_pagamento, 
        email_destino: sendEmail && emailPaciente ? emailPaciente : null, enviar_receita_email: sendEmail, 
        pdfBase64: pdfFaturaBase64, materiais_gastos: isAvaliacao ? [] : checkoutMateriais,
        exame_nome: checkoutExame ? checkoutExame.name : null, exame_base64: checkoutExame ? checkoutExame.base64 : null,
        receita_nome: nomeReceita, receita_base64: pdfReceitaBase64
      };

      const data = await apiService.post('/api/faturacao/checkout', payload);
      if (data) {
        showNotif(isAvaliacao ? 'Avaliação Guardada e Orçamento Gerado!' : (sendWhatsapp || sendEmail) ? 'Consulta Finalizada e Documentos Enviados!' : 'Consulta Finalizada!');
        if (sendWhatsapp && checkoutModal.telefone) {
          const numWhatsApp = checkoutModal.telefone.replace(/\D/g, '');
          if (numWhatsApp) {
            const primeiroNome = checkoutModal.paciente_nome.split(' ')[0];
            let msgTexto = "";
            if (isAvaliacao) {
               if (sendEmail && emailPaciente) {
                 msgTexto = `Olá ${primeiroNome}! ✨\n\nMuito obrigado por nos ter confiado o seu sorriso na avaliação de hoje.\n\nO seu *Plano de Tratamento e Orçamento* detalhado já foi emitido. 📄 Acabámos de o enviar para o seu email (${emailPaciente}).\n\nEstamos prontos para iniciar esta jornada consigo. Quando desejar agendar a próxima sessão, basta responder a esta mensagem!\n\nUm excelente dia! 🦷💙`;
               } else {
                 msgTexto = `Olá ${primeiroNome}! ✨\n\nMuito obrigado por nos ter confiado o seu sorriso na avaliação de hoje.\n\nConforme conversámos, partilhamos em anexo o seu *Plano de Tratamento e Orçamento* detalhado. 📄\n\nEstamos prontos para iniciar esta jornada consigo. Quando desejar agendar a próxima sessão, basta responder a esta mensagem!\n\nUm excelente dia! 🦷💙`;
               }
            } else {
               if (sendEmail && emailPaciente) {
                 msgTexto = `Olá ${primeiroNome}! 🌟\n\nOs documentos solicitados após a sua visita à Meclinic (Fatura/Relatório) já foram emitidos. 📄\n\nAcabámos de os enviar para o seu email (${emailPaciente}). Se precisar de mais alguma coisa, estamos à disposição!\n\nAté à próxima! 💙`;
               } else {
                 msgTexto = `Olá ${primeiroNome}! 🌟\n\nOs documentos solicitados após a sua visita à Meclinic (Fatura/Relatório) já foram emitidos. 📄\n\nEnviamos os mesmos em anexo a esta mensagem. Se precisar de mais alguma coisa, estamos à disposição!\n\nAté à próxima! 💙`;
               }
            }
            window.open(`https://wa.me/${numWhatsApp}?text=${encodeURIComponent(msgTexto)}`, '_blank');
          }
        }
        setCheckoutModal(null); fetchDados();
      }
    } catch (err) { showNotif(err.message || 'Erro de comunicação', 'error'); } finally { setIsProcessing(false); }
  };

  const getProcedimentoColor = (nome) => {
    if (!nome) return { bg: theme.isDark ? 'rgba(100, 116, 139, 0.2)' : 'rgba(100, 116, 139, 0.1)', text: '#64748b', border: 'rgba(100, 116, 139, 0.3)' }; 
    const n = nome.toLowerCase();
    if (n.includes('cirurgia') || n.includes('implante')) return { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' }; 
    if (n.includes('ortodontia') || n.includes('aparelho')) return { bg: 'rgba(168, 85, 247, 0.15)', text: '#a855f7', border: 'rgba(168, 85, 247, 0.3)' }; 
    if (n.includes('endo') || n.includes('desvitalização')) return { bg: 'rgba(249, 115, 22, 0.15)', text: '#f97316', border: 'rgba(249, 115, 22, 0.3)' }; 
    if (n.includes('restauração') || n.includes('cárie')) return { bg: 'rgba(14, 165, 233, 0.15)', text: '#0ea5e9', border: 'rgba(14, 165, 233, 0.3)' }; 
    if (n.includes('higiene') || n.includes('limpeza')) return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' }; 
    if (n.includes('consulta') || n.includes('avaliação')) return { bg: 'rgba(37, 99, 235, 0.15)', text: '#2563eb', border: 'rgba(37, 99, 235, 0.3)' }; 
    return { bg: 'rgba(99, 102, 241, 0.15)', text: '#6366f1', border: 'rgba(99, 102, 241, 0.3)' };
  };

  const diasDaSemana = { 'pt': ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'], 'en': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], 'es': ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] };
  const weekDaysLabel = diasDaSemana[language] || diasDaSemana['pt'];
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

  const getCalendarDays = () => {
    const year = currentMonth.getFullYear(); const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let firstDayIndex = new Date(year, month, 1).getDay();
    const emptySlots = firstDayIndex === 0 ? 6 : firstDayIndex - 1; 
    const blanks = Array.from({ length: emptySlots }).map((_, i) => (<div key={`blank-${i}`} style={{ backgroundColor: theme.pageBg, opacity: 0.5, minHeight: '120px' }}></div>));
    const today = new Date();
    const days = Array.from({ length: daysInMonth }).map((_, i) => {
      const day = i + 1; const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const consultasDoDia = consultas.filter(c => c.data_consulta && c.data_consulta.startsWith(dateStr));
      const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
      return (
        <div key={day} style={{ backgroundColor: theme.cardBg, minHeight: '120px', padding: '10px', borderTop: `1px solid ${theme.border}`, borderLeft: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column' }}>
          <div style={{ alignSelf: 'flex-end', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', backgroundColor: isToday ? '#2563eb' : 'transparent', color: isToday ? 'white' : theme.text, fontWeight: 'bold', fontSize: '13px', marginBottom: '10px' }}>{day}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1, overflowY: 'auto' }}>
            {consultasDoDia.map(c => {
              const isFinished = c.status === 'realizada'; const pColor = getProcedimentoColor(c.procedimento_nome); 
              return (
                <div key={c.id} onClick={() => handleEdit(c)} title={`Editar`} style={{ fontSize: '11px', padding: '6px', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 'bold', transition: 'all 0.2s', backgroundColor: pColor.bg, color: pColor.text, border: `1px solid ${pColor.border}`, textDecoration: isFinished ? 'line-through' : 'none', opacity: isFinished ? 0.6 : 1 }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                  {formatTime(c.hora_consulta)} - {c.paciente_nome.split(' ')[0]}
                </div>
              );
            })}
          </div>
        </div>
      );
    });
    return [...blanks, ...days];
  };

  const dataAtual = new Date(); const hojeStr = dataAtual.getFullYear() + '-' + String(dataAtual.getMonth() + 1).padStart(2, '0') + '-' + String(dataAtual.getDate()).padStart(2, '0');
  const consultasFiltradas = consultas.filter(c => {
    if (!c.data_consulta) return false;
    const cDateStr = String(c.data_consulta).substring(0, 10);
    if (filtro === 'dia') return cDateStr === hojeStr;
    const diffDias = Math.round((new Date(cDateStr + 'T00:00:00') - new Date(hojeStr + 'T00:00:00')) / 86400000);
    if (filtro === 'semana') return diffDias >= -7 && diffDias <= 7;
    if (filtro === 'mes') return cDateStr.substring(0, 7) === hojeStr.substring(0, 7);
    return true;
  });

  const inputStyle = { width: '100%', padding: '14px 14px 14px 45px', borderRadius: '10px', border: `1px solid ${theme.border}`, backgroundColor: theme.isDark ? '#0f172a' : '#f8fafc', color: theme.text, outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box', marginBottom: '15px' };
  const iconStyle = { position: 'absolute', left: '15px', top: '14px', color: '#64748b' };
  const quickBtnStyle = { padding: '5px 12px', borderRadius: '20px', border: `1px solid ${theme.border}`, background: theme.pageBg, color: theme.text, fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' };

  return (
    <>
    <div style={{ padding: '20px', color: theme.text, maxWidth: '1400px', margin: '0 auto' }}>
      
      <style>{` .custom-scrollbar::-webkit-scrollbar { width: 8px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background-color: ${theme.border}; border-radius: 10px; } .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #2563eb; } `}</style>

      {notification.show && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', backgroundColor: notification.type === 'success' ? '#10b981' : '#ef4444', color: 'white', padding: '15px 25px', borderRadius: '10px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '10px', animation: 'fadeIn 0.3s' }}>
          {notification.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
          <span style={{ fontWeight: 'bold' }}>{notification.message}</span>
        </div>
      )}

      {checkoutModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9990, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
          <div style={{ backgroundColor: theme.cardBg, padding: '0', borderRadius: '20px', width: isAvaliacao ? '1050px' : '850px', border: `1px solid ${theme.border}`, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', maxHeight: '95vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            
            <div style={{ padding: '20px 30px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isAvaliacao ? '#3b82f6' : (theme.isDark ? '#0f172a' : '#f8fafc') }}>
              <h2 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: isAvaliacao ? 'white' : theme.text }}>
                {isAvaliacao ? <><Smile color="white" /> Avaliação & Orçamento</> : <><CheckCircle color="#10b981" /> {sendWhatsapp || sendEmail ? 'Finalizar Consulta e Faturar' : 'Finalizar Consulta'}</>}
              </h2>
              <button onClick={() => setCheckoutModal(null)} style={{ background: 'none', border: 'none', color: isAvaliacao ? 'white' : theme.subText, cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: isAvaliacao ? '1fr 380px' : '1fr 1fr', flex: 1, overflow: 'hidden' }}>
              
              <div className="custom-scrollbar" style={{ padding: '25px', overflowY: 'auto', borderRight: `1px solid ${theme.border}` }}>
                
                <div style={{ backgroundColor: theme.pageBg, padding: '20px', borderRadius: '10px', marginBottom: '20px', borderLeft: `4px solid ${isAvaliacao ? '#3b82f6' : '#10b981'}` }}>
                  <p style={{ margin: '0 0 10px 0', color: theme.subText }}>Paciente: <strong style={{ color: theme.text }}>{checkoutModal.paciente_nome}</strong></p>
                  <p style={{ margin: '0 0 0 0', color: theme.subText }}>Procedimento: <strong style={{ color: theme.text }}>{checkoutModal.procedimento_nome || t('consultations.list.no_procedure')}</strong></p>
                </div>

                {isAvaliacao ? (
                  <div>
                     <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#2563eb', textTransform: 'uppercase' }}>Análise Clínica na Cadeira</label>
                     <p style={{ fontSize: '12px', color: theme.subText, marginBottom: '15px', marginTop: 0 }}>Pinte os dentes que precisam de intervenção para calcular o orçamento abaixo.</p>
                     
                     <Odontograma initialData={odontogramaAvaliacao} onChange={handleMudancaOdontograma} />
                     
                     <div style={{ marginTop: '25px', backgroundColor: theme.isDark ? '#1e293b' : '#f1f5f9', padding: '20px', borderRadius: '12px', border: `1px dashed #3b82f6` }}>
                       <h4 style={{ margin: '0 0 15px 0', color: '#3b82f6', fontSize: '15px' }}>Pré-visualização do Orçamento</h4>
                       
                       {orcamentoEstimado.caries > 0 && (<div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}><span>{orcamentoEstimado.caries}x Restaurações (Cáries)</span><span style={{ fontWeight: 'bold' }}>{(orcamentoEstimado.caries * 50).toFixed(2)} €</span></div>)}
                       {orcamentoEstimado.endo > 0 && (<div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px', color: '#f97316' }}><span>{orcamentoEstimado.endo}x Endodontias</span><span style={{ fontWeight: 'bold' }}>{(orcamentoEstimado.endo * 150).toFixed(2)} €</span></div>)}
                       {orcamentoEstimado.coroas > 0 && (<div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px', color: '#a855f7' }}><span>{orcamentoEstimado.coroas}x Coroas/Próteses</span><span style={{ fontWeight: 'bold' }}>{(orcamentoEstimado.coroas * 400).toFixed(2)} €</span></div>)}
                       {orcamentoEstimado.implantes > 0 && (<div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px', color: '#10b981' }}><span>{orcamentoEstimado.implantes}x Implantes</span><span style={{ fontWeight: 'bold' }}>{(orcamentoEstimado.implantes * 600).toFixed(2)} €</span></div>)}
                       {orcamentoEstimado.extracoes > 0 && (<div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '15px' }}><span>{orcamentoEstimado.extracoes}x Extrações</span><span style={{ fontWeight: 'bold' }}>{(orcamentoEstimado.extracoes * 40).toFixed(2)} €</span></div>)}
                       {orcamentoEstimado.total === 0 && <div style={{fontSize:'13px', color: theme.subText, marginBottom:'10px'}}>Nenhum tratamento selecionado.</div>}

                       <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', paddingTop: '10px', borderTop: `1px solid ${theme.border}`, color: theme.text }}><strong>TOTAL ESTIMADO:</strong><strong style={{ color: '#10b981' }}>{orcamentoEstimado.total.toFixed(2)} €</strong></div>
                     </div>
                  </div>
                ) : (
                  <>
                    <h3 style={{ margin: '0 0 20px 0', color: '#10b981', fontSize: '28px' }}>{parseFloat(checkoutModal.preco_servico || 0).toFixed(2)} €</h3>
                    <label style={{ display: 'block', marginBottom: '10px', fontSize: '13px', fontWeight: 'bold', color: '#2563eb', textTransform: 'uppercase' }}>{t('consultations.checkout.materials')}</label>
                    {checkoutMateriais.length > 0 ? (
                      <div style={{ border: `1px solid ${theme.border}`, borderRadius: '10px', overflow: 'hidden', marginBottom: '20px' }}>
                        {checkoutMateriais.map((mat, index) => (
                          <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px', borderBottom: index < checkoutMateriais.length - 1 ? `1px solid ${theme.border}` : 'none', backgroundColor: theme.isDark ? '#0f172a' : '#f8fafc' }}>
                            <span style={{ fontSize: '13px', fontWeight: 'bold', color: theme.text, flex: 1 }}>{mat.nome_item}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: theme.cardBg, padding: '4px', borderRadius: '8px', border: `1px solid ${theme.border}` }}>
                              <button onClick={() => alterarQuantidadeMaterial(index, -1)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Minus size={16} /></button>
                              <span style={{ fontSize: '14px', fontWeight: '900', width: '25px', textAlign: 'center' }}>{mat.quantidade}</span>
                              <button onClick={() => alterarQuantidadeMaterial(index, 1)} style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Plus size={16} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (<div style={{ padding: '15px', marginBottom: '20px', backgroundColor: theme.isDark ? '#0f172a' : '#f8fafc', borderRadius: '10px', color: theme.subText, fontSize: '13px', textAlign: 'center', border: `1px dashed ${theme.border}` }}>Nenhum material previsto.</div>)}
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>{t('consultations.checkout.payment_method')}</label>
                    <select value={checkoutData.metodo_pagamento} onChange={(e) => setCheckoutData({...checkoutData, metodo_pagamento: e.target.value})} style={{ ...inputStyle, paddingLeft: '12px' }}>
                      <option value={t('consultations.checkout.multibanco')}>{t('consultations.checkout.multibanco')}</option>
                      <option value={t('consultations.checkout.mbway')}>{t('consultations.checkout.mbway')}</option>
                      <option value={t('consultations.checkout.cash')}>{t('consultations.checkout.cash')}</option>
                      <option value={t('consultations.checkout.transfer')}>{t('consultations.checkout.transfer')}</option>
                    </select>
                  </>
                )}

              </div>

              <div className="custom-scrollbar" style={{ padding: '25px', overflowY: 'auto', backgroundColor: theme.isDark ? '#1e293b' : '#f1f5f9' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontSize: '13px', fontWeight: 'bold', color: theme.text, textTransform: 'uppercase' }}><UploadCloud size={16} style={{verticalAlign:'middle', marginRight: '5px'}}/> 1. Anexar Exame (Opcional)</label>
                <input type="file" ref={checkoutFileInputRef} style={{ display: 'none' }} onChange={handleCheckoutFileUpload} />
                <button onClick={() => checkoutFileInputRef.current.click()} style={{ width: '100%', padding: '14px', borderRadius: '10px', border: checkoutExame ? '1px solid #10b981' : `2px dashed ${theme.border}`, backgroundColor: checkoutExame ? 'rgba(16, 185, 129, 0.1)' : theme.cardBg, color: checkoutExame ? '#10b981' : theme.subText, fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: 'all 0.2s', marginBottom: '25px' }}>
                  {checkoutExame ? <><File size={18} /> {checkoutExame.name}</> : 'Procurar ficheiro no PC...'}
                </button>

                <label style={{ display: 'block', marginBottom: '10px', fontSize: '13px', fontWeight: 'bold', color: theme.text, textTransform: 'uppercase' }}><Pill size={16} style={{verticalAlign:'middle', marginRight: '5px'}}/> 2. Receita Médica (Opcional)</label>
                
                <div style={{ marginBottom: '20px', backgroundColor: theme.cardBg, padding: '15px', borderRadius: '12px', border: `1px solid ${theme.border}` }}>
                  <span style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: theme.subText, marginBottom: '10px', textTransform: 'uppercase' }}>Farmácia Rápida:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: 'bold', width: '80px' }}>DOR / INFL.</span>
                      <button onClick={() => preencherRapidoMed('Ibuprofeno 600mg', '1 comp. de 8/8h, após refeições, SOS.')} style={quickBtnStyle}>+ Ibuprofeno</button>
                      <button onClick={() => preencherRapidoMed('Paracetamol 1000mg', '1 comp. de 8/8h, SOS dor ou febre.')} style={quickBtnStyle}>+ Paracetamol</button>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', color: '#3b82f6', fontWeight: 'bold', width: '80px' }}>ANTIBIÓTICO</span>
                      <button onClick={() => preencherRapidoMed('Amoxicilina + Ác. Clavulânico 875/125mg', '1 comp. de 12/12h, durante 8 dias.')} style={quickBtnStyle}>+ Amox/Clav</button>
                      <button onClick={() => preencherRapidoMed('Azitromicina 500mg', '1 comp. por dia, durante 3 dias.')} style={quickBtnStyle}>+ Azitromicina</button>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 'bold', width: '80px' }}>TÓPICOS</span>
                      <button onClick={() => preencherRapidoMed('Clorohexidina 0.12% (Colutório)', 'Bochechar 15ml, 2x/dia após escovagem.')} style={quickBtnStyle}>+ Colutório</button>
                      <button onClick={() => preencherRapidoMed('Ácido Hialurónico (Gel Oral)', 'Aplicar na lesão 3x/dia, não enxaguar.')} style={quickBtnStyle}>+ Ác. Hialurónico</button>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '10px' }}>
                  {rxMeds.map((med, index) => (
                    <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <input type="text" value={med.nome} onChange={e => { const n = [...rxMeds]; n[index].nome = e.target.value; setRxMeds(n); }} placeholder="Medicamento" style={{ ...inputStyle, marginBottom: 0, padding: '10px', fontSize: '12px' }} />
                      <input type="text" value={med.posologia} onChange={e => { const n = [...rxMeds]; n[index].posologia = e.target.value; setRxMeds(n); }} placeholder="Posologia" style={{ ...inputStyle, marginBottom: 0, padding: '10px', fontSize: '12px' }} />
                    </div>
                  ))}
                </div>
                <button onClick={() => setRxMeds([...rxMeds, {nome:'', posologia:''}])} style={{ fontSize: '12px', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '5px' }}><Plus size={14}/> Linha Extra</button>

                <textarea 
                  value={recommendations} onChange={(e) => setRecommendations(e.target.value)}
                  placeholder="Recomendações Pós-Consulta..." className="custom-scrollbar"
                  style={{ ...inputStyle, height: '60px', resize: 'none', marginBottom: '20px', padding: '12px', fontSize: '12px', backgroundColor: theme.cardBg }}
                />

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: theme.text, marginBottom: '10px', textTransform: 'uppercase' }}>Assinatura Médica</label>
                  <Assinatura onSaveSignature={setAssinaturaMedica} onNotification={showNotif} />
                </div>
              </div>
            </div>

            <div style={{ padding: '15px 30px', borderTop: `1px solid ${theme.border}`, backgroundColor: theme.isDark ? '#0f172a' : '#f8fafc' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', color: theme.subText, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Opções de Envio ao Paciente ({isAvaliacao ? 'Orçamento' : 'Fatura'})</h4>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#16a34a' }}>
                  <input type="checkbox" checked={sendWhatsapp} onChange={(e) => setSendWhatsapp(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#16a34a' }}/>
                  <MessageCircle size={18} /> WhatsApp
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#2563eb' }}>
                  <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#2563eb' }}/>
                  <Mail size={18} /> E-mail
                </label>
                {sendEmail && (
                  <input type="email" value={emailPaciente} onChange={(e) => setEmailPaciente(e.target.value)} placeholder="Email do Paciente" style={{ padding: '8px 15px', borderRadius: '8px', border: `1px solid #2563eb`, outline: 'none', flex: 1, backgroundColor: theme.cardBg, color: theme.text, fontSize: '12px' }} />
                )}
              </div>
            </div>

            <div style={{ padding: '20px 30px', borderTop: `1px solid ${theme.border}`, display: 'flex', gap: '15px', backgroundColor: theme.cardBg }}>
              <button onClick={() => setCheckoutModal(null)} disabled={isProcessing} style={{ flex: 1, padding: '16px', borderRadius: '10px', border: 'none', backgroundColor: theme.pageBg, color: theme.text, cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', opacity: isProcessing ? 0.5 : 1 }}>Cancelar</button>
              <button onClick={finalizarCheckout} disabled={isProcessing || (sendEmail && !emailPaciente)} style={{ flex: 2, padding: '16px', borderRadius: '10px', border: 'none', backgroundColor: isAvaliacao ? '#3b82f6' : '#10b981', color: 'white', cursor: (isProcessing || (sendEmail && !emailPaciente)) ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', boxShadow: isAvaliacao ? '0 4px 15px rgba(59, 130, 246, 0.3)' : '0 4px 15px rgba(16, 185, 129, 0.3)', opacity: (isProcessing || (sendEmail && !emailPaciente)) ? 0.6 : 1 }}>
                {isProcessing ? 'A Processar...' : (isAvaliacao ? <><Save size={20} /> Guardar Mapa & Gerar Orçamento (PDF)</> : <><CheckCircle size={20} /> {sendWhatsapp || sendEmail ? 'Finalizar Consulta & Faturar' : 'Finalizar Consulta'}</>)}
              </button>
            </div>

          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: theme.isDark ? '#ffffff' : theme.text }}>{t('consultations.title')}</h1>
          <p style={{ color: theme.subText, margin: '5px 0 0 0' }}>{t('consultations.subtitle')}</p>
        </div>

        <div style={{ display: 'flex', backgroundColor: theme.cardBg, padding: '5px', borderRadius: '12px', border: `1px solid ${theme.border}` }}>
          <button onClick={() => setViewMode('list')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: viewMode === 'list' ? '#2563eb' : 'transparent', color: viewMode === 'list' ? 'white' : theme.subText }}><ListIcon size={18} /> {t('consultations.view.list') || 'Lista'}</button>
          <button onClick={() => setViewMode('calendar')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: viewMode === 'calendar' ? '#2563eb' : 'transparent', color: viewMode === 'calendar' ? 'white' : theme.subText }}><Grid size={18} /> {t('consultations.view.calendar') || 'Calendário'}</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '30px', alignItems: 'start' }}>
        <div style={{ backgroundColor: theme.cardBg, borderRadius: '20px', border: `1px solid ${theme.border}`, overflow: 'hidden', boxShadow: theme.isDark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.08)' }}>
          {/* Form header */}
          <div style={{ background: isEditing ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', padding: '22px 28px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={20} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '17px', fontWeight: '700', color: 'white', letterSpacing: '-0.3px' }}>{isEditing ? t('consultations.form.edit') : t('consultations.form.new')}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', marginTop: '2px' }}>Campos com * são obrigatórios</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
            {/* Nome */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px', fontSize: '11px', fontWeight: '700', color: theme.subText, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                <User size={12} /> Nome Completo <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input type="text" name="nome" value={formData.nome} onChange={handleChange} placeholder="Primeiro e Último Nome"
                style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: `1.5px solid ${theme.border}`, backgroundColor: theme.isDark ? '#0f172a' : '#f8fafc', color: theme.text, fontSize: '14px', fontFamily: 'Inter, system-ui, sans-serif', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = theme.border} required />
            </div>

            {/* Email */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px', fontSize: '11px', fontWeight: '700', color: theme.subText, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                <Mail size={12} /> Email
              </label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="email@exemplo.com"
                style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: `1.5px solid ${theme.border}`, backgroundColor: theme.isDark ? '#0f172a' : '#f8fafc', color: theme.text, fontSize: '14px', fontFamily: 'Inter, system-ui, sans-serif', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = theme.border} />
            </div>

            {/* Telefone */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px', fontSize: '11px', fontWeight: '700', color: theme.subText, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                <Phone size={12} /> Telemóvel <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '8px' }}>
                <select value={phonePrefix} onChange={(e) => setPhonePrefix(e.target.value)}
                  style={{ width: '100%', padding: '11px 8px', borderRadius: '10px', border: `1.5px solid ${theme.border}`, backgroundColor: theme.isDark ? '#0f172a' : '#f8fafc', color: theme.text, fontSize: '13px', fontWeight: '600', fontFamily: 'Inter, system-ui, sans-serif', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}>
                  <option value="+351">🇵🇹 +351</option><option value="+34">🇪🇸 +34</option><option value="+33">🇫🇷 +33</option><option value="+44">🇬🇧 +44</option><option value="+49">🇩🇪 +49</option><option value="+41">🇨🇭 +41</option><option value="+1">🇺🇸 +1</option><option value="+55">🇧🇷 +55</option>
                </select>
                <input type="text" name="telefone" value={formData.telefone} onChange={handleChange} placeholder="9XX XXX XXX"
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: `1.5px solid ${theme.border}`, backgroundColor: theme.isDark ? '#0f172a' : '#f8fafc', color: theme.text, fontSize: '14px', fontFamily: 'Inter, system-ui, sans-serif', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                  onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = theme.border} required />
              </div>
            </div>

            {/* Procedimento */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px', fontSize: '11px', fontWeight: '700', color: theme.subText, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                <FileText size={12} /> Procedimento Clínico <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select name="procedimento_id" value={formData.procedimento_id} onChange={handleChange} required
                style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: `1.5px solid ${theme.border}`, backgroundColor: theme.isDark ? '#0f172a' : '#f8fafc', color: formData.procedimento_id ? theme.text : '#94a3b8', fontSize: '14px', fontFamily: 'Inter, system-ui, sans-serif', outline: 'none', boxSizing: 'border-box', cursor: 'pointer', transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = theme.border}>
                <option value="">{t('consultations.form.procedure_ph')}</option>
                {modelos.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </select>
            </div>

            {/* Data e Hora */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px', fontSize: '11px', fontWeight: '700', color: theme.subText, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  <CalendarIcon size={12} /> Data <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input type="date" name="data" value={formData.data} onChange={handleChange} required
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: `1.5px solid ${theme.border}`, backgroundColor: theme.isDark ? '#0f172a' : '#f8fafc', color: theme.text, fontSize: '13px', fontFamily: 'Inter, system-ui, sans-serif', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                  onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = theme.border} />
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px', fontSize: '11px', fontWeight: '700', color: theme.subText, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  <Clock size={12} /> Hora <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <select name="hora_hh" value={formData.hora.split(':')[0] || '09'}
                    onChange={(e) => { const hh = e.target.value; const mm = formData.hora.split(':')[1] || '00'; setFormData({ ...formData, hora: `${hh}:${mm}` }); }}
                    style={{ padding: '11px 8px', borderRadius: '10px', border: `1.5px solid ${theme.border}`, backgroundColor: theme.isDark ? '#0f172a' : '#f8fafc', color: theme.text, fontSize: '13px', fontFamily: 'Inter, system-ui, sans-serif', outline: 'none', cursor: 'pointer', textAlign: 'center' }}>
                    {Array.from({ length: 10 }, (_, i) => String(i + 9).padStart(2, '0')).map(h => <option key={h} value={h}>{h}h</option>)}
                  </select>
                  <select name="hora_mm" value={formData.hora.split(':')[1] || '00'}
                    onChange={(e) => { const hh = formData.hora.split(':')[0] || '09'; const mm = e.target.value; setFormData({ ...formData, hora: `${hh}:${mm}` }); }}
                    style={{ padding: '11px 8px', borderRadius: '10px', border: `1.5px solid ${theme.border}`, backgroundColor: theme.isDark ? '#0f172a' : '#f8fafc', color: theme.text, fontSize: '13px', fontFamily: 'Inter, system-ui, sans-serif', outline: 'none', cursor: 'pointer', textAlign: 'center' }}>
                    {[0, 15, 30, 45].map(m => { const mm = String(m).padStart(2, '0'); return <option key={mm} value={mm}>{mm}m</option>; })}
                  </select>
                </div>
              </div>
            </div>

            {/* Notas */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px', fontSize: '11px', fontWeight: '700', color: theme.subText, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                <FileText size={12} /> Notas Adicionais
              </label>
              <textarea name="motivo" value={formData.motivo} onChange={handleChange} placeholder={t('consultations.form.notes_ph')} className="custom-scrollbar"
                style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: `1.5px solid ${theme.border}`, backgroundColor: theme.isDark ? '#0f172a' : '#f8fafc', color: theme.text, fontSize: '14px', fontFamily: 'Inter, system-ui, sans-serif', outline: 'none', boxSizing: 'border-box', height: '80px', resize: 'none', transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = theme.border} />
            </div>

            {/* Submit */}
            <button type="submit" disabled={isProcessing}
              style={{ width: '100%', padding: '14px', background: isProcessing ? '#9ca3af' : (isEditing ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #2563eb, #1d4ed8)'), color: 'white', borderRadius: '12px', border: 'none', fontWeight: '700', fontSize: '15px', fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.2px', cursor: isProcessing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: isProcessing ? 'none' : '0 4px 15px rgba(37,99,235,0.35)', transition: 'all 0.2s', opacity: isProcessing ? 0.7 : 1 }}>
              <FileText size={18} /> {isProcessing ? 'A guardar...' : (isEditing ? t('consultations.form.btn_save') : t('consultations.form.btn_confirm'))}
            </button>
            {isEditing && (
              <button type="button" onClick={() => { setIsEditing(false); setFormData({ nome: '', email: '', telefone: '', data: '', hora: '', motivo: '', procedimento_id: '' }); setPhonePrefix('+351'); }}
                style={{ width: '100%', padding: '11px', backgroundColor: 'transparent', color: theme.subText, border: `1.5px solid ${theme.border}`, borderRadius: '12px', cursor: 'pointer', marginTop: '10px', fontWeight: '600', fontSize: '14px', fontFamily: 'Inter, system-ui, sans-serif', transition: 'all 0.2s' }}>
                {t('consultations.form.btn_cancel')}
              </button>
            )}
          </form>
        </div>

        <div className="custom-scrollbar" style={{ backgroundColor: theme.cardBg, padding: '30px', borderRadius: '16px', border: `1px solid ${theme.border}`, height: '100%', overflowY: 'auto' }}>
          {viewMode === 'list' ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <h3 style={{ margin: '0', fontSize: '18px' }}>{t('consultations.list.title')}</h3>
                <div style={{ display: 'flex', gap: '5px', backgroundColor: theme.pageBg, padding: '5px', borderRadius: '10px' }}>
                  <button onClick={() => setFiltro('dia')} style={{ padding: '8px 15px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', backgroundColor: filtro === 'dia' ? '#2563eb' : 'transparent', color: filtro === 'dia' ? 'white' : theme.subText, transition: 'all 0.2s' }}>Hoje</button>
                  <button onClick={() => setFiltro('semana')} style={{ padding: '8px 15px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', backgroundColor: filtro === 'semana' ? '#2563eb' : 'transparent', color: filtro === 'semana' ? 'white' : theme.subText, transition: 'all 0.2s' }}>Semana</button>
                  <button onClick={() => setFiltro('mes')} style={{ padding: '8px 15px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', backgroundColor: filtro === 'mes' ? '#2563eb' : 'transparent', color: filtro === 'mes' ? 'white' : theme.subText, transition: 'all 0.2s' }}>Mês</button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {consultasFiltradas.length > 0 ? consultasFiltradas.map(c => {
                  const isFinalizada = c.status === 'realizada';
                  const isUrgente = c.motivo && c.motivo.startsWith('[URGÊNCIA]');
                  const cardBackground = isFinalizada ? (theme.isDark ? '#0f172a' : '#f1f5f9') : (theme.isDark ? '#1e293b' : '#ffffff');
                  const opacityLevel = isFinalizada ? 0.6 : 1;
                  const mesCurto = new Date(c.data_consulta).toLocaleDateString(activeLocale, { month: 'short' }).toUpperCase();
                  const dia = new Date(c.data_consulta).getDate();
                  const pColor = getProcedimentoColor(c.procedimento_nome);

                  return (
                    <div key={c.id} style={{ backgroundColor: cardBackground, border: `1px solid ${isUrgente && !isFinalizada ? '#ef4444' : theme.border}`, borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: opacityLevel, transition: 'all 0.3s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ backgroundColor: isFinalizada ? theme.border : theme.pageBg, padding: '10px 14px', borderRadius: '10px', textAlign: 'center', minWidth: '64px' }}>
                          <div style={{ fontSize: '11px', fontWeight: 'bold', color: isFinalizada ? theme.subText : '#2563eb' }}>{mesCurto}</div>
                          <div style={{ fontSize: '22px', fontWeight: '900', color: isFinalizada ? theme.subText : '#2563eb', lineHeight: 1 }}>{dia}</div>
                          <div style={{ fontSize: '11px', fontWeight: '700', color: isFinalizada ? theme.subText : '#2563eb', marginTop: '4px', fontVariantNumeric: 'tabular-nums', borderTop: `1px solid ${isFinalizada ? theme.subText : 'rgba(37,99,235,0.3)'}`, paddingTop: '4px' }}>{formatTime(c.hora_consulta)}</div>
                        </div>
                        <div>
                          <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', color: theme.text, textDecoration: isFinalizada ? 'line-through' : 'none' }}>{c.paciente_nome}</h4>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', marginBottom: '4px' }}>
                            {isUrgente && !isFinalizada && <span style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '2px 7px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px' }}>🚨 Urgência</span>}
                            <span style={{ backgroundColor: pColor.bg, color: pColor.text, padding: '2px 8px', borderRadius: '6px', fontWeight: 'bold', textDecoration: isFinalizada ? 'line-through' : 'none' }}>{c.procedimento_nome || t('consultations.list.no_procedure')}</span>
                          </div>
                          {c.email && <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: theme.subText, fontSize: '12px', marginTop: '2px' }}><Mail size={13} /> {c.email}</div>}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: theme.subText, fontSize: '13px', marginTop: '4px' }}>
                            <Phone size={14} /> {c.telefone || t('consultations.list.no_phone')}
                            {!isFinalizada && c.telefone && c.telefone !== t('consultations.list.no_phone') && (
                              <button onClick={(e) => enviarLembreteWhatsapp(c, e)} title="Enviar Lembrete" style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', padding: '2px', marginLeft: '5px', display: 'flex', alignItems: 'center', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}><MessageCircle size={16} /></button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        {isFinalizada ? (
                          <span style={{ backgroundColor: theme.pageBg, color: theme.subText, padding: '8px 15px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}><CheckCircle size={16} /> {t('consultations.list.finished')}</span>
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
                }) : (<div style={{ textAlign: 'center', padding: '40px', color: theme.subText, border: `1px dashed ${theme.border}`, borderRadius: '12px' }}>Vazio</div>)}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: '0', fontSize: '18px', color: theme.text, textTransform: 'capitalize' }}>{currentMonth.toLocaleDateString(activeLocale, { month: 'long', year: 'numeric' })}</h3>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button onClick={prevMonth} style={{ padding: '8px', borderRadius: '8px', border: `1px solid ${theme.border}`, background: theme.pageBg, color: theme.text, cursor: 'pointer' }}><ChevronLeft size={18} /></button>
                  <button onClick={nextMonth} style={{ padding: '8px', borderRadius: '8px', border: `1px solid ${theme.border}`, background: theme.pageBg, color: theme.text, cursor: 'pointer' }}><ChevronRight size={18} /></button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', marginBottom: '10px' }}>
                {weekDaysLabel.map(day => <div key={day} style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '12px', color: theme.subText, padding: '5px 0' }}>{day}</div>)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', backgroundColor: theme.border, border: `1px solid ${theme.border}`, borderRadius: '12px', overflow: 'hidden' }}>
                {getCalendarDays()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

      {false && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9990, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
          <div style={{ backgroundColor: theme.cardBg, padding: '0', borderRadius: '20px', width: isAvaliacao ? '1050px' : '850px', border: `1px solid ${theme.border}`, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', maxHeight: '95vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            
            <div style={{ padding: '20px 30px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isAvaliacao ? '#3b82f6' : (theme.isDark ? '#0f172a' : '#f8fafc') }}>
              <h2 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: isAvaliacao ? 'white' : theme.text }}>
                {isAvaliacao ? <><Smile color="white" /> Avaliação & Orçamento</> : <><CheckCircle color="#10b981" /> Finalizar Consulta e Faturar</>}
              </h2>
              <button onClick={() => setCheckoutModal(null)} style={{ background: 'none', border: 'none', color: isAvaliacao ? 'white' : theme.subText, cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: isAvaliacao ? '1fr 380px' : '1fr 1fr', flex: 1, overflow: 'hidden' }}>
              
              <div className="custom-scrollbar" style={{ padding: '25px', overflowY: 'auto', borderRight: `1px solid ${theme.border}` }}>
                
                <div style={{ backgroundColor: theme.pageBg, padding: '20px', borderRadius: '10px', marginBottom: '20px', borderLeft: `4px solid ${isAvaliacao ? '#3b82f6' : '#10b981'}` }}>
                  <p style={{ margin: '0 0 10px 0', color: theme.subText }}>Paciente: <strong style={{ color: theme.text }}>{checkoutModal.paciente_nome}</strong></p>
                  <p style={{ margin: '0 0 0 0', color: theme.subText }}>Procedimento: <strong style={{ color: theme.text }}>{checkoutModal.procedimento_nome || t('consultations.list.no_procedure')}</strong></p>
                </div>

                {isAvaliacao ? (
                  <div>
                     <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#2563eb', textTransform: 'uppercase' }}>Análise Clínica na Cadeira</label>
                     <p style={{ fontSize: '12px', color: theme.subText, marginBottom: '15px', marginTop: 0 }}>Pinte os dentes que precisam de intervenção para calcular o orçamento abaixo.</p>
                     <Odontograma initialData={odontogramaAvaliacao} onChange={handleMudancaOdontograma} />
                     <div style={{ marginTop: '25px', backgroundColor: theme.isDark ? '#1e293b' : '#f1f5f9', padding: '20px', borderRadius: '12px', border: `1px dashed #3b82f6` }}>
                       <h4 style={{ margin: '0 0 15px 0', color: '#3b82f6', fontSize: '15px' }}>Pré-visualização do Orçamento</h4>
                       {orcamentoEstimado.caries > 0 && (<div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}><span>{orcamentoEstimado.caries}x Restaurações (Cáries)</span><span style={{ fontWeight: 'bold' }}>{(orcamentoEstimado.caries * 50).toFixed(2)} €</span></div>)}
                       {orcamentoEstimado.endo > 0 && (<div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px', color: '#f97316' }}><span>{orcamentoEstimado.endo}x Endodontias</span><span style={{ fontWeight: 'bold' }}>{(orcamentoEstimado.endo * 150).toFixed(2)} €</span></div>)}
                       {orcamentoEstimado.coroas > 0 && (<div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px', color: '#a855f7' }}><span>{orcamentoEstimado.coroas}x Coroas/Próteses</span><span style={{ fontWeight: 'bold' }}>{(orcamentoEstimado.coroas * 400).toFixed(2)} €</span></div>)}
                       {orcamentoEstimado.implantes > 0 && (<div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px', color: '#10b981' }}><span>{orcamentoEstimado.implantes}x Implantes</span><span style={{ fontWeight: 'bold' }}>{(orcamentoEstimado.implantes * 600).toFixed(2)} €</span></div>)}
                       {orcamentoEstimado.extracoes > 0 && (<div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '15px' }}><span>{orcamentoEstimado.extracoes}x Extrações</span><span style={{ fontWeight: 'bold' }}>{(orcamentoEstimado.extracoes * 40).toFixed(2)} €</span></div>)}
                       {orcamentoEstimado.total === 0 && <div style={{fontSize:'13px', color: theme.subText, marginBottom:'10px'}}>Nenhum tratamento selecionado.</div>}
                       <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', paddingTop: '10px', borderTop: `1px solid ${theme.border}`, color: theme.text }}><strong>TOTAL ESTIMADO:</strong><strong style={{ color: '#10b981' }}>{orcamentoEstimado.total.toFixed(2)} €</strong></div>
                     </div>
                  </div>
                ) : (
                  <>
                    <h3 style={{ margin: '0 0 20px 0', color: '#10b981', fontSize: '28px' }}>{parseFloat(checkoutModal.preco_servico || 0).toFixed(2)} €</h3>
                    <label style={{ display: 'block', marginBottom: '10px', fontSize: '13px', fontWeight: 'bold', color: '#2563eb', textTransform: 'uppercase' }}>{t('consultations.checkout.materials')}</label>
                    {checkoutMateriais.length > 0 ? (
                      <div style={{ border: `1px solid ${theme.border}`, borderRadius: '10px', overflow: 'hidden', marginBottom: '20px' }}>
                        {checkoutMateriais.map((mat, index) => (
                          <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px', borderBottom: index < checkoutMateriais.length - 1 ? `1px solid ${theme.border}` : 'none', backgroundColor: theme.isDark ? '#0f172a' : '#f8fafc' }}>
                            <span style={{ fontSize: '13px', fontWeight: 'bold', color: theme.text, flex: 1 }}>{mat.nome_item}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: theme.cardBg, padding: '4px', borderRadius: '8px', border: `1px solid ${theme.border}` }}>
                              <button onClick={() => alterarQuantidadeMaterial(index, -1)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Minus size={16} /></button>
                              <span style={{ fontSize: '14px', fontWeight: '900', width: '25px', textAlign: 'center' }}>{mat.quantidade}</span>
                              <button onClick={() => alterarQuantidadeMaterial(index, 1)} style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Plus size={16} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (<div style={{ padding: '15px', marginBottom: '20px', backgroundColor: theme.isDark ? '#0f172a' : '#f8fafc', borderRadius: '10px', color: theme.subText, fontSize: '13px', textAlign: 'center', border: `1px dashed ${theme.border}` }}>Nenhum material previsto.</div>)}
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>{t('consultations.checkout.payment_method')}</label>
                    <select value={checkoutData.metodo_pagamento} onChange={(e) => setCheckoutData({...checkoutData, metodo_pagamento: e.target.value})} style={{ ...inputStyle, paddingLeft: '12px' }}>
                      <option value={t('consultations.checkout.multibanco')}>{t('consultations.checkout.multibanco')}</option>
                      <option value={t('consultations.checkout.mbway')}>{t('consultations.checkout.mbway')}</option>
                      <option value={t('consultations.checkout.cash')}>{t('consultations.checkout.cash')}</option>
                      <option value={t('consultations.checkout.transfer')}>{t('consultations.checkout.transfer')}</option>
                    </select>
                  </>
                )}
              </div>

              <div className="custom-scrollbar" style={{ padding: '25px', overflowY: 'auto', backgroundColor: theme.isDark ? '#1e293b' : '#f1f5f9' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontSize: '13px', fontWeight: 'bold', color: theme.text, textTransform: 'uppercase' }}><UploadCloud size={16} style={{verticalAlign:'middle', marginRight: '5px'}}/> 1. Anexar Exame (Opcional)</label>
                <input type="file" ref={checkoutFileInputRef} style={{ display: 'none' }} onChange={handleCheckoutFileUpload} />
                <button onClick={() => checkoutFileInputRef.current.click()} style={{ width: '100%', padding: '14px', borderRadius: '10px', border: checkoutExame ? '1px solid #10b981' : `2px dashed ${theme.border}`, backgroundColor: checkoutExame ? 'rgba(16, 185, 129, 0.1)' : theme.cardBg, color: checkoutExame ? '#10b981' : theme.subText, fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: 'all 0.2s', marginBottom: '25px' }}>
                  {checkoutExame ? <><File size={18} /> {checkoutExame.name}</> : 'Procurar ficheiro no PC...'}
                </button>

                <label style={{ display: 'block', marginBottom: '10px', fontSize: '13px', fontWeight: 'bold', color: theme.text, textTransform: 'uppercase' }}><Pill size={16} style={{verticalAlign:'middle', marginRight: '5px'}}/> 2. Receita Médica (Opcional)</label>
                <div style={{ marginBottom: '20px', backgroundColor: theme.cardBg, padding: '15px', borderRadius: '12px', border: `1px solid ${theme.border}` }}>
                  <span style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: theme.subText, marginBottom: '10px', textTransform: 'uppercase' }}>Farmácia Rápida:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: 'bold', width: '80px' }}>DOR / INFL.</span>
                      <button onClick={() => preencherRapidoMed('Ibuprofeno 600mg', '1 comp. de 8/8h, após refeições, SOS.')} style={quickBtnStyle}>+ Ibuprofeno</button>
                      <button onClick={() => preencherRapidoMed('Paracetamol 1000mg', '1 comp. de 8/8h, SOS dor ou febre.')} style={quickBtnStyle}>+ Paracetamol</button>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', color: '#3b82f6', fontWeight: 'bold', width: '80px' }}>ANTIBIÓTICO</span>
                      <button onClick={() => preencherRapidoMed('Amoxicilina + Ác. Clavulânico 875/125mg', '1 comp. de 12/12h, durante 8 dias.')} style={quickBtnStyle}>+ Amox/Clav</button>
                      <button onClick={() => preencherRapidoMed('Azitromicina 500mg', '1 comp. por dia, durante 3 dias.')} style={quickBtnStyle}>+ Azitromicina</button>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 'bold', width: '80px' }}>TÓPICOS</span>
                      <button onClick={() => preencherRapidoMed('Clorohexidina 0.12% (Colutório)', 'Bochechar 15ml, 2x/dia após escovagem.')} style={quickBtnStyle}>+ Colutório</button>
                      <button onClick={() => preencherRapidoMed('Ácido Hialurónico (Gel Oral)', 'Aplicar na lesão 3x/dia, não enxaguar.')} style={quickBtnStyle}>+ Ác. Hialurónico</button>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '10px' }}>
                  {rxMeds.map((med, index) => (
                    <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <input type="text" value={med.nome} onChange={e => { const n = [...rxMeds]; n[index].nome = e.target.value; setRxMeds(n); }} placeholder="Medicamento" style={{ ...inputStyle, marginBottom: 0, padding: '10px', fontSize: '12px' }} />
                      <input type="text" value={med.posologia} onChange={e => { const n = [...rxMeds]; n[index].posologia = e.target.value; setRxMeds(n); }} placeholder="Posologia" style={{ ...inputStyle, marginBottom: 0, padding: '10px', fontSize: '12px' }} />
                    </div>
                  ))}
                </div>
                <button onClick={() => setRxMeds([...rxMeds, {nome:'', posologia:''}])} style={{ fontSize: '12px', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '5px' }}><Plus size={14}/> Linha Extra</button>
                <textarea 
                  value={recommendations} onChange={(e) => setRecommendations(e.target.value)}
                  placeholder="Recomendações Pós-Consulta..." className="custom-scrollbar"
                  style={{ ...inputStyle, height: '60px', resize: 'none', marginBottom: '20px', padding: '12px', fontSize: '12px', backgroundColor: theme.cardBg }}
                />
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: theme.text, marginBottom: '10px', textTransform: 'uppercase' }}>Assinatura Médica</label>
                  <Assinatura onSaveSignature={setAssinaturaMedica} onNotification={showNotif} />
                </div>
              </div>
            </div>

            <div style={{ padding: '15px 30px', borderTop: `1px solid ${theme.border}`, backgroundColor: theme.isDark ? '#0f172a' : '#f8fafc' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', color: theme.subText, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Opções de Envio ao Paciente ({isAvaliacao ? 'Orçamento' : 'Fatura'})</h4>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#16a34a' }}>
                  <input type="checkbox" checked={sendWhatsapp} onChange={(e) => setSendWhatsapp(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#16a34a' }}/>
                  <MessageCircle size={18} /> WhatsApp
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#2563eb' }}>
                  <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#2563eb' }}/>
                  <Mail size={18} /> E-mail
                </label>
                {sendEmail && (
                  <input type="email" value={emailPaciente} onChange={(e) => setEmailPaciente(e.target.value)} placeholder="Email do Paciente" style={{ padding: '8px 15px', borderRadius: '8px', border: `1px solid #2563eb`, outline: 'none', flex: 1, backgroundColor: theme.cardBg, color: theme.text, fontSize: '12px' }} />
                )}
              </div>
            </div>

            <div style={{ padding: '20px 30px', borderTop: `1px solid ${theme.border}`, display: 'flex', gap: '15px', backgroundColor: theme.cardBg }}>
              <button onClick={() => setCheckoutModal(null)} disabled={isProcessing} style={{ flex: 1, padding: '16px', borderRadius: '10px', border: 'none', backgroundColor: theme.pageBg, color: theme.text, cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', opacity: isProcessing ? 0.5 : 1 }}>Cancelar</button>
              <button onClick={finalizarCheckout} disabled={isProcessing || (sendEmail && !emailPaciente)} style={{ flex: 2, padding: '16px', borderRadius: '10px', border: 'none', backgroundColor: isAvaliacao ? '#3b82f6' : '#10b981', color: 'white', cursor: (isProcessing || (sendEmail && !emailPaciente)) ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', boxShadow: isAvaliacao ? '0 4px 15px rgba(59, 130, 246, 0.3)' : '0 4px 15px rgba(16, 185, 129, 0.3)', opacity: (isProcessing || (sendEmail && !emailPaciente)) ? 0.6 : 1 }}>
                {isProcessing ? 'A Processar...' : (isAvaliacao ? <><Save size={20} /> Guardar Mapa & Gerar Orçamento (PDF)</> : <><CheckCircle size={20} /> Finalizar Consulta & Faturar</>)}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* FAB Urgência */}
      <button
        onClick={() => {
          const n = new Date();
          setUrgForm({ nome: '', telefone: '', email: '', procedimento_id: '', data: n.toLocaleDateString('sv-SE'), hora: `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`, motivo: '' });
          setUrgStep(1);
          setUrgCriada(null);
          setUrgMetodoPagamento('Multibanco');
          setShowUrgenciaModal(true);
        }}
        title="Registar Urgência"
        style={{ position: 'fixed', bottom: '100px', right: '28px', width: '56px', height: '56px', borderRadius: '50%', background: theme.isDark ? '#450a0a' : '#fee2e2', border: `2px solid ${theme.isDark ? '#7f1d1d' : '#fca5a5'}`, color: '#ef4444', fontSize: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: theme.isDark ? '0 4px 20px rgba(127,29,29,0.5)' : '0 4px 20px rgba(239,68,68,0.25)', zIndex: 200, transition: 'transform 0.2s, box-shadow 0.2s' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = theme.isDark ? '0 6px 28px rgba(127,29,29,0.75)' : '0 6px 28px rgba(239,68,68,0.4)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = theme.isDark ? '0 4px 20px rgba(127,29,29,0.5)' : '0 4px 20px rgba(239,68,68,0.25)'; }}
      >
        🚨
      </button>

      {/* Modal Urgência */}
      {showUrgenciaModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setShowUrgenciaModal(false); }}>
          <div style={{ backgroundColor: theme.cardBg, borderRadius: '20px', width: '100%', maxWidth: '420px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', border: `1px solid ${theme.border}` }}>
            {/* Header */}
            <div style={{ backgroundColor: theme.isDark ? '#0f172a' : '#f8fafc', borderBottom: `1px solid ${theme.border}`, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: theme.text }}>Urgência Dentária</div>
                <div style={{ fontSize: '11px', color: theme.subText }}>{urgStep === 1 ? 'Registar consultas feitas por urgência' : 'Consulta registada — processar honorários'}</div>
              </div>
              <button onClick={() => setShowUrgenciaModal(false)} style={{ background: 'none', border: 'none', color: theme.subText, cursor: 'pointer', display: 'flex', alignItems: 'center' }}><X size={20} /></button>
            </div>

            {urgStep === 1 ? (
            <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: theme.subText, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>Nome do paciente *</label>
                <input value={urgForm.nome} onChange={e => setUrgForm(f => ({ ...f, nome: e.target.value }))} placeholder="Primeiro e Último Nome"
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: `1.5px solid ${theme.border}`, backgroundColor: theme.isDark ? '#0f172a' : '#f8fafc', color: theme.text, fontSize: '14px', fontFamily: 'Inter, system-ui, sans-serif', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: theme.subText, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>Telemóvel</label>
                  <input value={urgForm.telefone} onChange={e => setUrgForm(f => ({ ...f, telefone: e.target.value }))} placeholder="9XX XXX XXX"
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: `1.5px solid ${theme.border}`, backgroundColor: theme.isDark ? '#0f172a' : '#f8fafc', color: theme.text, fontSize: '14px', fontFamily: 'Inter, system-ui, sans-serif', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: theme.subText, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>Email</label>
                  <input type="email" value={urgForm.email} onChange={e => setUrgForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com"
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: `1.5px solid ${theme.border}`, backgroundColor: theme.isDark ? '#0f172a' : '#f8fafc', color: theme.text, fontSize: '14px', fontFamily: 'Inter, system-ui, sans-serif', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>

              {/* Procedimento */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: theme.subText, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>Procedimento</label>
                <select value={urgForm.procedimento_id} onChange={e => setUrgForm(f => ({ ...f, procedimento_id: e.target.value }))}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: `1.5px solid ${theme.border}`, backgroundColor: theme.isDark ? '#0f172a' : '#f8fafc', color: urgForm.procedimento_id ? theme.text : '#94a3b8', fontSize: '14px', fontFamily: 'Inter, system-ui, sans-serif', outline: 'none', boxSizing: 'border-box', cursor: 'pointer' }}>
                  <option value="">Selecione um procedimento...</option>
                  {modelos.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                </select>
              </div>

              {/* Data + Hora */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: theme.subText, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>Data *</label>
                  <input type="date" value={urgForm.data} onChange={e => setUrgForm(f => ({ ...f, data: e.target.value }))}
                    style={{ width: '100%', padding: '11px 10px', borderRadius: '10px', border: `1.5px solid ${theme.border}`, backgroundColor: theme.isDark ? '#0f172a' : '#f8fafc', color: theme.text, fontSize: '13px', fontFamily: 'Inter, system-ui, sans-serif', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: theme.subText, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>Hora *</label>
                  <input type="time" value={urgForm.hora} onChange={e => setUrgForm(f => ({ ...f, hora: e.target.value }))}
                    style={{ width: '100%', padding: '11px 10px', borderRadius: '10px', border: `1.5px solid ${theme.border}`, backgroundColor: theme.isDark ? '#0f172a' : '#f8fafc', color: theme.text, fontSize: '13px', fontFamily: 'Inter, system-ui, sans-serif', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>

              {/* Notas */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: theme.subText, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>Notas (opcional)</label>
                <textarea value={urgForm.motivo} onChange={e => setUrgForm(f => ({ ...f, motivo: e.target.value }))} placeholder="Descrição breve da urgência..."
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: `1.5px solid ${theme.border}`, backgroundColor: theme.isDark ? '#0f172a' : '#f8fafc', color: theme.text, fontSize: '14px', fontFamily: 'Inter, system-ui, sans-serif', outline: 'none', boxSizing: 'border-box', height: '70px', resize: 'none' }} />
              </div>

              {/* Botão guardar */}
              <button disabled={urgProcessing} onClick={async () => {
                  const partesNome = urgForm.nome.trim().split(' ');
                  if (partesNome.length < 2) { showNotif('Insira o Primeiro e Último nome.', 'error'); return; }
                  if (!urgForm.data || !urgForm.hora) { showNotif('Data e hora são obrigatórias.', 'error'); return; }
                  try {
                    setUrgProcessing(true);
                    const res = await apiService.post('/api/consultas', {
                      nome: urgForm.nome,
                      email: urgForm.email || null,
                      telefone: urgForm.telefone || `URG-${Date.now()}`,
                      data: urgForm.data,
                      hora: urgForm.hora,
                      motivo: `[URGÊNCIA] ${urgForm.motivo}`.trim(),
                      procedimento_id: urgForm.procedimento_id || null
                    });
                    const proc = modelos.find(m => String(m.id) === String(urgForm.procedimento_id));
                    setUrgCriada({ ...res.consulta, paciente_nome: urgForm.nome, nome: urgForm.nome, email: urgForm.email || '', telefone: urgForm.telefone || '', procedimento_nome: proc?.nome || '', preco_servico: proc?.preco_servico || 0 });
                    fetchDados();
                    setUrgStep(2);
                  } catch { showNotif('Erro ao registar urgência.', 'error'); }
                  finally { setUrgProcessing(false); }
                }}
                style={{ width: '100%', padding: '13px', background: urgProcessing ? '#9ca3af' : 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', borderRadius: '12px', border: 'none', fontWeight: '700', fontSize: '15px', fontFamily: 'Inter, system-ui, sans-serif', cursor: urgProcessing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(239,68,68,0.35)' }}>
                {urgProcessing ? 'A guardar...' : 'Registar Urgência'}
              </button>
            </div>
            ) : (
            /* ── Passo 2: Honorários ── */
            <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ backgroundColor: theme.isDark ? '#0f172a' : '#f1f5f9', borderRadius: '12px', padding: '14px 16px', border: `1px solid ${theme.border}` }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: theme.text, marginBottom: '4px' }}>{urgCriada?.nome}</div>
                {urgCriada?.procedimento_nome && <div style={{ fontSize: '12px', color: theme.subText }}>{urgCriada.procedimento_nome}</div>}
                <div style={{ fontSize: '11px', color: '#10b981', fontWeight: '600', marginTop: '6px' }}>Consulta registada com sucesso</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: theme.subText, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>Método de pagamento</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {['Multibanco', 'MBWay', 'Numerário', 'Transferência'].map(m => (
                    <button key={m} onClick={() => setUrgMetodoPagamento(m)}
                      style={{ padding: '10px', borderRadius: '10px', border: `1.5px solid ${urgMetodoPagamento === m ? '#2563eb' : theme.border}`, backgroundColor: urgMetodoPagamento === m ? (theme.isDark ? '#1e3a8a' : '#dbeafe') : (theme.isDark ? '#0f172a' : '#f8fafc'), color: urgMetodoPagamento === m ? '#2563eb' : theme.text, fontSize: '13px', fontWeight: urgMetodoPagamento === m ? '700' : '400', cursor: 'pointer', transition: 'all 0.15s' }}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => {
                  setShowUrgenciaModal(false);
                  setCheckoutData({ metodo_pagamento: urgMetodoPagamento });
                  setCheckoutMateriais([]);
                  setCheckoutExame(null);
                  if (urgForm.email) { setSendEmail(true); setEmailPaciente(urgForm.email); } else { setSendEmail(false); setEmailPaciente(''); }
                  setSendWhatsapp(!!urgForm.telefone);
                  abrirCheckout({ ...urgCriada, metodo_pagamento: urgMetodoPagamento });
                }}
                style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', borderRadius: '12px', border: 'none', fontWeight: '700', fontSize: '15px', fontFamily: 'Inter, system-ui, sans-serif', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(37,99,235,0.35)' }}>
                Processar Honorários
              </button>
              <button onClick={() => setShowUrgenciaModal(false)}
                style={{ background: 'none', border: 'none', color: theme.subText, fontSize: '13px', cursor: 'pointer', padding: '4px', textDecoration: 'underline' }}>
                Fechar sem fatura
              </button>
            </div>
            )}
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9995, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: theme.cardBg, borderRadius: '16px', padding: '30px', width: '340px', textAlign: 'center', border: `1px solid ${theme.border}`, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <div style={{ width: '56px', height: '56px', backgroundColor: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Trash2 size={24} color="#ef4444" />
            </div>
            <h3 style={{ margin: '0 0 8px 0', color: theme.text, fontSize: '18px' }}>Apagar consulta?</h3>
            <p style={{ margin: '0 0 24px 0', color: theme.subText, fontSize: '14px' }}>Esta ação não pode ser revertida.</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowDeleteConfirm(null)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: `1px solid ${theme.border}`, backgroundColor: theme.pageBg, color: theme.text, cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>Cancelar</button>
              <button onClick={confirmarApagar} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#ef4444', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>Apagar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Consultas;
