import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, X, Clock, User } from 'lucide-react';
import apiService from '../services/api';
import { useTimeFormat } from '../contexts/TimeFormatContext';
import { playNotificationSound } from '../utils/notificationSound';

const REMINDER_WINDOW_MIN = 15; // show reminder when < 15 min away
const TOAST_DURATION_S = 120;   // auto-dismiss after 120 seconds

// ─── Individual toast ────────────────────────────────────────────────────────
function ConsultaToast({ toast, onDismiss }) {
  const { formatTime } = useTimeFormat();
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      const pct = Math.max(0, 100 - (elapsed / TOAST_DURATION_S) * 100);
      setProgress(pct);
      if (pct === 0) { clearInterval(interval); onDismiss(); }
    }, 100);
    return () => clearInterval(interval);
  }, [onDismiss]);

  const c = toast.consulta;

  // Calculate exact minutes until appointment
  const now = new Date();
  const [h, m] = (c.hora_consulta || '00:00').split(':').map(Number);
  const appt = new Date(now);
  appt.setHours(h, m, 0, 0);
  const diffMin = Math.max(1, Math.ceil((appt - now) / 60000));

  return (
    <div style={{
      width: '390px',
      backgroundColor: '#0f172a',
      borderRadius: '14px',
      border: '1px solid rgba(37, 99, 235, 0.35)',
      borderLeft: '4px solid #2563eb',
      boxShadow: '0 24px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(37,99,235,0.08)',
      overflow: 'hidden',
      animation: 'meclinic-slide-in 0.35s cubic-bezier(0.34,1.56,0.64,1)',
    }}>
      {/* Body */}
      <div style={{ padding: '16px 16px 14px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Icon */}
            <div style={{
              width: '40px', height: '40px', borderRadius: '11px',
              background: 'linear-gradient(135deg, rgba(37,99,235,0.25), rgba(99,102,241,0.25))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Bell size={18} color="#60a5fa" />
            </div>
            {/* Label + Name */}
            <div>
              <div style={{ fontSize: '10px', fontWeight: '800', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Lembrete de Consulta
              </div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#f1f5f9', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <User size={13} color="#94a3b8" />
                {c.paciente_nome || c.nome_paciente || 'Paciente'}
              </div>
            </div>
          </div>
          {/* Close btn */}
          <button
            onClick={onDismiss}
            title="Fechar"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#475569', padding: '4px', borderRadius: '6px',
              display: 'flex', alignItems: 'center', transition: 'color 0.2s',
              lineHeight: 1
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#94a3b8'}
            onMouseLeave={e => e.currentTarget.style.color = '#475569'}
          >
            <X size={15} />
          </button>
        </div>

        {/* Procedure */}
        {(c.procedimento_nome || c.procedimento) && (
          <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '6px', paddingLeft: '56px' }}>
            {c.procedimento_nome || c.procedimento}
          </div>
        )}

        {/* Time */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          paddingLeft: '56px', color: '#fbbf24', fontSize: '13px', fontWeight: '700'
        }}>
          <Clock size={13} />
          <span>Às {formatTime(c.hora_consulta)} · em {diffMin} min</span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: '3px', backgroundColor: 'rgba(37, 99, 235, 0.15)' }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #2563eb, #6366f1)',
          transition: 'width 0.1s linear',
          borderRadius: '0 2px 2px 0'
        }} />
      </div>
    </div>
  );
}

// ─── Container ───────────────────────────────────────────────────────────────
export default function ConsultaReminders() {
  const [toasts, setToasts] = useState([]);
  const notifiedRef = useRef(new Set());

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const checkUpcoming = useCallback(async () => {
    // Check if enabled
    let prefs = {};
    try { prefs = JSON.parse(localStorage.getItem('meclinic_notificacoes') || '{}'); } catch {}
    if (!prefs.consultas) return;

    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await apiService.get(`/api/consultas?data=${today}&limit=500`);
      const list = Array.isArray(res) ? res : (res.consultas || res.data || []);

      const now = new Date();
      list.forEach(c => {
        if (!c.hora_consulta) return;
        if (c.status === 'Cancelada') return;

        const [h, min] = c.hora_consulta.split(':').map(Number);
        const appt = new Date(now);
        appt.setHours(h, min, 0, 0);
        const diffMin = (appt - now) / 60000;

        if (diffMin > 0 && diffMin <= REMINDER_WINDOW_MIN) {
          const key = `${c.id || c.consulta_id}-${c.hora_consulta}`;
          if (!notifiedRef.current.has(key)) {
            notifiedRef.current.add(key);
            setToasts(prev => [...prev, { id: `${key}-${Date.now()}`, consulta: c }]);
            playNotificationSound();
          }
        }
      });
    } catch {
      // fail silently — user is unaware
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    checkUpcoming();
    const interval = setInterval(checkUpcoming, 60_000);
    return () => clearInterval(interval);
  }, [checkUpcoming]);

  if (toasts.length === 0) return null;

  return (
    <>
      {/* Keyframe injected once */}
      <style>{`
        @keyframes meclinic-slide-in {
          from { opacity: 0; transform: translateX(120%) scale(0.9); }
          to   { opacity: 1; transform: translateX(0)     scale(1);   }
        }
      `}</style>

      <div style={{
        position: 'fixed',
        bottom: '28px',
        right: '28px',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: '10px',
        alignItems: 'flex-end',
        pointerEvents: 'none'
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: 'all' }}>
            <ConsultaToast toast={t} onDismiss={() => dismiss(t.id)} />
          </div>
        ))}
      </div>
    </>
  );
}
