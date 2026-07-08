import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'hsl(0 0% 8%)',
              color: 'hsl(40 20% 92%)',
              border: '1px solid rgba(212,175,55,0.25)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#228B22', secondary: '#ffffff' },
            },
            error: {
              iconTheme: { primary: '#DC143C', secondary: '#ffffff' },
            },
          }}
        />
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
