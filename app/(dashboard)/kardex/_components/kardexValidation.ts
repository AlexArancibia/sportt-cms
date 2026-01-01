import type { KardexVariant, KardexVariantSummary, KardexMovement } from '@/types/kardex'

/**
 * Resultado de validación de integridad del kardex
 */
export interface KardexValidationResult {
  isValid: boolean
  issues: KardexValidationIssue[]
  warnings: KardexValidationWarning[]
}

export interface KardexValidationIssue {
  type: 'error' | 'warning'
  code: string
  message: string
  severity: 'high' | 'medium' | 'low'
}

export interface KardexValidationWarning {
  type: 'sync' | 'calculation' | 'data'
  message: string
  suggestion?: string
}

/**
 * Valida la integridad de un variant del kardex
 */
export function validateKardexVariant(
  variant: KardexVariant,
  variantInventoryQuantity?: number
): KardexValidationResult {
  const issues: KardexValidationIssue[] = []
  const warnings: KardexValidationWarning[] = []

  const summary = variant.summary

  // Usar periodInitialStock si existe (cuando hay filtro de fecha), sino usar initialStock
  const effectiveInitialStock = summary.periodInitialStock ?? summary.initialStock

  // 1. Validar fórmula de stock: finalStock = initialStock + totalIn - totalOut
  const calculatedFinalStock = effectiveInitialStock + summary.totalIn - summary.totalOut
  if (calculatedFinalStock !== summary.finalStock) {
    // Calcular qué stock inicial sería correcto
    const correctInitialStock = summary.finalStock - summary.totalIn + summary.totalOut
    
    issues.push({
      type: 'error',
      code: 'STOCK_FORMULA_MISMATCH',
      message: `El stock final calculado (${calculatedFinalStock}) no coincide con el registrado (${summary.finalStock})`,
      severity: 'high',
    })

    // Si el problema es el stock inicial, agregar sugerencia específica
    if (correctInitialStock !== effectiveInitialStock && correctInitialStock >= 0) {
      warnings.push({
        type: 'sync',
        message: `El stock inicial parece incorrecto. Debería ser ${correctInitialStock} en lugar de ${effectiveInitialStock} para que la fórmula sea correcta.`,
        suggestion: summary.periodInitialStock 
          ? `El stock inicial del período está calculado. Verifique los movimientos anteriores a la fecha de inicio.`
          : `Use el endpoint de corrección con resetInitialStock=true para corregir el stock inicial a ${correctInitialStock}`,
      })
    }
  }

  // 2. Validar sincronización con inventoryQuantity (si se proporciona)
  if (variantInventoryQuantity !== undefined) {
    if (summary.finalStock !== variantInventoryQuantity) {
      warnings.push({
        type: 'sync',
        message: `El stock del kardex (${summary.finalStock}) no coincide con el inventario de la variante (${variantInventoryQuantity})`,
        suggestion: 'Considere usar el endpoint de corrección para sincronizar los datos',
      })
    }
  }

  // 3. Validar que totalIn y totalOut coincidan con los movimientos
  const calculatedTotalIn = variant.movements.reduce((sum, m) => sum + m.in, 0)
  const calculatedTotalOut = variant.movements.reduce((sum, m) => sum + m.out, 0)

  if (calculatedTotalIn !== summary.totalIn) {
    issues.push({
      type: 'error',
      code: 'TOTAL_IN_MISMATCH',
      message: `El total de entradas calculado (${calculatedTotalIn}) no coincide con el registrado (${summary.totalIn})`,
      severity: 'high',
    })
  }

  if (calculatedTotalOut !== summary.totalOut) {
    issues.push({
      type: 'error',
      code: 'TOTAL_OUT_MISMATCH',
      message: `El total de salidas calculado (${calculatedTotalOut}) no coincide con el registrado (${summary.totalOut})`,
      severity: 'high',
    })
  }

  // 4. Validar consistencia de movimientos
  variant.movements.forEach((movement, index) => {
    // Validar que el stock final del movimiento sea consistente
    if (index > 0) {
      const previousMovement = variant.movements[index - 1]
      const expectedStock = previousMovement.finalStock + movement.in - movement.out
      if (expectedStock !== movement.finalStock) {
        issues.push({
          type: 'error',
          code: 'MOVEMENT_STOCK_INCONSISTENT',
          message: `El movimiento #${index + 1} tiene stock final inconsistente. Esperado: ${expectedStock}, Actual: ${movement.finalStock}`,
          severity: 'high',
        })
      }
    }

    // Validar que VENTA/DEVOLUCION tengan valores
    if ((movement.type === 'VENTA' || movement.type === 'DEVOLUCION') && (!movement.values || movement.values.length === 0)) {
      warnings.push({
        type: 'data',
        message: `El movimiento ${movement.type} no tiene valores en múltiples monedas. Se están calculando sobre la marcha.`,
        suggestion: 'Considere usar el endpoint de corrección para guardar los valores en la base de datos',
      })
    }
  })

  // 5. Validar que existan valores de moneda
  if (!summary.totalValuesByCurrency || summary.totalValuesByCurrency.length === 0) {
    warnings.push({
      type: 'calculation',
      message: 'No hay valores de moneda almacenados. Los valores se están calculando sobre la marcha.',
      suggestion: 'Considere usar el endpoint de corrección para guardar los valores en la base de datos',
    })
  }

  // 6. Validar que avgUnitCost sea razonable (si existe)
  if (summary.avgUnitCost < 0) {
    issues.push({
      type: 'error',
      code: 'NEGATIVE_AVG_COST',
      message: `El costo promedio unitario no puede ser negativo: ${summary.avgUnitCost}`,
      severity: 'medium',
    })
  }

  // 7. Validar que los stocks no sean negativos
  if (summary.finalStock < 0) {
    issues.push({
      type: 'error',
      code: 'NEGATIVE_STOCK',
      message: `El stock final no puede ser negativo: ${summary.finalStock}`,
      severity: 'high',
    })
  }

  // Validar stock inicial negativo usando el stock efectivo
  if (effectiveInitialStock < 0) {
    issues.push({
      type: 'error',
      code: 'NEGATIVE_INITIAL_STOCK',
      message: `El stock inicial no puede ser negativo: ${effectiveInitialStock}`,
      severity: 'high',
    })
  }

  return {
    isValid: issues.length === 0,
    issues,
    warnings,
  }
}

