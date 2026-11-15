<script setup>
/**
 * @file App.vue
 * @description Componente raíz de la SPA.
 * Contiene el cascarón (App Shell) que se cachea offline: Navbar, OfflineAlert, RouterView y Footer.
 */

import Navbar from '@/components/Navbar.vue';
import OfflineAlert from '@/components/OfflineAlert.vue';
</script>

<template>
  <div class="app-layout">
    <OfflineAlert />
    <Navbar />

    <main class="app-main">
      <router-view v-slot="{ Component }">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <footer class="app-footer">
      <div class="footer-container">
        <p class="footer-text">
          <strong>Actividad Unidad 3:</strong> Aplicación SPA/PWA con Vue 3 y consumo de API REST en tiempo real.
        </p>
        <p class="footer-sub">
          Arquitectura por componentes • Workbox Service Worker • Manifest • Modo Offline Seguro
        </p>
      </div>
    </footer>
  </div>
</template>

<style>
/* Reset Global y Tipografía */
:root {
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  --bg-color: #f8fafc;
  --text-main: #0f172a;
  --primary: #2563eb;
  --primary-hover: #1d4ed8;
}

*, *::before, *::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family: var(--font-family);
  background-color: var(--bg-color);
  color: var(--text-main);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-main {
  flex: 1;
}

.app-footer {
  background-color: #ffffff;
  border-top: 1px solid #e2e8f0;
  padding: 1.5rem;
  margin-top: 3rem;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
}

.footer-text {
  font-size: 0.85rem;
  color: #475569;
  margin: 0 0 0.25rem 0;
}

.footer-sub {
  font-size: 0.75rem;
  color: #94a3b8;
  margin: 0;
}

/* Transiciones de Página */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>

