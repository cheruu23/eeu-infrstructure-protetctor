import { useState, useEffect, useCallback, createContext, useContext } from 'react';

const ToastContext = createContext(null);

const DURATION = 4500;

const CONFIG = {
  success: {
    title:   'Success',
    color:   '#2e7d32',
    light:   '#e8f5e9',
    border:  '#a5d6a7',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="14" fill="#2e7d32"/>
        <path d="M7 14.5l5 5 9-9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  error: {
    title:   'Error',
    color:   '#c62828',
    light:   '#ffebee',
    border:  '#ef9a9a',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="14" fill="#c62828"/>
        <path d="M9 9l10 10M19 9L9 19" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  info: {
    title:   'Info',
    color:   '#1565c0',
    light:   '#e3f2fd',
    border:  '#90caf9',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="14" fill="#1565c0"/>
        <path d="M14 12v8M14 9v1" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  warning: {
    title:   'Warning',
    color:   '#e65100',
    light:   '#fff3e0',
    border:  '#ffcc80',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="14" fill="#F5A623"/>
        <path d="M14 8v8M14 19v1" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    ),
  },
};

function AlertPopup({ id, message, type, onRemove }) {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  const cfg = CONFIG[type] || CONFIG.success;

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 10);
    const start = Date.now();
    const iv = setInterval(() => {
      const pct = Math.max(0, 100 - ((Date.now() - start) / DURATION) * 100);
      setProgress(pct);
      if (pct === 0) clearInterval(iv);
    }, 40);
    const t2 = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(id), 300);
    }, DURATION);
    return () => { clearTimeout(t1); clearTimeout(t2); clearInterval(iv); };
  }, [id, onRemove]);

  const dismiss = () => {
    setVisible(false);
    setTimeout(() => onRemove(id), 300);
  };

  return (
    /* Backdrop overlay */
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.35)',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.25s ease',
      pointerEvents: visible ? 'all' : 'none',
      padding: 16,
    }}
      onClick={dismiss}
    >
      {/* Alert card */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: 18,
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 24px 64px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.88) translateY(24px)',
          transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {/* Top color bar */}
        <div style={{ height: 5, background: cfg.color }} />

        {/* Body */}
        <div style={{ padding: '24px 24px 20px' }}>

          {/* EEU logo + icon row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            {/* EEU logo small */}
            <img src="/eeu-logo.png" alt="EEU" style={{ height: 28, width: 'auto', objectFit: 'contain', opacity: 0.7 }} />
            {/* Type icon */}
            {cfg.icon}
          </div>

          {/* Title */}
          <div style={{
            fontSize: '1.05rem', fontWeight: 800, color: cfg.color,
            marginBottom: 8, letterSpacing: '-0.01em',
          }}>
            {cfg.title}
          </div>

          {/* Message */}
          <div style={{
            fontSize: '0.92rem', color: '#333', lineHeight: 1.55,
            marginBottom: 20,
          }}>
            {message}
          </div>

          {/* Dismiss button */}
          <button
            onClick={dismiss}
            style={{
              width: '100%',
              padding: '11px',
              background: cfg.color,
              color: 'white',
              border: 'none',
              borderRadius: 10,
              fontSize: '0.92rem',
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '0.02em',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            OK
          </button>
        </div>

        {/* Progress bar at bottom */}
        <div style={{ height: 3, background: '#f0f0f0' }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: cfg.color,
            opacity: 0.4,
            transition: 'width 0.04s linear',
          }} />
        </div>
      </div>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((message, type = 'success') => {
    // Only show one alert at a time — replace existing
    const id = Date.now() + Math.random();
    setToasts([{ id, message, type }]);
  }, []);

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toasts.map(t => (
        <AlertPopup key={t.id} id={t.id} message={t.message} type={t.type} onRemove={remove} />
      ))}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
