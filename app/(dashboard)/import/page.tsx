"use client"

import type React from "react"
import { useState, useMemo, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import * as XLSX from "xlsx"
import { Search, Upload, Info, Download } from "lucide-react"
import { useMainStore } from "@/stores/mainStore"
import Image from "next/image"
import { decodeHTMLEntities } from "@/lib/stringUtils"
 
import { useToast } from "@/hooks/use-toast"
import { ProductStatus } from "@/types/common"
import { Currency } from "@/types/currency"
import { ExchangeRate } from "@/types/exchangeRate"
import { processProductImages } from "@/lib/imageUploader"
import { slugify } from "@/lib/slugify"

interface ProductData {
  Handle: string
  Title: string
  Vendor: string
  "Product Category": string
  "Option1 Name": string
  "Option1 Value": string
  "Variant Inventory Qty": string
  "Variant Price": string
  Status: string
  "Image Src": string
  "Body (HTML)": string
}

interface FormattedProduct {
  title: string
  description: string
  slug: string
  vendor: string
  status: ProductStatus

  categoryIds: string[]
  imageUrls: string[]
  collectionIds: string[]
  sku: string
  inventoryQuantity: number
  weightValue: number
 
  prices: any[]
  variants: {
    title: string
    sku: string
    imageUrl: string
    inventoryQuantity: number
    attributes: {
      [key: string]: string
    }
    weightValue: number
 
    prices: {
      currencyId: string
      price: number
    }[]
  }[]
}

export default function TestPage() {
  const [excelData, setExcelData] = useState<ProductData[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
 
  const [isLoading, setIsLoading] = useState(false)
  const {
    currencies,
    categories,
    products,
    exchangeRates,
    shopSettings,
    fetchCurrencies,
    fetchExchangeRates,
    fetchShopSettings,
    fetchCategories,
    createCategory,
    createProduct,
    fetchProducts,
  } = useMainStore()
  const { toast } = useToast()

  const defaultCurrency = shopSettings?.[0]?.defaultCurrencyId
    ? currencies.find((c) => c.id === shopSettings[0].defaultCurrencyId)
    : currencies[0] || null

  const otherCurrencies = currencies.filter((c) => c.id !== defaultCurrency?.id)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (evt) => {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: "binary", codepage: 65001 }) // UTF-8 codepage
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json(ws) as ProductData[]
        setExcelData(
          data.map((row) => ({
            ...row,
            Title: decodeHTMLEntities(row.Title),
            "Product Category": decodeHTMLEntities(row["Product Category"]),
          })),
        )
      }
      reader.readAsBinaryString(file)
    }
  }

  const groupedProducts = useMemo(() => {
    const groups: { [key: string]: ProductData[] } = {}
    excelData.forEach((row) => {
      const productHandle = row.Handle.split("#")[0] // Use the part before "#" as the main product handle
      if (!groups[productHandle]) {
        groups[productHandle] = []
      }
      groups[productHandle].push(row)
    })
    return groups
  }, [excelData])

  const analysis = useMemo(() => {
    if (!excelData.length) return null

    const uniqueProducts = Object.keys(groupedProducts).length
    const variants = new Set(excelData.map((row) => row["Option1 Value"]).filter(Boolean))
    const totalInventory = excelData.reduce((sum, row) => sum + (Number.parseInt(row["Variant Inventory Qty"]) || 0), 0)

    return {
      totalProducts: uniqueProducts,
      totalVariants: variants.size,
      totalInventory,
      variantsList: Array.from(variants),
    }
  }, [excelData, groupedProducts])

  const filteredProducts = useMemo(() => {
    return Object.entries(groupedProducts).filter(([handle, variants]) =>
      variants.some(
        (variant) =>
          (variant.Title?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
          (variant.Vendor?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
          (variant["Option1 Value"]?.toLowerCase() || "").includes(searchTerm.toLowerCase()),
      ),
    )
  }, [groupedProducts, searchTerm])

  const formatPrice = (price: number, currencyCode: string) => {
    const currency = currencies.find((c) => c.code === currencyCode)
    if (!currency) return `${price.toFixed(2)}`

    const formatter = new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: currency.decimalPlaces,
      maximumFractionDigits: currency.decimalPlaces,
    })

    const formattedPrice = formatter.format(price)
    return currency.symbolPosition === "BEFORE" ? formattedPrice : formattedPrice.replace(/^(\D+)/, "$1 ")
  }

  const validateStatus = (status: string): ProductStatus => {
    const upperStatus = status.toUpperCase()
    return Object.values(ProductStatus).includes(upperStatus as ProductStatus)
      ? (upperStatus as ProductStatus)
      : ProductStatus.DRAFT
  }

  const getCategoryId = async (categoryPath: string): Promise<string> => {
    console.log("Starting getCategoryId with path:", categoryPath)
    const categoryNames = categoryPath.split(" > ")
    const lastCategoryName = categoryNames[categoryNames.length - 1].trim()
    console.log("Using last category:", lastCategoryName)

    let category = categories.find((c) => c.name === lastCategoryName)
    console.log("Found category:", category)

    if (!category) {
      console.log("Category not found, creating new one")
      try {
        const newCategory = await createCategory({
          name: lastCategoryName,
          parentId: undefined, // No parent category
          description: `Auto-generated category for ${lastCategoryName}`,
          slug: slugify(lastCategoryName),
        })
        console.log("New category created:", newCategory)

 
        const updatedCategories = await fetchCategories()
        console.log("Updated categories:", updatedCategories)
 

        category = updatedCategories.find((c) => c.name === lastCategoryName)
        console.log("Found newly created category:", category)
      } catch (error) {
        console.error(`Error creating category ${lastCategoryName}:`, error)
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to create category ${lastCategoryName}. Please try again.`,
        })
        return ""
      }
    }

    if (!category) {
      console.error(`Category ${lastCategoryName} not found after creation attempt`)
      return ""
    }

    console.log("Final categoryId:", category.id)
    return category.id
  }


  const formatProductData = async (
    handle: string, 
    variants: ProductData[],
    currencies: Currency[],
    exchangeRates: ExchangeRate[],
    defaultCurrency: string,): Promise<FormattedProduct> => {

      
    console.log("Starting formatProductData for handle:", handle)
    const mainVariant = variants[0]
    const formattedVariants: { [key: string]: FormattedProduct["variants"][0] } = {}
    const allImageUrls: string[] = []
    let lastOptionName = "Atributo" 

    variants.forEach((v) => {
      if (v["Image Src"] && !allImageUrls.includes(v["Image Src"])) {
        allImageUrls.push(v["Image Src"])
      }


      if (v["Option1 Value"]) {
        const variantKey = v["Option1 Value"]
        if (v["Option1 Name"]) {
          lastOptionName = v["Option1 Name"]
        }


        if (!formattedVariants[variantKey]) {

          const basePrice = Number.parseFloat(v["Variant Price"]) || 0
          const variantPrices = currencies.map((currency) => {
            if (currency.id === defaultCurrency) {
              return {
                currencyId: currency.id,
                price: basePrice,
              }
            } else {
              const exchangeRate = exchangeRates.find(
                (er) => er.fromCurrencyId === defaultCurrency && er.toCurrencyId === currency.id,
              )
              const convertedPrice = exchangeRate ? basePrice * exchangeRate.rate : basePrice
              return {
                currencyId: currency.id,
                price: Number(convertedPrice.toFixed(2)),
              }
            }
          })

          
          formattedVariants[variantKey] = {
            title: `${mainVariant.Title || ""} - ${v["Option1 Value"] || ""}`,
            sku: v.Handle,
            imageUrl: "", 
            inventoryQuantity: Number.parseInt(v["Variant Inventory Qty"], 10) || 0,
            attributes: { [lastOptionName]: v["Option1 Value"] || "" },
            weightValue: 0.18,
 
            prices: variantPrices,
          }
        }
 
      }
    })

    console.log("Getting category ID for:", mainVariant["Product Category"])
    const categoryId = await getCategoryId(mainVariant["Product Category"] || "");
    const categoryIds = categoryId ? [categoryId] : [];

    let slug = slugify(mainVariant.Title || "")
    let slugSuffix = 1

    // Check if the slug already exists and append a number if it does
    while (await checkSlugExists(slug)) {
      slug = `${slugify(mainVariant.Title || "")}-${slugSuffix}`
      slugSuffix++
    }

    console.log("Received categoryId:", categoryId)

    return {
      title: mainVariant.Title || "",
      description: mainVariant["Body (HTML)"] || `${mainVariant.Title || ""} - Disponible en varios colores y tallas`,
      slug: slug,
      vendor: mainVariant.Vendor || "",
      status: validateStatus(mainVariant.Status || ""),
      categoryIds: categoryIds,
      imageUrls: allImageUrls,
      collectionIds: [],
      sku: handle,
      inventoryQuantity: Object.values(formattedVariants).reduce((sum, v) => sum + v.inventoryQuantity, 0),
      weightValue: 0.2,

      prices: [],
      variants: Object.values(formattedVariants),
    }
  }

  const handleProductInfo = async (handle: string, variants: ProductData[]) => {
    console.log("Starting handleProductInfo for handle:", handle)
    try {
      const formattedProduct = await formatProductData(handle, variants, currencies, exchangeRates, defaultCurrency!.id)
      console.log("Formatted product:", JSON.stringify(formattedProduct, null, 2))
    } catch (error) {
      console.error("Error formatting product data:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to format product data. Please try again.",
      })
    }
  }



  const checkSlugExists = async (slug: string): Promise<boolean> => {
    const products = await fetchProducts()
    return products.some((product) => product.slug === slug)
  }

  const exportProduct = async (handle: string, variants: ProductData[]) => {
    try {
      setIsLoading(true)
      let formattedProduct: FormattedProduct
      formattedProduct = await formatProductData(handle, variants, currencies, exchangeRates, defaultCurrency!.id)
      formattedProduct = await processProductImages(formattedProduct)

      if (await checkSlugExists(formattedProduct.slug)) {
        toast({
          variant: "destructive",
          title: "Error",
          description: `A product with the slug "${formattedProduct.slug}" already exists. Please modify the product title and try again.`,
        })
        return
      }

      const createdProduct = await createProduct(formattedProduct)
      console.log("Created product:", createdProduct)
      toast({
        title: "Éxito",
        description: `El producto "${formattedProduct.title}" ha sido exportado.`,
      })
    } catch (error) {
      console.error("Error exporting product:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to export product. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const exportAllProducts = async () => {
    try {
      setIsLoading(true)
      let successCount = 0
      let errorCount = 0

      for (const [handle, variants] of Object.entries(groupedProducts)) {
        try {
          const formattedProduct = await formatProductData(handle, variants, currencies, exchangeRates, defaultCurrency!.id)

          if (await checkSlugExists(formattedProduct.slug)) {
            console.log(`Skipping product with existing slug: ${formattedProduct.slug}`)
            errorCount++
            continue
          }

          await createProduct(formattedProduct)
          successCount++
        } catch (error) {
          console.error(`Error exporting product ${handle}:`, error)
          errorCount++
        }
      }

      toast({
        title: "Exportación completada",
        description: `${successCount} productos exportados con éxito. ${errorCount} errores.`,
      })
    } catch (error) {
      console.error("Error exporting all products:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to export all products. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      console.log("Starting to load data...")
      setLoading(true)
      setError(null)
      try {
        console.log("Fetching currencies...")
        const currenciesResult = await fetchCurrencies()
        console.log("Currencies fetched:", currenciesResult)

        console.log("Fetching exchange rates...")
        const exchangeRatesResult = await fetchExchangeRates()
        console.log("Exchange rates fetched:", exchangeRatesResult)

        console.log("Fetching shop settings...")
        const shopSettingsResult = await fetchShopSettings()
        console.log("Shop settings fetched:", shopSettingsResult)

        fetchCategories()
         

        fetchProducts()
        console.log("Products fetched:", products)

        
        console.log("All data fetched successfully")
      } catch (error) {
        console.error("Error fetching data:", error)
        if (error instanceof Error) {
          console.error("Error message:", error.message)
          console.error("Error stack:", error.stack)
        }
        setError("Failed to load data. Please try again.")
        toast({
          title: "Error al cargar datos",
          description: "Ocurrió un error al cargar los datos. Por favor, inténtalo de nuevo.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
        console.log("Loading state set to false")
      }
    }

    loadData()
  }, [fetchCurrencies, fetchExchangeRates, fetchShopSettings, fetchCategories, fetchProducts,toast])


  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement
    target.style.display = "none"
    target.nextElementSibling?.classList.remove("hidden")
  }, [])

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Análisis de Productos</h1>
        <div className="flex items-center gap-4">
          <Input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="max-w-xs" />
          <Button
            onClick={() => {
              const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
              if (fileInput) {
                fileInput.click()
              }
            }}
          >
            <Upload className="mr-2 h-4 w-4" />
            Cargar Excel
          </Button>

          <Button onClick={exportAllProducts} disabled={isLoading || !excelData.length}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Todos
          </Button>
        </div>
      </div>

      {analysis && (
        <>
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analysis.totalProducts}</div>
                <p className="text-xs text-muted-foreground">Productos únicos</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Variantes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analysis.totalVariants}</div>
                <p className="text-xs text-muted-foreground">Tallas disponibles: {analysis.variantsList.join(", ")}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inventario Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analysis.totalInventory}</div>
                <p className="text-xs text-muted-foreground">Unidades en stock</p>
              </CardContent>
            </Card>
          </div>

          <div className="mb-4 flex items-center">
            <Search className="mr-2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {filteredProducts.map(([handle, variants]) => (
            <div key={handle} className="mb-8 border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Imagen</TableHead>
                    <TableHead>Variante</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Precio Base</TableHead>
                    {otherCurrencies.map((currency) => (
                      <TableHead key={currency.id}>{`Precio (${currency.code})`}</TableHead>
                    ))}
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variants
                    .filter((v) => v["Option1 Value"])
                    .map((variant, index) => (
                      <TableRow key={index}>
                        <TableCell>{variant.Title}</TableCell>
                        <TableCell>{variant["Product Category"]}</TableCell>
                        <TableCell>
                          {variant["Image Src"] && (
                            <div className="relative w-16 h-16">
                              <Image
                                src={variant["Image Src"] || "/placeholder.svg"}
                                alt={`Imagen de ${variant.Title}`}
                                fill
                                style={{ objectFit: "cover" }}
                                sizes="64px"
                                onError={handleImageError}
                              />
                              <div className="hidden w-16 h-16 bg-gray-200 rounded-sm"></div>
                            </div>
                          )}

                        {!variant["Image Src"] && <div className="w-16 h-16 bg-gray-200 rounded-sm"></div>}
                        </TableCell>
                        <TableCell>{variant["Option1 Value"]}</TableCell>
                        <TableCell>{variant["Variant Inventory Qty"]}</TableCell>
                        <TableCell>
                          {formatPrice(Number.parseFloat(variant["Variant Price"]), defaultCurrency?.code || "USD")}
                        </TableCell>
                        {otherCurrencies.map((currency) => {
                          const exchangeRate = exchangeRates.find(
                            (er) => er.fromCurrencyId === defaultCurrency?.id && er.toCurrencyId === currency.id,
                          )
                          const price = exchangeRate
                            ? Number.parseFloat(variant["Variant Price"]) * exchangeRate.rate
                            : Number.parseFloat(variant["Variant Price"])
                          return <TableCell key={currency.id}>{formatPrice(price, currency.code)}</TableCell>
                        })}
                        <TableCell>{variant.Status}</TableCell>
                        <TableCell>
                        {index === 0 && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => handleProductInfo(handle, variants)}>
                                Info del Producto
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => exportProduct(handle, variants)}
                                disabled={isLoading}
                                className="ml-2"
                              >
                                Exportar
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          ))}

          {defaultCurrency && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4">Moneda Predeterminada</h2>
              <p>Código: {defaultCurrency.code}</p>
              <p>Nombre: {defaultCurrency.name}</p>
              <p>Símbolo: {defaultCurrency.symbol}</p>
            </div>
          )}

          {otherCurrencies.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4">Otras Monedas</h2>
              <ul>
                {otherCurrencies.map((currency) => (
                  <li key={currency.id}>
                    {currency.name} ({currency.code}) - {currency.symbol}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}

