import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/dancing-script/700.css';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import { Providers } from './providers/Providers';
import './index.css'
import './styles/ios-fixes.css';
import { initializeDebugConfig } from './utils/debugConfig';

// Initialize debug configuration
initializeDebugConfig();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Providers>
        <App />
      </Providers>
    </ErrorBoundary>
  </StrictMode>
);
