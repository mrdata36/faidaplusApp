import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import { registerSW } from 'virtual:pwa-register';
import App from './App.jsx';
import './index.css';
import { registerOfflineSync } from './utils/offlineSync.mjs';

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl) return envUrl;

  if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
    console.warn('Running inside a native app. Set VITE_API_BASE_URL to your backend host or use a local network IP.');
    return 'http://10.0.2.2:5000';
  }

  return '/';
};

axios.defaults.baseURL = getApiBaseUrl();
axios.defaults.headers.common['Content-Type'] = 'application/json';
registerOfflineSync(axios);
registerSW({ immediate: true });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
