<script setup>
/**
 * @file OfflineAlert.vue
 * @description Monitorea el estado de conectividad en tiempo real (navigator.onLine)
 * y muestra alertas informativas sobre la experiencia offline limitada y segura.
 */

import { ref, onMounted, onUnmounted } from 'vue';

const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true);

const updateOnlineStatus = () => {
  isOnline.value = navigator.onLine;
};

onMounted(() => {
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
});

onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus);
  window.removeEventListener('offline', updateOnlineStatus);
});
</script>

<template>
  <transition name="slide-fade">
    <aside v-if="!isOnline" class="offline-banner" role="alert" aria-live="assertive">
      <div class="banner-content">
        <div class="badge-offline">
          <span class="dot"></span>
          MODO OFFLINE ACTIVO
        </div>
        <p class="banner-message">
          Se ha perdido la conexión de red. La aplicación continúa funcionando en 
          <strong>modo de solo lectura</strong> gracias al Service Worker y caché local. 
          Las operaciones de creación y modificación están deshabilitadas hasta restablecer la conexión.
        </p>
      </div>
    </aside>
  </transition>
</template>

<style scoped>
.offline-banner {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  color: #f8fafc;
  border-bottom: 2px solid #eab308;
  padding: 0.85rem 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.banner-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex-wrap: wrap;
}

.badge-offline {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: rgba(234, 179, 8, 0.2);
  color: #facc15;
  border: 1px solid rgba(234, 179, 8, 0.4);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  padding: 0.3rem 0.7rem;
  border-radius: 9999px;
  text-transform: uppercase;
}

.dot {
  width: 8px;
  height: 8px;
  background-color: #facc15;
  border-radius: 50%;
  box-shadow: 0 0 8px #facc15;
}

.banner-message {
  font-size: 0.875rem;
  color: #cbd5e1;
  margin: 0;
  flex: 1;
  line-height: 1.4;
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>

