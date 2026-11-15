<script setup>
/**
 * @file ItemForm.vue
 * @description Componente de presentación reutilizable para la creación
 * y edición de productos.
 * Utiliza v-model, validaciones reactivas antes del submit, y emite eventos al padre.
 */

import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({
      sku: '',
      nombre: '',
      stock: 0,
      precio: 0.01
    })
  },
  isSubmitting: {
    type: Boolean,
    default: false
  },
  submitButtonText: {
    type: String,
    default: 'Guardar Producto'
  },
  backendError: {
    type: [String, Object, null],
    default: null
  }
});

const emit = defineEmits(['submit', 'cancel']);

// Estado de conectividad para proteger mutaciones offline
const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true);
const handleOnlineStatus = () => { isOnline.value = navigator.onLine; };

onMounted(() => {
  window.addEventListener('online', handleOnlineStatus);
  window.addEventListener('offline', handleOnlineStatus);
});

onUnmounted(() => {
  window.removeEventListener('online', handleOnlineStatus);
  window.removeEventListener('offline', handleOnlineStatus);
});

// Modelo de datos del formulario reactivo
const formData = reactive({
  sku: '',
  nombre: '',
  stock: 0,
  precio: 0
});

// Inicializar con props
watch(
  () => props.initialData,
  (val) => {
    if (val) {
      formData.sku = val.sku || '';
      formData.nombre = val.nombre || '';
      formData.stock = val.stock !== undefined ? val.stock : 0;
      formData.precio = val.precio !== undefined ? val.precio : 0.01;
    }
  },
  { immediate: true, deep: true }
);

// Errores de validación locales
const touched = reactive({
  sku: false,
  nombre: false,
  stock: false,
  precio: false
});

const errors = computed(() => {
  const errs = {};

  // Validación SKU
  const cleanSku = String(formData.sku || '').trim();
  if (!cleanSku) {
    errs.sku = 'El código SKU es obligatorio.';
  } else if (cleanSku.length < 2) {
    errs.sku = 'El SKU debe tener al menos 2 caracteres.';
  }

  // Validación Nombre
  const cleanNombre = String(formData.nombre || '').trim();
  if (!cleanNombre) {
    errs.nombre = 'El nombre del producto es obligatorio.';
  } else if (cleanNombre.length < 2) {
    errs.nombre = 'El nombre debe contener al menos 2 caracteres.';
  }

  // Validación Stock
  const stockNum = Number(formData.stock);
  if (isNaN(stockNum) || formData.stock === '' || formData.stock === null) {
    errs.stock = 'El stock es obligatorio.';
  } else if (!Number.isInteger(stockNum) || stockNum < 0) {
    errs.stock = 'El stock debe ser un número entero mayor o igual a 0.';
  }

  // Validación Precio
  const precioNum = Number(formData.precio);
  if (isNaN(precioNum) || formData.precio === '' || formData.precio === null) {
    errs.precio = 'El precio es obligatorio.';
  } else if (precioNum <= 0) {
    errs.precio = 'El precio debe ser un número positivo mayor a 0.';
  }

  return errs;
});

const isFormValid = computed(() => Object.keys(errors.value).length === 0);

const markAllTouched = () => {
  touched.sku = true;
  touched.nombre = true;
  touched.stock = true;
  touched.precio = true;
};

const handleSubmit = () => {
  markAllTouched();
  if (!isFormValid.value || !isOnline.value || props.isSubmitting) return;

  emit('submit', {
    sku: formData.sku.trim().toUpperCase(),
    nombre: formData.nombre.trim(),
    stock: parseInt(formData.stock, 10),
    precio: parseFloat(formData.precio)
  });
};
</script>

