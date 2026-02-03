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

/**
 * Calcula valores sobre la marcha usando el stock del kardex (finalStock) en lugar de inventoryQuantity
 * Esto asegura consistencia con los datos del kardex
 */
export function calculateValuesFromKardexStock(
  finalStock: number,
  prices: Array<{ currencyId: string; price: number; currency?: { id: string; code: string; symbol: string } }>,
  acceptedCurrencyIds?: string[]
): CurrencyValue[] {
  if (!prices || prices.length === 0 || finalStock < 0) {
    return []
  }

  // Filtrar precios por monedas aceptadas si se proporcionan
  const filteredPrices = acceptedCurrencyIds
    ? prices.filter(p => acceptedCurrencyIds.includes(p.currencyId))
    : prices

  return filteredPrices.map(price => ({
    currency: price.currency || {
      id: price.currencyId,
      code: price.currencyId.toUpperCase(),
      symbol: '$',
    },
    totalValue: finalStock * price.price,
  }))
}

/**
 * Valida si los valores están calculados sobre la marcha (no están en BD)
 */
export function isCalculatedOnTheFly(summary: KardexVariantSummary): boolean {
  return !summary.totalValuesByCurrency || summary.totalValuesByCurrency.length === 0
}



