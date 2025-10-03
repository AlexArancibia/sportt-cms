# 📊 Guía del Sistema Unificado de Paginación

## 🎯 Objetivo
Sistema completo y reutilizable para manejar paginación en todos los endpoints que la soportan, eliminando código duplicado y proporcionando una experiencia consistente.

---

## 🚀 Endpoints Implementados

### ✅ **CON PAGINACIÓN** (Listos para usar):

1. **🔸 PRODUCTOS** - `GET /products/store/{storeId}`
2. **🔸 COLECCIONES** - `GET /collections/{storeId}`  
3. **🔸 CONTENIDOS** - `GET /contents/{storeId}`
4. **🔸 ÓRDENES** - `GET /orders/{storeId}`
5. **🔸 CARD SECTION** - `GET /card-section/{storeId}`

---

## 🛠️ Componentes Principales

### 1. **Hook `usePagination`**
```typescript
const pagination = usePagination();

// Estados disponibles
pagination.paginationState     // Estado actual (currentPage, totalPages, etc.)
pagination.sortState          // Ordenamiento actual (sortBy, sortOrder)

// Funciones disponibles
pagination.goToPage(page)      // Ir a página específica
pagination.nextPage()         // Siguiente página
pagination.prevPage()         // Página anterior
pagination.changeItemsPerPage(limit)  // Cambiar elementos por página
pagination.updatePaginationFromResponse(response)  // Actualizar desde respuesta de API
```

### 2. **Componente `DataTable`**
```typescript
// Configuración básica
const columns: Column<YourType>[] = [
  { key: 'name', title: 'Nombre', sortable: true },
  { key: 'email', title: 'Email' }
];

<DataTable
  data={data}
  columns={columns}
  pagination={paginationState}
  onPageChange={onPageChange}
  onSearch={onSearch}
  showFilters={true}
  emptyMessage="No hay datos"
/>
```

### 3. **Controles `PaginationControls`**
```typescript
<PaginationControls
  paginationState={paginationState}
  onPageChange={goToPage}
  onLimitChange={changeItemsPerPage}
  showItemsPerPageSelector={true}
  maxPageNumbers={5}
/>
```

### 4. **Hook `useDataTable`**
```typescript
const {
  data,
  loading,
  paginationState,
  onPageChange,
  onLimitChange,
  onSortChange,
  onSearch
} = useDataTable(fetchFunction, initialParams);
```

---

## 📝 Casos de Uso

### **Caso 1: Tabla completa con filtros**
```typescript
export function ProductsPage() {
  return <ProductsTable storeId={storeId} />;
}
```

### **Caso 2: Tabla personalizada**
```typescript
export function OrdersTable() {
  const columns = [
    { key: 'id', title: 'ID', sortable: true },
    { key: 'total', title: 'Total', sortable: true }
  ];

  return (
    <DataTable
      data={orders}
      columns={columns}
      pagination={paginationState}
      onPageChange={onPageChange}
      showFilters={true}
      filterOptions={<OrdersFilters />}
    />
  );
}
```

### **Caso 3: Lista simple con paginación**
```typescript
export function CollectionsList() {
  const pagination = usePagination({ initialLimit: 12 });
  
  return (
    <div>
      {/* Grid de elementos */}
      {collections.map(item => <CollectionCard key={item.id} {...item} />)}
      
      {/* Paginación */}
      <PaginationControls {...pagination} />
    </div>
  );
}
```

---

## 🔧 Parámetros de Paginación Consistente

### **Parámetros estándar** (todos los recursos):
```typescript
{
  page: number,        // Página actual (empezando en 1)
  limit: number,       // Elementos por página (máximo 100)
  sortBy: string,      // Campo para ordenar
  sortOrder: 'asc' | 'desc'  // Dirección del ordenamiento
}
```

### **Parámetros específicos por recurso**:
- **Products**: `query`, `status[]`, `vendor`, `categoryIds[]`, `collectionIds[]`
- **Collections**: `query`, `includeInactive`
- **Contents**: `query`, `type`, `category`, `published`
- **Orders**: `financialStatus`, `fulfillmentStatus`, `paymentStatus`, `startDate`, `endDate`
- **Coupons**: `query`, `includeInactive`

---

## 🎨 Personalización

### **Cambiar elementos por página**:
```typescript
<PaginationControls
  itemsPerPageOptions={[5, 10, 25, 50]}  // Opciones personalizadas
  showItemsPerPageSelector={true}
/>
```

### **Controlar números de página mostrados**:
```typescript
<PaginationControls
  showPageNumbers={true}
  maxPageNumbers={7}  // Máximo números de página visibles
/>
```

### **Paginación compacta** (para espacios reducidos):
```typescript
<CompactPagination
  paginationState={pagination}
  onPageChange={onPageChange}
  onLimitChange={onLimitChange}
/>
```

---

## ⚡ Migración de Código Existente

### **ANTES** (código manual):
```typescript
// ❌ Mucho código repetitivo para cada recurso
const [page, setPage] = useState(1);
const [limit, setLimit] = useState(20);
const [loading, setLoading] = useState(false);

const fetchData = async () => {
  setLoading(true);
  const response = await api.get(`/products?page=${page}&limit=${limit}`);
  setProducts(response.data);
  setLoading(false);
};
```

### **DESPUÉS** (con el sistema): 
```typescript
// ✅ Código limpio y reutilizable
const { data: products, loading, paginationState } = useDataTable(fetchProducts);

return <ProductsTable data={products} pagination={paginationState} />;
```

---

## 🔄 Actualización de Stores

Los stores existentes pueden mantener su compatibilidad hacia atrás:

```typescript
// En mainStore.ts - método existente sigue funcionando
fetchProducts: async () => {
  // Código existente...
},

// Nuevo método paginado (opcional)
fetchProductsPaginated: async (params: PaginationParams) => {
  const url = buildPaginatedUrl(`/products/store/${storeId}`, params);
  return await apiClient.get(url);
}
```

---

## 📱 Responsive y Accesibilidad

- ✅ Controles adaptativos (compactos en móvil)
- ✅ Navegación con teclado
- ✅ Estados de loading manejados automáticamente
- ✅ Mensajes de error integrados
- ✅ Soporte para lectores de pantalla

---

## 🚦 Estado de Implementación

- ✅ **Tipos TypeScript** - Definidos y listos
- ✅ **Hook usePagination** - Funcional completo  
- ✅ **Componentes UI** - DataTable y PaginationControls listos
- ✅ **Helpers** - Funciones auxiliares para URLs y params
- ✅ **Ejemplos** - ProductsTable como referencia
- 🔄 **Migración paulatina** - Reemplazar implementaciones existentes

---

Este sistema elimina toda la complejidad de implementar paginación manualmente y proporciona una experiencia consistente en toda la aplicación. ¡Todo listo para usar! 🎉
