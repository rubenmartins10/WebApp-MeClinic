import React, { createContext, useContext, useState } from 'react';

export const TimeFormatContext = createContext();

export const TimeFormatProvider = ({ children }) => {
  const [timeFormat, setTimeFormatState] = useState(() => {
    return localStorage.getItem('meclinic_time_format') || '24h';
  });

  const setTimeFormat = (fmt) => {
    localStorage.setItem('meclinic_time_format', fmt);
    setTimeFormatState(fmt);
  };

  /**
   * Converte uma string "HH:MM" ou "HH:MM:SS" para o formato ativo.
   * Devolve sempre string — ex: "14:30" ou "02:30 PM"
   */
  const formatTime = (timeStr) => {
    if (!timeStr) return '—';
    const clean = String(timeStr).substring(0, 5); // "14:30"
    if (timeFormat === '24h') return clean;

    const [hStr, mStr] = clean.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr || '00';
    const period = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${String(h).padStart(2, '0')}:${m} ${period}`;
  };

  return (
    <TimeFormatContext.Provider value={{ timeFormat, setTimeFormat, formatTime }}>
      {children}
    </TimeFormatContext.Provider>
  );
};

export const useTimeFormat = () => useContext(TimeFormatContext);
