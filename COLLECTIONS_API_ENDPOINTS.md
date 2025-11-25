# Collections API - Endpoints Documentation

Este documento contiene todas las rutas de los endpoints de Collections con sus formatos de input y output.

## Base URL
```
/collections
```

## Autenticación
- **AuthGuard**: Endpoints que requieren autenticación completa
- **PublicKeyGuard**: Endpoints que requieren solo la clave pública de la tienda

---

## 1. Crear Colección

### Endpoint
```
POST /collections/:storeId
```

### Autenticación
- **AuthGuard** (requerido)

### Parámetros de URL
- `storeId` (string, requerido): ID de la tienda

### Body (CreateCollectionDto)
```json
{
  "title": "string (requerido, max 100 caracteres)",
  "slug": "string (requerido, max 100 caracteres, solo letras minúsculas, números y guiones)",
  "description": "string (opcional, max 500 caracteres)",
  "imageUrl": "string (opcional, debe ser URL válida)",
  "isFeatured": "boolean (opcional, default: false)",
  "metaTitle": "string (opcional, max 100 caracteres)",
  "metaDescription": "string (opcional, max 200 caracteres)",
  "products": [
    {
      "productId": "string (ID del producto)"
    }
  ]
}
```

### Respuesta Exitosa (201)
```json
{
  "id": "string",
  "title": "string",
  "slug": "string",
  "description": "string",
  "imageUrl": "string",
  "isFeatured": "boolean",
  "metaTitle": "string",
  "metaDescription": "string",
  "storeId": "string",
  "createdAt": "ISO 8601 date",
  "updatedAt": "ISO 8601 date",
  "products": [
    {
      "id": "string",
      "title": "string",
      "slug": "string",
      "status": "string"
    }
  ]
}
```

---

## 2. Obtener Todas las Colecciones de una Tienda

### Endpoint
```
GET /collections/:storeId
```

### Autenticación
- **PublicKeyGuard** (requerido)

### Parámetros de URL
- `storeId` (string, requerido): ID de la tienda

### Query Parameters (SearchCollectionDto)
```
?query=string (opcional, búsqueda en título y descripción)
&includeInactive=boolean (opcional, default: false)
&page=number (opcional, default: 1, min: 1)
&limit=number (opcional, default: 20, min: 1, max: 100)
&sortBy=string (opcional, default: 'createdAt')
&sortOrder=string (opcional, 'asc' | 'desc', default: 'desc')
```

### Respuesta Exitosa (200)
```json
{
  "data": [
    {
      "id": "string",
      "title": "string",
      "slug": "string",
      "description": "string",
      "imageUrl": "string",
      "isFeatured": "boolean",
      "metaTitle": "string",
      "metaDescription": "string",
      "storeId": "string",
      "createdAt": "ISO 8601 date",
      "updatedAt": "ISO 8601 date",
      "products": [
        {
          "id": "string",
          "title": "string",
          "slug": "string",
          "status": "string"
        }
      ]
    }
  ],
  "meta": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "totalPages": "number",
    "hasNextPage": "boolean",
    "hasPrevPage": "boolean"
  }
}
```

---

## 3. Obtener Colección Específica

### Endpoint
```
GET /collections/:storeId/:id
```

### Autenticación
- **PublicKeyGuard** (requerido)

### Parámetros de URL
- `storeId` (string, requerido): ID de la tienda
- `id` (string, requerido): ID de la colección

### Respuesta Exitosa (200)
```json
{
  "id": "string",
  "title": "string",
  "slug": "string",
  "description": "string",
  "imageUrl": "string",
  "isFeatured": "boolean",
  "metaTitle": "string",
  "metaDescription": "string",
  "storeId": "string",
  "createdAt": "ISO 8601 date",
  "updatedAt": "ISO 8601 date",
  "products": [
    {
      "id": "string",
      "title": "string",
      "slug": "string",
      "status": "string",
      // ... otros campos del producto
    }
  ]
}
```

---

## 4. Actualizar Colección

### Endpoint
```
PATCH /collections/:storeId/:id
```

### Autenticación
- **AuthGuard** (requerido)

### Parámetros de URL
- `storeId` (string, requerido): ID de la tienda
- `id` (string, requerido): ID de la colección

