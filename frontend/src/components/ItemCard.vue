<script setup>
/**
 * @file ItemCard.vue
 * @description Componente de presentación para cada tarjeta de producto en el catálogo.
 * Recibe props inmutables y emite eventos desacoplados al contenedor.
 */

import { computed } from 'vue';

const props = defineProps({
  item: {
    type: Object,
    required: true,
    validator(val) {
      return val && val.id !== undefined && val.sku && val.nombre;
    }
  },
  isOnline: {
    type: Boolean,
    default: true
  }
});

defineEmits(['view', 'edit', 'delete']);

const formattedPrice = computed(() => {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD'
  }).format(props.item.precio);
});

const totalValuation = computed(() => {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD'
  }).format(props.item.stock * props.item.precio);
});

const isLowStock = computed(() => props.item.stock <= 5);
</script>

<template>
  <article class="item-card">
    <div class="card-header">
      <span class="sku-badge">{{ item.sku }}</span>
      <span v-if="item.stock === 0" class="stock-pill pill-danger">Agotado</span>
      <span v-else-if="isLowStock" class="stock-pill pill-warning">Stock Bajo ({{ item.stock }})</span>
      <span v-else class="stock-pill pill-success">{{ item.stock }} uds.</span>
    </div>

    <div class="card-body">
      <h3 class="product-name" :title="item.nombre">{{ item.nombre }}</h3>

      <div class="metrics-grid">
        <div class="metric-item">
          <span class="metric-label">Precio Unitario</span>
          <span class="metric-value price">{{ formattedPrice }}</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">Valor en Inventario</span>
          <span class="metric-value valuation">{{ totalValuation }}</span>
        </div>
      </div>
    </div>

    <div class="card-actions">
      <button
        type="button"
        class="action-btn btn-view"
        title="Ver detalles completos"
        @click="$emit('view', item.id)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
        Detalles
      </button>

      <button
        type="button"
        class="action-btn btn-edit"
        :disabled="!isOnline"
        :title="isOnline ? 'Editar producto' : 'Deshabilitado en modo offline'"
        @click="$emit('edit', item.id)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
        Editar
      </button>

      <button
        type="button"
        class="action-btn btn-delete"
        :disabled="!isOnline"
        :title="isOnline ? 'Eliminar del inventario' : 'Deshabilitado en modo offline'"
        @click="$emit('delete', item)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    </div>
  </article>
</template>

<style scoped>
.item-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.item-card:hover {
  transform: translateY(-2px);
  border-color: #cbd5e1;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.85rem;
}

.sku-badge {
  font-family: monospace;
  font-size: 0.75rem;
  font-weight: 700;
  background-color: #f1f5f9;
  color: #334155;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  letter-spacing: 0.05em;
}

.stock-pill {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
}

.pill-success {
  background-color: #ecfdf5;
  color: #059669;
}

.pill-warning {
  background-color: #fffbeb;
  color: #d97706;
}

.pill-danger {
  background-color: #fef2f2;
  color: #dc2626;
}

.card-body {
  flex: 1;
}

.product-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 1rem 0;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  height: 2.7em;
}

.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  background-color: #f8fafc;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1.25rem;
}

.metric-item {
  display: flex;
  flex-direction: column;
}

.metric-label {
  font-size: 0.7rem;
  color: #64748b;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.025em;
  margin-bottom: 0.2rem;
}

.metric-value {
  font-weight: 700;
  font-size: 0.95rem;
}

.metric-value.price {
  color: #2563eb;
}

.metric-value.valuation {
  color: #0f172a;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
  border-top: 1px solid #f1f5f9;
  padding-top: 1rem;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.45rem 0.75rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.15s ease;
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-view {
  flex: 1;
  background-color: #f8fafc;
  border-color: #cbd5e1;
  color: #334155;
}

.btn-view:hover:not(:disabled) {
  background-color: #e2e8f0;
}

.btn-edit {
  background-color: #eff6ff;
  border-color: #bfdbfe;
  color: #2563eb;
}

.btn-edit:hover:not(:disabled) {
  background-color: #dbeafe;
}

.btn-delete {
  background-color: #fef2f2;
  border-color: #fecaca;
  color: #dc2626;
  padding: 0.45rem 0.55rem;
}

.btn-delete:hover:not(:disabled) {
  background-color: #fee2e2;
}
</style>

