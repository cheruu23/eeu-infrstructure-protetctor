import { useState, useEffect, useCallback, createContext, useContext } from 'react';

const ToastContext = createContext(null);

const DURATION = 4000;

const CONFIG = {
  success: { title: 'Success', color: '#2e7d32', light: '#e8f5e9', border: '#a5d6a7' },
  error:   { title: 'Error',   color: '#c62828', light: '#ffebee', border: '#ef9a9a' },
  info:    { title: 'Info',    color: '#1565c0', light: '#e3f2fd', border: '#90caf9' },
  warning: { title: 'Warning', color: '#e65100', light: '#fff3e0', border: '#ffcc80' },
};

const ICONS = {
  success: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="11" fill="#2e7d32"/>
      <path d="M5.5 11.5l4 4 7-8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  error: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="11" fill="#c62828"/>
      <path d="M7 7l8 8M15 7l-8 8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  info: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="11" fill="#1565c0"/>
      <path d="M11 10v6M11 7.5v.5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  warning: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="11" fill="#e65100"/>
      <path d="M11 7v6M11 15v.5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
};

function ToastItem({ id, message, type, onRemove }) {
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

  const dismiss = () => { setVisible(false); setTimeout(() => onRemove(id), 300); };

  return (
    <div
      onClick={dismiss}
      style={{
        background: 'white',
        border: `1px solid ${cfg.border}`,
        borderLeft: `5px solid ${cfg.color}`,
        borderRadius: 12,
        padding: '14px 16px 10px',
        minWidth: 280,
        maxWidth: 380,
        boxShadow: '0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)',
        cursor: 'pointer',
        overflow: 'hidden',
        position: 'relative',
        transform: visible ? 'translateX(0) scale(1)' : 'translateX(110%) scale(0.95)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.28s ease',
        // CRITICAL: no pointer-events blocking — this is NOT a modal overlay
        pointerEvents: 'all',
      }}
    >
      {/* EEU logo watermark */}
      <div style={{ position: 'absolute', right: 36, top: '50%', transform: 'translateY(-50%)', opacity: 0.05, pointerEvents: 'none' }}>
        <img src="/eeu-logo.png" alt="" style={{ height: 44 }} />
      </div>

      {/* Content */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{ flexShrink: 0, marginTop: 1 }}>{ICONS[type] || ICONS.success}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
            {cfg.title}
          </div>
          <div style={{ fontSize: '0.88rem', color: '#333', lineHeight: 1.45, wordBreak: 'break-word' }}>
            {message}
          </div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); dismiss(); }}
          style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '1rem', flexShrink: 0, padding: '0 2px', lineHeight: 1 }}
        >✕</button>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: '#f0f0f0', borderRadius: 2, marginTop: 10 }}>
        <div style={{ height: '100%', width: `${progress}%`, background: cfg.color, borderRadius: 2, transition: 'width 0.04s linear' }} />
      </div>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev.slice(-2), { id, message, type }]);
  }, []);

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {/* Top-right stack — NO backdrop, NO pointer-events blocking */}
      <div style={{
        position: 'fixed',
        top: 68,
        right: 14,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        pointerEvents: 'none', // container doesn't block clicks
      }}>
        {toasts.map(t => (
          <ToastItem key={t.id} id={t.id} message={t.message} type={t.type} onRemove={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
