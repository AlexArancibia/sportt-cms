# Category API Endpoints Documentation

## Base URL
```
/categories
```

## Authentication
- **AuthGuard**: Required for POST, PUT, DELETE operations
- **PublicKeyGuard**: Required for GET operations

---

## 1. Create Category

### Endpoint
```
POST /categories/:storeId
```

### Authentication
- **Required**: AuthGuard

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| storeId | string | Yes | ID of the store |

### Request Body (CreateCategoryDto)
```json
{
  "name": "string",                    // Required, max 100 chars
  "slug": "string",                    // Required, max 100 chars, format: ^[a-z0-9]+(?:-[a-z0-9]+)*$
  "description": "string",             // Optional, max 500 chars
  "imageUrl": "string",                // Optional, valid URL
  "parentId": "string",                // Optional, ID of parent category
  "metaTitle": "string",               // Optional, max 100 chars
  "metaDescription": "string",         // Optional, max 200 chars
  "priority": "number"                 // Optional, integer
}
```

### Example Request
```json
{
  "name": "Electronics",
  "slug": "electronics",
  "description": "Electronic devices and accessories",
  "imageUrl": "https://example.com/electronics.jpg",
  "metaTitle": "Electronics Store",
  "metaDescription": "Find the best electronic devices",
  "priority": 1
}
```

### Response
```json
{
  "id": "string",
  "name": "string",
  "slug": "string",
  "description": "string",
  "imageUrl": "string",
  "parentId": "string",
  "metaTitle": "string",
  "metaDescription": "string",
  "priority": "number",
  "storeId": "string",
  "createdAt": "string",
  "updatedAt": "string",
  "parent": {
    "id": "string",
    "name": "string",
    "slug": "string"
  },
  "children": [
    {
      "id": "string",
      "name": "string",
      "slug": "string"
    }
  ],
  "products": [
    {
      "id": "string",
      "name": "string"
    }
  ]
}
```

---

## 2. Get All Categories

### Endpoint
```
GET /categories/:storeId
```

### Authentication
- **Required**: PublicKeyGuard

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| storeId | string | Yes | ID of the store |

### Query Parameters (SearchCategoryDto)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| query | string | No | - | Search term for name, description, or slug |
| parentId | string | No | - | Filter by parent category ID |
| page | number | No | 1 | Page number (min: 1) |
| limit | number | No | 20 | Items per page (min: 1, max: 100) |
| sortBy | string | No | "createdAt" | Field to sort by |
| sortOrder | string | No | "desc" | Sort order: "asc" or "desc" |

### Example Request
```
GET /categories/store123?query=electronics&page=1&limit=10&sortBy=name&sortOrder=asc
```

