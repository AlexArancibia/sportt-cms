# 📋 Documentación Completa de Endpoints de Kardex

## 🔐 Autenticación
Todos los endpoints requieren autenticación (`AuthGuard`).

---

## 1. GET `/kardex/:storeId/all`

### Descripción
Obtiene todos los registros de Kardex con sus relaciones completas (paginated). Incluye información detallada de cada Kardex con su variante, valores en múltiples monedas (KardexValue), y todos los movimientos con sus valores históricos en múltiples monedas (KardexMovementValue).

### Parámetros de URL
- `storeId` (string, requerido): ID de la tienda

### Query Parameters (Entrada)
```json
{
  // Paginación
  "page": 1,                             // Opcional: Número de página (default: 1)
  "limit": 20,                           // Opcional: Items por página (default: 20, máx: 100)

  // Ordenamiento
  "sortBy": "createdAt",                 // Opcional: Campo para ordenar (default: "createdAt")
                                        // Campos permitidos: createdAt, updatedAt, sku, productName, 
                                        // category, finalStock, initialStock, totalEntries, totalExits
  "sortOrder": "desc",                   // Opcional: "asc" | "desc" (default: "desc")

  // Filtros opcionales
  "variantId": "var_xyz789",             // Opcional: Filtrar por variante específica
  "sku": "MANZ-ROJ-001",                 // Opcional: Buscar por SKU (búsqueda parcial, case-insensitive)
  "productName": "Manzana",              // Opcional: Buscar por nombre de producto (búsqueda parcial, case-insensitive)
}
```

### Ejemplo de Request
```
GET /kardex/store_123/all?page=1&limit=20&sortBy=finalStock&sortOrder=desc
```

