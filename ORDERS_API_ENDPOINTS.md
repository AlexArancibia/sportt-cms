# Orders API - Endpoints Documentation

Este documento contiene todas las rutas de los endpoints de Orders con sus formatos de input y output.

## Base URL
```
/orders
```

## Autenticación
- **AuthGuard**: Endpoints que requieren autenticación completa
- **PublicKeyGuard**: Endpoints que requieren solo la clave pública de la tienda

## Enums Disponibles

### OrderFinancialStatus
- `PENDING`: Pendiente
- `AUTHORIZED`: Autorizado
- `PARTIALLY_PAID`: Parcialmente Pagado
- `PAID`: Pagado
- `PARTIALLY_REFUNDED`: Parcialmente Reembolsado
- `REFUNDED`: Reembolsado
- `VOIDED`: Anulado

### OrderFulfillmentStatus
- `UNFULFILLED`: No Cumplido
- `PARTIALLY_FULFILLED`: Parcialmente Cumplido
- `FULFILLED`: Cumplido
- `RESTOCKED`: Reabastecido
- `PENDING_FULFILLMENT`: Pendiente de Cumplimiento
- `OPEN`: Abierto
- `IN_PROGRESS`: En Progreso
- `ON_HOLD`: En Espera
- `SCHEDULED`: Programado

### PaymentStatus
- `PENDING`: Pendiente
- `COMPLETED`: Completado
- `FAILED`: Fallido

### ShippingStatus
- `PENDING`: Pendiente
- `PROCESSING`: Procesando
- `SHIPPED`: Enviado
- `DELIVERED`: Entregado
- `RETURNED`: Devuelto

### InvoiceType
- `FACTURA`: Factura
- `BOLETA`: Boleta

---

## 1. Crear Orden

### Endpoint
```
POST /orders/:storeId
```

### Autenticación
- **PublicKeyGuard** (requerido)

### Parámetros de URL
- `storeId` (string, requerido): ID de la tienda

### Body (CreateOrderDto)
```json
{
  "temporalOrderId": "string (opcional)",
  "orderNumber": "number (requerido)",
  "customerInfo": "object (requerido)",
  "financialStatus": "OrderFinancialStatus (opcional)",
  "fulfillmentStatus": "OrderFulfillmentStatus (opcional)",
  "currencyId": "string (requerido)",
  "totalPrice": "number (requerido, > 0)",
  "subtotalPrice": "number (requerido, > 0)",
  "totalTax": "number (requerido)",
  "totalDiscounts": "number (requerido)",
  "lineItems": [
    {
      "variantId": "string (opcional)",
      "title": "string (requerido)",
      "quantity": "number (requerido, > 0)",
      "price": "number (requerido, > 0)",
      "totalDiscount": "number (opcional, default: 0)"
    }
  ],
  "shippingAddress": "object (opcional)",
  "billingAddress": "object (opcional)",
  "couponId": "string (opcional)",
  "paymentProviderId": "string (opcional)",
  "paymentStatus": "PaymentStatus (opcional)",
  "paymentDetails": "object (opcional)",
  "shippingMethodId": "string (opcional)",
  "shippingStatus": "ShippingStatus (opcional, default: PENDING)",
  "trackingNumber": "string (opcional)",
  "trackingUrl": "string (opcional, debe ser URL válida)",
  "estimatedDeliveryDate": "Date (opcional)",
  "shippedAt": "Date (opcional)",
  "deliveredAt": "Date (opcional)",
  "customerNotes": "string (opcional)",
  "internalNotes": "string (opcional)",
  "source": "string (opcional)",
  "preferredDeliveryDate": "Date (opcional)",
  "businessName": "string (opcional)",
  "invoiceType": "InvoiceType (opcional)",
  "ruc": "string (opcional)"
}
```

