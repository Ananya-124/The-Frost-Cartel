import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import App from './app/App';

// Auto-reload on stale dynamic import chunks when a new deployment invalidates prior bundles
window.addEventListener('vite:preloadError', (event) => {
  console.warn('[Vite] Preload chunk error detected; reloading for latest deployment bundle.', event);
  const storageKey = 'fc_vite_preload_reload';
  const lastReload = sessionStorage.getItem(storageKey);
  const now = Date.now();
  if (!lastReload || now - Number(lastReload) > 10000) {
    sessionStorage.setItem(storageKey, String(now));
    window.location.reload();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
