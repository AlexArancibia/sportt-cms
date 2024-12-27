"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMainStore } from '@/stores/mainStore'
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Loader2 } from 'lucide-react'
import { CreateProductDto } from '@/types/product'
import { useToast } from "@/hooks/use-toast"
import { BasicForm } from '../_components/BasicForm'
import { VariantsSection } from '../_components/VariantsSection'
import { MediaUploadSection } from '../_components/MediaUpload'
import { Input } from "@/components/ui/input"
import apiClient from '@/lib/axiosConfig'
 
interface Option {
  name: string;
  values: string[];
}

interface UploadResponse {
  message: string;
  filename: string;
  mimetype: string;
  size: number;
  dto: {
    description: string;
  };
}

interface VariantCombination {
  id: string;
  productId: string;
  price: string;
  quantity: number;
  attributes: Record<string, string>;
  imageUrl: string | null;
}

export default function NewProductPage() {
  const router = useRouter()
  const { categories, createProduct, fetchCategories } = useMainStore()
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const [productData, setProductData] = useState<CreateProductDto>({
    name: '',
    description: '',
    price: 0,
    quantity: 0,
    categoryId: '',
    coverImage: null,
    galleryImages: [],
    variants: []
  })
  const [options, setOptions] = useState<Option[]>([])
  const [variantCombinations, setVariantCombinations] = useState<VariantCombination[]>([])
  const [errors, setErrors] = useState<{
    name?: string;
    categoryId?: string;
  }>({})

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const handleChange = (field: string, value: string | number) => {
    setProductData(prev => ({ ...prev, [field]: value }))
    if (field === 'name' || field === 'categoryId') {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSelectChange = (value: string) => {
    setProductData(prev => ({ ...prev, categoryId: value }))
    setErrors(prev => ({ ...prev, categoryId: undefined }))
  }

  const uploadFile = async (file: File, description: string = '') => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('description', description)

    try {
      const response = await apiClient.post<UploadResponse>('/file/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data.filename
    } catch (error) {
      console.error('Error uploading file:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload image. Please try again.",
      })
      throw error
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'gallery') => {
    const files = e.target.files
    if (!files?.length) return

    try {
      if (type === 'cover') {
        const filename = await uploadFile(files[0], 'Cover image')
        setProductData(prev => ({ ...prev, coverImage: filename }))
      } else {
        const uploadPromises = Array.from(files).map(file => 
          uploadFile(file, 'Gallery image')
        )
        const filenames = await Promise.all(uploadPromises)
        setProductData(prev => ({
          ...prev,
          galleryImages: [...prev.galleryImages, ...filenames]
        }))
      }
    } catch (error) {
      console.error('Error handling image upload:', error)
    }
  }

  const handleRemoveGalleryImage = (index: number) => {
    setProductData(prev => ({
      ...prev,
      galleryImages: prev.galleryImages.filter((_, i) => i !== index)
    }))
  }

  const addOption = () => {
    setOptions(prev => [...prev, { name: '', values: [] }])
  }

  const updateOptionName = (index: number, name: string) => {
    setOptions(prev => prev.map((opt, i) =>
      i === index ? { ...opt, name } : opt
    ))
  }

  const addValueToOption = (optionIndex: number, value: string) => {
    if (!value.trim()) return

    setOptions(prev => prev.map((opt, i) =>
      i === optionIndex
        ? { ...opt, values: [...opt.values, value.trim()] }
        : opt
    ))
  }

  const removeValueFromOption = (optionIndex: number, valueIndex: number) => {
    setOptions(prev => prev.map((opt, i) =>
      i === optionIndex
        ? { ...opt, values: opt.values.filter((_, vI) => vI !== valueIndex) }
        : opt
    ))
  }

  const removeOption = (index: number) => {
    setOptions(prev => prev.filter((_, i) => i !== index))
  }

  const updateVariantField = (variantId: string, field: keyof VariantCombination, value: string | number | null) => {
    setVariantCombinations(prev => prev.map(v =>
      v.id === variantId ? { ...v, [field]: value } : v
    ))
  }

  const handleUpdateOptions = (updatedOptions: Option[]) => {
    setOptions(updatedOptions);
  };

  const validateForm = (): string | null => {
    const errors: string[] = [];

    if (!productData.name.trim()) {
      errors.push("El nombre del producto es obligatorio");
    }

    if (!productData.categoryId) {
      errors.push("Debes seleccionar una categoría");
    }

    return errors.length > 0 ? errors.join(". ") : null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const errorMessage = validateForm();
    if (errorMessage) {
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      })
      return
    }

    setLoading(true)
    try {
      const payload = {
        ...productData,
        price: parseFloat(productData.price.toString()),
        quantity: parseInt(productData.quantity.toString()),
        variants: variantCombinations.map(variant => ({
          price: parseFloat(variant.price),
          quantity: variant.quantity,
          attributes: variant.attributes,
          imageUrl: variant.imageUrl
        }))
      }

      const createdProduct = await createProduct(payload)
      console.log('Created product:', createdProduct)

      toast({
        title: "Éxito",
        description: "Producto creado correctamente",
      })

      router.push('/products')
    } catch (error) {
      console.error('Failed to create product:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear el producto. Por favor, inténtalo de nuevo.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 h-[57px] border-b bg-background w-full">
        <h1 className="text-lg font-semibold">Nuevo Producto</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.back()}>Volver</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar'
            )}
          </Button>
        </div>
      </header>
      <div className="flex min-h-[calc(100vh-3.5rem)]">
        <div className="w-[50%] border-r">
          <ScrollArea className="h-[calc(100vh-3.5rem)]">
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    name="name"
                    value={productData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoryId">Categoría</Label>
                  <Select onValueChange={handleSelectChange} value={productData.categoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
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

              <BasicForm productData={productData} onChange={handleChange} />

              <MediaUploadSection
                coverImage={productData.coverImage}
                galleryImages={productData.galleryImages}
                onImageUpload={handleImageUpload}
                onRemoveGalleryImage={handleRemoveGalleryImage}
              />
            </div>
          </ScrollArea>
        </div>

        <div className="w-[50%]">
          <ScrollArea className="h-[calc(100vh-3.5rem)]">
            <div className="p-6 space-y-6">
              <VariantsSection
                options={options}
                variantCombinations={variantCombinations}
                onAddOption={addOption}
                onUpdateOptionName={updateOptionName}
                onAddValueToOption={addValueToOption}
                onRemoveValueFromOption={removeValueFromOption}
                onRemoveOption={removeOption}
                onUpdateVariantField={updateVariantField}
                setVariantCombinations={setVariantCombinations}
                onUpdateOptions={handleUpdateOptions}
                uploadFile={uploadFile}
              />
            </div>
          </ScrollArea>
        </div>
      </div>
    </>
  )
}

