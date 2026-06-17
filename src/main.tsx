import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary';
import { EnvBanner } from './components/EnvBanner';
import { BrandIntro } from './components/BrandIntro';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
      <EnvBanner />
    </ErrorBoundary>
    {/* Overlay above the app; outside the boundary so it can never blank content. */}
    <BrandIntro />
  </StrictMode>,
);
