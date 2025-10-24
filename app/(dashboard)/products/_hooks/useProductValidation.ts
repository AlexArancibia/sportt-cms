import { useToast } from "@/hooks/use-toast"
import type { Product, CreateProductDto, UpdateProductDto } from "@/types/product"
import type { CreateProductVariantDto, UpdateProductVariantDto } from "@/types/productVariant"

interface ValidationErrors {
  [key: string]: string
}

interface ValidationResult {
  isValid: boolean
  errors: ValidationErrors
}

export const useProductValidation = () => {
  const { toast } = useToast()

  /**
   * Valida el formato del slug según las reglas de la API
   * Patrón: ^[a-z0-9]+(?:-[a-z0-9]+)*$
   */
  const validateSlugFormat = (slug: string): boolean => {
    const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
    return slugPattern.test(slug)
  }

  /**
   * Valida el formato del SKU según las reglas de la API
   * Patrón: ^[A-Za-z0-9-_]+$
   */
  const validateSkuFormat = (sku: string): boolean => {
    const skuPattern = /^[A-Za-z0-9-_]+$/
    return skuPattern.test(sku)
  }

  /**
   * Valida si un slug es único comparándolo con productos existentes
   */
  const validateSlugUniqueness = (
    slug: string,
    currentProductId: string | undefined,
    existingProducts: Product[]
  ): boolean => {
    return !existingProducts.some(
      (p) => p.slug === slug && p.id !== currentProductId
    )
  }

  /**
   * Valida campos obligatorios del producto
   */
  const validateRequiredFields = (
    formData: CreateProductDto | UpdateProductDto | Partial<Product>
  ): ValidationResult => {
    const errors: ValidationErrors = {}

    // Validar título (obligatorio)
    if (!formData.title || formData.title.trim() === "") {
      errors.title = "El título es obligatorio"
    }

    // Validar slug (obligatorio)
    if (!formData.slug || formData.slug.trim() === "") {
      errors.slug = "El slug es obligatorio"
    } else if (!validateSlugFormat(formData.slug)) {
      errors.slug =
        "El slug solo puede contener letras minúsculas, números y guiones"
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    }
  }

  /**
   * Valida que un precio sea válido (>= 0 o null, pero no undefined)
   */
  const isValidPrice = (price: number | null | undefined): boolean => {
    return price === null || (typeof price === 'number' && price >= 0)
  }

  /**
   * Valida que cada variante tenga al menos un precio válido y no nulo
   */
  const validateVariantsPrices = (
    variants: (CreateProductVariantDto | UpdateProductVariantDto)[],
    shopSettings?: any[]
  ): ValidationResult => {
    const errors: ValidationErrors = {}
    
    // Obtener la moneda por defecto si existe
    const defaultCurrencyId = shopSettings?.[0]?.defaultCurrencyId

    variants.forEach((variant, index) => {
      // Verificar que la variante tenga precios
      if (!variant.prices || variant.prices.length === 0) {
        errors[`variant_${index}_no_prices`] = 
          `La variante "${variant.title}" debe tener al menos un precio`
        return
      }

      // Verificar que al menos un precio sea válido y no nulo
      const validPrices = variant.prices.filter(price => 
        price.currencyId && 
        price.currencyId.trim() !== "" && 
        isValidPrice(price.price) && 
        price.price !== null
      )

      if (validPrices.length === 0) {
        errors[`variant_${index}_no_valid_prices`] = 
          `La variante "${variant.title}" debe tener al menos un precio válido y no nulo`
      }

      // Si hay moneda por defecto, verificar que tenga precio válido
      if (defaultCurrencyId) {
        const defaultPrice = variant.prices.find(p => p.currencyId === defaultCurrencyId)
        
        if (!defaultPrice) {
          errors[`variant_${index}_no_default_price`] = 
            `La variante "${variant.title}" debe tener un precio para la moneda por defecto (${defaultCurrencyId})`
        } else if (!isValidPrice(defaultPrice.price) || defaultPrice.price === null) {
          errors[`variant_${index}_invalid_default_price`] = 
            `La variante "${variant.title}" debe tener un precio válido y no nulo para la moneda por defecto`
        }
      }

      // Validar que currencyId no sea nulo en precios válidos
      variant.prices.forEach((price, priceIndex) => {
        if (price.currencyId && price.currencyId.trim() !== "") {
          if (!isValidPrice(price.price)) {
            if (price.price < 0) {
              errors[`variant_${index}_price_${priceIndex}_negative`] = 
                `El precio ${priceIndex + 1} de la variante "${variant.title}" no puede ser negativo (${price.price})`
            } else if (price.price === undefined) {
              errors[`variant_${index}_price_${priceIndex}_undefined`] = 
                `El precio ${priceIndex + 1} de la variante "${variant.title}" debe tener un valor válido`
            }
          }
        }
      })
    })

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    }
  }

  /**
   * Valida la configuración de la tienda (solo si es necesario)
   */
  const validateShopCurrency = (shopSettings?: any[]): ValidationResult => {
    const errors: ValidationErrors = {}

    if (!shopSettings || shopSettings.length === 0) {
      errors.shopSettings = "No se encontraron configuraciones de la tienda"
      return { isValid: false, errors }
    }

    const shop = shopSettings[0]
    
    // Solo validar si hay monedas aceptadas
    if (!shop.acceptedCurrencies || shop.acceptedCurrencies.length === 0) {
      errors.acceptedCurrencies = "Debe configurar al menos una moneda aceptada en la configuración de la tienda antes de crear productos"
    }

    // No validar defaultCurrencyId porque puede ser nulo según las reglas

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    }
  }

  /**
   * Valida que las monedas de los precios estén en las monedas aceptadas
   */
  const validateCurrencyAcceptance = (
    variants: (CreateProductVariantDto | UpdateProductVariantDto)[],
    shopSettings?: any[]
  ): ValidationResult => {
    const errors: ValidationErrors = {}

    if (!shopSettings || shopSettings.length === 0) {
      return { isValid: true, errors }
    }

    const acceptedCurrencyIds = shopSettings[0]?.acceptedCurrencies?.map((c: any) => c.id) || []

    variants.forEach((variant, index) => {
      variant.prices?.forEach((price, priceIndex) => {
        if (price.currencyId && !acceptedCurrencyIds.includes(price.currencyId)) {
          errors[`variant_${index}_price_${priceIndex}_invalid_currency`] = 
            `La moneda "${price.currencyId}" del precio ${priceIndex + 1} de la variante "${variant.title}" no está aceptada en esta tienda. Monedas aceptadas: ${acceptedCurrencyIds.join(", ")}`
        }
      })
    })

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    }
  }

  /**
   * Valida las variantes del producto (validaciones adicionales)
   */
  const validateVariants = (
    variants: (CreateProductVariantDto | UpdateProductVariantDto)[]
  ): ValidationResult => {
    const errors: ValidationErrors = {}

    // Verificar que haya al menos una variante
    if (!variants || variants.length === 0) {
      errors.variants = "Debe tener al menos una variante"
      return { isValid: false, errors }
    }

    // Validar SKUs únicos dentro del producto (opcional pero recomendado)
    const skus = variants
      .map((v) => v.sku)
      .filter((s) => s && s.trim() !== "") as string[]
    const duplicateSkus = skus.filter(
      (sku, index) => skus.indexOf(sku) !== index
    )

    if (duplicateSkus.length > 0) {
      errors.skus = `SKUs duplicados en el producto: ${[...new Set(duplicateSkus)].join(", ")}`
    }

    // Validar formato de SKU
    variants.forEach((variant, index) => {
      if (variant.sku && !validateSkuFormat(variant.sku)) {
        errors[`variant_${index}_sku`] =
          `El SKU de la variante "${variant.title}" tiene formato inválido: "${variant.sku}". Solo se permiten letras, números, guiones y guiones bajos`
      }
    })

    // Validar pesos no negativos
    variants.forEach((variant, index) => {
      const weight = (variant as any).weightValue
      if (weight !== undefined && weight !== null && weight < 0) {
        errors[`variant_${index}_weight`] = 
          `El peso de la variante "${variant.title}" no puede ser negativo (${weight})`
      }
    })

    // Validar inventario no negativo
    variants.forEach((variant, index) => {
      if (
        variant.inventoryQuantity !== undefined &&
        variant.inventoryQuantity !== null &&
        variant.inventoryQuantity < 0
      ) {
        errors[`variant_${index}_inventory`] =
          `El inventario de la variante "${variant.title}" no puede ser negativo (${variant.inventoryQuantity})`
      }
    })

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    }
  }

  /**
   * Validación completa del producto antes de crear/actualizar
   */
  const validateProduct = (
    formData: CreateProductDto | UpdateProductDto | Partial<Product>,
    variants: (CreateProductVariantDto | UpdateProductVariantDto)[],
    existingProducts: Product[] = [],
    currentProductId?: string,
    shopSettings?: any[]
  ): ValidationResult => {
    const errors: ValidationErrors = {}

    // 1. Validar campos obligatorios
    const requiredFieldsValidation = validateRequiredFields(formData)
    if (!requiredFieldsValidation.isValid) {
      Object.assign(errors, requiredFieldsValidation.errors)
    }

    // 2. Validar unicidad de slug
    if (formData.slug && formData.slug.trim() !== "") {
      if (
        !validateSlugUniqueness(formData.slug, currentProductId, existingProducts)
      ) {
        errors.slug = "Ya existe un producto con este slug. Por favor, use otro."
      }
    }

    // 3. Validar configuración de la tienda (solo monedas aceptadas)
    if (shopSettings) {
      const shopValidation = validateShopCurrency(shopSettings)
      if (!shopValidation.isValid) {
        Object.assign(errors, shopValidation.errors)
      }
    }

    // 4. Validar que cada variante tenga precios válidos
    const variantsPricesValidation = validateVariantsPrices(variants, shopSettings)
    if (!variantsPricesValidation.isValid) {
      Object.assign(errors, variantsPricesValidation.errors)
    }

    // 5. Validar que las monedas estén aceptadas
    if (shopSettings) {
      const currencyValidation = validateCurrencyAcceptance(variants, shopSettings)
      if (!currencyValidation.isValid) {
        Object.assign(errors, currencyValidation.errors)
      }
    }

    // 6. Validar variantes (validaciones adicionales)
    const variantsValidation = validateVariants(variants)
    if (!variantsValidation.isValid) {
      Object.assign(errors, variantsValidation.errors)
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    }
  }

  /**
   * Muestra errores de validación usando toast
   */
  const showValidationErrors = (errors: ValidationErrors) => {
    // Mostrar el primer error encontrado
    const firstError = Object.values(errors)[0]
    if (firstError) {
      toast({
        variant: "destructive",
        title: "Error de Validación",
        description: firstError,
      })
    }
  }

  /**
   * Validación con toast automático
   */
  const validateProductWithToast = (
    formData: CreateProductDto | UpdateProductDto | Partial<Product>,
    variants: (CreateProductVariantDto | UpdateProductVariantDto)[],
    existingProducts: Product[] = [],
    currentProductId?: string,
    shopSettings?: any[]
  ): boolean => {
    const validation = validateProduct(
      formData,
      variants,
      existingProducts,
      currentProductId,
      shopSettings
    )
    
    if (!validation.isValid) {
      showValidationErrors(validation.errors)
    }
    
    return validation.isValid
  }

  return {
    validateProduct,
    validateProductWithToast,
    validateRequiredFields,
    validateVariants,
    validateVariantsPrices,
    validateShopCurrency,
    validateCurrencyAcceptance,
    validateSlugFormat,
    validateSkuFormat,
    validateSlugUniqueness,
    isValidPrice,
    showValidationErrors,
  }
}

