# 📦 Aplicación SPA / PWA con Vue 3 y Consumo de API REST en Tiempo Real

> **Unidad 3: Programación Web**  
> **Tema:** Construcción de una Single Page Application (SPA) y Progressive Web App (PWA) con Vue 3, consumo centralizado de API REST, manejo de estados de interfaz, prevención de condiciones de carrera y soporte offline seguro.

---

## 📋 Resumen Ejecutivo

Esta aplicación web implementa un sistema moderno de **Gestión de Inventario en Tiempo Real** desarrollado con **Vue 3 (Composition API con `<script setup>`)** y empaquetado con **Vite**, consumiendo la API REST con base de datos **SQLite3** desarrollada en la unidad anterior.

La aplicación cumple rigurosamente con los 6 requerimientos clave de la actividad académica:
1. **SPA con Vue 3:** Enrutamiento del lado del cliente con `vue-router` e historial HTML5.
2. **Arquitectura desacoplada de componentes:** Separación estricta entre vistas inteligentes (*Smart Views*) y componentes de presentación (*Dumb Components*), con comunicación mediante `props` y `events`.
3. **Manejo de los 4 estados de UI:** Carga (`loading`), Error (`error`), Vacío (`empty`) y Éxito (`success`) centralizados en `StatusFeedback.vue` y listas con claves inmutables estables (`:key="item.id"`).
4. **Servicio HTTP centralizado y seguro:** Cliente `apiClient.js` con validación estricta de `response.ok`, mapeo uniforme de excepciones (`400`, `404`, `409 Conflict`) y prevención de condiciones de carrera mediante `AbortController`.
5. **PWA e Instalación:** Archivo `manifest.webmanifest` con iconos normativos (192x192 y 512x512 maskable) y botón interactivo de instalación en el navegador.
6. **Soporte Offline Limitado y Seguro:** Service Worker (`sw.js`) con estrategia **Cache-First** para el App Shell, estrategia **Network-First** con fallback a caché para consultas del inventario, y bloqueo seguro de mutaciones (`POST`/`PUT`/`DELETE`) durante desconexión de red.

---

## 🏛️ Estructura del Repositorio

```text
UNIDAD 3 WEb/
├── backend_pw2/               # Servidor API REST (Unidad 2)
│   ├── src/
│   │   ├── app.js             # Configuración de Express, CORS y sesiones
│   │   ├── server.js          # Servidor HTTP y Socket.io (puerto 3000)
│   │   ├── config/database.js # Conexión SQLite3 parametrizada
│   │   ├── routes/items.routes.js # Endpoints CRUD, auditoría y exportación
│   │   └── utils/validator.js # Validaciones e inmutabilidad
│   ├── inventario.db          # Base de datos local SQLite3 con datos de prueba
│   └── package.json           # Dependencias del backend
├── frontend/                  # Aplicación SPA / PWA (Unidad 3)
│   ├── public/
│   │   ├── favicon.ico
│   │   ├── icon-192x192.png   # Iconos normativos para PWA
│   │   ├── icon-512x512.png
│   │   ├── manifest.webmanifest # Manifiesto de instalación PWA
│   │   └── sw.js              # Service Worker (Cache-First y Network-First)
│   ├── src/
│   │   ├── components/        # Componentes de presentación (Props & Events)
│   │   │   ├── ConfirmModal.vue   # Modal accesible de confirmación
│   │   │   ├── ItemCard.vue       # Tarjeta de producto con claves estables
│   │   │   ├── ItemForm.vue       # Formulario reactivo con validación
│   │   │   ├── Navbar.vue         # Barra de navegación e instalador PWA
│   │   │   ├── OfflineAlert.vue   # Banner reactivo de modo offline
│   │   │   └── StatusFeedback.vue # Gobernador de los 4 estados de UI
│   │   ├── views/             # Vistas de navegación SPA (Smart Views)
│   │   │   ├── AuditView.vue      # Auditoría de sesión y exportación CSV/JSON
│   │   │   ├── InventoryView.vue  # Catálogo con buscador, filtros y WebSocket
│   │   │   ├── ItemCreateView.vue # Registro de nuevos productos
│   │   │   ├── ItemDetailView.vue # Ficha detallada con valoración
│   │   │   ├── ItemEditView.vue   # Edición de existencias
│   │   │   └── NotFoundView.vue   # Manejador 404
│   │   ├── services/
│   │   │   ├── apiClient.js   # Fetch centralizado + AbortController + response.ok
│   │   │   └── itemsService.js # Métodos CRUD tipados y cliente Socket.io
│   │   ├── router/index.js    # Enrutador vue-router con lazy-loading
│   │   ├── App.vue            # Componente raíz y App Shell
│   │   └── main.js            # Inicialización y registro de Service Worker
│   ├── vite.config.js         # Configuración Vite con proxy a backend
│   └── package.json           # Dependencias del frontend
├── INFORME_TECNICO.md         # Informe técnico formal de 2 páginas con diagramas
└── package.json               # Scripts maestros del proyecto
```

