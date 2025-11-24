# 📚 Sistema Kardex Multi-Moneda - Explicación Simple

## 🎯 Resumen Ejecutivo (Lo Más Importante)

### ¿Qué Cambiamos Recientemente?

**1. Eliminamos `totalValue` sin moneda** ❌ → ✅
- **Antes:** El summary tenía `totalValue: 900` (¿900 en qué moneda?)
- **Ahora:** Solo existe `totalValuesByCurrency: [{ currency: "PEN", totalValue: 900 }, ...]`
- **Razón:** Más claro, cada valor tiene su moneda

**2. Calculamos valores sobre la marcha** 🚀
- **Problema:** Kardex antiguos no tienen `KardexValue` en BD → `totalValuesByCurrency: []`
- **Solución:** Si no hay en BD, calculamos desde `stock × precio` para mostrar
- **Resultado:** Todos los Kardex muestran valores (aunque no estén en BD)
- **Nota:** Solo muestra, no guarda. Para guardar usa el endpoint `correct`

**3. Creamos endpoints de corrección** 🔧
- **`POST /kardex/correct/:kardexId`**: Corrige un Kardex específico
- **`POST /kardex/correct-all/:storeId`**: Corrige todos los Kardex de una tienda
- **Qué corrige:** Crea `KardexValue`, actualiza `minStock`, sincroniza campos, recalcula totales

---

## 🍎 Explicación con Manzanitas (Paso a Paso)

### ¿Qué es el Kardex?
Imagina que tienes una tienda de manzanas. El Kardex es como tu **libro contable** donde apuntas:
- Cuántas manzanas tienes (stock)
- Cuándo vendiste manzanas (VENTA)
- Cuándo te devolvieron manzanas (DEVOLUCION)
- Cuándo ajustaste el conteo manualmente (AJUSTE)
- Cuánto vale tu inventario de manzanas

---

## 🎯 ¿Qué Problema Teníamos?

### Problema 1: Mezclábamos Monedas ❌
**Ejemplo malo:**
- Vendiste 100 manzanas a 10 PEN cada una = 1000 PEN
- Vendiste 50 manzanas a 3 USD cada una = 150 USD
- El sistema sumaba: `1000 + 150 = 1150` ❌ ¡ERROR! No puedes sumar PEN con USD

**Solución:** Guardamos cada movimiento en SU moneda original y convertimos a otras monedas después ✅

---

### Problema 2: No Sabíamos el Valor Actual del Inventario ❌
- Tenías 20 manzanas en stock
- El precio cambió de 10 PEN a 12 PEN
- El sistema seguía mostrando el valor viejo ❌

**Solución:** Ahora calculamos: `valor = stock actual × precio actual` ✅

---

### Problema 3: No Teníamos Histórico de Tipos de Cambio ❌
- Hiciste una venta en PEN hace 3 meses
- El tipo de cambio era 1 PEN = 0.27 USD
- Ahora no recordabas qué tipo de cambio usaste ❌

**Solución:** Guardamos el tipo de cambio usado en cada movimiento ✅

---

## ✅ ¿Qué Hicimos? (Solución Simple)

Creamos **4 tablas** que trabajan juntas:

### 📊 Tabla 1: `Kardex` (El Libro Principal)
**¿Qué guarda?**
- Información del producto (nombre, SKU, categoría)
- Stock inicial y stock actual
- Cuántas unidades entraron (total)
- Cuántas unidades salieron (total)

**Ejemplo:**
```
Producto: Manzanas Rojas
Stock inicial: 100
Stock actual: 85
Total entradas: 20
Total salidas: 35
```

---

### 📝 Tabla 2: `KardexMovement` (Cada Movimiento Individual)
**¿Qué guarda?**
- Cada venta, devolución o ajuste individual
- Fecha del movimiento
- Cantidad que entró o salió
- Precio en la moneda original (de dónde vino)
- Tipo de movimiento (VENTA, DEVOLUCION, AJUSTE)

**Ejemplo:**
```
Fecha: 2025-11-23
Tipo: VENTA
Cantidad: 10 manzanas
Precio unitario: 10 PEN (precio original de la venta)
Total: 100 PEN
Moneda original: PEN (de la orden)
```

**Reglas especiales:**
- **VENTA/DEVOLUCION:** Tiene `currencyId` (moneda de la orden)
- **AJUSTE:** NO tiene `currencyId` (null) porque no viene de una transacción

