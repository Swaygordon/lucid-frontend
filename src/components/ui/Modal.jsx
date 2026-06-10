import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * Modal Component - Base modal wrapper with animations
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Called when modal is closed
 * @param {string} title - Modal title
 * @param {ReactNode} children - Modal content
 * @param {string} size - Modal size (sm, md, lg, xl)
 * @param {boolean} showCloseButton - Show close button
 * @returns {JSX.Element}
 */
export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  size = 'md',
  showCloseButton = true,
}) => {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            key="modal-content"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`bg-white dark:bg-[#1a1f2e] rounded-2xl shadow-xl ring-1 ring-black/5 dark:ring-white/10 ${sizes[size]} w-full p-8 relative max-h-[90vh] overflow-y-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            {showCloseButton && (
              <motion.button
                onClick={onClose}
                aria-label="Close"
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-[#252b3b] rounded-full transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-6 h-6 text-gray-600 dark:text-slate-400" />
              </motion.button>
            )}
            
            {title && (
              <motion.h2 
                className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-6"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {title}
              </motion.h2>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};