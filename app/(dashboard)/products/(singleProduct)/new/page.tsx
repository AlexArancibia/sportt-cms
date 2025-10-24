"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useMainStore } from "@/stores/mainStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import type { CreateProductDto, ProductOption } from "@/types/product"
import { ProductStatus } from "@/types/common"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, ArrowRight, PackageIcon, CircleDollarSign, ImagePlus, Info, X, Calendar, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { DescriptionEditor } from "../_components/RichTextEditor"
import { ImageGallery } from "../_components/ImageGallery"
import { VariantOptions } from "../_components/VariantOptions"
import Image from "next/image"
import { getImageUrl } from "@/lib/imageUtils"
import { slugify } from "@/lib/slugify"
import { MultiSelect } from "@/components/ui/multi-select"
import type React from "react"
import { Textarea } from "@/components/ui/textarea"
import { uploadImage } from "@/app/actions/upload-file"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import type { CreateProductVariantDto } from "@/types/productVariant"
import { useVariantHandlers } from "../../_hooks/useVariantHandlers"
import { useProductImageUpload } from "../../_hooks/useProductImageUpload"
import { VariantImageGallery } from "../../_components/shared/VariantImageGallery"
import { useProductValidation } from "../../_hooks/useProductValidation"

interface VariantCombination {
  id: string
  enabled: boolean
  attributes: Record<string, string>
}

