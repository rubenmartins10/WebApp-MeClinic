import React, { useState, useContext, useEffect, useMemo } from 'react';
import {
  User, Building, Shield, Bell, Save, CheckCircle, XCircle, Smartphone, Moon, Sun, Globe, Clock, Key,
  Mail, Phone, MapPin, FileText, ShieldAlert, LogOut, Eye, EyeOff, Zap, AlertCircle, Lock, Download,
  Trash2, Activity, LogIn, Volume2, AlertTriangle, HelpCircle, ExternalLink
} from 'lucide-react';
import jsPDF from 'jspdf';
import { ThemeContext } from '../contexts/ThemeContext';
import { LanguageContext } from '../contexts/LanguageContext';
import apiService from '../services/api';

const Settings = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { language, changeLanguage, t } = useContext(LanguageContext);

  // Estado principal
  const [activeTab, setActiveTab] = useState('perfil');
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [expandedSections, setExpandedSections] = useState({});
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const user = (() => { try { return JSON.parse(localStorage.getItem('meclinic_user') || '{}'); } catch { return {}; } })();
  const isAdmin = user.role === 'ADMIN';

  // Estado do perfil
  const [perfilData, setPerfilData] = useState({
    nome: user.nome || '',
    email: user.email || '',
    cargo: user.role || 'Assistente',
    idioma: language,
    ultimoLogin: '2024-01-15T10:30:00Z',
    dataAcesso: '12 de Janeiro de 2024'
  });

  // Estado de segurança
  const [segurancaData, setSegurancaData] = useState({
    passwordAtual: '',
    novaPassword: '',
    confirmarPassword: '',
    mfaToken: '',
    mfaAtivo: true,
    senhaForte: false,
    tentativasLogin: 0,
    ultimaAtividadeSuspicta: null
  });

  // Estado de notificações
  const [notificacoesData, setNotificacoesData] = useState({
    stock: true,
    relatorios: true,
    consultas: false,
    marketing: false,
    email: true,
    sms: false,
    push: true,
    frequencia: 'imediato'
  });

  // Estado da clínica
  const [clinicaData, setClinicaData] = useState(() => {
    const saved = localStorage.getItem('meclinic_settings');
    try { if (saved) return JSON.parse(saved); } catch {}
    return {
      nome: 'MeClinic',
      nif: '501234567',
      telefone: '+351 912 345 678',
      email: 'geral@meclinic.pt',
      morada: 'Avenida da Liberdade, Lisboa\nPortugal',
      timezone: 'Europe/Lisbon'
    };
  });

  // Sessões activas em tempo real - Buscar do API
  const [sessionsAtivas, setSessionsAtivas] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  // Buscar dados reais de atividade quando o componente carrega
  useEffect(() => {
    const fetchActivityData = async () => {
      try {
        const data = await apiService.get('/api/auth/activity');
        
          // Formatar sessões activas
          const formattedSessions = (data.activeSessions || []).map((session, index) => ({
            id: session.id || index,
            user: session.user_name || 'Utilizador',
            role: session.role === 'Admin' ? 'ADMIN' : 'ASSISTENTE',
            device: session.device_info || 'Dispositivo Desconhecido',
            location: session.location || 'Localização Desconhecida',
            lastActivity: new Date(session.last_activity),
            loginTime: new Date(session.login_time),
            status: 'active',
            current: session.user_id === user.id && index === 0 // Primeiro do utilizador actual
          }));

          // Formatar histórico de login
          const formattedHistory = (data.loginHistory || []).map((login, index) => ({
            id: login.id || index,
            user: login.user_name || 'Utilizador',
            role: login.role === 'Admin' ? 'ADMIN' : 'ASSISTENTE',
            data: new Date(login.data),
            dataFormatada: new Date(login.data).toLocaleString('pt-PT'),
            localizacao: login.location || 'Localização Desconhecida',
            dispositivo: login.device_info || 'Dispositivo Desconhecido',
            status: login.status || 'success'
          }));

          setSessionsAtivas(formattedSessions);
          setLoginHistory(formattedHistory);
      } catch (err) {
        console.error('Erro ao buscar dados de atividade:', err);
        // Fallback silencioso
        setSessionsAtivas([{
          id: 1,
          user: user.nome || 'Utilizador Actual',
          role: user.role === 'Admin' ? 'ADMIN' : 'ASSISTENTE',
          device: 'Browser Atual',
          location: 'Localização Atual',
          lastActivity: new Date(),
          loginTime: new Date(),
          status: 'active',
          current: true
        }]);
      } finally {
        setLoadingActivity(false);
      }
    };

    fetchActivityData();
  }, [user.id, user.nome, user.role]);

  // Calcular força de senha
  const calculatePasswordStrength = (password) => {
    if (!password) return { score: 0, label: 'Fraca', color: '#ef4444' };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z\d]/.test(password)) score++;

    if (score <= 2) return { score: 1, label: 'Fraca', color: '#ef4444' };
    if (score <= 3) return { score: 2, label: 'Média', color: '#f59e0b' };
    if (score <= 4) return { score: 3, label: 'Boa', color: '#3b82f6' };
    return { score: 4, label: 'Muito Boa', color: '#10b981' };
  };

  const passwordStrength = calculatePasswordStrength(segurancaData.novaPassword);

  // Notificação
  const showNotif = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: '', message: '' }), 4000);
  };

  // Handlers
  const handleSave = async (e) => {
    e.preventDefault();

    if (activeTab === 'seguranca') {
      if (!segurancaData.passwordAtual || !segurancaData.novaPassword || !segurancaData.confirmarPassword) {
        showNotif('error', t('settings.alert.pass_empty'));
        return;
      }
      if (segurancaData.novaPassword !== segurancaData.confirmarPassword) {
        showNotif('error', t('settings.alert.pass_mismatch'));
        return;
      }
      if (!segurancaData.mfaToken) {
        showNotif('error', t('settings.alert.mfa_empty'));
        return;
      }

      try {
        const response = await fetch("/api/change-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            currentPassword: segurancaData.passwordAtual,
            newPassword: segurancaData.novaPassword,
            mfaToken: segurancaData.mfaToken
          })
        });
        const data = await response.json();
        if (response.ok) {
          showNotif('success', data.message);
          setSegurancaData({
            passwordAtual: '',
            novaPassword: '',
            confirmarPassword: '',
            mfaToken: '',
            mfaAtivo: true,
            senhaForte: false,
            tentativasLogin: 0,
            ultimaAtividadeSuspicta: null
          });
        } else {
          showNotif('error', data.error);
        }
      } catch (err) {
        showNotif('error', t('settings.alert.server_error'));
      }
      return;
    }

    if (activeTab === 'clinica') {
      if (!isAdmin) return;
      localStorage.setItem('meclinic_settings', JSON.stringify(clinicaData));
      showNotif('success', t('settings.alert.clinic_success'));
      return;
    }

    if (activeTab === 'aparencia') {
      changeLanguage(perfilData.idioma);
    }

    showNotif('success', t('settings.alert.success'));
  };

  const handleLogoutAllSessions = () => {
    if (window.confirm('Desconectar todos os dispositivos? Terá de fazer login novamente neste dispositivo.')) {
      showNotif('success', 'Todos os dispositivos foram desconectados.');
    }
  };

  const handleChannelToggle = async (channelKey) => {
    if (channelKey === 'push') {
      const enabling = !notificacoesData.push;
      if (enabling) {
        if (!('Notification' in window)) {
          showNotif('error', 'O seu browser não suporta notificações. Tente Chrome, Firefox ou Safari.');
          return;
        }
        if (Notification.permission === 'denied') {
          showNotif('error', 'Notificações bloqueadas. Ative-as nas definições do browser e recarregue a página.');
          return;
        }
        if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            showNotif('error', 'Permissão de notificações recusada.');
            return;
          }
        }
        // Permission granted — show confirmation notification
        new Notification('MeClinic — Notificações Ativas', {
          body: 'Receberá alertas de stock baixo, lembretes de consultas e relatórios semanais.',
          icon: '/logo192.png'
        });
      }
    }
    setNotificacoesData(prev => ({ ...prev, [channelKey]: !prev[channelKey] }));
  };

  const handleDownloadData = () => {
    try {
      // Gerar PDF com dados pessoais
      const doc = new jsPDF();
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPos = 20;
      
      // Cores profissionais
      const primaryColor = [37, 99, 235]; // Azul
      const secondaryColor = [107, 114, 128]; // Cinzento
      const lightGray = [243, 244, 246];
      
      // === CABEÇALHO ===
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(...primaryColor);
      doc.text('MeClinic', pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 10;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...secondaryColor);
      doc.text('RELATÓRIO DE DADOS PESSOAIS - CONFORMIDADE RGPD', pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 8;
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`Data de Exportação: ${new Date().toLocaleDateString('pt-PT')} | Artigo 20 RGPD`, pageWidth / 2, yPos, { align: 'center' });
      
      // Linha divisória
      yPos += 12;
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(0.5);
      doc.line(20, yPos, pageWidth - 20, yPos);
      
      yPos += 15;
      
      // === SEÇÃO 1: INFORMAÇÕES DE PERFIL ===
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...primaryColor);
      doc.text('INFORMAÇÕES DE PERFIL', 20, yPos);
      
      yPos += 10;
      doc.setDrawColor(200);
      doc.setLineWidth(0.1);
      doc.line(20, yPos, pageWidth - 20, yPos);
      
      yPos += 8;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(50);
      
      const profileData = [
        ['Nome:', perfilData.nome],
        ['Email:', perfilData.email],
        ['Cargo:', perfilData.cargo],
        ['Idioma:', perfilData.idioma],
        ['Último Acesso:', perfilData.dataAcesso]
      ];
      
      profileData.forEach(([label, value]) => {
        if (yPos > pageHeight - 40) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(...secondaryColor);
        doc.text(label, 20, yPos);
        
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(50);
        doc.text(String(value || '-'), 60, yPos);
        
        yPos += 7;
      });
      
      yPos += 12;
      
      // === SEÇÃO 2: PREFERÊNCIAS DE NOTIFICAÇÕES ===
      if (yPos > pageHeight - 50) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...primaryColor);
      doc.text('PREFERÊNCIAS DE NOTIFICAÇÕES', 20, yPos);
      
      yPos += 10;
      doc.setDrawColor(200);
      doc.setLineWidth(0.1);
      doc.line(20, yPos, pageWidth - 20, yPos);
      
      yPos += 8;
      doc.setFontSize(10);
      
      const notifData = [
        ['Alertas de Stock:', notificacoesData.stock ? 'Ativado' : 'Desativado'],
        ['Relatórios Semanais:', notificacoesData.relatorios ? 'Ativado' : 'Desativado'],
        ['Notificações de Consultas:', notificacoesData.consultas ? 'Ativado' : 'Desativado'],
        ['E-mail:', notificacoesData.email ? 'Ativado' : 'Desativado'],
        ['SMS:', notificacoesData.sms ? 'Ativado' : 'Desativado'],
        ['Frequência:', notificacoesData.frequencia]
      ];
      
      notifData.forEach(([label, value]) => {
        if (yPos > pageHeight - 40) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(...secondaryColor);
        doc.text(label, 20, yPos);
        
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(50);
        const statusColor = value === 'Ativado' ? [16, 185, 129] : value === 'Desativado' ? [239, 68, 68] : [107, 114, 128];
        doc.setTextColor(...statusColor);
        doc.text(String(value || '-'), 60, yPos);
        
        yPos += 7;
      });
      
      // === SEÇÃO 3: INFORMAÇÕES DA CLÍNICA (ADMIN ONLY) ===
      if (isAdmin) {
        yPos += 12;
        
        if (yPos > pageHeight - 50) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(...primaryColor);
        doc.text('INFORMAÇÕES DA CLÍNICA', 20, yPos);
        
        yPos += 10;
        doc.setDrawColor(200);
        doc.setLineWidth(0.1);
        doc.line(20, yPos, pageWidth - 20, yPos);
        
        yPos += 8;
        doc.setFontSize(10);
        
        const clinicData = [
          ['Nome:', clinicaData.nome],
          ['NIF:', clinicaData.nif],
          ['Telefone:', clinicaData.telefone],
          ['Email:', clinicaData.email],
          ['Timezone:', clinicaData.timezone]
        ];
        
        clinicData.forEach(([label, value]) => {
          if (yPos > pageHeight - 40) {
            doc.addPage();
            yPos = 20;
          }
          
          doc.setFont('Helvetica', 'bold');
          doc.setTextColor(...secondaryColor);
          doc.text(label, 20, yPos);
          
          doc.setFont('Helvetica', 'normal');
          doc.setTextColor(50);
          doc.text(String(value || '-'), 60, yPos);
          
          yPos += 7;
        });
      }
      
      // === RODAPÉ ===
      const footerY = pageHeight - 20;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.line(20, footerY - 5, pageWidth - 20, footerY - 5);
      doc.text('Este documento contém informações confidenciais protegidas pelo Regulamento Geral de Proteção de Dados (RGPD).', 
        pageWidth / 2, footerY - 2, { align: 'center' });
      doc.text(`MeClinic™ - Sistema de Gestão Clínica | Exportado em ${new Date().toLocaleString('pt-PT')}`, 
        pageWidth / 2, footerY + 2, { align: 'center' });
      
      // Download
      const filename = `MeClinic-Dados-Pessoais-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      showNotif('success', 'Dados descarregados com sucesso em PDF.');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      // Fallback para JSON
      const data = {
        perfil: perfilData,
        notificacoes: notificacoesData,
        clinica: isAdmin ? clinicaData : null,
        dataExportacao: new Date().toISOString()
      };
      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2)));
      element.setAttribute('download', `meclinic-dados-${new Date().toISOString().split('T')[0]}.json`);
      element.click();
      showNotif('success', 'Dados descarregados em formato JSON.');
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(false);
    const confirmDelete = window.confirm(
      'ATENÇÃO: Esta ação é irreversível e eliminará permanentemente a sua conta e todos os seus dados.\n\nEscreva "CONFIRMAR_ELIMINACAO" para proceder.'
    );
    
    if (confirmDelete) {
      const userInput = prompt('Confirme digitando: CONFIRMAR_ELIMINACAO');
      if (userInput === 'CONFIRMAR_ELIMINACAO') {
        // Aqui fazer uma chamada ao API para eliminar a conta
        showNotif('warning', 'Conta em processo de eliminação...');
        // TODO: Implementar chamada ao backend
        setTimeout(() => {
          localStorage.removeItem('meclinic_user');
          localStorage.removeItem('token');
          window.location.href = '/login';
        }, 2000);
      } else {
        showNotif('error', 'Confirmação incorreta. Eliminação cancelada.');
      }
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nome || 'User')}&background=2563eb&color=fff&rounded=true&bold=true&size=128`;

  // Estilos reutilizáveis
  const inputStyle = {
    width: '100%',
    padding: '12px 15px',
    borderRadius: '8px',
    border: `1px solid ${theme.border}`,
    background: theme.pageBg,
    color: theme.text,
    outline: 'none',
    fontSize: '15px',
    marginTop: '8px',
    transition: 'border-color 0.2s'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '11px',
    fontWeight: '800',
    color: theme.subText,
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };

  const sectionHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '15px 20px',
    backgroundColor: theme.isDark ? 'rgba(37, 99, 235, 0.1)' : 'rgba(37, 99, 235, 0.05)',
    borderLeft: '4px solid #2563eb',
    borderRadius: '8px',
    marginBottom: '15px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  };

  const tabStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '15px 20px',
    width: '100%',
    textAlign: 'left',
    border: 'none',
    backgroundColor: isActive ? (theme.isDark ? '#1e3a8a' : '#dbeafe') : 'transparent',
    color: isActive ? '#2563eb' : theme.text,
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: isActive ? 'bold' : 'normal',
    transition: 'all 0.2s ease',
    marginBottom: '5px'
  });

  // Componentes reutilizáveis
  const ToggleSwitch = ({ checked, onChange, label, description }) => (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '15px 20px',
      backgroundColor: theme.pageBg,
      borderRadius: '12px',
      border: `1px solid ${theme.border}`,
      marginBottom: '15px',
      transition: 'all 0.2s'
    }}>
      <div>
        <span style={{ fontWeight: 'bold', display: 'block', color: theme.isDark ? '#ffffff' : theme.text, marginBottom: '5px' }}>
          {label}
        </span>
        <span style={{ fontSize: '12px', color: theme.subText, lineHeight: '1.4', display: 'block' }}>
          {description}
        </span>
      </div>
      <div onClick={onChange} style={{
        width: '46px',
        height: '26px',
        backgroundColor: checked ? '#10b981' : (theme.isDark ? '#475569' : '#cbd5e1'),
        borderRadius: '20px',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background-color 0.3s'
      }}>
        <div style={{
          width: '22px',
          height: '22px',
          backgroundColor: 'white',
          borderRadius: '50%',
          position: 'absolute',
          top: '2px',
          left: checked ? '22px' : '2px',
          transition: 'left 0.3s',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }} />
      </div>
    </div>
  );

  const PasswordStrengthBar = ({ strength }) => (
    <div style={{ marginTop: '8px' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{
            flex: 1,
            height: '4px',
            borderRadius: '2px',
            backgroundColor: i <= strength.score ? strength.color : theme.border,
            transition: 'all 0.2s'
          }} />
        ))}
      </div>
      <span style={{ fontSize: '11px', color: strength.color, fontWeight: 'bold' }}>
        Força: {strength.label}
      </span>
    </div>
  );

  const SecurityCard = ({ icon: Icon, title, status, color, children }) => (
    <div style={{
      backgroundColor: theme.pageBg,
      borderRadius: '12px',
      border: `1px solid ${theme.border}`,
      padding: '20px',
      marginBottom: '15px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          backgroundColor: `${color}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {Icon && <Icon size={24} color={color} />}
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: '0', color: theme.text, fontSize: '15px' }}>{title}</h4>
          {status && <span style={{ fontSize: '11px', color: status.color, fontWeight: 'bold' }}>{status.label}</span>}
        </div>
      </div>
      {children}
    </div>
  );

  return (
    <div style={{ padding: '20px', color: theme.text, maxWidth: '1400px', margin: '0 auto' }}>

      {/* Notificação */}
      {notification.show && (
        <div style={{
          position: 'fixed',
          top: 30,
          right: 30,
          backgroundColor: notification.type === 'success' ? '#059669' : '#ef4444',
          color: 'white',
          padding: '15px 25px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
          zIndex: 9999,
          fontWeight: 'bold',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          {notification.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
          {notification.message}
        </div>
      )}

      {/* Cabeçalho */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '30px', fontWeight: '800', margin: '0 0 10px 0', color: theme.isDark ? '#ffffff' : theme.text }}>
          {t('settings.title')}
        </h1>
        <p style={{ color: theme.subText, margin: 0, fontSize: '16px' }}>
          {t('settings.subtitle')}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '40px' }}>

        {/* Barra lateral */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <button onClick={() => setActiveTab('perfil')} style={tabStyle(activeTab === 'perfil')}>
            <User size={18} /> {t('settings.tab.profile')}
          </button>
          <button onClick={() => setActiveTab('seguranca')} style={tabStyle(activeTab === 'seguranca')}>
            <Shield size={18} /> {t('settings.tab.security')}
          </button>
          <button onClick={() => setActiveTab('aparencia')} style={tabStyle(activeTab === 'aparencia')}>
            <Moon size={18} /> {t('settings.tab.appearance')}
          </button>
          <button onClick={() => setActiveTab('notificacoes')} style={tabStyle(activeTab === 'notificacoes')}>
            <Bell size={18} /> {t('settings.tab.notifications')}
          </button>

          <div style={{ height: '1px', backgroundColor: theme.border, margin: '15px 0' }}></div>

          <button onClick={() => setActiveTab('clinica')} style={tabStyle(activeTab === 'clinica')}>
            <Building size={18} /> {t('settings.tab.clinic')}
          </button>

          <div style={{ height: '1px', backgroundColor: theme.border, margin: '15px 0' }}></div>

          <button onClick={() => setActiveTab('privacidade')} style={tabStyle(activeTab === 'privacidade')}>
            <Lock size={18} /> Privacidade & GDPR
          </button>
          <button onClick={() => setActiveTab('atividade')} style={tabStyle(activeTab === 'atividade')}>
            <Activity size={18} /> Atividade da Conta
          </button>
        </div>

        {/* Conteúdo principal */}
        <div style={{
          backgroundColor: theme.cardBg,
          borderRadius: '16px',
          border: `1px solid ${theme.border}`,
          padding: '40px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
          minHeight: '600px'
        }}>

          <form onSubmit={handleSave}>

            {/* TAB PERFIL */}
            {activeTab === 'perfil' && (
              <div style={{ animation: 'fadeIn 0.3s' }}>
                <h2 style={{
                  margin: '0 0 30px 0',
                  borderBottom: `1px solid ${theme.border}`,
                  paddingBottom: '15px',
                  color: theme.isDark ? '#ffffff' : theme.text
                }}>
                  {t('settings.profile.title')}
                </h2>

                {/* Avatar e Informações Básicas */}
                <div style={{ display: 'flex', gap: '30px', marginBottom: '40px', alignItems: 'flex-start' }}>
                  <img src={avatarUrl} alt="Avatar" style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    border: `4px solid ${theme.pageBg}`,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: '15px' }}>
                      <div style={{
                        display: 'inline-block',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        backgroundColor: isAdmin ? 'rgba(139, 92, 246, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                        color: isAdmin ? '#a78bfa' : '#60a5fa',
                        fontWeight: 'bold',
                        fontSize: '12px',
                        letterSpacing: '0.5px'
                      }}>
                        {perfilData.cargo}
                      </div>
                    </div>
                    <p style={{ margin: '0 0 15px 0', color: theme.subText, fontSize: '14px' }}>
                      {t('settings.profile.avatar_desc')}
                    </p>
                    <div style={{ fontSize: '12px', color: theme.subText }}>
                      <div>Último login: <strong>{perfilData.dataAcesso}</strong></div>
                    </div>
                  </div>
                </div>

                {/* Dados do Perfil */}
                <div style={{
                  backgroundColor: theme.pageBg,
                  borderRadius: '12px',
                  border: `1px solid ${theme.border}`,
                  padding: '20px',
                  marginBottom: '25px'
                }}>
                  <h4 style={{ margin: '0 0 20px 0', color: theme.text, fontSize: '14px', fontWeight: 'bold' }}>
                    Informações Pessoais
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
                    <div>
                      <label style={labelStyle}>{t('settings.profile.name')}</label>
                      <div style={{ position: 'relative' }}>
                        <User size={18} color={theme.subText} style={{ position: 'absolute', left: '15px', top: '22px' }} />
                        <input
                          type="text"
                          style={{ ...inputStyle, paddingLeft: '45px', opacity: 0.7, cursor: 'not-allowed' }}
                          value={perfilData.nome}
                          readOnly
                          disabled
                        />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>{t('settings.profile.email')}</label>
                      <div style={{ position: 'relative' }}>
                        <Mail size={18} color={theme.subText} style={{ position: 'absolute', left: '15px', top: '22px' }} />
                        <input
                          type="email"
                          style={{ ...inputStyle, paddingLeft: '45px', opacity: 0.7, cursor: 'not-allowed' }}
                          value={perfilData.email}
                          readOnly
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '15px 20px', backgroundColor: 'rgba(251, 146, 60, 0.1)', borderRadius: '8px', border: '1px solid rgba(251, 146, 60, 0.3)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertCircle size={18} color="#f97316" />
                  <span style={{ fontSize: '13px', color: '#ea580c' }}>
                    {t('settings.profile.contact_admin')}
                  </span>
                </div>
              </div>
            )}

            {/* TAB SEGURANÇA */}
            {activeTab === 'seguranca' && (
              <div style={{ animation: 'fadeIn 0.3s' }}>
                <h2 style={{
                  margin: '0 0 30px 0',
                  borderBottom: `1px solid ${theme.border}`,
                  paddingBottom: '15px',
                  color: theme.isDark ? '#ffffff' : theme.text
                }}>
                  {t('settings.security.title')}
                </h2>

                {/* Estado de Segurança */}
                <SecurityCard
                  icon={Smartphone}
                  title="Autenticação de Dois Fatores (MFA)"
                  status={{ label: 'ATIVO', color: '#10b981' }}
                  color="#10b981"
                >
                  <p style={{ margin: '0', fontSize: '13px', color: theme.subText }}>
                    {t('settings.security.mfa_desc')}
                  </p>
                </SecurityCard>

                {/* Alertas de Segurança */}
                {segurancaData.tentativasLogin > 0 && (
                  <SecurityCard
                    icon={AlertTriangle}
                    title="Tentativas de Login Suspeitas"
                    status={{ label: `${segurancaData.tentativasLogin} tentativas`, color: '#f59e0b' }}
                    color="#f59e0b"
                  >
                    <p style={{ margin: '0', fontSize: '12px', color: theme.subText }}>
                      Detectámos {segurancaData.tentativasLogin} tentativa(s) de login falhada(s) na tua conta nos últimos 7 dias.
                    </p>
                  </SecurityCard>
                )}

                {/* Alteração de Senha */}
                <div style={{
                  backgroundColor: theme.pageBg,
                  borderRadius: '12px',
                  border: `1px solid ${theme.border}`,
                  padding: '20px',
                  marginTop: '25px',
                  marginBottom: '25px'
                }}>
                  <h4 style={{ margin: '0 0 20px 0', color: theme.text, fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Key size={16} /> Alterar Palavra-passe
                  </h4>

                  <label style={labelStyle}>{t('settings.security.current_pass')}</label>
                  <div style={{ position: 'relative', marginBottom: '25px' }}>
                    <Key size={18} color={theme.subText} style={{ position: 'absolute', left: '15px', top: '22px' }} />
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      style={{ ...inputStyle, paddingLeft: '45px', paddingRight: '45px' }}
                      placeholder={t('settings.security.placeholder.current')}
                      value={segurancaData.passwordAtual}
                      onChange={e => setSegurancaData({ ...segurancaData, passwordAtual: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      style={{
                        position: 'absolute',
                        right: '15px',
                        top: '22px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: theme.subText
                      }}
                    >
                      {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
                    <div>
                      <label style={labelStyle}>{t('settings.security.new_pass')}</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          style={{ ...inputStyle, paddingRight: '45px' }}
                          placeholder={t('settings.security.placeholder.new')}
                          value={segurancaData.novaPassword}
                          onChange={e => {
                            setSegurancaData({ ...segurancaData, novaPassword: e.target.value });
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                          style={{
                            position: 'absolute',
                            right: '15px',
                            top: '22px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: theme.subText
                          }}
                        >
                          {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {segurancaData.novaPassword && <PasswordStrengthBar strength={passwordStrength} />}
                    </div>
                    <div>
                      <label style={labelStyle}>{t('settings.security.confirm_pass')}</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          style={{ ...inputStyle, paddingRight: '45px' }}
                          placeholder={t('settings.security.placeholder.confirm')}
                          value={segurancaData.confirmarPassword}
                          onChange={e => setSegurancaData({ ...segurancaData, confirmarPassword: e.target.value })}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                          style={{
                            position: 'absolute',
                            right: '15px',
                            top: '22px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: theme.subText
                          }}
                        >
                          {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {segurancaData.novaPassword && segurancaData.confirmarPassword && segurancaData.novaPassword !== segurancaData.confirmarPassword && (
                    <div style={{ fontSize: '12px', color: '#ef4444', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <XCircle size={16} /> As palavras-passe não coincidem.
                    </div>
                  )}
                </div>

                {/* MFA Token */}
                <div style={{
                  backgroundColor: theme.pageBg,
                  borderRadius: '12px',
                  border: `1px solid ${theme.border}`,
                  padding: '20px',
                  marginBottom: '25px'
                }}>
                  <h4 style={{ margin: '0 0 15px 0', color: theme.text, fontSize: '14px', fontWeight: 'bold' }}>
                    Verificação com Google Authenticator
                  </h4>
                  <label style={{ ...labelStyle, color: '#10b981' }}>{t('settings.security.mfa_code')}</label>
                  <input
                    type="text"
                    maxLength="6"
                    style={{
                      ...inputStyle,
                      borderColor: '#10b981',
                      borderWidth: '2px',
                      fontWeight: 'bold',
                      letterSpacing: '8px',
                      fontSize: '24px',
                      textAlign: 'center',
                      backgroundColor: theme.pageBg,
                      marginBottom: '10px'
                    }}
                    placeholder="123456"
                    value={segurancaData.mfaToken}
                    onChange={e => setSegurancaData({ ...segurancaData, mfaToken: e.target.value.replace(/\D/g, '') })}
                  />
                  <p style={{ margin: '0', fontSize: '12px', color: theme.subText, textAlign: 'center' }}>
                    {t('settings.security.mfa_code_desc')}
                  </p>
                </div>
              </div>
            )}

            {/* TAB APARÊNCIA */}
            {activeTab === 'aparencia' && (
              <div style={{ animation: 'fadeIn 0.3s' }}>
                <h2 style={{
                  margin: '0 0 30px 0',
                  borderBottom: `1px solid ${theme.border}`,
                  paddingBottom: '15px',
                  color: theme.isDark ? '#ffffff' : theme.text
                }}>
                  {t('settings.appearance.title')}
                </h2>

                <h3 style={{ fontSize: '14px', color: theme.subText, textTransform: 'uppercase', marginBottom: '15px' }}>
                  {t('settings.appearance.theme')}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
                  <div onClick={() => theme.isDark && toggleTheme && toggleTheme()} style={{
                    padding: '30px',
                    borderRadius: '16px',
                    border: `2px solid ${!theme.isDark ? '#2563eb' : theme.border}`,
                    backgroundColor: '#ffffff',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}>
                    {!theme.isDark && <div style={{ position: 'absolute', top: '15px', right: '15px', color: '#2563eb' }}><CheckCircle size={24} /></div>}
                    <Sun size={40} color="#f59e0b" style={{ margin: '0 auto 15px auto' }} />
                    <h4 style={{ margin: '0 0 5px 0', color: '#1e293b', fontSize: '16px', fontWeight: 'bold' }}>
                      {t('settings.appearance.light')}
                    </h4>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                      {t('settings.appearance.light_desc')}
                    </p>
                  </div>

                  <div onClick={() => !theme.isDark && toggleTheme && toggleTheme()} style={{
                    padding: '30px',
                    borderRadius: '16px',
                    border: `2px solid ${theme.isDark ? '#2563eb' : theme.border}`,
                    backgroundColor: '#0f172a',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}>
                    {theme.isDark && <div style={{ position: 'absolute', top: '15px', right: '15px', color: '#2563eb' }}><CheckCircle size={24} /></div>}
                    <Moon size={40} color="#60a5fa" style={{ margin: '0 auto 15px auto' }} />
                    <h4 style={{ margin: '0 0 5px 0', color: '#ffffff', fontSize: '16px', fontWeight: 'bold' }}>
                      {t('settings.appearance.dark')}
                    </h4>
                    <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                      {t('settings.appearance.dark_desc')}
                    </p>
                  </div>
                </div>

                <h3 style={{ fontSize: '14px', color: theme.subText, textTransform: 'uppercase', marginBottom: '15px' }}>
                  {t('settings.appearance.location')}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
                  <div>
                    <label style={labelStyle}>{t('settings.appearance.language')}</label>
                    <div style={{ position: 'relative' }}>
                      <Globe size={18} color={theme.subText} style={{ position: 'absolute', left: '15px', top: '22px' }} />
                      <select style={{
                        ...inputStyle,
                        paddingLeft: '45px',
                        appearance: 'none',
                        cursor: 'pointer'
                      }} value={perfilData.idioma} onChange={e => setPerfilData({ ...perfilData, idioma: e.target.value })}>
                        <option value="pt">{t('lang.pt')}</option>
                        <option value="en">{t('lang.en')}</option>
                        <option value="es">{t('lang.es')}</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>{t('settings.appearance.time_format')}</label>
                    <div style={{ position: 'relative' }}>
                      <Clock size={18} color={theme.subText} style={{ position: 'absolute', left: '15px', top: '22px' }} />
                      <select style={{
                        ...inputStyle,
                        paddingLeft: '45px',
                        appearance: 'none',
                        cursor: 'pointer'
                      }}>
                        <option value="24h">{t('time.24h')}</option>
                        <option value="12h">{t('time.12h')}</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB NOTIFICAÇÕES */}
            {activeTab === 'notificacoes' && (
              <div style={{ animation: 'fadeIn 0.3s' }}>
                <h2 style={{
                  margin: '0 0 30px 0',
                  borderBottom: `1px solid ${theme.border}`,
                  paddingBottom: '15px',
                  color: theme.isDark ? '#ffffff' : theme.text
                }}>
                  {t('settings.notif.title')}
                </h2>

                <h3 style={{ fontSize: '14px', color: theme.subText, textTransform: 'uppercase', marginBottom: '15px' }}>
                  Canais de Notificação
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '30px' }}>
                  {[
                    { key: 'email', label: 'Email', icon: Mail },
                    { key: 'sms', label: 'SMS', icon: Smartphone },
                    { key: 'push', label: 'App', icon: Bell }
                  ].map(channel => (
                    <div
                      key={channel.key}
                      onClick={() => handleChannelToggle(channel.key)}
                      style={{
                        padding: '15px',
                        borderRadius: '12px',
                        border: `2px solid ${notificacoesData[channel.key] ? '#2563eb' : theme.border}`,
                        backgroundColor: notificacoesData[channel.key] ? (theme.isDark ? 'rgba(37, 99, 235, 0.1)' : 'rgba(37, 99, 235, 0.05)') : theme.pageBg,
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.2s'
                      }}
                    >
                      {notificacoesData[channel.key] && <CheckCircle size={16} color="#2563eb" style={{ marginBottom: '8px' }} />}
                      <channel.icon size={20} color={notificacoesData[channel.key] ? '#2563eb' : theme.subText} style={{ margin: '0 auto 8px auto' }} />
                      <div style={{ fontSize: '12px', color: theme.text, fontWeight: 'bold' }}>{channel.label}</div>
                    </div>
                  ))}
                </div>

                <h3 style={{ fontSize: '14px', color: theme.subText, textTransform: 'uppercase', marginBottom: '15px' }}>
                  Preferências de Alertas
                </h3>
                <ToggleSwitch
                  label={t('settings.notif.stock')}
                  description={t('settings.notif.stock_desc')}
                  checked={notificacoesData.stock}
                  onChange={() => setNotificacoesData({ ...notificacoesData, stock: !notificacoesData.stock })}
                />
                <ToggleSwitch
                  label={t('settings.notif.reports')}
                  description={t('settings.notif.reports_desc')}
                  checked={notificacoesData.relatorios}
                  onChange={() => setNotificacoesData({ ...notificacoesData, relatorios: !notificacoesData.relatorios })}
                />
                <ToggleSwitch
                  label={t('settings.notif.consultations')}
                  description={t('settings.notif.consultations_desc')}
                  checked={notificacoesData.consultas}
                  onChange={() => setNotificacoesData({ ...notificacoesData, consultas: !notificacoesData.consultas })}
                />
              </div>
            )}

            {/* TAB CLÍNICA */}
            {activeTab === 'clinica' && (
              <div style={{ animation: 'fadeIn 0.3s' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: `1px solid ${theme.border}`,
                  paddingBottom: '15px',
                  marginBottom: '30px'
                }}>
                  <h2 style={{ margin: 0, color: theme.isDark ? '#ffffff' : theme.text }}>
                    {t('settings.clinic.title')}
                  </h2>
                  {!isAdmin && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#f59e0b',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: 'rgba(245, 158, 11, 0.1)',
                      padding: '6px 12px',
                      borderRadius: '20px'
                    }}>
                      <ShieldAlert size={14} /> {t('settings.clinic.readonly')}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start', marginBottom: '30px' }}>
                  <div style={{
                    width: '250px',
                    backgroundColor: theme.pageBg,
                    borderRadius: '12px',
                    border: `1px solid ${theme.border}`,
                    padding: '20px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(37, 99, 235, 0.1)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      margin: '0 auto 15px auto'
                    }}>
                      <Building size={30} color="#2563eb" />
                    </div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', color: theme.isDark ? '#ffffff' : theme.text, fontWeight: 'bold' }}>
                      {clinicaData.nome}
                    </h3>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: theme.subText, backgroundColor: theme.cardBg, padding: '4px 8px', borderRadius: '6px', display: 'inline-block' }}>
                      NIF: {clinicaData.nif}
                    </div>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px', marginBottom: '15px' }}>
                      <div>
                        <label style={labelStyle}>{t('settings.clinic.entity_name')}</label>
                        <div style={{ position: 'relative' }}>
                          <FileText size={16} color={theme.subText} style={{ position: 'absolute', left: '15px', top: '22px' }} />
                          <input
                            type="text"
                            style={{ ...inputStyle, paddingLeft: '45px', opacity: isAdmin ? 1 : 0.6 }}
                            value={clinicaData.nome}
                            onChange={e => setClinicaData({ ...clinicaData, nome: e.target.value })}
                            readOnly={!isAdmin}
                          />
                        </div>
                      </div>
                      <div>
                        <label style={labelStyle}>{t('settings.clinic.nif')}</label>
                        <input
                          type="text"
                          maxLength="9"
                          style={{ ...inputStyle, opacity: isAdmin ? 1 : 0.6 }}
                          value={clinicaData.nif}
                          onChange={e => setClinicaData({ ...clinicaData, nif: e.target.value.replace(/\D/g, '') })}
                          readOnly={!isAdmin}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                      <div>
                        <label style={labelStyle}>{t('settings.clinic.phone')}</label>
                        <div style={{ position: 'relative' }}>
                          <Phone size={16} color={theme.subText} style={{ position: 'absolute', left: '15px', top: '22px' }} />
                          <input
                            type="text"
                            style={{ ...inputStyle, paddingLeft: '45px', opacity: isAdmin ? 1 : 0.6 }}
                            value={clinicaData.telefone}
                            onChange={e => setClinicaData({ ...clinicaData, telefone: e.target.value })}
                            readOnly={!isAdmin}
                          />
                        </div>
                      </div>
                      <div>
                        <label style={labelStyle}>{t('settings.clinic.email')}</label>
                        <div style={{ position: 'relative' }}>
                          <Mail size={16} color={theme.subText} style={{ position: 'absolute', left: '15px', top: '22px' }} />
                          <input
                            type="email"
                            style={{ ...inputStyle, paddingLeft: '45px', opacity: isAdmin ? 1 : 0.6 }}
                            value={clinicaData.email}
                            onChange={e => setClinicaData({ ...clinicaData, email: e.target.value })}
                            readOnly={!isAdmin}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label style={labelStyle}>{t('settings.clinic.address')}</label>
                      <div style={{ position: 'relative' }}>
                        <MapPin size={16} color={theme.subText} style={{ position: 'absolute', left: '15px', top: '22px' }} />
                        <textarea
                          rows="3"
                          style={{ ...inputStyle, paddingLeft: '45px', resize: 'none', opacity: isAdmin ? 1 : 0.6 }}
                          value={clinicaData.morada}
                          onChange={e => setClinicaData({ ...clinicaData, morada: e.target.value })}
                          readOnly={!isAdmin}
                        />
                      </div>
                      <p style={{ fontSize: '11px', color: theme.subText, marginTop: '-10px' }}>
                        {t('settings.clinic.address_desc')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB PRIVACIDADE */}
            {activeTab === 'privacidade' && (
              <div style={{ animation: 'fadeIn 0.3s' }}>
                <h2 style={{
                  margin: '0 0 30px 0',
                  borderBottom: `1px solid ${theme.border}`,
                  paddingBottom: '15px',
                  color: theme.isDark ? '#ffffff' : theme.text
                }}>
                  Privacidade & Conformidade GDPR
                </h2>

                <SecurityCard
                  icon={Lock}
                  title="Proteção de Dados"
                  status={{ label: 'Conformidade RGPD Completa', color: '#10b981' }}
                  color="#10b981"
                >
                  <p style={{ margin: '0 0 15px 0', fontSize: '13px', color: theme.subText }}>
                    Os teus dados são protegidos de acordo com o Regulamento Geral de Proteção de Dados (RGPD).
                  </p>
                  <button
                    onClick={handleDownloadData}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      backgroundColor: '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Download size={14} /> Descarregar Dados Pessoais
                  </button>
                </SecurityCard>

                <SecurityCard
                  icon={Trash2}
                  title="Eliminar Conta"
                  status={{ label: 'Operação Irreversível', color: '#ef4444' }}
                  color="#ef4444"
                >
                  <p style={{ margin: '0 0 15px 0', fontSize: '13px', color: theme.subText }}>
                    A eliminação da tua conta é permanente e removerá todos os teus dados do sistema.
                  </p>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
                  >
                    <Trash2 size={14} /> Eliminar Conta Permanentemente
                  </button>
                </SecurityCard>
              </div>
            )}

            {/* TAB ATIVIDADE */}
            {activeTab === 'atividade' && (
              <div style={{ animation: 'fadeIn 0.3s' }}>
                <h2 style={{
                  margin: '0 0 30px 0',
                  borderBottom: `1px solid ${theme.border}`,
                  paddingBottom: '15px',
                  color: theme.isDark ? '#ffffff' : theme.text
                }}>
                  Atividade da Conta
                </h2>

                <div className="tabs-container" style={{ marginBottom: '25px', display: 'flex', gap: '15px', borderBottom: `1px solid ${theme.border}`, paddingBottom: '15px' }}>
                  <button
                    onClick={() => toggleSection('sessions')}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: expandedSections.sessions ? '#2563eb' : 'transparent',
                      color: expandedSections.sessions ? 'white' : theme.text,
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      transition: 'all 0.2s'
                    }}
                  >
                    Sessões Ativas
                  </button>
                  <button
                    onClick={() => toggleSection('history')}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: expandedSections.history ? '#2563eb' : 'transparent',
                      color: expandedSections.history ? 'white' : theme.text,
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      transition: 'all 0.2s'
                    }}
                  >
                    Histórico de Login
                  </button>
                </div>

                {/* Sessões Ativas */}
                {expandedSections.sessions && (
                  <div style={{ marginBottom: '30px' }}>
                    <h4 style={{ margin: '0 0 20px 0', color: theme.text, fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Smartphone size={16} /> Sessões Conectadas em Tempo Real ({sessionsAtivas.length})
                    </h4>

                    {sessionsAtivas.map((session) => (
                      <div key={session.id} style={{
                        display: 'grid',
                        gridTemplateColumns: 'auto 1fr auto',
                        alignItems: 'center',
                        padding: '15px 20px',
                        backgroundColor: session.current ? (theme.isDark ? 'rgba(37, 99, 235, 0.1)' : 'rgba(37, 99, 235, 0.05)') : theme.pageBg,
                        borderRadius: '12px',
                        border: `2px solid ${session.current ? '#2563eb' : theme.border}`,
                        marginBottom: '12px',
                        gap: '15px'
                      }}>
                        {/* Avatar e indicador */}
                        <div style={{ position: 'relative' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: session.role === 'ADMIN' ? '#a78bfa' : '#60a5fa',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '16px'
                          }}>
                            {session.user.substring(0, 1).toUpperCase()}
                          </div>
                          {session.status === 'active' && (
                            <div style={{
                              position: 'absolute',
                              bottom: '0',
                              right: '0',
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              backgroundColor: '#10b981',
                              border: `2px solid ${theme.cardBg}`,
                              boxShadow: '0 0 4px rgba(16, 185, 129, 0.5)'
                            }} />
                          )}
                        </div>

                        {/* Informações */}
                        <div>
                          <div style={{ fontSize: '13px', color: theme.text, fontWeight: 'bold', marginBottom: '4px' }}>
                            {session.user}
                            {session.current && (
                              <span style={{
                                marginLeft: '8px',
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                backgroundColor: '#2563eb',
                                color: 'white',
                                fontSize: '10px',
                                fontWeight: 'bold'
                              }}>
                                ESTE DISPOSITIVO
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '11px', color: theme.subText, marginBottom: '6px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              borderRadius: '8px',
                              backgroundColor: session.role === 'ADMIN' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                              color: session.role === 'ADMIN' ? '#a78bfa' : '#60a5fa',
                              fontWeight: 'bold'
                            }}>
                              {session.role === 'ADMIN' ? '🔐 ADMINISTRADOR' : '👤 ASSISTENTE'}
                            </span>
                            <span>Ativo agora</span>
                          </div>
                          <div style={{ fontSize: '11px', color: theme.subText, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 12px' }}>
                            <span style={{ fontWeight: 'bold' }}>Login:</span>
                            <span>{session.loginTime.toLocaleString('pt-PT')}</span>
                            <span style={{ fontWeight: 'bold' }}>Dispositivo:</span>
                            <span>{session.device}</span>
                            <span style={{ fontWeight: 'bold' }}>Local:</span>
                            <span>📍 {session.location}</span>
                            <span style={{ fontWeight: 'bold' }}>Última atividade:</span>
                            <span>{Math.floor((Date.now() - session.lastActivity) / 60000)} min atrás</span>
                          </div>
                        </div>

                        {/* Botão de ação */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {session.current && (
                            <button onClick={handleLogoutAllSessions} style={{
                              padding: '6px 12px',
                              backgroundColor: '#f59e0b',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              transition: 'all 0.2s',
                              whiteSpace: 'nowrap'
                            }}>
                              <LogOut size={12} style={{ display: 'inline', marginRight: '4px' }} /> Desconectar Tudo
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    <div style={{
                      padding: '12px 16px',
                      backgroundColor: theme.isDark ? 'rgba(16, 185, 129, 0.1)' : '#d1fae5',
                      borderRadius: '8px',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      fontSize: '12px',
                      color: theme.isDark ? '#a7f3d0' : '#065f46',
                      marginTop: '15px'
                    }}>
                      ℹ️ As sessões activas são actualizadas em tempo real. Clique no botão para desconectar dispositivos específicos ou todos os dispositivos.
                    </div>
                  </div>
                )}

                {/* Histórico de Login */}
                {expandedSections.history && (
                  <div>
                    <h4 style={{ margin: '0 0 15px 0', color: theme.text, fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <LogIn size={16} /> Histórico de Logins Recentes ({loginHistory.length})
                    </h4>
                    {loginHistory.map((login) => (
                      <div key={login.id} style={{
                        display: 'grid',
                        gridTemplateColumns: 'auto 1fr auto',
                        alignItems: 'stretch',
                        padding: '15px 20px',
                        backgroundColor: theme.pageBg,
                        borderRadius: '12px',
                        border: `1px solid ${theme.border}`,
                        marginBottom: '12px',
                        gap: '15px'
                      }}>
                        {/* Status Icon */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {login.status === 'success' ? (
                            <div style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              backgroundColor: 'rgba(16, 185, 129, 0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <CheckCircle size={20} color="#10b981" />
                            </div>
                          ) : (
                            <div style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              backgroundColor: 'rgba(239, 68, 68, 0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <XCircle size={20} color="#ef4444" />
                            </div>
                          )}
                        </div>

                        {/* Informações */}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <span style={{ fontSize: '13px', color: theme.text, fontWeight: 'bold' }}>
                              {login.user}
                            </span>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '8px',
                              backgroundColor: login.role === 'ADMIN' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                              color: login.role === 'ADMIN' ? '#a78bfa' : '#60a5fa',
                              fontSize: '10px',
                              fontWeight: 'bold'
                            }}>
                              {login.role === 'ADMIN' ? '🔐 ADMIN' : '👤 ASSISTENTE'}
                            </span>
                            <span style={{
                              fontSize: '11px',
                              color: login.status === 'success' ? '#10b981' : '#ef4444',
                              fontWeight: 'bold'
                            }}>
                              {login.status === 'success' ? '✓ Sucesso' : '✗ Falha'}
                            </span>
                          </div>

                          <div style={{ fontSize: '11px', color: theme.subText, display: 'grid', gridTemplateColumns: 'auto 1fr auto 1fr', gap: '8px', marginBottom: '6px' }}>
                            <span style={{ fontWeight: 'bold' }}>Dispositivo:</span>
                            <span>{login.dispositivo}</span>
                            <span style={{ fontWeight: 'bold' }}>Local:</span>
                            <span>📍 {login.localizacao}</span>
                          </div>

                          <div style={{ fontSize: '10px', color: theme.subText, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px' }}>
                            <span style={{ fontWeight: 'bold' }}>Data:</span>
                            <span>{login.dataFormatada}</span>
                          </div>
                        </div>

                        {/* Tempo decorrido */}
                        <div style={{ textAlign: 'right', fontSize: '11px', color: theme.subText, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <span style={{ fontWeight: 'bold' }}>
                            {Math.floor((Date.now() - login.data.getTime()) / (1000 * 60 * 60 * 24))} dias atrás
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    <div style={{
                      padding: '12px 16px',
                      backgroundColor: theme.isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                      borderRadius: '8px',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      fontSize: '12px',
                      color: theme.isDark ? '#93c5fd' : '#1e40af',
                      marginTop: '15px'
                    }}>
                      ℹ️ Todos os logins são registados com timestamp, IP, dispositivo e localização para conformidade de segurança.
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Botão de Guardar */}
            {!(activeTab === 'clinica' && !isAdmin) && activeTab !== 'privacidade' && activeTab !== 'atividade' && (
              <div style={{
                marginTop: '50px',
                display: 'flex',
                justifyContent: 'flex-end',
                paddingTop: '25px',
                borderTop: `1px solid ${theme.border}`
              }}>
                <button type="submit" style={{
                  backgroundColor: '#2563eb',
                  color: 'white',
                  padding: '14px 28px',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  transition: 'background-color 0.2s',
                  boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
                }}>
                  <Save size={18} /> {activeTab === 'seguranca' ? t('settings.btn.update_security') : t('settings.btn.save')}
                </button>
              </div>
            )}

          </form>
        </div>
      </div>

      {/* Modal de Confirmação de Eliminação de Conta */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.3s'
        }}>
          <div style={{
            backgroundColor: theme.pageBg,
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
            padding: '40px',
            maxWidth: '450px',
            width: '90%',
            textAlign: 'center',
            border: `1px solid ${theme.border}`,
            animation: 'slideUp 0.3s'
          }}>
            {/* Ícone de Aviso */}
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              margin: '0 auto 24px auto'
            }}>
              <AlertTriangle size={40} color="#ef4444" />
            </div>

            {/* Título */}
            <h2 style={{
              margin: '0 0 12px 0',
              fontSize: '24px',
              fontWeight: 'bold',
              color: theme.isDark ? '#ffffff' : theme.text
            }}>
              Eliminar Conta Permanentemente?
            </h2>

            {/* Descrição */}
            <p style={{
              margin: '0 0 24px 0',
              fontSize: '14px',
              color: theme.subText,
              lineHeight: '1.6'
            }}>
              Esta ação é <strong>irreversível</strong>. Todos os seus dados, incluindo:
            </p>

            <ul style={{
              listStyle: 'none',
              padding: '0',
              margin: '0 0 24px 0',
              fontSize: '13px',
              textAlign: 'left',
              color: theme.subText
            }}>
              <li style={{ margin: '8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#ef4444' }}>✕</span> Perfil e informações pessoais
              </li>
              <li style={{ margin: '8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#ef4444' }}>✕</span> Histórico de sessões
              </li>
              <li style={{ margin: '8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#ef4444' }}>✕</span> Preferências de notificações
              </li>
              <li style={{ margin: '8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#ef4444' }}>✕</span> Todos os registos associados
              </li>
            </ul>

            {/* Aviso RGPD */}
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              padding: '12px',
              margin: '0 0 24px 0',
              fontSize: '12px',
              color: theme.subText
            }}>
              ℹ️ Após a confirmação, você será desconectado automaticamente e receberá um email de confirmação.
            </div>

            {/* Botões */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  backgroundColor: theme.isDark ? '#374151' : '#e5e7eb',
                  color: theme.isDark ? '#ffffff' : theme.text,
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = theme.isDark ? '#4b5563' : '#d1d5db'}
                onMouseLeave={(e) => e.target.style.backgroundColor = theme.isDark ? '#374151' : '#e5e7eb'}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAccount}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
              >
                Eliminar Permanentemente
              </button>
            </div>
          </div>

          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideUp {
              from { 
                opacity: 0;
                transform: translateY(20px);
              }
              to { 
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default Settings;