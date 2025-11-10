# Gestión de errores en creación y edición de órdenes

Este documento describe cómo el backend de Sportt Nest maneja los errores durante la creación (`POST /orders/:storeId`) y la edición (`PUT /orders/:storeId/:id`) de órdenes. El objetivo es facilitar el entendimiento de las validaciones, los códigos de error y los posibles mensajes para clientes internos o integradores externos.

---

## 1. Flujo general y capas de validación

- **Validación del DTO (capa HTTP)**  
  Antes de invocar el servicio, NestJS valida los cuerpos de las peticiones mediante `class-validator`. Los errores se devuelven automáticamente como `400 Bad Request` con el detalle de las propiedades inválidas.
- **Validaciones de negocio en el servicio**  
  `OrderService` aplica verificaciones adicionales dentro de transacciones Prisma para garantizar la consistencia y proveer mensajes más específicos.
- **Capa de acceso a datos (Prisma)**  
  Cualquier excepción de Prisma se intercepta en `handleOrderError` y se traduce en excepciones de NestJS (`ConflictException`, `NotFoundException`, `BadRequestException`, `InternalServerErrorException`).

---

## 2. Creación de órdenes (`OrderService.create`)

### 2.1 Validaciones de entrada

- `storeId` debe ser un string válido.
- Se verifica que `orderNumber`, `totalPrice`, `subtotalPrice`, `totalTax` y `totalDiscounts` sean numéricos y no negativos.
- `currencyId` debe ser un string no vacío.
- `customerInfo`, `shippingAddress`, `billingAddress` (si existen) deben ser objetos; el contenido de direcciones se valida campo por campo.
- `lineItems` debe:
  - Ser un arreglo no vacío.
  - Contener objetos con `title` (string no vacío), `quantity` (> 0), `price` (≥ 0) y `totalDiscount` (opcional, ≥ 0).

Los errores de esta etapa lanzan `BadRequestException` (HTTP 400).

### 2.2 Validaciones con base de datos

Dentro de una transacción Prisma se verifican:

- Existencia de la tienda (`ensureStoreExists` → `404 Not Found` si no existe).
- Existencia de `currencyId`, `couponId`, `paymentProviderId`, `shippingMethodId` (cuando se envían).
- Unicidad de `orderNumber` por tienda (`ConflictException` → HTTP 409).

### 2.3 Ajustes de inventario

Si el `financialStatus` requiere reservar inventario (`PAID` o `PARTIALLY_PAID`), se invoca `InventoryService.adjustForOrderTransition` con los `lineItems` normalizados. Posibles errores:

- `NotFoundException` si alguna variante no existe.
- `BadRequestException` si no hay inventario suficiente.

### 2.4 Actualización de cupones

Si se usó `couponId`, se incrementa `usedCount`. Cualquier error se propaga y provoca rollback de la transacción.

### 2.5 Manejo centralizado de errores

`handleOrderError('crear la orden', error)` procesa la excepción:

- Reenvía las excepciones de tipo `BadRequest`, `NotFound`, `Conflict`.
- Traduce códigos Prisma:
  - `P2002` → `409 Conflict` con mensaje “Order number already exists…”.
  - `P2025` → `404 Not Found` con mensaje genérico sobre recursos relacionados.
  - Otros códigos `P****` → `400 Bad Request`.
- Cualquier otro error → `500 Internal Server Error` con mensaje genérico.

---

## 3. Edición de órdenes (`OrderService.update`)

### 3.1 Obtención y validaciones iniciales

- Se ejecuta una transacción Prisma.
- Se carga la orden existente (`findFirst`). Si no existe → `NotFoundException`.
- Se desestructura el DTO para separar datos generales de:
  - `lineItems` (reemplazo completo),
  - `addLineItems` / `removeLineItemIds` (actualizaciones incrementales).
- Se prohíbe mezclar `lineItems` con `addLineItems`/`removeLineItemIds`. Si sucede → `BadRequestException`.
- Se validan los arreglos de líneas (mismas reglas que en creación).

### 3.2 Verificaciones de referencias

