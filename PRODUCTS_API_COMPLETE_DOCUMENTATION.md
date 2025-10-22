# Documentación Completa de la API de Productos

## Base URL
```
/products
```

## Autenticación
- **PublicKeyGuard**: Para endpoints públicos (lectura)
- **AuthGuard**: Para endpoints que requieren autenticación (escritura)

---

## 1. ENDPOINTS DE PRODUCTOS

### 1.1 Obtener productos por tienda
**GET** `/products/:storeId`

**Autenticación**: PublicKeyGuard

**Query Parameters**:
```typescript
{
  query?: string;           // Búsqueda por texto (máx 200 caracteres)
  status?: ProductStatus[]; // Estados: ACTIVE, INACTIVE, DRAFT, ARCHIVED
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
}
```

**Response**:
```typescript
{
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

### 1.2 Obtener producto por slug
**GET** `/products/by-slug/:storeId/:slug`

**Autenticación**: PublicKeyGuard

**Response**: Product

### 1.3 Obtener estadísticas de productos por tienda
**GET** `/products/statistics/:storeId`

**Autenticación**: PublicKeyGuard

**Response**:
```typescript
{
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  draftProducts: number;
  archivedProducts: number;
  totalVariants: number;
  totalViews: number;
}
```

### 1.4 Crear producto
**POST** `/products/:storeId`

**Autenticación**: AuthGuard

**Request Body**:
```typescript
{
  title: string;                    // Obligatorio, máx 200 caracteres
  description?: string;             // Máx 2000 caracteres
  slug: string;                    // Obligatorio, formato: letras minúsculas, números y guiones (máx 100 chars)
  vendor?: string;                  // Máx 100 caracteres
  allowBackorder?: boolean;
  releaseDate?: Date;
  status?: ProductStatus;           // ACTIVE, INACTIVE, DRAFT, ARCHIVED
  restockThreshold?: number;       // Entero ≥ 0
  restockNotify?: boolean;
  categoryIds?: string[];          // Máx 10 categorías
  collectionIds?: string[];        // Máx 5 colecciones
  imageUrls?: string[];            // Máx 10 imágenes, URLs válidas
  variants: CreateProductVariantDto[]; // Obligatorio, 1-50 variantes
  metaTitle?: string;              // Máx 60 caracteres para SEO
  metaDescription?: string;       // Máx 160 caracteres para SEO
}
```

**Response**: Product

### 1.5 Obtener producto por ID
**GET** `/products/:storeId/:id`

**Autenticación**: PublicKeyGuard

**Response**: Product

### 1.6 Actualizar producto
**PATCH** `/products/:storeId/:id`

**Autenticación**: AuthGuard

**Request Body**: UpdateProductDto (campos opcionales de CreateProductDto)

**Response**: Product

### 1.7 Actualizar estado del producto
**PATCH** `/products/:storeId/:id/status`

**Autenticación**: AuthGuard

**Request Body**:
```typescript
{
  status: ProductStatus; // ACTIVE, INACTIVE, DRAFT, ARCHIVED
}
```

**Response**: Product

### 1.8 Eliminar producto
**DELETE** `/products/:storeId/:id`

**Autenticación**: AuthGuard

**Response**: Product

### 1.9 Incrementar contador de vistas
**POST** `/products/:storeId/:id/view`

**Autenticación**: PublicKeyGuard

**Response**: Product

---

## 2. ENDPOINTS DE VARIANTES DE PRODUCTO

### 2.1 Crear variante de producto
**POST** `/products/:storeId/:productId/variants`

**Autenticación**: AuthGuard

**Request Body**:
```typescript
{
  title: string;                    // Obligatorio, máx 100 caracteres
  sku?: string;                     // Máx 50 caracteres, formato: letras, números, guiones y guiones bajos
  imageUrls?: string[];            // Máx 5 imágenes, URLs válidas
  inventoryQuantity?: number;       // Entero ≥ 0
  weightValue?: number;             // Número con máx 2 decimales ≥ 0
  isActive?: boolean;               // Default: true
  position?: number;                // Entero ≥ 0
  prices: CreateVariantPriceForVariantDto[]; // Obligatorio, 1-10 precios
  attributes?: Record<string, string>; // Objeto de atributos
}
```

**Response**: ProductVariant

### 2.2 Obtener variante por ID
**GET** `/products/:storeId/variants/:id`

**Autenticación**: PublicKeyGuard

**Response**: ProductVariant

### 2.3 Actualizar variante
**PATCH** `/products/:storeId/variants/:id`

**Autenticación**: AuthGuard

**Request Body**: UpdateProductVariantDto (campos opcionales de CreateProductVariantDto)

**Response**: ProductVariant

### 2.4 Actualizar variante con nuevo producto
**PATCH** `/products/:storeId/variants/:id/new-product/:productId`

**Autenticación**: AuthGuard

**Request Body**: UpdateProductVariantDto

**Response**: ProductVariant

### 2.5 Eliminar variante
**DELETE** `/products/:storeId/variants/:id`

**Autenticación**: AuthGuard

**Response**: ProductVariant

---

## 3. ENDPOINTS DE PRECIOS DE VARIANTES

### 3.1 Crear precio de variante
**POST** `/products/:storeId/variant-prices`

**Autenticación**: AuthGuard

**Request Body**:
```typescript
{
  variantId: string;               // Obligatorio
  currencyId: string;              // Obligatorio
  price: number;                   // Obligatorio, > 0.01, máx 2 decimales
  originalPrice?: number;          // Opcional, > 0.01, máx 2 decimales
}
```

**Response**: VariantPrice

### 3.2 Obtener precio de variante por ID
**GET** `/products/:storeId/variant-prices/:id`

**Autenticación**: PublicKeyGuard

**Response**: VariantPrice

### 3.3 Actualizar precio de variante
**PATCH** `/products/:storeId/variant-prices/:id`

**Autenticación**: AuthGuard

**Request Body**: UpdateVariantPriceDto (campos opcionales de CreateVariantPriceDto)

**Response**: VariantPrice

### 3.4 Eliminar precio de variante
**DELETE** `/products/:storeId/variant-prices/:id`

**Autenticación**: AuthGuard

**Response**: VariantPrice

---

## 4. ENDPOINT DE AJUSTE DE PRECIOS

### 4.1 Ajustar precios por tasas de cambio
**POST** `/products/:storeId/adjust-prices`

**Autenticación**: AuthGuard

**Request Body**:
```typescript
{
  baseCurrencyId: string;          // Obligatorio
}
```

**Response**: 
```typescript
{
  message: string;
  adjustedPrices: number;
  affectedProducts: number;
}
```

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
  status: ProductStatus;
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

### 5.4 Category
```typescript
{
  id: string;
  name: string;
  slug: string;
  parentId?: string;
}
```

### 5.5 Collection
```typescript
{
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
}
```

### 5.6 Currency
```typescript
{
  id: string;
  code: string;
  name: string;
  symbol: string;
  isActive: boolean;
}
```

### 5.7 CreateVariantPriceForVariantDto
```typescript
{
  currencyId: string;              // Obligatorio
  price: number;                  // Obligatorio, > 0.01, máx 2 decimales
  originalPrice?: number;          // Opcional, > 0.01, máx 2 decimales
}
```

---

## 6. CÓDIGOS DE ESTADO HTTP

- **200**: Operación exitosa
- **201**: Recurso creado exitosamente
- **400**: Error de validación en el request
- **401**: No autorizado (falta autenticación)
- **403**: Prohibido (sin permisos)
- **404**: Recurso no encontrado
- **500**: Error interno del servidor

---

## 7. EJEMPLOS DE USO

### 7.1 Crear un producto completo
```json
POST /products/store123
{
  "title": "Camiseta Deportiva Premium",
  "description": "Camiseta de alta calidad para deportes",
  "slug": "camiseta-deportiva-premium",
  "vendor": "SportBrand",
  "status": "ACTIVE",
  "categoryIds": ["cat1", "cat2"],
  "collectionIds": ["col1"],
  "imageUrls": ["https://example.com/img1.jpg"],
  "variants": [
    {
      "title": "Talla M - Azul",
      "sku": "CAM-M-AZ-001",
      "inventoryQuantity": 50,
      "prices": [
        {
          "currencyId": "usd",
          "price": 29.99,
          "originalPrice": 39.99
        }
      ]
    }
  ],
  "metaTitle": "Camiseta Deportiva Premium - SportBrand",
  "metaDescription": "Camiseta deportiva de alta calidad para atletas profesionales"
}
```

### 7.2 Buscar productos con filtros
```
GET /products/store123?query=camiseta&status=ACTIVE&minPrice=20&maxPrice=50&page=1&limit=10&sortBy=price&sortOrder=asc
```

### 7.3 Actualizar estado de producto
```json
PATCH /products/store123/prod456/status
{
  "status": "INACTIVE"
}
```

---

## 8. FORMATOS VÁLIDOS

### 8.1 Slug (Producto)
**Patrón**: `^[a-z0-9]+(?:-[a-z0-9]+)*$`
- ✅ **Válidos**: `camiseta-deportiva`, `zapatos-nike-air`, `producto-123`, `mi-producto`
- ❌ **Inválidos**: `Mi-Producto` (mayúsculas), `producto_123` (guión bajo), `producto@123` (símbolos)

### 8.2 SKU (Variante)
**Patrón**: `^[A-Za-z0-9-_]+$`
- ✅ **Válidos**: `CAM-M-AZ-001`, `producto_123`, `SKU-001`, `variant-1`, `ABC123`
- ❌ **Inválidos**: `SKU@001` (símbolos), `SKU 001` (espacios), `sku@123` (símbolos)

---

## 9. NOTAS IMPORTANTES

1. **Validaciones**: Todos los campos tienen validaciones estrictas según los DTOs
2. **Límites**: Hay límites en arrays (categorías, colecciones, imágenes, variantes, precios)
3. **Formato de fechas**: Usar formato ISO 8601 para fechas
4. **Slugs**: Solo letras minúsculas, números y guiones (ver ejemplos arriba)
5. **SKUs**: Letras (mayúsculas/minúsculas), números, guiones y guiones bajos (ver ejemplos arriba)
6. **Paginación**: Todos los endpoints de listado soportan paginación
7. **Filtros**: Los filtros se pueden combinar para búsquedas complejas
8. **Monedas**: Los precios están asociados a monedas específicas
9. **Inventario**: El sistema maneja inventario por variante
10. **SEO**: Campos metaTitle y metaDescription para optimización SEO
