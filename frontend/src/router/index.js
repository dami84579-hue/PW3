/**
 * @file router/index.js
 * @description Configuración de enrutamiento SPA con vue-router.
 * Utiliza historial HTML5 (createWebHistory) y carga perezosa de rutas.
 */

import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'inventory',
    component: () => import('@/views/InventoryView.vue'),
    meta: { title: 'Catálogo de Inventario' }
  },
  {
    path: '/items/nuevo',
    name: 'item-create',
    component: () => import('@/views/ItemCreateView.vue'),
    meta: { title: 'Registrar Producto' }
  },
  {
    path: '/items/:id',
    name: 'item-detail',
    component: () => import('@/views/ItemDetailView.vue'),
    meta: { title: 'Detalle de Producto' }
  },
  {
    path: '/items/:id/editar',
    name: 'item-edit',
    component: () => import('@/views/ItemEditView.vue'),
    meta: { title: 'Editar Producto' }
  },
  {
    path: '/auditoria',
    name: 'audit',
    component: () => import('@/views/AuditView.vue'),
    meta: { title: 'Auditoría y Exportación' }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: '404 - No Encontrado' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  }
});

router.afterEach((to) => {
  if (to.meta?.title) {
    document.title = `${to.meta.title} | Inventario PWA`;
  }
});

export default router;

