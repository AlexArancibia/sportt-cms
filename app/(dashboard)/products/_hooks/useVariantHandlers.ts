import type { UpdateProductVariantDto } from "@/types/productVariant"
import type { CreateProductVariantDto } from "@/types/productVariant"

export const roundPrice = (price: number): number => {
  return Math.round(price * 100) / 100
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
    const value = Number(inputValue)
    if (!isNaN(value) && value >= 0) {
      handleVariantChange(indexOrId, "weightValue" as keyof T, value)
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
    price: number,
    exchangeRates: any[],
    shopSettings: any[]
  ) => {
    setVariants((prev) => {
      const updateVariant = (v: T) => {
        const newPrices = (v.prices || []).filter((p: any) => p.currencyId !== currencyId)
        newPrices.push({ currencyId, price: roundPrice(price) })

        const baseCurrency = shopSettings?.[0]?.defaultCurrency
        const acceptedCurrencyIds = shopSettings?.[0]?.acceptedCurrencies?.map((c: any) => c.id) || []

        if (baseCurrency && baseCurrency.id === currencyId) {
          exchangeRates.forEach((er) => {
            if (er.fromCurrencyId === baseCurrency.id && acceptedCurrencyIds.includes(er.toCurrencyId)) {
              const existingPrice = newPrices.find((p: any) => p.currencyId === er.toCurrencyId)
              if (existingPrice) {
                existingPrice.price = roundPrice(price * er.rate)
              } else {
                newPrices.push({ currencyId: er.toCurrencyId, price: roundPrice(price * er.rate) })
              }
            }
          })
        }

        return { ...v, prices: newPrices }
      }

      if (typeof indexOrId === "number") {
        return prev.map((v, i) => (i === indexOrId ? updateVariant(v) : v))
      } else {
        return prev.map((v: any) => (v.id === indexOrId ? updateVariant(v) : v))
      }
    })
  }

  return {
    handleVariantChange,
    handleWeightChange,
    handleInventoryChange,
    handleInventoryBlur,
    handlePriceChange,
    roundPrice,
  }
}

