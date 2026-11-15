<script setup>
/**
 * @file InventoryView.vue
 * @description Vista principal del catálogo de inventario (Smart Component).
 * Administra el ciclo de vida, navegación, estado de peticiones HTTP,
 * prevención de condiciones de carrera con AbortController, y WebSocket en vivo.
 */

import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { itemsService, connectInventorySocket } from '@/services/itemsService';
import { createRaceController, isAbortError } from '@/services/apiClient';
import StatusFeedback from '@/components/StatusFeedback.vue';
import ItemCard from '@/components/ItemCard.vue';
import ConfirmModal from '@/components/ConfirmModal.vue';

const router = useRouter();
const raceController = createRaceController();

// Estado reactivo de datos
const items = ref([]);
const loading = ref(true);
const error = ref(null);
const searchQuery = ref('');
const sortBy = ref('id-asc');

// Estado de red
const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true);
const handleOnlineStatus = () => { isOnline.value = navigator.onLine; };

// Estado del modal de confirmación de eliminación
const modalState = ref({
  visible: false,
  itemToDelete: null,
  isConfirming: false
});

// Mensaje toast de notificación temporal
const toastMessage = ref(null);
let toastTimer = null;

const showToast = (msg, type = 'success') => {
  toastMessage.value = { text: msg, type };
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastMessage.value = null;
  }, 4000);
};

/**
 * Carga la lista de productos previniendo condiciones de carrera.
 * Si se invoca nuevamente mientras otra petición está en vuelo, la previa se aborta.
 */
const fetchInventory = async () => {
  loading.value = true;
  error.value = null;

  const signal = raceController.getSignal();

  try {
    const data = await itemsService.getItems(signal);
    items.value = data;
  } catch (err) {
    if (isAbortError(err)) {
      // Petición cancelada intencionalmente por raceController; no mutar estado de error
      return;
    }
    console.error('[InventoryView] Error al cargar inventario:', err);
    error.value = err;
  } finally {
    loading.value = false;
  }
};

// Filtrado y ordenamiento computado
const filteredItems = computed(() => {
  let result = [...items.value];

  // Filtro por término de búsqueda (SKU o nombre)
  const q = searchQuery.value.trim().toLowerCase();
  if (q) {
    result = result.filter(
      item => item.sku.toLowerCase().includes(q) || item.nombre.toLowerCase().includes(q)
    );
  }

  // Ordenamiento
  switch (sortBy.value) {
    case 'nombre-asc':
      result.sort((a, b) => a.nombre.localeCompare(b.nombre));
      break;
    case 'nombre-desc':
      result.sort((a, b) => b.nombre.localeCompare(a.nombre));
      break;
    case 'precio-asc':
      result.sort((a, b) => a.precio - b.precio);
      break;
    case 'precio-desc':
      result.sort((a, b) => b.precio - a.precio);
      break;
    case 'stock-asc':
      result.sort((a, b) => a.stock - b.stock);
      break;
    case 'stock-desc':
      result.sort((a, b) => b.stock - a.stock);
      break;
    case 'id-desc':
      result.sort((a, b) => b.id - a.id);
      break;
    case 'id-asc':
    default:
      result.sort((a, b) => a.id - b.id);
      break;
  }

  return result;
});

// Métricas de inventario para el encabezado
const totalStock = computed(() => items.value.reduce((acc, it) => acc + it.stock, 0));
const totalValuation = computed(() => {
  const sum = items.value.reduce((acc, it) => acc + (it.stock * it.precio), 0);
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(sum);
});

// Navegación
const handleView = (id) => router.push(`/items/${id}`);
const handleEdit = (id) => router.push(`/items/${id}/editar`);
const handleCreate = () => router.push('/items/nuevo');

// Flujo de eliminación con modal accesible
const openDeleteModal = (item) => {
  modalState.value = {
    visible: true,
    itemToDelete: item,
    isConfirming: false
  };
};

const closeDeleteModal = () => {
  modalState.value.visible = false;
  modalState.value.itemToDelete = null;
  modalState.value.isConfirming = false;
};

