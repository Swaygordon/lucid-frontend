import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut } from 'lucide-react';

const LogoutConfirmModal = ({ isOpen, onClose, onConfirm }) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleConfirm = async () => {
    setIsLoggingOut(true);
    try {
      await onConfirm();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="logout-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
          onClick={isLoggingOut ? undefined : onClose}
        >
          <motion.div
            key="logout-modal-content"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#1a1f2e] rounded-2xl shadow-2xl w-full max-w-sm p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-full bg-red-100 dark:bg-red-900/30">
                <LogOut className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">
                Log out?
              </h3>
            </div>

            <p className="text-gray-600 dark:text-slate-400 text-sm mb-6">
              You'll need to sign in again to access your account.
            </p>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isLoggingOut}
                className="flex-1 px-4 py-2.5 rounded-lg border-2 border-gray-300 dark:border-[#2d3748] text-gray-700 dark:text-slate-300 font-medium hover:bg-gray-50 dark:hover:bg-[#252b3b] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isLoggingOut}
                className="flex-1 px-4 py-2.5 rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-70"
              >
                {isLoggingOut ? 'Logging out…' : 'Log out'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export { LogoutConfirmModal };
