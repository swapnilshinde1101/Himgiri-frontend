import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { queryClient } from './config/queryClient';
import AppRoutes from './routes/AppRoutes';
import api from './services/api';

export default function App() {
  // ── Startup Security Check ──
  React.useEffect(() => {
    const checkConnection = async () => {
      const storage = sessionStorage.getItem('himgiri-auth-storage');
      if (storage) {
        try {
          await api.get('/auth/validate');
        } catch (err) {
          // Handled automatically by api.ts interceptor (e.g. redirecting to /admin/login on 401)
        }
      }
    };
    checkConnection();
  }, []);

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Toaster position="top-right" />
          <AppRoutes />
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );
}
