asd
# Documentación API de Collections

## Descripción General

La API de Collections permite gestionar colecciones de productos en el sistema. Las colecciones son grupos de productos relacionados que se pueden organizar por categorías, temporadas, promociones, etc.

## Base URL
```
/collections
```

## Autenticación

- **Endpoints públicos**: Utilizan `PublicKeyGuard` (solo lectura)
- **Endpoints protegidos**: Utilizan `AuthGuard` (requieren autenticación completa)

---

## Endpoints Disponibles

### 1. Crear Colección

**Endpoint:** `POST /collections/:storeId`

**Autenticación:** `AuthGuard` (Protegido)

**Descripción:** Crea una nueva colección para una tienda específica.

#### Parámetros de URL
- `storeId` (string, requerido): ID de la tienda

#### Body (CreateCollectionDto)
```json
{
  "title": "string",           // Título de la colección (máx. 100 caracteres)
  "slug": "string",            // Slug único (máx. 100 caracteres, solo letras minúsculas, números y guiones)
  "description": "string",     // Descripción opcional (máx. 500 caracteres)
  "imageUrl": "string",        // URL de imagen opcional (debe ser URL válida)
  "storeId": "string",         // ID de la tienda (debe coincidir con el parámetro de URL)
  "isFeatured": boolean,       // Si la colección es destacada (opcional, default: false)
  "metaTitle": "string",       // Título SEO (máx. 100 caracteres, opcional)
  "metaDescription": "string", // Descripción SEO (máx. 200 caracteres, opcional)
  "products": [                // Array de productos opcional
    {
      "productId": "string"    // ID del producto
    }
  ]
}
```

#### Ejemplo de Request
```json
POST /collections/store-123
{
  "title": "Colección Verano 2024",
  "slug": "coleccion-verano-2024",
  "description": "Los mejores productos para el verano",
  "imageUrl": "https://example.com/images/summer-collection.jpg",
  "storeId": "store-123",
  "isFeatured": true,
  "metaTitle": "Colección Verano 2024 - Tienda",
  "metaDescription": "Descubre nuestra colección de verano con los mejores productos",
  "products": [
    { "productId": "product-1" },
    { "productId": "product-2" }
  ]
}
```

#### Response (201 Created)
```json
{
  "id": "collection-123",
  "title": "Colección Verano 2024",
  "slug": "coleccion-verano-2024",
  "description": "Los mejores productos para el verano",
  "imageUrl": "https://example.com/images/summer-collection.jpg",
  "storeId": "store-123",
  "isFeatured": true,
  "metaTitle": "Colección Verano 2024 - Tienda",
  "metaDescription": "Descubre nuestra colección de verano con los mejores productos",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "products": [
    {
      "id": "product-1",
      "title": "Producto 1",
      "slug": "producto-1",
      "status": "ACTIVE"
    },
    {
      "id": "product-2",
      "title": "Producto 2",
      "slug": "producto-2",
      "status": "ACTIVE"
    }
  ]
}
```

#### Validaciones
- El `storeId` en el body debe coincidir con el parámetro de URL
- El `slug` debe ser único dentro de la tienda
- Los productos deben existir y pertenecer a la tienda especificada
- El slug solo puede contener letras minúsculas, números y guiones

---

### 2. Obtener Todas las Colecciones de una Tienda

**Endpoint:** `GET /collections/:storeId`

**Autenticación:** `PublicKeyGuard` (Público)

**Descripción:** Obtiene todas las colecciones de una tienda específica con paginación y filtros.

#### Parámetros de URL
- `storeId` (string, requerido): ID de la tienda

#### Query Parameters (SearchCollectionDto)
- `query` (string, opcional): Búsqueda por título o descripción
- `includeInactive` (boolean, opcional): Incluir colecciones inactivas (default: false)
- `page` (number, opcional): Número de página (default: 1, mínimo: 1)
- `limit` (number, opcional): Elementos por página (default: 20, máximo: 100)
- `sortBy` (string, opcional): Campo para ordenar (default: 'createdAt')
- `sortOrder` (string, opcional): Orden ascendente o descendente ('asc' | 'desc', default: 'desc')

