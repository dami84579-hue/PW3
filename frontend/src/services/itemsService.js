/**
 * @file itemsService.js
 * @description Módulo de servicio para la entidad Productos/Items del inventario.
 * Utiliza el apiClient centralizado y provee métodos tipados y seguros.
 */

import { request } from './apiClient';
import { io } from 'socket.io-client';

export const itemsService = {
  /**
   * Obtiene la lista completa de productos.
   * Admite un signal opcional para prevenir condiciones de carrera.
   * @param {AbortSignal} [signal]
   * @returns {Promise<Array>}
   */
  async getItems(signal) {
    const res = await request('/items', {
      method: 'GET',
      signal
    });
    return res?.datos || res?.data || [];
  },

  /**
   * Obtiene un producto por su identificador primario.
   * @param {number|string} id 
   * @param {AbortSignal} [signal]
   * @returns {Promise<Object>}
   */
  async getItemById(id, signal) {
    const res = await request(`/items/${id}`, {
      method: 'GET',
      signal
    });
    return res?.datos || res?.data;
  },

  /**
   * Registra un nuevo producto en el inventario.
   * @param {{ sku: string, nombre: string, stock: number, precio: number }} data 
   * @returns {Promise<Object>}
   */
  async createItem(data) {
    const res = await request('/items', {
      method: 'POST',
      body: JSON.stringify({
        sku: String(data.sku).trim().toUpperCase(),
        nombre: String(data.nombre).trim(),
        stock: Number(data.stock),
        precio: Number(data.precio)
      })
    });
    return res?.datos || res?.data;
  },

  /**
   * Actualiza los datos de un producto existente.
   * @param {number|string} id 
   * @param {{ sku: string, nombre: string, stock: number, precio: number }} data 
   * @returns {Promise<Object>}
   */
  async updateItem(id, data) {
    const res = await request(`/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        sku: String(data.sku).trim().toUpperCase(),
        nombre: String(data.nombre).trim(),
        stock: Number(data.stock),
        precio: Number(data.precio)
      })
    });
    return res?.datos || res?.data;
  },

  /**
   * Elimina un producto por su ID.
   * @param {number|string} id 
   * @returns {Promise<Object>}
   */
  async deleteItem(id) {
    const res = await request(`/items/${id}`, {
      method: 'DELETE'
    });
    return res?.datos || res?.data;
  },

  /**
   * Consulta el registro de auditoría de la sesión actual.
   * @returns {Promise<Object>}
   */
  async getSessionAudit() {
    return await request('/items/session-audit', {
      method: 'GET'
    });
  },

  /**
   * Descarga la exportación del inventario en formato CSV o JSON.
   * @param {'json'|'csv'} format 
   */
  async downloadExport(format = 'json') {
    const blob = await request(`/items/export?format=${format}`, {
      method: 'GET'
    });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventario_${new Date().toISOString().slice(0, 10)}.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  }
};

/**
 * Cliente WebSocket opcional para sincronización en tiempo real vía Socket.io.
 * Mantiene la reactividad de la SPA cuando ocurren cambios en el backend.
 */
let socketInstance = null;

export function connectInventorySocket(onEvent) {
  if (typeof window === 'undefined') return null;

  try {
    if (!socketInstance) {
      socketInstance = io({
        path: '/socket.io',
        reconnectionAttempts: 5,
        timeout: 5000,
        transports: ['websocket', 'polling']
      });
    }

    if (onEvent) {
      socketInstance.on('inventario:cambio', onEvent);
    }

    return socketInstance;
  } catch (err) {
    console.warn('[Socket.io] No se pudo inicializar WebSocket:', err.message);
    return null;
  }
}

