import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

window.addEventListener('error', (e) => {
  document.body.innerHTML = `<div style="padding:20px;color:red;font-family:sans-serif;"><h1>Crash</h1><pre>${e.error?.stack || e.message}</pre></div>`;
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
