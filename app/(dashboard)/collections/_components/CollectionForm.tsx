"use client"

import { useState, useEffect, useRef } from "react"
import { useMainStore } from "@/stores/mainStore"
import type { Collection, CreateCollectionDto, UpdateCollectionDto } from "@/types/collection"
import { useToast } from "@/hooks/use-toast"
import { useApiError } from "@/hooks/use-api-error"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ImageUpload } from "@/components/ImageUpload"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  RotateCcw,
  Search,
  ImageIcon,
  Package,
  Info,
  ChevronUp,
  ChevronDown,
  Tag,
  ListFilter,
  Save,
} from "lucide-react"
import type React from "react"
import { slugify } from "@/lib/slugify"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CollectionHeader } from "./CollectionHeader"

interface CollectionFormProps {
  collection?: Collection
  onSuccess: () => void
}

export function CollectionForm({ collection, onSuccess }: CollectionFormProps) {
  const {
    currentStore,
    createCollection,
    updateCollection,
    products,
    categories,
    fetchProductsByStore,
    fetchCategoriesByStore,
  } = useMainStore()
  const { handleAnyError } = useApiError()

  const { toast } = useToast()
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false)
  const [formData, setFormData] = useState<CreateCollectionDto | UpdateCollectionDto>({
    title: "",
    description: "",
    slug: "",
    productIds: [],
    imageUrl: "",
    storeId: currentStore || "", // Initialize with currentStore
  })

  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [isProductsExpanded, setIsProductsExpanded] = useState(true)

  // Fetch optimization constants and state
  const FETCH_COOLDOWN_MS = 2000 // Minimum time between fetches (2 seconds)
  const MAX_RETRIES = 3 // Maximum number of retry attempts
  const RETRY_DELAY_MS = 1500 // Base delay between retries (1.5 seconds)
  const [lastProductsFetchTime, setLastProductsFetchTime] = useState<number>(0)
  const [lastCategoriesFetchTime, setLastCategoriesFetchTime] = useState<number>(0)
  const [productsFetchAttempts, setProductsFetchAttempts] = useState<number>(0)
  const [categoriesFetchAttempts, setCategoriesFetchAttempts] = useState<number>(0)
  const productsFetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const categoriesFetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(false)
  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(false)

  // Replace the existing useEffect with these improved fetch functions and useEffect
  const fetchProductsWithRetry = async (forceRefresh = false) => {
    // Avoid duplicate or frequent fetches
    const now = Date.now()
    if (!forceRefresh && now - lastProductsFetchTime < FETCH_COOLDOWN_MS) {
      console.log("Products fetch cooldown active, using cached data")
      return
    }

    // Skip fetch if no store is selected
    if (!currentStore) {
      console.log("No store selected, skipping products fetch")
      return
    }

    // Clear any pending timeout
    if (productsFetchTimeoutRef.current) {
      clearTimeout(productsFetchTimeoutRef.current)
      productsFetchTimeoutRef.current = null
    }

    setIsLoadingProducts(true)

    try {
      console.log(`Fetching products for store: ${currentStore} (attempt ${productsFetchAttempts + 1})`)
      await fetchProductsByStore()

      // Reset retry counters on success
      setProductsFetchAttempts(0)
      setLastProductsFetchTime(Date.now())
    } catch (error) {
      console.error("Error fetching products:", error)

      // Implement retry with exponential backoff
      if (productsFetchAttempts < MAX_RETRIES) {
        const nextAttempt = productsFetchAttempts + 1
        const delay = RETRY_DELAY_MS * Math.pow(1.5, nextAttempt - 1) // Exponential backoff

        console.log(`Retrying products fetch in ${delay}ms (attempt ${nextAttempt}/${MAX_RETRIES})`)

        setProductsFetchAttempts(nextAttempt)
        productsFetchTimeoutRef.current = setTimeout(() => {
          fetchProductsWithRetry(true)
        }, delay)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch products after multiple attempts. Please try again.",
        })
        setProductsFetchAttempts(0)
      }
    } finally {
      setIsLoadingProducts(false)
    }
  }

  const fetchCategoriesWithRetry = async (forceRefresh = false) => {
    // Avoid duplicate or frequent fetches
    const now = Date.now()
    if (!forceRefresh && now - lastCategoriesFetchTime < FETCH_COOLDOWN_MS) {
      console.log("Categories fetch cooldown active, using cached data")
      return
    }

    // Skip fetch if no store is selected
    if (!currentStore) {
      console.log("No store selected, skipping categories fetch")
      return
    }

    // Clear any pending timeout
    if (categoriesFetchTimeoutRef.current) {
      clearTimeout(categoriesFetchTimeoutRef.current)
      categoriesFetchTimeoutRef.current = null
    }

    setIsLoadingCategories(true)

    try {
      console.log(`Fetching categories for store: ${currentStore} (attempt ${categoriesFetchAttempts + 1})`)
      await fetchCategoriesByStore()

      // Reset retry counters on success
      setCategoriesFetchAttempts(0)
      setLastCategoriesFetchTime(Date.now())
    } catch (error) {
      console.error("Error fetching categories:", error)

      // Implement retry with exponential backoff
      if (categoriesFetchAttempts < MAX_RETRIES) {
        const nextAttempt = categoriesFetchAttempts + 1
        const delay = RETRY_DELAY_MS * Math.pow(1.5, nextAttempt - 1) // Exponential backoff

        console.log(`Retrying categories fetch in ${delay}ms (attempt ${nextAttempt}/${MAX_RETRIES})`)

        setCategoriesFetchAttempts(nextAttempt)
        categoriesFetchTimeoutRef.current = setTimeout(() => {
          fetchCategoriesWithRetry(true)
        }, delay)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch categories after multiple attempts. Please try again.",
        })
        setCategoriesFetchAttempts(0)
      }
    } finally {
      setIsLoadingCategories(false)
    }
  }

  // Initial data loading
  useEffect(() => {
    // Only fetch if we have a currentStore
    if (currentStore) {
      fetchProductsWithRetry()
      fetchCategoriesWithRetry()

      // Update storeId in formData when currentStore changes
      setFormData((prev) => ({
        ...prev,
        storeId: currentStore,
      }))
    }

    // Set form data if collection exists
    if (collection) {
      setFormData({
        title: collection.title || "",
        description: collection.description || "",
        productIds: collection.products?.map((p) => p.id) || [],
        slug: collection.slug || "",
        imageUrl: collection.imageUrl || "",
        isFeatured: collection.isFeatured || false,
        // Don't include storeId in update DTO as it's not needed and not in the interface
      })
    }

    // Cleanup function
    return () => {
      if (productsFetchTimeoutRef.current) {
        clearTimeout(productsFetchTimeoutRef.current)
      }
      if (categoriesFetchTimeoutRef.current) {
        clearTimeout(categoriesFetchTimeoutRef.current)
      }
    }
  }, [collection, currentStore])

  // Debounced search effect
  useEffect(() => {
    if (!currentStore) return

    const debounceTimeout = setTimeout(() => {
      // We don't need to refetch from the API for search, just filter the existing products
      setCurrentPage(1) // Reset to first page when search changes
    }, 300) // 300ms debounce

    return () => {
      clearTimeout(debounceTimeout)
    }
  }, [searchTerm, currentStore])

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

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, isFeatured: checked }))
  }

  const handleImageUpload = (imageUrl: string) => {
    setFormData((prev) => ({ ...prev, imageUrl }))
  }

  const handleProductSelection = (productId: string, isChecked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      productIds: isChecked
        ? [...(prev.productIds || []), productId]
        : (prev.productIds || []).filter((id) => id !== productId),
    }))
  }

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId)
    return category?.name || "Categoría Desconocida"
  }

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    if (!currentStore) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No hay tienda seleccionada. Por favor, seleccione una tienda primero.",
      })
      return
    }

    setIsSubmitting(true)

    try {
      if (collection) {
        // For updates, don't include storeId as it's not in the UpdateCollectionDto
        const updatePayload: UpdateCollectionDto = { ...formData }
        delete (updatePayload as any).storeId

        // Ensure productIds is included even if empty
        if (!updatePayload.productIds) {
          updatePayload.productIds = []
        }

        await updateCollection(collection.id, updatePayload)
        toast({
          title: "Éxito",
          description: "Colección actualizada exitosamente",
        })
      } else {
        // For creation, ensure storeId is included
        const createPayload: CreateCollectionDto = {
          ...(formData as any),
          storeId: currentStore,
        }

        // Ensure productIds is included even if empty
        if (!createPayload.productIds) {
          createPayload.productIds = []
        }

        await createCollection(createPayload)
        toast({
          title: "Éxito",
          description: "Colección creada exitosamente",
        })
      }
      onSuccess()
    } catch (error) {
      console.error("Error in handleSubmit:", error)
      handleAnyError(error, {
        operation: collection ? "actualizar la colección" : "crear la colección",
        defaultMessage: collection ? "Error al actualizar la colección" : "Error al crear la colección",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }

  const filteredProducts = products.filter((product) => product.title.toLowerCase().includes(searchTerm.toLowerCase()))

  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  const selectedProductsCount = formData.productIds?.length || 0

  // Prepare payload for JsonViewer
  const getPayloadForJsonViewer = () => {
    // Create a clean copy of formData without undefined values
    const payload: Record<string, any> = { ...formData }

    // For creation, ensure storeId is included
    if (!collection && currentStore) {
      payload.storeId = currentStore
    }

    // For updates, remove storeId as it's not in the UpdateCollectionDto
    if (collection) {
      delete payload.storeId
    }

    // Remove any undefined or empty values
    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined || payload[key] === "") {
        delete payload[key]
      }
    })

    return {payload}
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-background/95">
      {/* Use the extracted CollectionHeader component */}
      <CollectionHeader
        title={collection ? "Editar Colección" : "Nueva Colección"}
        subtitle={collection ? `ID: ${collection.id.substring(0, 8)}` : "Crea una nueva colección para tu tienda"}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        jsonData={getPayloadForJsonViewer()}
        jsonLabel={collection ? "Datos para actualizar" : "Datos para crear"}
        itemCount={selectedProductsCount}
        itemLabel="productos"
      />

      {!currentStore ? (
        <div className="flex flex-col items-center justify-center p-8 m-4 bg-muted/40 rounded-lg border border-dashed">
          <div className="text-center space-y-3">
            <h2 className="text-xl font-semibold">No hay tienda seleccionada</h2>
            <p className="text-muted-foreground">Por favor, seleccione una tienda para gestionar colecciones.</p>
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-6 max-w-5xl">
          <div className="space-y-8">
            {/* Basic Information Section */}
            <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Info className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-medium">Información básica</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium">
                      Nombre
                    </Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="Nombre de la colección"
                      className="h-10"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug" className="text-sm font-medium">
                      Slug
                    </Label>
                    <div className="relative">
                      <Input
                        id="slug"
                        name="slug"
                        value={formData.slug}
                        onChange={(e) => {
                          setIsSlugManuallyEdited(true)
                          handleChange(e)
                        }}
                        placeholder="url-amigable"
                        className="h-10 pr-10"
                        required
                      />
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => {
                                setFormData((prev) => ({ ...prev, slug: slugify(prev.title || "") }))
                              }}
                              className="absolute right-0 top-0 h-full px-3 py-2"
                            >
                              <RotateCcw className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Regenerar slug desde el título</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Descripción
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description || ""}
                    onChange={handleChange}
                    placeholder="Describe esta colección..."
                    className="min-h-[120px] resize-y"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="isFeatured"
                    checked={formData.isFeatured || false}
                    onCheckedChange={handleCheckboxChange}
                    className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                  />
                  <Label htmlFor="isFeatured" className="font-medium cursor-pointer text-sm">
                    Destacar esta colección
                  </Label>
                </div>
              </div>
            </div>

            {/* Image Upload Section */}
            <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ImageIcon className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-medium">Imagen de la colección</h3>
                </div>

                <div className="bg-muted/30 rounded-lg p-6 flex flex-col items-center justify-center">
                  <ImageUpload
                    onImageUpload={handleImageUpload}
                    currentImageUrl={formData.imageUrl}
                    width={300}
                    height={200}
                  />
                  <p className="text-sm text-muted-foreground mt-4 text-center">
                    Recomendado: Imagen de 1200 x 800 píxeles o proporción 3:2
                  </p>
                </div>
              </div>
            </div>

            {/* Products Section */}
            <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-medium">Productos en esta colección</h3>
                    {selectedProductsCount > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {selectedProductsCount}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsProductsExpanded(!isProductsExpanded)}
                    className="h-8 w-8 p-0"
                  >
                    {isProductsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>

                {isProductsExpanded && (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <div className="relative w-full sm:max-w-xs">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 text-muted-foreground -translate-y-1/2" />
                        <Input
                          placeholder="Buscar producto..."
                          value={searchTerm}
                          onChange={handleSearchChange}
                          className="pl-10 h-9"
                        />
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-2 w-full">
                        <div className="text-sm text-muted-foreground">
                          {filteredProducts.length} productos encontrados
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === 1}
                            onClick={() => handlePageChange(currentPage - 1)}
                            className="h-8"
                          >
                            Anterior
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => handlePageChange(currentPage + 1)}
                            className="h-8"
                          >
                            Siguiente
                          </Button>
                        </div>
                      </div>
                    </div>

                    <Card className="border-0 shadow-none">
                      <CardContent className="p-0">
                        <ScrollArea className="h-[400px] w-full rounded-md border">
                          {isLoadingProducts ? (
                            <div className="flex flex-col items-center justify-center h-[300px]">
                              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-4"></div>
                              <p className="text-sm text-muted-foreground">Cargando productos...</p>
                            </div>
                          ) : (
                            <Table>
                              <TableHeader className="sticky top-0 bg-background">
                                <TableRow>
                                  <TableHead className="w-[50px]"></TableHead>
                                  <TableHead>Producto</TableHead>
                                  <TableHead className="hidden md:table-cell">
                                    <div className="flex items-center gap-1">
                                      <Tag className="h-3.5 w-3.5" />
                                      <span>Categoría</span>
                                    </div>
                                  </TableHead>
                                  <TableHead className="hidden md:table-cell">
                                    <div className="flex items-center gap-1">
                                      <ListFilter className="h-3.5 w-3.5" />
                                      <span>Estado</span>
                                    </div>
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {paginatedProducts.length > 0 ? (
                                  paginatedProducts.map((product) => (
                                    <TableRow key={product.id} className="group">
                                      <TableCell>
                                        <Checkbox
                                          checked={formData.productIds?.includes(product.id)}
                                          onCheckedChange={(checked) =>
                                            handleProductSelection(product.id, checked as boolean)
                                          }
                                          className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                        />
                                      </TableCell>
                                      <TableCell className="font-medium group-hover:text-primary transition-colors">
                                        {product.title}
                                      </TableCell>
                                      <TableCell className="hidden md:table-cell">
                                        {product.categories && product.categories.length > 0 ? (
                                          <Badge variant="outline" className="bg-muted/50">
                                            {getCategoryName(product.categories[0].id)}
                                          </Badge>
                                        ) : (
                                          <span className="text-muted-foreground text-sm">Sin categoría</span>
                                        )}
                                      </TableCell>
                                      <TableCell className="hidden md:table-cell">
                                        <Badge
                                          variant={product.status === "ACTIVE" ? "success" : "secondary"}
                                          className={
                                            product.status === "ACTIVE"
                                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                              : ""
                                          }
                                        >
                                          {product.status === "ACTIVE" ? "Activo" : product.status}
                                        </Badge>
                                      </TableCell>
                                    </TableRow>
                                  ))
                                ) : (
                                  <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                      {searchTerm
                                        ? "No se encontraron productos con ese término"
                                        : "No hay productos disponibles"}
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          )}
                        </ScrollArea>
                      </CardContent>
                    </Card>

                    {selectedProductsCount > 0 && (
                      <div className="mt-4 p-3 bg-muted/50 rounded-md flex justify-between items-center">
                        <span className="text-sm font-medium">
                          {selectedProductsCount} producto{selectedProductsCount !== 1 ? "s" : ""} seleccionado
                          {selectedProductsCount !== 1 ? "s" : ""}
                        </span>
                        {selectedProductsCount > 5 && (
                          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                            Colección destacada
                          </Badge>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Submit Button (Mobile Only) */}
            <div className="md:hidden">
              <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full gap-2">
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Guardar colección
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
