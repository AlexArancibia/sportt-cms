import type { CurrencyValue, KardexVariantSummary } from '@/types/kardex'

/**
 * Obtiene el valor de moneda de un summary según la moneda seleccionada
 */
export function getCurrencyValue(
  summary: KardexVariantSummary,
  selectedCurrencyId?: string | null
): CurrencyValue | null {
  if (!summary.totalValuesByCurrency?.length) {
    return null
  }

  return selectedCurrencyId
    ? summary.totalValuesByCurrency.find(v => v.currency.id === selectedCurrencyId) || null
    : summary.totalValuesByCurrency[0] || null
}

/**
 * Obtiene el símbolo de moneda desde un array de valores de moneda
 */
export function getCurrencySymbol(
  values: CurrencyValue[],
  selectedCurrencyId?: string | null
): string {
  if (!values?.length) return '$'

  const currencyValue = selectedCurrencyId
    ? values.find(v => v.currency.id === selectedCurrencyId)
    : values[0]

  return currencyValue?.currency.symbol || '$'
}

