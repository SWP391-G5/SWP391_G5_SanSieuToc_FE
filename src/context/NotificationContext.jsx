import { createContext, useContext, useMemo, useState } from 'react';

const NotificationContext = createContext(null);

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const push = ({ type = 'info', message }) => {
    const id = uid();
    setToasts((prev) => [...prev, { id, type, message }]);
    window.setTimeout(() => remove(id), 3500);
  };

  const value = useMemo(
    () => ({
      notifySuccess: (message) => push({ type: 'success', message }),
      notifyError: (message) => push({ type: 'error', message }),
      notifyInfo: (message) => push({ type: 'info', message }),
      notifyWarning: (message) => push({ type: 'warning', message }),
    }),
    []
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="notification-container" aria-live="polite" aria-relevant="additions">
        {toasts.map((t) => (
          <div key={t.id} className={`notification-toast notification-${t.type}`}>
            <span className="notification-icon material-symbols-outlined">
              {t.type === 'success'
                ? 'check_circle'
                : t.type === 'error'
                  ? 'error'
                  : t.type === 'warning'
                    ? 'warning'
                    : 'info'}
            </span>
            <div className="notification-message">{t.message}</div>
            <button className="notification-close" onClick={() => remove(t.id)} aria-label="Đóng">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
}
