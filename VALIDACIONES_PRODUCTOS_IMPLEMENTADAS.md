# ✅ Validaciones de Productos Implementadas

## 📋 Resumen

Se han implementado validaciones completas para la creación y edición de productos en los tres componentes principales del sistema. Este documento detalla todas las validaciones implementadas y cómo utilizarlas.

---

## 🎯 Componentes Actualizados

### 1. Hook Compartido de Validación
**Archivo:** `app/(dashboard)/products/_hooks/useProductValidation.ts`

Este hook centraliza toda la lógica de validación de productos y puede ser reutilizado en cualquier componente.

**Funciones disponibles:**
- `validateProduct()` - Validación completa del producto
- `validateProductWithToast()` - Validación con toast automático
- `validateRequiredFields()` - Valida campos obligatorios
- `validateVariants()` - Valida las variantes
- `validateSlugFormat()` - Valida formato del slug
- `validateSkuFormat()` - Valida formato del SKU
- `validateSlugUniqueness()` - Verifica que el slug sea único
- `showValidationErrors()` - Muestra errores usando toast

### 2. Componentes Actualizados con Validaciones

#### ✅ Crear Producto
**Archivo:** `app/(dashboard)/products/(singleProduct)/new/page.tsx`

#### ✅ Editar Producto
**Archivo:** `app/(dashboard)/products/(singleProduct)/[id]/edit/page.tsx`

#### ✅ Edición Rápida
**Archivo:** `app/(dashboard)/products/_components/QuickEditDialog.tsx`

---

## 🔍 Validaciones Implementadas

### 1. **Título (title) - OBLIGATORIO** ✅
- **Validación:** No puede estar vacío
- **Mensaje de error:** "El título es obligatorio"

```typescript
if (!formData.title || formData.title.trim() === "") {
  // Error: título obligatorio
}
```

---

### 2. **Slug - OBLIGATORIO Y ÚNICO** ✅
- **Validación 1:** No puede estar vacío
- **Mensaje:** "El slug es obligatorio"

- **Validación 2:** Debe seguir el formato correcto
- **Patrón:** `^[a-z0-9]+(?:-[a-z0-9]+)*$`
- **Válidos:** `camiseta-deportiva`, `producto-123`, `mi-producto`
- **Inválidos:** `Mi-Producto` (mayúsculas), `producto_123` (guión bajo), `producto@123` (símbolos)
- **Mensaje:** "El slug solo puede contener letras minúsculas, números y guiones"

- **Validación 3:** Debe ser único en la tienda
- **Mensaje:** "Ya existe un producto con este slug. Por favor, use otro."

```typescript
// Formato correcto
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

// Unicidad
const duplicateSlug = products.find(p => 
  p.slug === formData.slug && p.id !== currentProductId
)
```

---

### 3. **Variantes - CADA UNA CON PRECIO VÁLIDO** ✅
- **Validación 1:** Debe haber al menos una variante
- **Mensaje:** "Debe tener al menos una variante"

- **Validación 2:** Cada variante debe tener al menos un precio válido y no nulo
- **Mensaje:** "La variante '{nombre}' debe tener al menos un precio válido y no nulo"

- **Validación 3:** Si hay moneda por defecto, cada variante debe tener precio para esa moneda
- **Mensaje:** "La variante '{nombre}' debe tener un precio para la moneda por defecto"

- **Validación 4:** Precio válido = >= 0 O null (no undefined)
- **Mensaje:** "El precio debe ser mayor o igual a 0"

```typescript
// Precio válido: >= 0 o null, pero no undefined
const isValidPrice = (price: number | null | undefined): boolean => {
  return price === null || (typeof price === 'number' && price >= 0)
}

// Cada variante debe tener al menos un precio válido y no nulo
const validPrices = variant.prices.filter(price => 
  price.currencyId && 
  price.currencyId.trim() !== "" && 
  isValidPrice(price.price) && 
  price.price !== null
)
```

---

### 4. **Precios - VÁLIDOS Y NO NULOS** ✅
- **Validación 1:** Precio válido = >= 0 O null (no undefined)
- **Aplica a:** `price` y `originalPrice`
- **Mensaje:** "El precio debe ser mayor o igual a 0"

- **Validación 2:** Al menos un precio por variante debe ser no nulo
- **Mensaje:** "La variante debe tener al menos un precio válido y no nulo"

- **Validación 3:** Si hay moneda por defecto, debe tener precio válido y no nulo
- **Mensaje:** "La variante debe tener un precio válido y no nulo para la moneda por defecto"

```typescript
// Precio válido: >= 0 o null, pero no undefined
const isValidPrice = (price: number | null | undefined): boolean => {
  return price === null || (typeof price === 'number' && price >= 0)
}

// Validar precios
variant.prices.forEach((price, priceIndex) => {
  if (price.currencyId && price.currencyId.trim() !== "") {
    if (!isValidPrice(price.price)) {
      // Error: precio inválido
    }
  }
})
```

---

### 5. **SKU - FORMATO Y UNICIDAD (Opcional)** ✅
- **Validación 1:** Si se proporciona, debe seguir el formato correcto
- **Patrón:** `^[A-Za-z0-9-_]+$`
- **Válidos:** `CAM-M-AZ-001`, `producto_123`, `SKU-001`, `ABC123`
- **Inválidos:** `SKU@001` (símbolos), `SKU 001` (espacios)
- **Mensaje:** "SKU inválido: {sku}. Solo se permiten letras, números, guiones y guiones bajos"

- **Validación 2:** No debe haber SKUs duplicados en el mismo producto
- **Mensaje:** "SKUs duplicados en el producto: {lista de SKUs}"

