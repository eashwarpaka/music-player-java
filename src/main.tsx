import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { UIStyleProvider } from './context';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UIStyleProvider>
      <App />
    </UIStyleProvider>
  </StrictMode>,
);
