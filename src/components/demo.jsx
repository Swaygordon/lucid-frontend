import React, { createContext, useContext, useState } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

// ============================================
// 1. DESIGN TOKENS & THEME CONFIGURATION
// ============================================

const theme = {
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb', // Main primary
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    secondary: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316',
      600: '#ea580c', // Main secondary
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
    },
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  },
  spacing: {
    xs: '0.5rem',    // 8px
    sm: '0.75rem',   // 12px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
  },
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
};

// ============================================
// 2. NOTIFICATION CONTEXT & TOAST SYSTEM
// ============================================

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = (message, type = 'info', duration = 3000) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    
    if (duration) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, duration);
    }
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <ToastContainer notifications={notifications} onRemove={removeNotification} />
    </NotificationContext.Provider>
  );
};

const ToastContainer = ({ notifications, onRemove }) => {
  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 flex flex-col gap-2">
      {notifications.map(notification => (
        <Toast
          key={notification.id}
          message={notification.message}
          type={notification.type}
          onClose={() => onRemove(notification.id)}
        />
      ))}
    </div>
  );
};

const Toast = ({ message, type, onClose }) => {
  const styles = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    warning: 'bg-yellow-600',
    info: 'bg-blue-600',
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  };

  return (
    <div className={`${styles[type]} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] animate-slide-up`}>
      {icons[type]}
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="hover:bg-white/20 rounded p-1">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// ============================================
// 3. REUSABLE BUTTON COMPONENT
// ============================================

export const Button = ({ 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  disabled = false,
  loading = false,
  children, 
  className = '',
  ...props 
}) => {
  const baseStyles = 'font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg',
    secondary: 'bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
    ghost: 'text-blue-600 hover:bg-blue-50',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm rounded-md',
    md: 'px-6 py-3 text-base rounded-lg',
    lg: 'px-8 py-4 text-lg rounded-xl',
  };

  return (
    <button
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Loading...
        </>
      ) : children}
    </button>
  );
};

// ============================================
// 4. REUSABLE INPUT COMPONENT
// ============================================

export const Input = ({ 
  label, 
  error, 
  helperText,
  required = false,
  className = '',
  ...props 
}) => {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        className={`
          px-4 py-3 border-2 rounded-lg text-base
          transition-all duration-200
          focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${error ? 'border-red-500' : 'border-gray-300'}
          ${className}
        `}
        {...props}
      />
      {error && <span className="text-red-500 text-sm">{error}</span>}
      {helperText && !error && <span className="text-gray-500 text-sm">{helperText}</span>}
    </div>
  );
};

// ============================================
// 5. REUSABLE CARD COMPONENT
// ============================================