### Response (PaginatedResponse)
```json
{
  "data": [
    {
      "id": "string",
      "name": "string",
      "slug": "string",
      "description": "string",
      "imageUrl": "string",
      "parentId": "string",
      "metaTitle": "string",
      "metaDescription": "string",
      "priority": "number",
      "storeId": "string",
      "createdAt": "string",
      "updatedAt": "string",
      "parent": {
        "id": "string",
        "name": "string",
        "slug": "string"
      },
      "children": [
        {
          "id": "string",
          "name": "string",
          "slug": "string"
        }
      ],
      "products": [
        {
          "id": "string",
          "name": "string"
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## 3. Get Single Category

### Endpoint
```
GET /categories/:storeId/:id
```

### Authentication
- **Required**: PublicKeyGuard

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| storeId | string | Yes | ID of the store |
| id | string | Yes | ID of the category |

### Example Request
```
GET /categories/store123/cat456
```

### Response
```json
{
  "id": "string",
  "name": "string",
  "slug": "string",
  "description": "string",
  "imageUrl": "string",
  "parentId": "string",
  "metaTitle": "string",
  "metaDescription": "string",
  "priority": "number",
  "storeId": "string",
  "createdAt": "string",
  "updatedAt": "string",
  "parent": {
    "id": "string",
    "name": "string",
    "slug": "string"
  },
  "children": [
    {
      "id": "string",
      "name": "string",
      "slug": "string"
    }
  ],
  "products": [
    {
      "id": "string",
      "name": "string"
    }
  ]
}
```

---

## 4. Update Category

### Endpoint
```
PUT /categories/:storeId/:id
```

### Authentication
- **Required**: AuthGuard

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| storeId | string | Yes | ID of the store |
| id | string | Yes | ID of the category |

### Request Body (UpdateCategoryDto)
All fields are optional (extends PartialType(CreateCategoryDto)):
```json
{
  "name": "string",                    // Optional, max 100 chars
  "slug": "string",                    // Optional, max 100 chars, format: ^[a-z0-9]+(?:-[a-z0-9]+)*$
  "description": "string",             // Optional, max 500 chars
  "imageUrl": "string",                // Optional, valid URL
  "parentId": "string",                // Optional, ID of parent category
  "metaTitle": "string",               // Optional, max 100 chars
  "metaDescription": "string",         // Optional, max 200 chars
  "priority": "number"                 // Optional, integer
}
```

### Example Request
```json
{
  "name": "Updated Electronics",
  "description": "Updated description for electronics category",
  "priority": 2
}
```

### Response
```json
{
  "id": "string",
  "name": "string",
  "slug": "string",
  "description": "string",
  "imageUrl": "string",
  "parentId": "string",
  "metaTitle": "string",
  "metaDescription": "string",
  "priority": "number",
  "storeId": "string",
  "createdAt": "string",
  "updatedAt": "string",
  "parent": {
    "id": "string",
    "name": "string",
    "slug": "string"
  },
  "children": [
    {
      "id": "string",
      "name": "string",
      "slug": "string"
    }
  ],
  "products": [
    {
      "id": "string",
      "name": "string"
    }
  ]
}
```

---

## 5. Delete Category

### Endpoint
```
DELETE /categories/:storeId/:id
```

### Authentication
- **Required**: AuthGuard

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| storeId | string | Yes | ID of the store |
| id | string | Yes | ID of the category |

### Example Request
```
DELETE /categories/store123/cat456
```

### Response
```json
{
  "id": "string",
  "name": "string",
  "slug": "string",
  "description": "string",
  "imageUrl": "string",
  "parentId": "string",
  "metaTitle": "string",
  "metaDescription": "string",
  "priority": "number",
  "storeId": "string",
  "createdAt": "string",
  "updatedAt": "string"
}
```

---

## Error Responses

### Validation Error (400)
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "errors": [
    {
      "field": "name",
      "value": "",
      "constraints": ["El nombre es obligatorio"],
      "message": "El nombre es obligatorio"
    }
  ]
}
```

### Not Found Error (404)
```json
{
  "statusCode": 404,
  "message": "Categoría no encontrada",
  "error": "Not Found"
}
```

### Conflict Error (409)
```json
{
  "statusCode": 409,
  "message": "Ya existe una categoría con el slug 'electronics' en esta tienda",
  "error": "Conflict"
}
```

### Unauthorized Error (401)
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

---

## Field Validation Rules

### CreateCategoryDto
- **name**: Required, string, max 100 characters
- **slug**: Required, string, max 100 characters, must match pattern: `^[a-z0-9]+(?:-[a-z0-9]+)*$`
- **description**: Optional, string, max 500 characters
- **imageUrl**: Optional, must be a valid URL
- **parentId**: Optional, string
- **metaTitle**: Optional, string, max 100 characters
- **metaDescription**: Optional, string, max 200 characters
- **priority**: Optional, integer

### SearchCategoryDto
- **query**: Optional, string
- **parentId**: Optional, string
- **page**: Optional, integer, minimum 1, default 1
- **limit**: Optional, integer, minimum 1, maximum 100, default 20
- **sortBy**: Optional, string, default "createdAt"
- **sortOrder**: Optional, enum ["asc", "desc"], default "desc"

---

## Notes
- All timestamps are in ISO 8601 format
- The `parent` field includes basic information about the parent category
- The `children` field includes an array of child categories
- The `products` field includes an array of products in this category
- Slug must be unique within each store
- Parent category must belong to the same store
