import { useState, useEffect } from "react"
import { useMainStore } from "@/stores/mainStore"
import type { Collection, CreateCollectionDto, UpdateCollectionDto } from "@/types/collection"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ImageUpload } from "@/components/ImageUpload"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Search } from "lucide-react"

interface CollectionFormProps {
  collection?: Collection
  onSuccess: () => void
}

export function CollectionForm({ collection, onSuccess }: CollectionFormProps) {
  const { createCollection, updateCollection, products, categories, fetchProducts, fetchCategories } = useMainStore()
  const { toast } = useToast()
  const [formData, setFormData] = useState<CreateCollectionDto | UpdateCollectionDto>({
    title: "",
    description: "",
    slug: "",
    productIds: [],
    imageUrl: "",
  })
  const router = useRouter()

  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchProducts()
        await fetchCategories()
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch products or categories.",
        })
      }
    }

    fetchData()

    if (collection) {
      setFormData({
        title: collection.title || "",
        description: collection.description || "",
        productIds: collection.products.map((p) => p.id) || [],
        slug: collection.slug || "",
        imageUrl: collection.imageUrl || "",
      })
    }
  }, [collection, fetchProducts, fetchCategories, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (collection) {
        await updateCollection(collection.id, formData as UpdateCollectionDto)
        toast({
          title: "Éxito",
          description: "Colección actualizada exitosamente",
        })
      } else {
        console.log("Colecion Payload: ", formData)
        await createCollection(formData as CreateCollectionDto)
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

  const filteredProducts = products.filter((product) => product.title.toLowerCase().includes(searchTerm.toLowerCase()))

  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  return (
    <>
      <div className="box-section flex items-center justify-between mb-6 ">
        <h3>{collection ? "Editar" : "Crear"} Colección</h3>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => router.back()}>
            Volver
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            className="create-button"
          >
            {collection ? "Actualizar" : "Crear"} Colección
          </Button>
        </div>
      </div>
      <div className="px-6 py-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="title">Nombre</Label>
            <Input id="title" name="title" value={formData.title} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" name="slug" value={formData.slug} onChange={handleChange} required />
          </div>
        </div>
        <div className="space-y-2 mt-4">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={4}
          />
        </div>
        <div className="space-y-2 mt-4 ">
          <Label htmlFor="search" className="mb-2">
            Buscar Producto
          </Label>
          <div className="flex justify-between">
            <div className="relative max-w-xl">
              <Search className="absolute top-1/2 left-3 h-4 w-4 text-gray-500 -translate-y-1/2" />
              <Input
                placeholder="Buscar producto..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 h-8 bg-accent/40"
              />
            </div>
            <div className="flex gap-4">
              <Button variant="outline" disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)}>
                Anterior
              </Button>

              <Button
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Checkbox
                      checked={formData.productIds?.includes(product.id)}
                      onCheckedChange={(checked) => {
                        setFormData((prev) => ({
                          ...prev,
                          productIds: checked
                            ? [...(prev.productIds || []), product.id]
                            : (prev.productIds || []).filter((id) => id !== product.id),
                        }))
                      }}
                    />
                  </TableCell>
                  <TableCell>{product.title}</TableCell>
                  <TableCell>{product.inventoryQuantity}</TableCell>
                  <TableCell>
                    {categories.find((cat) => cat.id === product.categories[0]?.id)?.name || "Desconocido"}
                  </TableCell>
                  <TableCell>{product.isArchived ? "Archivado" : "Activo"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 space-y-2">
          <Label>Imagen de la Colección</Label>
          <ImageUpload onImageUpload={handleImageUpload} currentImageUrl={formData.imageUrl} width={300} height={200} />
        </div>
      </div>
    </>
  )
}

