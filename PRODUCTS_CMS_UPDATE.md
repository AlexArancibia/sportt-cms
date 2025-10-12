# Actualización del CMS - Gestión de Productos

## Resumen de Cambios

Este documento describe las actualizaciones realizadas en el CMS para alinear la gestión de productos con la guía API completa (`PRODUCTS_API_COMPLETE_GUIDE.md`).

---

## Cambios en `stores/mainStore.ts`

### 1. `fetchProductsByStore` - Líneas 411-453

**Cambios:**
- ✅ Actualizado para usar endpoint con paginación: `GET /products/store/:storeId`
- ✅ Añadido `limit=1000` para obtener todos los productos en CMS
- ✅ Ordenamiento por fecha de creación descendente
- ✅ NO filtra por status (muestra DRAFT, ACTIVE y ARCHIVED)
- ✅ Manejo correcto de respuesta paginada: `response.data.data`

**Antes:**
```typescript
const response = await apiClient.get<Product[]>(`/products/store/${targetStoreId}`)
set({
  products: response.data,
  loading: false,
  lastFetch: { ...get().lastFetch, products: now },
})
return response.data
```

**Después:**
```typescript
const response = await apiClient.get<any>(`/products/store/${targetStoreId}?limit=1000&sortBy=createdAt&sortOrder=desc`)

// La respuesta ahora es paginada: { data: Product[], pagination: {...} }
const productsData = response.data.data || response.data

set({
  products: Array.isArray(productsData) ? productsData : [],
  loading: false,
  lastFetch: { ...get().lastFetch, products: now },
})
return Array.isArray(productsData) ? productsData : []
```

---

### 2. `createProduct` - Líneas 455-474

**Cambios:**
- ✅ Actualizado endpoint: `POST /products/:storeId`
- ✅ Validación de `currentStore` antes de crear
- ✅ Manejo de errores mejorado

**Antes:**
```typescript
const response = await apiClient.post<Product>("/products", product)
```

**Después:**
```typescript
const { currentStore } = get()
if (!currentStore) {
  throw new Error("No store selected")
}

// Endpoint: POST /products/:storeId
const response = await apiClient.post<Product>(`/products/${currentStore}`, product)
```

---

### 3. `updateProduct` - Líneas 476-495

**Cambios:**
- ✅ Actualizado endpoint: `PATCH /products/:storeId/:id` (actualización parcial)
- ✅ Cambio de `PUT` a `PATCH` para permitir actualizaciones parciales
- ✅ Validación de `currentStore` antes de actualizar

**Antes:**
```typescript
const response = await apiClient.put<Product>(`/products/${id}`, product)
```

**Después:**
```typescript
const { currentStore } = get()
if (!currentStore) {
  throw new Error("No store selected")
}

// Endpoint: PATCH /products/:storeId/:id (actualización parcial)
const response = await apiClient.patch<Product>(`/products/${currentStore}/${id}`, product)
```

---

### 4. `deleteProduct` - Líneas 497-515

**Cambios:**
- ✅ Actualizado endpoint: `DELETE /products/:storeId/:id`
- ✅ Validación de `currentStore` antes de eliminar

**Antes:**
```typescript
await apiClient.delete(`/products/${id}`)
```

**Después:**
```typescript
const { currentStore } = get()
if (!currentStore) {
  throw new Error("No store selected")
}

// Endpoint: DELETE /products/:storeId/:id
await apiClient.delete(`/products/${currentStore}/${id}`)
```

---

## Componentes No Modificados

Los siguientes componentes **NO** requieren cambios porque ya usan los métodos del store correctamente:

### 1. `app/(dashboard)/products/page.tsx`
- ✅ Usa `fetchProductsByStore(currentStore)` del store
- ✅ Usa `deleteProduct(id)` del store
- ✅ Usa `updateProduct` para edición rápida

### 2. `app/(dashboard)/products/_components/QuickEditDialog.tsx`
- ✅ Usa `updateProduct(product.id, updatePayload)` del store
- ✅ Usa `fetchProductsByStore(currentStore)` para refrescar

### 3. `app/(dashboard)/products/(singleProduct)/new/page.tsx`
- ✅ Usa `createProduct(productData)` del store
- ✅ Usa `fetchProductsByStore(currentStore)` para cargar datos iniciales

### 4. `app/(dashboard)/products/(singleProduct)/[id]/edit/page.tsx`
- ✅ Usa `fetchProductsByStore(storeId)` del store
- ✅ Usa `updateProduct(id, updatePayload)` del store

---

## Diferencias Clave: CMS vs Frontend

### Frontend (AuthTemplate)
**Propósito:** Mostrar productos a clientes
- ✅ Solo muestra productos `ACTIVE`
- ✅ Solo muestra productos con `price >= 1`
- ✅ Filtra por `currencyId` seleccionada
- ✅ Paginación visible en UI (límite configurable)

### CMS (sportt-cms)
**Propósito:** Gestión administrativa
- ✅ Muestra TODOS los productos (DRAFT, ACTIVE, ARCHIVED)
- ✅ Muestra productos sin precio (para edición)
- ✅ NO filtra por currency (muestra todas las monedas)
- ✅ Límite alto (1000) para ver todo de una vez

---

## Endpoints Utilizados

### Lectura
```
GET /products/store/:storeId?limit=1000&sortBy=createdAt&sortOrder=desc
```

### Creación
```
POST /products/:storeId
Body: CreateProductDto
```

### Actualización
```
PATCH /products/:storeId/:id
Body: UpdateProductDto (parcial)
```

### Eliminación
```
DELETE /products/:storeId/:id
```

---

## Notas Importantes

### 1. Respuesta Paginada
El endpoint `GET /products/store/:storeId` ahora retorna:
```typescript
{
  data: Product[],
  pagination: {
    total: number,
    page: number,
    limit: number,
    totalPages: number
  }
}
```

### 2. Status del Producto
- El CMS NO filtra por status para permitir gestión completa
- Los productos se crean con status `DRAFT` por defecto (schema)
- El frontend solo muestra productos `ACTIVE`

### 3. Actualización Parcial
- Cambio de `PUT` a `PATCH` permite enviar solo campos modificados
- Previene sobrescritura accidental de campos no incluidos
- Mejora la eficiencia de red

### 4. Seguridad
- Todos los endpoints requieren `storeId` para prevenir acceso cross-store
- Validación en backend asegura que el producto pertenezca a la tienda

---

## Verificación

### Para verificar que todo funciona correctamente:

1. **Listar productos:**
   - Ir a `/products` en el CMS
   - Debería mostrar todos los productos (DRAFT, ACTIVE, ARCHIVED)
   - No debería haber errores de paginación

2. **Crear producto:**
   - Ir a `/products/new`
   - Completar formulario y crear
   - Verificar que se cree correctamente

3. **Editar producto:**
   - Abrir edición rápida o completa
   - Modificar algunos campos
   - Guardar y verificar cambios

4. **Eliminar producto:**
   - Seleccionar producto(s)
   - Eliminar y verificar que se elimine correctamente

---

## Resumen Final

✅ **Todos los métodos del store están actualizados**
✅ **Todos los componentes usan los métodos correctos**
✅ **Alineado con PRODUCTS_API_COMPLETE_GUIDE.md**
✅ **Respeta la diferencia entre CMS y Frontend**

El CMS ahora está completamente sincronizado con la guía API y listo para uso en producción.

