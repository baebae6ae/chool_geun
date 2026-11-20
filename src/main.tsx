import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';
import { isNative } from './platform';
import { ErrorBoundary } from './components/ErrorBoundary';

const Gallery = lazy(() => import('./dev/Gallery').then((m) => ({ default: m.Gallery })));
const Diag = lazy(() => import('./dev/Diag').then((m) => ({ default: m.Diag })));
const TheaterDev = lazy(() => import('./dev/TheaterDev').then((m) => ({ default: m.TheaterDev })));
const EscapeDev = lazy(() => import('./dev/EscapeDev').then((m) => ({ default: m.EscapeDev })));
const PaydayDev = lazy(() => import('./dev/PaydayDev').then((m) => ({ default: m.PaydayDev })));
const DragonDev = lazy(() => import('./dev/DragonDev').then((m) => ({ default: m.DragonDev })));
const params = new URLSearchParams(location.search);
const isGallery = params.has('gallery');
const isDiag = params.has('diag');
const isTheater = params.has('theater');
const isDragon = params.has('dragon');
const isPayday = params.has('payday');
const isEscape = params.has('escape');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isGallery || isDiag || isTheater || isDragon || isPayday || isEscape ? (
      <Suspense>{isDiag ? <Diag /> : isTheater ? <TheaterDev /> : isDragon ? <DragonDev /> : isPayday ? <PaydayDev /> : isEscape ? <EscapeDev /> : <Gallery />}</Suspense>
    ) : (
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    )}
  </StrictMode>,
);

if ('serviceWorker' in navigator && import.meta.env.PROD && !isNative) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
