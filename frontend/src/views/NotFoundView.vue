<script setup>
import { useRouter } from 'vue-router';
const router = useRouter();
</script>

<template>
  <div class="not-found-view">
    <div class="not-found-card">
      <div class="error-code">404</div>
      <h1 class="error-title">Página No Encontrada</h1>
      <p class="error-desc">La ruta a la que intenta acceder no existe en la aplicación de inventario.</p>
      <button type="button" class="btn btn-primary" @click="router.push('/')">
        Regresar al Inicio
      </button>
    </div>
  </div>
</template>

<style scoped>
.not-found-view {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.not-found-card {
  text-align: center;
  max-width: 440px;
}

.error-code {
  font-size: 5rem;
  font-weight: 800;
  color: #2563eb;
  line-height: 1;
  margin-bottom: 0.5rem;
}

.error-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.75rem 0;
}

.error-desc {
  color: #64748b;
  font-size: 0.95rem;
  margin: 0 0 1.5rem 0;
}

.btn {
  padding: 0.65rem 1.4rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  background-color: #2563eb;
  color: #ffffff;
}

.btn:hover {
  background-color: #1d4ed8;
}
</style>

