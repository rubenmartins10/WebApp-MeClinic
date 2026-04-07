import React, { useState, useContext, useEffect } from 'react';
import {
  User, Building, Shield, Bell, Save, CheckCircle, XCircle, Smartphone, Moon, Sun, Globe, Clock, Key,
  Mail, Phone, MapPin, FileText, ShieldAlert, LogOut, Eye, EyeOff, AlertCircle, Lock, Download,
  Trash2, Activity, LogIn, AlertTriangle, Music, Zap, Wind, Sparkles, Play,
  Circle, Music2, Waves, Disc, Airplay, Repeat, TrendingUp, TrendingDown,
  BarChart2, Feather, Sunset, Sliders, Star, Droplets, Guitar, ChevronDown, Edit3,
  Monitor // eslint-disable-line no-unused-vars
} from 'lucide-react';
import jsPDF from 'jspdf';
import { ThemeContext } from '../contexts/ThemeContext';
import { LanguageContext } from '../contexts/LanguageContext';
import { useTimeFormat } from '../contexts/TimeFormatContext';
import { playNotificationSound, SOUND_OPTIONS } from '../utils/notificationSound';
import apiService from '../services/api';
import Assinatura from '../components/specialized/Assinatura';

const Settings = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { language, changeLanguage, t } = useContext(LanguageContext);
  const { timeFormat, setTimeFormat } = useTimeFormat();

  // Estado principal
  const [activeTab, setActiveTab] = useState('perfil');
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showPushModal, setShowPushModal] = useState(false);
  const [showLogoutAllModal, setShowLogoutAllModal] = useState(false);

  const user = (() => { try { return JSON.parse(localStorage.getItem('meclinic_user') || '{}'); } catch { return {}; } })();
  const isAdmin = user.role === 'ADMIN';

  // Estado do perfil
  const [perfilData, setPerfilData] = useState({
    nome: user.nome || '',
    email: user.email || '',
    telefone: user.telefone || '',
    cargo: user.role || 'Assistente',
    idioma: language,
    timeFormat: localStorage.getItem('meclinic_time_format') || '24h',
  });

  // Último login em tempo real
  const formatLoginTime = (isoStr) => {
    if (!isoStr) return 'N/A';
    const d = new Date(isoStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'agora mesmo';
    if (diffMins < 60) return `há ${diffMins} min`;
    if (diffHours < 24) return `há ${diffHours}h`;
    if (diffDays < 7) return `há ${diffDays} dias`;
    return d.toLocaleString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };
  const [ultimoLoginDisplay, setUltimoLoginDisplay] = useState(() => formatLoginTime(localStorage.getItem('meclinic_login_at')));
  useEffect(() => {
    const interval = setInterval(() => {
      setUltimoLoginDisplay(formatLoginTime(localStorage.getItem('meclinic_login_at')));
    }, 60000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const [soundOpen, setSoundOpen] = useState(false);

  // Estado de notificações — persiste em localStorage
  const [notificacoesData, setNotificacoesData] = useState(() => {
    try {
      const saved = localStorage.getItem('meclinic_notificacoes');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      stock: true,
      relatorios: true,
      consultas: false,
      marketing: false,
      email: true,
      sms: false,
      push: true,
      frequencia: 'imediato'
    };
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
  const [, setLoadingActivity] = useState(true);

  // Detecção de browser correta (Edge/Opera têm 'Chrome' no UA — verificar primeiro)
  const detectBrowser = (ua = navigator.userAgent) => {
    if (/Edg\//.test(ua))    return 'Microsoft Edge';
    if (/OPR\/|Opera/.test(ua)) return 'Opera';
    if (/Brave/.test(ua))   return 'Brave';
    if (/Chrome\//.test(ua)) return 'Google Chrome';
    if (/Firefox\//.test(ua)) return 'Firefox';
    if (/Safari\//.test(ua)) return 'Safari';
    return 'Browser';
  };

  const detectOS = (ua = navigator.userAgent) => {
    if (/Windows NT/.test(ua)) return 'Windows';
    if (/Mac OS X/.test(ua)) return 'macOS';
    if (/Linux/.test(ua)) return 'Linux';
    if (/Android/.test(ua)) return 'Android';
    if (/iPhone|iPad/.test(ua)) return 'iOS';
    return 'Desconhecido';
  };

  // Sessão atual — sempre visível independentemente do backend
  const currentSessionId = localStorage.getItem('meclinic_session_id');
  const currentSession = {
    id: 'current',
    session_id: currentSessionId,
    user: user.nome || 'Utilizador',
    role: user.role?.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'ASSISTENTE',
    device: detectBrowser(),
    os: detectOS(),
    location: 'Este dispositivo',
    lastActivity: new Date(),
    loginTime: new Date(localStorage.getItem('meclinic_login_at') || new Date()),
    status: 'active',
    really_active: true,
    current: true
  };

  // Buscar dados reais de atividade quando o componente carrega
  useEffect(() => {
    const fetchActivityData = async () => {
      try {
        const data = await apiService.get('/api/auth/activity');

        const formattedSessions = (data.activeSessions || []).map((session, index) => {
          const isCurrent = currentSessionId && session.session_id === currentSessionId;
          return {
            id: session.id || index,
            session_id: session.session_id,
            user: session.user_name || 'Utilizador',
            user_id: session.user_id,
            role: session.role === 'Admin' ? 'ADMIN' : 'ASSISTENTE',
            device: session.device_info || 'Browser',
            location: session.location || 'Desconhecido',
            lastActivity: new Date(session.last_activity),
            loginTime: new Date(session.login_time),
            status: session.really_active ? 'active' : 'inactive',
            really_active: !!session.really_active,
            is_active: session.is_active,
            current: isCurrent
          };
        });

        const formattedHistory = (data.loginHistory || []).map((login, index) => ({
          id: login.id || index,
          user: login.user_name || 'Utilizador',
          role: login.role === 'Admin' ? 'ADMIN' : 'ASSISTENTE',
          data: new Date(login.data),
          dataFormatada: new Date(login.data).toLocaleString('pt-PT'),
          localizacao: login.location || 'Desconhecido',
          dispositivo: login.device_info || 'Browser',
          status: login.status || 'success'
        }));

        // Garantir que a sessão atual aparece e está marcada como ativa
        const hasCurrentSession = formattedSessions.some(s => s.current);
        if (!hasCurrentSession) {
          setSessionsAtivas([currentSession, ...formattedSessions]);
        } else {
          setSessionsAtivas(formattedSessions);
        }
        setLoginHistory(formattedHistory);
      } catch (err) {
        setSessionsAtivas([currentSession]);
        setLoginHistory([]);
      } finally {
        setLoadingActivity(false);
      }
    };

    fetchActivityData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  // Heartbeat — manter sessão actual como "ativa" a cada 2 minutos
  useEffect(() => {
    const sessionId = localStorage.getItem('meclinic_session_id');
    if (!sessionId) return;

    const sendHeartbeat = () => {
      apiService.post('/api/auth/heartbeat', { sessionId }).catch(() => {});
    };

    // Enviar heartbeat imediatamente e depois a cada 2 minutos
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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

    if (activeTab === 'notificacoes') {
      localStorage.setItem('meclinic_notificacoes', JSON.stringify(notificacoesData));
      showNotif('success', 'Preferências de notificações guardadas com sucesso.');
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
      setTimeFormat(perfilData.timeFormat || timeFormat);
    }

    if (activeTab === 'perfil' && isAdmin) {
      if (perfilData.telefone && !/^(\+351)?9[1236]\d{7}$/.test(perfilData.telefone.replace(/\s/g, ''))) {
        showNotif('error', 'Número de telemóvel inválido.');
        return;
      }
      if (!perfilData.nome || !perfilData.nome.trim()) {
        showNotif('error', 'O nome não pode estar vazio.');
        return;
      }
      const changed = perfilData.nome !== (user.nome || '') ||
                      perfilData.email !== (user.email || '') ||
                      perfilData.telefone !== (user.telefone || '');
      if (changed) {
        try {
          await apiService.put(`/api/utilizadores/${user.id}`, {
            nome: perfilData.nome,
            email: perfilData.email,
            telefone: perfilData.telefone
          });
          const updatedUser = { ...user, nome: perfilData.nome, email: perfilData.email, telefone: perfilData.telefone };
          localStorage.setItem('meclinic_user', JSON.stringify(updatedUser));
        } catch {
          showNotif('error', t('settings.alert.server_error'));
          return;
        }
      }
    }

    showNotif('success', t('settings.alert.success'));
  };

  const handleLogoutAllSessions = () => {
    setShowLogoutAllModal(true);
  };

  const confirmarLogoutAll = async () => {
    setShowLogoutAllModal(false);
    try {
      const mySessionId = localStorage.getItem('meclinic_session_id');
      await apiService.post('/api/auth/terminate-all-sessions', { exceptSessionId: mySessionId });
      // Atualizar lista: manter apenas a sessão atual
      setSessionsAtivas(prev => prev.filter(s => s.current));
      showNotif('success', 'Todos os dispositivos foram desconectados.');
    } catch {
      showNotif('error', 'Erro ao terminar sessões.');
    }
  };

  const handleLogoutSingleSession = async (session) => {
    // Sessão atual — faz logout do próprio utilizador
    if (session.current) {
      try {
        const sessionId = localStorage.getItem('meclinic_session_id');
        await apiService.post('/api/auth/logout', { sessionId });
      } catch { /* ignorar */ }
      localStorage.removeItem('meclinic_user');
      localStorage.removeItem('token');
      localStorage.removeItem('meclinic_login_at');
      localStorage.removeItem('meclinic_session_id');
      window.location.href = '/';
    } else {
      // Terminar sessão remota via API
      try {
        await apiService.post('/api/auth/terminate-session', { sessionId: session.session_id });
        setSessionsAtivas(prev => prev.filter(s => s.session_id !== session.session_id));
        showNotif('success', `Sessão de "${session.user}" terminada.`);
      } catch {
        showNotif('error', 'Erro ao terminar sessão.');
      }
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
        // Show our beautiful modal first
        setShowPushModal(true);
        return;
      }
    }
    setNotificacoesData(prev => ({ ...prev, [channelKey]: !prev[channelKey] }));
  };

  const confirmPushPermission = async () => {
    setShowPushModal(false);
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        showNotif('error', 'Permissão de notificações recusada.');
        return;
      }
    }
    setNotificacoesData(prev => ({ ...prev, push: true }));
    new Notification('MeClinic — Notificações Ativas', {
      body: 'Receberá alertas de stock baixo, lembretes de consultas e relatórios semanais.',
      icon: '/logo192.png'
    });
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
      
      const idiomaLabel = perfilData.idioma === 'pt' ? 'Português' : perfilData.idioma === 'en' ? 'English' : perfilData.idioma;

      const profileData = [
        ['Nome:', perfilData.nome],
        ['Email:', perfilData.email],
        ['Cargo:', perfilData.cargo],
        ['Idioma:', idiomaLabel],
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
        doc.text(String(value || '-'), 90, yPos);
        
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
        const statusColor = value === 'Ativado' ? [59, 130, 246] : value === 'Desativado' ? [239, 68, 68] : [107, 114, 128];
        doc.setTextColor(...statusColor);
        doc.text(String(value || '-'), 90, yPos);
        
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
          doc.text(String(value || '-'), 90, yPos);
          
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
    // Nova confirmação via modal input: require exact phrase
    if (deleteLoading) return;
    if (deleteConfirmText.trim().toUpperCase() !== 'CONFIRMAR_ELIMINACAO') {
      showNotif('error', 'Por favor escreva CONFIRMAR_ELIMINACAO para confirmar.');
      return;
    }

    // Simular chamada ao backend (substituir por API real quando disponível)
    (async () => {
      try {
        setDeleteLoading(true);
        showNotif('warning', 'Conta em processo de eliminação...');
        // Se existir endpoint de eliminação, descomente e use:
        // await apiService.delete(`/api/utilizadores/${user.id}`);
        setTimeout(() => {
          localStorage.removeItem('meclinic_user');
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('meclinic_session_id');
          localStorage.removeItem('meclinic_login_at');
          window.location.href = '/login';
        }, 1200);
      } catch (err) {
        console.error(err);
        showNotif('error', 'Erro ao eliminar conta.');
        setDeleteLoading(false);
      }
    })();
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

      {/* Modal de permissão push — substitui o popup feio do browser */}
      {showLogoutAllModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, backdropFilter: 'blur(6px)',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{
            width: '420px', borderRadius: '20px',
            background: theme.isDark ? '#0f172a' : '#ffffff',
            border: `1px solid ${theme.isDark ? 'rgba(239,68,68,0.3)' : '#e2e8f0'}`,
            boxShadow: '0 32px 64px rgba(0,0,0,0.4)',
            overflow: 'hidden',
            animation: 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)'
          }}>
            <div style={{ height: '4px', background: 'linear-gradient(90deg, #ef4444, #f97316)' }} />
            <div style={{ padding: '32px' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '16px', margin: '0 auto 20px',
                background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(249,115,22,0.15))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(239,68,68,0.2)'
              }}>
                <LogOut size={28} color="#ef4444" />
              </div>
              <h3 style={{ margin: '0 0 10px 0', textAlign: 'center', fontSize: '20px', fontWeight: '700', color: theme.isDark ? '#ffffff' : theme.text }}>
                Desconectar todos os dispositivos
              </h3>
              <p style={{ margin: '0 0 28px 0', textAlign: 'center', color: theme.subText, fontSize: '14px', lineHeight: '1.6' }}>
                Todos os dispositivos onde tem sessão ativa serão desconectados. Terá de fazer login novamente neste dispositivo.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setShowLogoutAllModal(false)}
                  style={{ flex: 1, padding: '13px', borderRadius: '10px', border: `1px solid ${theme.border}`, background: 'transparent', color: theme.text, fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarLogoutAll}
                  style={{ flex: 1, padding: '13px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #ef4444, #f97316)', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Desconectar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de permissão push — substitui o popup feio do browser */}
      {showPushModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, backdropFilter: 'blur(6px)',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{
            width: '420px', borderRadius: '20px',
            background: theme.isDark ? '#0f172a' : '#ffffff',
            border: `1px solid ${theme.isDark ? 'rgba(37,99,235,0.3)' : '#e2e8f0'}`,
            boxShadow: '0 32px 64px rgba(0,0,0,0.4)',
            overflow: 'hidden',
            animation: 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)'
          }}>
            {/* Gradient top bar */}
            <div style={{ height: '4px', background: 'linear-gradient(90deg, #2563eb, #6366f1, #8b5cf6)' }} />

            <div style={{ padding: '32px' }}>
              {/* Icon */}
              <div style={{
                width: '64px', height: '64px', borderRadius: '16px', margin: '0 auto 20px',
                background: 'linear-gradient(135deg, rgba(37,99,235,0.15), rgba(99,102,241,0.15))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(37,99,235,0.2)'
              }}>
                <Bell size={28} color="#3b82f6" />
              </div>

              {/* Title */}
              <h2 style={{ textAlign: 'center', color: theme.isDark ? '#f1f5f9' : '#0f172a', fontSize: '20px', fontWeight: '800', margin: '0 0 8px' }}>
                Ativar Notificações
              </h2>
              <p style={{ textAlign: 'center', color: theme.subText, fontSize: '14px', margin: '0 0 24px', lineHeight: '1.6' }}>
                O MeClinic vai enviar alertas directamente para este dispositivo.
              </p>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setShowPushModal(false)}
                  style={{
                    flex: 1, padding: '12px', borderRadius: '10px', border: `1px solid ${theme.border}`,
                    background: 'transparent', color: theme.subText, cursor: 'pointer', fontWeight: '600', fontSize: '14px'
                  }}
                >
                  Agora não
                </button>
                <button
                  onClick={confirmPushPermission}
                  style={{
                    flex: 2, padding: '12px', borderRadius: '10px', border: 'none',
                    background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                    color: 'white', cursor: 'pointer', fontWeight: '700', fontSize: '14px',
                    boxShadow: '0 4px 12px rgba(37,99,235,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}
                >
                  <Bell size={16} /> Permitir Notificações
                </button>
              </div>

              <p style={{ textAlign: 'center', fontSize: '11px', color: theme.subText, marginTop: '16px', marginBottom: 0 }}>
                Podes desativar a qualquer momento nas definições do browser.
              </p>
            </div>
          </div>
        </div>
      )}

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
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px 0', color: theme.isDark ? '#ffffff' : theme.text }}>
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
          <button onClick={() => setActiveTab('assinatura')} style={tabStyle(activeTab === 'assinatura')}>
            <Edit3 size={18} /> {t('settings.tab.signature')}
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
                      <div>Último login: <strong>{ultimoLoginDisplay}</strong></div>
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
                          style={{ ...inputStyle, paddingLeft: '45px', ...(!isAdmin ? { opacity: 0.7, cursor: 'not-allowed' } : {}) }}
                          value={perfilData.nome}
                          onChange={isAdmin ? e => setPerfilData({ ...perfilData, nome: e.target.value }) : undefined}
                          readOnly={!isAdmin}
                          disabled={!isAdmin}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>{t('settings.profile.email')}</label>
                      <div style={{ position: 'relative' }}>
                        <Mail size={18} color={theme.subText} style={{ position: 'absolute', left: '15px', top: '22px' }} />
                        <input
                          type="email"
                          style={{ ...inputStyle, paddingLeft: '45px', ...(!isAdmin ? { opacity: 0.7, cursor: 'not-allowed' } : {}) }}
                          value={perfilData.email}
                          onChange={isAdmin ? e => setPerfilData({ ...perfilData, email: e.target.value }) : undefined}
                          readOnly={!isAdmin}
                          disabled={!isAdmin}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Telemóvel</label>
                      <div style={{ position: 'relative' }}>
                        <Phone size={18} color={isAdmin && perfilData.telefone && !/^(\+351)?9[1236]\d{7}$/.test(perfilData.telefone.replace(/\s/g, '')) ? '#ef4444' : theme.subText} style={{ position: 'absolute', left: '15px', top: '22px' }} />
                        <input
                          type="tel"
                          placeholder={isAdmin ? '+351 9XX XXX XXX' : '—'}
                          style={{ ...inputStyle, paddingLeft: '45px', ...(!isAdmin ? { opacity: 0.7, cursor: 'not-allowed' } : {}), ...(isAdmin && perfilData.telefone && !/^(\+351)?9[1236]\d{7}$/.test(perfilData.telefone.replace(/\s/g, '')) ? { borderColor: '#ef4444' } : {}) }}
                          value={perfilData.telefone}
                          onChange={isAdmin ? e => setPerfilData({ ...perfilData, telefone: e.target.value }) : undefined}
                          readOnly={!isAdmin}
                          disabled={!isAdmin}
                        />
                        {isAdmin && perfilData.telefone && !/^(\+351)?9[1236]\d{7}$/.test(perfilData.telefone.replace(/\s/g, '')) && (
                          <span style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', display: 'block' }}>
                            Número inválido. Ex: +351 912 345 678
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {!isAdmin && (
                  <div style={{ padding: '15px 20px', backgroundColor: 'rgba(251, 146, 60, 0.1)', borderRadius: '8px', border: '1px solid rgba(251, 146, 60, 0.3)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <AlertCircle size={18} color="#f97316" />
                    <span style={{ fontSize: '13px', color: '#ea580c' }}>
                      {t('settings.profile.contact_admin')}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* TAB ASSINATURA DIGITAL */}
            {activeTab === 'assinatura' && (
              <div style={{ animation: 'fadeIn 0.3s' }}>
                <h2 style={{ margin: '0 0 8px 0', borderBottom: `1px solid ${theme.border}`, paddingBottom: '15px', color: theme.isDark ? '#ffffff' : theme.text }}>
                  {t('settings.signature.title')}
                </h2>
                <p style={{ margin: '0 0 28px 0', color: theme.subText, fontSize: '14px' }}>
                  {t('settings.signature.subtitle')}
                </p>
                <div style={{ maxWidth: '520px' }}>
                  <Assinatura onSaveSignature={() => {}} onNotification={(msg, type) => setNotification({ show: true, message: msg, type: type || 'success' })} />
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
                      }}
                        value={perfilData.timeFormat}
                        onChange={e => {
                          setPerfilData({ ...perfilData, timeFormat: e.target.value });
                          setTimeFormat(e.target.value);
                        }}
                      >
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
                    { key: 'sms', label: 'WhatsApp', icon: Smartphone },
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

                {/* Sound selector */}
                {(() => {
                  const ICON_MAP = {
                    Bell, Music, Wind, Zap, Sparkles, Circle, Music2, AlertCircle, Key,
                    Waves, Disc, Airplay, Activity, Repeat, TrendingUp, TrendingDown,
                    BarChart2, Feather, Sunset, Sliders, Star, Droplets, Guitar,
                  };
                  const currentSoundId = localStorage.getItem('meclinic_notification_sound') || 'plim';
                  const currentSound = SOUND_OPTIONS.find(s => s.id === currentSoundId) || SOUND_OPTIONS[0];
                  const CurrentIcon = ICON_MAP[currentSound.Icon] || Bell;
                  return (
                    <div style={{ marginTop: '20px', borderRadius: '12px', border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
                      {/* Collapsed header — always visible */}
                      <button
                        type="button"
                        onClick={() => setSoundOpen(o => !o)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: '14px',
                          padding: '13px 18px', border: 'none', cursor: 'pointer',
                          backgroundColor: theme.pageBg, textAlign: 'left',
                          borderBottom: soundOpen ? `1px solid ${theme.border}` : 'none',
                          transition: 'background-color 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = theme.pageBg; }}
                      >
                        <div style={{
                          width: '34px', height: '34px', borderRadius: '9px', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          backgroundColor: 'rgba(37,99,235,0.15)',
                        }}>
                          <CurrentIcon size={15} color="#3b82f6" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '12px', fontWeight: '700', color: theme.subText, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Som de Notificação</div>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: theme.text, marginTop: '1px' }}>{currentSound.label}</div>
                        </div>
                        <ChevronDown size={16} color={theme.subText} style={{ flexShrink: 0, transform: soundOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                      </button>
                      {/* Expandable list */}
                      {soundOpen && SOUND_OPTIONS.map((s, i, arr) => {
                        const selected = currentSoundId === s.id;
                        const IconComp = ICON_MAP[s.Icon] || Bell;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              localStorage.setItem('meclinic_notification_sound', s.id);
                              playNotificationSound(s.id);
                              setNotificacoesData(prev => ({ ...prev }));
                              setSoundOpen(false);
                            }}
                            style={{
                              width: '100%', display: 'flex', alignItems: 'center', gap: '14px',
                              padding: '13px 18px', border: 'none', cursor: 'pointer',
                              borderBottom: i < arr.length - 1 ? `1px solid ${theme.border}` : 'none',
                              backgroundColor: selected
                                ? (theme.isDark ? 'rgba(37,99,235,0.1)' : 'rgba(37,99,235,0.06)')
                                : 'transparent',
                              borderLeft: `3px solid ${selected ? '#2563eb' : 'transparent'}`,
                              transition: 'all 0.15s', textAlign: 'left',
                            }}
                            onMouseEnter={e => { if (!selected) e.currentTarget.style.backgroundColor = theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'; }}
                            onMouseLeave={e => { if (!selected) e.currentTarget.style.backgroundColor = 'transparent'; }}
                          >
                            <div style={{
                              width: '34px', height: '34px', borderRadius: '9px', flexShrink: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              backgroundColor: selected ? 'rgba(37,99,235,0.15)' : (theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
                            }}>
                              <IconComp size={15} color={selected ? '#3b82f6' : theme.subText} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '13px', fontWeight: '600', color: selected ? (theme.isDark ? '#e2e8f0' : theme.text) : theme.text }}>{s.label}</div>
                              <div style={{ fontSize: '11px', color: theme.subText, marginTop: '1px' }}>{s.desc}</div>
                            </div>
                            <div style={{
                              width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              backgroundColor: selected ? '#2563eb' : 'transparent',
                              border: selected ? 'none' : `1px solid ${theme.border}`,
                              transition: 'all 0.15s',
                            }}>
                              {selected
                                ? <CheckCircle size={14} color="white" />
                                : <Play size={11} color={theme.subText} style={{ marginLeft: '1px' }} />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
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
                <h2 style={{ margin: '0 0 8px 0', borderBottom: `1px solid ${theme.border}`, paddingBottom: '15px', color: theme.isDark ? '#ffffff' : theme.text }}>
                  Atividade da Conta
                </h2>
                <p style={{ margin: '0 0 28px 0', color: theme.subText, fontSize: '14px' }}>
                  Monitorize os acessos e sessões ativas da tua conta.
                </p>

                {/* ── Sessões ── */}
                <div style={{ marginBottom: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 0 3px rgba(16,185,129,0.2)' }} />
                    <span style={{ fontSize: '12px', fontWeight: '800', color: theme.subText, textTransform: 'uppercase', letterSpacing: '1px' }}>Sessões</span>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', padding: '2px 10px', borderRadius: '20px' }}>
                      {sessionsAtivas.filter(s => s.really_active || s.current).length} ativa{sessionsAtivas.filter(s => s.really_active || s.current).length !== 1 ? 's' : ''}
                    </span>
                    <span style={{ fontSize: '11px', color: theme.subText }}>
                      / {sessionsAtivas.length} total
                    </span>
                    {sessionsAtivas.length > 1 && isAdmin && (
                      <button
                        onClick={handleLogoutAllSessions}
                        style={{ marginLeft: 'auto', padding: '5px 14px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.07)', color: '#ef4444', cursor: 'pointer', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}
                        onMouseEnter={e => Object.assign(e.currentTarget.style, { background: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.5)' })}
                        onMouseLeave={e => Object.assign(e.currentTarget.style, { background: 'rgba(239,68,68,0.07)', borderColor: 'rgba(239,68,68,0.3)' })}
                      >
                        <LogOut size={11} /> Terminar todas
                      </button>
                    )}
                  </div>

                  {sessionsAtivas.map((session) => {
                    const loginDate = session.loginTime instanceof Date ? session.loginTime : new Date(session.loginTime);
                    const isAdmin_ = session.role === 'ADMIN';
                    const isReallyActive = session.really_active || session.current;
                    const dotColor = isReallyActive ? '#10b981' : '#ef4444';
                    return (
                      <div key={session.id} style={{
                        display: 'flex', alignItems: 'center', gap: '18px',
                        padding: '20px 22px',
                        background: session.current
                          ? (theme.isDark ? 'linear-gradient(135deg, rgba(37,99,235,0.12), rgba(37,99,235,0.05))' : 'rgba(37,99,235,0.04)')
                          : theme.pageBg,
                        borderRadius: '16px',
                        border: `1px solid ${session.current ? 'rgba(37,99,235,0.25)' : theme.border}`,
                        marginBottom: '10px',
                        boxShadow: session.current ? '0 4px 20px rgba(37,99,235,0.08)' : 'none',
                        transition: 'all 0.2s',
                        opacity: isReallyActive ? 1 : 0.7
                      }}>
                        {/* Avatar */}
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <div style={{
                            width: '48px', height: '48px', borderRadius: '14px',
                            background: isAdmin_
                              ? 'linear-gradient(135deg, #6d28d9, #8b5cf6)'
                              : 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontWeight: '800', fontSize: '18px',
                            boxShadow: isAdmin_
                              ? '0 4px 12px rgba(139,92,246,0.35)'
                              : '0 4px 12px rgba(59,130,246,0.35)'
                          }}>
                            {session.user.charAt(0).toUpperCase()}
                          </div>
                          <div style={{
                            position: 'absolute', bottom: '-3px', right: '-3px',
                            width: '13px', height: '13px', borderRadius: '50%',
                            backgroundColor: dotColor, border: `2px solid ${theme.cardBg}`,
                            boxShadow: isReallyActive ? '0 0 0 2px rgba(16,185,129,0.3)' : '0 0 0 2px rgba(239,68,68,0.3)'
                          }} />
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: '700', fontSize: '15px', color: theme.isDark ? '#f1f5f9' : theme.text }}>
                              {session.user}
                            </span>
                            {session.current && (
                              <span style={{ fontSize: '10px', fontWeight: '800', padding: '3px 9px', borderRadius: '20px', background: 'linear-gradient(135deg, #2563eb, #3b82f6)', color: 'white', letterSpacing: '0.5px' }}>
                                ESTE DISPOSITIVO
                              </span>
                            )}
                            <span style={{
                              fontSize: '10px', fontWeight: '700', padding: '3px 9px', borderRadius: '20px',
                              background: isAdmin_ ? 'rgba(139,92,246,0.12)' : 'rgba(59,130,246,0.12)',
                              color: isAdmin_ ? '#a78bfa' : '#60a5fa',
                              border: `1px solid ${isAdmin_ ? 'rgba(139,92,246,0.25)' : 'rgba(59,130,246,0.25)'}`
                            }}>
                              {isAdmin_ ? 'Admin' : 'Assistente'}
                            </span>
                            {!isReallyActive && (
                              <span style={{ fontSize: '10px', fontWeight: '700', padding: '3px 9px', borderRadius: '20px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}>
                                Inativa
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: theme.subText }}>
                              <Monitor size={13} /> {session.device}{session.os ? ` · ${session.os}` : ''}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: theme.subText }}>
                              <MapPin size={13} /> {session.location}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: theme.subText }}>
                              <Clock size={13} /> Login: {loginDate.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                              {' · '}
                              {loginDate.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
                            </span>
                          </div>
                        </div>

                        {/* Desconectar — admin pode terminar qualquer sessão; utilizador só a sua */}
                        {(session.current || isAdmin) && (
                          <button onClick={() => handleLogoutSingleSession(session)} style={{
                            flexShrink: 0, padding: '8px 16px', borderRadius: '10px',
                            border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)',
                            color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: '700',
                            display: 'flex', alignItems: 'center', gap: '6px',
                            transition: 'all 0.2s', whiteSpace: 'nowrap'
                          }}
                          onMouseEnter={e => Object.assign(e.currentTarget.style, { background: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.5)' })}
                          onMouseLeave={e => Object.assign(e.currentTarget.style, { background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.3)' })}
                          >
                            <LogOut size={13} /> Terminar sessão
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* ── Histórico de Logins ── */}
                <div style={{ height: '1px', background: theme.border, marginBottom: '28px' }} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <LogIn size={15} color={theme.subText} />
                    <span style={{ fontSize: '12px', fontWeight: '800', color: theme.subText, textTransform: 'uppercase', letterSpacing: '1px' }}>Histórico de Logins</span>
                    <span style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: '700', color: theme.subText, background: theme.pageBg, border: `1px solid ${theme.border}`, padding: '2px 10px', borderRadius: '20px' }}>
                      {loginHistory.length}
                    </span>
                  </div>

                  {loginHistory.length === 0 ? (
                    <div style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      padding: '48px 20px', borderRadius: '16px',
                      border: `1px dashed ${theme.border}`, color: theme.subText, gap: '12px',
                      background: theme.pageBg
                    }}>
                      <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: theme.cardBg, border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Activity size={26} color={theme.subText} style={{ opacity: 0.4 }} />
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: theme.isDark ? '#94a3b8' : theme.subText }}>Sem histórico registado</span>
                      <span style={{ fontSize: '12px', textAlign: 'center', maxWidth: '260px', lineHeight: '1.6' }}>
                        Os próximos logins serão registados aqui com data, dispositivo e localização.
                      </span>
                    </div>
                  ) : (
                    loginHistory.map((login) => {
                      const loginDate = login.data instanceof Date ? login.data : new Date(login.data);
                      const now = new Date();
                      const diffMs = now - loginDate;
                      const diffDays = Math.floor(diffMs / 86400000);
                      const diffHours = Math.floor(diffMs / 3600000);
                      const timeAgo = diffDays > 0
                        ? `há ${diffDays} dia${diffDays > 1 ? 's' : ''}`
                        : diffHours > 0
                          ? `há ${diffHours}h`
                          : 'hoje';
                      return (
                        <div key={login.id} style={{
                          display: 'flex', alignItems: 'center', gap: '16px',
                          padding: '16px 20px', borderRadius: '14px',
                          border: `1px solid ${theme.border}`, background: theme.pageBg,
                          marginBottom: '8px', transition: 'border-color 0.2s'
                        }}>
                          <div style={{
                            width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
                            background: 'rgba(37,99,235,0.1)',
                            border: '1px solid rgba(37,99,235,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            <LogIn size={19} color="#3b82f6" />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                              <span style={{ fontWeight: '700', fontSize: '13px', color: theme.isDark ? '#f1f5f9' : theme.text }}>
                                {login.user}
                              </span>
                              <span style={{
                                fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px',
                                background: login.role === 'ADMIN' ? 'rgba(139,92,246,0.1)' : 'rgba(59,130,246,0.1)',
                                color: login.role === 'ADMIN' ? '#a78bfa' : '#60a5fa',
                                border: `1px solid ${login.role === 'ADMIN' ? 'rgba(139,92,246,0.25)' : 'rgba(59,130,246,0.25)'}`
                              }}>
                                {login.role === 'ADMIN' ? 'Admin' : 'Assistente'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: theme.subText }}>
                                <Monitor size={11} /> {login.dispositivo}
                              </span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: theme.subText }}>
                                <MapPin size={11} /> {login.localizacao}
                              </span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: theme.subText }}>
                                <Clock size={11} /> {timeAgo}
                              </span>
                            </div>
                          </div>
                          <div style={{ fontSize: '11px', color: theme.subText, textAlign: 'right', flexShrink: 0, lineHeight: '1.5' }}>
                            {loginDate.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })}<br/>
                            <span style={{ fontWeight: '700' }}>{loginDate.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
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
              from { opacity: 0; transform: translateY(6px); }
              to   { opacity: 1; transform: translateY(0); }
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