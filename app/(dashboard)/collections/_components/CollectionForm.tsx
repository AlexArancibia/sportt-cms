"use client"

import { useState, useEffect } from "react"
import { useStores } from "@/hooks/useStores"
import { useCollectionMutations } from "@/hooks/useCollections"
import { useProducts } from "@/hooks/useProducts"
import type { Collection, CreateCollectionDto, UpdateCollectionDto } from "@/types/collection"
import { useToast } from "@/hooks/use-toast"
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

const PRODUCTS_PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 500

function sanitizeCollectionImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) return ""
  if (
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://") ||
    imageUrl.startsWith("/")
  ) {
    return imageUrl
  }
  return `/uploads/${imageUrl}`
}

export function CollectionForm({ collection, onSuccess }: CollectionFormProps) {
  const { currentStoreId } = useStores()
  const { createCollection, updateCollection, isCreating, isUpdating } =
    useCollectionMutations(currentStoreId ?? null)

  const { toast } = useToast()
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false)
  const [formData, setFormData] = useState<CreateCollectionDto | UpdateCollectionDto>({
    title: "",
    description: "",
    slug: "",
    products: [],
    imageUrl: "",
    storeId: currentStoreId || "",
  })

  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [isProductsExpanded, setIsProductsExpanded] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setCurrentPage(1)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [searchTerm])

  const productsParams = {
    page: currentPage,
    limit: PRODUCTS_PAGE_SIZE,
    sortBy: "createdAt" as const,
    sortOrder: "desc" as const,
    ...(debouncedSearchTerm.trim() ? { query: debouncedSearchTerm.trim() } : undefined),
  }
  const {
    data: productsResponse,
    isLoading: isLoadingProducts,
  } = useProducts(
    currentStoreId ?? null,
    productsParams,
    !!currentStoreId
  )

  const products = productsResponse?.data ?? []
  const productsPagination = productsResponse?.pagination ?? {
    page: 1,
    limit: PRODUCTS_PAGE_SIZE,
    total: 0,
    totalPages: 0,
  }

  useEffect(() => {
    if (currentStoreId) {
      setFormData((prev) => ({
        ...prev,
        storeId: currentStoreId,
      }))
    }

    if (collection) {
      setFormData({
        title: collection.title || "",
        description: collection.description || "",
        products: collection.products?.map((p) => ({ productId: p.id })) || [],
        slug: collection.slug || "",
        imageUrl: sanitizeCollectionImageUrl(collection.imageUrl),
        isFeatured: collection.isFeatured ?? false,
      })
    }
  }, [collection, currentStoreId])

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
    setFormData((prev) => {
      const currentProducts = (prev as any).products || []
      
      if (isChecked) {
        // Add product if not already selected
        const isAlreadySelected = currentProducts.some((p: any) => p.productId === productId)
        if (!isAlreadySelected) {
          return {
            ...prev,
            products: [...currentProducts, { productId }]
          }
        }
      } else {
        // Remove product
        return {
          ...prev,
          products: currentProducts.filter((p: any) => p.productId !== productId)
        }
      }
      
      return prev
    })
  }

  const isSubmitting = isCreating || isUpdating

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    if (!currentStoreId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No hay tienda seleccionada. Por favor, seleccione una tienda primero.",
      })
      return
    }

    try {
      if (collection) {
        // For updates, convert products format to match API expectations
        const updatePayload: UpdateCollectionDto = { ...formData }
        delete (updatePayload as any).storeId

        updatePayload.products = (formData as any).products || []
        // Enviar null (no "") al quitar imagen: el backend solo omite validación con null/undefined
        updatePayload.imageUrl = formData.imageUrl?.trim() ? formData.imageUrl : null

        await updateCollection({ id: collection.id, data: updatePayload })
        toast({
          title: "Éxito",
          description: "Colección actualizada exitosamente",
        })
      } else {
        // For creation, don't include storeId in body (it goes in URL)
        const createPayload: CreateCollectionDto = {
          title: formData.title || "",
          description: formData.description || undefined,
          slug: formData.slug || "",
          imageUrl: formData.imageUrl || undefined,
          isFeatured: formData.isFeatured || false,
          products: (formData as any).products || []
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
      toast({
        variant: "destructive",
        title: "Error",
        description: collection ? "Error al actualizar la colección" : "Error al crear la colección",
      })
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  const selectedProductsCount = (formData as any).products?.length || 0

  // Prepare payload for JsonViewer
  const getPayloadForJsonViewer = () => {
    // Create a clean copy of formData without undefined values
    const payload: Record<string, any> = { ...formData }

    // For creation, ensure storeId is included
    if (!collection && currentStoreId) {
      payload.storeId = currentStoreId
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

      {!currentStoreId ? (
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
                          {isLoadingProducts ? (
                            "Cargando productos..."
                          ) : (
                            `Mostrando ${((productsPagination.page - 1) * productsPagination.limit) + 1} a ${Math.min(productsPagination.page * productsPagination.limit, productsPagination.total)} de ${productsPagination.total} productos`
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === 1 || isLoadingProducts}
                            onClick={() => handlePageChange(currentPage - 1)}
                            className="h-8"
                          >
                            Anterior
                          </Button>
                          
                           {/* Paginación simple: 2 anteriores + actual + 2 siguientes + primera + última */}
                           {productsPagination.totalPages > 1 && (
                             <div className="flex items-center gap-1">
                               {(() => {
                                 const totalPages = productsPagination.totalPages
                                 const pages = []

                                 // Si hay pocas páginas (5 o menos), mostrar todas
                                 if (totalPages <= 5) {
                                   for (let i = 1; i <= totalPages; i++) {
                                     pages.push(
                                       <Button
                                         key={i}
                                         variant={currentPage === i ? "default" : "outline"}
                                         size="sm"
                                         onClick={() => handlePageChange(i)}
                                         disabled={isLoadingProducts}
                                         className="h-8 w-8 p-0"
                                       >
                                         {i}
                                       </Button>
                                     )
                                   }
                                   return pages
                                 }

                                 // Para muchas páginas: mostrar primera + elipsis + 2 anteriores + actual + 2 siguientes + elipsis + última
                                 
                                 // Siempre mostrar página 1
                                 pages.push(
                                   <Button
                                     key="1"
                                     variant={currentPage === 1 ? "default" : "outline"}
                                     size="sm"
                                     onClick={() => handlePageChange(1)}
                                     disabled={isLoadingProducts}
                                     className="h-8 w-8 p-0"
                                   >
                                     1
                                   </Button>
                                 )

                                 // Mostrar elipsis si hay un salto desde la página 1
                                 if (currentPage > 4) {
                                   pages.push(
                                     <span key="start-ellipsis" className="px-1 text-muted-foreground">
                                       ...
                                     </span>
                                   )
                                 }

                                 // Mostrar 2 páginas anteriores a la actual (si existen)
                                 const startRange = Math.max(2, currentPage - 2)
                                 const endRange = Math.min(totalPages - 1, currentPage + 2)
                                 
                                 for (let i = startRange; i <= endRange; i++) {
                                   // Evitar duplicar la página 1
                                   if (i === 1) continue
                                   
                                   pages.push(
                                     <Button
                                       key={i}
                                       variant={currentPage === i ? "default" : "outline"}
                                       size="sm"
                                       onClick={() => handlePageChange(i)}
                                       disabled={isLoadingProducts}
                                       className="h-8 w-8 p-0"
                                     >
                                       {i}
                                     </Button>
                                   )
                                 }

                                 // Mostrar elipsis si hay un salto hacia la última página
                                 if (currentPage < totalPages - 3) {
                                   pages.push(
                                     <span key="end-ellipsis" className="px-1 text-muted-foreground">
                                       ...
                                     </span>
                                   )
                                 }

                                 // Siempre mostrar última página (si no es la página 1)
                                 if (totalPages > 1) {
                                   pages.push(
                                     <Button
                                       key={totalPages}
                                       variant={currentPage === totalPages ? "default" : "outline"}
                                       size="sm"
                                       onClick={() => handlePageChange(totalPages)}
                                       disabled={isLoadingProducts}
                                       className="h-8 w-8 p-0"
                                     >
                                       {totalPages}
                                     </Button>
                                   )
                                 }

                                 return pages
                               })()}
                             </div>
                           )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === productsPagination.totalPages || productsPagination.totalPages === 0 || isLoadingProducts}
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
                        <ScrollArea className="h-[450px] w-full rounded-md border">
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
                                {isLoadingProducts ? (
                                  <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                      <div className="flex flex-col items-center justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-4"></div>
                                        <p className="text-sm text-muted-foreground">Cargando productos...</p>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ) : products.length > 0 ? (
                                  products.map((product) => (
                                    <TableRow key={product.id} className="group">
                                      <TableCell>
                                        <Checkbox
                                          checked={(formData as any).products?.some((p: any) => p.productId === product.id) || false}
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
                                            {product.categories[0].name ?? "Sin categoría"}
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