---

### 💰 Tabla 3: `KardexValue` (Valor Actual del Inventario)
**¿Qué guarda?**
- El valor actual del inventario en cada moneda
- **Fórmula simple:** `valor = stock actual × precio actual`

**Ejemplo:**
```
Tienes 20 manzanas en stock:
- Precio en PEN: 10 PEN → Valor = 20 × 10 = 200 PEN
- Precio en USD: 3 USD → Valor = 20 × 3 = 60 USD
- Precio en EUR: 2.5 EUR → Valor = 20 × 2.5 = 50 EUR
```

**¿Cuándo se actualiza?**
- Después de cada movimiento (VENTA, DEVOLUCION, AJUSTE)
- Al cambiar el precio del producto
- Se **recalcula siempre** (no suma/resta, calcula desde cero)

---

### 📜 Tabla 4: `KardexMovementValue` (Histórico del Movimiento)
**¿Qué guarda?**
- El valor de cada movimiento convertido a todas las monedas
- El tipo de cambio usado para convertir
- La fecha del tipo de cambio (para auditoría)

**Ejemplo:**
```
Vendiste 10 manzanas a 10 PEN cada una = 100 PEN total

Se guardan los valores en todas las monedas:
- En PEN: 10 PEN × 10 = 100 PEN (tipo cambio: 1.0)
- En USD: 100 PEN × 0.27 = 27 USD (tipo cambio: 0.27, fecha: 2025-11-23)
- En EUR: 100 PEN × 0.24 = 24 EUR (tipo cambio: 0.24, fecha: 2025-11-23)
```

**¿Cuándo se crea?**
- Solo para VENTA y DEVOLUCION (movimientos con moneda)
- NO para AJUSTE (porque no tiene moneda original)

**¿Cuándo se actualiza?**
- NUNCA. Es histórico, no cambia.

---

## 🔄 ¿Cómo Funciona Todo Junto? (Flujo Completo)

### Ejemplo Real: Venta de 10 Manzanas

**Situación:**
- Tienes 50 manzanas en stock
- Precio: 10 PEN cada una
- Vendes 10 manzanas por una orden en PEN

**Paso 1: Se crea el movimiento** (`KardexMovement`)
```
Tipo: VENTA
Cantidad: 10 manzanas
Precio: 10 PEN (de la orden)
Total: 100 PEN
Moneda: PEN
Stock después: 40 manzanas
```

**Paso 2: Se convierten a otras monedas** (`KardexMovementValue`)
```
PEN: 100 PEN (tipo cambio: 1.0)
USD: 27 USD (tipo cambio: 0.27)
EUR: 24 EUR (tipo cambio: 0.24)
```

**Paso 3: Se actualiza el stock** (`Kardex`)
```
Stock actual: 40 manzanas (era 50, ahora 40)
Total salidas: +10
```

**Paso 4: Se recalcula el valor del inventario** (`KardexValue`)
```
Ahora tienes 40 manzanas:
- Valor en PEN: 40 × 10 = 400 PEN
- Valor en USD: 40 × 3 = 120 USD
- Valor en EUR: 40 × 2.5 = 100 EUR
```

---

## 🎯 Puntos Clave (Resumen)

### 1. Multi-Moneda ✅
- Cada movimiento guarda su moneda original
- Se convierte a todas las monedas aceptadas
- Guardamos el tipo de cambio usado

### 2. Valor Actual ✅
- `KardexValue` siempre muestra: `stock actual × precio actual`
- Se recalcula después de cada movimiento
- Siempre está actualizado

### 3. Histórico ✅
- `KardexMovementValue` guarda valores históricos
- No cambia nunca (es histórico)
- Permite auditoría

### 4. AJUSTE es Especial ✅
- No tiene moneda original (`currencyId = null`)
- No crea `KardexMovementValue` (no hay qué convertir)
- Solo afecta el stock, no el valor

---

## 📊 Las 4 Tablas (Resumen Visual)

