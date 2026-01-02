# Documentación de API de Estadísticas

Esta documentación describe todos los endpoints del servicio de estadísticas (`@src/statistics`).

## Tabla de Contenidos

1. [Información General](#información-general)
2. [Parámetros Comunes](#parámetros-comunes)
3. [Endpoints](#endpoints)
   - [GET /statistics/:storeId/overview](#1-get-statisticsstoreidoverview)
   - [GET /statistics/:storeId/sales](#2-get-statisticsstoreidsales)
   - [GET /statistics/:storeId/products](#3-get-statisticsstoreidproducts)
   - [GET /statistics/:storeId/customers](#4-get-statisticsstoreidcustomers)
   - [GET /statistics/:storeId/inventory](#5-get-statisticsstoreidinventory)
   - [GET /statistics/:storeId/trends](#6-get-statisticsstoreidtrends)
   - [GET /statistics/:storeId/compare](#7-get-statisticsstoreidcompare)
   - [GET /statistics/:storeId/conversion](#8-get-statisticsstoreidconversion)
   - [GET /statistics/:storeId/profitable-products](#9-get-statisticsstoreidprofitable-products)
   - [GET /statistics/:storeId/hourly](#10-get-statisticsstoreidhourly)
   - [GET /statistics/:storeId/weekly](#11-get-statisticsstoreidweekly)

---

## Información General

### Autenticación

Todos los endpoints requieren autenticación mediante `PublicKeyGuard`. Asegúrate de incluir la clave pública en las cabeceras de la petición.

### Base URL

```
/statistics
```

### Formato de Respuesta

Todas las respuestas exitosas incluyen un campo `currency` que indica en qué moneda están expresados los valores monetarios:

```json
{
  "currency": {
    "id": "curr_795fd17e-128e",
    "code": "PEN",
    "name": "Sol Peruano",
    "symbol": "S/"
  },
  // ... resto de datos
}
```

**Nota sobre monedas:**
- Si se proporciona `currencyId`, los valores están en esa moneda
- Si NO se proporciona `currencyId`, los valores se convierten a la moneda base de la tienda usando tasas de cambio históricas

---

## Parámetros Comunes

### Parámetros de Ruta

- `storeId` (string, requerido): ID de la tienda

### Parámetros de Consulta

#### DateRangeDto (usado en la mayoría de endpoints)

- `startDate` (string, opcional): Fecha de inicio. Formatos aceptados:
  - `YYYY-MM-DD` (ej: `2024-01-01`)
  - ISO 8601 completo (ej: `2024-01-01T00:00:00.000Z`)
  - Si solo se proporciona la fecha, se normaliza a `00:00:00.000Z` UTC
- `endDate` (string, opcional): Fecha de fin. Formatos aceptados:
  - `YYYY-MM-DD` (ej: `2024-12-31`)
  - ISO 8601 completo (ej: `2024-12-31T23:59:59.999Z`)
  - Si solo se proporciona la fecha, se normaliza a `23:59:59.999Z` UTC
- `currencyId` (string, opcional): ID de moneda para filtrar órdenes. Si no se proporciona, se usan todas las monedas y los valores se convierten a la moneda base

**Validaciones:**
- `startDate` debe ser anterior o igual a `endDate`
- Las fechas deben ser válidas

---

## Endpoints

### 1. GET /statistics/:storeId/overview

**Descripción:** Obtiene un resumen ejecutivo con las métricas principales de la tienda.

**Parámetros:**
- `storeId` (path): ID de la tienda
- Query: `DateRangeDto` (startDate, endDate, currencyId)

**Respuesta:**

```json
{
  "currency": {
    "id": "curr_795fd17e-128e",
    "code": "PEN",
    "name": "Sol Peruano",
    "symbol": "S/"
  },
  "totalOrders": 150,
  "totalRevenue": 45000.50,
  "averageOrderValue": 300.00,
  "totalProducts": 500,
  "activeProducts": 450,
  "lowStockProducts": 25,
  "totalCustomers": 120,
  "completedOrders": 140,
  "fulfillmentRate": 93.33
}
```

**Campos de respuesta:**
- `currency`: Información de la moneda
- `totalOrders`: Total de órdenes en el período
- `totalRevenue`: Ingresos totales (solo órdenes pagadas)
- `averageOrderValue`: Valor promedio de orden
- `totalProducts`: Total de productos en la tienda
- `activeProducts`: Productos activos
- `lowStockProducts`: Productos con stock bajo (≤10 unidades)
- `totalCustomers`: Número de clientes únicos
- `completedOrders`: Órdenes completadas (fulfilled)
- `fulfillmentRate`: Porcentaje de cumplimiento (completedOrders/totalOrders * 100)

**Ejemplo de petición:**
```
GET /statistics/store_abc123/overview?startDate=2024-01-01&endDate=2024-12-31&currencyId=curr_usd
```

---

### 2. GET /statistics/:storeId/sales

**Descripción:** Obtiene estadísticas detalladas de ventas: por estado, método de pago, categoría y reembolsos.

**Parámetros:**
- `storeId` (path): ID de la tienda
- Query: `DateRangeDto` (startDate, endDate, currencyId)

**Respuesta:**

```json
{
  "currency": {
    "id": "curr_795fd17e-128e",
    "code": "PEN",
    "name": "Sol Peruano",
    "symbol": "S/"
  },
  "ordersByStatus": [
    {
      "status": "PAID",
      "count": 140,
      "totalAmount": 42000.00
    },
    {
      "status": "PENDING",
      "count": 10,
      "totalAmount": 3000.00
    }
  ],
  "revenueBreakdown": {
    "subtotal": 45000.00,
    "tax": 8100.00,
    "discount": 1500.00,
    "total": 51600.00
  },
  "salesByPaymentMethod": [
    {
      "paymentProviderId": "pp_stripe",
      "providerName": "Stripe",
      "orderCount": 80,
      "totalRevenue": 24000.00
    }
  ],
  "salesByCategory": [
    {
      "categoryId": "cat_electronics",
      "categoryName": "Electrónicos",
      "totalRevenue": 15000.00,
      "unitsSold": 50
    }
  ],
  "refundStats": {
    "totalRefunds": 5,
    "totalRefundAmount": 1500.00,
    "refundRate": 3.57
  }
}
```

**Campos de respuesta:**
- `currency`: Información de la moneda
- `ordersByStatus`: Array de órdenes agrupadas por estado financiero
- `revenueBreakdown`: Desglose de ingresos (subtotal, impuestos, descuentos, total)
- `salesByPaymentMethod`: Ventas agrupadas por método de pago
- `salesByCategory`: Ventas agrupadas por categoría
- `refundStats`: Estadísticas de reembolsos

**Ejemplo de petición:**
```
GET /statistics/store_abc123/sales?startDate=2024-01-01&endDate=2024-12-31
```

---

### 3. GET /statistics/:storeId/products

**Descripción:** Obtiene estadísticas de productos: por estado, más vendidos, stock bajo y valor de inventario.

**Parámetros:**
- `storeId` (path): ID de la tienda
- Query: `DateRangeDto` (startDate, endDate, currencyId)

**Respuesta:**

```json
{
  "currency": {
    "id": "curr_795fd17e-128e",
    "code": "PEN",
    "name": "Sol Peruano",
    "symbol": "S/"
  },
  "productsByStatus": [
    {
      "status": "ACTIVE",
      "count": 450
    },
    {
      "status": "DRAFT",
      "count": 50
    }
  ],
  "topSellingProducts": [
    {
      "variantId": "var_123",
      "productId": "prod_456",
      "productTitle": "Producto Ejemplo",
      "productSlug": "producto-ejemplo",
      "variantTitle": "Variante A",
      "sku": "SKU123",
      "imageUrl": "https://example.com/image.jpg",
      "quantitySold": 100,
      "revenue": 5000.00
    }
  ],
  "lowStockProducts": [
    {
      "variantId": "var_789",
      "productId": "prod_012",
      "productTitle": "Producto Stock Bajo",
      "variantTitle": "Variante B",
      "sku": "SKU789",
      "currentStock": 5,
      "status": "LOW_STOCK"
    }
  ],
  "inventoryValue": {
    "totalValue": 500000.00,
    "totalUnits": 5000,
    "averageUnitValue": 100.00
  },
  "productsByCategory": [
    {
      "categoryId": "cat_electronics",
      "categoryName": "Electrónicos",
      "productCount": 150
    }
  ]
}
```

**Campos de respuesta:**
- `currency`: Información de la moneda
- `productsByStatus`: Productos agrupados por estado (ACTIVE, DRAFT, ARCHIVED)
- `topSellingProducts`: Top 10 productos más vendidos (ordenados por cantidad)
- `lowStockProducts`: Productos con stock bajo (≤10 unidades o sin stock)
- `inventoryValue`: Valor total del inventario
- `productsByCategory`: Productos agrupados por categoría

**Ejemplo de petición:**
```
GET /statistics/store_abc123/products?startDate=2024-01-01&endDate=2024-12-31&currencyId=curr_usd
```

---

### 4. GET /statistics/:storeId/customers

**Descripción:** Obtiene estadísticas de clientes: nuevos vs recurrentes, valor promedio, retención y top clientes.

**Parámetros:**
- `storeId` (path): ID de la tienda
- Query: `DateRangeDto` (startDate, endDate, currencyId)

**Respuesta:**

```json
{
  "currency": {
    "id": "curr_795fd17e-128e",
    "code": "PEN",
    "name": "Sol Peruano",
    "symbol": "S/"
  },
  "totalCustomers": 120,
  "newCustomers": 80,
  "returningCustomers": 40,
  "averageCustomerValue": 375.00,
  "customerRetentionRate": 33.33,
  "topCustomers": [
    {
      "email": "customer@example.com",
      "orderCount": 5,
      "totalSpent": 2500.00,
      "lastOrder": "2024-12-15T10:30:00.000Z"
    }
  ]
}
```

**Campos de respuesta:**
- `currency`: Información de la moneda
- `totalCustomers`: Total de clientes únicos
- `newCustomers`: Clientes con una sola orden
- `returningCustomers`: Clientes con más de una orden
- `averageCustomerValue`: Valor promedio por cliente
- `customerRetentionRate`: Tasa de retención (returningCustomers/totalCustomers * 100)
- `topCustomers`: Top 10 clientes por valor total gastado

**Ejemplo de petición:**
```
GET /statistics/store_abc123/customers?startDate=2024-01-01&endDate=2024-12-31
```

---

### 5. GET /statistics/:storeId/inventory

**Descripción:** Obtiene estadísticas de inventario: total, en stock, sin stock, stock bajo y valor total.

**Parámetros:**
- `storeId` (path): ID de la tienda
- Query: Ninguno (este endpoint NO acepta filtros de fecha ni moneda)

**Respuesta:**

```json
{
  "totalVariants": 1000,
  "inStockVariants": 850,
  "outOfStockVariants": 100,
  "lowStockVariants": 50,
  "totalInventoryValue": 500000.00,
  "totalUnits": 10000,
  "averageUnitValue": 50.00
}
```

**Campos de respuesta:**
- `totalVariants`: Total de variantes de productos
- `inStockVariants`: Variantes con stock disponible
- `outOfStockVariants`: Variantes sin stock
- `lowStockVariants`: Variantes con stock bajo (≤10 unidades)
- `totalInventoryValue`: Valor total del inventario (en moneda base de la tienda)
- `totalUnits`: Total de unidades en inventario
- `averageUnitValue`: Valor promedio por unidad

**Ejemplo de petición:**
```
GET /statistics/store_abc123/inventory
```

**Nota:** Este endpoint no incluye el campo `currency` porque no filtra por moneda ni fecha.

---

### 6. GET /statistics/:storeId/trends

**Descripción:** Obtiene datos de tendencias para gráficas, agrupados por período (día, semana, mes o año).

**Parámetros:**
- `storeId` (path): ID de la tienda
- Query: `TrendsQueryDto`
  - `startDate` (opcional): Fecha de inicio
  - `endDate` (opcional): Fecha de fin
  - `groupBy` (opcional): Período de agrupación (`DAY`, `WEEK`, `MONTH`, `YEAR`). Por defecto: `DAY`
  - `currencyId` (opcional): ID de moneda

**Respuesta:**

```json
{
  "currency": {
    "id": "curr_795fd17e-128e",
    "code": "PEN",
    "name": "Sol Peruano",
    "symbol": "S/"
  },
  "period": "DAY",
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-01-31T23:59:59.999Z",
  "data": [
    {
      "period": "2024-01-01",
      "orderCount": 10,
      "totalRevenue": 3000.00,
      "averageOrderValue": 300.00
    },
    {
      "period": "2024-01-02",
      "orderCount": 15,
      "totalRevenue": 4500.00,
      "averageOrderValue": 300.00
    }
  ]
}
```

**Campos de respuesta:**
- `currency`: Información de la moneda
- `period`: Período de agrupación usado
- `startDate`: Fecha de inicio del rango
- `endDate`: Fecha de fin del rango
- `data`: Array de datos agrupados por período

**Ejemplo de petición:**
```
GET /statistics/store_abc123/trends?startDate=2024-01-01&endDate=2024-12-31&groupBy=MONTH&currencyId=curr_usd
```

**Valores válidos para `groupBy`:**
- `DAY`: Agrupa por día
- `WEEK`: Agrupa por semana
- `MONTH`: Agrupa por mes
- `YEAR`: Agrupa por año

---

### 7. GET /statistics/:storeId/compare

**Descripción:** Compara métricas clave entre dos períodos de tiempo y calcula el crecimiento porcentual.

**Parámetros:**
- `storeId` (path): ID de la tienda
- Query:
  - `period1Start` (requerido): Fecha de inicio del primer período
  - `period1End` (requerido): Fecha de fin del primer período
  - `period2Start` (requerido): Fecha de inicio del segundo período
  - `period2End` (requerido): Fecha de fin del segundo período
  - `currencyId` (opcional): ID de moneda

**Respuesta:**

```json
{
  "currency": {
    "id": "curr_795fd17e-128e",
    "code": "PEN",
    "name": "Sol Peruano",
    "symbol": "S/"
  },
  "period1": {
    "start": "2024-01-01T00:00:00.000Z",
    "end": "2024-03-31T23:59:59.999Z",
    "data": {
      "totalOrders": 100,
      "totalRevenue": 30000.00,
      "averageOrderValue": 300.00,
      "totalCustomers": 80,
      "totalProducts": 500,
      "activeProducts": 450,
      "lowStockProducts": 25,
      "completedOrders": 95,
      "fulfillmentRate": 95.00
    }
  },
  "period2": {
    "start": "2024-04-01T00:00:00.000Z",
    "end": "2024-06-30T23:59:59.999Z",
    "data": {
      "totalOrders": 120,
      "totalRevenue": 36000.00,
      "averageOrderValue": 300.00,
      "totalCustomers": 100,
      "totalProducts": 500,
      "activeProducts": 460,
      "lowStockProducts": 20,
      "completedOrders": 115,
      "fulfillmentRate": 95.83
    }
  },
  "comparison": {
    "totalOrders": {
      "period1": 100,
      "period2": 120,
      "growth": 20.00
    },
    "totalRevenue": {
      "period1": 30000.00,
      "period2": 36000.00,
      "growth": 20.00
    },
    "averageOrderValue": {
      "period1": 300.00,
      "period2": 300.00,
      "growth": 0.00
    },
    "totalCustomers": {
      "period1": 80,
      "period2": 100,
      "growth": 25.00
    }
  }
}
```

**Campos de respuesta:**
- `currency`: Información de la moneda
- `period1`: Datos del primer período
- `period2`: Datos del segundo período
- `comparison`: Comparación con crecimiento porcentual para cada métrica

**Ejemplo de petición:**
```
GET /statistics/store_abc123/compare?period1Start=2024-01-01&period1End=2024-03-31&period2Start=2024-04-01&period2End=2024-06-30&currencyId=curr_usd
```

---

### 8. GET /statistics/:storeId/conversion

**Descripción:** Obtiene métricas de conversión: tasas de pago, cumplimiento, cancelación, reembolso y productos.

**Parámetros:**
- `storeId` (path): ID de la tienda
- Query: `DateRangeDto` (startDate, endDate, currencyId)

**Respuesta:**

```json
{
  "currency": {
    "id": "curr_795fd17e-128e",
    "code": "PEN",
    "name": "Sol Peruano",
    "symbol": "S/"
  },
  "orderConversion": {
    "totalOrders": 150,
    "paidOrders": 140,
    "paidRate": 93.33
  },
  "fulfillmentConversion": {
    "paidOrders": 140,
    "fulfilledOrders": 135,
    "fulfillmentRate": 96.43
  },
  "cancellationRate": {
    "totalOrders": 150,
    "cancelledOrders": 5,
    "rate": 3.33
  },
  "refundRate": {
    "paidOrders": 140,
    "refundedOrders": 3,
    "rate": 2.14
  },
  "productConversion": {
    "totalProducts": 500,
    "productsWithSales": 350,
    "conversionRate": 70.00
  }
}
```

**Campos de respuesta:**
- `currency`: Información de la moneda
- `orderConversion`: Tasa de conversión a pago (paidOrders/totalOrders)
- `fulfillmentConversion`: Tasa de cumplimiento (fulfilledOrders/paidOrders)
- `cancellationRate`: Tasa de cancelación (cancelledOrders/totalOrders)
- `refundRate`: Tasa de reembolso (refundedOrders/paidOrders)
- `productConversion`: Tasa de productos con ventas (productsWithSales/totalProducts)

**Ejemplo de petición:**
```
GET /statistics/store_abc123/conversion?startDate=2024-01-01&endDate=2024-12-31
```

---

### 9. GET /statistics/:storeId/profitable-products

**Descripción:** Obtiene los productos más rentables basados en margen de ganancia.

**Parámetros:**
- `storeId` (path): ID de la tienda
- Query: `ProfitableProductsQueryDto`
  - `startDate` (opcional): Fecha de inicio
  - `endDate` (opcional): Fecha de fin
  - `limit` (opcional): Número de productos a retornar (1-100). Por defecto: 10
  - `currencyId` (opcional): ID de moneda

**Respuesta:**

```json
{
  "currency": {
    "id": "curr_795fd17e-128e",
    "code": "PEN",
    "name": "Sol Peruano",
    "symbol": "S/"
  },
  "products": [
    {
      "productId": "prod_123",
      "productTitle": "Producto Rentable",
      "totalRevenue": 10000.00,
      "totalUnitsSold": 100,
      "averagePrice": 100.00,
      "cost": 6000.00,
      "profit": 4000.00,
      "margin": 40.00
    }
  ]
}
```

**Campos de respuesta:**
- `currency`: Información de la moneda
- `products`: Array de productos ordenados por profit (margen de ganancia)
  - `productId`: ID del producto
  - `productTitle`: Título del producto
  - `totalRevenue`: Ingresos totales
  - `totalUnitsSold`: Unidades vendidas
  - `averagePrice`: Precio promedio
  - `cost`: Costo total (estimado al 60% del precio)
  - `profit`: Ganancia total
  - `margin`: Margen de ganancia (profit/totalRevenue * 100)

**Ejemplo de petición:**
```
GET /statistics/store_abc123/profitable-products?startDate=2024-01-01&endDate=2024-12-31&limit=20&currencyId=curr_usd
```

**Nota:** El cálculo de costos asume un ratio del 60% del precio de venta. Esto es una estimación y puede necesitar ajustarse según tu modelo de negocio.

---

### 10. GET /statistics/:storeId/hourly

**Descripción:** Obtiene distribución de ventas por hora del día (0-23).

**Parámetros:**
- `storeId` (path): ID de la tienda
- Query: `DateRangeDto` (startDate, endDate, currencyId)

**Respuesta:**

```json
{
  "currency": {
    "id": "curr_795fd17e-128e",
    "code": "PEN",
    "name": "Sol Peruano",
    "symbol": "S/"
  },
  "data": [
    {
      "hour": 0,
      "hourLabel": "00:00",
      "orderCount": 5,
      "revenue": 1500.00,
      "averageOrderValue": 300.00
    },
    {
      "hour": 1,
      "hourLabel": "01:00",
      "orderCount": 3,
      "revenue": 900.00,
      "averageOrderValue": 300.00
    }
    // ... todas las horas del 0 al 23
  ]
}
```

**Campos de respuesta:**
- `currency`: Información de la moneda
- `data`: Array con datos de las 24 horas (0-23)
  - `hour`: Hora del día (0-23)
  - `hourLabel`: Etiqueta de hora en formato "HH:00"
  - `orderCount`: Número de órdenes en esa hora
  - `revenue`: Ingresos en esa hora
  - `averageOrderValue`: Valor promedio de orden en esa hora

**Ejemplo de petición:**
```
GET /statistics/store_abc123/hourly?startDate=2024-01-01&endDate=2024-12-31
```

**Nota:** El array siempre incluye las 24 horas, incluso si no hay órdenes en alguna hora (en cuyo caso orderCount y revenue serán 0).

---

### 11. GET /statistics/:storeId/weekly

**Descripción:** Obtiene rendimiento por día de la semana (Domingo a Sábado).

**Parámetros:**
- `storeId` (path): ID de la tienda
- Query: `DateRangeDto` (startDate, endDate, currencyId)

**Respuesta:**

```json
{
  "currency": {
    "id": "curr_795fd17e-128e",
    "code": "PEN",
    "name": "Sol Peruano",
    "symbol": "S/"
  },
  "data": [
    {
      "day": 0,
      "dayName": "Domingo",
      "orderCount": 20,
      "revenue": 6000.00,
      "averageOrderValue": 300.00
    },
    {
      "day": 1,
      "dayName": "Lunes",
      "orderCount": 25,
      "revenue": 7500.00,
      "averageOrderValue": 300.00
    }
    // ... todos los días de la semana (0=Domingo, 6=Sábado)
  ]
}
```

**Campos de respuesta:**
- `currency`: Información de la moneda
- `data`: Array con datos de los 7 días de la semana
  - `day`: Número del día (0=Domingo, 1=Lunes, ..., 6=Sábado)
  - `dayName`: Nombre del día en español
  - `orderCount`: Número de órdenes en ese día
  - `revenue`: Ingresos en ese día
  - `averageOrderValue`: Valor promedio de orden en ese día

**Ejemplo de petición:**
```
GET /statistics/store_abc123/weekly?startDate=2024-01-01&endDate=2024-12-31&currencyId=curr_usd
```

**Nota:** El array siempre incluye los 7 días, incluso si no hay órdenes en algún día (en cuyo caso orderCount y revenue serán 0).

---

## Manejo de Monedas

### Filtrado por Moneda

Cuando se proporciona el parámetro `currencyId`:
- Solo se incluyen órdenes con esa moneda específica
- Los valores monetarios están en esa moneda
- No se realizan conversiones

### Conversión a Moneda Base

Cuando NO se proporciona `currencyId`:
- Se incluyen órdenes de todas las monedas
- Los valores se convierten a la moneda base de la tienda
- Se usan tasas de cambio históricas según la fecha de creación de cada orden
- El campo `currency` en la respuesta indica la moneda base

### Tasas de Cambio

El sistema utiliza la tabla `ExchangeRate` para obtener las tasas de cambio:
- Se busca la tasa más reciente para la fecha de la orden
- Si no existe una tasa directa, se intenta usar la tasa inversa
- Si no hay tasa disponible, se usa 1.0 (asumiendo misma moneda)

---

## Códigos de Error

### 400 Bad Request
- Fechas inválidas
- `startDate` mayor que `endDate`
- Formato de fecha incorrecto

### 404 Not Found
- Tienda no encontrada
- Moneda no encontrada (cuando se proporciona currencyId inválido)

### 500 Internal Server Error
- Error en el servidor al procesar la solicitud

---

## Ejemplos de Uso

### Ejemplo 1: Obtener resumen del último mes

```bash
curl -X GET "https://api.example.com/statistics/store_abc123/overview?startDate=2024-12-01&endDate=2024-12-31" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Ejemplo 2: Comparar ventas entre trimestres

```bash
curl -X GET "https://api.example.com/statistics/store_abc123/compare?period1Start=2024-01-01&period1End=2024-03-31&period2Start=2024-04-01&period2End=2024-06-30" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Ejemplo 3: Obtener tendencias mensuales en USD

```bash
curl -X GET "https://api.example.com/statistics/store_abc123/trends?startDate=2024-01-01&endDate=2024-12-31&groupBy=MONTH&currencyId=curr_usd" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Ejemplo 4: Productos más rentables del año

```bash
curl -X GET "https://api.example.com/statistics/store_abc123/profitable-products?startDate=2024-01-01&endDate=2024-12-31&limit=20" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

## Notas Importantes

1. **Fechas:** Todas las fechas se manejan en UTC. Si proporcionas solo la fecha (YYYY-MM-DD), se normaliza automáticamente:
   - `startDate`: Se establece a `00:00:00.000Z` UTC
   - `endDate`: Se establece a `23:59:59.999Z` UTC

2. **Rendimiento:** Los endpoints están optimizados para consultas eficientes, pero ten en cuenta:
   - Rangos de fechas muy grandes pueden ser más lentos
   - Las conversiones de moneda requieren consultas adicionales

3. **Cache:** Actualmente el cache Redis está desactivado temporalmente. Los datos se consultan directamente de la base de datos en cada petición.

4. **Inventario:** El endpoint `/inventory` no acepta filtros de fecha ni moneda porque muestra el estado actual del inventario.

5. **Monedas:** Asegúrate de que las tasas de cambio estén actualizadas en la tabla `ExchangeRate` para obtener conversiones precisas cuando no se filtra por moneda.

---

## Soporte

Para más información o reportar problemas, contacta al equipo de desarrollo.

