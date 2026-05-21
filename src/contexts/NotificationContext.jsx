import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// [WS] Integration point: open a WebSocket connection to ws://…/users/:id/notifications after auth.
// On every incoming 'notification' event, call showNotification(event.message, event.type) to surface
// the toast. The entire toast/dismiss system below is client-side and requires no changes — only the
// WS listener that drives it needs to be wired up here (or in a sibling useEffect inside NotificationProvider).

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within NotificationProvider');
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // [WS] In production, trigger showNotification from a WebSocket 'notification' event listener mounted here
  const showNotification = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </NotificationContext.Provider>
  );
};

const ToastContainer = ({ toasts, onDismiss }) => (
  <div
    aria-live="polite"
    className="fixed bottom-6 right-6 z-50 flex flex-col-reverse gap-3 items-end pointer-events-none"
  >
    <AnimatePresence initial={false}>
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} onDismiss={onDismiss} />
      ))}
    </AnimatePresence>
  </div>
);

const CONFIG = {
  success: {
    border: 'border-l-green-500',
    icon: CheckCircle,
    iconColor: 'text-green-500',
  },
  error: {
    border: 'border-l-error',
    icon: XCircle,
    iconColor: 'text-error',
  },
  warning: {
    border: 'border-l-yellow-500',
    icon: AlertTriangle,
    iconColor: 'text-yellow-500',
  },
  info: {
    border: 'border-l-primary',
    icon: Info,
    iconColor: 'text-primary',
  },
};

const Toast = ({ id, message, type, duration, onDismiss }) => {
  const cfg = CONFIG[type] ?? CONFIG.info;
  const Icon = cfg.icon;

  const timerRef = useRef(null);
  const remainingRef = useRef(duration);
  const startedAtRef = useRef(null);

  const startTimer = useCallback(() => {
    startedAtRef.current = Date.now();
    timerRef.current = setTimeout(
      () => onDismiss(id),
      Math.max(remainingRef.current, 0)
    );
  }, [id, onDismiss]);

  const pauseTimer = useCallback(() => {
    clearTimeout(timerRef.current);
    remainingRef.current -= Date.now() - startedAtRef.current;
  }, []);

  useEffect(() => {
    startTimer();
    return () => clearTimeout(timerRef.current);
  }, [startTimer]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 48, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 48, scale: 0.95, transition: { duration: 0.18, ease: 'easeIn' } }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      onMouseEnter={pauseTimer}
      onMouseLeave={startTimer}
      role="alert"
      className={`
        pointer-events-auto
        bg-white rounded-lg shadow-lg
        border border-gray-100 border-l-4 ${cfg.border}
        px-4 py-3.5
        flex items-start gap-3
        min-w-[300px] max-w-sm
      `}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${cfg.iconColor}`} />
      <span className="flex-1 text-sm font-medium text-gray-800 leading-snug">
        {message}
      </span>
      <button
        onClick={() => onDismiss(id)}
        aria-label="Dismiss notification"
        className="flex-shrink-0 p-1 -mr-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};
