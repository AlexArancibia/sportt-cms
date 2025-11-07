# Documentacion Completa de la API de Card Section

## Tabla de Contenidos
1. [Informacion General](#informacion-general)
2. [Endpoints Principales](#1-endpoints-principales)
3. [Estructuras de Datos](#2-estructuras-de-datos)
4. [Codigos de Estado HTTP](#3-codigos-de-estado-http)
5. [Errores y Validaciones](#4-errores-y-validaciones)
6. [Reglas de Negocio](#5-reglas-de-negocio)
7. [Ejemplos de Uso](#6-ejemplos-de-uso)

---

## Informacion General

> **Actualización 2025-11-07:** El backend y los DTOs ahora usan `linkText` como campo para la etiqueta del enlace/botón de cada card. Cualquier referencia previa a `buttonText` queda obsoleta.

### Base URL
```
https://api.tudominio.com/card-section
```

### Autenticacion

**Headers requeridos:**
```
X-Public-Key: tu-public-key   // Endpoints de solo lectura
Authorization: Bearer tu-token   // Endpoints protegidos
```

- **PublicKeyGuard**: Endpoints `GET`
- **AuthGuard**: Endpoints `POST`, `PATCH`, `DELETE`

### Alcance
- Cada seccion de cards pertenece a una tienda (`storeId`).
- Todas las operaciones requieren proporcionar el `storeId` en la ruta.
- Las secciones almacenan contenido de cards reutilizable (titulo, textos, enlaces, imagen, video, boton).

---

## 1. Endpoints Principales

### 1.1 Crear seccion de cards
**`POST`** `/card-section/:storeId`

**Autenticacion**: AuthGuard

**URL Completa**: `https://api.tudominio.com/card-section/store123`

**Request Body**:
```json
{
  "title": "Destacados",
  "subtitle": "Novedades de la semana",
  "description": "Explora contenido recomendado",
  "isActive": true,
  "cards": [
    {
      "title": "Card 1",
      "subtitle": "Subtitulo opcional",
      "description": "Texto descriptivo",
      "imageUrl": "https://cdn.example.com/card1.png",
      "linkUrl": "https://www.example.com/card-1",
      "linkText": "Ver mas",
      "videoUrl": "https://cdn.example.com/card1.mp4"
    }
  ]
}
```

**Restricciones y Validaciones**:

| Campo | Tipo | Obligatorio | Restricciones |
|-------|------|-------------|---------------|
| `title` | string | ✅ | 1-200 caracteres (se recomienda trim) |
| `subtitle` | string | ❌ | Max 300 caracteres |
| `description` | string | ❌ | Max 1000 caracteres |
| `isActive` | boolean | ❌ | Default: `true` |
| `cards` | array | ✅ | Debe contener al menos una card |
| `cards[].title` | string | ✅ | 1-200 caracteres |
| `cards[].subtitle` | string | ❌ | Max 300 caracteres |
| `cards[].description` | string | ❌ | Max 1000 caracteres |
| `cards[].imageUrl` | string | ❌ | URL valida |
| `cards[].linkUrl` | string | ❌ | URL valida |
| `cards[].linkText` | string | ❌ | Max 50 caracteres |
| `cards[].videoUrl` | string | ❌ | URL valida |

> **Nota:** versiones anteriores de esta documentación mencionaban `buttonText`. El modelo actual utiliza `linkText` como etiqueta del enlace/botón.

**Response 201 Created**:
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Card section creada exitosamente",
  "data": {
    "id": "cs_123",
    "title": "Destacados",
    "subtitle": "Novedades de la semana",
    "description": "Explora contenido recomendado",
    "isActive": true,
    "storeId": "store123",
    "cards": [
      {
        "id": "card_456",
        "title": "Card 1",
        "subtitle": "Subtitulo opcional",
        "description": "Texto descriptivo",
        "imageUrl": "https://cdn.example.com/card1.png",
        "linkUrl": "https://www.example.com/card-1",
        "linkText": "Ver mas",
        "videoUrl": "https://cdn.example.com/card1.mp4"
      }
    ],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Errores**:
- **400 Bad Request**: Validaciones no cumplidas o referencia a store invalida (`P2003`)
- **401 Unauthorized**: Token invalido o ausente
- **404 Not Found**: `storeId` no existe
- **500 Internal Server Error**: Error inesperado al crear la seccion

---

### 1.2 Listar secciones de una tienda
**`GET`** `/card-section/:storeId`

**Autenticacion**: PublicKeyGuard

**Response 200 OK**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Card sections obtenidas exitosamente",
  "data": [
    {
      "id": "cs_123",
      "title": "Destacados",
      "subtitle": "Novedades de la semana",
      "description": "Explora contenido recomendado",
      "isActive": true,
      "storeId": "store123",
      "cards": [
        {
          "id": "card_456",
          "title": "Card 1",
          "subtitle": "Subtitulo opcional",
          "description": "Texto descriptivo",
          "imageUrl": "https://cdn.example.com/card1.png",
          "linkUrl": "https://www.example.com/card-1",
          "linkText": "Ver mas",
          "videoUrl": "https://cdn.example.com/card1.mp4"
        }
      ]
    }
  ],
  "timestamp": "2024-01-15T10:45:00.000Z"
}
```

**Errores**:
- **400 Bad Request**: Error inesperado en la consulta
- **401 Unauthorized**: Public key invalida o faltante
- **404 Not Found**: Tienda no encontrada

---

### 1.3 Obtener una seccion por ID
**`GET`** `/card-section/:storeId/:id`

**Autenticacion**: PublicKeyGuard

**Response 200 OK**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Card section obtenida exitosamente",
  "data": {
    "id": "cs_123",
    "title": "Destacados",
    "subtitle": "Novedades de la semana",
    "description": "Explora contenido recomendado",
    "isActive": true,
    "storeId": "store123",
    "cards": [
      {
        "id": "card_456",
        "title": "Card 1",
        "subtitle": "Subtitulo opcional",
        "description": "Texto descriptivo",
        "imageUrl": "https://cdn.example.com/card1.png",
        "linkUrl": "https://www.example.com/card-1",
        "linkText": "Ver mas",
        "videoUrl": "https://cdn.example.com/card1.mp4"
      }
    ]
  },
  "timestamp": "2024-01-15T10:50:00.000Z"
}
```

**Errores**:
- **401 Unauthorized**: Public key invalida o faltante
- **404 Not Found**: Seccion no encontrada en la tienda

---

### 1.4 Actualizar una seccion
**`PATCH`** `/card-section/:storeId/:id`

**Autenticacion**: AuthGuard

**Request Body** (todos los campos son opcionales; se aplica `PartialType` del DTO de creacion):
```json
{
  "title": "Destacados actualizados",
  "isActive": false,
  "cards": [
    {
      "title": "Card 1 actualizada",
      "description": "Nuevo texto para la card",
      "linkUrl": "https://www.example.com/card-1-updated",
      "linkText": "Descubrir"
    },
    {
      "title": "Card 2",
      "imageUrl": "https://cdn.example.com/card2.png"
    }
  ]
}
```

**Comportamiento de actualizacion**:
- Si se incluye el arreglo `cards`, todas las cards existentes se eliminan y se recrean con los datos nuevos.
- Si no se incluye `cards`, solo se actualizan los campos de la seccion principal (`title`, `subtitle`, `description`, `isActive`).

**Response 200 OK**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Card section actualizada exitosamente",
  "data": {
    "id": "cs_123",
    "title": "Destacados actualizados",
    "isActive": false,
    "cards": [
      {
        "id": "card_789",
        "title": "Card 1 actualizada"
      },
      {
        "id": "card_790",
        "title": "Card 2"
      }
    ],
    "updatedAt": "2024-01-15T11:15:00.000Z"
  },
  "timestamp": "2024-01-15T11:15:00.000Z"
}
```

**Errores**:
- **400 Bad Request**: Validaciones fallidas (por ejemplo, falta `title` en una card)
- **401 Unauthorized**: Token invalido o ausente
- **404 Not Found**: Seccion no encontrada en la tienda

---

### 1.5 Eliminar una seccion
**`DELETE`** `/card-section/:storeId/:id`

**Autenticacion**: AuthGuard

**Response 200 OK**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Card section eliminada exitosamente",
  "data": {
    "id": "cs_123",
    "title": "Destacados"
  },
  "timestamp": "2024-01-15T11:30:00.000Z"
}
```

**Errores**:
- **401 Unauthorized**: Token invalido o ausente
- **404 Not Found**: Seccion no encontrada en la tienda
- **500 Internal Server Error**: Error inesperado al eliminar

---

## 2. Estructuras de Datos

### 2.1 CardSection
```typescript
{
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  isActive: boolean;
  storeId: string;
  createdAt: Date;
  updatedAt: Date;
  cards: CardItem[];
}
```

### 2.2 CardItem
```typescript
{
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  linkUrl?: string;
  linkText?: string;
  videoUrl?: string;
  cardSectionId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 3. Codigos de Estado HTTP

| Codigo | Descripcion | Cuándo ocurre |
|--------|-------------|---------------|
| **200** | OK | Operaciones de lectura, actualizacion o eliminacion exitosas |
| **201** | Created | Seccion creada correctamente |
| **400** | Bad Request | Validaciones fallidas, referencias invalidas, errores Prisma (`P2003`) |
| **401** | Unauthorized | Token o public key invalida o ausente |
| **404** | Not Found | Tienda o seccion inexistente |
| **409** | Conflict | No aplica actualmente (reservado para futuras reglas de unicidad) |
| **500** | Internal Server Error | Error inesperado del servidor |

---

## 4. Errores y Validaciones

### 4.1 Formato de errores
```json
{
  "success": false,
  "statusCode": 400,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/card-section/store123",
  "method": "POST",
  "message": "Descripcion del error",
  "error": "BadRequestException",
  "errors": [
    {
      "field": "cards[0].title",
      "value": "",
      "constraints": ["Card title is required"],
      "message": "cards[0].title: Card title is required"
    }
  ]
}
```

### 4.2 Validaciones comunes
- `Card title is required`: Cada card debe incluir un `title` no vacio.
- `Invalid reference: The provided store does not exist`: El `storeId` no corresponde a una tienda existente (Prisma `P2003`).
- `Store with ID 'storeId' not found`: La tienda no existe o no pertenece al usuario.

### 4.3 Manejo de errores Prisma

| Codigo Prisma | Descripcion | HTTP Status |
|---------------|-------------|-------------|
| `P2003` | Referencia invalida (foreign key) | 400 Bad Request |
| `P2025` | Registro no encontrado | 404 Not Found |

---

## 5. Reglas de Negocio
- Cada tienda puede crear multiples secciones de cards.
- `cards` es obligatorio al crear una seccion; cada elemento debe incluir `title`.
- En la actualizacion, las cards se reemplazan por completo si se envia el arreglo.
- El campo `isActive` controla la visibilidad de la seccion.
- Se eliminan todas las cards asociadas cuando se borra la seccion.
- Los endpoints de lectura verifican que la seccion pertenezca al `storeId` proporcionado.

---

## 6. Ejemplos de Uso

### 6.1 Crear una seccion completa
```http
POST /card-section/store123 HTTP/1.1
Authorization: Bearer tu-token
Content-Type: application/json

{
  "title": "Destacados",
  "subtitle": "Novedades",
  "description": "Contenido curado para tu tienda",
  "cards": [
    {
      "title": "Card 1",
      "description": "Descripcion 1",
      "imageUrl": "https://cdn.example.com/card1.png",
      "linkUrl": "https://www.example.com/card-1",
      "linkText": "Ver",
      "videoUrl": "https://cdn.example.com/card1.mp4"
    },
    {
      "title": "Card 2",
      "subtitle": "Nuevo",
      "description": "Descripcion 2"
    }
  ]
}
```

### 6.2 Listar todas las secciones activas de una tienda
```http
GET /card-section/store123 HTTP/1.1
X-Public-Key: tu-public-key
```

### 6.3 Obtener una seccion especifica
```http
GET /card-section/store123/cs_123 HTTP/1.1
X-Public-Key: tu-public-key
```

### 6.4 Actualizar seccion y reemplazar cards
```http
PATCH /card-section/store123/cs_123 HTTP/1.1
Authorization: Bearer tu-token
Content-Type: application/json

{
  "title": "Seccion hero",
  "cards": [
    {
      "title": "Card renovada",
      "linkUrl": "https://www.example.com/card-renovada"
    }
  ]
}
```

### 6.5 Eliminar una seccion
```http
DELETE /card-section/store123/cs_123 HTTP/1.1
Authorization: Bearer tu-token
```

---

## Notas Finales
- Todos los textos deben ser enviados como UTF-8.
- Se recomienda validar URLs antes de persistirlas.
- Mantener consistencia en `linkText` y `linkUrl` para una mejor experiencia de usuario.
- Para trazabilidad, almacenar el `id` retornado al crear la seccion o cada card.

