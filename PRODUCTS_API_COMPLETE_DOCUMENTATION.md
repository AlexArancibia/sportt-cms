# Documentación Completa de la API de Productos

## 📋 Tabla de Contenidos
1. [Información General](#información-general)
2. [Endpoints de Productos](#1-endpoints-de-productos)
3. [Endpoints de Variantes](#2-endpoints-de-variantes)
4. [Endpoints de Precios](#3-endpoints-de-precios)
5. [Endpoints de Operaciones Masivas](#4-endpoints-de-operaciones-masivas)
6. [Estructuras de Datos](#5-estructuras-de-datos)
7. [Códigos de Estado HTTP](#6-códigos-de-estado-http)
8. [Errores y Validaciones](#7-errores-y-validaciones)
9. [Filtros por Atributos de Variantes](#8-filtros-por-atributos-de-variantes)
10. [Ejemplos de Uso](#9-ejemplos-de-uso)
11. [Notas Importantes](#10-notas-importantes)

---

## Información General

### Base URL
```
https://api.tudominio.com/products
```

### Autenticación

**Headers requeridos:**
```
X-Public-Key: tu-public-key  // Para endpoints públicos
Authorization: Bearer tu-token  // Para endpoints protegidos
```

- **PublicKeyGuard**: Endpoints de lectura (GET, POST para vistas)
- **AuthGuard**: Endpoints de escritura (POST, PATCH, DELETE)

---

## 1. ENDPOINTS DE PRODUCTOS

### 1.1 Obtener productos por tienda
**`GET`** `/products/:storeId`

**Autenticación**: PublicKeyGuard

**URL Completa**: `https://api.tudominio.com/products/store123`

**Query Parameters**:
```typescript
{
  query?: string;           // Búsqueda por texto (máx 200 caracteres)
  status?: string[];        // Estados: ACTIVE, INACTIVE, DRAFT, ARCHIVED
  vendor?: string;          // Filtro por proveedor (máx 100 caracteres)
  categorySlugs?: string[]; // Filtro por slugs de categorías
  collectionIds?: string[]; // Filtro por IDs de colecciones
  page?: number;           // Página (mín: 1, default: 1)
  limit?: number;          // Límite por página (mín: 1, máx: 100, default: 20)
  sortBy?: string;        // Ordenar por: createdAt, updatedAt, title, price, viewCount
  sortOrder?: 'asc' | 'desc'; // Orden (default: desc)
  minPrice?: number;       // Precio mínimo (≥ 0)
  maxPrice?: number;       // Precio máximo (≥ 0)
  currencyId?: string;     // ID de moneda para filtro de precios
  attributeFilters?: Record<string, string[]>; // Filtro por atributos de variantes (ej: {"size":["M","L"],"color":["Blue","Red"]})
}
```

**Ejemplo de URL con parámetros**:
```
GET /products/store123?query=camiseta&status=ACTIVE&minPrice=20&maxPrice=50&page=1&limit=10&sortBy=price&sortOrder=asc
```

**Response 200 OK**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Productos obtenidos exitosamente",
  "data": [
    {
      "id": "prod_123",
      "title": "Camiseta Deportiva",
      "slug": "camiseta-deportiva",
      "description": "Camiseta de alta calidad",
      "vendor": "SportBrand",
      "status": "ACTIVE",
      "viewCount": 150,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "categories": [...],
      "collections": [...],
      "variants": [...]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Restricciones**:
- `query`: Máximo 200 caracteres
- `status`: Solo valores: ACTIVE, INACTIVE, DRAFT, ARCHIVED
- `vendor`: Máximo 100 caracteres
- `page`: Valor mínimo 1
- `limit`: Valor entre 1 y 100
- `sortBy`: Solo valores permitidos: createdAt, updatedAt, title, price, viewCount
- `sortOrder`: Solo 'asc' o 'desc'
- `minPrice`, `maxPrice`: Valores ≥ 0
- `attributeFilters`: JSON válido con objeto de atributos (clave: string, valores: array de strings)

**Errores**:
- **400 Bad Request**: Parámetros de consulta inválidos
- **401 Unauthorized**: Public key inválida o faltante
- **404 Not Found**: Tienda no encontrada

---

### 1.2 Obtener producto por slug
**`GET`** `/products/by-slug/:storeId/:slug`

**Autenticación**: PublicKeyGuard

**URL Completa**: `https://api.tudominio.com/products/by-slug/store123/camiseta-deportiva-premium`

**Response 200 OK**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Producto obtenido exitosamente",
  "data": {
    "id": "prod_123",
    "title": "Camiseta Deportiva Premium",
    "slug": "camiseta-deportiva-premium",
    "description": "Camiseta de alta calidad para deportes",
    "status": "ACTIVE",
    "categories": [...],
    "variants": [...]
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Errores**:
- **404 Not Found**: Producto no encontrado
- **401 Unauthorized**: Public key inválida

---

### 1.3 Obtener estadísticas de productos
**`GET`** `/products/statistics/:storeId`

**Autenticación**: PublicKeyGuard

**URL Completa**: `https://api.tudominio.com/products/statistics/store123`

**Response 200 OK**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Estadísticas obtenidas exitosamente",
  "data": {
    "totalProducts": 150,
    "activeProducts": 120,
    "inactiveProducts": 20,
    "draftProducts": 5,
    "archivedProducts": 5,
    "totalVariants": 450,
    "totalViews": 15750
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### 1.4 Crear producto
**`POST`** `/products/:storeId`

**Autenticación**: AuthGuard

**URL Completa**: `https://api.tudominio.com/products/store123`

**Request Body**:
```json
{
  "title": "Camiseta Deportiva Premium",
  "description": "Camiseta de alta calidad para deportes",
  "slug": "camiseta-deportiva-premium",
  "vendor": "SportBrand",
  "allowBackorder": false,
  "releaseDate": "2024-01-20T00:00:00.000Z",
  "status": "ACTIVE",
  "restockThreshold": 10,
  "restockNotify": true,
  "categoryIds": ["cat_123", "cat_456"],
  "collectionIds": ["col_789"],
  "imageUrls": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],
  "variants": [
    {
      "title": "Talla M - Azul",
      "sku": "CAM-M-AZ-001",
      "inventoryQuantity": 50,
      "weightValue": 0.25,
      "isActive": true,
      "position": 1,
      "prices": [
        {
          "currencyId": "curr_usd",
          "price": 29.99,
          "originalPrice": 39.99
        }
      ],
      "attributes": {
        "size": "M",
        "color": "Azul"
      }
    }
  ],
  "metaTitle": "Camiseta Deportiva Premium - SportBrand",
  "metaDescription": "Camiseta deportiva de alta calidad para atletas profesionales"
}
```

**Restricciones y Validaciones**:

| Campo | Tipo | Obligatorio | Restricciones |
|-------|------|-------------|---------------|
| `title` | string | ✅ | 1-200 caracteres |
| `description` | string | ❌ | Máx 5000 caracteres |
| `slug` | string | ✅ | 1-100 caracteres, formato: `^[a-z0-9]+(?:-[a-z0-9]+)*$` |
| `vendor` | string | ❌ | Máx 100 caracteres |
| `allowBackorder` | boolean | ❌ | Default: false |
| `releaseDate` | Date | ❌ | Formato ISO 8601 |
| `status` | enum | ❌ | ACTIVE, INACTIVE, DRAFT, ARCHIVED |
| `restockThreshold` | number | ❌ | Entero ≥ 0 |
| `restockNotify` | boolean | ❌ | Default: false |
| `categoryIds` | string[] | ❌ | Máx 10 categorías |
| `collectionIds` | string[] | ❌ | Máx 5 colecciones |
| `imageUrls` | string[] | ❌ | Máx 10 URLs válidas |
| `variants` | array | ✅ | 1-50 variantes |
| `metaTitle` | string | ❌ | Máx 60 caracteres |
| `metaDescription` | string | ❌ | Máx 160 caracteres |

**Response 201 Created**:
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Producto creado exitosamente",
  "data": {
    "id": "prod_new123",
    "title": "Camiseta Deportiva Premium",
    "slug": "camiseta-deportiva-premium",
    "status": "ACTIVE",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "variants": [...]
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Errores**:
- **400 Bad Request**: Validación fallida
  ```json
  {
    "success": false,
    "statusCode": 400,
    "timestamp": "2024-01-15T10:30:00.000Z",
    "path": "/products/store123",
    "method": "POST",
    "message": "Errores de validación encontrados",
    "errors": [
      {
        "field": "slug",
        "value": "Mi-Producto",
        "constraints": [
          "El slug debe contener solo letras minúsculas, números y guiones"
        ],
        "message": "slug: El slug debe contener solo letras minúsculas, números y guiones"
      },
      {
        "field": "variants",
        "value": null,
        "constraints": ["Debe haber al menos una variante del producto"],
        "message": "variants: Debe haber al menos una variante del producto"
      }
    ]
  }
  ```
- **401 Unauthorized**: Token inválido o faltante
- **403 Forbidden**: Sin permisos para crear productos
- **409 Conflict**: Slug o SKU ya existe
  ```json
  {
    "success": false,
    "statusCode": 409,
    "message": "Ya existe un registro con este slug. Por favor, utiliza un valor diferente.",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
  ```
- **404 Not Found**: Tienda o recurso relacionado no encontrado

---

### 1.5 Obtener producto por ID
**`GET`** `/products/:storeId/:id`

**Autenticación**: PublicKeyGuard

**URL Completa**: `https://api.tudominio.com/products/store123/prod_123`

**Response 200 OK**: Similar a 1.2

---

### 1.6 Actualizar producto
**`PATCH`** `/products/:storeId/:id`

**Autenticación**: AuthGuard

**URL Completa**: `https://api.tudominio.com/products/store123/prod_123`

**Request Body**: Todos los campos son opcionales (usar PartialType de CreateProductDto)
```json
{
  "title": "Camiseta Deportiva Premium - Actualizada",
  "status": "INACTIVE"
}
```

**Response 200 OK**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Producto actualizado exitosamente",
  "data": {
    "id": "prod_123",
    "title": "Camiseta Deportiva Premium - Actualizada",
    "status": "INACTIVE",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  },
  "timestamp": "2024-01-15T11:00:00.000Z"
}
```

**Errores**: Mismos que en 1.4

---

### 1.7 Actualizar estado del producto
**`PATCH`** `/products/:storeId/:id/status`

**Autenticación**: AuthGuard

**URL Completa**: `https://api.tudominio.com/products/store123/prod_123/status`

**Request Body**:
```json
{
  "status": "INACTIVE"
}
```

**Restricciones**:
- `status`: Solo valores: ACTIVE, INACTIVE, DRAFT, ARCHIVED

**Response 200 OK**: Similar a 1.6

---

### 1.8 Eliminar producto
**`DELETE`** `/products/:storeId/:id`

**Autenticación**: AuthGuard

**URL Completa**: `https://api.tudominio.com/products/store123/prod_123`

**Response 200 OK**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Producto eliminado exitosamente",
  "data": {
    "id": "prod_123",
    "title": "Camiseta Deportiva Premium"
  },
  "timestamp": "2024-01-15T11:30:00.000Z"
}
```

**Errores**:
- **404 Not Found**: Producto no encontrado
- **400 Bad Request**: No se puede eliminar (tiene variantes con inventario)

---

### 1.9 Incrementar contador de vistas
**`POST`** `/products/:storeId/:id/view`

**Autenticación**: PublicKeyGuard

**URL Completa**: `https://api.tudominio.com/products/store123/prod_123/view`

**Request Body**: Vacío

**Response 200 OK**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Vista incrementada exitosamente",
  "data": {
    "id": "prod_123",
    "viewCount": 151
  },
  "timestamp": "2024-01-15T11:45:00.000Z"
}
```

---

## 2. ENDPOINTS DE VARIANTES

### 2.1 Crear variante de producto
**`POST`** `/products/:storeId/:productId/variants`

**Autenticación**: AuthGuard

**URL Completa**: `https://api.tudominio.com/products/store123/prod_123/variants`

**Request Body**:
```json
{
  "title": "Talla L - Rojo",
  "sku": "CAM-L-RO-001",
  "inventoryQuantity": 30,
  "weightValue": 0.30,
  "isActive": true,
  "position": 2,
  "prices": [
    {
      "currencyId": "curr_usd",
      "price": 34.99,
      "originalPrice": 39.99
    }
  ],
  "attributes": {
    "size": "L",
    "color": "Rojo"
  }
}
```

**Restricciones y Validaciones**:

| Campo | Tipo | Obligatorio | Restricciones |
|-------|------|-------------|---------------|
| `title` | string | ✅ | 1-100 caracteres |
| `sku` | string | ❌ | Máx 50 caracteres, formato: `^[A-Za-z0-9-_]+$` |
| `imageUrls` | string[] | ❌ | Máx 5 URLs válidas |
| `inventoryQuantity` | number | ❌ | Entero ≥ 0 |
| `weightValue` | number | ❌ | Número con máx 2 decimales ≥ 0 |
| `isActive` | boolean | ❌ | Default: true |
| `position` | number | ❌ | Entero ≥ 0 |
| `prices` | array | ✅ | 1-10 precios |
| `attributes` | object | ❌ | Objeto con valores string |

**Response 201 Created**:
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Variante creada exitosamente",
  "data": {
    "id": "var_new123",
    "title": "Talla L - Rojo",
    "sku": "CAM-L-RO-001",
    "inventoryQuantity": 30,
    "prices": [...]
  },
  "timestamp": "2024-01-15T12:00:00.000Z"
}
```

**Errores**:
- **400 Bad Request**: Validación fallida
- **404 Not Found**: Producto no encontrado
- **409 Conflict**: SKU duplicado

---

### 2.2 Obtener variante por ID
**`GET`** `/products/:storeId/variants/:id`

**Autenticación**: PublicKeyGuard

**Response 200 OK**: Similar formato a 2.1

---

### 2.3 Actualizar variante
**`PATCH`** `/products/:storeId/variants/:id`

**Autenticación**: AuthGuard

**Request Body**: Todos los campos opcionales

**Response 200 OK**: Similar a 2.1

---

### 2.4 Actualizar variante con nuevo producto
**`PATCH`** `/products/:storeId/variants/:id/new-product/:productId`

**Autenticación**: AuthGuard

**URL Completa**: `https://api.tudominio.com/products/store123/variants/var_123/new-product/prod_456`

**Response 200 OK**: Similar a 2.1

---

### 2.5 Eliminar variante
**`DELETE`** `/products/:storeId/variants/:id`

**Autenticación**: AuthGuard

**Response 200 OK**: Similar a producto eliminado

---

## 3. ENDPOINTS DE PRECIOS

### 3.1 Crear precio de variante
**`POST`** `/products/:storeId/variant-prices`

**Autenticación**: AuthGuard

**Request Body**:
```json
{
  "variantId": "var_123",
  "currencyId": "curr_usd",
  "price": 29.99,
  "originalPrice": 39.99
}
```

**Restricciones**:

| Campo | Tipo | Obligatorio | Restricciones |
|-------|------|-------------|---------------|
| `variantId` | string | ✅ | ID de variante válido |
| `currencyId` | string | ✅ | ID de moneda válido |
| `price` | number | ✅ | > 0.01, máx 2 decimales |
| `originalPrice` | number | ❌ | > 0.01, máx 2 decimales |

**Response 201 Created**:
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Precio creado exitosamente",
  "data": {
    "id": "price_new123",
    "variantId": "var_123",
    "currencyId": "curr_usd",
    "price": 29.99,
    "originalPrice": 39.99
  },
  "timestamp": "2024-01-15T12:30:00.000Z"
}
```

**Errores**:
- **400 Bad Request**: Validación fallida o variante/moneda no encontrada
- **409 Conflict**: Ya existe un precio para esta variante y moneda

---

### 3.2 Obtener precio por ID
**`GET`** `/products/:storeId/variant-prices/:id`

**Autenticación**: PublicKeyGuard

**Response 200 OK**: Similar a 3.1

---

### 3.3 Actualizar precio
**`PATCH`** `/products/:storeId/variant-prices/:id`

**Autenticación**: AuthGuard

**Request Body**: Todos los campos opcionales

**Response 200 OK**: Similar a 3.1

---

### 3.4 Eliminar precio
**`DELETE`** `/products/:storeId/variant-prices/:id`

**Autenticación**: AuthGuard

**Response 200 OK**: Similar a otros DELETE

---

## 4. ENDPOINTS DE OPERACIONES MASIVAS

### 4.1 Ajustar precios por tasas de cambio
**`POST`** `/products/:storeId/adjust-prices`

**Autenticación**: AuthGuard

**Request Body**:
```json
{
  "baseCurrencyId": "curr_usd"
}
```

**Restricciones**:
- `baseCurrencyId`: Obligatorio, ID de moneda válido

**Response 200 OK**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Precios ajustados exitosamente",
  "data": {
    "message": "Precios ajustados correctamente",
    "adjustedPrices": 150,
    "affectedProducts": 45
  },
  "timestamp": "2024-01-15T13:00:00.000Z"
}
```

**Errores**:
- **400 Bad Request**: Moneda no encontrada o sin tasas de cambio
- **500 Internal Server Error**: Error al calcular tipos de cambio

---

## 5. ESTRUCTURAS DE DATOS

### 5.1 Product
```typescript
{
  id: string;
  title: string;
  description?: string;
  slug: string;
  vendor?: string;
  allowBackorder?: boolean;
  releaseDate?: Date;
  status: 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'ARCHIVED';
  restockThreshold?: number;
  restockNotify?: boolean;
  viewCount: number;
  storeId: string;
  createdAt: Date;
  updatedAt: Date;
  categories: Category[];
  collections: Collection[];
  variants: ProductVariant[];
  metaTitle?: string;
  metaDescription?: string;
}
```

### 5.2 ProductVariant
```typescript
{
  id: string;
  title: string;
  sku?: string;
  imageUrls: string[];
  inventoryQuantity?: number;
  weightValue?: number;
  isActive: boolean;
  position?: number;
  attributes?: Record<string, string>;
  productId: string;
  createdAt: Date;
  updatedAt: Date;
  prices: VariantPrice[];
}
```

### 5.3 VariantPrice
```typescript
{
  id: string;
  price: number;
  originalPrice?: number;
  variantId: string;
  currencyId: string;
  createdAt: Date;
  updatedAt: Date;
  currency: Currency;
}
```

---

## 6. CÓDIGOS DE ESTADO HTTP

| Código | Descripción | Cuándo ocurre |
|--------|-------------|---------------|
| **200** | OK | Operación exitosa |
| **201** | Created | Recurso creado exitosamente |
| **400** | Bad Request | Error de validación o datos inválidos |
| **401** | Unauthorized | Falta autenticación o token inválido |
| **403** | Forbidden | Sin permisos para la operación |
| **404** | Not Found | Recurso no encontrado |
| **409** | Conflict | Duplicado (slug, SKU, etc.) |
| **422** | Unprocessable Entity | Error de negocio |
| **500** | Internal Server Error | Error interno del servidor |

---

## 7. ERRORES Y VALIDACIONES

### 7.1 Formato de Errores

**Todos los errores siguen este formato**:
```json
{
  "success": false,
  "statusCode": 400,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/products/store123",
  "method": "POST",
  "message": "Descripción del error",
  "error": "BadRequestException",
  "errors": [  // Solo para errores de validación
    {
      "field": "slug",
      "value": "valor-invalido",
      "constraints": ["mensaje de validación"],
      "message": "slug: mensaje de validación"
    }
  ]
}
```

### 7.2 Errores Comunes de Validación

#### 7.2.1 Slug inválido
```json
{
  "field": "slug",
  "constraints": ["El slug debe contener solo letras minúsculas, números y guiones"]
}
```

**Formatos válidos**: ✅
- `camiseta-deportiva`
- `zapatos-nike-123`
- `producto-2024`

**Formatos inválidos**: ❌
- `Mi-Producto` (mayúsculas)
- `producto_123` (guiones bajos)
- `producto@123` (símbolos especiales)

#### 7.2.2 SKU inválido
```json
{
  "field": "sku",
  "constraints": ["El SKU debe contener solo letras, números, guiones y guiones bajos"]
}
```

**Formatos válidos**: ✅
- `CAM-M-AZ-001`
- `producto_123`
- `SKU-001`

**Formatos inválidos**: ❌
- `SKU@001` (símbolos especiales)
- `SKU 001` (espacios)
- `sku@123` (@ no permitido)

#### 7.2.3 Precio inválido
```json
{
  "field": "price",
  "constraints": [
    "El precio debe ser un número con máximo 2 decimales",
    "El precio debe ser al menos 0.01"
  ]
}
```

### 7.3 Errores de Prisma (Manejados Automáticamente)

| Código Prisma | Descripción | HTTP Status |
|---------------|-------------|-------------|
| P2002 | Constraint único violado (duplicado) | 409 Conflict |
| P2025 | Registro no encontrado | 404 Not Found |
| P2003 | Foreign key constraint | 400 Bad Request |
| P2014 | Relación requerida inválida | 400 Bad Request |
| P2016 | Error de interpretación de query | 400 Bad Request |

---

## 8. FILTROS POR ATRIBUTOS DE VARIANTES

### 8.1 Descripción General

El nuevo filtro `attributeFilters` permite buscar productos filtrando por los atributos JSON almacenados en las variantes. Esto es útil para encontrar productos por características específicas como talla, color, material, etc.

### 8.2 Formato del Parámetro

```typescript
attributeFilters?: Record<string, string[]>
```

**Ejemplo:**
```json
{
  "size": ["M", "L", "XL"],
  "color": ["Blue", "Red"],
  "material": ["Cotton"]
}
```

### 8.3 Lógica de Filtrado

El sistema usa una lógica **AND/OR** inteligente:

- **Entre diferentes atributos**: **AND** (debe cumplir TODOS)
  - `{"size":["M"],"color":["Blue"]}` → Tamaño "M" **Y** Color "Blue"

- **Dentro del mismo atributo**: **OR** (cualquiera de los valores)
  - `{"size":["M","L"]}` → Tamaño "M" **O** "L"

- **Combinación**:
  - `{"size":["M","L"],"color":["Blue","Red"]}` → Busca variantes que cumplan:
    - (Tamaño "M" **O** "L") **Y** (Color "Blue" **O** "Red")

### 8.4 Ejemplos de Uso

#### Ejemplo 1: Filtrar por una talla
```
GET /products/store123?attributeFilters={"size":["M"]}
```

#### Ejemplo 2: Filtrar por múltiples tallas (OR)
```
GET /products/store123?attributeFilters={"size":["M","L","XL"]}
```

#### Ejemplo 3: Filtrar por talla Y color (AND)
```
GET /products/store123?attributeFilters={"size":["M","L"],"color":["Blue","Red"]}
```
**Resultado:** Productos con variantes que sean talla "M" o "L" **Y** color "Blue" o "Red"

#### Ejemplo 4: Combinación con otros filtros
```
GET /products/store123?categorySlugs=camisetas&minPrice=30&currencyId=curr_xxx&attributeFilters={"size":["L"],"color":["Black","White"]}&sortBy=price&sortOrder=asc
```

### 8.5 Codificación URL

Cuando uses `attributeFilters` en URLs, el JSON debe estar codificado:

**Sin codificar:**
```
attributeFilters={"size":["M","L"],"color":["Blue"]}
```

**Codificado para URL:**
```
attributeFilters=%7B%22size%22%3A%5B%22M%22%2C%22L%22%5D%2C%22color%22%3A%5B%22Blue%22%5D%7D
```

**En Postman:**
Puedes escribir el JSON directamente en el parámetro `attributeFilters` y Postman lo codificará automáticamente.

### 8.6 Atributos Comunes

| Atributo | Ejemplos de Valores |
|----------|---------------------|
| `size` | `["XS","S","M","L","XL","XXL"]` |
| `color` | `["Black","White","Blue","Red","Green"]` |
| `material` | `["Cotton","Polyester","Wool","Nylon"]` |
| `brand` | `["Nike","Adidas","Puma"]` |

**Nota:** Los atributos son completamente dinámicos y personalizables según tus necesidades.

### 8.7 Validación y Errores

**Formato válido:**
- Cada clave debe ser un string
- Cada valor debe ser un array de strings
- El JSON debe ser válido

**Formato inválido:**
```json
// ❌ Array como valor directo
{"size": "M"}  

// ❌ Valores no son strings
{"size": [1, 2, 3]}

// ❌ JSON malformado
{"size":["M","L"}
```

**Errores comunes:**
- `400 Bad Request`: JSON malformado o estructura incorrecta
- El mensaje indicará qué campo está mal formado

---

## 9. EJEMPLOS DE USO

### 9.1 Crear un producto completo con todas las características

**Request**:
```http
POST /products/store123 HTTP/1.1
Authorization: Bearer tu-token
Content-Type: application/json

{
  "title": "Camiseta Deportiva Premium",
  "description": "Camiseta de alta calidad para deportes",
  "slug": "camiseta-deportiva-premium",
  "vendor": "SportBrand",
  "status": "ACTIVE",
  "restockThreshold": 10,
  "restockNotify": true,
  "categoryIds": ["cat_123", "cat_456"],
  "collectionIds": ["col_789"],
  "imageUrls": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],
  "variants": [
    {
      "title": "Talla M - Azul",
      "sku": "CAM-M-AZ-001",
      "inventoryQuantity": 50,
      "weightValue": 0.25,
      "isActive": true,
      "prices": [
        {
          "currencyId": "curr_usd",
          "price": 29.99,
          "originalPrice": 39.99
        },
        {
          "currencyId": "curr_eur",
          "price": 27.50,
          "originalPrice": 37.00
        }
      ],
      "attributes": {
        "size": "M",
        "color": "Azul"
      }
    },
    {
      "title": "Talla L - Rojo",
      "sku": "CAM-L-RO-001",
      "inventoryQuantity": 30,
      "prices": [
        {
          "currencyId": "curr_usd",
          "price": 34.99,
          "originalPrice": 39.99
        }
      ],
      "attributes": {
        "size": "L",
        "color": "Rojo"
      }
    }
  ],
  "metaTitle": "Camiseta Deportiva Premium",
  "metaDescription": "Camiseta deportiva de alta calidad"
}
```

### 9.2 Buscar productos con múltiples filtros

**Request**:
```http
GET /products/store123?query=camiseta&status=ACTIVE&vendor=SportBrand&minPrice=20&maxPrice=50&page=1&limit=10&sortBy=price&sortOrder=asc HTTP/1.1
X-Public-Key: tu-public-key
```

### 9.3 Buscar productos con filtros de atributos

**Request - Filtro por talla y color:**
```http
GET /products/store123?attributeFilters={"size":["M","L"],"color":["Blue","Red"]} HTTP/1.1
X-Public-Key: tu-public-key
```

**Request - Combinación completa (texto + categoría + precio + atributos):**
```http
GET /products/store123?query=camiseta&categorySlugs=ropa&minPrice=30&currencyId=curr_795fd17e&attributeFilters={"color":["Black","White"],"size":["L","XL"]}&page=1&limit=10&sortBy=price&sortOrder=asc HTTP/1.1
X-Public-Key: tu-public-key
```

### 9.4 Actualizar solo el estado de un producto

**Request**:
```http
PATCH /products/store123/prod_123/status HTTP/1.1
Authorization: Bearer tu-token
Content-Type: application/json

{
  "status": "INACTIVE"
}
```

---

## 10. NOTAS IMPORTANTES

### 10.1 Validaciones Generales
1. Todos los campos tienen validaciones estrictas según los DTOs
2. Hay límites en arrays: categorías (10), colecciones (5), imágenes (10), variantes (50), precios (10)
3. Formato de fechas: Usar ISO 8601 (ej: `2024-01-15T10:30:00.000Z`)

### 10.2 Slugs y SKUs
- **Slugs**: Solo letras minúsculas, números y guiones
- **SKUs**: Letras (mayúsculas/minúsculas), números, guiones y guiones bajos

### 10.3 Paginación
- Todos los endpoints de listado soportan paginación
- Default: `page=1`, `limit=20`
- Máximo: `limit=100`

### 10.4 Filtros
- Los filtros se pueden combinar para búsquedas complejas
- Arrays en query params: `?status=ACTIVE,DRAFT` o `?status=ACTIVE&status=DRAFT`
- Filtros de atributos: Ver sección 8 para detalles completos

### 10.5 Monedas y Precios
- Los precios están asociados a monedas específicas
- Cada variante debe tener al menos un precio
- Máximo 10 precios por variante (una por moneda)

### 10.6 Inventario
- El sistema maneja inventario por variante
- `inventoryQuantity` debe ser un entero ≥ 0

### 10.7 Filtros por Atributos
- Nuevo filtro `attributeFilters` para buscar productos por atributos de variantes
- Formato: JSON string `{"atributo1":["valor1","valor2"],"atributo2":["valor3"]}`
- **Lógica de filtrado:**
  - **Entre diferentes atributos**: AND (debe cumplir TODOS los atributos especificados)
  - **Dentro del mismo atributo**: OR (cualquiera de los valores)
  - **Ejemplo:** `{"size":["M","L"],"color":["Blue"]}` busca variantes que sean:
    - Tamaño "M" **O** "L" **Y** Color "Blue"
- **Atributos comunes:** `size`, `color`, `material`, `brand`, etc.
- Los atributos son personalizables y dinámicos
- Ver sección 8 para ejemplos detallados

### 10.8 SEO
- Campos `metaTitle` y `metaDescription` para optimización SEO
- Recomendado: 60 caracteres para title, 160 para description

### 10.9 Tasas de Cambio
- El endpoint de ajuste de precios usa tasas de cambio actuales
- Requiere que existan tasas de cambio configuradas en el sistema
