<script setup>
/**
 * @file ItemDetailView.vue
 * @description Vista detallada de un producto específico.
 * Expone la información completa y permite disparar edición o eliminación.
 */

import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { itemsService } from '@/services/itemsService';
import { createRaceController, isAbortError } from '@/services/apiClient';
import StatusFeedback from '@/components/StatusFeedback.vue';
import ConfirmModal from '@/components/ConfirmModal.vue';

const route = useRoute();
const router = useRouter();
const raceController = createRaceController();

const itemId = route.params.id;
const item = ref(null);
const loading = ref(true);
const error = ref(null);

const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true);
const handleOnlineStatus = () => { isOnline.value = navigator.onLine; };

const modalState = ref({
  visible: false,
  isConfirming: false
});

const fetchDetails = async () => {
  loading.value = true;
  error.value = null;

  const signal = raceController.getSignal();

  try {
    const data = await itemsService.getItemById(itemId, signal);
    item.value = data;
  } catch (err) {
    if (isAbortError(err)) return;
    console.error('[ItemDetailView] Error:', err);
    error.value = err;
  } finally {
    loading.value = false;
  }
};

const formattedPrice = computed(() => {
  if (!item.value) return '$0.00';
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(item.value.precio);
});

const totalValuation = computed(() => {
  if (!item.value) return '$0.00';
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(item.value.stock * item.value.precio);
});

const confirmDelete = async () => {
  modalState.value.isConfirming = true;
  try {
    await itemsService.deleteItem(itemId);
    router.push('/');
  } catch (err) {
    alert(err.message || 'Error al eliminar el producto');
    modalState.value.visible = false;
  } finally {
    modalState.value.isConfirming = false;
  }
};

onMounted(() => {
  window.addEventListener('online', handleOnlineStatus);
  window.addEventListener('offline', handleOnlineStatus);
  fetchDetails();
});

onUnmounted(() => {
  raceController.abort();
  window.removeEventListener('online', handleOnlineStatus);
  window.removeEventListener('offline', handleOnlineStatus);
});
</script>

<template>
  <div class="detail-container">
    <nav class="breadcrumb">
      <button type="button" class="back-link" @click="router.push('/')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Volver al inventario
      </button>
    </nav>

    <StatusFeedback
      :loading="loading"
      :error="error"
      :is-empty="!loading && !error && !item"
      loading-text="Cargando detalles del producto..."
      empty-title="Producto no encontrado"
      empty-message="No existe un producto registrado con este identificador."
      @retry="fetchDetails"
    >
      <article v-if="item" class="detail-card">
        <header class="detail-header">
          <div class="header-left">
            <span class="sku-tag">SKU: {{ item.sku }}</span>
            <h1 class="item-title">{{ item.nombre }}</h1>
            <span class="id-sub">Identificador en Base de Datos: #{{ item.id }}</span>
          </div>

          <div class="header-actions">
            <button
              type="button"
              class="btn btn-secondary"
              :disabled="!isOnline"
              @click="router.push(`/items/${item.id}/editar`)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Editar Producto
            </button>

            <button
              type="button"
              class="btn btn-danger"
              :disabled="!isOnline"
              @click="modalState.visible = true"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              Eliminar
            </button>
          </div>
        </header>

        <section class="detail-body">
          <div class="info-grid">
            <div class="info-tile">
              <span class="tile-label">Existencia Actual</span>
              <span class="tile-value" :class="item.stock === 0 ? 'text-danger' : ''">
                {{ item.stock }} unidades
              </span>
              <span v-if="item.stock <= 5" class="tile-hint hint-warning">
                ⚠️ Stock crítico o bajo en almacén
              </span>
              <span v-else class="tile-hint hint-success">
                ✓ Nivel de existencias óptimo
              </span>
            </div>

            <div class="info-tile">
              <span class="tile-label">Precio Unitario</span>
              <span class="tile-value text-blue">{{ formattedPrice }}</span>
              <span class="tile-hint">Moneda de referencia en USD</span>
            </div>

            <div class="info-tile">
              <span class="tile-label">Valor Total en Almacén</span>
              <span class="tile-value">{{ totalValuation }}</span>
              <span class="tile-hint">Cálculo (Stock × Precio)</span>
            </div>

            <div class="info-tile">
              <span class="tile-label">Estado de Sincronización</span>
              <span class="tile-value">
                <span class="sync-dot"></span>
                Persistido en SQLite
              </span>
              <span class="tile-hint">Integridad referencial y SKU único</span>
            </div>
          </div>
        </section>
      </article>
    </StatusFeedback>

    <ConfirmModal
      :visible="modalState.visible"
      :title="`¿Eliminar '${item?.nombre}'?`"
      :message="`Esta operación borrará permanentemente este registro del inventario.`"
      :is-confirming="modalState.isConfirming"
      @confirm="confirmDelete"
      @cancel="modalState.visible = false"
    />
  </div>
</template>

<style scoped>
.detail-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.breadcrumb {
  margin-bottom: 1.5rem;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
}

.back-link:hover {
  color: #0f172a;
}

.detail-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.detail-header {
  padding: 2rem;
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.header-left {
  display: flex;
  flex-direction: column;
}

.sku-tag {
  font-family: monospace;
  font-size: 0.85rem;
  font-weight: 700;
  color: #2563eb;
  background-color: #eff6ff;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  align-self: flex-start;
  margin-bottom: 0.5rem;
}

.item-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.35rem 0;
}

.id-sub {
  font-size: 0.85rem;
  color: #64748b;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.detail-body {
  padding: 2rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.info-tile {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
}

.tile-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #64748b;
  margin-bottom: 0.4rem;
}

.tile-value {
  font-size: 1.35rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.4rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tile-value.text-blue { color: #2563eb; }
.tile-value.text-danger { color: #dc2626; }

.tile-hint {
  font-size: 0.8rem;
  color: #94a3b8;
}

.hint-warning { color: #d97706 !important; font-weight: 600; }
.hint-success { color: #059669 !important; font-weight: 600; }

.sync-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #10b981;
  display: inline-block;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 1.1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #ffffff;
  border-color: #cbd5e1;
  color: #334155;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #f1f5f9;
}

.btn-danger {
  background-color: #ef4444;
  color: #ffffff;
}

.btn-danger:hover:not(:disabled) {
  background-color: #dc2626;
}
</style>

