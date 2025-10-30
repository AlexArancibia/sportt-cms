import type { UpdateProductVariantDto } from "@/types/productVariant"
import type { CreateProductVariantDto } from "@/types/productVariant"

export const roundPrice = (price: number): number => {
  // Usar toFixed para evitar problemas de precisión de punto flotante
  // Más robusto que Math.round para manejar casos como 9.279999999999999
  const rounded = parseFloat(price.toFixed(2))
  return rounded
}

type VariantDto = UpdateProductVariantDto | CreateProductVariantDto

export function useVariantHandlers<T extends VariantDto>(
  variants: T[],
  setVariants: React.Dispatch<React.SetStateAction<T[]>>
) {
  
  const handleVariantChange = (
    indexOrId: number | string,
    field: keyof T,
    value: any
  ) => {
    setVariants((prev) => {
      if (typeof indexOrId === "number") {
        // Por índice (para crear)
        const newVariants = [...prev]
        newVariants[indexOrId] = { ...newVariants[indexOrId], [field]: value }
        return newVariants
      } else {
        // Por ID (para editar)
        return prev.map((v: any) =>
          v.id === indexOrId ? { ...v, [field]: value } : v
        )
      }
    })
  }

  const handleWeightChange = (indexOrId: number | string, inputValue: string) => {
    if (inputValue === "") {
      handleVariantChange(indexOrId, "weightValue" as keyof T, undefined)
      return
    }
    
    // Limitar a 2 decimales
    const limitedValue = inputValue.replace(/(\.\d{2})\d+/, "$1")
    const value = Number(limitedValue)
    
    if (!isNaN(value) && value >= 0) {
      handleVariantChange(indexOrId, "weightValue" as keyof T, Math.round(value * 100) / 100)
    }
  }

  const handleInventoryChange = (indexOrId: number | string, inputValue: string) => {
    const value = inputValue === "" ? "" : Number(inputValue)
    if (value === "" || (value >= 0 && Number.isInteger(value))) {
      handleVariantChange(indexOrId, "inventoryQuantity" as keyof T, value === "" ? "" : value)
    }
  }

  const handleInventoryBlur = (indexOrId: number | string, inputValue: string) => {
    if (inputValue === "" || inputValue === null) {
      handleVariantChange(indexOrId, "inventoryQuantity" as keyof T, 0)
    }
  }

  const handlePriceChange = (
    indexOrId: number | string,
    currencyId: string,
    price: number | string,
    exchangeRates: any[],
    shopSettings: any[]
  ) => {
    setVariants((prev) => {
      const updateVariant = (v: T) => {
        const prices = v.prices || []
        
        // Crear Map para acceso rápido O(1) en lugar de múltiples find() O(n)
        const priceMap = new Map(prices.map((p: any) => [p.currencyId, { ...p }]))
        
        // Helper para crear/actualizar precio preservando originalPrice
        const upsertPrice = (cid: string, newPrice: number | string) => {
          // Normalizar a número antes de redondear
          const numPrice = typeof newPrice === 'string' ? parseFloat(newPrice) : Number(newPrice)
          if (isNaN(numPrice)) {
            console.warn('[INVALID_PRICE]', { currencyId: cid, price: newPrice })
            return
          }
          const existing = priceMap.get(cid)
          const roundedPrice = roundPrice(numPrice)
          const priceStr = numPrice.toString()
          const roundedStr = roundedPrice.toString()
          
          // Detectar si hay problema de precisión
          if (priceStr.includes('999999') || priceStr.includes('0000001')) {
            console.warn('[PRICE_PRECISION_ISSUE]', {
              currencyId: cid,
              originalPrice: numPrice,
              originalPriceString: priceStr,
              roundedPrice: roundedPrice,
              roundedPriceString: roundedStr,
              diff: Math.abs(numPrice - roundedPrice)
            })
          }
          
          priceMap.set(cid, {
            currencyId: cid,
            price: roundedPrice,
            ...(existing?.originalPrice != null && { originalPrice: existing.originalPrice })
          })
        }

        // Normalizar precio de entrada
        const normalizedPrice = typeof price === 'string' ? parseFloat(price) : Number(price)
        
        // Actualizar precio de la moneda editada
        console.log('[PRICE_CHANGE_START]', {
          variantId: indexOrId,
          currencyId,
          inputPrice: price,
          inputPriceType: typeof price,
          inputPriceString: price?.toString(),
          normalizedPrice: normalizedPrice
        })
        
        if (isNaN(normalizedPrice)) {
          console.warn('[INVALID_INPUT_PRICE]', { price, currencyId })
          return { ...v, prices: Array.from(priceMap.values()) }
        }
        
        upsertPrice(currencyId, normalizedPrice)

        // Propagación automática si es moneda base
        const baseCurrency = shopSettings?.[0]?.defaultCurrency
        const acceptedCurrencyIds = new Set<string>(shopSettings?.[0]?.acceptedCurrencies?.map((c: any) => c.id) || [])

        if (baseCurrency?.id === currencyId) {
          // Precomputar rates en Map para acceso O(1)
          // IMPORTANTE: Convertir rate a número para evitar problemas de precisión
          const rateMap = new Map<string, number>()
          exchangeRates.forEach((er) => {
            if (er.fromCurrencyId === baseCurrency.id && acceptedCurrencyIds.has(er.toCurrencyId)) {
              // Convertir rate a número, manejar tanto string como number
              const numericRate = typeof er.rate === 'string' ? parseFloat(er.rate) : Number(er.rate)
              rateMap.set(er.toCurrencyId, numericRate)
            }
          })

          // Aplicar conversiones (normalizedPrice ya está normalizado arriba)
          rateMap.forEach((rate, toCurrencyId) => {
            // Multiplicación precisa - ambos valores ya son números
            const convertedPrice = normalizedPrice * rate
            console.log('[PRICE_CONVERSION]', {
              basePrice: normalizedPrice,
              rate: rate,
              rateType: typeof rate,
              rateString: rate.toString(),
              convertedPriceRaw: convertedPrice,
              convertedPriceString: convertedPrice.toString(),
              convertedPriceAfterRound: roundPrice(convertedPrice),
              hasLongDecimals: convertedPrice.toString().includes('999999') || convertedPrice.toString().includes('0000001'),
              toCurrencyId
            })
            upsertPrice(toCurrencyId, convertedPrice)
          })
        }

        return { ...v, prices: Array.from(priceMap.values()) }
      }

      if (typeof indexOrId === "number") {
        return prev.map((v, i) => (i === indexOrId ? updateVariant(v) : v))
      } else {
        return prev.map((v: any) => (v.id === indexOrId ? updateVariant(v) : v))
      }
    })
  }

  const handleOriginalPriceChange = (
    indexOrId: number | string,
    currencyId: string,
    originalPrice: number | null,
    exchangeRates: any[],
    shopSettings: any[]
  ) => {
    setVariants((prev) => {
      const updateVariant = (v: T) => {
        const prices = v.prices || []
        const priceMap = new Map(prices.map((p: any) => [p.currencyId, { ...p }]))

        // Helper para actualizar originalPrice preservando price
        const upsertOriginal = (cid: string, value: number | null) => {
          const existing = priceMap.get(cid)
          const newOriginalPrice = value === null ? null : roundPrice(value)
          
          if (existing) {
            priceMap.set(cid, { ...existing, originalPrice: newOriginalPrice })
          } else {
            priceMap.set(cid, { currencyId: cid, price: 0, originalPrice: newOriginalPrice })
          }
        }

        // Actualizar originalPrice de la moneda editada
        upsertOriginal(currencyId, originalPrice)

        // Propagación si es moneda base
        const baseCurrencyId = shopSettings?.[0]?.defaultCurrency?.id
        const acceptedCurrencyIds = new Set<string>(shopSettings?.[0]?.acceptedCurrencies?.map((c: any) => c.id) || [])

        if (baseCurrencyId && currencyId === baseCurrencyId) {
          if (originalPrice === null) {
            // Propagar null a todas las monedas aceptadas
            acceptedCurrencyIds.forEach((toId: string) => {
              if (toId !== baseCurrencyId) upsertOriginal(toId, null)
            })
          } else {
            // Precomputar rates y propagar conversión
            // IMPORTANTE: Convertir rate a número para evitar problemas de precisión
            const rateMap = new Map<string, number>()
            exchangeRates.forEach((er: any) => {
              if (er.fromCurrencyId === baseCurrencyId && acceptedCurrencyIds.has(er.toCurrencyId)) {
                // Convertir rate a número, manejar tanto string como number
                const numericRate = typeof er.rate === 'string' ? parseFloat(er.rate) : Number(er.rate)
                rateMap.set(er.toCurrencyId, numericRate)
              }
            })
            rateMap.forEach((rate, toId) => {
              // rate ya es número (convertido arriba), solo normalizar originalPrice
              const numericOriginalPrice = typeof originalPrice === 'string' ? parseFloat(originalPrice) : Number(originalPrice)
              const convertedOriginal = numericOriginalPrice * rate
              console.log('[ORIGINAL_PRICE_CONVERSION]', {
                baseOriginalPrice: numericOriginalPrice,
                rate: rate,
                rateType: typeof rate,
                rateString: rate.toString(),
                convertedOriginalRaw: convertedOriginal,
                convertedOriginalString: convertedOriginal.toString(),
                convertedOriginalAfterRound: roundPrice(convertedOriginal),
                hasLongDecimals: convertedOriginal.toString().includes('999999') || convertedOriginal.toString().includes('0000001'),
                toCurrencyId: toId
              })
              upsertOriginal(toId, convertedOriginal)
            })
          }
        }

        return { ...v, prices: Array.from(priceMap.values()) }
      }

      return prev.map((v, i) => 
        typeof indexOrId === "number" 
          ? (i === indexOrId ? updateVariant(v) : v)
          : ((v as any).id === indexOrId ? updateVariant(v) : v)
      )
    })
  }

  return {
    handleVariantChange,
    handleWeightChange,
    handleInventoryChange,
    handleInventoryBlur,
    handlePriceChange,
    handleOriginalPriceChange,
    roundPrice,
  }
}