```
┌─────────────────────────────────────────┐
│          Kardex (1)                     │
│  - Stock actual                         │
│  - Total entradas/salidas               │
└───────────┬─────────────────────────────┘
            │
    ┌───────┴────────┐
    │                │
    ▼                ▼
┌─────────────┐  ┌──────────────┐
│ KardexValue │  │KardexMovement│
│ (por moneda)│  │  (histórico) │
│             │  └──────┬───────┘
│ valor =     │         │
│ stock×precio│         ▼
│             │  ┌──────────────────┐
│             │  │KardexMovementValue│
│             │  │  (por moneda)    │
│             │  │  (histórico)     │
└─────────────┘  └──────────────────┘
```

---

## 🔧 Optimizaciones Implementadas

### 1. Usamos `upsert` en lugar de buscar + crear/actualizar
**Antes:**
```typescript
// ❌ 2 queries por moneda (findUnique + create/update)
const kardexValue = await prisma.kardexValue.findUnique(...);
if (!kardexValue) {
  await prisma.kardexValue.create(...);
} else {
  await prisma.kardexValue.update(...);
}
```

**Ahora:**
```typescript
// ✅ 1 query por moneda (upsert hace todo)
await prisma.kardexValue.upsert({
  where: { ... },
  create: { ... },
  update: { ... },
});
```

### 2. Operaciones en batch (lote)
- `createMany` para crear múltiples registros de una vez
- `findMany` para obtener todos los tipos de cambio de una vez
- Reducimos queries de **N a 1-2**

### 3. Solo seleccionamos datos necesarios
- En `recalculateKardexValueForAllCurrencies` solo pedimos `inventoryQuantity` y `prices`
- No cargamos toda la información del producto si no la necesitamos

---

## 📝 Reglas de Negocio Importantes

### 1. Moneda Base del Kardex
- **NO se guarda** en el Kardex
- Se obtiene de `ShopSettings.defaultCurrencyId` cada vez que se necesita
- Si cambia la moneda base de la tienda, todos los Kardex usan la nueva automáticamente

### 2. Moneda del Movimiento
- **VENTA/DEVOLUCION:** Moneda de la orden (obligatorio, histórico)
- **AJUSTE:** `null` (no hay moneda original)

### 3. Conversión de Monedas
- Siempre directa (desde moneda original hacia cada moneda)
- Nunca vía otra moneda intermedia
- Si no hay tipo de cambio directo → se omite esa moneda

### 4. Actualización de Valores
- **`KardexValue`:** Se recalcula siempre (stock × precio)
- **`KardexMovementValue`:** Nunca se actualiza (es histórico)

### 5. Creación de Variante
- Se crea como **AJUSTE** (no COMPRA)
- `currencyId = null`
- Se calcula `KardexValue` desde el inicio

---

## 🚀 Ventajas del Sistema

1. ✅ **Multi-moneda:** Soporta todas las monedas aceptadas
2. ✅ **Valor actual:** Siempre muestra el valor real del inventario
3. ✅ **Histórico:** Guarda todos los movimientos con sus conversiones
4. ✅ **Auditoría:** Permite verificar qué tipo de cambio se usó
5. ✅ **Consistencia:** No mezcla monedas
6. ✅ **Rendimiento:** Optimizado con operaciones batch y upsert
7. ✅ **Flexible:** AJUSTE sin moneda, VENTA/DEVOLUCION con moneda

---

## 🔄 Cambios Recientes (Mejoras Adicionales)

### 🎯 Eliminación de `totalValue` del Summary

**¿Qué cambió?**
- ❌ **Antes:** El summary tenía un campo `totalValue` sin moneda asociada
- ✅ **Ahora:** Solo existe `totalValuesByCurrency` (array con valores por moneda)

**¿Por qué?**
- `totalValue` no tenía sentido porque no indicaba en qué moneda estaba
- `totalValuesByCurrency` es más claro: muestra cada moneda con su valor
- Evita confusión sobre qué moneda se está usando

**Ejemplo:**
```json
// ❌ Antes (confuso):
{
  "summary": {
    "totalValue": 900,  // ¿900 en qué moneda?
    "totalValuesByCurrency": [...]
  }
}

// ✅ Ahora (claro):
{
  "summary": {
    "totalValuesByCurrency": [
      { "currency": { "code": "PEN" }, "totalValue": 900 },
      { "currency": { "code": "USD" }, "totalValue": 243 }
    ]
  }
}
```

---

### 🚀 Cálculo Sobre la Marcha (Fallback)