export default function NewProductPage() {
  const router = useRouter()
  const {
    createProduct,
    categories,
    collections,
    fetchCategoriesByStore,
    fetchCollectionsByStore,
    fetchShopSettingsByStore,
    shopSettings,
    fetchExchangeRates,
    exchangeRates,
    fetchProductsByStore,
    currentStore,
  } = useMainStore()
  const { toast } = useToast()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [useVariants, setUseVariants] = useState(false)
  const [variants, setVariants] = useState<CreateProductVariantDto[]>([
    {
      title: "Producto Simple",
      sku: "",
      imageUrls: [],
      inventoryQuantity: 0,
      weightValue: undefined,
      prices: [],
      attributes: {},
      isActive: true,
      position: 0,
    },
  ])
  const [formData, setFormData] = useState<CreateProductDto>({
    title: "",
    description: "",
    slug: "",
    vendor: "",
    status: ProductStatus.ACTIVE,
    categoryIds: [],
    collectionIds: [],
    imageUrls: [],
    variants: [],
    metaTitle: "",
    metaDescription: "",
    storeId: currentStore || "",
    allowBackorder: false,
    restockThreshold: 5,
    restockNotify: true,
    releaseDate: undefined,
  })
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false)
  const [productOptions, setProductOptions] = useState<ProductOption[]>([])
  const [variantCombinations, setVariantCombinations] = useState<VariantCombination[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Usar hooks compartidos después de definir los estados
  const variantHandlers = useVariantHandlers(variants, setVariants)
  const imageUpload = useProductImageUpload(currentStore)
  const { validateProductWithToast } = useProductValidation()

  // Función para manejar cambios en inputs de precios con validación y redondeo
  const handlePriceInputChange = (index: number, currencyId: string, value: string) => {
    // Permitir solo números y máximo 2 decimales
    const decimalRegex = /^\d*\.?\d{0,2}$/
    if (decimalRegex.test(value) || value === "") {
      const numValue = Number(value)
      if (!isNaN(numValue)) {
        // Redondear automáticamente a 2 decimales
        variantHandlers.handlePriceChange(
          index,
          currencyId,
          variantHandlers.roundPrice(numValue),
          exchangeRates,
          shopSettings
        )
      }
    }
  }

  useEffect(() => {
    if (currentStore) {
      fetchData()
    }
  }, [currentStore])

  // Update storeId in formData when currentStore changes
  useEffect(() => {
    if (currentStore) {
      setFormData((prev) => ({ ...prev, storeId: currentStore }))
    }
  }, [currentStore])

  const fetchData = async () => {
    // Get store ID from Zustand or localStorage
    let storeId = currentStore
    
    if (!storeId && typeof window !== "undefined") {
      storeId = localStorage.getItem("currentStoreId")
      if (storeId) {
        useMainStore.getState().setCurrentStore(storeId)
      }
    }
    
    if (!storeId) return

    setIsLoading(true)
    try {
      await Promise.all([
        fetchCategoriesByStore(storeId),
        fetchCollectionsByStore(storeId),
        fetchShopSettingsByStore(storeId),
        fetchExchangeRates(),
        fetchProductsByStore(storeId, { limit: 100 }),
      ])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load initial data. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => {
      const newData = { ...prev, [name]: value }
      if (name === "title" && !isSlugManuallyEdited) {
        newData.slug = slugify(value)
        // Actualizar el título de la variante para productos simples
        if (!useVariants) {
          setVariants((prev) => [{ ...prev[0], title: value }])
        }
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

  // Función para subir una imagen usando el hook compartido
  const handleImageUpload = (variantIndex: number) => {
    const maxImages = useVariants ? 5 : 10
    const currentCount = useVariants
      ? variants[variantIndex]?.imageUrls?.length || 0
      : formData.imageUrls.length

    imageUpload.handleImageUpload((fileUrl) => {
      if (useVariants) {
        setVariants((prev) =>
          prev.map((v, index) =>
            index === variantIndex ? { ...v, imageUrls: [...(v.imageUrls || []), fileUrl] } : v
          )
        )
      } else {
        setFormData((prev) => ({ ...prev, imageUrls: [...prev.imageUrls, fileUrl] }))
      }
    }, maxImages, currentCount)
  }

  // Función para eliminar una imagen específica de una variante
  const handleRemoveVariantImage = (variantIndex: number, imageIndex: number) => {
    setVariants((prev) =>
      prev.map((v, vIndex) => {
        if (vIndex === variantIndex) {
          const updatedImages = [...(v.imageUrls || [])]
          updatedImages.splice(imageIndex, 1)
          return { ...v, imageUrls: updatedImages }
        }
        return v
      })
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentStore) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No store selected. Please select a store first.",
      })
      return
    }

    // Validar el producto antes de enviar
    const { products, shopSettings } = useMainStore.getState()
    const isValid = validateProductWithToast(
      formData,
      variants,
      products,
      undefined, // No hay ID actual porque es un producto nuevo
      shopSettings
    )

    if (!isValid) {
      return
    }

    try {
      const productData = {
        ...formData,
        // Remover storeId del body - el backend lo obtiene de la URL
        variants: variants.map((v) => {
          const variant = {
            ...v,
            attributes: useVariants ? v.attributes : { type: "simple" },
            // Solo enviar sku si tiene valor válido, no cadena vacía
            sku: v.sku && v.sku.trim() !== "" ? v.sku : undefined,
            // Aplicar redondeo a los precios para mantener precisión de 2 decimales
            prices: v.prices?.map((price: any) => ({
              ...price,
              price: variantHandlers.roundPrice(price.price),
              originalPrice: price.originalPrice ? variantHandlers.roundPrice(price.originalPrice) : undefined
            })) || []
          }
          
          // No enviar weightValue si es undefined o null
          if (variant.weightValue === undefined || variant.weightValue === null) {
            delete variant.weightValue
          }
          
          return variant
        }),
      }


      await createProduct(productData)
      toast({
        title: "Éxito",
        description: "Producto creado correctamente",
      })
      router.push("/products")
    } catch (error: any) {
      // Mostrar mensaje de error específico del backend
      let errorMessage = "Error al crear el producto"
      
      if (error?.response?.data?.message) {
        // Si es un array de errores de validación, unirlos
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

  // Función para limpiar precios de monedas no aceptadas
  const cleanInvalidPrices = (variantPrices: any[]) => {
    const acceptedCurrencyIds = shopSettings?.[0]?.acceptedCurrencies?.map(c => c.id) || []
    return variantPrices.filter(price => acceptedCurrencyIds.includes(price.currencyId))
  }

  useEffect(() => {
    if (useVariants) {
      const enabledVariants = variantCombinations.filter((v) => v.enabled)
      const newVariants: CreateProductVariantDto[] = enabledVariants.map((combo, index) => ({
        title: Object.values(combo.attributes).join(" / "),
        sku: "",
        imageUrls: [],
        inventoryQuantity: 0,
        weightValue: undefined,
        prices: [],
        attributes: combo.attributes,
        isActive: true,
        position: index,
      }))
      setVariants(newVariants)
    } else {
      // Para productos simples, crear una variante con precio por defecto
      const defaultPrices = shopSettings?.[0]?.defaultCurrency ? [
        {
          currencyId: shopSettings[0].defaultCurrency.id,
          price: 0
        }
      ] : []
      
      setVariants([
        {
          title: formData.title,
          sku: "",
          imageUrls: [],
          inventoryQuantity: 0,
          weightValue: undefined,
          prices: defaultPrices,
          attributes: { type: "simple" },
          isActive: true,
          position: 0,
        },
      ])
    }
  }, [useVariants, variantCombinations, formData.title, shopSettings])

  // Limpiar precios inválidos cuando cambien las shop settings
  useEffect(() => {
    if (shopSettings && shopSettings[0]?.acceptedCurrencies) {
      setVariants(prev => prev.map(variant => ({
        ...variant,
        prices: cleanInvalidPrices(variant.prices)
      })))
    }
  }, [shopSettings])

  // Show loading or store selection message if no store is selected
  if (!currentStore) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">No store selected</h2>
          <p className="text-muted-foreground mb-6">Please select a store before creating a product.</p>
          <Button onClick={() => router.push("/stores")}>Go to Stores</Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Loading...</h2>
          <p className="text-muted-foreground">Please wait while we load the product data.</p>
        </div>
      </div>
    )
  }

  const renderStep1 = () => (
    <div className="box-container h-fit">
      <div className="box-section flex flex-col justify-start items-start ">
        <div className="flex w-full justify-between items-center">
          <div>
            <h3>Detalle del Producto</h3>
            <span className="content-font text-gray-500">Ingrese la información básica de su producto.</span>
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
            <Input id="title" name="title" value={formData.title} onChange={handleChange} />
          </div>

          <div className="flex gap-4">
            <div className="space-y-3 w-1/2">
              <Label>Slug</Label>
              <div className="relative">
                <Input value={formData.slug} onChange={handleSlugChange} />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsSlugManuallyEdited(true)
                    setFormData((prev) => ({ ...prev, slug: slugify(prev.title) }))
                  }}
                  className="absolute right-0 top-0 h-full px-3 py-2"
                ></Button>
              </div>
            </div>
            <div className="space-y-3 w-1/2">
              <Label>Proveedor</Label>
              <Input name="vendor" value={formData.vendor} onChange={handleChange} />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="space-y-3 w-1/2">
              <Label>Colecciones</Label>
              <MultiSelect
                options={collections.map((collection) => ({ label: collection.title, value: collection.id }))}
                selected={formData.collectionIds}
                onChange={(selected) => setFormData((prev) => ({ ...prev, collectionIds: selected }))}
              />
            </div>

            <div className="space-y-3 w-1/2">
              <Label>Categorías</Label>
              <MultiSelect
                options={categories.map((category) => ({ label: category.name, value: category.id }))}
                selected={formData.categoryIds}
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
                    selected={formData.releaseDate}
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
                checked={formData.allowBackorder}
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
              initialContent={formData.description}
              onChange={(content) => setFormData((prev) => ({ ...prev, description: content }))}
            />
          </div>

          <div className="space-y-3">
            <Label>Media</Label>
            <ImageGallery
              images={formData.imageUrls}
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

  const renderStep2 = () => (
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
                    <div className="flex items-start gap-2 mr-2">
                      <VariantImageGallery
                        images={useVariants ? (variant.imageUrls || []) : formData.imageUrls}
                        maxImages={useVariants ? 5 : 10}
                        onUpload={() => handleImageUpload(index)}
                        onRemove={(imageIndex) => {
                          if (useVariants) {
                            handleRemoveVariantImage(index, imageIndex)
                          } else {
                            setFormData((prev) => ({
                              ...prev,
                              imageUrls: prev.imageUrls.filter((_, i) => i !== imageIndex)
                            }))
                          }
                        }}
                        variantTitle={variant.title}
                      />
                    </div>

                    <Input
                      value={variant.title}
                      onChange={(e) => handleVariantChange(index, "title", e.target.value)}
                      className="border-0 p-2"
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <Input
                    value={variant.sku}
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
                      value={variant.prices.find((p) => p.currencyId === currency.id)?.price || ""}
                      onChange={(e) => handlePriceInputChange(index, currency.id, e.target.value)}
                      className="border-0 p-2"
                    />
                  </TableCell>
                ))}
                {useVariants && (
                  <TableCell>
                    <div className="flex flex-wrap gap-1 text-sm">
                      {Object.entries(variant.attributes!).map(([key, value]) => (
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

  const renderStep3 = () => (
    <div className="box-container h-fit">
      <div className="box-section flex flex-col justify-start items-start ">
        <h3>Información Adicional</h3>
        <span className="content-font text-gray-500  ">Ingrese metadatos para SEO.</span>
      </div>
      <div className="box-section border-none flex flex-col gap-8 pb-6">
        <div className="flex flex-col w-full">
          <div className="space-y-3">
            <Label htmlFor="metaTitle">Meta Título</Label>
            <Input
              id="metaTitle"
              name="metaTitle"
              value={formData.metaTitle}
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
              value={formData.metaDescription}
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
            Crear Producto
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
