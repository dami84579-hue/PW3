<script setup>
/**
 * @file Navbar.vue
 * @description Barra de navegación global de la SPA.
 * Incluye enlaces con RouterLink, indicador de conectividad y soporte de instalación PWA.
 */

import { ref, onMounted, onUnmounted } from 'vue';
import { RouterLink } from 'vue-router';

const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true);
const installPrompt = ref(null);
const isInstalled = ref(false);

const handleOnline = () => { isOnline.value = true; };
const handleOffline = () => { isOnline.value = false; };

const handleBeforeInstall = (e) => {
  e.preventDefault();
  installPrompt.value = e;
};

const handleAppInstalled = () => {
  isInstalled.value = true;
  installPrompt.value = null;
};

const installPwa = async () => {
  if (!installPrompt.value) return;
  installPrompt.value.prompt();
  const choice = await installPrompt.value.userChoice;
  if (choice.outcome === 'accepted') {
    installPrompt.value = null;
  }
};

onMounted(() => {
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  window.addEventListener('beforeinstallprompt', handleBeforeInstall);
  window.addEventListener('appinstalled', handleAppInstalled);
});

onUnmounted(() => {
  window.removeEventListener('online', handleOnline);
  window.removeEventListener('offline', handleOffline);
  window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  window.removeEventListener('appinstalled', handleAppInstalled);
});
</script>

<template>
  <header class="navbar-header">
    <div class="nav-container">
      <RouterLink to="/" class="brand-link">
        <div class="brand-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
        </div>
        <div class="brand-text">
          <span class="brand-title">Inventario PWA</span>
          <span class="brand-sub">Vue 3 + SQLite3</span>
        </div>
      </RouterLink>

      <nav class="nav-links">
        <RouterLink to="/" class="nav-item" active-class="active">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          Inventario
        </RouterLink>

        <RouterLink to="/items/nuevo" class="nav-item" active-class="active">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="6" y1="12" x2="18" y2="12"></line>
          </svg>
          Nuevo Producto
        </RouterLink>

        <RouterLink to="/auditoria" class="nav-item" active-class="active">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
          Auditoría & Exportación
        </RouterLink>
      </nav>

      <div class="nav-actions">
        <!-- Indicador de red -->
        <div class="connection-indicator" :class="isOnline ? 'online' : 'offline'">
          <span class="ping-dot"></span>
          <span class="status-label">{{ isOnline ? 'En línea' : 'Offline' }}</span>
        </div>

        <!-- Botón de Instalación PWA (aparece si el navegador lo soporta) -->
        <button v-if="installPrompt" type="button" class="btn-install" @click="installPwa">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Instalar App
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.navbar-header {
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0.75rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: inherit;
}

.brand-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #ffffff;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.02em;
}

.brand-sub {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-item {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.85rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  color: #475569;
  text-decoration: none;
  transition: all 0.2s ease;
}

.nav-item:hover {
  background-color: #f1f5f9;
  color: #0f172a;
}

.nav-item.active {
  background-color: #eff6ff;
  color: #2563eb;
  font-weight: 600;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.connection-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.connection-indicator.online {
  background-color: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
}

.connection-indicator.offline {
  background-color: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.ping-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.online .ping-dot {
  background-color: #10b981;
  box-shadow: 0 0 6px #10b981;
}

.offline .ping-dot {
  background-color: #ef4444;
  box-shadow: 0 0 6px #ef4444;
}

.btn-install {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background-color: #2563eb;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 0.45rem 0.85rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-install:hover {
  background-color: #1d4ed8;
}

@media (max-width: 768px) {
  .nav-container {
    flex-direction: column;
    align-items: flex-start;
  }
  .nav-links {
    width: 100%;
    flex-wrap: wrap;
  }
}
</style>