Si se cambia `currencyId`, `couponId`, `paymentProviderId` o `shippingMethodId`, se valida su existencia. El cambio de `orderNumber` verifica unicidad. Todos los fallos generan `NotFoundException` o `ConflictException`.

### 3.3 Plan de actualización de `lineItems`

`buildLineItemPlan` coordina las operaciones:

- **Reemplazo completo (`lineItems`)**  
  - Cada línea con `id` debe existir; si no → `NotFoundException`.  
  - Validación de variantes (`ensureVariantExists`) cuando se provee `variantId`.  
  - Se verifica que nuevas líneas no incluyan `id`.
  - Se detectan líneas removidas y se valida que no tengan `refunds` asociados (`BadRequestException` si existen).

- **Actualización incremental (`addLineItems` / `removeLineItemIds`)**  
  - `removeLineItemIds` debe referenciar líneas existentes; si no → `NotFoundException`.  
  - Se prohíben `id` en `addLineItems`.  
  - Variantes nuevas se validan igual que en reemplazo completo.

El plan resultante determina qué líneas crear, actualizar o eliminar.

### 3.4 Recalculo de totales

Si cambia alguna línea, se recalculan `subtotalPrice`, `totalDiscounts` y `totalPrice`. Se mantienen `totalTax` y otros importes si no se envían.

### 3.5 Ajustes de inventario

Se comparan los estados previo y posterior:

- `InventoryService.adjustForOrderTransition` recibe las líneas anteriores y finales, junto con transiciones de `financialStatus` y `shippingStatus`.
- Puede lanzar los mismos errores que en la creación (insuficiente inventario, variantes inexistentes).
- Además, `ensureOrderItemCanBeRemoved` impide eliminar líneas con reembolsos (`BadRequestException`).

### 3.6 Actualización de cupones

Si cambia `couponId`, se incrementa el contador del cupón nuevo dentro de la misma transacción.

### 3.7 Manejo centralizado de errores

Se reutiliza `handleOrderError('actualizar la orden', error)` con la misma tabla de traducciones y códigos HTTP que en la creación.

---

## 4. Estructura de respuestas y códigos HTTP

| Situación | Excepción | Código HTTP | Mensaje principal |
|-----------|-----------|-------------|-------------------|
| DTO inválido (campos requeridos, tipos) | `BadRequestException` | 400 | Mensajes generados por `class-validator`. |
| Datos inconsistentes detectados en servicio (totales negativos, line items vacíos, combinación inválida de parámetros) | `BadRequestException` | 400 | Mensajes específicos definidos en `OrderService`. |
| Recursos relacionados inexistentes (tienda, moneda, cupón, proveedor, método de envío, línea de orden, variante) | `NotFoundException` | 404 | Mensajes específicos para cada recurso. |
| Número de orden duplicado | `ConflictException` | 409 | “Order number already exists for this store.” |
| Inventario insuficiente | `BadRequestException` | 400 | “Insufficient inventory for variant …”. |
| Línea con reembolso intenta eliminarse | `BadRequestException` | 400 | “Cannot remove order item … as it has been refunded.” |
| Errores Prisma genéricos (códigos `P****`) | `BadRequestException` | 400 | Mensaje genérico sobre error de base de datos. |
| Error no manejado | `InternalServerErrorException` | 500 | Mensaje genérico invitando a contactar soporte. |

---

## 5. Recomendaciones para clientes e integradores

- Siempre validar los datos antes de enviar la petición (especialmente importes y `lineItems`) para evitar errores 400.
- Manejar `404` al intentar operar con recursos eliminados o tiendas equivocadas.
- Si se obtienen `409 Conflict`, regenerar el `orderNumber` o consultar las órdenes existentes.
- Implementar reintentos solo cuando la respuesta sea un error 5xx; los errores 4xx indican un problema en el payload.
- Loggear el cuerpo de la respuesta de error del backend; los mensajes contienen pistas concretas sobre el campo o recurso problemático.

---

## 6. Próximos pasos sugeridos

- Añadir ejemplos JSON de respuestas de error en la documentación pública si se requiere mayor claridad para terceros.
- Considerar métricas o logs centralizados utilizando `OrderService.logger` para detectar patrones de error frecuentes.


