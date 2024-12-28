import { useState, useEffect } from 'react'
import { useMainStore } from '@/stores/mainStore'
import { Collection, CreateCollectionDto, UpdateCollectionDto } from '@/types/collection'
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ImageUpload } from '@/components/ImageUpload'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"

interface CollectionFormProps {
  collection?: Collection
  onSuccess: () => void
}

export function CollectionForm({ collection, onSuccess }: CollectionFormProps) {
  const { createCollection, updateCollection, products, categories, fetchProducts, fetchCategories } = useMainStore()
  const { toast } = useToast()
  const [formData, setFormData] = useState<CreateCollectionDto | UpdateCollectionDto>({
    name: '',
    description: '',
    productIds: [],
    isFeatured: false,
    imageUrl: null,
  })

  useEffect(() => {
    fetchProducts()
    fetchCategories()
    if (collection) {
      setFormData({
        name: collection.name,
        description: collection.description,
        productIds: collection.products.map(p => p.id),
        isFeatured: collection.isFeatured,
        imageUrl: collection.imageUrl,
      })
    }
  }, [collection, fetchProducts, fetchCategories])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, isFeatured: checked }))
  }

  const handleImageUpload = (imageUrl: string) => {
    setFormData(prev => ({ ...prev, imageUrl }))
  }

  const handleProductSelection = (productId: string, isChecked: boolean) => {
    setFormData(prev => ({
      ...prev,
      productIds: isChecked
        ? [...(prev.productIds || []), productId]
        : (prev.productIds || []).filter(id => id !== productId)
    }))
  }

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId)
    return category ? category.name : 'Unknown Category'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (collection) {
        await updateCollection(collection.id, formData as UpdateCollectionDto)
        toast({
          title: "Success",
          description: "Collection updated successfully",
        })
      } else {
        await createCollection(formData as CreateCollectionDto)
        toast({
          title: "Success",
          description: "Collection created successfully",
        })
      }
      onSuccess()
    } catch (error) {
      console.log(error)
      toast({
        variant: "destructive",
        title: "Error",
        description: collection ? "Failed to update collection" : "Failed to create collection",
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label>Products</Label>
        <ScrollArea className="h-[400px] w-full border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Select</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Checkbox
                      checked={formData.productIds?.includes(product.id)}
                      onCheckedChange={(checked) => handleProductSelection(product.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>${product.price}</TableCell>
                  <TableCell>{product.quantity}</TableCell>
                  <TableCell>{getCategoryName(product.categoryId)}</TableCell>
                  <TableCell>{product.isArchived ? 'Archived' : 'Active'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="isFeatured"
          checked={formData.isFeatured}
          onCheckedChange={handleCheckboxChange}
        />
        <Label htmlFor="isFeatured">Featured Collection</Label>
      </div>
      <div>
        <Label>Collection Image</Label>
        <ImageUpload
          onImageUpload={handleImageUpload}
          currentImageUrl={formData.imageUrl}
          width={300}
          height={200}
        />
      </div>
      <Button type="submit">{collection ? 'Update' : 'Create'} Collection</Button>
    </form>
  )
}