/**
 * Valida la consistencia de un movimiento individual
 */
export function validateKardexMovement(
  movement: KardexMovement,
  previousStock: number
): KardexValidationIssue[] {
  const issues: KardexValidationIssue[] = []

  // Validar que el stock final sea consistente
  const expectedStock = previousStock + movement.in - movement.out
  if (expectedStock !== movement.finalStock) {
    issues.push({
      type: 'error',
      code: 'MOVEMENT_STOCK_MISMATCH',
      message: `Stock final inconsistente. Esperado: ${expectedStock}, Actual: ${movement.finalStock}`,
      severity: 'high',
    })
  }

  // Validar que in y out no sean negativos
  if (movement.in < 0) {
    issues.push({
      type: 'error',
      code: 'NEGATIVE_ENTRY',
      message: `La cantidad de entrada no puede ser negativa: ${movement.in}`,
      severity: 'medium',
    })
  }

  if (movement.out < 0) {
    issues.push({
      type: 'error',
      code: 'NEGATIVE_EXIT',
      message: `La cantidad de salida no puede ser negativa: ${movement.out}`,
      severity: 'medium',
    })
  }

  // Validar que VENTA/DEVOLUCION tengan unitCost y totalCost
  if ((movement.type === 'VENTA' || movement.type === 'DEVOLUCION') && movement.unitCost <= 0) {
    issues.push({
      type: 'warning',
      code: 'INVALID_UNIT_COST',
      message: `El costo unitario debe ser mayor a 0 para ${movement.type}`,
      severity: 'medium',
    })
  }

  return issues
}

/**
 * Obtiene un resumen de validación para mostrar en la UI
 */
export function getValidationSummary(result: KardexValidationResult): {
  hasErrors: boolean
  hasWarnings: boolean
  errorCount: number
  warningCount: number
  criticalIssues: KardexValidationIssue[]
} {
  const errors = result.issues.filter(i => i.type === 'error')
  const criticalIssues = errors.filter(i => i.severity === 'high')

  return {
    hasErrors: errors.length > 0,
    hasWarnings: result.warnings.length > 0,
    errorCount: errors.length,
    warningCount: result.warnings.length,
    criticalIssues,
  }
}

