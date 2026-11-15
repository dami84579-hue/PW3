<script setup>
/**
 * @file ItemEditView.vue
 * @description Vista contenedora para edición de un producto existente.
 * Consulta la API para rellenar el formulario, valida y envía la actualización PUT.
 */

import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { itemsService } from '@/services/itemsService';
import { createRaceController, isAbortError } from '@/services/apiClient';
import ItemForm from '@/components/ItemForm.vue';
import StatusFeedback from '@/components/StatusFeedback.vue';

const route = useRoute();
const router = useRouter();
const raceController = createRaceController();

const itemId = route.params.id;
const itemData = ref(null);
const loading = ref(true);
const fetchError = ref(null);

const isSubmitting = ref(false);
const backendError = ref(null);

const fetchItemDetails = async () => {
  loading.value = true;
  fetchError.value = null;

  const signal = raceController.getSignal();

  try {
    const data = await itemsService.getItemById(itemId, signal);
    itemData.value = data;
  } catch (err) {
    if (isAbortError(err)) return;
    console.error('[ItemEditView] Error al cargar producto:', err);
    fetchError.value = err;
  } finally {
    loading.value = false;
  }
};

const handleUpdate = async (payload) => {
  isSubmitting.value = true;
  backendError.value = null;

  try {
    await itemsService.updateItem(itemId, payload);
    router.push(`/items/${itemId}`);
  } catch (err) {
    console.error('[ItemEditView] Error al actualizar producto:', err);
    backendError.value = err;
  } finally {
    isSubmitting.value = false;
  }
};

const handleCancel = () => {
  router.push(`/items/${itemId}`);
};

onMounted(() => {
  fetchItemDetails();
});

onUnmounted(() => {
  raceController.abort();
});
</script>

<template>
  <div class="form-view-container">
    <nav class="breadcrumb">
      <button type="button" class="back-link" @click="router.push('/')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Volver al inventario
      </button>
    </nav>

    <header class="view-header">
      <h1 class="view-title">Editar Producto #{{ itemId }}</h1>
      <p class="view-desc">
        Modifique las propiedades del producto y guarde los cambios en la API.
      </p>
    </header>

    <!-- Estado de carga/error al consultar la API -->
    <StatusFeedback
      :loading="loading"
      :error="fetchError"
      :is-empty="!loading && !fetchError && !itemData"
      loading-text="Recuperando datos del producto..."
      empty-title="Producto no encontrado"
      empty-message="El producto solicitado no existe o fue eliminado del inventario."
      @retry="fetchItemDetails"
    >
      <ItemForm
        v-if="itemData"
        :initial-data="itemData"
        :is-submitting="isSubmitting"
        :backend-error="backendError"
        submit-button-text="Actualizar Producto"
        @submit="handleUpdate"
        @cancel="handleCancel"
      />
    </StatusFeedback>
  </div>
</template>

<style scoped>
.form-view-container {
  max-width: 720px;
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
  transition: color 0.15s;
}

.back-link:hover {
  color: #0f172a;
}

.view-header {
  margin-bottom: 2rem;
}

.view-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.5rem 0;
}

.view-desc {
  color: #64748b;
  margin: 0;
  font-size: 0.95rem;
}
</style>

