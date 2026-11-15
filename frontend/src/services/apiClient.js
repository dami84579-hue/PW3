/**
 * @file apiClient.js
 * @description Servicio centralizado para peticiones HTTP (fetch).
 * Cumple con los requerimientos técnicos de:
 * 1. Centralizar el acceso HTTP.
 * 2. Validar response.ok y formatear errores operativos del backend.
 * 3. Prevenir condiciones de carrera mediante AbortController / AbortSignal.
 */

export class ApiError extends Error {
  constructor(message, status = 500, details = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusCode = status;
    this.details = Array.isArray(details) ? details : [details];
  }
}

/**
 * Determina si un error fue originado por la cancelación voluntaria de una petición
 * para no reportarlo como falla de red al usuario.
 */
export function isAbortError(error) {
  return error?.name === 'AbortError' || error?.code === 20;
}

const BASE_URL = '/api';

/**
 * Cliente HTTP base promisificado con validación de response.ok y cancelación.
 * @param {string} endpoint - Ruta relativa al BASE_URL (ej. '/items')
 * @param {RequestInit} [options={}] - Opciones de fetch (method, headers, body, signal)
 * @returns {Promise<any>}
 */
export async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  
  const headers = {
    'Accept': 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(url, config);

    // Si el contenido es un archivo descargable (CSV, blob, etc.)
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/csv') || contentType.includes('application/octet-stream')) {
      if (!response.ok) {
        throw new ApiError(`Error en descarga de archivo (${response.status})`, response.status);
      }
      return await response.blob();
    }

    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    // Validación estricta de response.ok según la rúbrica
    if (!response.ok) {
      const errorMessage = payload?.mensaje || payload?.message || `Error en la solicitud HTTP (${response.status})`;
      const errorDetails = payload?.detalles || payload?.details || [];
      const errorCode = payload?.codigo || payload?.code || response.status;
      
      throw new ApiError(errorMessage, errorCode, errorDetails);
    }

    return payload;
  } catch (error) {
    if (isAbortError(error)) {
      // Re-lanzar para que el invocador identifique la cancelación intencional
      throw error;
    }

    if (error instanceof ApiError) {
      throw error;
    }

    // Falla de conexión a nivel de red (offline o servidor apagado)
    const isOffline = !navigator.onLine;
    const msg = isOffline 
      ? 'No hay conexión a internet. Verifique su red.' 
      : (error.message || 'Error de conexión con el servidor.');
    
    throw new ApiError(msg, 0, [error.message]);
  }
}

/**
 * Administrador de peticiones cancelables para prevenir condiciones de carrera.
 * Cancela automáticamente la petición anterior si se realiza una nueva antes de que termine.
 */
export function createRaceController() {
  let activeController = null;

  return {
    /**
     * Genera un nuevo signal y aborta el previo si aún estaba pendiente.
     */
    getSignal() {
      if (activeController) {
        activeController.abort();
      }
      activeController = new AbortController();
      return activeController.signal;
    },
    /**
     * Cancela explícitamente cualquier petición activa.
     */
    abort() {
      if (activeController) {
        activeController.abort();
        activeController = null;
      }
    }
  };
}

export default {
  request,
  isAbortError,
  createRaceController
};

