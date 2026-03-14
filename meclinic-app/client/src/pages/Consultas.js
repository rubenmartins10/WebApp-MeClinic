/* eslint-disable */
import React, { useState, useEffect, useContext, useRef } from 'react';
import { Calendar as CalendarIcon, User, Mail, Phone, FileText, Clock, CheckCircle, XCircle, Edit, Trash2, AlertTriangle, Globe, Grid, List as ListIcon, ChevronLeft, ChevronRight, Plus, Minus, Package, X, UploadCloud, File, Pill, MessageCircle, Smile, Save } from 'lucide-react';
import { ThemeContext } from '../ThemeContext';
import { LanguageContext } from '../LanguageContext'; 
import jsPDF from 'jspdf';
import Odontograma from '../components/Odontograma';
import Assinatura from '../components/Assinatura';

const Consultas = () => {
  const { theme } = useContext(ThemeContext);
  const { t, language } = useContext(LanguageContext);
  const currentUser = JSON.parse(localStorage.getItem('meclinic_user')) || {};

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

  const [odontogramaAvaliacao, setOdontogramaAvaliacao] = useState({});
  const [orcamentoEstimado, setOrcamentoEstimado] = useState({ caries: 0, extracoes: 0, endo: 0, coroas: 0, implantes: 0, total: 0 });

  const [sendWhatsapp, setSendWhatsapp] = useState(true);
  const [sendEmail, setSendEmail] = useState(false);
  const [emailPaciente, setEmailPaciente] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  
  const [viewMode, setViewMode] = useState('list'); 
  const [filtro, setFiltro] = useState('dia');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const activeLocale = language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'pt-PT';

  const fetchDados = () => {
    fetch('/api/consultas').then(res => res.json()).then(data => setConsultas(data));
    fetch('/api/modelos-procedimento').then(res => res.json()).then(data => setModelos(data));
  };

  useEffect(() => { fetchDados(); }, []);

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

    const url = isEditing ? `/api/consultas/${editId}` : '/api/consultas';
    const method = isEditing ? 'PUT' : 'POST';
    const telefoneCompleto = `${phonePrefix} ${formData.telefone}`;

    try {
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, telefone: telefoneCompleto, procedimento_id: formData.procedimento_id || null })
      });
      if (res.ok) {
        showNotif(isEditing ? t('consultations.msg.updated') : t('consultations.msg.scheduled'));
        setFormData({ nome: '', email: '', telefone: '', data: '', hora: '', motivo: '', procedimento_id: '' });
        setPhonePrefix('+351'); setIsEditing(false); setEditId(null); fetchDados();
      }
    } catch (err) { showNotif(t('consultations.msg.save_err'), 'error'); }
  };

  const handleEdit = (c) => {
    setIsEditing(true); setEditId(c.id);
    let dataFormatada = ''; if (c.data_consulta) dataFormatada = new Date(c.data_consulta).toISOString().split('T')[0];
    let horaFormatada = ''; if (c.hora_consulta) horaFormatada = c.hora_consulta.substring(0, 5);
    let numLimpo = c.paciente_telefone || ''; let prefixo = '+351';
    if (numLimpo.includes(' ')) { const partes = numLimpo.split(' '); prefixo = partes[0]; numLimpo = partes.slice(1).join(' '); } 
    else if (numLimpo === t('consultations.list.no_phone')) { numLimpo = ''; }

    setPhonePrefix(prefixo);
    setFormData({ nome: c.paciente_nome || '', email: c.paciente_email || '', telefone: numLimpo, data: dataFormatada, hora: horaFormatada, motivo: c.motivo || '', procedimento_id: c.procedimento_id || '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clickApagar = (id) => setShowDeleteConfirm(id);
  const confirmarApagar = async () => {
    if (!showDeleteConfirm) return;
    try {
      await fetch(`/api/consultas/${showDeleteConfirm}`, { method: 'DELETE' });
      showNotif(t('consultations.msg.deleted')); fetchDados();
    } catch (err) { showNotif(t('consultations.msg.delete_err'), 'error'); } finally { setShowDeleteConfirm(null); }
  };

  const enviarLembreteWhatsapp = (c, e) => {
    e.stopPropagation(); 
    if (!c.paciente_telefone || c.paciente_telefone === t('consultations.list.no_phone')) { showNotif('Sem número válido.', 'error'); return; }
    const numWhatsApp = c.paciente_telefone.replace(/\D/g, '');
    const primeiroNome = c.paciente_nome.split(' ')[0];
    const dataC = new Date(c.data_consulta).toLocaleDateString(activeLocale, { day: '2-digit', month: '2-digit', year: 'numeric' });
    const horaC = c.hora_consulta.substring(0, 5);
    
    const msg = `Olá ${primeiroNome}! ✨\n\nA sua próxima visita à *MeClinic* aproxima-se. Temos a sua consulta reservada para dia *${dataC}* às *${horaC}*.\n\nPara garantirmos que o seu consultório está preparado, consegue confirmar a sua presença respondendo a esta mensagem com um *SIM*?\n\nAté breve! 🦷💙`;
    
    window.open(`https://wa.me/${numWhatsApp}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const abrirCheckout = async (c) => {
    setCheckoutModal(c);
    
    const nomeProc = (c.procedimento_nome || '').toLowerCase();
    const eAvaliacao = nomeProc.includes('avalia') || nomeProc.includes('consulta');
    setIsAvaliacao(eAvaliacao);

    setCheckoutData({ metodo_pagamento: 'Multibanco' });
    setCheckoutMateriais([]); 
    setCheckoutExame(null); 
    setRxMeds([{ nome: '', posologia: '' }]);
    setRecommendations('');
    setOdontogramaAvaliacao({});
    setOrcamentoEstimado({ caries: 0, extracoes: 0, endo: 0, coroas: 0, implantes: 0, total: 0 });
    setAssinaturaMedica(null);
    
    setSendWhatsapp(true);
    if (c.paciente_email) { setSendEmail(true); setEmailPaciente(c.paciente_email); } else { setSendEmail(false); setEmailPaciente(''); }

    if (!eAvaliacao && c.procedimento_id) {
      try {
        const res = await fetch(`/api/modelos-procedimento/${c.procedimento_id}/itens`);
        setCheckoutMateriais(await res.json());
      } catch (err) {}
    }
  };

  const handleMudancaOdontograma = (novosDadosDentes) => {
    setOdontogramaAvaliacao(novosDadosDentes);
    let caries = 0, extracoes = 0, endo = 0, coroas = 0, implantes = 0;
    const PRECO_CARIE = 50; const PRECO_EXTRACAO = 40; const PRECO_ENDO = 150; const PRECO_COROA = 400; const PRECO_IMPLANTE = 600;

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

    // GERAR O PDF DA FATURA / ORÇAMENTO (DESIGN A5 PREMIUM)
    try {
      const doc = new jsPDF({ format: [148, 210] }); 
      
      // CABEÇALHO PREMIUM
      doc.setFillColor(37, 99, 235); 
      doc.rect(0, 0, 148, 25, 'F'); 
      doc.setTextColor(255, 255, 255); 
      doc.setFontSize(18); doc.setFont(undefined, 'bold'); 
      doc.text("MECLINIC", 74, 16, { align: 'center' });
      
      // TÍTULO DO DOCUMENTO
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(14); doc.setFont(undefined, 'bold'); 
      doc.text(isAvaliacao ? "PLANO DE TRATAMENTO E ORÇAMENTO" : t('consultations.pdf.title'), 74, 40, { align: 'center' });
      
      // DADOS DO PACIENTE
      doc.setFontSize(10); doc.setFont(undefined, 'normal'); doc.setTextColor(100, 116, 139);
      doc.text(`Data de Emissão: ${new Date().toLocaleString(activeLocale)}`, 15, 55);
      doc.text(`Paciente: ${checkoutModal.paciente_nome}`, 15, 62);
      doc.text(`Procedimento: ${checkoutModal.procedimento_nome || t('consultations.general')}`, 15, 69);
      
      doc.setDrawColor(226, 232, 240); doc.line(15, 76, 133, 76); 

      // LISTAGEM DE ITENS
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
      
      // CAIXA DO TOTAL
      curY += 5;
      doc.setFillColor(241, 245, 249); doc.rect(15, curY, 118, 15, 'F'); 
      doc.setFontSize(14); doc.setFont(undefined, 'bold'); doc.setTextColor(37, 99, 235);
      doc.text(`TOTAL:`, 20, curY + 10);
      doc.text(`${(isAvaliacao ? orcamentoEstimado.total : parseFloat(checkoutModal.preco_servico || 0)).toFixed(2)} €`, 133, curY + 10, { align: 'right' });

      // RODAPÉ PROFISSIONAL
      doc.setFontSize(8); doc.setFont(undefined, 'normal'); doc.setTextColor(148, 163, 184);
      doc.text("MeClinic - Medicina Dentária Avançada | NIF: 500 123 456", 74, 195, { align: 'center' });
      doc.text("Avenida da Liberdade, 123, Lisboa | +351 912 345 678 | www.meclinic.pt", 74, 200, { align: 'center' });
      doc.text("Processado por programa certificado.", 74, 205, { align: 'center' });
      
      pdfFaturaBase64 = doc.output('datauristring');
      const nomeDoc = isAvaliacao ? `Orcamento_${checkoutModal.paciente_nome.replace(/\s+/g, '_')}.pdf` : `Fatura_${checkoutModal.paciente_nome.replace(/\s+/g, '_')}.pdf`;
      if (sendWhatsapp) doc.save(nomeDoc);
    } catch (e) { console.error("Erro PDF Fatura/Orcamento:", e); }

    // GERAR O PDF DA RECEITA (DESIGN A5 PREMIUM)
    if (hasReceita) {
      try {
        const docRx = new jsPDF({ format: [148, 210] });
        
        docRx.setFillColor(16, 185, 129); // Verde MeClinic para receitas
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
        docRx.text(`Médico: ${currentUser.nome || 'Corpo Clínico'}`, 15, 69);
        
        docRx.setDrawColor(226, 232, 240); docRx.line(15, 76, 133, 76);

        let y = 88;
        if (hasMeds) {
          docRx.setFontSize(14); docRx.setFont(undefined, 'bold'); docRx.setTextColor(16, 185, 129); docRx.text("Rx (Prescrição Médica)", 15, y); y += 8;
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

        // CARIMBO DE ASSINATURA NA RECEITA
        if(y > 170) { docRx.addPage(); y = 30; }
        if (assinaturaMedica) { docRx.addImage(assinaturaMedica, 'PNG', 44, y, 60, 25); }
        
        y += 26;
        docRx.setDrawColor(200, 200, 200); docRx.line(44, y, 104, y); 
        docRx.setFontSize(8); docRx.setTextColor(148, 163, 184);
        docRx.text("Assinatura do Médico", 74, y + 5, { align: 'center' });
        
        pdfReceitaBase64 = docRx.output('datauristring');
        nomeReceita = `Relatorio_${checkoutModal.paciente_nome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        
        if (sendWhatsapp) docRx.save(nomeReceita); 
      } catch (e) { console.error("Erro PDF Receita:", e); }
    }

    try {
      if (isAvaliacao && Object.keys(odontogramaAvaliacao).length > 0) {
        const pIdRes = await fetch(`/api/pacientes`);
        const todosPacientes = await pIdRes.json();
        const pacienteExato = todosPacientes.find(p => p.nome === checkoutModal.paciente_nome);
        if(pacienteExato) {
          await fetch(`/api/pacientes/${pacienteExato.id}/odontograma`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dados: odontogramaAvaliacao })
          });
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

      const res = await fetch('/api/faturacao/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (res.ok) {
        showNotif(isAvaliacao ? 'Avaliação Guardada e Orçamento Gerado!' : 'Consulta Finalizada e Documentos Guardados!');
        if (sendWhatsapp && checkoutModal.paciente_telefone) {
          const numWhatsApp = checkoutModal.paciente_telefone.replace(/\D/g, ''); 
          if (numWhatsApp) {
            const primeiroNome = checkoutModal.paciente_nome.split(' ')[0];
            let msgTexto = "";
            
            // MSG PREMIUM WHATSAPP
            if (isAvaliacao) {
              msgTexto = `Olá ${primeiroNome}! ✨\n\nMuito obrigado por nos ter confiado o seu sorriso na avaliação de hoje. \n\nConforme conversámos, partilhamos em anexo o seu *Plano de Tratamento e Orçamento* detalhado.\n\nEstamos prontos para iniciar esta jornada consigo. Quando desejar agendar a próxima sessão, basta responder a esta mensagem. \n\nUm excelente dia! 🦷💙`;
            } else {
              msgTexto = `Olá ${primeiroNome}! 🌟\n\nEsperamos que se sinta muito bem após a sua visita de hoje à MeClinic. \n\nEm anexo, enviamos os documentos referentes à sua consulta (Fatura/Relatório). Qualquer dúvida, a nossa equipa clínica está à sua inteira disposição.\n\nAté à próxima! 💙`;
            }
            window.open(`https://wa.me/${numWhatsApp}?text=${encodeURIComponent(msgTexto)}`, '_blank');
          }
        }
        setCheckoutModal(null); fetchDados();
      } else { showNotif(data.error || 'Erro ao finalizar', 'error'); }
    } catch (err) { showNotif('Erro de comunicação', 'error'); } finally { setIsProcessing(false); }
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
              const isFinished = c.status === 'FINALIZADA'; const pColor = getProcedimentoColor(c.procedimento_nome); 
              return (
                <div key={c.id} onClick={() => handleEdit(c)} title={`Editar`} style={{ fontSize: '11px', padding: '6px', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 'bold', transition: 'all 0.2s', backgroundColor: pColor.bg, color: pColor.text, border: `1px solid ${pColor.border}`, textDecoration: isFinished ? 'line-through' : 'none', opacity: isFinished ? 0.6 : 1 }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                  {c.hora_consulta.substring(0, 5)} - {c.paciente_nome.split(' ')[0]}
                </div>
              );
            })}
          </div>
        </div>
      );
    });
    return [...blanks, ...days];
  };

  const dataAtual = new Date(); const hojeStr = dataAtual.getFullYear() + '-' + String(dataAtual.getMonth() + 1).padStart(2, '0') + '-' + String(dataAtual.getDate()).padStart(2, '0'); const hojeObj = new Date(hojeStr + 'T00:00:00'); 
  const consultasFiltradas = consultas.filter(c => {
    if (!c.data_consulta) return false;
    const cDateStr = c.data_consulta.split('T')[0]; 
    const dataConsultaObj = new Date(cDateStr + 'T00:00:00'); 
    const diffTime = dataConsultaObj.getTime() - hojeObj.getTime(); 
    const diffDias = Math.round(diffTime / (1000 * 3600 * 24));
    
    if (filtro === 'dia') return diffDias === 0; 
    if (filtro === 'semana') return diffDias >= 0 && diffDias <= 7; 
    if (filtro === 'mes') return dataConsultaObj.getMonth() === dataAtual.getMonth() && dataConsultaObj.getFullYear() === dataAtual.getFullYear(); 
    return true;
  });

  const inputStyle = { width: '100%', padding: '14px 14px 14px 45px', borderRadius: '10px', border: `1px solid ${theme.border}`, backgroundColor: theme.isDark ? '#0f172a' : '#f8fafc', color: theme.text, outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box', marginBottom: '15px' };
  const iconStyle = { position: 'absolute', left: '15px', top: '14px', color: '#64748b' };
  const quickBtnStyle = { padding: '5px 12px', borderRadius: '20px', border: `1px solid ${theme.border}`, background: theme.pageBg, color: theme.text, fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' };

  return (
    <div style={{ padding: '20px', color: theme.text, maxWidth: '1200px', margin: '0 auto' }}>
      
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <CalendarIcon color="#2563eb" size={32} />
          <h1 style={{ fontSize: '30px', fontWeight: '800', margin: 0, color: theme.isDark ? '#ffffff' : theme.text }}>{t('consultations.title')}</h1>
        </div>

        <div style={{ display: 'flex', backgroundColor: theme.cardBg, padding: '5px', borderRadius: '12px', border: `1px solid ${theme.border}` }}>
          <button onClick={() => setViewMode('list')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: viewMode === 'list' ? '#2563eb' : 'transparent', color: viewMode === 'list' ? 'white' : theme.subText }}><ListIcon size={18} /> {t('consultations.view.list') || 'Lista'}</button>
          <button onClick={() => setViewMode('calendar')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: viewMode === 'calendar' ? '#2563eb' : 'transparent', color: viewMode === 'calendar' ? 'white' : theme.subText }}><Grid size={18} /> {t('consultations.view.calendar') || 'Calendário'}</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '30px', alignItems: 'start' }}>
        <div style={{ backgroundColor: theme.cardBg, padding: '30px', borderRadius: '16px', border: `1px solid ${theme.border}` }}>
          <h3 style={{ margin: '0 0 25px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}><User size={20} color="#2563eb" /> {isEditing ? t('consultations.form.edit') : t('consultations.form.new')}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ position: 'relative' }}>
              <User size={18} style={iconStyle} />
              <input type="text" name="nome" value={formData.nome} onChange={handleChange} placeholder="Primeiro e Último Nome *" style={inputStyle} required />
            </div>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={iconStyle} />
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder={t('consultations.form.email_ph')} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <div style={{ position: 'relative', width: '130px' }}>
                <Globe size={16} style={{ position: 'absolute', left: '12px', top: '15px', color: '#64748b', zIndex: 1 }} />
                <select value={phonePrefix} onChange={(e) => setPhonePrefix(e.target.value)} style={{ width: '100%', padding: '14px 10px 14px 38px', borderRadius: '10px', border: `1px solid ${theme.border}`, backgroundColor: theme.isDark ? '#0f172a' : '#f8fafc', color: theme.text, fontSize: '14px', fontWeight: 'bold', outline: 'none', cursor: 'pointer', appearance: 'none', position: 'relative' }}>
                  <option value="+351">PT +351</option><option value="+34">ES +34</option><option value="+33">FR +33</option><option value="+44">UK +44</option><option value="+49">DE +49</option><option value="+41">CH +41</option><option value="+1">US +1</option><option value="+55">BR +55</option>
                </select>
              </div>
              <div style={{ position: 'relative', flex: 1 }}>
                <Phone size={18} style={iconStyle} />
                <input type="text" name="telefone" value={formData.telefone} onChange={handleChange} placeholder="Telemóvel *" style={{ ...inputStyle, marginBottom: 0 }} required />
              </div>
            </div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold', color: theme.subText, textTransform: 'uppercase' }}>{t('consultations.form.procedure')}</label>
            <select name="procedimento_id" value={formData.procedimento_id} onChange={handleChange} style={{ ...inputStyle, paddingLeft: '12px' }} required>
              <option value="">{t('consultations.form.procedure_ph')}</option>
              {modelos.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold', color: theme.subText, textTransform: 'uppercase' }}>{t('consultations.form.date')}</label>
                <input type="date" name="data" value={formData.data} onChange={handleChange} style={{ ...inputStyle, paddingLeft: '12px' }} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold', color: theme.subText, textTransform: 'uppercase' }}>{t('consultations.form.time')}</label>
                <input type="time" name="hora" value={formData.hora} onChange={handleChange} style={{ ...inputStyle, paddingLeft: '12px' }} required />
              </div>
            </div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold', color: theme.subText, textTransform: 'uppercase' }}>{t('consultations.form.notes')}</label>
            <textarea name="motivo" value={formData.motivo} onChange={handleChange} placeholder={t('consultations.form.notes_ph')} className="custom-scrollbar" style={{ ...inputStyle, paddingLeft: '12px', height: '100px', resize: 'none' }}></textarea>
            <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'background-color 0.2s' }}>
              <FileText size={20} /> {isEditing ? t('consultations.form.btn_save') : t('consultations.form.btn_confirm')}
            </button>
            {isEditing && (
              <button type="button" onClick={() => { setIsEditing(false); setFormData({ nome: '', email: '', telefone: '', data: '', hora: '', motivo: '', procedimento_id: ''}); setPhonePrefix('+351'); }} style={{ width: '100%', padding: '12px', backgroundColor: 'transparent', color: theme.subText, border: 'none', cursor: 'pointer', marginTop: '10px', fontWeight: 'bold' }}>{t('consultations.form.btn_cancel')}</button>
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
                  const isFinalizada = c.status === 'FINALIZADA';
                  const cardBackground = isFinalizada ? (theme.isDark ? '#0f172a' : '#f1f5f9') : (theme.isDark ? '#1e293b' : '#ffffff');
                  const opacityLevel = isFinalizada ? 0.6 : 1;
                  const mesCurto = new Date(c.data_consulta).toLocaleDateString(activeLocale, { month: 'short' }).toUpperCase();
                  const dia = new Date(c.data_consulta).getDate();
                  const pColor = getProcedimentoColor(c.procedimento_nome);

                  return (
                    <div key={c.id} style={{ backgroundColor: cardBackground, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: opacityLevel, transition: 'all 0.3s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ backgroundColor: isFinalizada ? theme.border : theme.pageBg, padding: '12px 15px', borderRadius: '10px', textAlign: 'center', minWidth: '60px' }}>
                          <div style={{ fontSize: '11px', fontWeight: 'bold', color: isFinalizada ? theme.subText : '#2563eb' }}>{mesCurto}</div>
                          <div style={{ fontSize: '22px', fontWeight: '900', color: isFinalizada ? theme.subText : '#2563eb' }}>{dia}</div>
                        </div>
                        <div>
                          <h4 style={{ margin: '0 0 5px 0', fontSize: '16px', color: theme.text, textDecoration: isFinalizada ? 'line-through' : 'none' }}>{c.paciente_nome}</h4>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: theme.subText }}><Clock size={14} /> {c.hora_consulta.substring(0, 5)}</span>
                            <span style={{ backgroundColor: pColor.bg, color: pColor.text, padding: '2px 8px', borderRadius: '6px', fontWeight: 'bold', textDecoration: isFinalizada ? 'line-through' : 'none' }}>{c.procedimento_nome || t('consultations.list.no_procedure')}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: theme.subText, fontSize: '13px', marginTop: '5px' }}>
                            <Phone size={14} /> {c.paciente_telefone || t('consultations.list.no_phone')}
                            {!isFinalizada && c.paciente_telefone && c.paciente_telefone !== t('consultations.list.no_phone') && (
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
  );
};

export default Consultas;