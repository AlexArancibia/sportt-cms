# API Endpoints Standardization - Changelog

## Resumen de Cambios

Este documento describe los cambios realizados para estandarizar los endpoints de la API, eliminando inconsistencias en el uso de parámetros `storeId` y rutas con prefijo `store/`.

## Problemas Identificados y Solucionados

### Problema 1: Inconsistencia en rutas con prefijo `store/`

**Descripción**: Algunos endpoints usaban el patrón `store/:storeId` mientras que otros usaban directamente `:storeId`.

**Solución**: Estandarizar todos los endpoints para usar directamente `:storeId` sin el prefijo `store/`.

### Problema 2: Duplicación de `storeId` en URL y Body

**Descripción**: Algunos endpoints requerían `storeId` tanto en la URL como en el body del request, causando redundancia y posibles inconsistencias.

**Solución**: Eliminar `storeId` del body de los DTOs cuando ya está presente en la URL, usando solo el parámetro de la URL.

## Cambios Detallados

### 1. Corrección de Rutas (Problema 1)

#### Controladores Modificados:

**src/product/product.controller.ts**
- `GET store/:storeId` → `GET :storeId`

**src/shipping-methods/shipping-methods.controller.ts**
- `GET store/:storeId/location` → `GET :storeId/location`

**src/shop/shop.controller.ts**
- `GET store/:storeId` → `GET :storeId`
- `PATCH store/:storeId` → `PATCH :storeId`
- `POST store/:storeId/currencies/:currencyId` → `POST :storeId/currencies/:currencyId`
- `DELETE store/:storeId/currencies/:currencyId` → `DELETE :storeId/currencies/:currencyId`

**src/refund/refund.controller.ts**
- `GET store/:storeId` → `GET :storeId`
- `GET statistics/store/:storeId` → `GET statistics/:storeId`

**src/payment-transaction/payment-transaction.controller.ts**
- `GET store/:storeId` → `GET :storeId`
- `GET statistics/store/:storeId` → `GET statistics/:storeId`

**src/payment-providers/payment-providers.controller.ts**
- `GET store/:storeId` → `GET :storeId`

### 2. Eliminación de `storeId` del Body (Problema 2)

#### DTOs Modificados:

**src/category/dto/create-category.dto.ts**
- ❌ Removido: `storeId: string` (obligatorio)
- ✅ Ahora se obtiene del parámetro URL

**src/content/dto/create-content.dto.ts**
- ❌ Removido: `storeId: string` (obligatorio)
- ✅ Ahora se obtiene del parámetro URL

**src/coupon/dto/create-coupon.dto.ts**
- ❌ Removido: `storeId: string` (obligatorio)
- ✅ Ahora se obtiene del parámetro URL

**src/collection/dto/create-collection.dto.ts**
- ❌ Removido: `storeId: string` (obligatorio)
- ✅ Ahora se obtiene del parámetro URL

**src/fbt/dto/create-fbt.dto.ts**
- ❌ Removido: `storeId: string` (obligatorio)
- ✅ Ahora se obtiene del parámetro URL

**src/order/dto/create-order.dto.ts**
- ❌ Removido: `storeId: string` (obligatorio)
- ✅ Ahora se obtiene del parámetro URL

**src/card-section/dto/create-card-section.dto.ts**
- ❌ Removido: `storeId: string` (obligatorio)
- ✅ Ahora se obtiene del parámetro URL

**src/seo-config/dto/create-seo-config.dto.ts**
- ❌ Removido: `storeId: string` (obligatorio)
- ✅ Ahora se obtiene del parámetro URL

**src/payment-providers/dto/create-payment-provider.dto.ts**
- ❌ Removido: `storeId: string` (obligatorio)
- ✅ Ahora se obtiene del parámetro URL

#### Controladores Modificados:

**src/category/category.controller.ts**
- `POST :storeId` - Eliminada validación de `storeId` en body
- `PUT :storeId/:id` - Eliminada validación de `storeId` en body

**src/content/content.controller.ts**
- `POST :storeId` - Eliminada validación de `storeId` en body
- `PUT :storeId/:id` - Eliminada validación de `storeId` en body

