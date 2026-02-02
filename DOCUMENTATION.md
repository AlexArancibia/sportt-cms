# DOCUMENTATION (fuente de verdad)

> **Última actualización:** 2026-01-26  
> Esta documentación está **alineada al código actual** del frontend (principalmente `lib/axiosConfig.ts`, `lib/apiHelpers.ts`, `stores/mainStore.ts`, `stores/authStore.ts`, `stores/statisticsStore.ts`).

## Objetivo

Este repo (`sportt-cms`) es el **panel CMS** (Next.js) para administrar tiendas, productos, órdenes, cupones, contenido, kardex y estadísticas consumiendo un backend vía HTTP.

## Requisitos y scripts

- Node.js (recomendado: versión moderna compatible con Next.js 15)
- pnpm

Scripts (ver `package.json`):

- `pnpm install`
- `pnpm run dev`
- `pnpm run build`
- `pnpm run start`
- `pnpm run lint`

## Variables de entorno

El cliente HTTP se configura en `lib/axiosConfig.ts`.

### Requeridas

- `NEXT_PUBLIC_BACKEND_ENDPOINT`: Base URL del backend (ej: `http://localhost:3001` o `https://api.tudominio.com`)

### Opcionales

- `NEXT_PUBLIC_API_KEY`: Fallback de autenticación si no existe token en `localStorage`.

## Autenticación (cómo funciona en este frontend)

### Token y persistencia

- Login: `POST /auth/login`
- El backend devuelve `{ access_token, userInfo, stores }` (posiblemente encapsulado en `{ data: ... }`)
- El frontend persiste:
  - `access_token` (JWT) en `localStorage`
  - `user` en `localStorage`
  - `stores` en `localStorage`
  - `currentStoreId` en `localStorage`

### Header de auth que envía el frontend

En cada request, `apiClient` intenta agregar:

- `Authorization: Bearer <access_token>` (si existe), o
- `Authorization: Bearer <NEXT_PUBLIC_API_KEY>` (si no existe token y hay API key)

> Nota: en el código actual **no se usa** `X-Public-Key` desde el frontend. Si el backend aún lo soporta, es una decisión del backend; este cliente hoy opera con `Authorization`.

## Contrato de respuestas del backend (importante)

El frontend está preparado para **dos formatos**:

1) Respuesta encapsulada:

```json
{ "success": true, "statusCode": 200, "message": "...", "data": { } }
```

2) Respuesta “directa” (el payload viene en `response.data`)

Helpers:
- `extractApiData(...)` en `lib/apiHelpers.ts`
- `extractPaginatedData(...)` en `lib/apiHelpers.ts`

## Convenciones comunes (paginación / filtros)

### Paginación (cuando aplica)

Varios listados esperan:
- `page`
- `limit`
- `sortBy`
- `sortOrder`

Y el backend suele devolver:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

## Módulos y endpoints usados (según el código)

> **Regla práctica:** si necesitas “la verdad” de un endpoint, busca el string en `stores/mainStore.ts` o `stores/statisticsStore.ts`.

### Auth

- `POST /auth/login`

### Categorías (CMS)

- Listado paginado: `GET /categories/:storeId?...`
- Crear: `POST /categories/:storeId`
- Actualizar: `PUT /categories/:storeId/:id`
- Eliminar: `DELETE /categories/:storeId/:id` (incluye borrado recursivo de subcategorías en el frontend)

### Productos (CMS)

- Listado paginado por tienda: `GET /products/:storeId?...`
  - Soporta `page`, `limit`, `sortBy`, `sortOrder`, `query`
  - También: `vendor[]`, `status[]`, `categorySlugs[]`, `collectionIds[]`, `minPrice`, `maxPrice`, `currencyId`
- Obtener por ID: `GET /products/:storeId/:productId`
- Crear: `POST /products/:storeId`
- Actualización parcial: `PATCH /products/:storeId/:id`
- Eliminar: `DELETE /products/:storeId/:id`
- Regla de eliminación (backend actual): **solo se permite si ninguna variante tiene órdenes** (`orderItems > 0` bloquea). Si se elimina, se borran también variantes/precios y el **Kardex completo** (incluyendo movimientos).
- Archivar / desarchivar: `PATCH /products/:storeId/:id/status`
- Vendors únicos: `GET /products/:storeId/vendors`

Variantes:
- Listado (global): `GET /product-variants`
- Crear: `POST /products/:storeId/:productId/variants`
- Actualizar: `PATCH /products/:storeId/variants/:id`
- Eliminar: `DELETE /products/:storeId/variants/:id`
- Regla de eliminación de variante (backend actual): **solo se permite si la variante no tiene órdenes** (`orderItems > 0` bloquea). Si se elimina, se borra también su **Kardex completo** (incluyendo movimientos).