**¿Qué es?**
Si un Kardex no tiene `KardexValue` en la BD (por ejemplo, Kardex antiguos), el sistema calcula los valores sobre la marcha para mostrarlos.

**¿Cómo funciona?**
1. Primero intenta obtener valores desde `KardexValue` (BD)
2. Si está vacío, calcula desde `variant.inventoryQuantity × variant.prices[]`
3. **Solo muestra** (no guarda en BD - para guardar usa el endpoint `correct`)

**Ejemplo:**
```
Kardex antiguo (sin KardexValue):
  - Stock: 50 manzanas
  - Precios: 10 PEN, 3 USD
  - ❌ No tiene KardexValue en BD
  
Resultado:
  - ✅ Calcula sobre la marcha: 50 × 10 = 500 PEN, 50 × 3 = 150 USD
  - ✅ Muestra los valores en la respuesta
  - ⚠️ NO los guarda en BD (usa endpoint `correct` para guardarlos)
```

**Ventajas:**
- ✅ Los Kardex antiguos se muestran correctamente
- ✅ No requiere migración inmediata
- ✅ Las consultas siguen siendo rápidas (no guardan en BD)
- ✅ Puedes actualizar la BD cuando quieras usando `POST /kardex/correct-all/:storeId`

---

### 🔧 Endpoints de Corrección

**¿Para qué sirven?**
Permiten actualizar la BD de Kardex que tienen datos inconsistentes o faltantes.

**Endpoints disponibles:**
1. **`POST /kardex/correct/:kardexId`** - Corrige un Kardex específico
2. **`POST /kardex/correct-all/:storeId`** - Corrige todos los Kardex de una tienda

**¿Qué corrigen?**
- ✅ **`recalculateValues`** (default: true): Crea/actualiza `KardexValue` desde stock × precio
- ✅ **`updateMinStock`** (default: true): Actualiza `minStock` desde `Product.restockThreshold`
- ✅ **`recalculateTotals`** (default: true): Recalcula `totalEntries` y `totalExits` desde movimientos
- ✅ **`resetInitialStock`** (default: false): Resetea `initialStock` al stock actual
- ✅ **`syncFields`** (default: true): Sincroniza `sku`, `productName`, `category` desde variant

**Ejemplo de uso:**
```bash
# Corregir todos los Kardex de una tienda
POST /kardex/correct-all/store_123

# Solo recalcular valores, sin actualizar minStock
POST /kardex/correct-all/store_123?recalculateValues=true&updateMinStock=false
```

---

## 📚 Cambios en el Schema (Base de Datos)

### 1. Tabla `Kardex`
- ✅ Eliminado `totalValue` (ahora en `KardexValue`)
- ✅ Eliminado `currencyId` (se obtiene de `ShopSettings`)
- ✅ `minStock` opcional (puede venir de `Product.restockThreshold`)

### 2. Nueva Tabla `KardexValue`
- Guarda el valor actual del inventario en cada moneda
- Fórmula: `totalValue = stock actual × precio actual`
- Se actualiza después de cada movimiento

### 3. Tabla `KardexMovement`
- ✅ `currencyId` ahora es opcional (`String?`)
  - `null` para AJUSTE
  - Obligatorio para VENTA/DEVOLUCION

### 4. Nueva Tabla `KardexMovementValue`
- Guarda valores históricos convertidos
- Guarda tipo de cambio usado
- Guarda fecha del tipo de cambio (auditoría)

---

## 💻 Cambios en el Código

### Archivo: `src/common/services/inventory.service.ts`

#### Método: `recordKardexMovement`

**1. Calcula `unitCost` y `currencyId` automáticamente:**
- **VENTA/DEVOLUCION:** Obtiene desde la orden (`OrderItem.price` y `Order.currencyId`)
- **AJUSTE:** Usa precio de la variante, `currencyId = null`

**2. Crea `KardexMovement` con los datos correctos**

**3. Si hay moneda (`currencyId` no es null):**
- Obtiene tipos de cambio
- Crea `KardexMovementValue` para todas las monedas

**4. Actualiza el Kardex** (stock, totales)

**5. Recalcula `KardexValue`** usando el nuevo método optimizado

#### Método: `recalculateKardexValueForAllCurrencies` (Público)

**Optimizado con `upsert`:**
- Obtiene la variante con precios actuales
- Para cada moneda aceptada:
  - Calcula: `stock actual × precio actual`
  - Usa `upsert` para crear o actualizar en una sola operación
