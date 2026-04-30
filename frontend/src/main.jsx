import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './lib/auth.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '12px',
              background: '#fff',
              color: '#1f2937',
              border: '1px solid #fbcfe0',
              boxShadow: '0 6px 24px rgba(236, 72, 153, 0.12)',
            },
            success: { iconTheme: { primary: '#ec4899', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
