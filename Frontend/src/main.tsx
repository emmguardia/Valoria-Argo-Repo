import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { UserProvider } from './context/UserContext';
import App from './App.tsx';
import './index.css';

// Après un déploiement, un onglet ouvert avant demande des morceaux de l'ancienne version qui n'existent plus :
// on recharge la page une fois (pas plus d'une fois par minute, pour ne pas boucler) au lieu de rester sur un écran vide.
window.addEventListener('vite:preloadError', (event) => {
  try {
    const last = Number(sessionStorage.getItem('valoria-recharge') ?? 0);
    if (Date.now() - last < 60000) return;
    sessionStorage.setItem('valoria-recharge', String(Date.now()));
  } catch { /* stockage indisponible : on recharge quand même */ }
  event.preventDefault();
  window.location.reload();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <UserProvider>
          <App />
        </UserProvider>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>
);