- Retorna contadores: `{ created, updated }`

**Antes:** N queries (findUnique + create/update)  
**Ahora:** N queries (solo upsert, más eficiente)

---

### Archivo: `src/kardex/kardex.service.ts`

#### Método: `processVariant`

**Cambios principales:**
1. ✅ Eliminado `totalValue` del summary (solo `totalValuesByCurrency`)
2. ✅ Si no hay `KardexValue` en BD, calcula sobre la marcha
3. ✅ Usa función helper `calculateValuesFromPrices` para simplificar

**Lógica:**
```typescript
// 1. Intenta obtener valores desde KardexValue (BD)
let totalValuesByCurrency = kardexValues.map(...);

// 2. Si está vacío, calcula sobre la marcha (solo mostrar)
if (totalValuesByCurrency.length === 0) {
  totalValuesByCurrency = this.calculateValuesFromPrices(variant, acceptedCurrencies);
}
```

#### Método: `calculateValuesFromPrices` (Nuevo Helper)

**Simplifica el cálculo sobre la marcha:**
- Filtra precios de monedas aceptadas
- Calcula: `stock actual × precio actual` para cada moneda
- Retorna array formateado con currency info

**Ventajas:**
- ✅ Código más limpio y reutilizable
- ✅ Fácil de mantener
- ✅ Lógica separada del procesamiento principal

#### Método: `getKardexDataBatch`

**Cambios:**
- ✅ Ahora obtiene `acceptedCurrencies` desde `ShopSettings`
- ✅ Pasa `acceptedCurrencies` en el Map para calcular sobre la marcha
- ✅ Permite calcular valores cuando no existen en BD

#### Método: `correctKardex` (Nuevo)

**Corrige un Kardex específico:**
- Recalcula `KardexValue` desde stock × precio
- Actualiza `minStock` desde `Product.restockThreshold`
- Sincroniza campos (`sku`, `productName`, `category`)
- Recalcula totales desde movimientos
- Opcional: Resetea `initialStock`

#### Método: `correctAllKardex` (Nuevo)

**Corrige todos los Kardex de una tienda:**
- Aplica las mismas correcciones que `correctKardex`
- Itera sobre todos los Kardex
- Acumula contadores de correcciones
- Registra errores sin detener el proceso

---

## 🎓 Ejemplo Completo Paso a Paso

### Escenario Inicial:
- Tienda acepta: PEN, USD, EUR
- Tienes 100 manzanas en stock
- Precio: 10 PEN, 3 USD, 2.5 EUR

### Creación de Variante:
```
1. Se crea Kardex:
   - Stock inicial: 100
   - Stock actual: 100

2. Se crean KardexValue:
   - PEN: 100 × 10 = 1000 PEN
   - USD: 100 × 3 = 300 USD
   - EUR: 100 × 2.5 = 250 EUR

3. Se crea KardexMovement (tipo: AJUSTE):
   - currencyId: null
   - No se crean KardexMovementValue
```

### Venta de 10 Manzanas:
```
1. Se crea KardexMovement:
   - Tipo: VENTA
   - Cantidad: 10
   - Precio: 10 PEN (de la orden)
   - currencyId: PEN

2. Se crean KardexMovementValue:
   - PEN: 100 PEN (tipo cambio: 1.0)
   - USD: 27 USD (tipo cambio: 0.27)
   - EUR: 24 EUR (tipo cambio: 0.24)

3. Se actualiza Kardex:
   - Stock actual: 90 (era 100)
   - Total salidas: +10

4. Se recalculan KardexValue:
   - PEN: 90 × 10 = 900 PEN
   - USD: 90 × 3 = 270 USD
   - EUR: 90 × 2.5 = 225 EUR
```

### Ajuste Manual de Stock:
```
1. Ajustas stock de 90 a 95 manzanas

2. Se crea KardexMovement:
   - Tipo: AJUSTE
   - Cantidad: 5 (entrada)
   - currencyId: null
   - No se crean KardexMovementValue

3. Se actualiza Kardex:
   - Stock actual: 95
   - Total entradas: +5

4. Se recalculan KardexValue:
   - PEN: 95 × 10 = 950 PEN
   - USD: 95 × 3 = 285 USD
   - EUR: 95 × 2.5 = 237.5 EUR
```

