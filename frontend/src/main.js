/**
 * @file main.js
 * @description Punto de entrada principal de la SPA Vue 3.
 * Configura la instancia de la aplicación, el enrutador y registra el Service Worker PWA.
 */

import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

// Registro del Service Worker PWA para soporte offline y cacheo
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('[PWA] Service Worker registrado exitosamente con scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('[PWA] Falló el registro del Service Worker:', err);
      });
  });
}

const app = createApp(App);

app.use(router);

app.mount('#app');
