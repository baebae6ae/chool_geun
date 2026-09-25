import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

const Gallery = lazy(() => import('./dev/Gallery').then((m) => ({ default: m.Gallery })));
const Diag = lazy(() => import('./dev/Diag').then((m) => ({ default: m.Diag })));
const params = new URLSearchParams(location.search);
const isGallery = params.has('gallery');
const isDiag = params.has('diag');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isGallery || isDiag ? (
      <Suspense>{isDiag ? <Diag /> : <Gallery />}</Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
