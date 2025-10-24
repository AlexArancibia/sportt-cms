# API Reference: Products Endpoint - Para IA Frontend

## Endpoints Principales

### 1. Listar Productos por Tienda
```
GET /products/:storeId
```

### 2. Obtener Producto por Slug
```
GET /products/by-slug/:storeId/:slug
```

### 3. Obtener Producto por ID
```
GET /products/:storeId/:id
```

### 4. Estadísticas de Productos
```
GET /products/statistics/:storeId
```

### 5. Incrementar Contador de Vistas
```
POST /products/:storeId/:id
```

## Cambio Crítico Implementado
Los parámetros `categorySlugs`, `collectionIds` y `status` ahora aceptan **dos formatos**:
- **String con comas**: `?categorySlugs=deportes,fitness,ropa` ✅ RECOMENDADO (usar con checkboxes)
- **Array múltiple**: `?categorySlugs=deportes&categorySlugs=fitness` ✅ También válido

**IMPORTANTE:** El filtro de categorías usa **slugs** (ej: `deportes`) en lugar de IDs, para URLs más amigables y SEO.

## Implementación Recomendada

### Template para construcción de URLs (con checkboxes)
```javascript
function buildProductsURL(storeId, filters = {}) {
  const params = new URLSearchParams();
  
  // Parámetros numéricos simples
  params.append('page', filters.page || 1);
  params.append('limit', filters.limit || 20);
  
  // Parámetros de texto simple
  if (filters.query) params.append('query', filters.query);
  if (filters.vendor) params.append('vendor', filters.vendor);
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
  
  // Arrays desde checkboxes: usar join(',') para formato de comas
  // Ejemplo: selectedCategories = ['deportes', 'fitness'] → 'deportes,fitness'
  if (filters.categorySlugs?.length) {
    params.append('categorySlugs', filters.categorySlugs.join(','));
  }
  if (filters.collectionIds?.length) {
    params.append('collectionIds', filters.collectionIds.join(','));
  }
  if (filters.status?.length) {
    params.append('status', filters.status.join(','));
  }
  
  return `/products/store/${storeId}?${params.toString()}`;
}
```

## Parámetros Completos

| Parámetro | Tipo | Formato | Obligatorio | Valores/Rango |
|-----------|------|---------|-------------|---------------|
| `storeId` | string | Path param | ✅ | UUID de tienda |
| `query` | string | Query string | ❌ | Texto (max 200 chars) |
| `status` | array | Comma-separated | ❌ | `ACTIVE`, `DRAFT`, `ARCHIVED` |
| `vendor` | string | Query string | ❌ | Texto (max 100 chars) |
| `categorySlugs` | array | Comma-separated | ❌ | Slugs de categorías (ej: `deportes`, `ropa`) |
| `collectionIds` | array | Comma-separated | ❌ | UUIDs de colecciones |
| `page` | number | Integer | ❌ | Min: 1, Default: 1 |
| `limit` | number | Integer | ❌ | Min: 1, Max: 100, Default: 20 |
| `sortBy` | string | Enum | ❌ | `createdAt`, `updatedAt`, `title`, `price`, `viewCount` |
| `sortOrder` | string | Enum | ❌ | `asc`, `desc` (default: `desc`) |
| `minPrice` | number | Decimal | ❌ | Precio mínimo (>= 0) |
| `maxPrice` | number | Decimal | ❌ | Precio máximo (>= 0) |
| `currencyId` | string | UUID | ❌ | ID de moneda para filtro de precios |
| `attributeFilters` | object | JSON | ❌ | Filtros por atributos de variantes |

## Estructura de Respuesta

