import { Order } from '@/types/order'
import { translateEnum } from '@/lib/translations'

/**
 * Formatea órdenes como resumen (una fila por orden)
 */
export function formatOrdersAsSummary(orders: Order[]) {
  return orders.map(order => {
    // Extraer información del cliente
    const customerName = order.customerInfo?.name || 'Cliente invitado'
    const customerEmail = order.customerInfo?.email || ''
    const customerPhone = order.customerInfo?.phone || ''

    // Obtener código de moneda
    const currencyCode = order.currency?.code || 'USD'

    // Formatear fechas
    const createdDate = new Date(order.createdAt).toLocaleDateString('es-ES')
    const createdTime = new Date(order.createdAt).toLocaleTimeString('es-ES')

    return {
      numeroOrden: order.orderNumber,
      cliente: customerName,
      email: customerEmail,
      telefono: customerPhone,
      total: Number(order.totalPrice),
      subtotal: Number(order.subtotalPrice),
      impuestos: Number(order.totalTax),
      descuentos: Number(order.totalDiscounts),
      moneda: currencyCode,
      estadoPago: translateEnum(order.financialStatus) || 'Pendiente',
      estadoEnvio: translateEnum(order.shippingStatus) || 'Pendiente',
      estadoCumplimiento: translateEnum(order.fulfillmentStatus) || 'No Cumplido',
      metodoPago: order.paymentProvider?.name || '',
      metodoEnvio: order.shippingMethod?.name || '',
      cupones: order.coupon?.code || '',
      notasCliente: order.customerNotes || '',
      notasInternas: order.internalNotes || '',
      fecha: createdDate,
      hora: createdTime,
    }
  })
}

/**
 * Headers para exportación de órdenes como resumen
 */
export const ORDER_SUMMARY_HEADERS = [
  { key: 'numeroOrden', label: 'Número de Orden' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'email', label: 'Email' },
  { key: 'telefono', label: 'Teléfono' },
  { key: 'total', label: 'Total' },
  { key: 'subtotal', label: 'Subtotal' },
  { key: 'impuestos', label: 'Impuestos' },
  { key: 'descuentos', label: 'Descuentos' },
  { key: 'moneda', label: 'Moneda' },
  { key: 'estadoPago', label: 'Estado de Pago' },
  { key: 'estadoEnvio', label: 'Estado de Envío' },
  { key: 'estadoCumplimiento', label: 'Estado de Cumplimiento' },
  { key: 'metodoPago', label: 'Método de Pago' },
  { key: 'metodoEnvio', label: 'Método de Envío' },
  { key: 'cupones', label: 'Cupones' },
  { key: 'notasCliente', label: 'Notas del Cliente' },
  { key: 'notasInternas', label: 'Notas Internas' },
  { key: 'fecha', label: 'Fecha' },
  { key: 'hora', label: 'Hora' },
]

/**
 * Formatea órdenes como items (una fila por item de orden)
 * La primera fila de cada orden muestra toda la información general
 * Las filas subsiguientes solo muestran información del item
 */