### Respuesta Exitosa (201)
```json
{
  "id": "string",
  "temporalOrderId": "string",
  "orderNumber": "number",
  "customerInfo": "object",
  "financialStatus": "OrderFinancialStatus",
  "fulfillmentStatus": "OrderFulfillmentStatus",
  "currencyId": "string",
  "totalPrice": "number",
  "subtotalPrice": "number",
  "totalTax": "number",
  "totalDiscounts": "number",
  "storeId": "string",
  "couponId": "string",
  "paymentProviderId": "string",
  "paymentStatus": "PaymentStatus",
  "paymentDetails": "object",
  "shippingMethodId": "string",
  "shippingStatus": "ShippingStatus",
  "trackingNumber": "string",
  "trackingUrl": "string",
  "estimatedDeliveryDate": "Date",
  "shippedAt": "Date",
  "deliveredAt": "Date",
  "customerNotes": "string",
  "internalNotes": "string",
  "source": "string",
  "preferredDeliveryDate": "Date",
  "businessName": "string",
  "invoiceType": "InvoiceType",
  "ruc": "string",
  "createdAt": "ISO 8601 date",
  "updatedAt": "ISO 8601 date",
  "store": {
    "id": "string",
    "name": "string",
    "slug": "string"
  },
  "currency": "object",
  "coupon": "object",
  "paymentProvider": "object",
  "shippingMethod": "object",
  "lineItems": [
    {
      "id": "string",
      "title": "string",
      "quantity": "number",
      "price": "number",
      "totalDiscount": "number",
      "variant": {
        "id": "string",
        "product": {
          "id": "string",
          "title": "string",
          "slug": "string"
        }
      }
    }
  ]
}
```

### Estructura del Body
| Campo | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| `temporalOrderId` | string | No | Identificador temporal para sincronizaciones externas |
| `orderNumber` | number | Sí | Debe ser único por tienda |
| `customerInfo` | object | Sí | Información completa del cliente |
| `financialStatus` | OrderFinancialStatus | No | Estado financiero inicial |
| `fulfillmentStatus` | OrderFulfillmentStatus | No | Estado de cumplimiento inicial |
| `currencyId` | string | Sí | Debe existir en catálogo de monedas |
| `totalPrice` | number | Sí | Mayor a 0 |
| `subtotalPrice` | number | Sí | Mayor a 0 |
| `totalTax` | number | Sí | Puede ser 0 si no aplica |
| `totalDiscounts` | number | Sí | Puede ser 0 si no aplica |
| `lineItems` | array\<LineItem\> | Sí | Necesita al menos un item |
| `shippingAddress` | object | No | Dirección de envío del cliente |
| `billingAddress` | object | No | Dirección de facturación del cliente |
| `couponId` | string | No | Incrementa contador de uso si se envía |
| `paymentProviderId` | string | No | Proveedor de pago utilizado |
| `paymentStatus` | PaymentStatus | No | Estado de pago inicial |
| `paymentDetails` | object | No | Información adicional del pago |
| `shippingMethodId` | string | No | Método de envío seleccionado |
| `shippingStatus` | ShippingStatus | No | Por defecto `PENDING` |
| `trackingNumber` | string | No | Código de seguimiento |
| `trackingUrl` | string | No | Debe ser una URL válida |
| `estimatedDeliveryDate` | Date | No | Fecha estimada de entrega |
| `shippedAt` | Date | No | Fecha de envío |
| `deliveredAt` | Date | No | Fecha de entrega |
| `customerNotes` | string | No | Notas visibles para el cliente |
| `internalNotes` | string | No | Notas internas del equipo |
| `source` | string | No | Origen del pedido (ej. `POS`, `WEB`) |
| `preferredDeliveryDate` | Date | No | Fecha preferida por el cliente |
| `businessName` | string | No | Nombre para facturación |
| `invoiceType` | InvoiceType | No | `FACTURA` o `BOLETA` |
| `ruc` | string | No | Número de identificación tributaria |

#### LineItem
| Campo | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| `variantId` | string | No | Variante del producto asociada |
| `title` | string | Sí | Nombre del item |
| `quantity` | number | Sí | Mayor a 0 |
| `price` | number | Sí | Mayor a 0 |
| `totalDiscount` | number | No | Descuento aplicado al item |

---

## 2. Obtener Todas las Órdenes de una Tienda

### Endpoint
```
GET /orders/:storeId
```

### Autenticación
- Sin autenticación específica

### Parámetros de URL
- `storeId` (string, requerido): ID de la tienda

### Query Parameters (SearchOrderDto)
```
?financialStatus=OrderFinancialStatus (opcional)
&fulfillmentStatus=OrderFulfillmentStatus (opcional)
&paymentStatus=PaymentStatus (opcional)
&shippingStatus=ShippingStatus (opcional)
&startDate=ISO 8601 date (opcional)
&endDate=ISO 8601 date (opcional)
&page=number (opcional, default: 1, min: 1)
&limit=number (opcional, default: 20, min: 1, max: 100)
&sortBy=string (opcional, default: 'createdAt')
&sortOrder=string (opcional, 'asc' | 'desc', default: 'desc')
```

