<script setup>
/**
 * @file StatusFeedback.vue
 * @description Componente de presentación reutilizable que encapsula
 * de manera estricta los 4 estados de interfaz exigidos por la actividad:
 * 1. Carga (loading)
 * 2. Error (error)
 * 3. Vacío (empty)
 * 4. Éxito (success - slot predeterminado)
 */

defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: [String, Object, Error, null],
    default: null
  },
  isEmpty: {
    type: Boolean,
    default: false
  },
  loadingText: {
    type: String,
    default: 'Cargando información del inventario...'
  },
  emptyTitle: {
    type: String,
    default: 'No se encontraron registros'
  },
  emptyMessage: {
    type: String,
    default: 'No hay elementos disponibles en este momento o el filtro no produjo coincidencias.'
  }
});

defineEmits(['retry', 'emptyAction']);
</script>

<template>
  <div class="status-container">
    <!-- 1. ESTADO DE CARGA (LOADING) -->
    <div v-if="loading" class="state-card loading-state" role="status" aria-live="polite">
      <div class="spinner"></div>
      <p class="state-text">{{ loadingText }}</p>
      <div class="skeleton-group">
        <div class="skeleton-line" style="width: 85%;"></div>
        <div class="skeleton-line" style="width: 70%;"></div>
        <div class="skeleton-line" style="width: 50%;"></div>
      </div>
    </div>

    <!-- 2. ESTADO DE ERROR (ERROR) -->
    <div v-else-if="error" class="state-card error-state" role="alert">
      <div class="icon-circle error-circle">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <h3 class="state-title">Ocurrió un error en la solicitud</h3>
      <p class="state-message">
        {{ typeof error === 'string' ? error : (error.message || 'Error de comunicación con el servidor') }}
      </p>

      <ul v-if="error.details && error.details.length" class="error-details-list">
        <li v-for="(detail, idx) in error.details" :key="idx">{{ detail }}</li>
      </ul>

      <button type="button" class="btn btn-danger" @click="$emit('retry')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="1 4 1 10 7 10"></polyline>
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
        </svg>
        Reintentar petición
      </button>
    </div>

    <!-- 3. ESTADO VACÍO (EMPTY) -->
    <div v-else-if="isEmpty" class="state-card empty-state">
      <div class="icon-circle empty-circle">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
      </div>
      <h3 class="state-title">{{ emptyTitle }}</h3>
      <p class="state-message">{{ emptyMessage }}</p>
      
      <slot name="empty-action">
        <button type="button" class="btn btn-primary" @click="$emit('emptyAction')">
          Actualizar vista
        </button>
      </slot>
    </div>

    <!-- 4. ESTADO DE ÉXITO (SUCCESS) -->
    <div v-else class="success-content">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.status-container {
  width: 100%;
}

.state-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2.5rem 1.5rem;
  text-align: center;
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  margin: 1.5rem 0;
}

.icon-circle {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.error-circle {
  background-color: #fee2e2;
  color: #dc2626;
}

.empty-circle {
  background-color: #f1f5f9;
  color: #64748b;
}

.state-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
}

.state-message, .state-text {
  font-size: 0.95rem;
  color: #64748b;
  max-width: 460px;
  margin: 0 0 1.25rem 0;
  line-height: 1.5;
}

.error-details-list {
  text-align: left;
  background: #fef2f2;
  border: 1px solid #fecaca;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  color: #b91c1c;
  font-size: 0.85rem;
  margin-bottom: 1.25rem;
  max-width: 500px;
  width: 100%;
}

/* Spinner */
.spinner {
  width: 44px;
  height: 44px;
  border: 4px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Skeletons */
.skeleton-group {
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
}

.skeleton-line {
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.25rem;
  font-size: 0.9rem;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-primary {
  background-color: #2563eb;
  color: #ffffff;
}

.btn-primary:hover {
  background-color: #1d4ed8;
}

.btn-danger {
  background-color: #ef4444;
  color: #ffffff;
}

.btn-danger:hover {
  background-color: #dc2626;
}
</style>