#### Ejemplo de Request
```
GET /collections/store-123?query=verano&page=1&limit=10&sortBy=title&sortOrder=asc
```

#### Response (200 OK)
```json
{
  "data": [
    {
      "id": "collection-123",
      "title": "Colección Verano 2024",
      "slug": "coleccion-verano-2024",
      "description": "Los mejores productos para el verano",
      "imageUrl": "https://example.com/images/summer-collection.jpg",
      "storeId": "store-123",
      "isFeatured": true,
      "metaTitle": "Colección Verano 2024 - Tienda",
      "metaDescription": "Descubre nuestra colección de verano con los mejores productos",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "products": [
        {
          "id": "product-1",
          "title": "Producto 1",
          "slug": "producto-1",
          "status": "ACTIVE"
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### 3. Obtener Una Colección Específica

**Endpoint:** `GET /collections/:storeId/:id`

**Autenticación:** `PublicKeyGuard` (Público)

**Descripción:** Obtiene una colección específica por su ID y tienda.

#### Parámetros de URL
- `storeId` (string, requerido): ID de la tienda
- `id` (string, requerido): ID de la colección

#### Ejemplo de Request
```
GET /collections/store-123/collection-123
```

#### Response (200 OK)
```json
{
  "id": "collection-123",
  "title": "Colección Verano 2024",
  "slug": "coleccion-verano-2024",
  "description": "Los mejores productos para el verano",
  "imageUrl": "https://example.com/images/summer-collection.jpg",
  "storeId": "store-123",
  "isFeatured": true,
  "metaTitle": "Colección Verano 2024 - Tienda",
  "metaDescription": "Descubre nuestra colección de verano con los mejores productos",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "products": [
    {
      "id": "product-1",
      "title": "Producto 1",
      "slug": "producto-1",
      "status": "ACTIVE",
      "price": 29.99,
      "description": "Descripción del producto 1"
    }
  ]
}
```

#### Error (404 Not Found)
```json
{
  "statusCode": 404,
  "message": "Colección con ID 'collection-123' en tienda 'store-123' no encontrada",
  "error": "Not Found"
}
```

---

### 4. Actualizar Colección

**Endpoint:** `PATCH /collections/:storeId/:id`

**Autenticación:** `AuthGuard` (Protegido)

**Descripción:** Actualiza una colección existente.

#### Parámetros de URL
- `storeId` (string, requerido): ID de la tienda
- `id` (string, requerido): ID de la colección

#### Body (UpdateCollectionDto)
```json
{
  "title": "string",           // Título de la colección (máx. 100 caracteres)
  "slug": "string",            // Slug único (máx. 100 caracteres)
  "description": "string",     // Descripción opcional (máx. 500 caracteres)
  "imageUrl": "string",        // URL de imagen opcional
  "storeId": "string",         // ID de la tienda (debe coincidir con el parámetro de URL)
  "isFeatured": boolean,       // Si la colección es destacada
  "metaTitle": "string",       // Título SEO (máx. 100 caracteres)
  "metaDescription": "string", // Descripción SEO (máx. 200 caracteres)
  "products": [                // Array de productos (reemplaza todos los productos existentes)
    {
      "productId": "string"
    }
  ]
}
```

#### Ejemplo de Request
```json
PATCH /collections/store-123/collection-123
{
  "title": "Colección Verano 2024 Actualizada",
  "description": "Descripción actualizada de la colección",
  "isFeatured": false,
  "products": [
    { "productId": "product-1" },
    { "productId": "product-3" }
  ]
}
```

#### Response (200 OK)
```json
{
  "id": "collection-123",
  "title": "Colección Verano 2024 Actualizada",
  "slug": "coleccion-verano-2024",
  "description": "Descripción actualizada de la colección",
  "imageUrl": "https://example.com/images/summer-collection.jpg",
  "storeId": "store-123",
  "isFeatured": false,
  "metaTitle": "Colección Verano 2024 - Tienda",
  "metaDescription": "Descubre nuestra colección de verano con los mejores productos",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T11:45:00Z",
  "products": [
    {
      "id": "product-1",
      "title": "Producto 1",
      "slug": "producto-1",
      "status": "ACTIVE"
    },
    {
      "id": "product-3",
      "title": "Producto 3",
      "slug": "producto-3",
      "status": "ACTIVE"
    }
  ]
}
```

#### Validaciones
- El `storeId` en el body debe coincidir con el parámetro de URL
- Si se actualiza el slug, debe ser único dentro de la tienda
- Los productos deben existir y pertenecer a la tienda especificada

---

### 5. Eliminar Colección

**Endpoint:** `DELETE /collections/:storeId/:id`

**Autenticación:** `AuthGuard` (Protegido)

**Descripción:** Elimina una colección y desconecta todos sus productos.

#### Parámetros de URL
- `storeId` (string, requerido): ID de la tienda
- `id` (string, requerido): ID de la colección

#### Ejemplo de Request
```
DELETE /collections/store-123/collection-123
```

#### Response (200 OK)
```json
{
  "id": "collection-123",
  "title": "Colección Verano 2024",
  "slug": "coleccion-verano-2024",
  "description": "Los mejores productos para el verano",
  "imageUrl": "https://example.com/images/summer-collection.jpg",
  "storeId": "store-123",
  "isFeatured": true,
  "metaTitle": "Colección Verano 2024 - Tienda",
  "metaDescription": "Descubre nuestra colección de verano con los mejores productos",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

#### Notas
- Al eliminar una colección, se desconectan automáticamente todos los productos asociados
- Los productos no se eliminan, solo se desconectan de la colección

---

### 6. Agregar Producto a Colección

**Endpoint:** `PATCH /collections/:storeId/:id/products/:productId`

**Autenticación:** `AuthGuard` (Protegido)

**Descripción:** Agrega un producto específico a una colección.

#### Parámetros de URL
- `storeId` (string, requerido): ID de la tienda
- `id` (string, requerido): ID de la colección
- `productId` (string, requerido): ID del producto

#### Ejemplo de Request
```
PATCH /collections/store-123/collection-123/products/product-4
```

#### Response (200 OK)
```json
{
  "id": "collection-123",
  "title": "Colección Verano 2024",
  "slug": "coleccion-verano-2024",
  "description": "Los mejores productos para el verano",
  "imageUrl": "https://example.com/images/summer-collection.jpg",
  "storeId": "store-123",
  "isFeatured": true,
  "metaTitle": "Colección Verano 2024 - Tienda",
  "metaDescription": "Descubre nuestra colección de verano con los mejores productos",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T12:00:00Z",
  "products": [
    {
      "id": "product-1",
      "title": "Producto 1",
      "slug": "producto-1",
      "status": "ACTIVE"
    },
    {
      "id": "product-4",
      "title": "Producto 4",
      "slug": "producto-4",
      "status": "ACTIVE"
    }
  ]
}
```

#### Error (400 Bad Request)
```json
{
  "statusCode": 400,
  "message": "El producto con ID 'product-4' ya está en esta colección",
  "error": "Bad Request"
}
```

#### Validaciones
- La colección debe existir y pertenecer a la tienda especificada
- El producto debe existir y pertenecer a la tienda especificada
- El producto no debe estar ya en la colección

---

### 7. Remover Producto de Colección

**Endpoint:** `DELETE /collections/:storeId/:id/products/:productId`

**Autenticación:** `AuthGuard` (Protegido)

**Descripción:** Remueve un producto específico de una colección.

#### Parámetros de URL
- `storeId` (string, requerido): ID de la tienda
- `id` (string, requerido): ID de la colección
- `productId` (string, requerido): ID del producto

#### Ejemplo de Request
```
DELETE /collections/store-123/collection-123/products/product-4
```

#### Response (200 OK)
```json
{
  "id": "collection-123",
  "title": "Colección Verano 2024",
  "slug": "coleccion-verano-2024",
  "description": "Los mejores productos para el verano",
  "imageUrl": "https://example.com/images/summer-collection.jpg",
  "storeId": "store-123",
  "isFeatured": true,
  "metaTitle": "Colección Verano 2024 - Tienda",
  "metaDescription": "Descubre nuestra colección de verano con los mejores productos",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T12:15:00Z",
  "products": [
    {
      "id": "product-1",
      "title": "Producto 1",
      "slug": "producto-1",
      "status": "ACTIVE"
    }
  ]
}
```

#### Error (400 Bad Request)
```json
{
  "statusCode": 400,
  "message": "El producto con ID 'product-4' no está en esta colección",
  "error": "Bad Request"
}
```

#### Validaciones
- La colección debe existir y pertenecer a la tienda especificada
- El producto debe existir y pertenecer a la tienda especificada
- El producto debe estar actualmente en la colección

---

## Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| 200 | OK - Operación exitosa |
| 201 | Created - Colección creada exitosamente |
| 400 | Bad Request - Datos inválidos o errores de validación |
| 401 | Unauthorized - Token de autenticación inválido o faltante |
| 404 | Not Found - Recurso no encontrado |
| 409 | Conflict - Conflicto (ej: slug duplicado) |
| 500 | Internal Server Error - Error interno del servidor |

## Errores Comunes

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Falta agregar id de la tienda",
  "error": "Bad Request"
}
```

### 400 Bad Request - Slug inválido
```json
{
  "statusCode": 400,
  "message": "El slug solo puede contener letras minúsculas, números y guiones",
  "error": "Bad Request"
}
```

### 409 Conflict - Slug duplicado
```json
{
  "statusCode": 409,
  "message": "Ya existe una colección con el slug 'coleccion-verano-2024' en esta tienda",
  "error": "Conflict"
}
```

### 400 Bad Request - Productos no encontrados
```json
{
  "statusCode": 400,
  "message": "Los productos con IDs [product-999, product-888] no existen en esta tienda",
  "error": "Bad Request"
}
```

## Notas Importantes

1. **Relación Many-to-Many**: Las colecciones tienen una relación many-to-many con los productos
2. **Slug único**: Cada slug debe ser único dentro de una tienda específica
3. **Validación de tienda**: Todos los productos deben pertenecer a la misma tienda que la colección
4. **Paginación**: Los endpoints de listado incluyen paginación automática
5. **Búsqueda**: Se puede buscar por título y descripción usando el parámetro `query`
6. **Ordenamiento**: Se puede ordenar por cualquier campo usando `sortBy` y `sortOrder`
7. **Desconexión automática**: Al eliminar una colección, se desconectan automáticamente todos los productos

## Ejemplos de Uso Completos

### Crear una colección con productos
```bash
curl -X POST "https://api.example.com/collections/store-123" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Colección Navidad 2024",
    "slug": "coleccion-navidad-2024",
    "description": "Productos especiales para Navidad",
    "storeId": "store-123",
    "isFeatured": true,
    "products": [
      {"productId": "product-1"},
      {"productId": "product-2"}
    ]
  }'
```

### Buscar colecciones
```bash
curl -X GET "https://api.example.com/collections/store-123?query=navidad&page=1&limit=5" \
  -H "X-Public-Key: YOUR_PUBLIC_KEY"
```

### Agregar producto a colección
```bash
curl -X PATCH "https://api.example.com/collections/store-123/collection-123/products/product-5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```
