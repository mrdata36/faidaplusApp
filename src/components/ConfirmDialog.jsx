import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';

const ConfirmDialog = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText,
  cancelText,
  type = 'danger'
}) => {
  const { t } = useLanguage();

  // Color configurations based on dialog type
  const isDanger = type === 'danger';
  const iconColor = isDanger ? 'text-red-600 dark:text-red-400' : 'text-amber-500 dark:text-amber-400';
  const iconBg = isDanger ? 'bg-red-50 dark:bg-red-950/30' : 'bg-amber-50 dark:bg-amber-950/30';
  const confirmBtnBg = isDanger 
    ? 'bg-red-600 hover:bg-red-700 active:bg-red-800' 
    : 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700';

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop with a smooth blur */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onCancel}
            aria-hidden="true"
          />

          {/* Dialog container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 text-left align-middle shadow-2xl border border-slate-100 dark:border-slate-700/80 z-10"
          >
            
            {/* Close Button */}
            <button
              onClick={onCancel}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-lg p-1 hover:bg-slate-50 dark:hover:bg-slate-700"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Icon + Info */}
            <div className="flex flex-col items-center text-center mt-2">
              <div className={`p-4 rounded-full ${iconBg} ${iconColor} mb-4 flex items-center justify-center shadow-inner`}>
                <AlertTriangle className="w-8 h-8" />
              </div>
              
              <h3 
                className="text-xl font-display font-bold text-slate-900 dark:text-slate-100 mb-2 leading-tight"
              >
                {title}
              </h3>
              
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6 px-2">
                {message}
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={onCancel}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200 cursor-pointer text-center"
              >
                {cancelText || t('cancel')}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={onConfirm}
                className={`w-full sm:w-auto px-5 py-3 rounded-xl text-white font-semibold text-sm ${confirmBtnBg} transition-colors duration-200 shadow-md cursor-pointer text-center`}
              >
                {confirmText || (isDanger ? t('delete') : t('confirm'))}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDialog;