### Respuesta de Lista de Productos
```typescript
interface ProductsResponse {
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

### Respuesta de Estadísticas
```typescript
interface StatisticsResponse {
  totalProducts: number;
  activeProducts: number;
  draftProducts: number;
  archivedProducts: number;
  totalVariants: number;
  lowStockVariants: number;
  mostViewedProducts: Product[];
  recentProducts: Product[];
}
```

### Estructura Completa de Producto
```typescript
interface Product {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  vendor: string | null;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  metaTitle: string | null;
  metaDescription: string | null;
  viewCount: number | null;
  allowBackorder: boolean;
  imageUrls: string[];
  storeId: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  categories: Category[];
  collections: Collection[];
  variants: ProductVariant[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

interface Collection {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isFeatured: boolean;
  storeId: string;
  createdAt: string;
  updatedAt: string;
}

interface ProductVariant {
  id: string;
  title: string;
  slug: string;
  sku: string | null;
  inventoryQuantity: number;
  attributes: Record<string, any> | null; // JSON con atributos como {"size": "M", "color": "red"}
  imageUrls: string[];
  isActive: boolean;
  productId: string;
  createdAt: string;
  updatedAt: string;
  prices: VariantPrice[];
}

interface VariantPrice {
  id: string;
  price: number; // Decimal as number
  originalPrice: number | null;
  currencyId: string;
  variantId: string;
  createdAt: string;
  updatedAt: string;
  currency: {
    id: string;
    code: string; // 'USD', 'EUR', etc.
    symbol: string; // '$', '€', etc.
    name: string;
    decimalPlaces: number;
  };
}
```

### Ejemplo de Respuesta Completa
```json
{
  "data": [
    {
      "id": "prod_123",
      "title": "Camiseta Deportiva Nike",
      "slug": "camiseta-deportiva-nike",
      "description": "Camiseta deportiva de alta calidad",
      "vendor": "Nike",
      "status": "ACTIVE",
      "metaTitle": "Camiseta Nike - Deportes",
      "metaDescription": "Camiseta deportiva Nike para entrenamiento",
      "viewCount": 150,
      "allowBackorder": false,
      "imageUrls": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
      "storeId": "store_456",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-20T14:45:00Z",
      "categories": [
        {
          "id": "cat_789",
          "name": "Deportes",
          "slug": "deportes",
          "parentId": null
        }
      ],
      "collections": [
        {
          "id": "col_101",
          "title": "Nuevos Productos",
          "slug": "nuevos-productos",
          "description": "Productos recién llegados",
          "imageUrl": "https://example.com/collection.jpg",
          "isFeatured": true,
          "storeId": "store_456",
          "createdAt": "2024-01-01T00:00:00Z",
          "updatedAt": "2024-01-01T00:00:00Z"
        }
      ],
      "variants": [
        {
          "id": "var_202",
          "title": "Camiseta Nike - Talla M - Roja",
          "slug": "camiseta-nike-talla-m-roja",
          "sku": "NIKE-CAM-M-RED",
          "inventoryQuantity": 25,
          "attributes": {
            "size": "M",
            "color": "red"
          },
          "imageUrls": ["https://example.com/variant1.jpg"],
          "isActive": true,
          "productId": "prod_123",
          "createdAt": "2024-01-15T10:30:00Z",
          "updatedAt": "2024-01-20T14:45:00Z",
          "prices": [
            {
              "id": "price_303",
              "price": 29.99,
              "originalPrice": 39.99,
              "currencyId": "curr_404",
              "variantId": "var_202",
              "createdAt": "2024-01-15T10:30:00Z",
              "updatedAt": "2024-01-20T14:45:00Z",
              "currency": {
                "id": "curr_404",
                "code": "USD",
                "symbol": "$",
                "name": "Dólar Americano",
                "decimalPlaces": 2
              }
            }
          ]
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Comportamiento de Filtros

### categorySlugs & collectionIds
- Usa operador **`some`** (OR lógico)
- Retorna productos que tengan **AL MENOS UNA** de las categorías/colecciones especificadas

**Ejemplo:**
```
Request: ?categorySlugs=deportes,fitness

Producto A: categories = [deportes, ropa] → ✅ INCLUIDO
Producto B: categories = [fitness, tecnologia] → ✅ INCLUIDO
Producto C: categories = [hogar, cocina] → ❌ EXCLUIDO
```

### status
- Filtra por estados exactos
- Puede incluir múltiples estados

### query
- Búsqueda case-insensitive en:
  - `title`
  - `description`
  - `vendor`
- Usa operador **`contains`** (búsqueda parcial)

### Filtros de Precio (NUEVO)
- `minPrice`: Precio mínimo (inclusive)
- `maxPrice`: Precio máximo (inclusive)
- `currencyId`: Moneda específica para el filtro
- Se aplica a las variantes del producto que tengan precios en la moneda especificada

**Ejemplo:**
```
Request: ?minPrice=10&maxPrice=100&currencyId=curr-123

Producto A: tiene variante con precio $50 en curr-123 → ✅ INCLUIDO
Producto B: tiene variante con precio $150 en curr-123 → ❌ EXCLUIDO
Producto C: no tiene precios en curr-123 → ❌ EXCLUIDO
```

### Filtros de Atributos (NUEVO)
- `attributeFilters`: Objeto JSON con filtros por atributos de variantes
- Formato: `{"atributo": ["valor1", "valor2"]}`
- Usa operador **`AND`** entre diferentes atributos
- Usa operador **`OR`** entre valores del mismo atributo

**Ejemplo:**
```javascript
// Filtro por talla Y color
const attributeFilters = {
  "size": ["M", "L"],
  "color": ["red", "blue"]
};

// URL resultante
const url = `/products/store-123?attributeFilters=${encodeURIComponent(JSON.stringify(attributeFilters))}`;
```

**Comportamiento:**
- Busca productos que tengan variantes con **TODOS** los atributos especificados
- Para cada atributo, acepta **CUALQUIERA** de los valores listados
- Ejemplo: `{"size": ["M", "L"], "color": ["red"]}` → productos con variantes (M o L) Y (red)

## Ejemplos de URLs Válidas

```bash
# Productos activos de categoría específica
GET /products/store-123?categorySlugs=deportes&status=ACTIVE

# Búsqueda con texto, paginación y ordenamiento
GET /products/store-123?query=zapatos&page=2&limit=10&sortBy=viewCount&sortOrder=desc

# Múltiples categorías y colecciones
GET /products/store-123?categorySlugs=deportes,fitness&collectionIds=col-1,col-2

# Productos de proveedor específico
GET /products/store-123?vendor=Nike&status=ACTIVE,DRAFT

# Filtro por rango de precios
GET /products/store-123?minPrice=10&maxPrice=100&currencyId=curr-123

# Filtro por atributos de variantes
GET /products/store-123?attributeFilters={"size":["M","L"],"color":["red","blue"]}

# Combinación de filtros
GET /products/store-123?categorySlugs=deportes&minPrice=20&maxPrice=200&status=ACTIVE&page=1&limit=20

# Solo paginación básica
GET /products/store-123?page=1&limit=20

# Obtener producto por slug
GET /products/by-slug/store-123/camiseta-deportiva

# Obtener producto por ID
GET /products/store-123/prod-456

# Estadísticas de productos
GET /products/statistics/store-123

# Incrementar contador de vistas
POST /products/store-123/prod-456/view
```

## Endpoints Completos de la API

### Endpoints Públicos (Requieren X-API-Key)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/products/:storeId` | Listar productos con filtros |
| GET | `/products/by-slug/:storeId/:slug` | Obtener producto por slug |
| GET | `/products/:storeId/:id` | Obtener producto por ID |
| GET | `/products/statistics/:storeId` | Estadísticas de productos |
| POST | `/products/:storeId/:id/view` | Incrementar contador de vistas |
| GET | `/products/:storeId/variants/:id` | Obtener variante por ID |
| GET | `/products/:storeId/variant-prices/:id` | Obtener precio de variante |

### Endpoints de Administración (Requieren Autenticación)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/products/:storeId` | Crear producto |
| PATCH | `/products/:storeId/:id` | Actualizar producto |
| PATCH | `/products/:storeId/:id/status` | Actualizar estado del producto |
| DELETE | `/products/:storeId/:id` | Eliminar producto |
| POST | `/products/:storeId/:productId/variants` | Crear variante |
| PATCH | `/products/:storeId/variants/:id` | Actualizar variante |
| PATCH | `/products/:storeId/variants/:id/new-product/:productId` | Mover variante a otro producto |
| DELETE | `/products/:storeId/variants/:id` | Eliminar variante |
| POST | `/products/:storeId/variant-prices` | Crear precio de variante |
| PATCH | `/products/:storeId/variant-prices/:id` | Actualizar precio de variante |
| DELETE | `/products/:storeId/variant-prices/:id` | Eliminar precio de variante |
| POST | `/products/:storeId/adjust-prices` | Ajustar precios por tipo de cambio |

## Manejo de Errores

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Store with ID store-123 not found"
}
```

### 400 Bad Request (validación)
```json
{
  "statusCode": 400,
  "message": [
    "categorySlugs debe ser un array",
    "La página debe ser al menos 1",
    "minPrice debe ser mayor o igual a 0",
    "attributeFilters debe ser un JSON válido"
  ],
  "error": "Bad Request"
}
```

### 400 Bad Request (filtros de atributos inválidos)
```json
{
  "statusCode": 400,
  "message": "Formato de filtros de atributos inválido",
  "error": "Bad Request"
}
```

### 400 Bad Request (rango de precios inválido)
```json
{
  "statusCode": 400,
  "message": "minPrice no puede ser mayor que maxPrice",
  "error": "Bad Request"
}
```

### 400 Bad Request (moneda no encontrada)
```json
{
  "statusCode": 400,
  "message": "Currency with ID curr-123 not found",
  "error": "Bad Request"
}
```

### 401 Unauthorized (API Key faltante)
```json
{
  "statusCode": 401,
  "message": "X-API-Key header is required",
  "error": "Unauthorized"
}
```

### 401 Unauthorized (API Key inválida)
```json
{
  "statusCode": 401,
  "message": "Invalid API key",
  "error": "Unauthorized"
}
```

### 403 Forbidden (acceso denegado)
```json
{
  "statusCode": 403,
  "message": "Access denied. Insufficient permissions",
  "error": "Forbidden"
}
```

### 409 Conflict (slug duplicado)
```json
{
  "statusCode": 409,
  "message": "Ya existe un producto con el slug 'camiseta-deportiva' en esta tienda",
  "error": "Conflict"
}
```

### 409 Conflict (precio duplicado)
```json
{
  "statusCode": 409,
  "message": "Ya existe un precio para esta variante y moneda",
  "error": "Conflict"
}
```

### 422 Unprocessable Entity (producto con órdenes)
```json
{
  "statusCode": 422,
  "message": "No se puede eliminar el producto con ID prod-123 porque tiene variantes que han sido pedidas. Considera archivarlo en su lugar.",
  "error": "Unprocessable Entity"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

### Códigos de Error Comunes

| Código | Descripción | Causa Común |
|--------|-------------|-------------|
| 400 | Bad Request | Parámetros inválidos, filtros mal formateados |
| 401 | Unauthorized | API Key faltante o inválida |
| 403 | Forbidden | Sin permisos para la operación |
| 404 | Not Found | Tienda, producto o recurso no encontrado |
| 409 | Conflict | Slug duplicado, precio existente |
| 422 | Unprocessable Entity | No se puede eliminar (tiene órdenes) |
| 500 | Internal Server Error | Error del servidor |

## Reglas de Transformación (Backend)

El backend automáticamente:
1. Convierte strings con comas a arrays: `"cat-1,cat-2"` → `["cat-1", "cat-2"]`
2. Elimina espacios: `"cat-1, cat-2"` → `["cat-1", "cat-2"]`
3. Filtra valores vacíos: `"cat-1,,cat-2"` → `["cat-1", "cat-2"]`
4. Preserva arrays nativos: `["cat-1", "cat-2"]` → `["cat-1", "cat-2"]`

## Autenticación

### Endpoints Públicos
- Requieren `PublicKeyGuard`
- Enviar header: `X-API-Key: <public-key>`
- No requieren autenticación de usuario

### Endpoints de Administración
- Requieren `AuthGuard`
- Enviar header: `Authorization: Bearer <jwt-token>`
- Requieren permisos de administrador de tienda

## Rate Limiting

### Límites por Tienda
- **Consultas públicas**: 1000 requests/hora por API Key
- **Operaciones de administración**: 500 requests/hora por usuario
- **Ajuste de precios**: 10 requests/día por tienda

### Headers de Rate Limiting
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

### Respuesta cuando se excede el límite
```json
{
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too Many Requests",
  "retryAfter": 3600
}
```

## Consideraciones de Performance

### Límites de Consulta
- `limit` máximo: 100 items por página
- Default limit: 20 items por página
- Timeout de consulta: 30 segundos
- Timeout de transacciones: 30 segundos

### Optimizaciones Implementadas
- **Índices de base de datos** en:
  - `storeId` (búsquedas por tienda)
  - `status` (filtros de estado)
  - `vendor` (filtros de proveedor)
  - `slug` (búsquedas por slug)
  - `viewCount` (ordenamiento por popularidad)

### Relaciones Incluidas
- **Siempre incluidas**: categories, collections, variants con prices
- **Optimización**: Solo se cargan campos necesarios de categorías
- **Lazy loading**: Las relaciones se cargan bajo demanda

### Filtros de Performance
- **Filtros de atributos**: Optimizados con índices JSON
- **Filtros de precio**: Usan índices compuestos en currency + price
- **Búsqueda de texto**: Usa índices de texto completo

### Recomendaciones de Uso
1. **Paginación**: Siempre usar paginación para listas grandes
2. **Filtros específicos**: Usar filtros para reducir el dataset
3. **Caché**: Implementar caché en el frontend para consultas frecuentes
4. **Límites**: No exceder 100 items por consulta
5. **Filtros de atributos**: Usar solo cuando sea necesario (consume más recursos)

### Monitoreo de Performance
- **Tiempo de respuesta promedio**: < 200ms para consultas simples
- **Tiempo de respuesta máximo**: < 2s para consultas complejas
- **Uso de memoria**: Optimizado para consultas concurrentes
- **Conexiones de BD**: Pool de conexiones configurado

### Casos de Uso Optimizados
- **Búsqueda simple**: `?query=zapatos&status=ACTIVE`
- **Filtros básicos**: `?categorySlugs=deportes&vendor=Nike`
- **Paginación**: `?page=1&limit=20`
- **Ordenamiento**: `?sortBy=viewCount&sortOrder=desc`

### Casos de Uso que Requieren Cuidado
- **Filtros complejos**: Múltiples filtros + atributos + precios
- **Consultas grandes**: `limit=100` con muchos filtros
- **Búsquedas amplias**: Sin filtros en tiendas con muchos productos
- **Filtros de atributos**: Con muchos valores diferentes