### Respuesta Exitosa (200)
```json
{
  "data": [
    {
      "id": "string",
      "temporalOrderId": "string",
      "orderNumber": "number",
      "customerInfo": "object",
      "financialStatus": "OrderFinancialStatus",
      "fulfillmentStatus": "OrderFulfillmentStatus",
      "currencyId": "string",
      "totalPrice": "number",
      "subtotalPrice": "number",
      "totalTax": "number",
      "totalDiscounts": "number",
      "storeId": "string",
      "couponId": "string",
      "paymentProviderId": "string",
      "paymentStatus": "PaymentStatus",
      "paymentDetails": "object",
      "shippingMethodId": "string",
      "shippingStatus": "ShippingStatus",
      "trackingNumber": "string",
      "trackingUrl": "string",
      "estimatedDeliveryDate": "Date",
      "shippedAt": "Date",
      "deliveredAt": "Date",
      "customerNotes": "string",
      "internalNotes": "string",
      "source": "string",
      "preferredDeliveryDate": "Date",
      "createdAt": "ISO 8601 date",
      "updatedAt": "ISO 8601 date",
      "store": {
        "id": "string",
        "name": "string",
        "slug": "string"
      },
      "currency": "object",
      "coupon": "object",
      "paymentProvider": "object",
      "shippingMethod": "object",
      "lineItems": [
        {
          "id": "string",
          "title": "string",
          "quantity": "number",
          "price": "number",
          "totalDiscount": "number",
          "variant": {
            "id": "string",
            "product": {
              "id": "string",
              "title": "string",
              "slug": "string"
            }
          }
        }
      ]
    }
  ],
  "meta": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "totalPages": "number",
    "hasNextPage": "boolean",
    "hasPrevPage": "boolean"
  }
}
```

---

## 3. Obtener Estadísticas de Órdenes

### Endpoint
```
GET /orders/:storeId/statistics
```

### Autenticación
- **PublicKeyGuard** (requerido)

### Parámetros de URL
- `storeId` (string, requerido): ID de la tienda

### Query Parameters
```
?startDate=ISO 8601 date (opcional)
&endDate=ISO 8601 date (opcional)
```

### Respuesta Exitosa (200)
```json
{
  "totalOrders": "number",
  "pendingOrders": "number",
  "paidOrders": "number",
  "fulfilledOrders": "number",
  "cancelledOrders": "number",
  "refundedOrders": "number",
  "totalRevenue": "number",
  "averageOrderValue": "number",
  "recentOrders": [
    {
      "id": "string",
      "orderNumber": "number",
      "totalPrice": "number",
      "financialStatus": "OrderFinancialStatus",
      "fulfillmentStatus": "OrderFulfillmentStatus",
      "createdAt": "ISO 8601 date",
      "currency": "object",
      "lineItems": [
        {
          "id": "string",
          "title": "string",
          "quantity": "number",
          "price": "number",
          "variant": {
            "id": "string",
            "product": {
              "id": "string",
              "title": "string",
              "slug": "string"
            }
          }
        }
      ]
    }
  ]
}
```

---

## 4. Buscar Orden por Número

### Endpoint
```
GET /orders/:storeId/number/:orderNumber
```

### Autenticación
- **PublicKeyGuard** (requerido)

### Parámetros de URL
- `storeId` (string, requerido): ID de la tienda
- `orderNumber` (number, requerido): Número de la orden

