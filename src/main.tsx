import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppRoot } from '@/app/AppRoot';
import '@/app/styles.css';
import { setFavicon } from '@/shared/lib/setFavicon';

setFavicon();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRoot />
  </StrictMode>,
);
