"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { useMainStore } from "@/stores/mainStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import type { UpdateProductDto, ProductOption } from "@/types/product"
import type { UpdateProductVariantDto } from "@/types/productVariant"
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
import { DescriptionEditor } from "../../_components/RichTextEditor"
import { ImageGallery } from "../../_components/ImageGallery"
import Image from "next/image"
import { getImageUrl } from "@/lib/imageUtils"
import { slugify } from "@/lib/slugify"
import { MultiSelect } from "@/components/ui/multi-select"
import type React from "react"
import { Textarea } from "@/components/ui/textarea"
import { VariantOptions } from "../../_components/VariantOptions"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { uploadImage } from "@/app/actions/upload-file"
import { JsonViewer } from "@/components/json-viewer"

interface VariantCombination {
  id: string
  enabled: boolean
  attributes: Record<string, string>
}

const areEqual = (array1: any[], array2: any[]) => {
  return JSON.stringify(array1) === JSON.stringify(array2)
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Función para redondear precios a 2 decimales
  const roundPrice = (price: number): number => {
    return Math.round(price * 100) / 100
  }
  const [productData, setProductData] = useState<any>(null)
  const [storeData, setStoreData] = useState<any>(null)
  const resolvedParams = use(params)

  // Get all the necessary functions from the store
  const {
    currentStore,
    updateProduct,
    categories,
    collections,
    fetchCategoriesByStore,
    fetchCollectionsByStore,
    fetchShopSettings,
    shopSettings,
    fetchExchangeRates,
    exchangeRates,
    fetchProductById,
    currencies,
    fetchCurrencies,
  } = useMainStore()
  const [currentStep, setCurrentStep] = useState(1)
  const [useVariants, setUseVariants] = useState(false)
  const [variants, setVariants] = useState<UpdateProductVariantDto[]>([])
  const [formData, setFormData] = useState<UpdateProductDto>({})
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false)
  const [productOptions, setProductOptions] = useState<ProductOption[]>([])
  const [variantCombinations, setVariantCombinations] = useState<VariantCombination[]>([])
  const [hasFetched, setHasFetched] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (hasFetched) return
      setIsLoading(true)
      setError(null)

      try {
        // Get the current store ID from Zustand or localStorage
        let storeId = useMainStore.getState().currentStore
        
        // Si no hay currentStore en Zustand, intentar obtenerlo de localStorage
        if (!storeId && typeof window !== "undefined") {
          storeId = localStorage.getItem("currentStoreId")
          
          // Actualizar el estado de Zustand con el storeId restaurado
          if (storeId) {
            useMainStore.getState().setCurrentStore(storeId)
          }
        }
        
        setStoreData({ storeId })

        if (!storeId) {
          throw new Error("No store selected. Please select a store from the sidebar.")
        }

        // Fetch basic data first
        await Promise.all([
          fetchCategoriesByStore(storeId),
          fetchCollectionsByStore(storeId),
          fetchShopSettings(),
          fetchExchangeRates(),
          fetchCurrencies(),
        ])

        // Fetch the specific product by ID directly
        const product = await fetchProductById(storeId, resolvedParams.id)

        if (product) {
          setProductData(product)

          setFormData({
            ...product,
            categoryIds: product.categories?.map((c) => c.id) || [],
            collectionIds: product.collections?.map((c) => c.id) || [],
            // Ensure new schema fields have default values if not present
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

          // Extract product options and set up variantCombinations
          const options = extractProductOptions(productVariants)
          setProductOptions(options)

          // Generate variant combinations based on options
          if (options.length > 0) {
            const combinations = generateVariantCombinationsFromOptions(options, productVariants)
            setVariantCombinations(combinations)
          }
        } else {
          setError("Product not found")
          toast({
            variant: "destructive",
            title: "Error",
            description: "Producto no encontrado",
          })
          router.push("/products")
        }
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message)
        } else {
          setError("Unknown error occurred")
        }
        toast({
          variant: "destructive",
          title: "Error",
          description: "Error al cargar los datos del producto",
        })
      } finally {
        setIsLoading(false)
        setHasFetched(true)
      }
    }

    fetchData()
  }, [
    resolvedParams.id,
    fetchCategoriesByStore,
    fetchCollectionsByStore,
    fetchShopSettings,
    fetchExchangeRates,
    fetchCurrencies,
    fetchProductById,
    toast,
    router,
    hasFetched,
    currentStore,
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

    return combinations.map((combo) => {
      // Check if this combination already exists in current variants
      const existingVariant = existingVariants.find((v) =>
        v.attributes
          ? Object.entries(combo).every(([key, value]) => v.attributes && v.attributes[key] === value)
          : false,
      )

      return {
        id: existingVariant?.id || `variant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        enabled: !!existingVariant, // Enabled if it already exists
        attributes: combo,
      }
    })
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
    const options = Object.entries(optionsMap).map(([title, values]) => ({
      title,
      values: Array.from(values),
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

  const handleVariantChange = (index: number, field: keyof UpdateProductVariantDto, value: any) => {
    setVariants((prev) => {
      const newVariants = [...prev]
      newVariants[index] = { ...newVariants[index], [field]: value }
      return newVariants
    })
  }

  // Helper para cambios de peso - permite decimales y valores >= 0
  const handleWeightChange = (index: number, inputValue: string) => {
    // Si el input está vacío, guardamos undefined en lugar de 0
    if (inputValue === "" || inputValue === null || inputValue === undefined) {
      handleVariantChange(index, "weightValue", undefined)
      return
    }
    
    const value = Number(inputValue)
    if (!isNaN(value) && value >= 0) {
      handleVariantChange(index, "weightValue", value)
    }
  }

  // Helper para cambios de inventario - solo enteros >= 0, permite vacío temporalmente
  const handleInventoryChange = (index: number, inputValue: string) => {
    const value = inputValue === "" ? "" : Number(inputValue)
    if (value === "" || (value >= 0 && Number.isInteger(value))) {
      handleVariantChange(index, "inventoryQuantity", value === "" ? "" : value)
    }
  }

  // Helper para restaurar inventario a 0 si está vacío al perder foco
  const handleInventoryBlur = (index: number, inputValue: string) => {
    if (inputValue === "" || inputValue === null) {
      handleVariantChange(index, "inventoryQuantity", 0)
    }
  }

  const handleVariantPriceChange = (index: number, currencyId: string, price: number) => {
    setVariants((prev) => {
      const newVariants = prev.map((v, i) => {
        if (i === index) {
          const newPrices = (v.prices || []).filter((p) => p.currencyId !== currencyId)
          newPrices.push({ currencyId, price })

          const baseCurrency = shopSettings?.[0]?.defaultCurrency
          if (baseCurrency && baseCurrency.id === currencyId) {
            exchangeRates.forEach((er) => {
              if (er.fromCurrencyId === baseCurrency.id) {
                const existingPrice = newPrices.find((p) => p.currencyId === er.toCurrencyId)
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
        return v
      })

      return areEqual(newVariants, prev) ? prev : newVariants
    })
  }

  const handleImageUpload = async (variantIndex: number) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    // NO multiple - solo una imagen a la vez
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const { success, presignedUrl, fileUrl, error } = await uploadImage(currentStore || '', file.name, file.type)
        if (!success || !presignedUrl) {
          toast({
            variant: "destructive",
            title: "Error",
            description: `Failed to upload ${file.name}`,
          })
          return
        }

        // Sube el archivo directamente a R2 usando la presigned URL
        const uploadResponse = await fetch(presignedUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
        })

        if (!uploadResponse.ok) {
          toast({
            variant: "destructive",
            title: "Error",
            description: `Failed to upload ${file.name}`,
          })
          return
        }

        // Agregar la nueva imagen al array de imageUrls
        if (useVariants) {
          setVariants((prev) =>
            prev.map((v, index) =>
              index === variantIndex ? { ...v, imageUrls: [...(v.imageUrls || []), fileUrl] } : v,
            ),
          )
        } else {
          setFormData((prev) => ({ ...prev, imageUrls: [...prev.imageUrls || [], fileUrl] }))
        }

        toast({
          title: "Imagen subida",
          description: "La imagen se subió correctamente",
        })
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to upload ${file.name}`,
        })
      }
    }
    input.click()
  }

  const handleRemoveVariantImage = (variantIndex: number, imageIndex: number) => {
    setVariants((prev) =>
      prev.map((v, vIndex) => {
        if (vIndex === variantIndex) {
          const updatedImages = [...(v.imageUrls || [])]
          updatedImages.splice(imageIndex, 1)
          return { ...v, imageUrls: updatedImages }
        }
        return v
      }),
    )
  }

  // Prepare payload for debugging
  const getPayloadData = () => {
    // Calculate what would be sent as PATCH data
    const calculatePatchData = () => {
      const patchData: Partial<UpdateProductDto> = {}
      
      // Check if basic product fields have changed
      if (formData.title !== productData?.title) {
        patchData.title = formData.title
      }
      if (formData.description !== productData?.description) {
        patchData.description = formData.description
      }
      if (formData.slug !== productData?.slug) {
        patchData.slug = formData.slug
      }
      if (formData.vendor !== productData?.vendor) {
        patchData.vendor = formData.vendor
      }
      if (formData.status !== productData?.status) {
        patchData.status = formData.status
      }
      if (formData.allowBackorder !== productData?.allowBackorder) {
        patchData.allowBackorder = formData.allowBackorder
      }
      if (formData.restockNotify !== productData?.restockNotify) {
        patchData.restockNotify = formData.restockNotify
      }
      if (formData.restockThreshold !== productData?.restockThreshold) {
        patchData.restockThreshold = formData.restockThreshold
      }
      if (formData.metaTitle !== productData?.metaTitle) {
        patchData.metaTitle = formData.metaTitle
      }
      if (formData.metaDescription !== productData?.metaDescription) {
        patchData.metaDescription = formData.metaDescription
      }
      // Compare releaseDate properly (Date vs string)
      const currentReleaseDate = productData?.releaseDate ? new Date(productData.releaseDate).toISOString() : null
      const newReleaseDate = formData.releaseDate ? formData.releaseDate.toISOString() : null
      if (currentReleaseDate !== newReleaseDate) {
        patchData.releaseDate = formData.releaseDate
      }
      
      // Check if imageUrls have changed
      const currentImageUrls = productData?.imageUrls || []
      const newImageUrls = formData.imageUrls || []
      if (JSON.stringify(currentImageUrls) !== JSON.stringify(newImageUrls)) {
        patchData.imageUrls = newImageUrls
      }
      
      // Check if categories have changed
      const currentCategoryIds = productData?.categories?.map((c: any) => c.id) || []
      const newCategoryIds = formData.categoryIds || []
      if (JSON.stringify(currentCategoryIds.sort()) !== JSON.stringify(newCategoryIds.sort())) {
        patchData.categoryIds = newCategoryIds
      }
      
      // Check if collections have changed
      const currentCollectionIds = productData?.collections?.map((c: any) => c.id) || []
      const newCollectionIds = formData.collectionIds || []
      if (JSON.stringify(currentCollectionIds.sort()) !== JSON.stringify(newCollectionIds.sort())) {
        patchData.collectionIds = newCollectionIds
      }
      
      // Check if variants have changed
      const currentVariants = productData?.variants || []
      const variantsChanged = JSON.stringify(currentVariants) !== JSON.stringify(variants)
      if (variantsChanged) {
        patchData.variants = variants
      }
      
      return patchData
    }

    const patchData = calculatePatchData()

    return {
      // PATCH payload (only changed fields)
      patchPayload: patchData,
      patchFieldsCount: Object.keys(patchData).length,
      patchFields: Object.keys(patchData),
      
      // Original product data for comparison
      originalProduct: {
        title: productData?.title,
        description: productData?.description,
        slug: productData?.slug,
        vendor: productData?.vendor,
        status: productData?.status,
        imageUrls: productData?.imageUrls,
        categories: productData?.categories?.map((c: any) => c.id),
        collections: productData?.collections?.map((c: any) => c.id),
        variantsCount: productData?.variants?.length || 0
      },
      
      // Current form data
      currentFormData: {
        title: formData.title,
        description: formData.description,
        slug: formData.slug,
        vendor: formData.vendor,
        status: formData.status,
        imageUrls: formData.imageUrls,
        categoryIds: formData.categoryIds,
        collectionIds: formData.collectionIds,
        variantsCount: variants.length
      },
      
      // Shop settings and currencies info
      shopSettings: {
        loaded: shopSettings?.length > 0,
        count: shopSettings?.length || 0,
        firstShop: shopSettings?.[0] ? {
          id: shopSettings[0].id,
          name: shopSettings[0].name,
          acceptedCurrenciesCount: shopSettings[0].acceptedCurrencies?.length || 0,
          acceptedCurrencies: shopSettings[0].acceptedCurrencies || []
        } : null
      },
      
      // Variants with detailed price info
      variantsDebug: variants.map(v => ({
        id: v.id,
        title: v.title,
        sku: v.sku,
        isActive: v.isActive,
        inventoryQuantity: v.inventoryQuantity,
        pricesCount: v.prices?.length || 0,
        prices: v.prices || [],
        attributes: v.attributes
      })),
      
      // Current step and form state
      formState: {
        currentStep,
        useVariants,
        hasFetched,
        isSlugManuallyEdited
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Create a minimal payload with only changed fields
      const patchData: Partial<UpdateProductDto> = {}
      
      // Check if basic product fields have changed
      if (formData.title !== productData?.title) {
        patchData.title = formData.title
      }
      if (formData.description !== productData?.description) {
        patchData.description = formData.description
      }
      if (formData.slug !== productData?.slug) {
        patchData.slug = formData.slug
      }
      if (formData.vendor !== productData?.vendor) {
        patchData.vendor = formData.vendor
      }
      if (formData.status !== productData?.status) {
        patchData.status = formData.status
      }
      if (formData.allowBackorder !== productData?.allowBackorder) {
        patchData.allowBackorder = formData.allowBackorder
      }
      if (formData.restockNotify !== productData?.restockNotify) {
        patchData.restockNotify = formData.restockNotify
      }
      if (formData.restockThreshold !== productData?.restockThreshold) {
        patchData.restockThreshold = formData.restockThreshold
      }
      if (formData.metaTitle !== productData?.metaTitle) {
        patchData.metaTitle = formData.metaTitle
      }
      if (formData.metaDescription !== productData?.metaDescription) {
        patchData.metaDescription = formData.metaDescription
      }
      // Compare releaseDate properly (Date vs string)
      const currentReleaseDate = productData?.releaseDate ? new Date(productData.releaseDate).toISOString() : null
      const newReleaseDate = formData.releaseDate ? formData.releaseDate.toISOString() : null
      if (currentReleaseDate !== newReleaseDate) {
        patchData.releaseDate = formData.releaseDate
      }
      
      // Check if imageUrls have changed
      const currentImageUrls = productData?.imageUrls || []
      const newImageUrls = formData.imageUrls || []
      if (JSON.stringify(currentImageUrls) !== JSON.stringify(newImageUrls)) {
        patchData.imageUrls = newImageUrls
      }
      
      // Check if categories have changed
      const currentCategoryIds = productData?.categories?.map((c: any) => c.id) || []
      const newCategoryIds = formData.categoryIds || []
      if (JSON.stringify(currentCategoryIds.sort()) !== JSON.stringify(newCategoryIds.sort())) {
        patchData.categoryIds = newCategoryIds
      }
      
      // Check if collections have changed
      const currentCollectionIds = productData?.collections?.map((c: any) => c.id) || []
      const newCollectionIds = formData.collectionIds || []
      if (JSON.stringify(currentCollectionIds.sort()) !== JSON.stringify(newCollectionIds.sort())) {
        patchData.collectionIds = newCollectionIds
      }
      
      // Check if variants have changed
      const currentVariants = productData?.variants || []
      const variantsChanged = JSON.stringify(currentVariants) !== JSON.stringify(variants)
      if (variantsChanged) {
        // Clean variants data before sending (remove database fields and fix decimal precision)
        const cleanVariants = variants.map(variant => {
          const cleanVariant = {
            ...(variant.id && { id: variant.id }), // Only include id if it exists (for updates)
            title: variant.title,
            sku: variant.sku,
            isActive: variant.isActive,
            attributes: variant.attributes,
            inventoryQuantity: variant.inventoryQuantity,
            position: variant.position,
            imageUrls: variant.imageUrls || [],
            prices: variant.prices?.map((price: any) => ({
              ...(price.id && { id: price.id }), // Only include id if it exists (for updates)
              currencyId: price.currencyId,
              price: Math.round(price.price * 100) / 100, // Fix decimal precision to 2 places
              originalPrice: price.originalPrice ? Math.round(price.originalPrice * 100) / 100 : null
            })) || []
          }
          
          // No enviar weightValue si es undefined o null
          if ((variant as any).weightValue !== undefined && (variant as any).weightValue !== null) {
            (cleanVariant as any).weightValue = (variant as any).weightValue
          }
          
          return cleanVariant
        })
        patchData.variants = cleanVariants
      }

      // Only send request if there are changes
      if (Object.keys(patchData).length === 0) {
        toast({
          title: "Sin cambios",
          description: "No se detectaron cambios para actualizar",
        })
        return
      }

      await updateProduct(resolvedParams.id, patchData)
      
      toast({
        title: "Éxito",
        description: "Producto actualizado correctamente",
      })
      router.push("/products")
    } catch (error: any) {
      // Get specific error message from the API response
      let errorMessage = "Error al actualizar el producto"
      
      if (error?.response?.data?.message) {
        // If it's an array of validation errors, join them
        if (Array.isArray(error.response.data.message)) {
          errorMessage = error.response.data.message.join(", ")
        } else {
          errorMessage = error.response.data.message
        }
      }
      
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      })
    }
  }

  // Update variants when options or combinations change
  useEffect(() => {
    if (!hasFetched) return

    if (useVariants && variantCombinations.length > 0) {
      const enabledCombinations = variantCombinations.filter((v) => v.enabled)

      // Map enabled combinations to variants
      const newVariants = enabledCombinations.map((combo, index) => {
        // Check if a variant with these attributes already exists
        const existingVariant = variants.find((v) =>
          v.attributes && combo.attributes
            ? Object.entries(combo.attributes).every(([key, value]) => v.attributes && v.attributes[key] === value)
            : false,
        )

        if (!existingVariant) {
          // Create a new variant
          return {
            title: combo.attributes ? Object.values(combo.attributes).join(" / ") : `Variant ${index}`,
            sku: "",
            imageUrls: [],
            inventoryQuantity: 0,
            weightValue: undefined,
            prices: [], // Ensure prices is initialized
            attributes: combo.attributes || {},
            isActive: true,
            position: index,
          }
        } else {
          return existingVariant
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
                <Switch
                  checked={formData.status === ProductStatus.ACTIVE}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: checked ? ProductStatus.ACTIVE : ProductStatus.DRAFT,
                    }))
                  }
                />
                <span className="text-sm font-medium">
                  {formData.status === ProductStatus.ACTIVE ? (
                    <Badge className="bg-emerald-500">Activo</Badge>
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
                  <Input value={formData.slug || ""} onChange={handleSlugChange} />
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
                      onSelect={(date) => setFormData((prev) => ({ ...prev, releaseDate: date || undefined }))}
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
                onChange={(content) => setFormData((prev) => ({ ...prev, description: content }))}
              />
            </div>

            <div className="space-y-3">
              <Label>Media</Label>
              <ImageGallery
                images={formData.imageUrls || []}
                onChange={(newImages) => setFormData((prev) => ({ ...prev, imageUrls: newImages }))}
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="p-0  pl-6 w-[500px] ">Nombre</TableHead>
                <TableHead className="pl-2 w-[250px]">SKU</TableHead>
                <TableHead className="pl-2 w-[100px]">Peso</TableHead>
                <TableHead className="pl-2 w-[100px]">Cantidad</TableHead>
                {shopSettings?.[0]?.acceptedCurrencies?.map((currency) => (
                  <TableHead className="p-0 pl-2 w-[100px]" key={currency.id}>
                    Precio ({currency.code})
                  </TableHead>
                ))}
                {useVariants && <TableHead className="p-0 pl-2">Atributos</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.map((variant, index) => (
                <TableRow key={index} className={variant.isActive ? "" : "opacity-50"}>
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-1">
                      {/* Imagen principal grande + grilla pequeña */}
                      <div className="flex items-start gap-2 mr-2">
                        {/* Imagen principal grande */}
                        <div className="relative w-12 h-12 bg-accent rounded-md">
                          {useVariants ? (
                            variant.imageUrls && variant.imageUrls.length > 0 ? (
                              <>
                                <Image
                                  src={getImageUrl(variant.imageUrls[0]) || "/placeholder.svg"}
                                  alt={variant.title || "Product variant"}
                                  layout="fill"
                                  objectFit="cover"
                                  className="rounded-md"
                                />
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRemoveVariantImage(index, 0)
                                  }}
                                  variant="ghost"
                                  size="icon"
                                  className="absolute -top-1 -right-1 h-4 w-4 bg-background/80 rounded-full hover:bg-background"
                                >
                                  <X className="w-2 h-2" />
                                </Button>
                              </>
                            ) : (
                              <Button onClick={() => handleImageUpload(index)} variant="ghost" className="w-full h-full">
                                <ImagePlus className="w-5 h-5 text-gray-500" />
                              </Button>
                            )
                          ) : formData.imageUrls && formData.imageUrls.length > 0 ? (
                            <>
                              <Image
                                src={getImageUrl(formData.imageUrls[0]) || "/placeholder.svg"}
                                alt={variant.title || "Product variant"}
                                layout="fill"
                                objectFit="cover"
                                className="rounded-md"
                              />
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setFormData((prev) => ({ ...prev, imageUrls: prev.imageUrls!.slice(1) }))
                                }}
                                variant="ghost"
                                size="icon"
                                className="absolute -top-1 -right-1 h-4 w-4 bg-background/80 rounded-full hover:bg-background"
                              >
                                <X className="w-2 h-2" />
                              </Button>
                            </>
                          ) : (
                            <Button onClick={() => handleImageUpload(index)} variant="ghost" className="w-full h-full">
                              <ImagePlus className="w-5 h-5 text-gray-500" />
                            </Button>
                          )}
                        </div>

                        {/* Grilla de imágenes pequeñas */}
                        <div className="flex flex-wrap gap-1 w-fit">
                          {useVariants ? (
                            // Para productos con variantes: máximo 4 adicionales = 5 total
                            variant.imageUrls &&
                              variant.imageUrls.slice(1, 5).map((imageUrl, imageIndex) => (
                                <div key={imageIndex + 1} className="relative w-6 h-6 bg-accent rounded">
                                  <Image
                                    src={getImageUrl(imageUrl) || "/placeholder.svg"}
                                    alt={`${variant.title} - ${imageIndex + 2}`}
                                    layout="fill"
                                    objectFit="cover"
                                    className="rounded"
                                  />
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleRemoveVariantImage(index, imageIndex + 1)
                                    }}
                                    variant="ghost"
                                    size="icon"
                                    className="absolute -top-1 -right-1 h-3 w-3 bg-background/80 rounded-full hover:bg-background p-0"
                                  >
                                    <X className="w-1.5 h-1.5" />
                                  </Button>
                                </div>
                              ))
                          ) : (
                            // Para productos simples: máximo 9 adicionales = 10 total
                            formData.imageUrls &&
                              formData.imageUrls.slice(1, 10).map((imageUrl, imageIndex) => (
                                <div key={imageIndex + 1} className="relative w-6 h-6 bg-accent rounded">
                                  <Image
                                    src={getImageUrl(imageUrl) || "/placeholder.svg"}
                                    alt={`${variant.title} - ${imageIndex + 2}`}
                                    layout="fill"
                                    objectFit="cover"
                                    className="rounded"
                                  />
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setFormData((prev) => ({ 
                                        ...prev, 
                                        imageUrls: prev.imageUrls!.filter((_, i) => i !== imageIndex + 1)
                                      }))
                                    }}
                                    variant="ghost"
                                    size="icon"
                                    className="absolute -top-1 -right-1 h-3 w-3 bg-background/80 rounded-full hover:bg-background p-0"
                                  >
                                    <X className="w-1.5 h-1.5" />
                                  </Button>
                                </div>
                              ))
                          )}

                          {/* Botón para agregar más imágenes */}
                          {((useVariants && (!variant.imageUrls || variant.imageUrls.length < 5)) ||
                            (!useVariants && (!formData.imageUrls || formData.imageUrls.length < 10))) && (
                            <Button
                              onClick={() => handleImageUpload(index)}
                              variant="ghost"
                              size="icon"
                              className="w-6 h-6 border-2 border-dashed border-muted-foreground/25 rounded hover:border-muted-foreground/50"
                            >
                              <Plus className="w-2 h-2 text-muted-foreground" />
                            </Button>
                          )}
                        </div>
                      </div>

                      <Input
                        value={variant.title || ""}
                        onChange={(e) => handleVariantChange(index, "title", e.target.value)}
                        className="border-0 p-2"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={variant.sku || ""}
                      onChange={(e) => handleVariantChange(index, "sku", e.target.value)}
                      className="border-0 p-2"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={variant.weightValue === undefined ? "" : variant.weightValue}
                      onChange={(e) => handleWeightChange(index, e.target.value)}
                      onBlur={(e) => {
                        if (e.target.value === "" || e.target.value === null || e.target.value === undefined) {
                          handleWeightChange(index, "")
                        }
                      }}
                      className="border-0 p-2"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={variant.inventoryQuantity ?? ""}
                      onChange={(e) => handleInventoryChange(index, e.target.value)}
                      onBlur={(e) => handleInventoryBlur(index, e.target.value)}
                      placeholder="0"
                      className="border-0 p-2"
                    />
                  </TableCell>
                  {shopSettings?.[0]?.acceptedCurrencies?.map((currency) => (
                    <TableCell key={currency.id}>
                      <Input
                        type="number"
                        step="1"
                        value={variant.prices?.find((p) => p.currencyId === currency.id)?.price || ""}
                        onChange={(e) => handleVariantPriceChange(index, currency.id, Number(e.target.value))}
                        className="border-0 p-2"
                      />
                    </TableCell>
                  ))}
                  {useVariants && (
                    <TableCell>
                      <div className="flex flex-wrap gap-1 text-sm">
                        {variant.attributes &&
                          Object.entries(variant.attributes).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-1">
                              <span className="text-muted-foreground">{key}:</span>
                              <span className="font-medium">{value}</span>
                            </div>
                          ))}
                      </div>
                    </TableCell> 
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
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

  // Simple debug panel to show raw data
 

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
            jsonData={getPayloadData()} 
            jsonLabel="Debug Payload"
            triggerClassName="border-border text-muted-foreground hover:bg-accent"
          />
          <Button
            variant="outline"
            onClick={() => setCurrentStep(currentStep > 1 ? currentStep - 1 : currentStep)}
            disabled={currentStep === 1}
            className="border-border text-muted-foreground hover:bg-accent"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentStep(currentStep < 3 ? currentStep + 1 : currentStep)}
            disabled={currentStep === 3}
            className="border-border text-muted-foreground hover:bg-accent"
          >
            Siguiente <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button onClick={handleSubmit} className="create-button">
            Actualizar Producto
          </Button>
        </div>
      </header>
      <ScrollArea className="h-[calc(100vh-3.6em)]">
        <div className="p-6">
          {isLoading ? (
            <div className="flex flex-col w-full p-6 space-y-4">
              <div className="flex justify-center items-center p-4 bg-sky-50 dark:bg-sky-950/20 rounded-lg border border-sky-100 dark:border-sky-900/50 animate-pulse">
                <Loader2 className="h-8 w-8 animate-spin text-sky-600 mr-3" />
                <div>
                  <p className="font-medium text-sky-700 dark:text-sky-400">Cargando producto</p>
                  <p className="text-sm text-sky-600/70 dark:text-sky-500/70">Esto puede tomar unos momentos...</p>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-8">
              <p className="text-destructive font-medium">Error: {error}</p>
              <Button onClick={() => router.push("/products")} className="mt-4">
                Volver a productos
              </Button>
            </div>
          ) : (
            <>
              {currentStep === 1 ? renderStep1() : currentStep === 2 ? renderStep2() : renderStep3()}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