### Respuesta Exitosa (200)
```json
{
  "id": "string",
  "temporalOrderId": "string",
  "orderNumber": "number",
  "customerInfo": "object",
  "financialStatus": "OrderFinancialStatus",
  "fulfillmentStatus": "OrderFulfillmentStatus",
  "currencyId": "string",
  "totalPrice": "number",
  "subtotalPrice": "number",
  "totalTax": "number",
  "totalDiscounts": "number",
  "storeId": "string",
  "couponId": "string",
  "paymentProviderId": "string",
  "paymentStatus": "PaymentStatus",
  "paymentDetails": "object",
  "shippingMethodId": "string",
  "shippingStatus": "ShippingStatus",
  "trackingNumber": "string",
  "trackingUrl": "string",
  "estimatedDeliveryDate": "Date",
  "shippedAt": "Date",
  "deliveredAt": "Date",
  "customerNotes": "string",
  "internalNotes": "string",
  "source": "string",
  "preferredDeliveryDate": "Date",
  "businessName": "string",
  "invoiceType": "InvoiceType",
  "ruc": "string",
  "createdAt": "ISO 8601 date",
  "updatedAt": "ISO 8601 date",
  "store": {
    "id": "string",
    "name": "string",
    "slug": "string"
  },
  "currency": "object",
  "coupon": "object",
  "paymentProvider": "object",
  "shippingMethod": "object",
  "lineItems": [
    {
      "id": "string",
      "title": "string",
      "quantity": "number",
      "price": "number",
      "totalDiscount": "number",
      "variant": {
        "id": "string",
        "product": {
          "id": "string",
          "title": "string",
          "slug": "string"
        }
      }
    }
  ]
}
```

---

## 5. Obtener Orden Específica

### Endpoint
```
GET /orders/:storeId/:id
```

### Autenticación
- **PublicKeyGuard** (requerido)

### Parámetros de URL
- `storeId` (string, requerido): ID de la tienda
- `id` (string, requerido): ID de la orden

### Respuesta Exitosa (200)
```json
{
  "id": "string",
  "temporalOrderId": "string",
  "orderNumber": "number",
  "customerInfo": "object",
  "financialStatus": "OrderFinancialStatus",
  "fulfillmentStatus": "OrderFulfillmentStatus",
  "currencyId": "string",
  "totalPrice": "number",
  "subtotalPrice": "number",
  "totalTax": "number",
  "totalDiscounts": "number",
  "storeId": "string",
  "couponId": "string",
  "paymentProviderId": "string",
  "paymentStatus": "PaymentStatus",
  "paymentDetails": "object",
  "shippingMethodId": "string",
  "shippingStatus": "ShippingStatus",
  "trackingNumber": "string",
  "trackingUrl": "string",
  "estimatedDeliveryDate": "Date",
  "shippedAt": "Date",
  "deliveredAt": "Date",
  "customerNotes": "string",
  "internalNotes": "string",
  "source": "string",
  "preferredDeliveryDate": "Date",
  "businessName": "string",
  "invoiceType": "InvoiceType",
  "ruc": "string",
  "createdAt": "ISO 8601 date",
  "updatedAt": "ISO 8601 date",
  "store": {
    "id": "string",
    "name": "string",
    "slug": "string"
  },
  "currency": "object",
  "coupon": "object",
  "paymentProvider": "object",
  "shippingMethod": "object",
  "lineItems": [
    {
      "id": "string",
      "title": "string",
      "quantity": "number",
      "price": "number",
      "totalDiscount": "number",
      "variant": {
        "id": "string",
        "product": {
          "id": "string",
          "title": "string",
          "slug": "string"
        }
      }
    }
  ]
}
```

---

## 6. Buscar Orden por ID Temporal

### Endpoint
```
GET /orders/:storeId/temporal/:temporalOrderId
```

### Autenticación
- **PublicKeyGuard** (requerido)

### Parámetros de URL
- `storeId` (string, requerido): ID de la tienda
- `temporalOrderId` (string, requerido): ID temporal de la orden

### Respuesta Exitosa (200)
```json
{
  "id": "string",
  "temporalOrderId": "string",
  "orderNumber": "number",
  "customerInfo": "object",
  "financialStatus": "OrderFinancialStatus",
  "fulfillmentStatus": "OrderFulfillmentStatus",
  "currencyId": "string",
  "totalPrice": "number",
  "subtotalPrice": "number",
  "totalTax": "number",
  "totalDiscounts": "number",
  "storeId": "string",
  "couponId": "string",
  "paymentProviderId": "string",
  "paymentStatus": "PaymentStatus",
  "paymentDetails": "object",
  "shippingMethodId": "string",
  "shippingStatus": "ShippingStatus",
  "trackingNumber": "string",
  "trackingUrl": "string",
  "estimatedDeliveryDate": "Date",
  "shippedAt": "Date",
  "deliveredAt": "Date",
  "customerNotes": "string",
  "internalNotes": "string",
  "source": "string",
  "preferredDeliveryDate": "Date",
  "businessName": "string",
  "invoiceType": "InvoiceType",
  "ruc": "string",
  "createdAt": "ISO 8601 date",
  "updatedAt": "ISO 8601 date",
  "store": {
    "id": "string",
    "name": "string",
    "slug": "string"
  },
  "currency": "object",
  "coupon": "object",
  "paymentProvider": "object",
  "shippingMethod": "object",
  "lineItems": [
    {
      "id": "string",
      "title": "string",
      "quantity": "number",
      "price": "number",
      "totalDiscount": "number",
      "variant": {
        "id": "string",
        "product": {
          "id": "string",
          "title": "string",
          "slug": "string"
        }
      }
    }
  ]
}
```

