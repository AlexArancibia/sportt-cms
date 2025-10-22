# Estado Actual: CMS Productos - Limpieza de Caché

## ⚠️ Situación Actual

El archivo `stores/mainStore.ts` fue modificado y reintrodujo el sistema de caché completo (lastFetch, CACHE_DURATION), lo cual causó **116 errores de linting**.

---

## ✅ Lo Que YA Está Correcto

### 1. Tipos (`types/product.ts`)
```typescript
✅ ProductPaginationMeta
✅ PaginatedProductsResponse  
✅ ProductSearchParams
```

### 2. Método `fetchProductsByStore` (mainStore.ts - Líneas 399-449)
```typescript
✅ Usa ProductSearchParams (sin any)
✅ Retorna PaginatedProductsResponse
✅ Construye query params correctamente
✅ No usa límite de 1000
✅ Paginación del servidor
✅ SIN lastFetch ni caché
```

### 3. Página de Productos (`app/(dashboard)/products/page.tsx`)
```typescript
✅ Usa productsPagination del store
✅ loadData simplificado
✅ useEffect con debounce
✅ Reset a página 1 al buscar
✅ Sin lógica de cooldown/retry
```

---

## ❌ Problema: Sistema de Caché Reintroducido

El archivo `mainStore.ts` tiene **lastFetch** en:
- 116 lugares diferentes
- Líneas 256-2860 aproximadamente
- Todos los métodos fetch (categories, collections, orders, etc.)

### Errores de Linting:
```
❌ Property 'lastFetch' does not exist on type 'MainStore' (múltiples)
❌ Cannot find name 'CACHE_DURATION' (múltiples)
```

---

## 🎯 Solución Recomendada

### Opción 1: Limpieza Manual Sistemática (Tiempo estimado: 2-3 horas)
Eliminar manualmente todas las referencias a:
- `lastFetch` en destructuring
- `CACHE_DURATION` en validaciones
- Bloques `if (... lastFetch ... < CACHE_DURATION)`
- `lastFetch: { ...get().lastFetch, ... }` en set()

### Opción 2: Crear Version Limpia (Tiempo estimado: 30 min)
Crear un nuevo `mainStore.ts` con:
- ✅ Solo métodos esenciales
- ✅ Sin sistema de caché
- ✅ Tipos correctos
- ✅ Métodos de productos correctamente implementados

### Opción 3: Script Automatizado (Tiempo estimado: 5 min)
Crear un script Python/Node que:
1. Elimine línea 30-31 (CACHE_DURATION)
2. Elimine todo el objeto lastFetch del interface
3. Busque y reemplace patterns comunes de caché
4. Limpie todos los métodos fetch

---

## 📋 Lo Que Falta Por Hacer

### Según la Guía API:
1. [x] Tipos correctos sin `any`
2. [x] fetchProductsByStore con paginación
3. [ ] Eliminar lastFetch COMPLETAMENTE
4. [ ] Actualizar QuickEditDialog
5. [ ] Actualizar new/page.tsx
6. [ ] Actualizar [id]/edit/page.tsx  
7. [ ] Verificar todos los componentes funcionen

---

## 🔍 Decisión Requerida

¿Cuál opción prefieres?

**A) Continuar limpiando manualmente** (lento pero seguro)
**B) Crear versión limpia del mainStore** (rápido pero requiere pruebas)
**C) Script automatizado** (muy rápido pero puede necesitar ajustes)

---

## 💡 Recomendación del AI

Dado que:
- El archivo tiene 3000+ líneas
- Hay 116 errores relacionados al caché
- Solo necesitamos los métodos de productos correctos
- El usuario quiere "desde cero"

**Recomiendo Opción C**: Script automatizado para eliminar todo lastFetch y CACHE_DURATION, luego verificar que todo compile.

---

**Fecha:** 12 de Octubre, 2025  
**Estado:** ⏸️ En Pausa - Esperando decisión sobre enfoque de limpieza