const confirmDelete = async () => {
  const target = modalState.value.itemToDelete;
  if (!target) return;

  modalState.value.isConfirming = true;
  try {
    await itemsService.deleteItem(target.id);
    showToast(`Producto "${target.nombre}" eliminado correctamente.`);
    closeDeleteModal();
    // Actualizar lista local de inmediato
    items.value = items.value.filter(it => it.id !== target.id);
  } catch (err) {
    showToast(err.message || 'Error al eliminar producto', 'error');
    closeDeleteModal();
  }
};

// Sincronización en tiempo real vía WebSocket (Socket.io)
let socketCleanup = null;
const handleSocketChange = (payload) => {
  console.log('[Socket.io] Cambio de inventario en vivo:', payload);
  showToast(`Sincronización en vivo: producto ${payload?.accion?.toLowerCase() || 'actualizado'}.`, 'info');
  fetchInventory();
};

onMounted(() => {
  window.addEventListener('online', handleOnlineStatus);
  window.addEventListener('offline', handleOnlineStatus);
  fetchInventory();
  socketCleanup = connectInventorySocket(handleSocketChange);
});

onUnmounted(() => {
  raceController.abort();
  window.removeEventListener('online', handleOnlineStatus);
  window.removeEventListener('offline', handleOnlineStatus);
  if (toastTimer) clearTimeout(toastTimer);
});
</script>

<template>
  <div class="inventory-view">
    <!-- Notificación Toast flotante -->
    <transition name="toast-anim">
      <div v-if="toastMessage" class="toast-alert" :class="toastMessage.type" role="status">
        <span>{{ toastMessage.text }}</span>
        <button type="button" class="toast-close" @click="toastMessage = null">&times;</button>
      </div>
    </transition>

    <!-- Encabezado con Métricas y Acciones Principales -->
    <header class="page-header">
      <div class="header-titles">
        <h1 class="page-title">Panel de Control de Inventario</h1>
        <p class="page-subtitle">
          Administración de existencias, sincronización en tiempo real y consulta offline.
        </p>
      </div>

      <div class="header-actions">
        <button
          type="button"
          class="btn btn-primary"
          :disabled="!isOnline"
          @click="handleCreate"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="6" y1="12" x2="18" y2="12"></line>
          </svg>
          Registrar Producto
        </button>
      </div>
    </header>

    <!-- Barra de Métricas Globales -->
    <section class="stats-overview" v-if="items.length > 0">
      <div class="stat-card">
        <div class="stat-icon icon-blue">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">Total Productos</span>
          <span class="stat-number">{{ items.length }}</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon icon-green">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">Unidades en Stock</span>
          <span class="stat-number">{{ totalStock }}</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon icon-purple">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">Valoración Total</span>
          <span class="stat-number">{{ totalValuation }}</span>
        </div>
      </div>
    </section>

    <!-- Barra de Filtros y Búsqueda -->
    <section class="filters-bar">
      <div class="search-box">
        <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          v-model="searchQuery"
          type="search"
          class="search-input"
          placeholder="Buscar por código SKU o nombre..."
        />
        <button
          v-if="searchQuery"
          type="button"
          class="clear-search"
          @click="searchQuery = ''"
          title="Limpiar búsqueda"
        >
          &times;
        </button>
      </div>

      <div class="sort-box">
        <label for="sort-select" class="sort-label">Ordenar:</label>
        <select id="sort-select" v-model="sortBy" class="sort-select">
          <option value="id-asc">ID (Primero al último)</option>
          <option value="id-desc">ID (Más recientes)</option>
          <option value="nombre-asc">Nombre (A - Z)</option>
          <option value="nombre-desc">Nombre (Z - A)</option>
          <option value="precio-asc">Precio (Menor a Mayor)</option>
          <option value="precio-desc">Precio (Mayor a Menor)</option>
          <option value="stock-asc">Stock (Menor a Mayor)</option>
          <option value="stock-desc">Stock (Mayor a Menor)</option>
        </select>
      </div>
    </section>

    <!-- Manejo Centralizado de los 4 Estados con StatusFeedback -->
    <StatusFeedback
      :loading="loading"
      :error="error"
      :is-empty="!loading && !error && filteredItems.length === 0"
      :empty-title="searchQuery ? 'Sin coincidencias' : 'El inventario está vacío'"
      :empty-message="searchQuery 
        ? `No hay productos que coincidan con '${searchQuery}'. Intente con otro término.` 
        : 'Aún no se han registrado productos en la base de datos de SQLite.'"
      @retry="fetchInventory"
      @empty-action="searchQuery ? (searchQuery = '') : handleCreate()"
    >
      <template #empty-action>
        <button
          v-if="searchQuery"
          type="button"
          class="btn btn-secondary"
          @click="searchQuery = ''"
        >
          Limpiar búsqueda
        </button>
        <button
          v-else
          type="button"
          class="btn btn-primary"
          :disabled="!isOnline"
          @click="handleCreate"
        >
          Crear el primer producto
        </button>
      </template>

      <!-- 4. ESTADO DE ÉXITO: Renderizado de la lista con claves estables :key="item.id" -->
      <div class="cards-grid">
        <ItemCard
          v-for="item in filteredItems"
          :key="item.id"
          :item="item"
          :is-online="isOnline"
          @view="handleView"
          @edit="handleEdit"
          @delete="openDeleteModal"
        />
      </div>
    </StatusFeedback>

    <!-- Modal de confirmación para eliminación -->
    <ConfirmModal
      :visible="modalState.visible"
      :title="`¿Eliminar '${modalState.itemToDelete?.nombre}'?`"
      :message="`Esta acción eliminará permanentemente el producto con SKU ${modalState.itemToDelete?.sku} de la base de datos SQLite.`"
      :is-confirming="modalState.isConfirming"
      @confirm="confirmDelete"
      @cancel="closeDeleteModal"
    />
  </div>
