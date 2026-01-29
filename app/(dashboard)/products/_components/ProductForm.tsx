"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useStores } from "@/hooks/useStores"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import type { UpdateProductDto, ProductOption, Product } from "@/types/product"
import type { UpdateProductVariantDto, ProductVariant } from "@/types/productVariant"
import type { Category } from "@/types/category"
import type { Collection } from "@/types/collection"
import type { ExchangeRate } from "@/types/exchangeRate"
import { ProductStatus } from "@/types/common"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  ArrowLeft,
  ArrowRight,
  PackageIcon,
  CircleDollarSign,
  RotateCcw,
  ImagePlus,
  Info,
  X,
  Calendar,
  Plus,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DescriptionEditor } from "@/app/(dashboard)/products/(singleProduct)/_components/RichTextEditor"
import { ImageGallery } from "@/app/(dashboard)/products/(singleProduct)/_components/ImageGallery"
import { VariantOptions } from "@/app/(dashboard)/products/(singleProduct)/_components/VariantOptions"
import { VariantsDetailTable } from "./shared/VariantsDetailTable"
import { JsonViewer } from "@/components/json-viewer"
import Image from "next/image"
import { getImageUrl } from "@/lib/imageUtils"
import { slugify } from "@/lib/slugify"
import { 
  filterEmptyValues, 
  getChangedFields,
  getAcceptedCurrencies,
  cleanVariantForPayload,
} from "@/lib/productPayloadUtils"
import { MultiSelect } from "@/components/ui/multi-select"
import type React from "react"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { uploadImage } from "@/app/actions/upload-file"
import { useVariantHandlers } from "../_hooks/useVariantHandlers"
import { useProductImageUpload } from "../_hooks/useProductImageUpload"
import { VariantImageGallery } from "./shared/VariantImageGallery"
import { useCreateProduct } from "@/hooks/useCreateProduct"
import { useUpdateProduct } from "@/hooks/useUpdateProduct"
import { useCategories } from "@/hooks/useCategories"
import { useCollections } from "@/hooks/useCollections"
import { useCurrencies } from "@/hooks/useCurrencies"
import { useExchangeRates } from "@/hooks/useExchangeRates"
import { useShopSettings } from "@/hooks/useShopSettings"
import { useProductById } from "@/hooks/useProductById"
import { getApiErrorMessage } from "@/lib/errorHelpers"


interface VariantCombination {
  id: string
  enabled: boolean
  attributes: Record<string, string>
  position: number
}

interface ProductFormProps {
  mode: 'create' | 'edit'
  productId?: string
}

const areEqual = (array1: UpdateProductVariantDto[], array2: UpdateProductVariantDto[]) => {
  return JSON.stringify(array1) === JSON.stringify(array2)
}

