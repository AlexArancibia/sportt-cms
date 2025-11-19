# 📚 Explicación: Filtro por Marca (Vendor) en Productos

## 🎯 ¿Qué hicimos?

Agregamos un **filtro por marca** en la página de productos que permite:
- Seleccionar una o varias marcas para filtrar productos
- Ver las marcas seleccionadas como badges
- Eliminar marcas individualmente
- Limpiar todos los filtros de una vez

---

## 📝 Cambios Realizados

### 1️⃣ **Actualización de Tipos** (`types/product.ts`)

**¿Qué cambió?**
```typescript
// ANTES:
vendor?: string;  // Solo una marca

// DESPUÉS:
vendor?: string[];  // Múltiples marcas (array)
```

**¿Por qué?**
- El backend ahora acepta múltiples marcas para filtrar
- Permite seleccionar varias marcas a la vez (ej: Nike, Adidas, Puma)

---

### 2️⃣ **Actualización del Store** (`stores/mainStore.ts`)

#### A) Función `fetchProductsByStore` - Enviar múltiples vendors

**¿Qué cambió?**
```typescript
// ANTES:
if (params?.vendor) queryParams.append('vendor', params.vendor)

// DESPUÉS:
if (params?.vendor && params.vendor.length > 0) {
  params.vendor.forEach(v => queryParams.append('vendor', v))
}
```

**¿Por qué?**
- Ahora envía cada marca como un parámetro separado en la URL
- Ejemplo: `?vendor=Nike&vendor=Adidas` en lugar de `?vendor=Nike`

#### B) Nueva función `fetchVendorsByStore`

**¿Qué hace?**
```typescript
fetchVendorsByStore: async (storeId?: string): Promise<string[]> => {
  // Obtiene la lista de todas las marcas únicas de una tienda
  const response = await apiClient.get<string[]>(`/products/${storeId}/vendors`)
  return response.data || []
}
```

**¿Para qué sirve?**
- Obtiene todas las marcas disponibles en la tienda
- Se usa para poblar el dropdown del filtro
- Ejemplo de respuesta: `["Nike", "Adidas", "Puma", "Reebok"]`

---

### 3️⃣ **Página de Productos** (`app/(dashboard)/products/page.tsx`)

#### A) Estados nuevos

```typescript
const [selectedVendors, setSelectedVendors] = useState<string[]>([])  // Marcas seleccionadas
const [vendors, setVendors] = useState<string[]>([])                 // Lista de marcas disponibles
const [isLoadingVendors, setIsLoadingVendors] = useState(false)     // Cargando marcas
```

**¿Para qué?**
- `selectedVendors`: Guarda qué marcas el usuario seleccionó
- `vendors`: Lista de todas las marcas disponibles (viene del backend)
- `isLoadingVendors`: Muestra "Cargando..." mientras se obtienen las marcas

#### B) Cargar marcas cuando cambia la tienda

```typescript
useEffect(() => {
  if (!currentStore) return
  
  setIsLoadingVendors(true)
  fetchVendorsByStore(currentStore)
    .then(setVendors)
    .catch(console.error)
    .finally(() => setIsLoadingVendors(false))
}, [currentStore, fetchVendorsByStore])
```

**¿Qué hace?**
- Cuando cambias de tienda, carga automáticamente las marcas de esa tienda
- Muestra "Cargando..." mientras obtiene los datos

#### C) Sincronizar con la URL

```typescript
useEffect(() => {
  const params = new URLSearchParams()
  
  if (currentPage > 1) params.set('page', currentPage.toString())
  if (searchTerm) params.set('q', searchTerm)
  if (selectedVendors.length > 0) params.set('vendor', selectedVendors.join(','))
  
  router.replace(`/products?${params.toString()}`, { scroll: false })
}, [currentPage, searchTerm, selectedVendors, router])
```

**¿Para qué?**
- Guarda los filtros en la URL
- Permite compartir enlaces con filtros aplicados
- Ejemplo: `/products?q=zapatos&vendor=Nike,Adidas`

#### D) Cargar productos con filtro de marca

```typescript
const loadData = async () => {
  await fetchProductsByStore(currentStore, {
    page: currentPage,
    limit: productsPerPage,
    query: searchTerm || undefined,
    vendor: selectedVendors.length > 0 ? selectedVendors : undefined,  // ← NUEVO
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })
}
```

**¿Qué hace?**
- Envía las marcas seleccionadas al backend
- El backend filtra los productos que coincidan con esas marcas

#### E) Handlers (funciones de manejo)

```typescript
// Agregar o quitar una marca
const handleVendorToggle = (vendor: string) => {
  setSelectedVendors(prev => 
    prev.includes(vendor) 
      ? prev.filter(v => v !== vendor)  // Si ya está, la quita
      : [...prev, vendor]                 // Si no está, la agrega
  )
}

// Eliminar una marca específica
const handleRemoveVendor = (vendor: string) => {
  setSelectedVendors(prev => prev.filter(v => v !== vendor))
}
```