---

## 7. Actualizar Orden

### Endpoint
```
PUT /orders/:storeId/:id
```

### Autenticación
- **PublicKeyGuard** (requerido)

### Parámetros de URL
- `storeId` (string, requerido): ID de la tienda
- `id` (string, requerido): ID de la orden

### Body (UpdateOrderDto - todos los campos opcionales)
```json
{
  "temporalOrderId": "string (opcional)",
  "orderNumber": "number (opcional)",
  "customerInfo": "object (opcional)",
  "financialStatus": "OrderFinancialStatus (opcional)",
  "fulfillmentStatus": "OrderFulfillmentStatus (opcional)",
  "currencyId": "string (opcional)",
  "totalPrice": "number (opcional, > 0)",
  "subtotalPrice": "number (opcional, > 0)",
  "totalTax": "number (opcional)",
  "totalDiscounts": "number (opcional)",
  "lineItems": [
    {
      "id": "string (opcional, para actualizar item existente)",
      "variantId": "string (opcional)",
      "title": "string (opcional)",
      "quantity": "number (opcional, > 0)",
      "price": "number (opcional, > 0)",
      "totalDiscount": "number (opcional)"
    }
  ],
  "addLineItems": [
    {
      "variantId": "string (opcional)",
      "title": "string (requerido)",
      "quantity": "number (requerido, > 0)",
      "price": "number (requerido, > 0)",
      "totalDiscount": "number (opcional)"
    }
  ],
  "removeLineItemIds": ["string (array de IDs a eliminar)"],
  "shippingAddress": "object (opcional)",
  "billingAddress": "object (opcional)",
  "couponId": "string (opcional)",
  "paymentProviderId": "string (opcional)",
  "paymentStatus": "PaymentStatus (opcional)",
  "paymentDetails": "object (opcional)",
  "shippingMethodId": "string (opcional)",
  "shippingStatus": "ShippingStatus (opcional)",
  "trackingNumber": "string (opcional)",
  "trackingUrl": "string (opcional, debe ser URL válida)",
  "estimatedDeliveryDate": "Date (opcional)",
  "shippedAt": "Date (opcional)",
  "deliveredAt": "Date (opcional)",
  "customerNotes": "string (opcional)",
  "internalNotes": "string (opcional)",
  "source": "string (opcional)",
  "preferredDeliveryDate": "Date (opcional)",
  "businessName": "string (opcional)",
  "invoiceType": "InvoiceType (opcional)",
  "ruc": "string (opcional)"
}
```

### Respuesta Exitosa (200)
```json
{
  "id": "string",
  "temporalOrderId": "string",
  "orderNumber": "number",
  "customerInfo": "object",
  "financialStatus": "OrderFinancialStatus",
  "fulfillmentStatus": "OrderFulfillmentStatus",
  "currencyId": "string",
  "totalPrice": "number",
  "subtotalPrice": "number",
  "totalTax": "number",
  "totalDiscounts": "number",
  "storeId": "string",
  "couponId": "string",
  "paymentProviderId": "string",
  "paymentStatus": "PaymentStatus",
  "paymentDetails": "object",
  "shippingMethodId": "string",
  "shippingStatus": "ShippingStatus",
  "trackingNumber": "string",
  "trackingUrl": "string",
  "estimatedDeliveryDate": "Date",
  "shippedAt": "Date",
  "deliveredAt": "Date",
  "customerNotes": "string",
  "internalNotes": "string",
  "source": "string",
  "preferredDeliveryDate": "Date",
  "businessName": "string",
  "invoiceType": "InvoiceType",
  "ruc": "string",
  "createdAt": "ISO 8601 date",
  "updatedAt": "ISO 8601 date",
  "store": {
    "id": "string",
    "name": "string",
    "slug": "string"
  },
  "currency": "object",
  "coupon": "object",
  "paymentProvider": "object",
  "shippingMethod": "object",
  "lineItems": [
    {
      "id": "string",
      "title": "string",
      "quantity": "number",
      "price": "number",
      "totalDiscount": "number",
      "variant": {
        "id": "string",
        "product": {
          "id": "string",
          "title": "string",
          "slug": "string"
        }
      }
    }
  ]
}
```

