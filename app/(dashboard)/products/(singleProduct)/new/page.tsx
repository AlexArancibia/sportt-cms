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
import { ArrowLeft, ArrowRight, PackageIcon, CircleDollarSign, ImagePlus, Info, X } from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"
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

interface VariantCombination {
  id: string
  enabled: boolean
  attributes: Record<string, string>
}

interface CreateProductVariantDto {
  title: string
  sku: string
  attributes: Record<string, string>
  isActive?: boolean
  imageUrl: string
  inventoryQuantity: number
  weightValue: number
  prices: any[]
  position?: number
}

export default function NewProductPage() {
  const router = useRouter()
  const {
    createProduct,
    categories,
    collections,
    fetchCategories,
    fetchCollections,
    fetchShopSettings,
    shopSettings,
    fetchExchangeRates,
    exchangeRates,
    products,
    fetchProducts,
    currencies, // Added currencies
    fetchCurrencies,
  } = useMainStore()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [useVariants, setUseVariants] = useState(false)
  const [variants, setVariants] = useState<CreateProductVariantDto[]>([
    {
      title: "Producto Simple",
      sku: "",
      imageUrl: "",
      inventoryQuantity: 0,
      weightValue: 0,
      prices: [],
      attributes: {},
      isActive: true,
      position: 0, // Add position field
    },
  ])
  const [formData, setFormData] = useState<CreateProductDto>({
    title: "",
    description: "",
    slug: "",
    vendor: "",
    status: ProductStatus.ACTIVE, // Cambiado de DRAFT a ACTIVE
    categoryIds: [],
    collectionIds: [],
    imageUrls: [],
    variants: [],
    metaTitle: "",
    metaDescription: "",
    fbt: {} as Record<string, string[]>,
    allowBackorder: false, // Add this field
  })
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false)
  const [productOptions, setProductOptions] = useState<ProductOption[]>([])
  const [variantCombinations, setVariantCombinations] = useState<VariantCombination[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      await Promise.all([
        fetchCategories(),
        fetchCollections(),
        fetchShopSettings(),
        fetchExchangeRates(),
        fetchCurrencies(),
        fetchProducts(),
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
        setVariants((prev) => [{ ...prev[0], title: value }])
      }
      return newData
    })
  }

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, slug: slugify(e.target.value) }))
    setIsSlugManuallyEdited(true)
  }

  const handleVariantChange = (index: number, field: keyof CreateProductVariantDto, value: any) => {
    setVariants((prev) => {
      const newVariants = [...prev]
      newVariants[index] = { ...newVariants[index], [field]: value }
      return newVariants
    })
  }

  const handleVariantPriceChange = (index: number, currencyId: string, price: number) => {
    setVariants((prev) => {
      const newVariants = prev.map((v, i) => {
        if (i === index) {
          const newPrices = v.prices.filter((p) => p.currencyId !== currencyId)
          newPrices.push({ currencyId, price })

          const baseCurrency = shopSettings?.[0]?.defaultCurrency
          if (baseCurrency && baseCurrency.id === currencyId) {
            exchangeRates.forEach((er) => {
              if (er.fromCurrencyId === baseCurrency.id) {
                const existingPrice = newPrices.find((p) => p.currencyId === er.toCurrencyId)
                if (existingPrice) {
                  existingPrice.price = price * er.rate
                } else {
                  newPrices.push({ currencyId: er.toCurrencyId, price: price * er.rate })
                }
              }
            })
          }

          return { ...v, prices: newPrices }
        }
        return v
      })

      return newVariants
    })
  }

  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        title: `Variante ${prev.length + 1}`,
        sku: "",
        imageUrl: "",
        inventoryQuantity: 0,
        weightValue: 0,
        prices: [],
        attributes: {},
        isActive: true,
        position: 0,
      },
    ])
  }

  const removeVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index))
  }

  const handleImageUpload = async (variantIndex: number) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const { success, presignedUrl, fileUrl, error } = await uploadImage(shopSettings[0]?.name, file.name, file.type)
        if (!success || !presignedUrl) {
          console.error("Error al obtener la presigned URL:", error)
          toast({
            variant: "destructive",
            title: "Error",
            description: `Failed to upload ${file.name}`,
          })
          return null
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
          console.error("Error subiendo el archivo:", uploadResponse.statusText)
          toast({
            variant: "destructive",
            title: "Error",
            description: `Failed to upload ${file.name}`,
          })
          return null
        }

        if (useVariants) {
          setVariants((prev) => prev.map((v, index) => (index === variantIndex ? { ...v, imageUrl: fileUrl } : v)))
        } else {
          setFormData((prev) => ({ ...prev, imageUrls: [fileUrl, ...prev.imageUrls.slice(1)] }))
        }
      } catch (error) {
        console.error("Error uploading file:", file.name, error)
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to upload ${file.name}`,
        })
        return null
      }

      // const uploadedUrl = await uploadAndGetUrl(file)
      // if (!uploadedUrl) return
    }
    input.click()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const productData = {
        ...formData,
        variants: variants.map((v) => ({
          ...v,
          attributes: useVariants ? v.attributes : { type: "simple" },
        })),
      }
      console.log("NEW PRODUCT FORM DATA:", productData)

      await createProduct(productData)
      toast({
        title: "Éxito",
        description: "Producto creado correctamente",
      })
      router.push("/products")
    } catch (error) {
      console.error("Error creando producto:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al crear el producto",
      })
    }
  }

  useEffect(() => {
    if (useVariants) {
      const enabledVariants = variantCombinations.filter((v) => v.enabled)
      const newVariants: CreateProductVariantDto[] = enabledVariants.map((combo, index) => ({
        title: Object.values(combo.attributes).join(" / "),
        sku: "",
        imageUrl: "",
        inventoryQuantity: 0,
        weightValue: 0,
        prices: [],
        attributes: combo.attributes,
        isActive: true,
        position: index, // Add position field
      }))
      setVariants(newVariants)
    } else {
      setVariants([
        {
          title: formData.title,
          sku: "",
          imageUrl: "",
          inventoryQuantity: 0,
          weightValue: 0,
          prices: [],
          attributes: { type: "simple" },
          isActive: true,
          position: 0, // Add position field
        },
      ])
    }
  }, [useVariants, variantCombinations, formData.title])

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

      <div className="box-section border-none  gap-12 pb-6 items-start ">
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
              {shopSettings?.[0]?.acceptedCurrencies.map((currency) => (
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
                    <div className="relative w-10 h-10 mr-2 bg-accent rounded-md">
                      {useVariants ? (
                        variant.imageUrl ? (
                          <>
                            <Image
                              src={getImageUrl(variant.imageUrl) || "/placeholder.svg"}
                              alt={variant.title}
                              layout="fill"
                              objectFit="cover"
                              className="rounded-md"
                            />
                            <Button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleVariantChange(index, "imageUrl", "")
                              }}
                              variant="ghost"
                              size="icon"
                              className="absolute top-0 right-0 h-5 w-5 bg-background/80 rounded-full hover:bg-background"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </>
                        ) : (
                          <Button onClick={() => handleImageUpload(index)} variant="ghost" className="w-full h-full">
                            <ImagePlus className="w-5 h-5 text-gray-500" />
                          </Button>
                        )
                      ) : formData.imageUrls[0] ? (
                        <>
                          <Image
                            src={getImageUrl(formData.imageUrls[0]) || "/placeholder.svg"}
                            alt={variant.title}
                            layout="fill"
                            objectFit="cover"
                            className="rounded-md"
                          />
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              setFormData((prev) => ({ ...prev, imageUrls: prev.imageUrls.slice(1) }))
                            }}
                            variant="ghost"
                            size="icon"
                            className="absolute top-0 right-0 h-5 w-5 bg-background/80 rounded-full hover:bg-background"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </>
                      ) : (
                        <Button onClick={() => handleImageUpload(index)} variant="ghost" className="w-full h-full">
                          <ImagePlus className="w-5 h-5 text-gray-500" />
                        </Button>
                      )}
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
                    value={variant.weightValue}
                    onChange={(e) => handleVariantChange(index, "weightValue", Number(e.target.value))}
                    className="border-0 p-2"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={variant.inventoryQuantity}
                    onChange={(e) => handleVariantChange(index, "inventoryQuantity", Number(e.target.value))}
                    className="border-0 p-2"
                  />
                </TableCell>
                {shopSettings?.[0]?.acceptedCurrencies.map((currency) => (
                  <TableCell key={currency.id}>
                    <Input
                      type="number"
                      value={variant.prices.find((p) => p.currencyId === currency.id)?.price || ""}
                      onChange={(e) => handleVariantPriceChange(index, currency.id, Number(e.target.value))}
                      className="border-0 p-2"
                    />
                  </TableCell>
                ))}
                {useVariants && (
                  <TableCell>
                    <div className="flex flex-wrap gap-1 text-sm">
                      {Object.entries(variant.attributes).map(([key, value]) => (
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
        <span className="content-font text-gray-500  ">
          Ingrese metadatos y productos frecuentemente comprados juntos.
        </span>
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

          <div className="space-y-4">
            <Label>Frecuentemente Comprados Juntos</Label>
            <MultiSelect
              options={products.flatMap((product) =>
                product.variants.map((variant) => ({
                  label: `${product.title} - ${variant.title}`,
                  value: `${product.id}:${variant.id}`,
                })),
              )}
              selected={Object.entries(formData.fbt).flatMap(([productId, variantIds]) =>
                variantIds.map((variantId: any) => `${productId}:${variantId}`),
              )}
              onChange={(selected) => {
                const newFbt = selected.reduce(
                  (acc, value) => {
                    const [productId, variantId] = value.split(":")
                    if (!acc[productId]) {
                      acc[productId] = []
                    }
                    acc[productId].push(variantId)
                    return acc
                  },
                  {} as Record<string, string[]>,
                )
                setFormData((prev) => ({ ...prev, fbt: newFbt }))
              }}
              className="w-full"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
              {Object.entries(formData.fbt).flatMap(([productId, variantIds]) =>
                variantIds.map((variantId: string) => {
                  const product = products.find((p) => p.id === productId)
                  const variant = product?.variants.find((v) => v.id === variantId)
                  if (!product || !variant) return null
                  const defaultCurrency = shopSettings?.[0]?.defaultCurrencyId
                  const price = variant.prices.find((p) => p.currencyId === defaultCurrency)?.price || 0
                  const currency = currencies.find((c) => c.id === defaultCurrency)

                  return (
                    <div key={`${productId}:${variantId}`} className="bg-accent rounded-lg p-4 relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 rounded-full bg-background/80 hover:bg-background"
                        onClick={() => {
                          setFormData((prev) => {
                            const newFbt = { ...prev.fbt }
                            newFbt[productId] = newFbt[productId].filter((id: any) => id !== variantId)
                            if (newFbt[productId].length === 0) {
                              delete newFbt[productId]
                            }
                            return { ...prev, fbt: newFbt }
                          })
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      <div className="flex items-center space-x-3">
                        <div className="relative w-16 h-16 rounded-md overflow-hidden">
                          {product.imageUrls.length > 0 ? (
                            <Image
                              src={getImageUrl(product.imageUrls[0]) || "/placeholder.svg"}
                              alt={`${product.title} - ${variant.title}`}
                              layout="fill"
                              objectFit="cover"
                            />
                          ) : (
                            <></>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{`${product.title} - ${variant.title}`}</p>
                          <p className="text-sm text-muted-foreground">
                            {currency ? formatCurrency(price, currency.code) : `${price}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                }),
              )}
            </div>
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
