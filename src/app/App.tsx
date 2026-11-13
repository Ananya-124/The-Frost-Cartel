import React, { Suspense, useState, useEffect } from 'react';
import { FrostCartelHomePage } from '../components/home/FrostCartelHomePage';
import { isAdminRoute } from './routes';
import type { AppView } from './app.types';
import { lazyWithRetry } from '../utils/lazyRetry';
import { initAutoFullscreen } from '../utils/fullscreen';

const AdminPortal = lazyWithRetry(() => import('../components/admin/AdminPortal').then((module) => ({ default: module.AdminPortal })));

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(() => {
    return isAdminRoute(window.location.hash, window.location.pathname) ? 'admin' : 'public';
  });

  useEffect(() => {
    const cleanupFullscreen = initAutoFullscreen();
    return () => cleanupFullscreen();
  }, []);

  useEffect(() => {
    const checkRoute = () => {
      if (isAdminRoute(window.location.hash, window.location.pathname)) {
        setCurrentView('admin');
      } else {
        setCurrentView('public');
      }
    };

    window.addEventListener('hashchange', checkRoute);
    window.addEventListener('popstate', checkRoute);
    return () => {
      window.removeEventListener('hashchange', checkRoute);
      window.removeEventListener('popstate', checkRoute);
    };
  }, []);

  const navigateToPublic = () => {
    window.location.hash = '';
    if (window.location.pathname.startsWith('/admin')) {
      window.history.pushState(null, '', '/');
    }
    setCurrentView('public');
  };

  if (currentView === 'admin') {
    return <Suspense fallback={<div role="status" className="min-h-screen bg-black text-stone-100 flex items-center justify-center">Loading administrator portal…</div>}>
      <AdminPortal onNavigatePublic={navigateToPublic} />
    </Suspense>;
  }

  // Public portal: STRICTLY NO public admin buttons or shortcuts exposed
  return <FrostCartelHomePage />;
};

export default App;