### Estructura del Body
| Campo | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| `temporalOrderId` | string | No | Actualiza el ID temporal |
| `orderNumber` | number | No | Mantiene la unicidad por tienda |
| `customerInfo` | object | No | Información del cliente |
| `financialStatus` | OrderFinancialStatus | No | Actualiza estado financiero |
| `fulfillmentStatus` | OrderFulfillmentStatus | No | Actualiza estado de cumplimiento |
| `currencyId` | string | No | Debe referenciar una moneda existente |
| `totalPrice` | number | No | Mayor a 0 |
| `subtotalPrice` | number | No | Mayor a 0 |
| `totalTax` | number | No | Impuestos totales |
| `totalDiscounts` | number | No | Descuentos totales |
| `lineItems` | array\<LineItemUpdate\> | No | Actualiza items existentes |
| `addLineItems` | array\<LineItem\> | No | Agrega nuevos items |
| `removeLineItemIds` | array\<string\> | No | IDs de items a eliminar |
| `shippingAddress` | object | No | Dirección de envío |
| `billingAddress` | object | No | Dirección de facturación |
| `couponId` | string | No | Aplica otro cupón |
| `paymentProviderId` | string | No | Cambia el proveedor |
| `paymentStatus` | PaymentStatus | No | Actualiza estado del pago |
| `paymentDetails` | object | No | Información adicional del pago |
| `shippingMethodId` | string | No | Método de envío |
| `shippingStatus` | ShippingStatus | No | Estado logístico |
| `trackingNumber` | string | No | Código de seguimiento |
| `trackingUrl` | string | No | Debe ser una URL válida |
| `estimatedDeliveryDate` | Date | No | Fecha estimada de entrega |
| `shippedAt` | Date | No | Fecha de envío |
| `deliveredAt` | Date | No | Fecha de entrega |
| `customerNotes` | string | No | Notas visibles para el cliente |
| `internalNotes` | string | No | Notas internas |
| `source` | string | No | Origen del pedido |
| `preferredDeliveryDate` | Date | No | Fecha preferida |
| `businessName` | string | No | Nombre comercial |
| `invoiceType` | InvoiceType | No | Tipo de comprobante |
| `ruc` | string | No | Número tributario |

#### LineItemUpdate
| Campo | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| `id` | string | No | Necesario para actualizar un item existente |
| `variantId` | string | No | Variante asociada |
| `title` | string | No | Título del item |
| `quantity` | number | No | Mayor a 0 |
| `price` | number | No | Mayor a 0 |
| `totalDiscount` | number | No | Descuento aplicado |

#### LineItem
| Campo | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| `variantId` | string | No | Variante del producto |
| `title` | string | Sí | Requerido al agregar nuevos items |
| `quantity` | number | Sí | Mayor a 0 |
| `price` | number | Sí | Mayor a 0 |
| `totalDiscount` | number | No | Descuento aplicado |

---

## 8. Actualizar Estado de Orden

### Endpoint
```
PATCH /orders/:storeId/:id/status
```

### Autenticación
- **AuthGuard** (requerido)

### Parámetros de URL
- `storeId` (string, requerido): ID de la tienda
- `id` (string, requerido): ID de la orden

### Body
```json
{
  "financialStatus": "OrderFinancialStatus (opcional)",
  "fulfillmentStatus": "OrderFulfillmentStatus (opcional)",
  "paymentStatus": "PaymentStatus (opcional)",
  "shippingStatus": "ShippingStatus (opcional)"
}
```

