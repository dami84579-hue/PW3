<script setup>
/**
 * @file ItemCreateView.vue
 * @description Vista contenedora para el registro de nuevos productos (Smart Component).
 * Gestiona el envío asíncrono, captura errores 409/400 de la API y redirecciona tras el éxito.
 */

import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { itemsService } from '@/services/itemsService';
import ItemForm from '@/components/ItemForm.vue';

const router = useRouter();

const isSubmitting = ref(false);
const backendError = ref(null);

const handleCreate = async (payload) => {
  isSubmitting.value = true;
  backendError.value = null;

  try {
    await itemsService.createItem(payload);
    // Redireccionar al catálogo con éxito
    router.push('/');
  } catch (err) {
    console.error('[ItemCreateView] Error al registrar producto:', err);
    backendError.value = err;
  } finally {
    isSubmitting.value = false;
  }
};

const handleCancel = () => {
  router.push('/');
};
</script>

<template>
  <div class="form-view-container">
    <nav class="breadcrumb">
      <button type="button" class="back-link" @click="handleCancel">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Volver al inventario
      </button>
    </nav>

    <header class="view-header">
      <h1 class="view-title">Registrar Nuevo Producto</h1>
      <p class="view-desc">
        Ingrese los datos del producto para integrarlo en la base de datos de inventario.
      </p>
    </header>

    <ItemForm
      :is-submitting="isSubmitting"
      :backend-error="backendError"
      submit-button-text="Registrar en Inventario"
      @submit="handleCreate"
      @cancel="handleCancel"
    />
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