export function formatOrdersAsItems(orders: Order[]) {
  const rows: any[] = []

  orders.forEach(order => {
    // Extraer información del cliente
    const customerName = order.customerInfo?.name || 'Cliente invitado'
    const customerEmail = order.customerInfo?.email || ''
    const customerPhone = order.customerInfo?.phone || ''

    // Obtener código de moneda
    const currencyCode = order.currency?.code || 'USD'

    // Formatear fecha de la orden
    const orderDate = new Date(order.createdAt).toLocaleDateString('es-ES')
    const orderTime = new Date(order.createdAt).toLocaleTimeString('es-ES')

    // Información general de la orden (solo para primera fila)
    const orderGeneralInfo = {
      total: Number(order.totalPrice),
      subtotal: Number(order.subtotalPrice),
      impuestos: Number(order.totalTax),
      descuentos: Number(order.totalDiscounts),
      moneda: currencyCode,
      estadoPago: translateEnum(order.financialStatus) || 'Pendiente',
      estadoEnvio: translateEnum(order.shippingStatus) || 'Pendiente',
      estadoCumplimiento: translateEnum(order.fulfillmentStatus) || 'No Cumplido',
      metodoPago: order.paymentProvider?.name || '',
      metodoEnvio: order.shippingMethod?.name || '',
      cupon: order.coupon?.code || '',
      notasCliente: order.customerNotes || '',
      telefono: customerPhone,
    }

    // Iterar sobre los items de la orden
    order.lineItems?.forEach((item, index) => {
      const itemTotal = Number(item.price) * item.quantity
      const itemDiscount = Number(item.totalDiscount || 0)

      // Primera fila: mostrar toda la información de la orden + primer item
      if (index === 0) {
        rows.push({
          numeroOrden: order.orderNumber,
          cliente: customerName,
          email: customerEmail,
          telefono: orderGeneralInfo.telefono,
          // Información general de la orden
          total: orderGeneralInfo.total,
          subtotal: orderGeneralInfo.subtotal,
          impuestos: orderGeneralInfo.impuestos,
          descuentos: orderGeneralInfo.descuentos,
          moneda: orderGeneralInfo.moneda,
          estadoPago: orderGeneralInfo.estadoPago,
          estadoEnvio: orderGeneralInfo.estadoEnvio,
          estadoCumplimiento: orderGeneralInfo.estadoCumplimiento,
          metodoPago: orderGeneralInfo.metodoPago,
          metodoEnvio: orderGeneralInfo.metodoEnvio,
          cupon: orderGeneralInfo.cupon,
          notasCliente: orderGeneralInfo.notasCliente,
          fechaOrden: orderDate,
          horaOrden: orderTime,
          // Información del primer item
          producto: item.title,
          sku: item.variant?.sku || '',
          cantidad: item.quantity,
          precioUnitario: Number(item.price),
          totalItem: itemTotal,
          descuentoItem: itemDiscount,
        })
      } else {
        // Filas subsiguientes: solo información del item
        rows.push({
          numeroOrden: '', // Vacío para agrupar visualmente
          cliente: '',
          email: '',
          telefono: '',
          // Información general vacía
          total: '',
          subtotal: '',
          impuestos: '',
          descuentos: '',
          moneda: '',
          estadoPago: '',
          estadoEnvio: '',
          estadoCumplimiento: '',
          metodoPago: '',
          metodoEnvio: '',
          cupon: '',
          notasCliente: '',
          fechaOrden: '',
          horaOrden: '',
          // Solo información del item
          producto: item.title,
          sku: item.variant?.sku || '',
          cantidad: item.quantity,
          precioUnitario: Number(item.price),
          totalItem: itemTotal,
          descuentoItem: itemDiscount,
        })
      }
    })
  })

  return rows
}

/**
 * Headers para exportación de órdenes como items
 * Primero toda la información de la orden, luego los items
 */
export const ORDER_ITEMS_HEADERS = [
  // Identificación de la orden
  { key: 'numeroOrden', label: 'Número de Orden' },
  { key: 'fechaOrden', label: 'Fecha' },
  { key: 'horaOrden', label: 'Hora' },
  
  // Información del cliente
  { key: 'cliente', label: 'Cliente' },
  { key: 'email', label: 'Email' },
  { key: 'telefono', label: 'Teléfono' },
  
  // Totales de la orden
  { key: 'total', label: 'Total Orden' },
  { key: 'subtotal', label: 'Subtotal' },
  { key: 'impuestos', label: 'Impuestos' },
  { key: 'descuentos', label: 'Descuentos' },
  { key: 'moneda', label: 'Moneda' },
  
  // Estados
  { key: 'estadoPago', label: 'Estado de Pago' },
  { key: 'estadoEnvio', label: 'Estado de Envío' },
  { key: 'estadoCumplimiento', label: 'Estado de Cumplimiento' },
  
  // Métodos
  { key: 'metodoPago', label: 'Método de Pago' },
  { key: 'metodoEnvio', label: 'Método de Envío' },
  
  // Otros
  { key: 'cupon', label: 'Cupón' },
  { key: 'notasCliente', label: 'Notas del Cliente' },
  
  // Información de items (se repite en cada fila)
  { key: 'producto', label: 'Producto' },
  { key: 'sku', label: 'SKU' },
  { key: 'cantidad', label: 'Cantidad' },
  { key: 'precioUnitario', label: 'Precio Unitario' },
  { key: 'totalItem', label: 'Total Item' },
  { key: 'descuentoItem', label: 'Descuento Item' },
]

