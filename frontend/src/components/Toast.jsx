import { useState, useEffect, useCallback, createContext, useContext } from 'react';

const ToastContext = createContext(null);

const ICONS = {
  success: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="10" fill="rgba(255,255,255,0.2)" />
      <path d="M5.5 10.5l3 3 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  error: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="10" fill="rgba(255,255,255,0.2)" />
      <path d="M7 7l6 6M13 7l-6 6" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  info: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="10" fill="rgba(255,255,255,0.2)" />
      <path d="M10 9v5M10 7v.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  warning: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="10" fill="rgba(255,255,255,0.2)" />
      <path d="M10 6v5M10 13v.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
};

const STYLES = {
  success: {
    bg: 'linear-gradient(135deg, #2e7d32 0%, #43a047 100%)',
    border: 'rgba(255,255,255,0.15)',
    progress: 'rgba(255,255,255,0.4)',
  },
  error: {
    bg: 'linear-gradient(135deg, #c62828 0%, #e53935 100%)',
    border: 'rgba(255,255,255,0.15)',
    progress: 'rgba(255,255,255,0.4)',
  },
  info: {
    bg: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
    border: 'rgba(255,255,255,0.15)',
    progress: 'rgba(255,255,255,0.4)',
  },
  warning: {
    bg: 'linear-gradient(135deg, #e65100 0%, #F5A623 100%)',
    border: 'rgba(255,255,255,0.15)',
    progress: 'rgba(255,255,255,0.4)',
  },
};

const DURATION = 3800;

function ToastItem({ id, message, type = 'success', onRemove }) {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  const style = STYLES[type] || STYLES.success;

  useEffect(() => {
    // Trigger enter animation
    const enterTimer = setTimeout(() => setVisible(true), 10);

    // Progress bar countdown
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / DURATION) * 100);
      setProgress(remaining);
      if (remaining === 0) clearInterval(interval);
    }, 30);

    // Auto dismiss
    const dismissTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(id), 350);
    }, DURATION);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(dismissTimer);
      clearInterval(interval);
    };
  }, [id, onRemove]);

  return (
    <div
      onClick={() => { setVisible(false); setTimeout(() => onRemove(id), 350); }}
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: 14,
        padding: '14px 16px 10px',
        minWidth: 280,
        maxWidth: 360,
        boxShadow: '0 8px 32px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.12)',
        cursor: 'pointer',
        overflow: 'hidden',
        position: 'relative',
        transform: visible ? 'translateX(0) scale(1)' : 'translateX(110%) scale(0.95)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Content row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Icon */}
        <div style={{ flexShrink: 0, marginTop: 1 }}>
          {ICONS[type] || ICONS.success}
        </div>

        {/* Message */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            color: 'white',
            fontSize: '0.9rem',
            fontWeight: 600,
            lineHeight: 1.4,
            wordBreak: 'break-word',
          }}>
            {message}
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={e => { e.stopPropagation(); setVisible(false); setTimeout(() => onRemove(id), 350); }}
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: 'none',
            color: 'white',
            width: 22,
            height: 22,
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: -2,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
        >
          ✕
        </button>
      </div>

      {/* Progress bar */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        height: 3,
        width: `${progress}%`,
        background: style.progress,
        borderRadius: '0 0 0 14px',
        transition: 'width 0.03s linear',
      }} />
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

      {/* Toast stack — top right, stacks downward */}
      <div style={{
        position: 'fixed',
        top: 72,
        right: 16,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: 'all' }}>
            <ToastItem id={t.id} message={t.message} type={t.type} onRemove={remove} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
