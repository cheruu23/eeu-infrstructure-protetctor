import { useState, useEffect, useCallback, createContext, useContext } from 'react';

const ToastContext = createContext(null);

// EEU brand colors
// success  → EEU green  #2e7d32
// error    → red        #c62828
// info     → EEU orange #F5A623
// warning  → amber      #e65100

const CONFIG = {
  success: {
    bg: '#2e7d32',
    accent: '#F5A623',          // orange accent bar on left
    label: 'Success',
  },
  error: {
    bg: '#c62828',
    accent: '#ffcdd2',
    label: 'Error',
  },
  info: {
    bg: '#1b5e20',              // deep EEU green
    accent: '#F5A623',
    label: 'Info',
  },
  warning: {
    bg: '#e65100',
    accent: '#fff9c4',
    label: 'Warning',
  },
};

const DURATION = 4000;

// Checkmark SVG
const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="9" r="9" fill="rgba(255,255,255,0.18)" />
    <path d="M4.5 9.5l3 3 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const CrossIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="9" r="9" fill="rgba(255,255,255,0.18)" />
    <path d="M6 6l6 6M12 6l-6 6" stroke="white" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const InfoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="9" r="9" fill="rgba(255,255,255,0.18)" />
    <path d="M9 8v5M9 6v.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const WarnIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="9" r="9" fill="rgba(255,255,255,0.18)" />
    <path d="M9 5v5M9 12v.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const ICON = { success: <CheckIcon />, error: <CrossIcon />, info: <InfoIcon />, warning: <WarnIcon /> };

function ToastItem({ id, message, type = 'success', onRemove }) {
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
    }, 30);
    const t2 = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(id), 320);
    }, DURATION);
    return () => { clearTimeout(t1); clearTimeout(t2); clearInterval(iv); };
  }, [id, onRemove]);

  const dismiss = () => { setVisible(false); setTimeout(() => onRemove(id), 320); };

  return (
    <div
      onClick={dismiss}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'stretch',
        minWidth: 290,
        maxWidth: 360,
        borderRadius: 12,
        overflow: 'hidden',
        background: cfg.bg,
        boxShadow: '0 10px 40px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.14)',
        cursor: 'pointer',
        transform: visible ? 'translateX(0) scale(1)' : 'translateX(115%) scale(0.92)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.38s cubic-bezier(0.34,1.56,0.64,1), opacity 0.28s ease',
      }}
    >
      {/* Left accent stripe */}
      <div style={{
        width: 5,
        background: cfg.accent,
        flexShrink: 0,
      }} />

      {/* EEU logo watermark */}
      <div style={{
        position: 'absolute',
        right: 40,
        top: '50%',
        transform: 'translateY(-50%)',
        opacity: 0.07,
        pointerEvents: 'none',
      }}>
        <img src="/eeu-logo.png" alt="" style={{ height: 48, filter: 'brightness(0) invert(1)' }} />
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: '12px 14px 10px', display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
        {/* Top row: icon + label + close */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ flexShrink: 0 }}>{ICON[type]}</span>
          <span style={{ color: cfg.accent, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', flex: 1 }}>
            {cfg.label}
          </span>
          <button
            onClick={e => { e.stopPropagation(); dismiss(); }}
            style={{
              background: 'rgba(255,255,255,0.12)', border: 'none', color: 'rgba(255,255,255,0.8)',
              width: 20, height: 20, borderRadius: 5, cursor: 'pointer', fontSize: '0.7rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >✕</button>
        </div>

        {/* Message */}
        <div style={{
          color: 'white',
          fontSize: '0.88rem',
          fontWeight: 500,
          lineHeight: 1.45,
          wordBreak: 'break-word',
          paddingLeft: 26,   // align under icon
        }}>
          {message}
        </div>

        {/* Progress bar */}
        <div style={{ height: 2, background: 'rgba(255,255,255,0.12)', borderRadius: 2, marginTop: 4 }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: cfg.accent,
            borderRadius: 2,
            transition: 'width 0.03s linear',
          }} />
        </div>
      </div>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div style={{
        position: 'fixed', top: 68, right: 14, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 10,
        pointerEvents: 'none',
      }}>
        {toasts.map(toast => (
          <div key={toast.id} style={{ pointerEvents: 'all' }}>
            <ToastItem id={toast.id} message={toast.message} type={toast.type} onRemove={remove} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