### Colecciones

- Listado: `GET /collections/:storeId`
- Eliminar: `DELETE /collections/:storeId/:id`

### Órdenes

- Listado por tienda (paginado): `GET /orders/:storeId` (usa `extractPaginatedData`)
- Crear: `POST /orders/:storeId`
- Actualizar: `PUT /orders/:storeId/:id`
- Eliminar: `DELETE /orders/:storeId/:id`
- Buscar por número: `GET /orders/:storeId/number/:orderNumber`
- Buscar por temporal: `GET /orders/:storeId/temporal/:temporalOrderId`
- Actualizar estados: `PATCH /orders/:storeId/:orderId/status`

Refunds:
- Crear refund: `POST /refunds`

### Clientes

- Listado (global): `GET /customers`
- Listado por tienda: `GET /customers?storeId=:storeId`
- Crear: `POST /customers`
- Actualizar: `PUT /customers/:id`
- Eliminar: `DELETE /customers/:id`

### Cupones

- Crear: `POST /coupons/:storeId`
- Actualizar: `PUT /coupons/:storeId/:id`
- Eliminar: `DELETE /coupons/:storeId/:id`

### Métodos de envío

- Listado (global): `GET /shipping-methods`
- Listado por tienda: `GET /shipping-methods/:storeId`
- Crear: `POST /shipping-methods/:storeId`
- Actualizar: `PATCH /shipping-methods/:storeId/:id`
- Eliminar: `DELETE /shipping-methods/:storeId/:id`

### Proveedores de pago / transacciones

- Proveedores por tienda: `GET /payment-providers/:storeId?status=all`
- Crear proveedor: `POST /payment-providers/:storeId`
- Actualizar proveedor: `PUT /payment-providers/:storeId/:id`
- Eliminar proveedor: `DELETE /payment-providers/:id`

- Transacciones (global): `GET /payment-transactions`
- Crear transacción: `POST /payment-transactions`
- Actualizar transacción: `PUT /payment-transactions/:id`

### Contenido (CMS)

- Listado (global): `GET /contents`
- Listado por tienda: `GET /contents/:storeId`
- Obtener: `GET /contents/:storeId/:id`
- Crear: `POST /contents/:storeId`

### Hero sections / Card sections / Team sections

Hero sections:
- `PUT /hero-sections/:storeId/:id`
- `DELETE /hero-sections/:storeId/:id`

Card sections:
- Listado (global): `GET /card-section`
- Listado por tienda: `GET /card-section/:storeId`
- Obtener: `GET /card-section/:storeId/:id`
- Crear: `POST /card-section/:storeId`
- Actualizar: `PATCH /card-section/:storeId/:id`
- Eliminar: `DELETE /card-section/:storeId/:id`

Team sections:
- Listado (global): `GET /team-sections`
- Listado por tienda: `GET /team-sections/:storeId`
- CRUD: `POST /team-sections`, `PATCH /team-sections/:id`, `DELETE /team-sections/:id`

### Kardex

- General (con filtros): `GET /kardex/:storeId/general?...`

Notas funcionales (frontend):
- Existe validación de integridad en `app/(dashboard)/kardex/_components/kardexValidation.ts`.
- Para cálculos “on the fly”, el frontend puede calcular valores desde `finalStock` (ver `kardexHelpers.ts`).

### Statistics

El store de estadísticas construye URLs con query params (`startDate`, `endDate`, `currencyId`):

- `GET /statistics/:storeId/overview`
- `GET /statistics/:storeId/sales`
- `GET /statistics/:storeId/products`
- `GET /statistics/:storeId/customers`
- `GET /statistics/:storeId/inventory`
- `GET /statistics/:storeId/trends?groupBy=day|week|month|year...`

## Notas de UX / reglas internas importantes

### Límite de imágenes (productos)

Hay un control de límite de imágenes en la galería de productos (comportamiento de subida parcial y mensajes de toast). La regla usual es **máximo 10** en media gallery.

### Validaciones de productos (frontend)

El hook `useProductValidation.ts` centraliza validaciones (slug, SKU, inventario, precios, monedas aceptadas, etc.). Si el backend cambia reglas, este es el primer lugar a revisar.

### Exportación PDF

La exportación PDF de productos se apoya en `lib/pdf/*` y en componentes de `app/(dashboard)/products/_components/export/*` y está pensada para uso manual (print dialog).

