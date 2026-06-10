import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn } from 'lucide-react';

const SignInRequiredModal = ({ isOpen, onCancel, onConfirm }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="signin-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
        >
          <motion.div
            key="signin-modal-content"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-[#1a1f2e] rounded-2xl shadow-2xl w-full max-w-sm p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <LogIn className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">
                Sign in to continue
              </h3>
            </div>

            <p className="text-gray-600 dark:text-slate-400 text-sm mb-6">
              You need to be signed in to view this page.
            </p>

            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2.5 rounded-lg border-2 border-gray-300 dark:border-[#2d3748] text-gray-700 dark:text-slate-300 font-medium hover:bg-gray-50 dark:hover:bg-[#252b3b] transition-colors"
              >
                Go home
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 px-4 py-2.5 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                Sign in
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export { SignInRequiredModal };