### Respuesta Exitosa (200)
```json
{
  "id": "string",
  "temporalOrderId": "string",
  "orderNumber": "number",
  "customerInfo": "object",
  "financialStatus": "OrderFinancialStatus",
  "fulfillmentStatus": "OrderFulfillmentStatus",
  "currencyId": "string",
  "totalPrice": "number",
  "subtotalPrice": "number",
  "totalTax": "number",
  "totalDiscounts": "number",
  "storeId": "string",
  "couponId": "string",
  "paymentProviderId": "string",
  "paymentStatus": "PaymentStatus",
  "paymentDetails": "object",
  "shippingMethodId": "string",
  "shippingStatus": "ShippingStatus",
  "trackingNumber": "string",
  "trackingUrl": "string",
  "estimatedDeliveryDate": "Date",
  "shippedAt": "Date",
  "deliveredAt": "Date",
  "customerNotes": "string",
  "internalNotes": "string",
  "source": "string",
  "preferredDeliveryDate": "Date",
  "businessName": "string",
  "invoiceType": "InvoiceType",
  "ruc": "string",
  "createdAt": "ISO 8601 date",
  "updatedAt": "ISO 8601 date",
  "store": {
    "id": "string",
    "name": "string",
    "slug": "string"
  },
  "currency": "object",
  "coupon": "object",
  "paymentProvider": "object",
  "shippingMethod": "object",
  "lineItems": [
    {
      "id": "string",
      "title": "string",
      "quantity": "number",
      "price": "number",
      "totalDiscount": "number",
      "variant": {
        "id": "string",
        "product": {
          "id": "string",
          "title": "string",
          "slug": "string"
        }
      }
    }
  ]
}
```

### Estructura del Body
| Campo | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| `financialStatus` | OrderFinancialStatus | No | Actualiza estado financiero |
| `fulfillmentStatus` | OrderFulfillmentStatus | No | Actualiza estado de cumplimiento |
| `paymentStatus` | PaymentStatus | No | Actualiza estado del pago |
| `shippingStatus` | ShippingStatus | No | Actualiza estado logístico |

---

## 9. Eliminar Orden

### Endpoint
```
DELETE /orders/:storeId/:id
```

### Autenticación
- **AuthGuard** (requerido)

### Parámetros de URL
- `storeId` (string, requerido): ID de la tienda
- `id` (string, requerido): ID de la orden

### Respuesta Exitosa (200)
```json
{
  "id": "string",
  "temporalOrderId": "string",
  "orderNumber": "number",
  "customerInfo": "object",
  "financialStatus": "OrderFinancialStatus",
  "fulfillmentStatus": "OrderFulfillmentStatus",
  "currencyId": "string",
  "totalPrice": "number",
  "subtotalPrice": "number",
  "totalTax": "number",
  "totalDiscounts": "number",
  "storeId": "string",
  "couponId": "string",
  "paymentProviderId": "string",
  "paymentStatus": "PaymentStatus",
  "paymentDetails": "object",
  "shippingMethodId": "string",
  "shippingStatus": "ShippingStatus",
  "trackingNumber": "string",
  "trackingUrl": "string",
  "estimatedDeliveryDate": "Date",
  "shippedAt": "Date",
  "deliveredAt": "Date",
  "customerNotes": "string",
  "internalNotes": "string",
  "source": "string",
  "preferredDeliveryDate": "Date",
  "businessName": "string",
  "invoiceType": "InvoiceType",
  "ruc": "string",
  "createdAt": "ISO 8601 date",
  "updatedAt": "ISO 8601 date"
}
```

---

## Códigos de Error Comunes

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "string (descripción del error)",
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Order with ID 'xxx' not found in store 'yyy'",
  "error": "Not Found"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "Order number 'xxx' already exists for this store",
  "error": "Conflict"
}
```

---

## Validaciones Especiales

1. **Número de orden único por tienda**: Cada orden debe tener un número único dentro de la misma tienda
2. **Relaciones válidas**: Currency, coupon, payment provider y shipping method deben existir
3. **Line items requeridos**: Al menos un item es requerido al crear una orden
4. **Cálculo automático de totales**: Los totales se recalculan automáticamente al modificar line items
5. **Restricciones de eliminación**: No se puede eliminar una orden que tenga refunds o transacciones de pago
6. **Validación de precios**: Todos los precios deben ser números positivos
7. **Cupones**: El uso de cupones se incrementa automáticamente al aplicarlos

---

## Notas de Implementación

- Todas las operaciones están validadas a nivel de tienda para seguridad
- Los line items se pueden agregar, actualizar o eliminar dinámicamente
- Los totales se recalculan automáticamente cuando se modifican los items
- Los cupones incrementan su contador de uso automáticamente
- Las fechas deben estar en formato ISO 8601
- Los objetos JSON (customerInfo, addresses, etc.) se almacenan directamente
- Las validaciones incluyen verificación de existencia de recursos relacionados
- El sistema previene la eliminación de órdenes con transacciones o reembolsos asociados