### Respuesta (Salida)
```json
{
  "data": [
    {
      "id": "kdx_abc123",
      "variantId": "var_xyz789",
      "sku": "MANZ-ROJ-001",
      "productName": "Manzana Roja Grande",
      "category": "Frutas",
      "unit": "unidad",
      "initialStock": 100,
      "finalStock": 90,
      "totalEntries": 105,
      "totalExits": 15,
      "minStock": 10,
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-11-23T10:30:00Z",
      "variant": {
        "id": "var_xyz789",
        "title": "Manzana Roja Grande",
        "sku": "MANZ-ROJ-001",
        "isActive": true,
        "inventoryQuantity": 90,
        "attributes": {
          "size": "Grande",
          "color": "Rojo"
        },
        "imageUrls": ["https://example.com/image1.jpg"],
        "product": {
          "id": "prod_abc123",
          "title": "Manzanas Rojas",
          "slug": "manzanas-rojas",
          "status": "ACTIVE"
        },
        "prices": [
          {
            "id": "vp_abc123",
            "currencyId": "pen",
            "currency": {
              "id": "pen",
              "code": "PEN",
              "symbol": "S/",
              "name": "Sol Peruano"
            },
            "price": 10.00,
            "originalPrice": 12.00
          },
          {
            "id": "vp_def456",
            "currencyId": "usd",
            "currency": {
              "id": "usd",
              "code": "USD",
              "symbol": "$",
              "name": "Dólar Estadounidense"
            },
            "price": 2.70,
            "originalPrice": null
          }
        ]
      },
      "values": [
        {
          "id": "kdxv_abc123",
          "currencyId": "pen",
          "currency": {
            "id": "pen",
            "code": "PEN",
            "symbol": "S/",
            "name": "Sol Peruano"
          },
          "totalValue": 900.00,
          "createdAt": "2025-01-01T00:00:00Z",
          "updatedAt": "2025-11-23T10:30:00Z"
        },
        {
          "id": "kdxv_def456",
          "currencyId": "usd",
          "currency": {
            "id": "usd",
            "code": "USD",
            "symbol": "$",
            "name": "Dólar Estadounidense"
          },
          "totalValue": 243.00,
          "createdAt": "2025-01-01T00:00:00Z",
          "updatedAt": "2025-11-23T10:30:00Z"
        }
      ],
      "movements": [
        {
          "id": "kdxm_abc123",
          "date": "2025-11-23T10:30:00Z",
          "type": "VENTA",
          "reference": "ord_123456",
          "entryQty": 0,
          "exitQty": 10,
          "finalStock": 90,
          "userId": "user_abc123",
          "reason": null,
          "createdAt": "2025-11-23T10:30:00Z",
          "values": [
            {
              "id": "kdxmv_abc123",
              "currencyId": "pen",
              "currency": {
                "id": "pen",
                "code": "PEN",
                "symbol": "S/",
                "name": "Sol Peruano"
              },
              "unitCost": 10.00,
              "totalCost": 100.00,
              "exchangeRate": 1.0,
              "exchangeRateDate": "2025-11-23T10:30:00Z",
              "createdAt": "2025-11-23T10:30:00Z",
              "updatedAt": "2025-11-23T10:30:00Z"
            },
            {
              "id": "kdxmv_def456",
              "currencyId": "usd",
              "currency": {
                "id": "usd",
                "code": "USD",
                "symbol": "$",
                "name": "Dólar Estadounidense"
              },
              "unitCost": 2.70,
              "totalCost": 27.00,
              "exchangeRate": 0.27,
              "exchangeRateDate": "2025-11-23T10:30:00Z",
              "createdAt": "2025-11-23T10:30:00Z",
              "updatedAt": "2025-11-23T10:30:00Z"
            }
          ]
        },
        {
          "id": "kdxm_xyz789",
          "date": "2025-11-22T14:20:00Z",
          "type": "AJUSTE",
          "reference": null,
          "entryQty": 5,
          "exitQty": 0,
          "finalStock": 100,
          "userId": "user_abc123",
          "reason": "Ajuste de inventario físico",
          "createdAt": "2025-11-22T14:20:00Z",
          "values": []
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Notas
- Este endpoint retorna la información completa de la tabla Kardex con todas sus relaciones (subtables) **directamente desde la BD**.
- **Estructura sin redundancia:** Todos los valores monetarios están dentro de `values[]`, incluyendo la moneda original (con `exchangeRate: 1.0`)
- **Moneda original:** Se identifica en `values[]` como el elemento con `exchangeRate: 1.0`
- **AJUSTE:** Los movimientos tipo `AJUSTE` tienen `values: []` (array vacío) en este endpoint porque retorna datos directamente de la BD, donde no se guardan valores para AJUSTE. Para ver valores calculados para AJUSTE, usa el endpoint `/general` que los calcula sobre la marcha.
- Los movimientos están ordenados por fecha descendente (más recientes primero).
- Los valores (KardexValue y KardexMovementValue) están ordenados por `currencyId` ascendente.
- Para movimientos de tipo `AJUSTE`, el campo `currencyId` y `currency` serán `null` en la BD.
- El campo `values` en cada movimiento contiene las conversiones históricas a diferentes monedas guardadas en BD.
- **Diferencia con `/general`:** Este endpoint (`/all`) retorna datos directamente de la BD, mientras que `/general` calcula valores sobre la marcha para movimientos sin valores guardados (especialmente AJUSTE).

---

## 2. GET `/kardex/:storeId/general`

### Descripción
Obtiene el Kardex general de productos con paginación. Incluye información detallada de cada variante con sus movimientos y valores en múltiples monedas.

### Parámetros de URL
- `storeId` (string, requerido): ID de la tienda

### Query Parameters (Entrada)
```json
{
  // Filtros de fecha (acepta ambos formatos)
  "startDate": "2025-01-01T00:00:00Z",  // Opcional: ISO 8601
  "endDate": "2025-12-31T23:59:59Z",    // Opcional: ISO 8601
  "dateFrom": "2025-01-01T00:00:00Z",   // Opcional: Alias de startDate
  "dateTo": "2025-12-31T23:59:59Z",     // Opcional: Alias de endDate

  // Búsqueda
  "query": "manzana",                   // Opcional: Búsqueda por texto (máx 200 caracteres)

  // Filtros de productos
  "productId": "prod_abc123",            // Opcional: Filtrar por producto específico
  "variantId": "var_xyz789",            // Opcional: Filtrar por variante específica
  "category": ["Frutas", "Verduras"],   // Opcional: Array de categorías (o string separado por comas)

  // Filtro de movimientos
  "movementType": ["VENTA", "DEVOLUCION", "AJUSTE"],  // Opcional: Array de tipos (o string separado por comas)

  // Método de valuación
  "valuationMethod": "FIFO",             // Opcional: "FIFO" | "WEIGHTED_AVERAGE" (default: WEIGHTED_AVERAGE)

  // Paginación
  "page": 1,                             // Opcional: Número de página (default: 1)
  "limit": 20,                           // Opcional: Items por página (default: 20, máx: 100)
  "pageSize": 20,                        // Opcional: Alias de limit

  // Ordenamiento
  "sortBy": "createdAt",                 // Opcional: Campo para ordenar (default: "createdAt")
  "sortOrder": "desc"                    // Opcional: "asc" | "desc" (default: "desc")
}
```

### Ejemplo de Request
```
GET /kardex/store_123/general?page=1&limit=20&startDate=2025-01-01&movementType=VENTA,DEVOLUCION
```

### Respuesta (Salida)
```json
{
  "data": [
    {
      "product": {
        "id": "prod_abc123",
        "name": "Manzanas Rojas",
        "categories": ["Frutas", "Frescas"]
      },
      "variants": [
        {
          "id": "var_xyz789",
          "sku": "MANZ-ROJ-001",
          "name": "Manzana Roja Grande",
          "movements": [
            {
              "date": "2025-11-23T10:30:00Z",
              "type": "VENTA",
              "reference": "ord_123456",
              "in": 0,
              "out": 10,
              "finalStock": 90,
              "values": [
                {
                  "currency": {
                    "id": "pen",
                    "code": "PEN",
                    "symbol": "S/"
                  },
                  "unitCost": 10.00,
                  "totalCost": 100.00,
                  "exchangeRate": 1.0,
                  "exchangeRateDate": "2025-11-23T10:30:00Z"
                },
                {
                  "currency": {
                    "id": "usd",
                    "code": "USD",
                    "symbol": "$"
                  },
                  "unitCost": 2.70,
                  "totalCost": 27.00,
                  "exchangeRate": 0.27,
                  "exchangeRateDate": "2025-11-23T10:30:00Z"
                },
                {
                  "currency": {
                    "id": "eur",
                    "code": "EUR",
                    "symbol": "€"
                  },
                  "unitCost": 2.40,
                  "totalCost": 24.00,
                  "exchangeRate": 0.24,
                  "exchangeRateDate": "2025-11-23T10:30:00Z"
                }
              ]
            },
            {
              "date": "2025-11-22T14:20:00Z",
              "type": "AJUSTE",
              "reference": null,
              "in": 5,
              "out": 0,
              "finalStock": 100,
              "values": [
                {
                  "currency": {
                    "id": "pen",
                    "code": "PEN",
                    "symbol": "S/"
                  },
                  "unitCost": 10.00,
                  "totalCost": 50.00,
                  "exchangeRate": 1.0,
                  "exchangeRateDate": "2025-11-22T14:20:00Z"
                },
                {
                  "currency": {
                    "id": "usd",
                    "code": "USD",
                    "symbol": "$"
                  },
                  "unitCost": 2.70,
                  "totalCost": 13.50,
                  "exchangeRate": 1.0,
                  "exchangeRateDate": "2025-11-22T14:20:00Z"
                }
              ]
            }
          ],
          "summary": {
            "initialStock": 100,
            "totalIn": 5,
            "totalOut": 10,
            "finalStock": 90,
            "avgUnitCost": 10.00,
            "totalValuesByCurrency": [
              {
                "currency": {
                  "id": "pen",
                  "code": "PEN",
                  "symbol": "S/"
                },
                "totalValue": 900.00
              },
              {
                "currency": {
                  "id": "usd",
                  "code": "USD",
                  "symbol": "$"
                },
                "totalValue": 243.00
              },
              {
                "currency": {
                  "id": "eur",
                  "code": "EUR",
                  "symbol": "€"
                },
                "totalValue": 216.00
              }
            ]
          }
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

### Notas
- **Estructura sin redundancia:** Todos los valores monetarios están dentro de `values[]`, incluyendo la moneda original (con `exchangeRate: 1.0`)
- **Moneda original:** Se identifica en `values[]` como el elemento con `exchangeRate: 1.0`
- **AJUSTE:** Los movimientos tipo `AJUSTE` muestran valores calculados desde los precios de la variante en todas las monedas disponibles. Estos valores se calculan sobre la marcha (no se guardan en BD) usando `cantidad × precio` para cada moneda disponible.
- **Ordenamiento:** Los valores en `values[]` están ordenados por `currencyId` ascendente
- `totalValuesByCurrency` muestra el valor actual del inventario en cada moneda (stock × precio)
- **Cálculo sobre la marcha:** 
  - Si un Kardex no tiene `KardexValue` en la BD, los valores se calculan automáticamente desde `variant.inventoryQuantity × variant.prices[]` (solo para mostrar, no guarda en BD)
  - Si un movimiento no tiene `KardexMovementValue` en la BD (especialmente AJUSTE), los valores se calculan desde `cantidad × variant.prices[]` (solo para mostrar, no guarda en BD)
- Para actualizar la BD y crear `KardexValue`, usa el endpoint `POST /kardex/correct/:kardexId` o `POST /kardex/correct-all/:storeId`

---

## 3. GET `/kardex/:storeId/stats`

### Descripción
Obtiene estadísticas agregadas del Kardex sin paginación. Calcula totales sobre todos los productos que cumplan los filtros.

### Parámetros de URL
- `storeId` (string, requerido): ID de la tienda

### Query Parameters (Entrada)
```json
{
  // Mismos filtros que /general (excepto paginación)
  "startDate": "2025-01-01T00:00:00Z",
  "endDate": "2025-12-31T23:59:59Z",
  "query": "manzana",
  "productId": "prod_abc123",
  "variantId": "var_xyz789",
  "category": ["Frutas"],
  "movementType": ["VENTA", "DEVOLUCION"],
  "valuationMethod": "FIFO"
}
```

### Ejemplo de Request
```
GET /kardex/store_123/stats?startDate=2025-01-01&category=Frutas
```

### Respuesta (Salida)
```json
{
  "totalProducts": 25,
  "lowStock": 5,
  "movements": 150,
  "totalValuesByCurrency": [
    {
      "currency": {
        "id": "pen",
        "code": "PEN",
        "symbol": "S/"
      },
      "totalValue": 50000.00
    },
    {
      "currency": {
        "id": "usd",
        "code": "USD",
        "symbol": "$"
      },
      "totalValue": 13500.00
    },
    {
      "currency": {
        "id": "eur",
        "code": "EUR",
        "symbol": "€"
      },
      "totalValue": 12000.00
    }
  ]
}
```

### Campos de Respuesta
- `totalProducts`: Número total de productos únicos
- `lowStock`: Número de variantes con stock <= 0
- `movements`: Número total de movimientos
- `totalValuesByCurrency`: Valores totales agregados por moneda

---

## 4. POST `/kardex/recalculate/:variantId`

### Descripción
Recalcula los totales del Kardex para una variante específica. Útil para corregir inconsistencias o después de migraciones.

### Parámetros de URL
- `variantId` (string, requerido): ID de la variante

### Body (Entrada)
No requiere body (vacío)

### Ejemplo de Request
```
POST /kardex/recalculate/var_xyz789
```

### Respuesta (Salida)
**Status Code:** `200 OK`

**Body:** Vacío (void)

**Nota:** Este endpoint no retorna datos, solo indica éxito con el código 200. Si hay errores, lanza una excepción:
- `404 NotFoundException`: Si no se encuentra el Kardex o la variante
- `400 BadRequestException`: Si hay errores en el proceso

### Notas
- Recalcula `totalEntries`, `totalExits`, `initialStock`, `finalStock`
- Recalcula `KardexValue` para todas las monedas (stock actual × precio actual)
- No modifica movimientos históricos

---

## 5. POST `/kardex/recalculate-all/:storeId`

### Descripción
Recalcula los totales de todos los Kardex de una tienda. Útil para corregir inconsistencias masivas o después de migraciones.

### Parámetros de URL
- `storeId` (string, requerido): ID de la tienda

### Body (Entrada)
No requiere body (vacío)

### Ejemplo de Request
```
POST /kardex/recalculate-all/store_123
```

### Respuesta (Salida)
```json
{
  "processed": 150,
  "errors": 0
}
```

### Campos de Respuesta
- `processed`: Número de Kardex procesados exitosamente
- `errors`: Número de Kardex que tuvieron errores
- `message`: Mensaje descriptivo del resultado

### Notas
- Procesa todos los Kardex de la tienda
- Puede tardar varios minutos si hay muchos productos
- Los errores no detienen el proceso (continúa con los siguientes)

---

## 6. POST `/kardex/reset-all/:storeId`

### Descripción
**⚠️ SOLO DISPONIBLE EN MODO DESARROLLO**

Resetea completamente todos los movimientos de Kardex para una tienda. Elimina todos los movimientos históricos, valores convertidos y resetea los totales del Kardex. Útil para limpiar datos durante el desarrollo.

**⚠️ ADVERTENCIA:** Esta operación es **IRREVERSIBLE**. Elimina permanentemente todos los datos históricos del Kardex.

### Parámetros de URL
- `storeId` (string, requerido): ID de la tienda

### Body (Entrada)
No requiere body (vacío)

### Ejemplo de Request
```
POST /kardex/reset-all/store_123
```

### Respuesta (Salida)
```json
{
  "deletedMovements": 150,
  "deletedMovementValues": 450,
  "deletedKardexValues": 75,
  "resetKardexes": 25
}
```

### Campos de Respuesta
- `deletedMovements`: Número de movimientos (`KardexMovement`) eliminados
- `deletedMovementValues`: Número de valores históricos (`KardexMovementValue`) eliminados
- `deletedKardexValues`: Número de valores actuales (`KardexValue`) eliminados
- `resetKardexes`: Número de Kardex reseteados

### ¿Qué Elimina?
1. **KardexMovementValue**: Todos los valores históricos de movimientos (conversiones multi-moneda)
2. **KardexMovement**: Todos los movimientos históricos (VENTA, DEVOLUCION, AJUSTE)
3. **KardexValue**: Todos los valores actuales del inventario en múltiples monedas

### ¿Qué Resetea?
1. **Kardex**: Todos los totales se resetean:
   - `initialStock` = `stock actual` de la variante
   - `finalStock` = `stock actual` de la variante
   - `totalEntries` = 0
   - `totalExits` = 0

### Errores

#### 403 Forbidden (si no está en desarrollo)
```json
{
  "statusCode": 403,
  "message": "Este endpoint solo está disponible en modo desarrollo",
  "error": "Forbidden"
}
```

### Notas
- ⚠️ **SOLO funciona en modo desarrollo** (`NODE_ENV=development`)
- ⚠️ **Operación IRREVERSIBLE**: Los datos eliminados NO se pueden recuperar
- ⚠️ **No elimina el Kardex**: Solo elimina movimientos y valores, pero mantiene el Kardex con totales reseteados
- ⚠️ **No modifica el stock**: El stock de las variantes (`ProductVariant.inventoryQuantity`) NO se modifica
- ⚠️ **Útil para desarrollo**: Para limpiar datos de prueba y empezar desde cero

### Ejemplo de Uso

**Antes del reset:**
```
Kardex #1:
  - Movimientos: 10 VENTA, 5 DEVOLUCION, 2 AJUSTE
  - KardexValue: 900 PEN, 270 USD
  - totalEntries: 7
  - totalExits: 10
```

**Después del reset:**
```
Kardex #1:
  - Movimientos: 0 (todos eliminados)
  - KardexValue: 0 (todos eliminados)
  - initialStock: 90 (stock actual)
  - finalStock: 90 (stock actual)
  - totalEntries: 0
  - totalExits: 0
```

---

## 7. POST `/kardex/correct/:kardexId`

### Descripción
Corrige los valores de un Kardex específico. Permite recalcular valores en múltiples monedas, actualizar `minStock` desde `Product.restockThreshold`, sincronizar campos básicos, recalculcar totales y resetear `initialStock`.

Este endpoint es útil para:
- Corregir Kardex que tienen `values` vacío (faltan KardexValue)
- Actualizar `minStock` desde el Product
- Sincronizar campos como `sku`, `productName`, `category` con la variante actual
- Recalcular `totalEntries` y `totalExits` desde los movimientos históricos
- Resetear `initialStock` al stock actual

### Parámetros de URL
- `kardexId` (string, requerido): ID del Kardex a corregir

### Query Parameters (Opcionales)
```json
{
  "recalculateValues": true,    // Default: true - Recalcular KardexValue (valores en múltiples monedas)
  "updateMinStock": true,        // Default: true - Actualizar minStock desde Product.restockThreshold
  "recalculateTotals": true,     // Default: true - Recalcular totalEntries y totalExits desde movimientos
  "resetInitialStock": false,    // Default: false - Resetear initialStock al stock actual
  "syncFields": true             // Default: true - Sincronizar sku, productName, category desde variant
}
```

**Nota:** Todos los parámetros son opcionales y usan valores por defecto si no se proporcionan. Puedes especificar solo los que quieras modificar.

### Ejemplo de Request

**Corregir todo (usar defaults):**
```
POST /kardex/correct/kdx_abc123
```

**Solo recalcular valores, sin actualizar minStock:**
```
POST /kardex/correct/kdx_abc123?recalculateValues=true&updateMinStock=false
```

**Solo resetear initialStock y sincronizar campos:**
```
POST /kardex/correct/kdx_abc123?resetInitialStock=true&syncFields=true&recalculateValues=false&updateMinStock=false&recalculateTotals=false
```

### Respuesta (Salida)
```json
{
  "kardexId": "kdx_abc123",
  "corrections": {
    "valuesCreated": 2,      // KardexValue creados (USD, PEN)
    "valuesUpdated": 0,      // KardexValue actualizados
    "minStockUpdated": true, // Se actualizó minStock desde Product
    "initialStockReset": false, // No se reseteó initialStock
    "totalsRecalculated": true, // Se recalcularon totales
    "fieldsSynced": true     // Se sincronizaron campos
  },
  "kardex": {
    // Kardex completo después de la corrección
    "id": "kdx_abc123",
    "variantId": "var_xyz789",
    "sku": "MANZ-ROJ-001",
    "productName": "Manzana Roja",
    "category": "Frutas",
    "unit": "UN",
    "initialStock": 100,
    "finalStock": 90,
    "totalEntries": 5,
    "totalExits": 15,
    "minStock": 10,
    "values": [
      {
        "id": "kdxv_abc123",
        "currencyId": "pen",
        "currency": {
          "id": "pen",
          "code": "PEN",
          "symbol": "S/",
          "name": "Sol Peruano"
        },
        "totalValue": 900.00
      },
      {
        "id": "kdxv_def456",
        "currencyId": "usd",
        "currency": {
          "id": "usd",
          "code": "USD",
          "symbol": "$",
          "name": "Dólar Estadounidense"
        },
        "totalValue": 243.00
      }
    ],
    // ... resto de campos
  }
}
```

### Campos de Respuesta - Corrections
- `valuesCreated`: Número de KardexValue creados (nuevos valores en monedas que no existían)
- `valuesUpdated`: Número de KardexValue actualizados (valores que ya existían)
- `minStockUpdated`: `true` si se actualizó `minStock` desde `Product.restockThreshold`
- `initialStockReset`: `true` si se reseteó `initialStock` al stock actual
- `totalsRecalculated`: `true` si se recalcularon `totalEntries` y `totalExits`
- `fieldsSynced`: `true` si se sincronizaron `sku`, `productName`, o `category`

### ¿Qué Corrige?

1. **recalculateValues (true por defecto):**
   - Crea o actualiza `KardexValue` para todas las monedas aceptadas
   - Calcula: `stock actual × precio actual` en cada moneda
   - Usa `upsert` para crear o actualizar eficientemente

2. **updateMinStock (true por defecto):**
   - Actualiza `minStock` desde `Product.restockThreshold`
   - Solo actualiza si son diferentes

3. **recalculateTotals (true por defecto):**
   - Recalcula `totalEntries` sumando todos los `entryQty` de movimientos
   - Recalcula `totalExits` sumando todos los `exitQty` de movimientos

4. **resetInitialStock (false por defecto):**
   - Resetea `initialStock` al `inventoryQuantity` actual de la variante
   - Solo si se establece explícitamente a `true`

5. **syncFields (true por defecto):**
   - Sincroniza `sku` desde `variant.sku` o `variant.id`
   - Sincroniza `productName` desde `variant.product.title`
   - Sincroniza `category` desde la primera categoría del producto

### Errores

#### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Kardex con ID kdx_abc123 no encontrado",
  "error": "Not Found"
}
```

### Notas
- **No destructivo**: No elimina datos, solo corrige/actualiza
- **Idempotente**: Puedes ejecutarlo múltiples veces sin problemas
- **Opcional**: Todos los parámetros son opcionales, puedes especificar solo lo que necesitas
- **Eficiente**: Usa operaciones batch cuando es posible

---

## 8. POST `/kardex/correct-all/:storeId`

### Descripción
Corrige todos los Kardex de una tienda. Permite aplicar correcciones masivas con las mismas opciones que `correct/:kardexId`.

Este endpoint es útil para:
- Corregir todos los Kardex de una tienda de una vez
- Migrar o actualizar datos después de cambios en el esquema
- Sincronizar todos los Kardex con los datos actuales de productos

### Parámetros de URL
- `storeId` (string, requerido): ID de la tienda

### Query Parameters (Opcionales)
```json
{
  "recalculateValues": true,    // Default: true - Recalcular KardexValue
  "updateMinStock": true,        // Default: true - Actualizar minStock
  "recalculateTotals": true,     // Default: true - Recalcular totales
  "resetInitialStock": false,    // Default: false - Resetear initialStock
  "syncFields": true             // Default: true - Sincronizar campos
}
```

**Nota:** Mismos parámetros que `correct/:kardexId`, aplicados a todos los Kardex de la tienda.

### Ejemplo de Request

**Corregir todos los Kardex (usar defaults):**
```
POST /kardex/correct-all/store_123
```

**Solo recalcular valores en todos los Kardex:**
```
POST /kardex/correct-all/store_123?recalculateValues=true&updateMinStock=false&recalculateTotals=false&syncFields=false
```

**Sincronizar todos los minStock y campos:**
```
POST /kardex/correct-all/store_123?recalculateValues=false&updateMinStock=true&recalculateTotals=false&syncFields=true
```

### Respuesta (Salida)
```json
{
  "storeId": "store_123",
  "totalKardexes": 100,
  "processed": 100,
  "corrections": {
    "valuesCreated": 150,      // Total de KardexValue creados
    "valuesUpdated": 50,       // Total de KardexValue actualizados
    "minStockUpdated": 25,     // Número de Kardex con minStock actualizado
    "initialStockReset": 0,    // Número de Kardex con initialStock reseteado
    "totalsRecalculated": 80,  // Número de Kardex con totales recalculados
    "fieldsSynced": 30         // Número de Kardex con campos sincronizados
  },
  "errors": [
    // Array de errores si alguno falló
    // {
    //   "kardexId": "kdx_error123",
    //   "error": "Variante con ID var_xyz no encontrada"
    // }
  ]
}
```

### Campos de Respuesta
- `storeId`: ID de la tienda procesada
- `totalKardexes`: Número total de Kardex en la tienda
- `processed`: Número de Kardex procesados exitosamente
- `corrections`: Contadores agregados de todas las correcciones realizadas
  - `valuesCreated`: Total de KardexValue creados en todos los Kardex
  - `valuesUpdated`: Total de KardexValue actualizados en todos los Kardex
  - `minStockUpdated`: Número de Kardex que tuvieron `minStock` actualizado
  - `initialStockReset`: Número de Kardex que tuvieron `initialStock` reseteado
  - `totalsRecalculated`: Número de Kardex que tuvieron totales recalculados
  - `fieldsSynced`: Número de Kardex que tuvieron campos sincronizados
- `errors`: Array de errores si algún Kardex falló (no detiene el proceso)

### ¿Qué Hace?

Aplica las mismas correcciones que `correct/:kardexId` a **todos** los Kardex de la tienda:
1. Itera sobre todos los Kardex
2. Aplica las correcciones según los parámetros proporcionados
3. Acumula contadores de correcciones
4. Continúa aunque algunos Kardex fallen (errores se registran en `errors`)

### Errores

Si algún Kardex falla:
- El error se registra en el array `errors`
- El proceso continúa con los siguientes Kardex
- Los contadores reflejan solo los éxitos

### Notas
- **Proceso largo**: Puede tardar varios minutos si hay muchos Kardex
- **No destructivo**: No elimina datos, solo corrige/actualiza
- **Idempotente**: Puedes ejecutarlo múltiples veces sin problemas
- **Opcional**: Todos los parámetros son opcionales
- **Tolerante a errores**: Los errores no detienen el proceso

### Ejemplo de Uso

**Antes de la corrección:**
```
Tienda tiene 100 Kardex:
  - 50 sin KardexValue (values[] vacío)
  - 30 con minStock = null
  - 20 con totales desincronizados
```

**Después de la corrección:**
```
Tienda tiene 100 Kardex:
  - Todos con KardexValue en todas las monedas
  - Todos con minStock desde Product.restockThreshold
  - Todos con totales correctos
```

---

## 📝 Tipos de Movimiento (MovementType)

```typescript
enum MovementType {
  VENTA = "VENTA",           // Venta de productos (decrementa stock)
  DEVOLUCION = "DEVOLUCION", // Devolución de productos (incrementa stock)
  AJUSTE = "AJUSTE",         // Ajuste manual de stock
  COMPRA = "COMPRA"          // Compra de productos (actualmente no usado)
}
```

### Características por Tipo

**VENTA:**
- `currencyId`: Obligatorio (moneda de la orden)
- `values[]`: Incluye valores en todas las monedas (incluyendo la original con `exchangeRate: 1.0`)
- Afecta: `totalExits`, `finalStock` (decrementa)

**DEVOLUCION:**
- `currencyId`: Obligatorio (moneda de la orden)
- `values[]`: Incluye valores en todas las monedas (incluyendo la original con `exchangeRate: 1.0`)
- Afecta: `totalEntries`, `finalStock` (incrementa)

**AJUSTE:**
- `currencyId`: `null` (no tiene moneda original en la BD)
- `values[]`: Valores calculados desde los precios de la variante en todas las monedas disponibles (calculados sobre la marcha, no guardados en BD)
- Afecta: `totalEntries` o `totalExits` según si incrementa o decrementa stock

---

## 💰 Estructura de Valores Multi-Moneda

### En Movimientos (`values[]`)
Cada movimiento con moneda original incluye valores en todas las monedas aceptadas, incluyendo la original:

```json
{
  "values": [
    {
      "currency": { "id": "pen", "code": "PEN", "symbol": "S/" },
      "unitCost": 10.00,
      "totalCost": 100.00,
      "exchangeRate": 1.0,
      "exchangeRateDate": "2025-11-23T10:30:00Z"
    },
    {
      "currency": { "id": "usd", "code": "USD", "symbol": "$" },
      "unitCost": 2.70,
      "totalCost": 27.00,
      "exchangeRate": 0.27,
      "exchangeRateDate": "2025-11-23T10:30:00Z"
    }
  ]
}
```

**Nota importante:** La moneda original se identifica por tener `exchangeRate: 1.0`. Todos los valores monetarios están dentro de `values[]`, eliminando redundancia. 

Para movimientos tipo `AJUSTE`, `values[]` se calcula automáticamente desde los precios de la variante en todas las monedas disponibles (no se guarda en BD, solo se calcula para mostrar). Para otros tipos de movimiento (VENTA, DEVOLUCION, COMPRA), `values[]` contiene los valores históricos guardados en BD con sus conversiones de moneda.

### En Resumen (`totalValuesByCurrency[]`)
Valor actual del inventario en cada moneda:

```json
{
  "totalValuesByCurrency": [
    {
      "currency": { "id": "pen", "code": "PEN", "symbol": "S/" },
      "totalValue": 900.00  // stock actual × precio actual en PEN
    },
    {
      "currency": { "id": "usd", "code": "USD", "symbol": "$" },
      "totalValue": 243.00  // stock actual × precio actual en USD
    }
  ]
}
```

---

## 🔍 Ejemplos de Uso Completos

### Ejemplo 1: Obtener Kardex de un producto específico
```
GET /kardex/store_123/general?productId=prod_abc123&page=1&limit=10
```

### Ejemplo 2: Obtener solo ventas en un rango de fechas
```
GET /kardex/store_123/general?startDate=2025-01-01&endDate=2025-12-31&movementType=VENTA
```

### Ejemplo 3: Buscar productos por nombre
```
GET /kardex/store_123/general?query=manzana&page=1&limit=20
```

### Ejemplo 4: Obtener estadísticas de una categoría
```
GET /kardex/store_123/stats?category=Frutas
```

### Ejemplo 5: Recalcular un Kardex específico
```
POST /kardex/recalculate/var_xyz789
```

---

## ⚠️ Errores Comunes

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "La consulta de búsqueda no puede exceder 200 caracteres",
  "error": "Bad Request"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Kardex no encontrado para la variante var_xyz789",
  "error": "Not Found"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

---

## 📊 Notas Importantes

1. **Paginación**: El endpoint `/general` está paginado, `/stats` no
2. **Fechas**: Usar formato ISO 8601 (`YYYY-MM-DDTHH:mm:ssZ`)
3. **Arrays**: Los filtros de array pueden enviarse como string separado por comas o como array JSON
4. **Monedas**: Los valores siempre se muestran en todas las monedas aceptadas por la tienda
5. **AJUSTE**: Los ajustes no tienen moneda original en la BD, pero `values[]` se calcula automáticamente desde los precios de la variante en todas las monedas disponibles
6. **Valores Actuales**: `totalValuesByCurrency` siempre muestra stock actual × precio actual
7. **Cálculo Sobre la Marcha**: Si no hay `KardexValue` en BD, se calculan automáticamente para mostrar (no se guardan)
8. **Actualización de BD**: Usa los endpoints `correct` o `correct-all` para actualizar la BD cuando sea necesario
9. **`totalValue` eliminado**: Ya no existe el campo `totalValue` sin moneda, solo `totalValuesByCurrency`