<template>
  <form class="product-form" @submit.prevent="handleSubmit" novalidate>
    <!-- Alerta backend si existió conflicto 409 o similar -->
    <div v-if="backendError" class="form-alert alert-error" role="alert">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <div>
        <div class="alert-title">
          {{ typeof backendError === 'string' ? backendError : (backendError.message || 'Error al guardar el producto') }}
        </div>
        <ul v-if="backendError.details && backendError.details.length" class="alert-details">
          <li v-for="(d, i) in backendError.details" :key="i">{{ d }}</li>
        </ul>
      </div>
    </div>

    <!-- Advertencia offline en formulario -->
    <div v-if="!isOnline" class="form-alert alert-warning" role="alert">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
      <div>
        <strong>Modo sin conexión detectado:</strong> El guardado está deshabilitado para evitar pérdida de datos. Conéctate a internet para continuar.
      </div>
    </div>

    <!-- Campo: SKU -->
    <div class="form-group" :class="{ 'has-error': touched.sku && errors.sku }">
      <label for="item-sku" class="form-label">
        Código SKU <span class="required">*</span>
      </label>
      <input
        id="item-sku"
        v-model="formData.sku"
        type="text"
        class="form-control"
        placeholder="Ej: MON-4K-01"
        :disabled="isSubmitting || !isOnline"
        @blur="touched.sku = true"
        autocomplete="off"
      />
      <span v-if="touched.sku && errors.sku" class="error-msg">
        {{ errors.sku }}
      </span>
      <span v-else class="help-msg">Identificador único de inventario (se guardará en mayúsculas).</span>
    </div>

    <!-- Campo: Nombre -->
    <div class="form-group" :class="{ 'has-error': touched.nombre && errors.nombre }">
      <label for="item-nombre" class="form-label">
        Nombre del Producto <span class="required">*</span>
      </label>
      <input
        id="item-nombre"
        v-model="formData.nombre"
        type="text"
        class="form-control"
        placeholder="Ej: Monitor LG UltraFine 4K"
        :disabled="isSubmitting || !isOnline"
        @blur="touched.nombre = true"
      />
      <span v-if="touched.nombre && errors.nombre" class="error-msg">
        {{ errors.nombre }}
      </span>
    </div>

    <!-- Fila con Stock y Precio -->
    <div class="form-row">
      <!-- Campo: Stock -->
      <div class="form-group" :class="{ 'has-error': touched.stock && errors.stock }">
        <label for="item-stock" class="form-label">
          Cantidad en Stock <span class="required">*</span>
        </label>
        <input
          id="item-stock"
          v-model.number="formData.stock"
          type="number"
          min="0"
          step="1"
          class="form-control"
          placeholder="0"
          :disabled="isSubmitting || !isOnline"
          @blur="touched.stock = true"
        />
        <span v-if="touched.stock && errors.stock" class="error-msg">
          {{ errors.stock }}
        </span>
      </div>

      <!-- Campo: Precio -->
      <div class="form-group" :class="{ 'has-error': touched.precio && errors.precio }">
        <label for="item-precio" class="form-label">
          Precio Unitario ($) <span class="required">*</span>
        </label>
        <input
          id="item-precio"
          v-model.number="formData.precio"
          type="number"
          min="0.01"
          step="0.01"
          class="form-control"
          placeholder="0.00"
          :disabled="isSubmitting || !isOnline"
          @blur="touched.precio = true"
        />
        <span v-if="touched.precio && errors.precio" class="error-msg">
          {{ errors.precio }}
        </span>
      </div>
    </div>

    <!-- Botones de Acción -->
    <div class="form-actions">
      <button
        type="button"
        class="btn btn-secondary"
        :disabled="isSubmitting"
        @click="$emit('cancel')"
      >
        Cancelar
      </button>

      <button
        type="submit"
        class="btn btn-primary"
        :disabled="isSubmitting || !isOnline || (!isFormValid && (touched.sku || touched.nombre))"
      >
        <span v-if="isSubmitting" class="spinner-small"></span>
        <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
          <polyline points="17 21 17 13 7 13 7 21"></polyline>
          <polyline points="7 3 7 8 15 8"></polyline>
        </svg>
        {{ isSubmitting ? 'Guardando en API...' : submitButtonText }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.product-form {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.form-alert {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}

.alert-error {
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
}

.alert-warning {
  background-color: #fefce8;
  border: 1px solid #fef08a;
  color: #854d0e;
}

.alert-title {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.alert-details {
  margin: 0.25rem 0 0 1.25rem;
  padding: 0;
  font-size: 0.85rem;
}

.form-group {
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.4rem;
}

.required {
  color: #ef4444;
}

.form-control {
  padding: 0.65rem 0.9rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #0f172a;
  outline: none;
  transition: all 0.2s ease;
}

.form-control:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.has-error .form-control {
  border-color: #ef4444;
  background-color: #fffaf0;
}

.has-error .form-control:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
}

.error-msg {
  color: #ef4444;
  font-size: 0.8rem;
  margin-top: 0.35rem;
  font-weight: 500;
}

.help-msg {
  color: #64748b;
  font-size: 0.8rem;
  margin-top: 0.35rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #f1f5f9;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.4rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #f1f5f9;
  color: #475569;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #e2e8f0;
}

.btn-primary {
  background-color: #2563eb;
  color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
  background-color: #1d4ed8;
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid #ffffff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 640px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>

