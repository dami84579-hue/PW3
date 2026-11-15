<script setup>
/**
 * @file AuditView.vue
 * @description Vista para la auditoría de sesión y exportación de datos (JSON / CSV).
 * Consume los endpoints GET /api/items/session-audit y GET /api/items/export.
 */

import { ref, onMounted } from 'vue';
import { itemsService } from '@/services/itemsService';
import StatusFeedback from '@/components/StatusFeedback.vue';

const auditData = ref(null);
const loading = ref(true);
const error = ref(null);
const exporting = ref(false);

const fetchAudit = async () => {
  loading.value = true;
  error.value = null;

  try {
    const data = await itemsService.getSessionAudit();
    auditData.value = data;
  } catch (err) {
    console.error('[AuditView] Error:', err);
    error.value = err;
  } finally {
    loading.value = false;
  }
};

const handleDownload = async (format) => {
  exporting.value = true;
  try {
    await itemsService.downloadExport(format);
  } catch (err) {
    alert(`Error al exportar inventario en formato ${format.toUpperCase()}: ${err.message}`);
  } finally {
    exporting.value = false;
  }
};

const formatDate = (isoString) => {
  if (!isoString) return '-';
  try {
    return new Date(isoString).toLocaleString('es-EC', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return isoString;
  }
};

/**
 * Traduce y formatea los detalles del log a texto comprensible y amigable para el usuario.
 */
const formatReadableDetails = (log) => {
  const d = log?.detalles || log?.payload || {};
  const accion = log?.accion || log?.action || '';

  if (d.formato) {
    return `Exportación en formato ${String(d.formato).toUpperCase()} (${d.totalProductos || 0} productos incluidos).`;
  }

  if (accion.includes('CREAR') || accion.includes('CREADO')) {
    return `Registrado: "${d.nombre}" (SKU: ${d.sku}) • Stock: ${d.stock} uds. • Precio: $${d.precio}`;
  }

  if (accion.includes('ACTUALIZAR') || accion.includes('ACTUALIZADO')) {
    const act = d.actualizado || d;
    return `Actualizado a: "${act.nombre}" (SKU: ${act.sku}) • Stock: ${act.stock} uds. • Precio: $${act.precio}`;
  }

  if (accion.includes('ELIMINAR') || accion.includes('ELIMINADO')) {
    return `Eliminado: "${d.nombre || 'Producto'}" (SKU: ${d.sku || d.id || '-'})`;
  }

  if (d.total !== undefined) {
    return `Consulta de inventario: ${d.total} productos listados.`;
  }

  if (d.idProducto) {
    return `Consulta individual de producto ID #${d.idProducto} (SKU: ${d.sku || '-'}).`;
  }

  return null;
};

onMounted(() => {
  fetchAudit();
});
</script>

<template>
  <div class="audit-view">
    <header class="view-header">
      <div class="header-titles">
        <h1 class="view-title">Auditoría de Sesión & Exportación</h1>
        <p class="view-desc">
          Registro de trazabilidad de acciones y herramientas de extracción de datos.
        </p>
      </div>

      <div class="export-actions">
        <button
          type="button"
          class="btn btn-export btn-csv"
          :disabled="exporting"
          @click="handleDownload('csv')"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Exportar CSV
        </button>

        <button
          type="button"
          class="btn btn-export btn-json"
          :disabled="exporting"
          @click="handleDownload('json')"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Exportar JSON
        </button>
      </div>
    </header>

    <!-- Resumen de Sesión -->
    <section v-if="auditData" class="session-summary-card">
      <div class="summary-item">
        <span class="summary-label">Identificador de Sesión Activa</span>
        <span class="summary-value session-id">{{ auditData.idSesion || auditData.sessionId }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Total de Acciones Registradas</span>
        <span class="summary-value">{{ auditData.totalAcciones || 0 }} eventos</span>
      </div>
    </section>

    <!-- Lista de Auditoría con StatusFeedback -->
    <StatusFeedback
      :loading="loading"
      :error="error"
      :is-empty="!loading && !error && (!auditData?.historial || auditData.historial.length === 0)"
      empty-title="Sin acciones auditadas"
      empty-message="Aún no se han ejecutado operaciones de inventario en la sesión actual de navegación."
      @retry="fetchAudit"
    >
      <div class="audit-table-wrapper">
        <table class="audit-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Acción Ejecutada</th>
              <th>Fecha y Hora</th>
              <th>Detalles del Registro</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="log in (auditData?.historial || [])"
              :key="log.id"
              class="audit-row"
            >
              <td class="log-id">{{ log.id }}</td>
              <td>
                <span class="action-tag">{{ log.accion || log.action }}</span>
              </td>
              <td class="log-date">{{ formatDate(log.timestamp) }}</td>
              <td class="log-payload">
                <div class="human-readable-text">
                  <span class="detail-badge-icon">ℹ️</span>
                  <span>{{ formatReadableDetails(log) || 'Acción registrada sin parámetros adicionales' }}</span>
                </div>
                <details class="json-accordion">
                  <summary class="json-summary">Ver estructura JSON original</summary>
                  <pre class="json-preview">{{ JSON.stringify(log.detalles || log.payload, null, 2) }}</pre>
                </details>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </StatusFeedback>
  </div>
</template>

<style scoped>
.audit-view {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.view-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.4rem 0;
}

.view-desc {
  color: #64748b;
  margin: 0;
  font-size: 0.95rem;
}

.export-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-export {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.1rem;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.btn-csv {
  background-color: #059669;
  color: #ffffff;
}
.btn-csv:hover:not(:disabled) {
  background-color: #047857;
}

.btn-json {
  background-color: #4f46e5;
  color: #ffffff;
}
.btn-json:hover:not(:disabled) {
  background-color: #4338ca;
}

.btn-export:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.session-summary-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  display: flex;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.summary-item {
  display: flex;
  flex-direction: column;
}

.summary-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  margin-bottom: 0.35rem;
}

.summary-value {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
}

.session-id {
  font-family: monospace;
  font-size: 0.95rem;
  color: #2563eb;
}

.audit-table-wrapper {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow-x: auto;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.audit-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.9rem;
}

.audit-table th {
  background-color: #f8fafc;
  padding: 0.9rem 1.25rem;
  font-weight: 600;
  color: #475569;
  border-bottom: 1px solid #e2e8f0;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.audit-table td {
  padding: 0.85rem 1.25rem;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: top;
}

.audit-row:hover {
  background-color: #f8fafc;
}

.log-id {
  font-weight: 700;
  color: #94a3b8;
}

.action-tag {
  display: inline-block;
  background-color: #eff6ff;
  color: #2563eb;
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  font-family: monospace;
}

.log-date {
  color: #64748b;
  font-size: 0.85rem;
  white-space: nowrap;
}

.human-readable-text {
  font-size: 0.88rem;
  color: #1e293b;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.35rem;
  line-height: 1.4;
}

.detail-badge-icon {
  font-size: 0.85rem;
}

.json-accordion {
  margin-top: 0.35rem;
}

.json-summary {
  font-size: 0.75rem;
  color: #2563eb;
  cursor: pointer;
  user-select: none;
  font-weight: 600;
}

.json-summary:hover {
  text-decoration: underline;
}

.json-preview {
  margin: 0.4rem 0 0 0;
  font-family: monospace;
  font-size: 0.78rem;
  color: #334155;
  background: #f8fafc;
  padding: 0.4rem 0.6rem;
  border-radius: 6px;
  max-width: 420px;
  max-height: 120px;
  overflow: auto;
  border: 1px solid #e2e8f0;
}
</style>

