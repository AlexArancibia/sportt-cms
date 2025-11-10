# Documentación Completa de la API de Cupones

## 📋 Tabla de Contenidos
1. [Información General](#información-general)
2. [Endpoints de Cupones](#1-endpoints-de-cupones)
3. [Parámetros de Búsqueda y Paginación](#2-parámetros-de-búsqueda-y-paginación)
4. [Estructuras de Datos](#3-estructuras-de-datos)
5. [Validaciones y Restricciones](#4-validaciones-y-restricciones)
6. [Códigos de Estado HTTP](#5-códigos-de-estado-http)
7. [Errores y Manejo de Excepciones](#6-errores-y-manejo-de-excepciones)
8. [Ejemplos de Uso](#7-ejemplos-de-uso)
9. [Notas Importantes](#8-notas-importantes)

---

## Información General

### Base URL
```
https://api.tudominio.com/coupons
```

### Autenticación y Guards

**Headers requeridos:**
```
X-Public-Key: tu-public-key  // Endpoints públicos de consulta
Authorization: Bearer tu-token  // Endpoints protegidos (creación, edición, eliminación, aplicación)
```

- **PublicKeyGuard**: Endpoints de lectura y validación (`GET`, `POST /validate`)
- **AuthGuard**: Endpoints de escritura (`POST`, `PUT`, `PATCH`, `DELETE`)

---

## 1. ENDPOINTS DE CUPONES

### 1.1 Crear cupón
**`POST`** `/coupons/:storeId`

**Autenticación**: AuthGuard  
**URL Completa**: `https://api.tudominio.com/coupons/store123`

**Request Body**:
```json
{
  "code": "SALE-2025",
  "description": "Descuento del 20% por temporada",
  "type": "PERCENTAGE",
  "value": 20,
  "minPurchase": 50,
  "maxUses": 100,
  "startDate": "2025-01-01T00:00:00.000Z",
  "endDate": "2025-01-31T23:59:59.000Z",
  "isActive": true,
  "applicableProductIds": ["prod_123", "prod_456"],
  "applicableCategoryIds": ["cat_789"],
  "applicableCollectionIds": ["col_321"]
}
```

**Restricciones Clave**:
- `code`: Obligatorio, 1-20 caracteres, solo mayúsculas, números, guiones y guiones bajos.
- `type`: Obligatorio, valores permitidos `PERCENTAGE`, `FIXED_AMOUNT`, `FREE_SHIPPING`, `BUY_X_GET_Y`.
- `value`: Obligatorio (excepto para `FREE_SHIPPING`), positivo, máximo 2 decimales. Si `type` es `PERCENTAGE`, el valor no puede exceder 100.
- `startDate` / `endDate`: Formato ISO 8601, `startDate` debe ser antes que `endDate`.
- `applicable*Ids`: Arrays opcionales de strings (IDs válidos).

**Response 201 Created**:
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Cupón creado exitosamente",
  "data": {
    "id": "coup_abcd1234",
    "storeId": "store123",
    "code": "SALE-2025",
    "description": "Descuento del 20% por temporada",
    "type": "PERCENTAGE",
    "value": 20,
    "minPurchase": 50,
    "maxUses": 100,
    "usedCount": 0,
    "startDate": "2025-01-01T00:00:00.000Z",
    "endDate": "2025-01-31T23:59:59.000Z",
    "isActive": true,
    "createdAt": "2025-01-01T12:00:00.000Z",
    "updatedAt": "2025-01-01T12:00:00.000Z",
    "applicableProducts": [
      { "id": "prod_123", "title": "Camiseta deportiva", "slug": "camiseta-deportiva" },
      { "id": "prod_456", "title": "Short deportivo", "slug": "short-deportivo" }
    ],
    "applicableCategories": [
      { "id": "cat_789", "name": "Ropa Hombre", "slug": "ropa-hombre" }
    ],
    "applicableCollections": [
      { "id": "col_321", "title": "Rebajas Invierno", "slug": "rebajas-invierno" }
    ]
  },
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

**Errores Comunes**:
- **400 Bad Request**: Datos inválidos, fechas inconsistentes o valor fuera de rango.
- **401 Unauthorized**: Token inválido o ausente.
- **403 Forbidden**: Sin permisos para crear cupones.
- **404 Not Found**: Tienda o IDs referenciados no existen.
- **409 Conflict**: Código de cupón duplicado dentro de la tienda (`P2002`).

---

### 1.2 Listar cupones por tienda
**`GET`** `/coupons/:storeId`

**Autenticación**: PublicKeyGuard  
**URL Completa**: `https://api.tudominio.com/coupons/store123`

**Query Parameters**:
```typescript
{
  query?: string;             // Busca por código o descripción (insensible a mayúsculas)
  includeInactive?: boolean;  // Incluye cupones inactivos (default: false)
  page?: number;              // Página (mín: 1, default: 1)
  limit?: number;             // Resultados por página (1-100, default: 20)
  sortBy?: string;            // Campo para ordenar (default: createdAt)
  sortOrder?: 'asc' | 'desc'; // Orden (default: desc)
}
```

**Ejemplo de URL**:
```
GET /coupons/store123?query=SALE&includeInactive=true&page=2&limit=10&sortBy=startDate&sortOrder=asc
```

**Response 200 OK**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Cupones obtenidos exitosamente",
  "data": [
    {
      "id": "coup_abcd1234",
      "code": "SALE-2025",
      "description": "Descuento del 20% por temporada",
      "type": "PERCENTAGE",
      "value": 20,
      "minPurchase": 50,
      "maxUses": 100,
      "usedCount": 12,
      "startDate": "2025-01-01T00:00:00.000Z",
      "endDate": "2025-01-31T23:59:59.000Z",
      "isActive": true,
      "createdAt": "2024-12-10T09:35:00.000Z",
      "updatedAt": "2025-01-05T10:15:00.000Z",
      "applicableProducts": [
        { "id": "prod_123", "storeId": "store123", "title": "Camiseta deportiva" }
      ],
      "applicableCategories": [
        { "id": "cat_789", "storeId": "store123", "name": "Ropa Hombre" }
      ],
      "applicableCollections": []
    }
  ],
  "pagination": {
    "page": 2,
    "limit": 10,
    "total": 35,
    "totalPages": 4,
    "hasNextPage": true,
    "hasPrevPage": true
  },
  "timestamp": "2025-01-05T10:15:00.000Z"
}
```

**Errores Comunes**:
- **400 Bad Request**: Parámetros de paginación inválidos.
- **401 Unauthorized**: Public key inválida o ausente.
- **404 Not Found**: Tienda inexistente.

---

### 1.3 Obtener cupón por ID
**`GET`** `/coupons/:storeId/:id`

**Autenticación**: PublicKeyGuard  
**URL Completa**: `https://api.tudominio.com/coupons/store123/coup_abcd1234`

**Response 200 OK**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Cupón obtenido exitosamente",
  "data": {
    "id": "coup_abcd1234",
    "storeId": "store123",
    "code": "SALE-2025",
    "description": "Descuento del 20% por temporada",
    "type": "PERCENTAGE",
    "value": 20,
    "minPurchase": 50,
    "maxUses": 100,
    "usedCount": 12,
    "startDate": "2025-01-01T00:00:00.000Z",
    "endDate": "2025-01-31T23:59:59.000Z",
    "isActive": true,
    "createdAt": "2024-12-10T09:35:00.000Z",
    "updatedAt": "2025-01-05T10:15:00.000Z",
    "applicableProducts": [...],
    "applicableCategories": [...],
    "applicableCollections": [...]
  },
  "timestamp": "2025-01-05T10:15:00.000Z"
}
```

**Errores**:
- **404 Not Found**: Cupón no encontrado en la tienda.
- **401 Unauthorized**: Public key inválida o ausente.

---

### 1.4 Obtener cupón por código
**`GET`** `/coupons/by-code/:storeId/:code`

**Autenticación**: PublicKeyGuard  
**URL Completa**: `https://api.tudominio.com/coupons/by-code/store123/SALE-2025`

**Response 200 OK**: Igual estructura que **1.3**.

**Errores**:
- **404 Not Found**: Código de cupón inexistente.
- **401 Unauthorized**: Public key inválida o ausente.

---

### 1.5 Actualizar cupón
**`PUT`** `/coupons/:storeId/:id`

**Autenticación**: AuthGuard  
**URL Completa**: `https://api.tudominio.com/coupons/store123/coup_abcd1234`

**Request Body** (todos los campos opcionales - se usa `PartialType` del DTO de creación):
```json
{
  "description": "Descuento extendido al Q1",
  "endDate": "2025-03-31T23:59:59.000Z",
  "maxUses": 200,
  "isActive": true,
  "applicableProductIds": ["prod_123", "prod_789"]
}
```

**Respuesta 200 OK**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Cupón actualizado exitosamente",
  "data": {
    "id": "coup_abcd1234",
    "code": "SALE-2025",
    "description": "Descuento extendido al Q1",
    "type": "PERCENTAGE",
    "value": 20,
    "maxUses": 200,
    "usedCount": 12,
    "endDate": "2025-03-31T23:59:59.000Z",
    "isActive": true,
    "updatedAt": "2025-01-10T08:45:00.000Z",
    "applicableProducts": [
      { "id": "prod_123", "title": "Camiseta deportiva", "slug": "camiseta-deportiva" },
      { "id": "prod_789", "title": "Zapatillas running", "slug": "zapatillas-running" }
    ],
    "applicableCategories": [...],
    "applicableCollections": [...]
  },
  "timestamp": "2025-01-10T08:45:00.000Z"
}
```

**Validaciones claves durante actualización**:
- Si se cambia el `code`, se valida unicidad por tienda.
- Si se actualizan fechas, se garantiza que `startDate <= endDate`.
- Descuento porcentual no puede superar 100%.
- Las listas de IDs se reemplazan por completo (operación `set`).

**Errores Comunes**:
- **400 Bad Request**: Fechas inválidas, valor fuera de rango, IDs malformados.
- **404 Not Found**: Cupón inexistente en la tienda.
- **409 Conflict**: Código nuevo ya utilizado.

---

### 1.6 Eliminar cupón
**`DELETE`** `/coupons/:storeId/:id`

**Autenticación**: AuthGuard  
**URL Completa**: `https://api.tudominio.com/coupons/store123/coup_abcd1234`

**Comportamiento**:
- Si el cupón ya se usó en alguna orden (`ordersCount > 0`), **no se elimina**: se desactiva (`isActive = false`).
- Si no tiene usos, se elimina lógicamente de la base de datos.

**Response 200 OK** (cupon desactivado):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Cupón desactivado correctamente",
  "data": {
    "id": "coup_abcd1234",
    "isActive": false
  },
  "timestamp": "2025-01-15T12:30:00.000Z"
}
```

**Response 200 OK** (cupón eliminado):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Cupón eliminado exitosamente",
  "data": {
    "id": "coup_xyz987"
  },
  "timestamp": "2025-01-15T12:30:00.000Z"
}
```

**Errores**:
- **404 Not Found**: Cupón inexistente.
- **401/403**: Problemas de autenticación o permisos.

---

### 1.7 Validar cupón para uso en carrito
**`POST`** `/coupons/:storeId/validate`

**Autenticación**: PublicKeyGuard  
**URL Completa**: `https://api.tudominio.com/coupons/store123/validate`

**Request Body**:
```json
{
  "storeId": "store123",
  "code": "SALE-2025",
  "cartTotal": 120,
  "productIds": ["prod_123", "prod_456"],
  "categoryIds": ["cat_789"],
  "collectionIds": ["col_321"]
}
```

> **Nota:** `storeId` es requerido por el DTO aunque se derive de la ruta. Debe coincidir con el parámetro `:storeId`.

**Response 200 OK (válido)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Validación completada",
  "data": {
    "valid": true,
    "discountAmount": 24,
    "discountedTotal": 96,
    "coupon": {
      "id": "coup_abcd1234",
      "type": "PERCENTAGE",
      "value": 20,
      "minPurchase": 50,
      "maxUses": 100,
      "usedCount": 12,
      "startDate": "2025-01-01T00:00:00.000Z",
      "endDate": "2025-01-31T23:59:59.000Z",
      "isActive": true,
      "applicableProducts": [...],
      "applicableCategories": [...],
      "applicableCollections": [...]
    }
  },
  "timestamp": "2025-01-05T10:15:00.000Z"
}
```

**Response 200 OK (inválido)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Validación completada",
  "data": {
    "valid": false,
    "message": "This coupon requires a minimum purchase of 50",
    "minPurchase": 50
  },
  "timestamp": "2025-01-05T10:15:00.000Z"
}
```

**Razones comunes de invalidez**:
- Cupón inactivo.
- Fuera del rango de fechas (`startDate` / `endDate`).
- `maxUses` alcanzado.
- Compra mínima no cumplida.
- Cupón no aplicable a los productos/categorías/colecciones del carrito.
- Código inexistente.

---

### 1.8 Aplicar cupón (incrementar contador de uso)
**`PATCH`** `/coupons/:storeId/:id/apply`

**Autenticación**: AuthGuard  
**URL Completa**: `https://api.tudominio.com/coupons/store123/coup_abcd1234/apply`

**Response 200 OK**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Uso del cupón registrado exitosamente",
  "data": {
    "id": "coup_abcd1234",
    "usedCount": 13
  },
  "timestamp": "2025-01-05T11:00:00.000Z"
}
```

**Notas**:
- Este endpoint incrementa `usedCount` en 1.
- Se debe invocar después de confirmar que el cupón fue usado en una orden.
- Si el cupón no existe en la tienda, se devuelve **404 Not Found**.

---

## 2. PARÁMETROS DE BÚSQUEDA Y PAGINACIÓN

Los endpoints de listado utilizan la infraestructura de paginación común (`PaginationService`):

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `page` | number | 1 | Página a consultar (mínimo 1) |
| `limit` | number | 20 | Elementos por página (máximo 100) |
| `sortBy` | string | `createdAt` | Campo para ordenar (`createdAt`, `updatedAt`, `startDate`, etc.) |
| `sortOrder` | `'asc' \| 'desc'` | `desc` | Orden ascendente o descendente |
| `query` | string | - | Búsqueda parcial en `code` y `description` (insensible a mayúsculas) |
| `includeInactive` | boolean | false | Incluye cupones con `isActive = false` |

**Estructura de paginación**:
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 35,
    "totalPages": 2,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## 3. ESTRUCTURAS DE DATOS

### 3.1 Coupon
```typescript
{
  id: string;
  storeId: string;
  code: string;
  description?: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING' | 'BUY_X_GET_Y';
  value: number;            // Decimal (string en respuestas JSON)
  minPurchase?: number;     // Decimal opcional
  maxUses?: number;
  usedCount: number;
  startDate: Date;          // ISO 8601
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  applicableProducts: Product[];
  applicableCategories: Category[];
  applicableCollections: Collection[];
}
```

### 3.2 DiscountType (enum)
```typescript
type DiscountType =
  | 'PERCENTAGE'
  | 'FIXED_AMOUNT'
  | 'FREE_SHIPPING'
  | 'BUY_X_GET_Y';
```

### 3.3 ValidateCoupon Response
```typescript
{
  valid: boolean;
  message?: string;
  discountAmount?: number;
  discountedTotal?: number;
  minPurchase?: number;
  coupon?: Coupon; // Incluye relaciones y estado actual
}
```

---

## 4. VALIDACIONES Y RESTRICCIONES

### 4.1 Reglas del DTO de creación (`CreateCouponDto`)

| Campo | Tipo | Obligatorio | Restricciones |
|-------|------|-------------|---------------|
| `code` | string | ✅ | 1-20 caracteres, `^[A-Z0-9-_]+$`, único por tienda |
| `description` | string | ❌ | Máx 500 caracteres |
| `type` | enum | ✅ | `PERCENTAGE`, `FIXED_AMOUNT`, `FREE_SHIPPING`, `BUY_X_GET_Y` |
| `value` | number | ✅* | Máx 2 decimales, > 0, requerido salvo `FREE_SHIPPING` |
| `minPurchase` | number | ❌ | Máx 2 decimales, > 0 |
| `maxUses` | number | ❌ | Entero ≥ 1 |
| `startDate` | Date | ✅ | Debe ser fecha válida (ISO) |
| `endDate` | Date | ✅ | Debe ser fecha válida (ISO) y ≥ `startDate` |
| `isActive` | boolean | ❌ | Default `true` |
| `applicableProductIds` | string[] | ❌ | IDs válidos de productos |
| `applicableCategoryIds` | string[] | ❌ | IDs válidos de categorías |
| `applicableCollectionIds` | string[] | ❌ | IDs válidos de colecciones |

> \*Para `FREE_SHIPPING`, el backend ignora `value` pero sigue validando que sea un número positivo si se envía.

### 4.2 Reglas del DTO de búsqueda (`SearchCouponDto`)

| Campo | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `query` | string | - | Búsqueda por código/descripción |
| `includeInactive` | boolean | false | Incluye cupones desactivados |
| `page` | number | 1 | ≥ 1 |
| `limit` | number | 20 | 1-100 |
| `sortBy` | string | `createdAt` | Campo de ordenamiento |
| `sortOrder` | `'asc' \| 'desc'` | `desc` | Dirección de ordenamiento |

### 4.3 Reglas del DTO de validación (`ValidateCouponDto`)

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `code` | string | ✅ | Código del cupón (coincide con mayúsculas) |
| `storeId` | string | ✅ | Debe coincidir con `:storeId` |
| `cartTotal` | number | ✅ | > 0, máx 2 decimales |
| `productIds` | string[] | ❌ | IDs de productos en el carrito |
| `categoryIds` | string[] | ❌ | IDs de categorías presentes |
| `collectionIds` | string[] | ❌ | IDs de colecciones presentes |

---

## 5. CÓDIGOS DE ESTADO HTTP

| Código | Descripción | Sección |
|--------|-------------|---------|
| **200** | OK | Listados, obtención, validaciones, aplicación |
| **201** | Created | Creación de cupones |
| **400** | Bad Request | Validaciones de datos, fechas, límites |
| **401** | Unauthorized | Falta autenticación o credenciales inválidas |
| **403** | Forbidden | Usuario sin permisos |
| **404** | Not Found | Cupón, tienda o referencias inexistentes |
| **409** | Conflict | Código duplicado (unicidad por tienda) |
| **422** | Unprocessable Entity | Errores de negocio específicos |
| **500** | Internal Server Error | Error no controlado en el servidor |

---

## 6. ERRORES Y MANEJO DE EXCEPCIONES

### 6.1 Formato de error estándar
```json
{
  "success": false,
  "statusCode": 400,
  "timestamp": "2025-01-05T10:15:00.000Z",
  "path": "/coupons/store123",
  "method": "POST",
  "message": "Descripción del error",
  "error": "BadRequestException",
  "errors": [
    {
      "field": "code",
      "value": "sale-2025",
      "constraints": [
        "El código del cupón debe contener solo letras mayúsculas, números, guiones y guiones bajos"
      ],
      "message": "code: El código del cupón debe contener solo letras mayúsculas, números, guiones y guiones bajos"
    }
  ]
}
```

### 6.2 Errores de Prisma manejados automáticamente

| Código Prisma | Descripción | HTTP Status | Mensaje |
|---------------|-------------|-------------|---------|
| `P2002` | Violación de índice único (`storeId` + `code`) | 409 Conflict | "A coupon with this code already exists in this store" |
| `P2003` | Relación inválida (IDs inexistentes) | 400 Bad Request | "Invalid reference..." |
| `P2025` | Registro no encontrado | 404 Not Found | "Record not found..." |

### 6.3 Validaciones adicionales personalizadas
- **Fechas inconsistentes**: `Start date must be before end date`
- **Porcentajes > 100**: `Percentage discount cannot exceed 100%`
- **Máximo de usos inválido**: `Maximum uses must be at least 1`
- **Datos faltantes**: `Coupon code is required...`

---

## 7. EJEMPLOS DE USO

### 7.1 Crear cupón porcentual
```http
POST /coupons/store123 HTTP/1.1
Authorization: Bearer tu-token
Content-Type: application/json

{
  "code": "SUMMER-20",
  "type": "PERCENTAGE",
  "value": 20,
  "description": "Descuento verano 20%",
  "minPurchase": 60,
  "maxUses": 500,
  "startDate": "2025-06-01T00:00:00.000Z",
  "endDate": "2025-08-31T23:59:59.000Z",
  "applicableCategoryIds": ["cat_tshirts", "cat_shorts"]
}
```

### 7.2 Crear cupón de monto fijo
```http
POST /coupons/store123 HTTP/1.1
Authorization: Bearer tu-token
Content-Type: application/json

{
  "code": "WELCOME-10",
  "type": "FIXED_AMOUNT",
  "value": 10,
  "description": "Cupón de bienvenida",
  "startDate": "2025-01-01T00:00:00.000Z",
  "endDate": "2025-12-31T23:59:59.000Z",
  "isActive": true
}
```

### 7.3 Validar cupón en el checkout
```http
POST /coupons/store123/validate HTTP/1.1
X-Public-Key: tu-public-key
Content-Type: application/json

{
  "storeId": "store123",
  "code": "SUMMER-20",
  "cartTotal": 150,
  "productIds": ["prod_a", "prod_b"],
  "categoryIds": ["cat_tshirts"],
  "collectionIds": []
}
```

### 7.4 Listar cupones activos
```http
GET /coupons/store123?page=1&limit=20&includeInactive=false HTTP/1.1
X-Public-Key: tu-public-key
```

### 7.5 Actualizar cantidad máxima de usos
```http
PUT /coupons/store123/coup_abcd1234 HTTP/1.1
Authorization: Bearer tu-token
Content-Type: application/json

{
  "maxUses": 1000
}
```

### 7.6 Incrementar contador después de completar una orden
```http
PATCH /coupons/store123/coup_abcd1234/apply HTTP/1.1
Authorization: Bearer tu-token
```

---

## 8. NOTAS IMPORTANTES

1. **Unicidad del código**: cada tienda puede reutilizar códigos propios, pero no se permite duplicados dentro de la misma tienda.
2. **Formato del código**: solo letras **mayúsculas**, números, guiones (`-`) y guiones bajos (`_`). Se recomienda normalizar a mayúsculas antes de enviar.
3. **Manejo de fechas**: usar siempre formato ISO 8601 (ej. `2025-01-01T00:00:00.000Z`). El backend valida que `startDate <= endDate`.
4. **Descuentos porcentuales**: el valor máximo permitido es `100`. Para descuentos superiores, utilizar `FIXED_AMOUNT`.
5. **Aplicabilidad**: si se definen listas de productos/categorías/colecciones, el cupón solo se aplica cuando al menos uno de los elementos coincide con el carrito.
6. **Uso máximo**: cuando `maxUses` se alcanza, el cupón se considera inválido hasta que se incremente manualmente o se extienda el límite.
7. **Eliminación vs desactivación**: los cupones asociados a órdenes no se eliminan; solo se desactivan para mantener integridad histórica.
8. **Escenario `FREE_SHIPPING`**: el campo `value` puede omitirse. La lógica de envío gratis debe ser manejada en el frontend / proceso de checkout.
9. **`BUY_X_GET_Y`**: la lógica avanzada se puede implementar en servicios posteriores; actualmente el servicio devuelve `discountAmount = 0` como marcador de posición.
10. **Sincronización con inventario y productos**: asegúrate de que los IDs enviados existan y correspondan a la misma tienda para evitar errores `P2003`.

---

¿Dudas o sugerencias? Mantén esta documentación sincronizada con futuras actualizaciones del módulo de cupones para evitar inconsistencias en la integración.

