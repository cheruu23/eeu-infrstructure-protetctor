import { useState, useEffect, createContext, useContext, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {/* Toast container */}
      <div style={{
        position: 'fixed', top: 80, right: 20, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 360
      }}>
        {toasts.map(t => (
          <div key={t.id} onClick={() => remove(t.id)} style={{
            background: t.type === 'success' ? '#2e7d32' : t.type === 'error' ? '#c62828' : '#1565c0',
            color: 'white', padding: '12px 18px', borderRadius: 10,
            boxShadow: '0 4px 16px rgba(0,0,0,0.18)', cursor: 'pointer',
            fontSize: '0.9rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 10,
            animation: 'slideIn 0.25s ease',
          }}>
            <span>{t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
      <style>{`@keyframes slideIn { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }`}</style>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
