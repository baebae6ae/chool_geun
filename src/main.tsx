import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

const Gallery = lazy(() => import('./dev/Gallery').then((m) => ({ default: m.Gallery })));
const isGallery = new URLSearchParams(location.search).has('gallery');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isGallery ? (
      <Suspense>
        <Gallery />
      </Suspense>
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
