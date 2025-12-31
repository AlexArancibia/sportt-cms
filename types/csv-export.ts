/**
 * Configuración para exportación CSV
 */
export interface CSVExportConfig {
  /**
   * Formato de exportación:
   * - 'summary': Resumen (productos sin variantes, órdenes sin items)
   * - 'detailed': Detallado (variantes de productos, items de órdenes)
   */
  format: 'summary' | 'detailed'
  
  /**
   * Nombre del archivo (opcional, se genera automáticamente si no se proporciona)
   */
  filename?: string
}

/**
 * Tipo de entidad que se puede exportar
 */
export type ExportEntityType = 'products' | 'orders'

/**
 * Opciones de formato según el tipo de entidad
 */
export interface FormatOption {
  value: 'summary' | 'detailed'
  label: string
  description: string
}

/**
 * Opciones de formato para productos
 */
export const PRODUCT_FORMAT_OPTIONS: FormatOption[] = [
  {
    value: 'summary',
    label: 'Por producto',
    description: 'Una fila por producto con información general'
  },
  {
    value: 'detailed',
    label: 'Por variante',
    description: 'Una fila por cada variante con SKU, precio e inventario'
  }
]

/**
 * Opciones de formato para órdenes
 */
export const ORDER_FORMAT_OPTIONS: FormatOption[] = [
  {
    value: 'summary',
    label: 'Resumen',
    description: 'Una fila por orden con información general'
  },
  {
    value: 'detailed',
    label: 'Desglose por items',
    description: 'Una fila por cada producto de la orden'
  }
]