---

## 🚀 Guía de Instalación y Ejecución Rápida

### Requisitos Previos
* **Node.js** (v18 o superior).
* **NPM** (incluido con Node.js).

---

### Paso 1: Iniciar el Servidor Backend (API REST)

Abra una terminal en la raíz del proyecto y ejecute:

```bash
cd backend_pw2
npm install
npm start
```

El servidor backend iniciará en:
👉 **`http://localhost:3000`**  
*(La base de datos SQLite3 `inventario.db` incluye 5 productos iniciales listos para evaluar).*

---

### Paso 2: Iniciar la Aplicación Frontend (SPA / PWA)

En una **segunda terminal**, navegue a la carpeta del frontend y ejecute:

```bash
cd frontend
npm install
npm run dev
```

La aplicación SPA/PWA estará disponible en:
👉 **`http://localhost:5173`**

---

## 🧪 Demostración de Criterios Técnicos Evaluados

### 1. Navegación SPA y Formularios
* Navegue entre el **Catálogo**, **Nuevo Producto** y **Auditoría & Exportación** sin recargar la página.
* En el formulario de registro (`/items/nuevo`), intente ingresar un stock negativo o precio cero; la validación reactiva bloqueará el envío y señalará el campo.
* Si intenta registrar un producto con un SKU existente (ej. `LAPTOP-01`), la API responderá con `409 Conflict` y la SPA mostrará el error estructurado sin colapsar.

### 2. Prevención de Condiciones de Carrera (Race Conditions)
* En el buscador de la vista principal, escriba rápidamente cualquier texto (ej. `Monitor`). 
* En la pestaña *Red (Network)* de las herramientas de desarrollador observará que las peticiones intermedias son canceladas automáticamente (`(canceled)` mediante `AbortController`), garantizando que la UI solo dibuje el resultado final solicitado.

### 3. Prueba de la Experiencia Offline (PWA & Service Worker)
1. Abra la aplicación en Google Chrome o Edge en `http://localhost:5173`.
2. Abra las Herramientas de Desarrollador (`F12`) $\rightarrow$ pestaña **Network** (Red) y marque la casilla **Offline** (Sin conexión).
3. **Resultado esperado:**
   * Aparece inmediatamente el banner superior dorado: **`MODO OFFLINE ACTIVO`**.
   * El catálogo sigue cargando y mostrando los productos gracias a los datos cacheados por el Service Worker (`API_CACHE_NAME`).
   * Los botones de edición y eliminación se deshabilitan preventivamente para proteger la consistencia de la base de datos relacional SQLite3.
4. Desmarque la casilla **Offline**: el sistema restablece la conectividad en vivo.

### 4. Instalación de la PWA
* En la esquina superior derecha de la barra de navegación o en la barra de direcciones del navegador aparecerá el botón **Instalar App**, permitiendo anclar la aplicación al escritorio o pantalla de inicio en modo *Standalone*.

---

## 📄 Entregables Incluidos

1. **Código Fuente Completo:** Estructurado, modular y comentado con JSDoc.
2. **Informe Técnico:** Disponible en [`INFORME_TECNICO.md`](./INFORME_TECNICO.md) con los diagramas arquitectónicos en Mermaid, estrategia de API y diseño de caché offline.

