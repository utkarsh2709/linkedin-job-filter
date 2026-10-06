import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createCompanyStorage } from '../storage/company-storage';
import { App } from './App';
import './popup.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App storage={createCompanyStorage()} />
  </StrictMode>,
);