---

## ✅ Resumen Final de Cambios

### 1. **Estructura de Tablas**
Creamos 4 tablas que trabajan juntas:
- `Kardex`: Resumen principal (sin `currencyId`, sin `totalValue`)
- `KardexMovement`: Cada movimiento individual (`currencyId` opcional para AJUSTE)
- `KardexValue`: Valor actual del inventario (stock × precio) por moneda
- `KardexMovementValue`: Valores históricos convertidos por moneda

### 2. **Multi-Moneda**
- Cada movimiento se guarda en su moneda original
- Se convierte a todas las monedas aceptadas
- Se guarda el tipo de cambio usado (auditoría)

### 3. **Valor Actual**
- `KardexValue` siempre muestra: `stock actual × precio actual` por moneda
- Se recalcula después de cada movimiento
- **Nuevo:** Si no existe en BD, se calcula sobre la marcha (solo mostrar)

### 4. **Eliminación de `totalValue`**
- ❌ Removido `totalValue` sin moneda del summary
- ✅ Solo existe `totalValuesByCurrency` (array por moneda)

### 5. **Endpoints de Corrección**
- `POST /kardex/correct/:kardexId`: Corrige un Kardex
- `POST /kardex/correct-all/:storeId`: Corrige todos los Kardex
- Permite actualizar BD cuando sea necesario

---

## 🎉 Conclusión

Este sistema permite:
- ✅ Manejar inventario en múltiples monedas
- ✅ Ver el valor actual del inventario en cualquier moneda
- ✅ Mantener histórico completo de movimientos
- ✅ Auditar tipos de cambio usados
- ✅ Ser flexible con ajustes manuales
- ✅ Mostrar valores aunque no estén en BD (cálculo sobre la marcha)
- ✅ Actualizar BD cuando sea necesario (endpoints de corrección)
- ✅ Estructura clara sin campos redundantes

**El sistema es robusto, preciso, escalable y compatible con Kardex antiguos.**

---

## 📝 Resumen de Todos los Cambios Realizados

### 🎯 Cambios Principales

#### 1. **Eliminación de `totalValue` sin Moneda**
**Problema:** El campo `totalValue` en el summary no tenía moneda asociada, causando confusión.

**Solución:**
- ❌ Eliminado `totalValue: number` del interface `ProcessedVariant`
- ✅ Solo existe `totalValuesByCurrency` (array con valores por moneda)
- ✅ Cada valor tiene su moneda claramente identificada

**Archivos modificados:**
- `src/kardex/kardex.service.ts`:
  - Interface `ProcessedVariant`: Eliminado `totalValue`
  - Método `processVariant`: Eliminado cálculo de `totalValue`
  - Método `getKardexStats`: Eliminado acumulador de `totalValue`

---

#### 2. **Cálculo Sobre la Marcha (Fallback)**
**Problema:** Kardex antiguos no tienen `KardexValue` en la BD, mostrando `totalValuesByCurrency: []`.

**Solución:**
- ✅ Si no hay `KardexValue` en BD, calcula sobre la marcha desde `variant.inventoryQuantity × variant.prices[]`
- ✅ Solo muestra valores (no guarda en BD)
- ✅ Permite ver valores aunque no existan en BD
- ✅ Para guardar en BD, usa el endpoint `correct`

**Archivos modificados:**
- `src/kardex/kardex.service.ts`:
  - Método `getKardexDataBatch`: Obtiene `acceptedCurrencies` desde `ShopSettings`
  - Método `processVariant`: Calcula valores sobre la marcha si no existen
  - Método `calculateValuesFromPrices` (nuevo): Helper para calcular desde precios
  - Método `getKardexGeneral`: Pasa `storeId` a `getKardexDataBatch`
  - Método `getKardexStats`: Incluye precios con currency en query

**Lógica implementada:**
```typescript
// 1. Intenta obtener desde KardexValue (BD)
let totalValuesByCurrency = kardexValues.map(...);

// 2. Si está vacío, calcula sobre la marcha
if (totalValuesByCurrency.length === 0) {
  totalValuesByCurrency = this.calculateValuesFromPrices(variant, acceptedCurrencies);
}
```

---

#### 3. **Endpoints de Corrección**
**Problema:** No había forma de corregir Kardex con datos inconsistentes o faltantes.

