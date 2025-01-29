"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useMainStore } from "@/stores/mainStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import type { CreateProductDto } from "@/types/product"
import type { CreateProductVariantDto } from "@/types/productVariant"
import { CreateVariantPriceDto } from "@/types/variantPrice"
import { ProductStatus } from "@/types/common"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, X, ArrowLeft, ArrowRight, PackageIcon, TrendingUpIcon, CircleDollarSign, RotateCcw, ImagePlus } from "lucide-react"
import { cn } from "@/lib/utils"
import { DescriptionEditor } from "../_components/RichTextEditor"
import { ImageGallery } from "../_components/ImageGallery"
import { VariantOptions } from "../_components/VariantOptions"
import Image from "next/image"
import { getImageUrl } from "@/lib/imageUtils"
import { slugify } from "@/lib/slugify"
import { uploadAndGetUrl } from "@/lib/imageUploader"

interface Variant extends Omit<CreateProductVariantDto, "productId"> {}

interface ProductOption {
  title: string
  values: string[]
}

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
    fetchCategories,
    fetchCollections,
    fetchShopSettings,
    shopSettings,
    fetchExchangeRates,
    exchangeRates,
  } = useMainStore()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [useVariants, setUseVariants] = useState(false)
  const [variants, setVariants] = useState<Variant[]>([
    {
      title: "Default variant",
      sku: "",
      imageUrl: "",
      inventoryQuantity: 0,
      weightValue: 0,

      prices: [],
      attributes: {},
    },
  ])
  const [formData, setFormData] = useState<CreateProductDto>({
    title: "",
    description: "",
    slug: "",
    vendor: "",
    status: ProductStatus.DRAFT,
    categoryIds: [],
    collectionIds: [],
    imageUrls: [],
    sku: "",
    inventoryQuantity: 0,
    weightValue: 0,

    prices: [],
    variants: [],
  })
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false)
  const [productOptions, setProductOptions] = useState<ProductOption[]>([])
  const [variantCombinations, setVariantCombinations] = useState<VariantCombination[]>([])
  const [selectedCell, setSelectedCell] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories()
    fetchCollections()
    fetchShopSettings()
    fetchExchangeRates()
  }, [fetchCategories, fetchCollections, fetchShopSettings, fetchExchangeRates])

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

  const handleVariantChange = (index: number, field: keyof CreateProductVariantDto, value: any) => {
    setVariants((prev) => {
      const newVariants = [...prev]
      newVariants[index] = { ...newVariants[index], [field]: value }

      setFormData((prevFormData) => ({
        ...prevFormData,
        variants: newVariants,
      }))

      return newVariants
    })
  }

  const handleVariantPriceChange = (index: number, currencyId: string, price: number) => {
    if (useVariants) {
      setVariants((prev) => {
        const newVariants = prev.map((v, i) => {
          if (i === index) {
            const newPrices = v.prices.filter((p) => p.currencyId !== currencyId)
            newPrices.push({ currencyId, price })

            // Automatically update other currency prices
            const baseCurrency = shopSettings?.[0]?.defaultCurrency
            if (baseCurrency && baseCurrency.id === currencyId) {
              exchangeRates.forEach((er) => {
                if (er.fromCurrencyId === baseCurrency.id && !newPrices.some((p) => p.currencyId === er.toCurrencyId)) {
                  newPrices.push({ currencyId: er.toCurrencyId, price: price * er.rate })
                }
              })
            }

            return { ...v, prices: newPrices }
          }
          return v
        })

        setFormData((prevFormData) => ({
          ...prevFormData,
          variants: newVariants,
        }))

        return newVariants
      })
    } else {
      setFormData((prev) => {
        const newPrices = prev.prices.filter((p) => p.currencyId !== currencyId)
        newPrices.push({ currencyId, price })

        // Automatically update other currency prices
        const baseCurrency = shopSettings?.[0]?.defaultCurrency
        if (baseCurrency && baseCurrency.id === currencyId) {
          exchangeRates.forEach((er) => {
            if (er.fromCurrencyId === baseCurrency.id && !newPrices.some((p) => p.currencyId === er.toCurrencyId)) {
              newPrices.push({ currencyId: er.toCurrencyId, price: price * er.rate })
            }
          })
        }

        return {
          ...prev,
          prices: newPrices,
        }
      })
    }
  }

  const addVariant = () => {
    setVariants((prev) => {
      const newVariant: Variant = {
        title: `Variant ${prev.length + 1}`,
        sku: "",
        imageUrl: "",
        inventoryQuantity: 0,
        weightValue: 0,

        prices: [],
        attributes: {},
      }
      const newVariants = [...prev, newVariant]

      setFormData((prevFormData) => ({
        ...prevFormData,
        variants: newVariants,
      }))

      return newVariants
    })
  }

  const removeVariant = (index: number) => {
    setVariants((prev) => {
      const newVariants = prev.filter((_, i) => i !== index)

      setFormData((prevFormData) => ({
        ...prevFormData,
        variants: newVariants,
      }))

      return newVariants
    })
  }


  const handleImageUpload = async (variantIndex: number) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (!file) return

      const uploadedUrl = await uploadAndGetUrl(file)
      if (!uploadedUrl) return

      setVariants((prev) =>
        prev.map((v, index) => (index === variantIndex ? { ...v, imageUrl: getImageUrl(uploadedUrl) } : v)),
      )

      // If not using variants, update the main product image as well
      if (!useVariants && variantIndex === 0) {
        setFormData((prev) => ({
          ...prev,
          imageUrls: [getImageUrl(uploadedUrl), ...prev.imageUrls.slice(1)],
        }))
      }
    }
    input.click()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const productData = { ...formData }
      if (useVariants) {
        productData.prices = []
      } else {
        productData.variants = []
        productData.sku = variants[0].sku
        productData.imageUrls = variants[0].imageUrl ? [variants[0].imageUrl] : []
        productData.weightValue = variants[0].weightValue

        productData.inventoryQuantity = variants[0].inventoryQuantity
        productData.prices = variants[0].prices
      }
      await createProduct(formData)
      toast({
        title: "Success",
        description: "Product created successfully",
      })
      router.push("/products")
    } catch (error) {
      console.error("Error creating product:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create product",
      })
    }
  }

  useEffect(() => {
    if (useVariants) {
      const enabledVariants = variantCombinations.filter((v) => v.enabled)
      const newVariants: Variant[] = enabledVariants.map((combo) => ({
        title: Object.values(combo.attributes).join(" / "),
        sku: "",
        imageUrl: "",
        inventoryQuantity: 0,
        weightValue: 0,

        prices: [],
        attributes: combo.attributes,
      }))
      setVariants(newVariants)
      setFormData((prev) => ({
        ...prev,
        variants: newVariants,
        prices: [],
      }))
    } else {
      const defaultVariant: Variant[] = [
        {
          title: "Default variant",
          sku: "",
          imageUrl: "",
          inventoryQuantity: 0,
          weightValue: 0,

          prices: [],
          attributes: {},
        },
      ]
      setVariants(defaultVariant)
      setFormData((prev) => ({
        ...prev,
        variants: [],
        prices: [],
      }))
    }
  }, [useVariants, variantCombinations])

  const handleCellClick = (cellId: string) => {
    setSelectedCell(cellId);
  };


  const renderStep1 = () => (
    <>
      <div className="box-container h-fit">
        <div className="box-section flex flex-col justify-start items-start ">
          <h3 className="">Detalle del Producto</h3>
          <span className="content-font text-gray-500">Ingrese la información básica de su producto.</span>
        </div>

        <div className=" box-section border-none flex-row  gap-12 pb-6 items-start ">
          <div className="w-1/2 flex flex-col gap-3 ">
            <div className="space-y-2">
              <Label htmlFor="title" className="content-font">
                Nombre
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="bg-muted/20 border text-foreground focus:ring-2 focus:ring-primary focus:outline-none transition-all"
              />
            </div>

            <div className="flex gap-4">
              <div className="space-y-3 w-1/2">
                <Label htmlFor="slug" className="text-sm font-medium text-muted-foreground">
                  Slug
                </Label>
                <div className="relative">
          <Input
            type="text"
            id="slug"
            name="slug"
            value={formData.slug}
            onChange={(e) => {
              setIsSlugManuallyEdited(true)
              handleChange(e)
            }}
            className=" "
          />
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setIsSlugManuallyEdited(true)
              setFormData((prev) => ({ ...prev, slug: slugify(prev.title!) }))
            }}
            className="absolute right-0 top-0 h-full px-3 py-2 text-gray-400 hover:text-gray-600"
          >
            <RotateCcw className="h-4 w-4" />
            
          </Button>
        </div>
              </div>
              <div className="space-y-3 w-1/2">
                <Label className="text-sm font-medium text-muted-foreground">Proveedor</Label>
                <Input
                  name="vendor"
                  value={formData.vendor}
                  onChange={handleChange}
                  className="bg-muted/20 border text-foreground focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="space-y-3 w-1/2">
                <Label className="text-sm font-medium text-muted-foreground">Colección</Label>
                <Select
                  value={formData.collectionIds[0] || ""}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, collectionIds: [value] }))}
                >
                  <SelectTrigger className="bg-muted/20 border rounded-md text-foreground">
                    <SelectValue placeholder="Selecciona Colección" />
                  </SelectTrigger>
                  <SelectContent>
                    {collections.map((collection) => (
                      <SelectItem key={collection.id} value={collection.id}>
                        {collection.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 w-1/2">
                <Label className="text-sm font-medium text-muted-foreground">Categorias</Label>
                <Select
                  value={formData.categoryIds[0] || ""}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, categoryIds: [value] }))}
                >
                  <SelectTrigger className="bg-muted/20 border rounded-md text-foreground">
                    <SelectValue placeholder="Selecciona Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium text-muted-foreground">Descripción</Label>
              <DescriptionEditor
                initialContent={formData.description}
                onChange={(content) => setFormData((prev) => ({ ...prev, description: content }))}
              />
            </div>

            <div className="space-y-3 ">
              <Label className="text-sm font-medium text-muted-foreground">Media</Label>
              <ImageGallery
                images={formData.imageUrls}
                onChange={(newImages) => setFormData((prev) => ({ ...prev, imageUrls: newImages }))}
                maxImages={10}
              />
            </div>
          </div>

          <div className=" w-1/2 flex flex-col justify-start gap-3 ">
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
    </>
  )

  const renderStep2 = () => (
    <>
      <div className="box-container h-fit">
        <div className="box-section flex flex-col justify-start items-start ">
          <h3>{useVariants ? "Detalles de Variantes" : "Detalles de Producto"}</h3>
          <span className="content-font text-gray-500">
            {useVariants
              ? "Gestione sus variantes de producto y sus detalles específicos."
              : "Gestione su producto y sus detalles específicos."}
          </span>
        </div>
        <div className="box-section border-none px-0 gap-12 pb-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="p-0 pl-6 ">Nombre</TableHead>
                <TableHead className="p-0  w-[250px]">SKU</TableHead>
                <TableHead className="p-0 w-[100px]">Peso</TableHead>
                <TableHead className="p-0 w-[100px]">Cantidad</TableHead>
                {shopSettings?.[0]?.acceptedCurrencies.map((currency) => (
                  <TableHead className="p-0 w-[100px]" key={currency.id}>
                    Precio ({currency.code})
                  </TableHead>
                ))}
                {useVariants && <TableHead className="p-0 w-[400px]">Atributos</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {useVariants ? (
                variants.map((variant, index) => (
                  <TableRow key={index} className="content-font">
                    <TableCell
 
                      >
                    <div className="flex items-center gap-2">
                      <div className="relative w-10 h-10 mr-2 bg-accent rounded-md py-1 ml-6 inline-block">
 
                                   
                                    {variant.imageUrl ? (
                                      <Image
                                        src={getImageUrl(variant.imageUrl) }
                                        alt={variant.title}
                                        layout="fill"
                                        objectFit="cover"
                                        className="rounded-md"
                                      />) : 

                                      <Button
                                      onClick={() => handleImageUpload(index)}
                                      variant="ghost"
                                        className="flex items-center justify-center w-full h-full   transition"
                                      >
                                        <ImagePlus className="w-5 h-5  text-gray-500" />
                                      </Button>
                                    
                                  }
                                  </div>
                      <Input
                        value={variant.title}
                        onChange={(e) => handleVariantChange(index, "title", e.target.value)}
                        className="bg-transparent border-0 content-font h-7 p-0 focus:ring-0 focus:outline-none"
                      />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={variant.sku}
                        onChange={(e) => handleVariantChange(index, "sku", e.target.value)}
                        className="bg-transparent border-0 content-font h-7 p-0 focus:ring-0 focus:outline-none"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={variant.weightValue}
                        onChange={(e) => handleVariantChange(index, "weightValue", Number.parseFloat(e.target.value))}
                        className="bg-transparent border-0 content-font h-7 p-0 focus:ring-0 focus:outline-none"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={variant.inventoryQuantity}
                        onChange={(e) =>
                          handleVariantChange(index, "inventoryQuantity", Number.parseInt(e.target.value))
                        }
                        className="bg-transparent border-0 content-font h-7 p-0 focus:ring-0 focus:outline-none"
                      />
                    </TableCell>
                    {shopSettings?.[0]?.acceptedCurrencies.map((currency) => (
                      <TableCell key={currency.id}>
                        <Input
                          type="number"
                          value={variant.prices.find((p) => p.currencyId === currency.id)?.price || ""}
                          onChange={(e) =>
                            handleVariantPriceChange(index, currency.id, Number.parseFloat(e.target.value))
                          }
                          className="bg-transparent border-0 content-font h-7 p-0 focus:ring-0 focus:outline-none"
                        />
                      </TableCell>
                    ))}
                    {useVariants && (
                      <TableCell>
                        <div className="flex flex-wrap gap-1 text-sm">
                          
                          {Object.entries(variant.attributes).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-1">
                              <span className="text-muted-foreground">{key}:</span>
                              <span className="text-foreground font-medium">{value}</span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell className="pl-6">
                    <div className="flex  gap-2 items-center ">
                        <div className="relative w-10 h-10 mr-2 bg-accent rounded-md py-1 ml-4 inline-block">
                          {formData.imageUrls[0] && (
                            <Image
                              src={getImageUrl(formData.imageUrls[0]) }
                              alt={formData.title}
                              layout="fill"
                              objectFit="cover"
                              className="rounded-md p-1"
                            />
                          )}
                        </div>
                      <Input
                        value={formData.title}
                        onChange={(e) => handleChange(e)}
                        name="title"
                        className="bg-transparent border-0 content-font h-7 p-0 focus:ring-0 focus:outline-none"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={formData.sku}
                      onChange={(e) => handleChange(e)}
                      name="sku"
                      className="bg-transparent border-0 content-font h-7 p-0 focus:ring-0 focus:outline-none"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={formData.weightValue}
                      onChange={(e) => handleChange(e)}
                      name="weightValue"
                      className="bg-transparent border-0 content-font h-7 p-0 focus:ring-0 focus:outline-none"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={formData.inventoryQuantity}
                      onChange={(e) => handleChange(e)}
                      name="inventoryQuantity"
                      className="bg-transparent border-0 content-font h-7 p-0 focus:ring-0 focus:outline-none"
                    />
                  </TableCell>
                  {shopSettings?.[0]?.acceptedCurrencies.map((currency) => (
                    <TableCell key={currency.id}>
                      <Input
                        type="number"
                        value={formData.prices.find((p) => p.currencyId === currency.id)?.price || ""}
                        onChange={(e) => handleVariantPriceChange(0, currency.id, Number.parseFloat(e.target.value))}
                        className="bg-transparent border-0 content-font h-7 p-0 focus:ring-0 focus:outline-none"
                      />
                    </TableCell>
                  ))}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
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
            onClick={() => setCurrentStep(currentStep < 2 ? currentStep + 1 : currentStep)}
            disabled={currentStep === 2}
            className="border-border text-muted-foreground hover:bg-accent"
          >
            Siguiente <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button onClick={handleSubmit} className="create-button">
            {" "}
            Crear Producto{" "}
          </Button>
        </div>
      </header>
      <ScrollArea className="h-[calc(100vh-3.6em)]">
        <div className="p-6">{currentStep === 1 ? renderStep1() : renderStep2()}</div>
      </ScrollArea>
    </div>
  )
}