</template>

<style scoped>
.inventory-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.toast-alert {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1.25rem;
  border-radius: 8px;
  color: #ffffff;
  font-size: 0.9rem;
  font-weight: 500;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
  z-index: 3000;
}

.toast-alert.success { background-color: #059669; }
.toast-alert.error { background-color: #dc2626; }
.toast-alert.info { background-color: #2563eb; }

.toast-close {
  background: transparent;
  border: none;
  color: #ffffff;
  font-size: 1.25rem;
  cursor: pointer;
  line-height: 1;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.025em;
  margin: 0 0 0.4rem 0;
}

.page-subtitle {
  color: #64748b;
  margin: 0;
  font-size: 0.95rem;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.25rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-blue { background: #eff6ff; color: #2563eb; }
.icon-green { background: #ecfdf5; color: #059669; }
.icon-purple { background: #f5f3ff; color: #7c3aed; }

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
}

.stat-number {
  font-size: 1.4rem;
  font-weight: 700;
  color: #0f172a;
}

.filters-bar {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 260px;
}

.search-icon {
  position: absolute;
  left: 0.85rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.65rem 2.2rem 0.65rem 2.5rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
  background: #ffffff;
  transition: all 0.2s;
  box-sizing: border-box;
}

.search-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.clear-search {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #94a3b8;
  cursor: pointer;
}

.sort-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sort-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
}

.sort-select {
  padding: 0.65rem 0.85rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background-color: #ffffff;
  font-size: 0.875rem;
  color: #0f172a;
  outline: none;
  cursor: pointer;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.25rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}

.btn-primary {
  background-color: #2563eb;
  color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
  background-color: #1d4ed8;
}

.btn-secondary {
  background-color: #f1f5f9;
  color: #475569;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toast-anim-enter-active,
.toast-anim-leave-active {
  transition: all 0.3s ease;
}

.toast-anim-enter-from,
.toast-anim-leave-to {
  transform: translateY(20px);
  opacity: 0;
}
</style>

