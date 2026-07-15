import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from './LanguageContext';

const LoadingContext = createContext();

export const useLoading = () => useContext(LoadingContext);

export const LoadingProvider = ({ children }) => {
  const [activeRequests, setActiveRequests] = useState(0);
  const { t } = useLanguage();

  useEffect(() => {
    // Axios Interceptors for Global Loading
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        setActiveRequests((prev) => prev + 1);
        return config;
      },
      (error) => {
        setActiveRequests((prev) => Math.max(0, prev - 1));
        return Promise.reject(error);
      }
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => {
        setActiveRequests((prev) => Math.max(0, prev - 1));
        return response;
      },
      (error) => {
        setActiveRequests((prev) => Math.max(0, prev - 1));
        return Promise.reject(error);
      }
    );

    // Cleanup interceptors on unmount
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  const isLoading = activeRequests > 0;

  // Manual loading control helpers (for heavy local calculations, transitions, or PDF downloads)
  const showLoading = () => setActiveRequests((prev) => prev + 1);
  const hideLoading = () => setActiveRequests((prev) => Math.max(0, prev - 1));

  return (
    <LoadingContext.Provider value={{ isLoading, showLoading, hideLoading }}>
      {children}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            id="global-loading-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/70 backdrop-blur-md pointer-events-auto"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center max-w-sm w-11/12 text-center"
            >
              {/* Custom Designed Concentric Spinner */}
              <div className="relative w-16 h-16 flex items-center justify-center mb-5">
                {/* Outer spinning ring - Blue */}
                <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800"></div>
                <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                
                {/* Inner counter-spinning ring - Emerald */}
                <div className="absolute w-10 h-10 rounded-full border-4 border-slate-100 dark:border-slate-800"></div>
                <div className="absolute w-10 h-10 rounded-full border-4 border-b-emerald-500 border-t-transparent border-r-transparent border-l-transparent animate-spin [animation-direction:reverse]"></div>
                
                {/* Center glowing dot */}
                <div className="absolute w-3 h-3 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
              </div>

              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-1.5 font-sans">
                {t('loading')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-[200px]">
                {t('please_wait')}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </LoadingContext.Provider>
  );
};
