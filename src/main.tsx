import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationStoreProvider } from './contexts/NotificationStore';
import { ToastProvider } from './contexts/ToastContext';
import { ensureLatestDeploy } from './lib/deployVersion';
import './index.css';

const rootElement = document.getElementById('root');

function renderApp() {
  if (!rootElement) {
    throw new Error('Root element not found');
  }

  createRoot(rootElement).render(
    <StrictMode>
      <HelmetProvider>
        <ErrorBoundary>
          <AuthProvider>
            <NotificationStoreProvider>
              <ToastProvider>
                <App />
              </ToastProvider>
            </NotificationStoreProvider>
          </AuthProvider>
        </ErrorBoundary>
      </HelmetProvider>
    </StrictMode>,
  );
}

if (!rootElement) {
  throw new Error('Root element not found');
}

void ensureLatestDeploy()
  .catch(() => {})
  .finally(() => {
    try {
      renderApp();
    } catch (error) {
      console.error('Failed to render app:', error);
      const box = 'div';
      rootElement.innerHTML =
        `<${box} style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0f172a;color:#fff;font-family:system-ui">` +
        `<${box} style="text-align:center;padding:2rem">` +
        '<h1 style="font-size:2rem;margin-bottom:1rem">Application Error</h1>' +
        '<p style="color:#94a3b8;margin-bottom:2rem">Failed to initialize. Please reload.</p>' +
        '<button type="button" onclick="window.location.reload()" style="padding:0.75rem 1.5rem;background:#3b82f6;color:#fff;border:none;border-radius:0.5rem;cursor:pointer">Reload Page</button>' +
        `</${box}></${box}>`;
    }
  });