**src/coupon/coupon.controller.ts**
- `POST :storeId` - Eliminada validación de `storeId` en body
- `PUT :storeId/:id` - Eliminada validación de `storeId` en body

**src/collection/collection.controller.ts**
- `POST :storeId` - Eliminada validación de `storeId` en body
- `PATCH :storeId/:id` - Eliminada validación de `storeId` en body

**src/fbt/fbt.controller.ts**
- `POST :storeId` - Eliminada validación de `storeId` en body
- `PATCH :storeId/:id` - Eliminada validación de `storeId` en body

**src/order/order.controller.ts**
- `POST :storeId` - Eliminada validación de `storeId` en body
- `PUT :storeId/:id` - Eliminada validación de `storeId` en body

**src/card-section/card-section.controller.ts**
- `POST :storeId` - Eliminada validación de `storeId` en body
- `PATCH :storeId/:id` - Eliminada validación de `storeId` en body

**src/seo-config/seo-config.controller.ts**
- `POST :storeId` - Eliminada validación de `storeId` en body
- `PATCH :storeId/:id` - Eliminada validación de `storeId` en body

### 3. Actualización de Servicios

#### Servicios Modificados:

**src/fbt/fbt.service.ts**
- Método `create()` ahora recibe `storeId` como parámetro separado
- Actualizada lógica para usar `storeId` del parámetro en lugar del DTO

**src/content/content.service.ts**
- Método `create()` ahora recibe `storeId` como parámetro separado
- Actualizada lógica para usar `storeId` del parámetro en lugar del DTO

## Controladores que NO Requirieron Cambios

Los siguientes controladores ya estaban implementados correctamente:

- `src/product/product.controller.ts` ✅
- `src/team-section/team-section.controller.ts` ✅
- `src/hero-section/hero-section.controller.ts` ✅
- `src/client-logo-section/client-logo-section.controller.ts` ✅
- `src/shipping-methods/shipping-methods.controller.ts` ✅
- `src/payment-transaction/payment-transaction.controller.ts` ✅
- `src/refund/refund.controller.ts` ✅

## Beneficios de los Cambios

1. **Consistencia**: Todos los endpoints ahora siguen el mismo patrón de rutas
2. **Simplicidad**: Eliminación de redundancia en parámetros
3. **Mantenibilidad**: Código más limpio y fácil de mantener
4. **Claridad**: API más intuitiva para los desarrolladores frontend
5. **Prevención de errores**: Menos posibilidades de inconsistencias entre URL y body

## Impacto en el Frontend

### Cambios en URLs:
- Las URLs de los endpoints han cambiado para eliminar el prefijo `store/`
- Ejemplo: `GET /products/store/123` → `GET /products/123`

### Cambios en Request Body:
- Los requests de creación ya no requieren incluir `storeId` en el body
- El `storeId` se obtiene automáticamente del parámetro de la URL

### Ejemplo de Cambio:

**Antes:**
```javascript
// URL
POST /categories/store/123

// Body
{
  "name": "Electronics",
  "storeId": "123",  // ❌ Redundante
  "description": "Electronic products"
}
```

**Después:**
```javascript
// URL
POST /categories/123

// Body
{
  "name": "Electronics",
  "description": "Electronic products"
  // ✅ storeId se obtiene de la URL
}
```

## Testing

Se recomienda actualizar todas las pruebas unitarias y de integración para reflejar estos cambios:

1. Actualizar URLs en las pruebas
2. Remover `storeId` de los objetos de prueba en el body
3. Verificar que los servicios reciban correctamente el `storeId` del parámetro

## Migración

Para migrar el frontend:

1. Actualizar todas las URLs que usen el prefijo `store/`
2. Remover `storeId` de los objetos enviados en el body de requests POST/PUT/PATCH
3. Verificar que la autenticación y autorización sigan funcionando correctamente

## Fecha de Implementación

**Fecha**: $(date)
**Versión**: 1.0.0
**Autor**: Sistema de Refactoring Automatizado