```typescript
const skuPattern = /^[A-Za-z0-9-_]+$/

// Duplicados
const skus = variants.map(v => v.sku).filter(s => s && s.trim() !== "")
const duplicateSkus = skus.filter((sku, index) => skus.indexOf(sku) !== index)
```

---

### 6. **Peso - NO NEGATIVO** ✅
- **Validación:** Si se proporciona, debe ser >= 0
- **Mensaje:** "El peso no puede ser negativo"

```typescript
if (variant.weightValue !== undefined && 
    variant.weightValue !== null && 
    variant.weightValue < 0) {
  // Error: peso negativo
}
```

---

### 7. **Inventario - NO NEGATIVO** ✅
- **Validación:** Si se proporciona, debe ser >= 0
- **Mensaje:** "El inventario no puede ser negativo"
- **Nota:** Ya existía validación en `onBlur` que convierte negativos a 0

```typescript
if (variant.inventoryQuantity !== undefined && 
    variant.inventoryQuantity !== null && 
    variant.inventoryQuantity < 0) {
  // Error: inventario negativo
}
```

---

## 📊 Comparación: Antes vs Después

| Validación | Antes | Después |
|------------|-------|---------|
| Título obligatorio | ❌ | ✅ |
| Slug obligatorio | ❌ | ✅ |
| Slug único | ❌ | ✅ |
| Formato de slug | Parcial (slugify) | ✅ Completo |
| Al menos un precio | ❌ | ✅ |
| Precios > 0 | ❌ | ✅ |
| SKU único en producto | ❌ | ✅ |
| Formato de SKU | ❌ | ✅ |
| Peso no negativo | ❌ | ✅ |
| Inventario no negativo | ✅ (onBlur) | ✅ Mejorado |
| Mensajes de error del backend | Parcial | ✅ Completo |

---

## 💡 Cómo Usar

### Ejemplo en un componente:

```typescript
import { useProductValidation } from "../../_hooks/useProductValidation"

export default function MyProductForm() {
  const { validateProductWithToast } = useProductValidation()
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar antes de enviar
    const { products } = useMainStore.getState()
    const isValid = validateProductWithToast(
      formData,
      variants,
      products,
      currentProductId // undefined para productos nuevos
    )
    
    if (!isValid) {
      return // Las validaciones ya mostraron el error
    }
    
    // Continuar con el envío...
  }
}
```

### Validación personalizada:

```typescript
const { validateProduct, showValidationErrors } = useProductValidation()

const validation = validateProduct(formData, variants, products, productId)

if (!validation.isValid) {
  console.log("Errores encontrados:", validation.errors)
  showValidationErrors(validation.errors)
}
```

---

## 🎨 Mejoras Futuras (Opcionales)

### 1. Feedback Visual en Campos
Actualmente, los errores se muestran mediante toast. Se podría agregar:

```typescript
// Estado de errores
const [errors, setErrors] = useState<Record<string, string>>({})

// En el Input
<Input 
  className={errors.title ? "border-red-500" : ""}
  // ...
/>
{errors.title && (
  <span className="text-xs text-red-500">{errors.title}</span>
)}
```

### 2. Validación en Tiempo Real
Validar mientras el usuario escribe (con debounce):

```typescript
const debouncedValidation = useMemo(
  () => debounce((value) => {
    // Validar
  }, 500),
  []
)
```

### 3. Validación de Slug en el Backend
Para garantizar 100% la unicidad:

```typescript
const checkSlugUniqueness = async (slug: string) => {
  const response = await api.get(`/products/check-slug/${slug}`)
  return response.data.isUnique
}
```

---

## 🔧 Mantenimiento

### Actualizar Validaciones
Si el backend cambia las reglas de validación, solo necesitas actualizar el hook `useProductValidation.ts`.

### Agregar Nuevas Validaciones
1. Agregar la función de validación en `useProductValidation.ts`
2. Incluirla en `validateProduct()`
3. Automáticamente estará disponible en todos los componentes

---

## ✅ Checklist de Implementación

- [x] Hook de validación compartido creado
- [x] Validación de título obligatorio
- [x] Validación de slug obligatorio
- [x] Validación de formato de slug
- [x] Validación de slug único
- [x] Validación de al menos un precio
- [x] Validación de precios mayores a 0
- [x] Validación de formato de SKU
- [x] Validación de SKUs únicos en el producto
- [x] Validación de peso no negativo
- [x] Validación de inventario no negativo
- [x] Mensajes de error mejorados del backend
- [x] Implementado en página de crear
- [x] Implementado en página de editar
- [x] Implementado en diálogo de edición rápida
- [x] Sin errores de linting

---

## 📝 Notas Técnicas

### Validación de Slug Único
La validación compara contra los productos en el store de Zustand. Si el store no tiene todos los productos cargados, podría dar falsos negativos. Para garantizar 100% la unicidad, considera implementar una validación adicional en el backend.

### Rendimiento
Las validaciones son síncronas y rápidas. No deberían afectar el rendimiento, incluso con muchos productos en el store.

### Compatibilidad
Las validaciones siguen exactamente las reglas definidas en la documentación de la API (`PRODUCTS_API_COMPLETE_DOCUMENTATION.md`).

---

## 🐛 Solución de Problemas

### Problema: "Ya existe un producto con este slug" pero no lo veo
**Solución:** Verifica que el store tenga todos los productos cargados. Ejecuta `fetchProductsByStore()` antes de validar.

### Problema: Validaciones no aparecen
**Solución:** Verifica que hayas importado y llamado `validateProductWithToast()` antes de enviar el formulario.

### Problema: El toast no se muestra
**Solución:** Verifica que el componente `Toaster` esté montado en tu layout principal.

---

**Fecha de implementación:** Octubre 22, 2025
**Autor:** Sistema de validaciones para productos e-commerce