export const Card = ({ 
  children, 
  hoverable = false,
  className = '',
  ...props 
}) => {
  return (
    <div
      className={`
        bg-white rounded-xl p-6 shadow-md
        ${hoverable ? 'hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

// ============================================
// 6. REUSABLE MODAL COMPONENT
// ============================================

export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  size = 'md',
  showCloseButton = true,
}) => {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className={`bg-white rounded-xl shadow-2xl ${sizes[size]} w-full p-8 relative animate-scale-in max-h-[90vh] overflow-y-auto`}>
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        )}
        
        {title && (
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>
        )}
        
        {children}
      </div>
    </div>
  );
};

// ============================================
// 7. REUSABLE AVATAR COMPONENT
// ============================================

export const Avatar = ({ 
  src, 
  alt = 'User', 
  size = 'md',
  fallback,
  className = '',
}) => {
  const sizes = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl',
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={`${sizes[size]} rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold ${className}`}>
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <span>{fallback || getInitials(alt)}</span>
      )}
    </div>
  );
};

// ============================================
// 8. DEMO IMPLEMENTATION
// ============================================

const DesignSystemDemo = () => {
  const { showNotification } = useNotification();
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleButtonClick = (type) => {
    showNotification(`${type} button clicked!`, type);
  };

  const handleLoadingDemo = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showNotification('Action completed!', 'success');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Lucid Design System
          </h1>
          <p className="text-lg text-gray-600">
            Consistent, reusable components for your application
          </p>
        </div>

        {/* Colors */}
        <Card>
          <h2 className="text-2xl text-black font-bold mb-6">Color Palette</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-black mb-3">Primary (Blue)</h3>
              <div className="flex gap-2">
                {[600, 700, 800].map(shade => (
                  <div key={shade} className={`w-16 h-16 bg-blue-${shade} rounded-lg shadow`} />
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-black mb-3">Secondary (Orange)</h3>
              <div className="flex gap-2">
                {[600, 700, 800].map(shade => (
                  <div key={shade} className={`w-16 h-16 bg-orange-${shade} rounded-lg shadow`} />
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Buttons */}
        <Card>
          <h2 className="text-2xl font-bold text-black mb-6">Buttons</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-black mb-3">Variants</h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary" onClick={() => handleButtonClick('success')}>
                  Primary
                </Button>
                <Button variant="secondary" onClick={() => handleButtonClick('info')}>
                  Secondary
                </Button>
                <Button variant="outline" onClick={() => handleButtonClick('warning')}>
                  Outline
                </Button>
                <Button variant="ghost">
                  Ghost
                </Button>
                <Button variant="danger" onClick={() => handleButtonClick('error')}>
                  Danger
                </Button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-black mb-3">Sizes</h3>
              <div className="flex flex-wrap items-center gap-4">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-black mb-3">States</h3>
              <div className="flex flex-wrap gap-4">
                <Button loading={loading} onClick={handleLoadingDemo}>
                  {loading ? 'Loading...' : 'Click for Loading'}
                </Button>
                <Button disabled>Disabled</Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Inputs */}
        <Card>
          <h2 className="text-2xl font-bold text-black mb-6">Input Fields</h2>
          <div className="space-y-4 max-w-md">
            <Input label="Name" placeholder="Enter your name" required />
            <Input label="Email" type="email" placeholder="email@example.com" />
            <Input 
              label="Password" 
              type="password" 
              error="Password must be at least 8 characters" 
            />
            <Input 
              label="Bio" 
              helperText="Tell us about yourself" 
              placeholder="About you..."
            />
          </div>
        </Card>

        {/* Cards */}
        <div>
          <h2 className="text-2xl font-bold text-black mb-6">Cards</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card hoverable>
              <h3 className="font-bold text-black text-lg mb-2">Hoverable Card</h3>
              <p className="text-gray-600">Hover over me to see the effect</p>
            </Card>
            <Card>
              <h3 className="font-bold text-black text-lg mb-2">Standard Card</h3>
              <p className="text-gray-600">Regular card without hover effect</p>
            </Card>
            <Card hoverable>
              <h3 className="font-bold text-black text-lg mb-2">Another Card</h3>
              <p className="text-gray-600">Click me for interaction</p>
            </Card>
          </div>
        </div>

        {/* Avatars */}
        <Card>
          <h2 className="text-2xl font-bold text-black mb-6">Avatars</h2>
          <div className="flex flex-wrap items-center gap-6">
            <Avatar size="sm" alt="John Doe" />
            <Avatar size="md" alt="Jane Smith" />
            <Avatar size="lg" alt="Bob Johnson" />
            <Avatar size="xl" alt="Alice Williams" />
          </div>
        </Card>

        {/* Modal Demo */}
        <Card>
          <h2 className="text-2xl font-bold text-black mb-6">Modal</h2>
          <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
          
          <Modal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Example Modal"
            size="md"
          >
            <p className="text-gray-600 mb-6">
              This is a reusable modal component with configurable sizes and content.
            </p>
            <div className="flex gap-4">
              <Button onClick={() => setModalOpen(false)}>Close</Button>
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </Modal>
        </Card>

      </div>
    </div>
  );
};

// Wrap with provider for demo
export default function App() {
  return (
    <NotificationProvider>
      <DesignSystemDemo />
      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </NotificationProvider>
  );
}