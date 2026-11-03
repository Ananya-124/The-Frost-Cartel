import React, { useState, useEffect } from 'react';
import { FrostCartelHomePage } from '../components/home/FrostCartelHomePage';
import { AdminPortal } from '../components/admin/AdminPortal';
import { isAdminRoute } from './routes';
import type { AppView } from './app.types';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(() => {
    return isAdminRoute(window.location.hash, window.location.pathname) ? 'admin' : 'public';
  });

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
    return <AdminPortal onNavigatePublic={navigateToPublic} />;
  }

  // Public portal: STRICTLY NO public admin buttons or shortcuts exposed
  return <FrostCartelHomePage />;
};

export default App;