### Body (UpdateCollectionDto - todos los campos opcionales)
```json
{
  "title": "string (opcional, max 100 caracteres)",
  "slug": "string (opcional, max 100 caracteres, solo letras minúsculas, números y guiones)",
  "description": "string (opcional, max 500 caracteres)",
  "imageUrl": "string (opcional, debe ser URL válida)",
  "isFeatured": "boolean (opcional)",
  "metaTitle": "string (opcional, max 100 caracteres)",
  "metaDescription": "string (opcional, max 200 caracteres)",
  "products": [
    {
      "productId": "string (ID del producto)"
    }
  ]
}
```

### Respuesta Exitosa (200)
```json
{
  "id": "string",
  "title": "string",
  "slug": "string",
  "description": "string",
  "imageUrl": "string",
  "isFeatured": "boolean",
  "metaTitle": "string",
  "metaDescription": "string",
  "storeId": "string",
  "createdAt": "ISO 8601 date",
  "updatedAt": "ISO 8601 date",
  "products": [
    {
      "id": "string",
      "title": "string",
      "slug": "string",
      "status": "string"
    }
  ]
}
```

---

## 5. Eliminar Colección

### Endpoint
```
DELETE /collections/:storeId/:id
```

### Autenticación
- **AuthGuard** (requerido)

### Parámetros de URL
- `storeId` (string, requerido): ID de la tienda
- `id` (string, requerido): ID de la colección

### Respuesta Exitosa (200)
```json
{
  "id": "string",
  "title": "string",
  "slug": "string",
  "description": "string",
  "imageUrl": "string",
  "isFeatured": "boolean",
  "metaTitle": "string",
  "metaDescription": "string",
  "storeId": "string",
  "createdAt": "ISO 8601 date",
  "updatedAt": "ISO 8601 date"
}
```

---

## 6. Agregar Producto a Colección

### Endpoint
```
PATCH /collections/:storeId/:id/products/:productId
```

### Autenticación
- **AuthGuard** (requerido)

### Parámetros de URL
- `storeId` (string, requerido): ID de la tienda
- `id` (string, requerido): ID de la colección
- `productId` (string, requerido): ID del producto

### Respuesta Exitosa (200)
```json
{
  "id": "string",
  "title": "string",
  "slug": "string",
  "description": "string",
  "imageUrl": "string",
  "isFeatured": "boolean",
  "metaTitle": "string",
  "metaDescription": "string",
  "storeId": "string",
  "createdAt": "ISO 8601 date",
  "updatedAt": "ISO 8601 date",
  "products": [
    {
      "id": "string",
      "title": "string",
      "slug": "string",
      "status": "string"
    }
  ]
}
```

---

## 7. Remover Producto de Colección

### Endpoint
```
DELETE /collections/:storeId/:id/products/:productId
```

### Autenticación
- **AuthGuard** (requerido)

### Parámetros de URL
- `storeId` (string, requerido): ID de la tienda
- `id` (string, requerido): ID de la colección
- `productId` (string, requerido): ID del producto

### Respuesta Exitosa (200)
```json
{
  "id": "string",
  "title": "string",
  "slug": "string",
  "description": "string",
  "imageUrl": "string",
  "isFeatured": "boolean",
  "metaTitle": "string",
  "metaDescription": "string",
  "storeId": "string",
  "createdAt": "ISO 8601 date",
  "updatedAt": "ISO 8601 date",
  "products": [
    {
      "id": "string",
      "title": "string",
      "slug": "string",
      "status": "string"
    }
  ]
}
```

---

## Códigos de Error Comunes

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "string (descripción del error)",
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Colección con ID 'xxx' no encontrada",
  "error": "Not Found"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "Ya existe una colección con el slug 'xxx' en esta tienda",
  "error": "Conflict"
}
```

---

## Validaciones Especiales

1. **Slug único por tienda**: Cada colección debe tener un slug único dentro de la misma tienda
2. **Productos válidos**: Los productos deben existir y pertenecer a la misma tienda
3. **Relaciones many-to-many**: Las colecciones pueden tener múltiples productos y viceversa
4. **Slug formato**: Solo letras minúsculas, números y guiones (`/^[a-z0-9-]+$/`)
5. **Límites de caracteres**: Respetar los límites de longitud especificados en cada campo

---

## Notas de Implementación

- Todas las operaciones están validadas a nivel de tienda para seguridad
- Los productos se desconectan automáticamente al eliminar una colección
- La paginación está implementada con límites configurables
- Los errores se manejan de forma consistente usando ErrorHandler
- Las validaciones incluyen verificación de existencia de recursos relacionados
