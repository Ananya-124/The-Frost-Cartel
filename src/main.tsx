import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import App from './app/App';
import { initAutoFullscreen } from './utils/fullscreen';

// Initialize auto-fullscreen as soon as the site is entered
initAutoFullscreen();

// Auto-reload on stale dynamic import chunks when a new deployment invalidates prior bundles
const handleChunkError = (reason?: unknown) => {
  console.warn('[Vite] Chunk loading error detected; reloading for latest deployment bundle.', reason);
  const storageKey = 'fc_vite_preload_reload';
  const lastReload = sessionStorage.getItem(storageKey);
  const now = Date.now();
  if (!lastReload || now - Number(lastReload) > 8000) {
    sessionStorage.setItem(storageKey, String(now));
    window.location.reload();
  }
};

window.addEventListener('vite:preloadError', (event) => {
  handleChunkError(event);
});

window.addEventListener('unhandledrejection', (event) => {
  const msg = String(event.reason?.message ?? event.reason ?? '');
  if (msg.includes('dynamically imported module') || msg.includes('Failed to fetch dynamically imported module')) {
    event.preventDefault();
    handleChunkError(event.reason);
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