export default function ProductForm({ mode, productId }: ProductFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [productData, setProductData] = useState<Product | null>(null)
  const [storeData, setStoreData] = useState<{ storeId: string } | null>(null)
  const resolvedParams = mode === 'edit' && productId ? { id: productId } : null

  // Get current store from useStores hook
  const { currentStoreId, setCurrentStore } = useStores()
  const currentStore = currentStoreId

  const createProductMutation = useCreateProduct(storeData?.storeId ?? null)
  const updateProductMutation = useUpdateProduct(storeData?.storeId ?? null)

  const [currentStep, setCurrentStep] = useState(1)
  const [useVariants, setUseVariants] = useState(false)
  const [variants, setVariants] = useState<UpdateProductVariantDto[]>([])
  const [formData, setFormData] = useState<UpdateProductDto>({})
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false)
  const [productOptions, setProductOptions] = useState<ProductOption[]>([])
  const [variantCombinations, setVariantCombinations] = useState<VariantCombination[]>([])
  const [hasFetched, setHasFetched] = useState(false)

  // Usar hooks compartidos
  const variantHandlers = useVariantHandlers(variants, setVariants)
  const imageUpload = useProductImageUpload(currentStore)
  
  const resolvedStoreId = storeData?.storeId ?? null

  // Datos base con React Query (mantener nombres usados en el componente)
  const { data: categoriesResponse, isLoading: isLoadingCategories } = useCategories(
    resolvedStoreId,
    { limit: 50 },
    !!resolvedStoreId,
  )
  const categories = categoriesResponse?.data ?? []

  const { data: collections = [], isLoading: isLoadingCollections } = useCollections(
    resolvedStoreId,
    !!resolvedStoreId,
  )
  const { data: currencies = [], isLoading: isLoadingCurrencies } = useCurrencies()
  const { data: exchangeRates = [], isLoading: isLoadingExchangeRates } = useExchangeRates()

  const { data: currentShopSettings, isLoading: isLoadingShopSettings } = useShopSettings(resolvedStoreId)
  const shopSettings = currentShopSettings ? [currentShopSettings] : []

  const {
    data: fetchedProduct,
    isLoading: isLoadingProduct,
    error: productFetchError,
  } = useProductById(
    resolvedStoreId,
    mode === "edit" ? productId ?? null : null,
    mode === "edit" && !!resolvedStoreId,
  )

  // Resolver storeId desde useStores (que ya maneja localStorage internamente)
  useEffect(() => {
    if (hasFetched) return

    const storeId = currentStoreId

    if (!storeId) {
      setError("No store selected. Please select a store from the sidebar.")
      toast({
        variant: "destructive",
        title: "Error",
        description: mode === "edit" ? "Error al cargar los datos del producto" : "Error al inicializar el formulario",
      })
      if (mode === "edit") router.push("/products")
      return
    }

    setStoreData({ storeId })
  }, [hasFetched, mode, router, currentStoreId, toast])

  // Inicializar cuando los datos base estén listos (React Query) y el producto (si aplica)
  useEffect(() => {
    if (hasFetched) return
    if (!resolvedStoreId) return

    const baseLoading =
      isLoadingCategories ||
      isLoadingCollections ||
      isLoadingCurrencies ||
      isLoadingExchangeRates ||
      isLoadingShopSettings ||
      (mode === "edit" ? isLoadingProduct : false)

    setIsLoading(baseLoading)
    if (baseLoading) return

    setError(null)

    if (mode === "edit") {
      if (productFetchError) {
        setError("Product not found")
        toast({ variant: "destructive", title: "Error", description: "Producto no encontrado" })
        router.push("/products")
        setHasFetched(true)
        setIsLoading(false)
        return
      }

      if (!fetchedProduct) return

      const product = fetchedProduct
      setProductData(product)

      setFormData({
        ...product,
        categoryIds: product.categories?.map((c) => c.id) || [],
        collectionIds: product.collections?.map((c) => c.id) || [],
        restockThreshold: product.restockThreshold ?? 5,
        restockNotify: product.restockNotify ?? true,
        releaseDate: product.releaseDate ? new Date(product.releaseDate) : undefined,
      })

      const productVariants =
        product.variants?.map((variant) => ({
          ...variant,
          isActive: variant.isActive ?? true,
          position: variant.position ?? 0,
        })) || []

      setVariants(productVariants)
      setUseVariants(productVariants.length > 1)

      const options = extractProductOptions(productVariants)
      setProductOptions(options)

      if (options.length > 0) {
        const combinations = generateVariantCombinationsFromOptions(options, productVariants)
        setVariantCombinations(combinations)
      }
    } else {
      setFormData({
        title: "",
        description: "",
        slug: "",
        vendor: "",
        allowBackorder: false,
        status: ProductStatus.DRAFT,
        imageUrls: [],
        metaTitle: "",
        metaDescription: "",
        restockNotify: true,
        restockThreshold: 5,
        categoryIds: [],
        collectionIds: [],
      })

      setVariants([
        {
          title: "Variante Principal",
          sku: "",
          isActive: true,
          attributes: { type: "simple" },
          inventoryQuantity: 0,
          weightValue: undefined,
          position: 0,
          imageUrls: [],
          prices: [],
        },
      ])
      setUseVariants(false)
    }

    setHasFetched(true)
    setIsLoading(false)
  }, [
    fetchedProduct,
    hasFetched,
    isLoadingCategories,
    isLoadingCollections,
    isLoadingCurrencies,
    isLoadingExchangeRates,
    isLoadingProduct,
    isLoadingShopSettings,
    mode,
    productFetchError,
    resolvedStoreId,
    router,
    toast,
  ])

  // Function to generate variant combinations from options
  const generateVariantCombinationsFromOptions = (
    options: ProductOption[],
    existingVariants: UpdateProductVariantDto[],
  ): VariantCombination[] => {
    if (!options.length) return []

    const generateCombos = (optionIndex = 0, current: Record<string, string> = {}): Record<string, string>[] => {
      if (optionIndex >= options.length) return [current]

      const currentOption = options[optionIndex]
      return currentOption.values.flatMap((value) => {
        const newCurrent = { ...current, [currentOption.title]: value }
        return generateCombos(optionIndex + 1, newCurrent)
      })
    }

    const combinations = generateCombos()

    const combinationsWithMetadata = combinations.map((combo, index) => {
      // Check if this combination already exists in current variants
      // We need to match by attribute values, not keys, since attribute names might have changed
      const existingVariant = existingVariants.find((v) => {
        if (!v.attributes) return false

        // Get the values from the existing variant attributes
        const existingValues = Object.values(v.attributes).sort()
        const comboValues = Object.values(combo).sort()

        // Match if the values are the same (regardless of attribute names)
        return (
          existingValues.length === comboValues.length &&
          existingValues.every((val, valueIndex) => val === comboValues[valueIndex])
        )
      })

      const basePosition =
        existingVariant?.position !== undefined && existingVariant.position !== null
          ? existingVariant.position
          : existingVariants.length + index

      return {
        id: existingVariant?.id || `variant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        enabled: existingVariant?.isActive ?? true,
        attributes: combo,
        position: basePosition,
      }
    })

    return combinationsWithMetadata
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map((variant, sortedIndex) => ({ ...variant, position: sortedIndex }))
  }

  const extractProductOptions = (variants: UpdateProductVariantDto[]): ProductOption[] => {
    const optionsMap: Record<string, Set<string>> = {}
    variants.forEach((variant) => {
      if (!variant.attributes) {
        return
      }

      Object.entries(variant.attributes || {}).forEach(([key, value]) => {
        if (key !== "type") {
          // Ignore the 'type' attribute used for simple variants
          if (!optionsMap[key]) optionsMap[key] = new Set()
          optionsMap[key].add(value)
        }
      })
    })
    
    // Convert to array and sort by key to ensure consistent ordering
    const options = Object.entries(optionsMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([title, values]) => ({
        title,
        values: Array.from(values).sort(),
      }))
    
    return options
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => {
      const newData = { ...prev, [name]: value }
      if (name === "title" && !isSlugManuallyEdited) {
        newData.slug = slugify(value)
      }
      return newData
    })
  }

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, slug: slugify(e.target.value) }))
    setIsSlugManuallyEdited(true)
  }

  // Usar handlers del hook compartido
  const handleVariantChange = variantHandlers.handleVariantChange
  const handleWeightChange = variantHandlers.handleWeightChange
  const handleInventoryChange = variantHandlers.handleInventoryChange
  const handleInventoryBlur = variantHandlers.handleInventoryBlur

  // Handler de precio con conversión automática
  const handleVariantPriceChange = (indexOrId: number | string, currencyId: string, price: number) => {
    variantHandlers.handlePriceChange(indexOrId, currencyId, price, exchangeRates, shopSettings)
  }

  // Handler de precio original
  const handleVariantOriginalPriceChange = (indexOrId: number | string, currencyId: string, originalPrice: number | null) => {
    variantHandlers.handleOriginalPriceChange(indexOrId, currencyId, originalPrice, exchangeRates, shopSettings)
  }

  // Handler para cambios de precio con validación
  const handlePriceInputChange = (indexOrId: number | string, currencyId: string, value: string) => {
    const decimalRegex = /^\d*\.?\d{0,2}$/
    if (decimalRegex.test(value) || value === "") {
      const numValue = Number(value)
      if (!isNaN(numValue)) {
        handleVariantPriceChange(indexOrId, currencyId, variantHandlers.roundPrice(numValue))
      }
    }
  }

  // Handler para cambios de precio original con validación
  const handleOriginalPriceInputChange = (indexOrId: number | string, currencyId: string, value: string) => {
    if (!/^\d*\.?\d{0,2}$/.test(value) && value !== "") return
    
    const numValue = value === "" ? null : Number(value)
    if (numValue !== null && !isNaN(numValue)) {
      handleVariantOriginalPriceChange(indexOrId, currencyId, variantHandlers.roundPrice(numValue))
    } else if (numValue === null) {
      handleVariantOriginalPriceChange(indexOrId, currencyId, null)
    }
  }

  // Manejo de imágenes usando el hook compartido
  const handleImageUpload = (indexOrId: number | string) => {
    const maxImages = useVariants ? 5 : 10
    const currentCount = useVariants
      ? variants[typeof indexOrId === 'number' ? indexOrId : variants.findIndex(v => v.id === indexOrId)]?.imageUrls?.length || 0
      : formData.imageUrls?.length || 0

    imageUpload.handleImageUpload((fileUrl) => {
      if (useVariants) {
        setVariants((prev) =>
          prev.map((v, index) => {
            const variantIndex = typeof indexOrId === 'number' ? indexOrId : prev.findIndex(variant => variant.id === indexOrId)
            return index === variantIndex ? { ...v, imageUrls: [...(v.imageUrls || []), fileUrl] } : v
          })
        )
      } else {
        setFormData((prev) => ({ ...prev, imageUrls: [...(prev.imageUrls || []), fileUrl] }))
      }
    }, maxImages, currentCount)
  }

  const handleRemoveVariantImage = (indexOrId: number | string, imageIndex: number) => {
    setVariants((prev) =>
      prev.map((v, vIndex) => {
        const variantIndex = typeof indexOrId === 'number' ? indexOrId : prev.findIndex(variant => variant.id === indexOrId)
        if (vIndex === variantIndex) {
          const updatedImages = [...(v.imageUrls || [])]
          updatedImages.splice(imageIndex, 1)
          return { ...v, imageUrls: updatedImages }
        }
        return v
      })
    )
  }

  // Opciones compartidas para cleanVariantForPayload (lib)
  const acceptedCurrenciesPayload = getAcceptedCurrencies(shopSettings)
  const fallbackCurrenciesPayload = currencies?.length ? currencies : null
  const isSimpleProductPayload =
    variants.length === 1 &&
    (!variants[0]?.attributes || Object.keys(variants[0].attributes).length === 0 || variants[0].attributes?.type === "simple")

  const cleanVariantOptions = {
    totalVariants: variants.length,
    isSimpleProduct: isSimpleProductPayload,
    acceptedCurrencies: acceptedCurrenciesPayload,
    fallbackCurrencies: fallbackCurrenciesPayload,
  }

  // Función para generar el payload que se enviará al backend
  const generatePayload = (): Record<string, unknown> => {
    if (mode === 'create') {
      // En modo create, enviar todos los campos necesarios
      const payload: Record<string, unknown> = {
        title: formData.title,
        slug: formData.slug,
        variants: variants.map((v) => cleanVariantForPayload(v, cleanVariantOptions)),
      }

      // Only include optional fields if they have values
      if (formData.description && formData.description.trim() !== "") {
        payload.description = formData.description
      }
      if (formData.vendor && formData.vendor.trim() !== "") {
        payload.vendor = formData.vendor
      }
      if (formData.allowBackorder !== undefined) {
        payload.allowBackorder = formData.allowBackorder
      }
      if (formData.releaseDate) {
        payload.releaseDate = formData.releaseDate
      }
      if (formData.status) {
        payload.status = formData.status
      }
      if (formData.restockThreshold !== undefined && formData.restockThreshold !== null) {
        payload.restockThreshold = Number(formData.restockThreshold)
      }
      if (formData.restockNotify !== undefined) {
        payload.restockNotify = formData.restockNotify
      }
      if (formData.categoryIds && formData.categoryIds.length > 0) {
        payload.categoryIds = formData.categoryIds
      }
      if (formData.collectionIds && formData.collectionIds.length > 0) {
        payload.collectionIds = formData.collectionIds
      }
      if (formData.imageUrls && formData.imageUrls.length > 0) {
        payload.imageUrls = formData.imageUrls
      }
      if (formData.metaTitle && formData.metaTitle.trim() !== "") {
        payload.metaTitle = formData.metaTitle
      }
      if (formData.metaDescription && formData.metaDescription.trim() !== "") {
        payload.metaDescription = formData.metaDescription
      }

      const filtered = filterEmptyValues(payload)
      
      // Convertir Date a string ISO para el backend
      if (filtered.releaseDate instanceof Date) {
        filtered.releaseDate = filtered.releaseDate.toISOString()
      }
      
      return filtered
    } else {
      // En modo edit, solo enviar campos que han cambiado (PATCH)
      if (!productData) {
        throw new Error("Product data not available for comparison")
      }

      const originalVariants = productData.variants ?? []
      const originalIsSimple =
        originalVariants.length === 1 &&
        (!originalVariants[0]?.attributes || Object.keys(originalVariants[0].attributes).length === 0 || originalVariants[0].attributes?.type === "simple")
      const originalCleanOptions = {
        totalVariants: originalVariants.length,
        isSimpleProduct: originalIsSimple,
        acceptedCurrencies: acceptedCurrenciesPayload,
        fallbackCurrencies: fallbackCurrenciesPayload,
      }

      // Preparar datos actuales para comparación
      const currentData = {
        title: formData.title,
        slug: formData.slug,
        description: formData.description,
        vendor: formData.vendor,
        allowBackorder: formData.allowBackorder,
        releaseDate: formData.releaseDate,
        status: formData.status,
        restockThreshold: formData.restockThreshold,
        restockNotify: formData.restockNotify,
        categoryIds: formData.categoryIds,
        collectionIds: formData.collectionIds,
        imageUrls: formData.imageUrls,
        metaTitle: formData.metaTitle,
        metaDescription: formData.metaDescription,
        variants: variants.map((v) => cleanVariantForPayload(v, cleanVariantOptions)),
      }

      // Preparar datos originales para comparación
      const originalData = {
        title: productData.title,
        slug: productData.slug,
        description: productData.description,
        vendor: productData.vendor,
        allowBackorder: productData.allowBackorder,
        releaseDate: productData.releaseDate,
        status: productData.status,
        restockThreshold: productData.restockThreshold,
        restockNotify: productData.restockNotify,
        categoryIds: productData.categories?.map((c) => c.id) || [],
        collectionIds: productData.collections?.map((c) => c.id) || [],
        imageUrls: productData.imageUrls,
        metaTitle: productData.metaTitle,
        metaDescription: productData.metaDescription,
        variants: originalVariants.map((v) => cleanVariantForPayload(v, originalCleanOptions)),
      }

      // Obtener solo los campos que han cambiado
      const changes = getChangedFields(originalData, currentData)
      
      // Filtrar valores vacíos del resultado
      const filtered = filterEmptyValues(changes)
      
      // Convertir Date a string ISO para el backend
      if (filtered.releaseDate instanceof Date) {
        filtered.releaseDate = filtered.releaseDate.toISOString()
      }
      
      return filtered
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    if (!currentStore) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No store selected. Please select a store first.",
      })
      return
    }

    // Validar que al menos una variante esté activa
    // EXCEPCIÓN: Si hay 1 variante inactiva, el payload la activará automáticamente (cleanVariantForPayload fuerza isActive: true)
    const isSingleVariant = variants.length === 1
    const singleVariantIsInactive = isSingleVariant && variants[0]?.isActive === false
    
    // En modo edit, verificar que originalmente estaba inactiva (para confirmar que se está activando)
    const isActivatingSingleVariant = isSingleVariant && singleVariantIsInactive && (
      mode === 'create' || 
      (mode === 'edit' && productData?.variants?.[0]?.isActive === false)
    )

    const hasActiveVariant = variants.some(v => v.isActive !== false)
    
    // Bloquear solo si no hay variantes activas Y no se está activando la única variante
    if (!hasActiveVariant && !isActivatingSingleVariant) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "El producto debe tener al menos una variante activa.",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const payload = generatePayload()

      if (mode === 'create') {
        await createProductMutation.mutateAsync(payload as Record<string, unknown>)
        toast({
          title: "Éxito",
          description: "Producto creado correctamente",
        })
      } else {
        await updateProductMutation.mutateAsync({
          productId: productId!,
          payload: payload as Record<string, unknown>,
        })
        toast({
          title: "Éxito",
          description: "Producto actualizado correctamente",
        })
      }
      
      router.push("/products")
    } catch (error: unknown) {
      const fallback = mode === 'create' ? "Error al crear el producto" : "Error al actualizar el producto"
      const errorMessage = getApiErrorMessage(error, fallback)
      toast({ variant: "destructive", title: "Error", description: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update variants when options or combinations change
  useEffect(() => {
    if (!hasFetched) return

    if (useVariants && variantCombinations.length > 0) {
      // Map combinations to variants, preserving existing data and using the enabled flag
      const newVariants = variantCombinations.map((combo, index) => {
        // Check if a variant with these attributes already exists
        // We need to match by attribute values, not keys, since attribute names might have changed
        const existingVariant = variants.find((v) => {
          if (!v.attributes || !combo.attributes) return false
          
          // Get the values from the existing variant attributes
          const existingValues = Object.values(v.attributes).sort()
          const comboValues = Object.values(combo.attributes).sort()
          
          // Match if the values are the same (regardless of attribute names)
          return existingValues.length === comboValues.length && 
                 existingValues.every((val, index) => val === comboValues[index])
        })

        if (existingVariant) {
          // Preserve existing variant data, only update title and attributes if needed
          const newTitle = combo.attributes ? Object.values(combo.attributes).join(" / ") : existingVariant.title
          // logging removed
          return {
            ...existingVariant,
            title: newTitle,
            attributes: combo.attributes, // Update attributes with new keys
            position: combo.position ?? index,
            prices: existingVariant.prices ? [...existingVariant.prices] : [], // Ensure independent prices array
            isActive: combo.enabled ?? true,
          }
        } else {
          // Create a new variant
          // logging removed
          return {
            id: `temp-${Date.now()}-${index}`, // Generate unique temporary ID
            title: combo.attributes ? Object.values(combo.attributes).join(" / ") : `Variant ${index}`,
            sku: "",
            imageUrls: [],
            inventoryQuantity: 0,
            weightValue: undefined,
            prices: [], // Ensure prices is initialized
            attributes: combo.attributes || {},
            isActive: combo.enabled ?? true,
            position: combo.position ?? index,
          }
        }
      })

      // Only update if there are changes
      if (!areEqual(newVariants, variants)) {
        setVariants(newVariants)
      }
    }
  }, [useVariants, variantCombinations, hasFetched, variants])

  // Handle changes in useVariants
  useEffect(() => {
    if (!hasFetched) return

    if (!useVariants && variants.length > 1) {
      // If variants are disabled, keep only the first variant
      const mainVariant = variants[0]
      setVariants([
        {
          ...mainVariant,
          title: formData.title || "Variante Principal",
          attributes: { type: "simple" },
          isActive: true,
          imageUrls: [],
        },
      ])
    }
  }, [useVariants, hasFetched, variants, formData.title])

  const renderStep1 = () => {
    return (
      <div className="box-container h-fit">
        <div className="box-section flex flex-col justify-start items-start ">
          <div className="flex w-full justify-between items-center">
            <div>
              <h3>Detalle del Producto</h3>
              <span className="content-font text-gray-500">Actualice la información básica de su producto.</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <select
                  value={formData.status || ProductStatus.DRAFT}
                  onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as ProductStatus }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value={ProductStatus.DRAFT}>Borrador</option>
                  <option value={ProductStatus.ACTIVE}>Activo</option>
                  <option value={ProductStatus.ARCHIVED}>Archivado</option>
                </select>
                <span className="text-sm font-medium">
                  {formData.status === ProductStatus.ACTIVE ? (
                    <Badge className="bg-emerald-500">Activo</Badge>
                  ) : formData.status === ProductStatus.ARCHIVED ? (
                    <Badge className="bg-orange-500">Archivado</Badge>
                  ) : (
                    <Badge className="bg-gray-500">Borrador</Badge>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="box-section border-none gap-12 pb-6 items-start ">
          <div className="w-1/2 flex flex-col gap-3 ">
            <div className="space-y-2">
              <Label htmlFor="title">Nombre</Label>
              <Input id="title" name="title" value={formData.title || ""} onChange={handleChange} />
            </div>

            <div className="flex gap-4">
              <div className="space-y-3 w-1/2">
                <Label>Slug</Label>
                <div className="relative">
                  <Input 
                    value={formData.slug || ""} 
                    onChange={handleSlugChange}
                    placeholder="mi-producto-123"
                    pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                    title="Solo letras minúsculas, números y guiones"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setIsSlugManuallyEdited(true)
                      setFormData((prev) => ({ ...prev, slug: slugify(prev.title || "") }))
                    }}
                    className="absolute right-0 top-0 h-full px-3 py-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-3 w-1/2">
                <Label>Proveedor</Label>
                <Input name="vendor" value={formData.vendor || ""} onChange={handleChange} />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="space-y-3 w-1/2">
                <Label>Colecciones</Label>
                <MultiSelect
                  options={collections.map((collection) => ({ label: collection.title, value: collection.id }))}
                  selected={formData.collectionIds || []}
                  onChange={(selected) => setFormData((prev) => ({ ...prev, collectionIds: selected }))}
                />
              </div>

              <div className="space-y-3 w-1/2">
                <Label>Categorías</Label>
                <MultiSelect
                  options={categories.map((category) => ({ label: category.name, value: category.id }))}
                  selected={formData.categoryIds || []}
                  onChange={(selected) => setFormData((prev) => ({ ...prev, categoryIds: selected }))}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="space-y-3 w-1/2">
                <Label>Fecha de lanzamiento</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
                      {formData.releaseDate ? format(formData.releaseDate, "PPP") : <span>Seleccionar fecha</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={formData.releaseDate ? formData.releaseDate : undefined}
                      onSelect={(date) => {
                        setFormData((prev) => ({ ...prev, releaseDate: date || undefined }))
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-3 w-1/2">
                <Label>Umbral de reabastecimiento</Label>
                <Input
                  type="number"
                  name="restockThreshold"
                  min="0"
                  step="1"
                  value={formData.restockThreshold || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, restockThreshold: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className="space-y-3 w-full">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allowBackorder"
                  checked={formData.allowBackorder || false}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, allowBackorder: checked === true }))}
                />
                <Label htmlFor="allowBackorder">Permitir pedidos pendientes</Label>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">
                Permitir a los clientes comprar productos que están fuera de stock
              </span>
            </div>

            <div className="space-y-3 w-full">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="restockNotify"
                  checked={formData.restockNotify === true}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, restockNotify: checked === true }))}
                />
                <Label htmlFor="restockNotify">Notificar reabastecimiento</Label>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">
                Recibir notificaciones cuando el inventario esté por debajo del umbral
              </span>
            </div>

            <div className="space-y-3">
              <Label>Descripción</Label>
              <DescriptionEditor
                initialContent={formData.description || ""}
                onChange={(content: string) => setFormData((prev) => ({ ...prev, description: content }))}
              />
            </div>

            <div className="space-y-3">
              <Label>Media</Label>
              <ImageGallery
                images={formData.imageUrls || []}
                onChange={(newImages: string[]) => setFormData((prev) => ({ ...prev, imageUrls: newImages }))}
                maxImages={10}
              />
            </div>
          </div>

          <div className="w-1/2 flex flex-col justify-start gap-3 ">
            <VariantOptions
              useVariants={useVariants}
              onUseVariantsChange={setUseVariants}
              options={productOptions}
              onOptionsChange={setProductOptions}
              variants={variantCombinations}
              onVariantsChange={setVariantCombinations}
            />
          </div>
        </div>
      </div>
    )
  }

  const renderStep2 = () => {
    return (
      <div className="box-container h-fit">
        <div className="box-section flex flex-col justify-start items-start ">
          <h3>{useVariants ? "Detalles de Variantes" : "Detalles de Producto"}</h3>
          <span className="content-font text-gray-500">
            {useVariants ? "Gestione sus variantes de producto" : "Gestione su producto"}
          </span>
        </div>
        <div className="box-section border-none px-0 gap-12 pb-6">
          {variants.length > 0 ? (
            <VariantsDetailTable
              variants={variants}
              useVariants={useVariants}
              shopSettings={shopSettings}
              formData={formData}
              onVariantChange={(indexOrId, field, value) => {
                handleVariantChange(indexOrId, field, value)
              }}
              onWeightChange={(indexOrId, value) => {
                handleWeightChange(indexOrId, value)
              }}
              onInventoryChange={(indexOrId, value) => {
                handleInventoryChange(indexOrId, value)
              }}
              onInventoryBlur={(indexOrId, value) => {
                handleInventoryBlur(indexOrId, value)
              }}
              onPriceChange={(indexOrId, currencyId, value) => {
                handlePriceInputChange(indexOrId, currencyId, value)
              }}
              onOriginalPriceChange={(indexOrId, currencyId, value) => {
                handleOriginalPriceInputChange(indexOrId, currencyId, value)
              }}
              onImageUpload={(indexOrId) => {
                handleImageUpload(indexOrId)
              }}
              onImageRemove={(indexOrId, imageIndex) => {
                handleRemoveVariantImage(indexOrId, imageIndex)
              }}
              onProductImageRemove={(imageIndex: number) => {
                setFormData((prev) => ({ ...prev, imageUrls: prev.imageUrls!.filter((_, i) => i !== imageIndex) }))
              }}
              mode={mode}
            />
          ) : (
            <div className="text-center py-4">No hay variantes disponibles para este producto.</div>
          )}
        </div>
      </div>
    )
  }

  const renderStep3 = () => (
    <div className="box-container h-fit">
      <div className="box-section flex flex-col justify-start items-start ">
        <h3>Información Adicional</h3>
        <span className="content-font text-gray-500">Actualice metadatos para SEO.</span>
      </div>
      <div className="box-section border-none flex flex-col gap-8 pb-6">
        <div className="flex flex-col w-full">
          <div className="space-y-3">
            <Label htmlFor="metaTitle">Meta Título</Label>
            <Input
              id="metaTitle"
              name="metaTitle"
              value={formData.metaTitle || ""}
              onChange={handleChange}
              placeholder="Ingrese el meta título para SEO"
              className="w-full bg-muted/20"
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="metaDescription">Meta Descripción</Label>
            <Textarea
              id="metaDescription"
              name="metaDescription"
              value={formData.metaDescription || ""}
              onChange={handleChange}
              placeholder="Ingrese la meta descripción para SEO"
              rows={4}
              className="w-full bg-muted/20"
            />
          </div>
        </div>
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex flex-col w-full p-6 space-y-4">
        <div className="flex justify-center items-center p-4 bg-sky-50 dark:bg-sky-950/20 rounded-lg border border-sky-100 dark:border-sky-900/50 animate-pulse">
          <Loader2 className="h-8 w-8 animate-spin text-sky-600 mr-3" />
          <div>
            <p className="font-medium text-sky-700 dark:text-sky-400">
              {mode === 'edit' ? 'Cargando producto' : 'Inicializando formulario'}
            </p>
            <p className="text-sm text-sky-600/70 dark:text-sky-500/70">Esto puede tomar unos momentos...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <p className="text-destructive font-medium">Error: {error}</p>
        <Button onClick={() => router.push("/products")} className="mt-4">
          Volver a productos
        </Button>
      </div>
    )
  }

  return (
    <div className="text-foreground">
      <header className="sticky top-0 z-10 flex items-center justify-between h-[57px] border-b border-border bg-background px-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            className={cn(
              "text-muted-foreground hover:text-foreground h-[57px] rounded-none px-8",
              currentStep === 1 && "text-foreground border-b-[3px] pt-[10px] border-sky-600 ",
            )}
            onClick={() => setCurrentStep(1)}
          >
            <PackageIcon className="text-foreground mr-2" />
            Detalles
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "text-muted-foreground hover:text-foreground h-[57px] rounded-none px-8",
              currentStep === 2 && "text-foreground border-b-[3px] pt-[10px] border-sky-600 ",
            )}
            onClick={() => setCurrentStep(2)}
          >
            <CircleDollarSign className="text-foreground mr-2" />
            Precios
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "text-muted-foreground hover:text-foreground h-[57px] rounded-none px-8",
              currentStep === 3 && "text-foreground border-b-[3px] pt-[10px] border-sky-600 ",
            )}
            onClick={() => setCurrentStep(3)}
          >
            <Info className="text-foreground mr-2" />
            Adicional
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <JsonViewer 
            jsonData={{
              payload: generatePayload()
            }}
            jsonLabel="Payload al Backend"
            triggerClassName="border-border text-muted-foreground hover:bg-accent"
          />
          <Button
            variant="outline"
            onClick={() => setCurrentStep(currentStep > 1 ? currentStep - 1 : currentStep)}
            disabled={currentStep === 1 || isSubmitting}
            className="border-border text-muted-foreground hover:bg-accent"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentStep(currentStep < 3 ? currentStep + 1 : currentStep)}
            disabled={currentStep === 3 || isSubmitting}
            className="border-border text-muted-foreground hover:bg-accent"
          >
            Siguiente <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button 
            onClick={handleSubmit} 
            className="create-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{mode === 'create' ? 'Creando...' : 'Actualizando...'}</>
            ) : (
              mode === 'create' ? 'Crear Producto' : 'Actualizar Producto'
            )}
          </Button>
        </div>
      </header>
      <ScrollArea className="h-[calc(100vh-3.6em)]">
        <div className="p-6">
          {currentStep === 1 ? renderStep1() : currentStep === 2 ? renderStep2() : renderStep3()}
        </div>
      </ScrollArea>
    </div>
  )
}