**¿Cómo funcionan?**
- `handleVendorToggle`: Si seleccionas una marca del dropdown, la agrega. Si ya está, la quita.
- `handleRemoveVendor`: Elimina una marca cuando haces clic en la X del badge

#### F) Interfaz de usuario

**1. Dropdown de selección:**
```tsx
<Select onValueChange={(value) => value && handleVendorToggle(value)}>
  <SelectTrigger>
    <SelectValue placeholder="Marca" />
  </SelectTrigger>
  <SelectContent>
    {vendors.map((vendor) => (
      <SelectItem key={vendor} value={vendor}>
        {vendor}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

**¿Qué hace?**
- Muestra un dropdown con todas las marcas disponibles
- Al seleccionar una, la agrega a los filtros
- Las marcas ya seleccionadas aparecen deshabilitadas

**2. Badges de marcas seleccionadas:**
```tsx
{selectedVendors.map((vendor) => (
  <Badge key={vendor} variant="outline" className="bg-muted/50 text-foreground">
    {vendor}
    <button onClick={() => handleRemoveVendor(vendor)}>
      <X className="h-3 w-3" />
    </button>
  </Badge>
))}
```

**¿Qué hace?**
- Muestra cada marca seleccionada como un badge (etiqueta)
- Cada badge tiene una X para eliminarlo
- Usa colores que se adaptan al tema (claro/oscuro)

**3. Botón "Limpiar filtros":**
```tsx
{selectedVendors.length > 1 && (
  <Button onClick={() => setSelectedVendors([])}>
    Limpiar filtros
  </Button>
)}
```

**¿Qué hace?**
- Solo aparece si hay 2 o más marcas seleccionadas
- Al hacer clic, elimina todas las marcas seleccionadas

---

## 🔄 Flujo Completo

1. **Usuario abre la página de productos**
   - Se cargan las marcas disponibles de la tienda
   - Se muestran en el dropdown

2. **Usuario selecciona una marca**
   - Se agrega a `selectedVendors`
   - Aparece como badge
   - Se actualiza la URL
   - Se recargan los productos filtrados

3. **Usuario selecciona más marcas**
   - Cada marca se agrega al array
   - Aparecen más badges
   - Los productos se filtran por TODAS las marcas seleccionadas

4. **Usuario elimina una marca**
   - Hace clic en la X del badge
   - Se quita del array
   - Se recargan los productos

5. **Usuario limpia todos los filtros**
   - Hace clic en "Limpiar filtros"
   - Se vacía el array
   - Se muestran todos los productos

---

## 🎨 Mejoras de Estilo

### Problema resuelto: Contraste de texto

**Problema:**
- El badge tenía texto oscuro sobre fondo oscuro (no se veía)
- El botón "Crear Producto" tenía texto oscuro sobre fondo oscuro

**Solución:**
```typescript
// Badge:
className="bg-muted/50 text-foreground"  // Usa colores del tema

// Botón:
className="text-primary-foreground"  // Texto claro sobre fondo oscuro
```

**Resultado:**
- Los textos se ven correctamente en modo claro y oscuro
- Se adaptan automáticamente al tema

---

## 📊 Resumen Técnico

| Componente | Cambio | Propósito |
|------------|--------|-----------|
| `types/product.ts` | `vendor: string[]` | Permitir múltiples marcas |
| `stores/mainStore.ts` | `fetchVendorsByStore()` | Obtener lista de marcas |
| `stores/mainStore.ts` | `fetchProductsByStore()` | Enviar array de marcas |
| `products/page.tsx` | Estados nuevos | Gestionar selección |
| `products/page.tsx` | Dropdown + Badges | Interfaz de usuario |
| `globals.css` | `.create-button` | Mejorar contraste |

---

## ✅ Funcionalidades Finales

- ✅ Filtro por múltiples marcas simultáneamente
- ✅ Dropdown con todas las marcas disponibles
- ✅ Badges visuales para marcas seleccionadas
- ✅ Eliminación individual de marcas
- ✅ Botón para limpiar todos los filtros
- ✅ Sincronización con URL (compartible)
- ✅ Carga automática al cambiar de tienda
- ✅ Contraste correcto en modo claro/oscuro

---

## 🚀 Cómo usar

1. Abre la página de productos
2. Haz clic en el dropdown "Marca"
3. Selecciona una o varias marcas
4. Los productos se filtran automáticamente
5. Elimina marcas haciendo clic en la X del badge
6. Limpia todos los filtros con el botón "Limpiar filtros"

---

**¡Listo!** 🎉 Ahora tienes un filtro completo y funcional por marca en tu página de productos.