**Solución:**
- ✅ `POST /kardex/correct/:kardexId`: Corrige un Kardex específico
- ✅ `POST /kardex/correct-all/:storeId`: Corrige todos los Kardex de una tienda
- ✅ Permite controlar qué se corrige mediante query parameters

**Archivos creados:**
- `src/kardex/dto/correct-kardex.dto.ts`: DTO con query parameters opcionales

**Archivos modificados:**
- `src/kardex/kardex.service.ts`:
  - Método `correctKardex` (nuevo): Corrige un Kardex individual
  - Método `correctAllKardex` (nuevo): Corrige todos los Kardex de una tienda
- `src/kardex/kardex.controller.ts`:
  - Endpoint `POST /kardex/correct/:kardexId`
  - Endpoint `POST /kardex/correct-all/:storeId`
- `src/common/services/inventory.service.ts`:
  - Método `recalculateKardexValueForAllCurrencies`: Ahora es público y retorna contadores

**Query Parameters disponibles:**
- `recalculateValues` (default: true): Crea/actualiza `KardexValue`
- `updateMinStock` (default: true): Actualiza `minStock` desde Product
- `recalculateTotals` (default: true): Recalcula totales desde movimientos
- `resetInitialStock` (default: false): Resetea `initialStock`
- `syncFields` (default: true): Sincroniza campos básicos

---

#### 4. **Optimización y Simplificación**
**Mejoras de código:**
- ✅ Creada función helper `calculateValuesFromPrices` para simplificar lógica
- ✅ Reducido código duplicado
- ✅ Mejor separación de responsabilidades

---

### 📋 Flujo Completo de Uso

#### Escenario 1: Consulta Normal
```
1. Usuario consulta: GET /kardex/store_123/general
2. Sistema busca KardexValue en BD
3. Si existe: ✅ Usa valores de BD
4. Si no existe: ✅ Calcula sobre la marcha desde variant.prices × inventoryQuantity
5. Muestra valores en respuesta
6. ⚠️ NO guarda en BD (solo muestra)
```

#### Escenario 2: Actualizar BD
```
1. Usuario ejecuta: POST /kardex/correct-all/store_123
2. Sistema itera sobre todos los Kardex
3. Para cada Kardex:
   - Crea/actualiza KardexValue desde stock × precio
   - Actualiza minStock desde Product
   - Sincroniza campos
   - Recalcula totales
4. ✅ Guarda todo en BD
5. Retorna contadores de correcciones
```

#### Escenario 3: Consulta Después de Corrección
```
1. Usuario consulta: GET /kardex/store_123/general
2. Sistema busca KardexValue en BD
3. ✅ Ahora existe (fue creado por endpoint correct)
4. ✅ Usa valores de BD (más rápido)
5. Muestra valores en respuesta
```

---

### 🎓 Ejemplo Completo con Cálculo Sobre la Marcha

**Situación:**
- Kardex antiguo (sin KardexValue en BD)
- Variante: 50 manzanas en stock
- Precios: 10 PEN, 3 USD

**Consulta (`GET /kardex/store_123/general`):**
```json
{
  "summary": {
    "finalStock": 50,
    "totalValuesByCurrency": [
      {
        "currency": { "code": "PEN" },
        "totalValue": 500  // ✅ Calculado: 50 × 10
      },
      {
        "currency": { "code": "USD" },
        "totalValue": 150  // ✅ Calculado: 50 × 3
      }
    ]
  }
}
```

**Después de corrección (`POST /kardex/correct-all/store_123`):**
- ✅ Se crean KardexValue en BD
- ✅ Próximas consultas usan valores de BD (más rápido)

---

### ✅ Resumen Final

**Lo que hicimos:**
1. ✅ Eliminamos `totalValue` sin moneda (redundante y confuso)
2. ✅ Implementamos cálculo sobre la marcha para Kardex antiguos
3. ✅ Creamos endpoints de corrección para actualizar BD
4. ✅ Simplificamos y optimizamos el código

**Resultado:**
- ✅ Sistema compatible con Kardex antiguos
- ✅ Muestra valores aunque no estén en BD
- ✅ Permite actualizar BD cuando sea necesario
- ✅ Código más limpio y mantenible
- ✅ Estructura clara sin campos redundantes

**El sistema ahora es robusto, preciso, escalable y compatible con Kardex antiguos.**
