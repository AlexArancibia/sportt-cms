'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMainStore } from '@/stores/mainStore'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { CreateProductDto } from '@/types/product'
import { CreateProductVariantDto } from '@/types/productVariant'
import { CreateVariantPriceDto } from '@/types/variantPrice'
import { ProductStatus } from '@/types/common'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, X, ArrowLeft, ArrowRight } from 'lucide-react'
import { cn, slugify } from '@/lib/utils'
import { DescriptionEditor } from '../_components/RichTextEditor'
import { ImageGallery } from '../_components/ImageGallery'
import { VariantOptions } from '../_components/VariantOptions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Variant extends Omit<CreateProductVariantDto, 'productId'> {}

interface ProductOption {
  title: string;
  values: string[];
}

interface VariantCombination {
  id: string;
  enabled: boolean;
  attributes: Record<string, string>;
}

export default function NewProductPage() {
  const router = useRouter()
  const { createProduct, categories, collections, fetchCategories, fetchCollections, fetchShopSettings, shopSettings } = useMainStore()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [useVariants, setUseVariants] = useState(false)
  const [variants, setVariants] = useState<Variant[]>([{
    title: 'Default variant',
    sku: '',
    imageUrl: '',
    inventoryQuantity: 0,
    weightValue: 0,
    weightUnit: 'kg',
    prices: [],
    attributes: {}
  }])
  const [formData, setFormData] = useState<CreateProductDto>({
    title: '',  
    description: '',
    slug: '',
    vendor: '',
    status: ProductStatus.DRAFT,
    categoryIds: [],
    collectionIds: [],
    imageUrls: [],
    sku: '',
    inventoryQuantity: 0,
    weightValue: 0,
    weightUnit: '',
    prices: [],
    variants: []
  })
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false)
  const [productOptions, setProductOptions] = useState<ProductOption[]>([])
  const [variantCombinations, setVariantCombinations] = useState<VariantCombination[]>([])

  useEffect(() => {
    fetchCategories()
    fetchCollections()
    fetchShopSettings()
  }, [fetchCategories, fetchCollections, fetchShopSettings])

  useEffect(() => {
    console.log('Current formData:', formData)
    console.log('Current variants:', variants)
    console.log('Current variantCombinations:', variantCombinations)
  }, [formData, variants, variantCombinations])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => {
      const newData = { ...prev, [name]: value }
      if (name === 'title' && !isSlugManuallyEdited) {
        newData.slug = slugify(value)
      }
      return newData
    })
  }
  const handleInventoryQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setFormData(prev => ({ ...prev, inventoryQuantity: value }));
  };

  const handleWeightValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setFormData(prev => ({ ...prev, weightValue: value }));
  };

  

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, slug: slugify(e.target.value) }))
    setIsSlugManuallyEdited(true)
  }

  const handleVariantChange = (index: number, field: keyof CreateProductVariantDto, value: any) => {
    setVariants(prev => {
      const newVariants = [...prev];
      newVariants[index] = { ...newVariants[index], [field]: value };
      
      setFormData(prevFormData => ({
        ...prevFormData,
        variants: newVariants
      }));

      return newVariants;
    });
  }

  const handleVariantPriceChange = (index: number, currencyId: string, price: number) => {
    if (useVariants) {
      setVariants(prev => {
        const newVariants = prev.map((v, i) => {
          if (i === index) {
            const existingPriceIndex = v.prices.findIndex(p => p.currencyId === currencyId)
            const newPrices = [...v.prices]

            if (existingPriceIndex >= 0) {
              newPrices[existingPriceIndex] = { currencyId, price }
            } else {
              newPrices.push({ currencyId, price })
            }

            return { ...v, prices: newPrices }
          }
          return v
        })
        
        setFormData(prevFormData => ({
          ...prevFormData,
          variants: newVariants
        }))

        return newVariants
      })
    } else {
      setFormData(prev => {
        const existingPriceIndex = prev.prices.findIndex(p => p.currencyId === currencyId)
        const newPrices = [...prev.prices]

        if (existingPriceIndex >= 0) {
          newPrices[existingPriceIndex] = { currencyId, price }
        } else {
          newPrices.push({ currencyId, price })
        }

        return {
          ...prev,
          prices: newPrices
        }
      })
    }
  }

  const addVariant = () => {
    setVariants(prev => {
      const newVariant: Variant = {
        title: `Variant ${prev.length + 1}`,
        sku: '',
        imageUrl: '',
        inventoryQuantity: 0,
        weightValue: 0,
        weightUnit: 'kg',
        prices: [],
        attributes: {}
      }
      const newVariants = [...prev, newVariant]
      
      setFormData(prevFormData => ({
        ...prevFormData,
        variants: newVariants
      }))

      return newVariants
    })
  }

  const removeVariant = (index: number) => {
    setVariants(prev => {
      const newVariants = prev.filter((_, i) => i !== index)
      
      setFormData(prevFormData => ({
        ...prevFormData,
        variants: newVariants
      }))

      return newVariants
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const productData = { ...formData }
      if (useVariants) {
        // Si se usan variantes, establecer prices como un array vacío
        productData.prices = []
      } else {
        // Si no se usan variantes, eliminar el array de variantes y mover los datos a la raíz del producto
        productData.variants = []
        productData.sku = variants[0].sku
        productData.imageUrls = variants[0].imageUrl ? [variants[0].imageUrl] : []
        productData.weightValue = variants[0].weightValue
        productData.weightUnit = variants[0].weightUnit
        productData.inventoryQuantity = variants[0].inventoryQuantity
        productData.prices = variants[0].prices
      }
      console.log('Submitting product data:', formData)
      await createProduct(formData)
      toast({
        title: "Success",
        description: "Product created successfully",
      })
      router.push('/products')
    } catch (error) {
      console.error('Error creating product:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create product",
      })
    }
  }

  useEffect(() => {
    if (useVariants) {
      const enabledVariants = variantCombinations.filter(v => v.enabled)
      const newVariants: Variant[] = enabledVariants.map((combo) => ({
        title: Object.values(combo.attributes).join(' / '),
        sku: '',
        imageUrl: '',
        inventoryQuantity: 0,
        weightValue: 0,
        weightUnit: 'kg',
        prices: [],
        attributes: combo.attributes
      }))
      setVariants(newVariants)
      setFormData(prev => ({
        ...prev,
        variants: newVariants,
        prices: []
      }))
    } else {
      const defaultVariant: Variant[] = [{
        title: 'Default variant',
        sku: '',
        imageUrl: '',
        inventoryQuantity: 0,
        weightValue: 0,
        weightUnit: 'kg',
        prices: [],
        attributes: {}
      }]
      setVariants(defaultVariant)
      setFormData(prev => ({
        ...prev,
        variants: [],
        prices: []
      }))
    }
  }, [useVariants, variantCombinations])

  const renderStep1 = () => (
    <Card className="p-6 space-y-6">
      <CardHeader>
        <CardTitle>Product Details</CardTitle>
        <CardDescription>Enter the basic information for your product.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Title</Label>
            <Input
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="bg-background border-input text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Slug</Label>
            <Input
              name="slug"
              value={formData.slug}
              onChange={handleSlugChange}
              className="bg-background border-input text-foreground"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Collection</Label>
            <Select
              value={formData.collectionIds[0] || ''}
              onValueChange={(value) => setFormData(prev => ({ ...prev, collectionIds: [value] }))}
            >
              <SelectTrigger className="bg-background border-input text-foreground">
                <SelectValue placeholder="Select collection" />
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

          <div className="space-y-2">
            <Label className="text-muted-foreground">Category</Label>
            <Select
              value={formData.categoryIds[0] || ''}
              onValueChange={(value) => setFormData(prev => ({ ...prev, categoryIds: [value] }))}
            >
              <SelectTrigger className="bg-background border-input text-foreground">
                <SelectValue placeholder="Select category" />
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

          <div className="space-y-2">
            <Label className="text-muted-foreground">Vendor</Label>
            <Input
              name="vendor"
              value={formData.vendor}
              onChange={handleChange}
              className="bg-background border-input text-foreground"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-muted-foreground">Description</Label>
          <DescriptionEditor
            initialContent={formData.description}
            onChange={(content) => setFormData(prev => ({ ...prev, description: content }))}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-muted-foreground">Media</Label>
          <ImageGallery
            images={formData.imageUrls}
            onChange={(newImages) => setFormData(prev => ({ ...prev, imageUrls: newImages }))}
            maxImages={10}
          />
        </div>

        <VariantOptions
          useVariants={useVariants}
          onUseVariantsChange={setUseVariants}
          options={productOptions}
          onOptionsChange={setProductOptions}
          variants={variantCombinations}
          onVariantsChange={setVariantCombinations} 
                  />
      </CardContent>
    </Card>
  )

  const renderStep2 = () => (
    <Card className="p-6">
      <CardHeader>
        <CardTitle>{useVariants ? "Variant Details" : "Product Details"}</CardTitle>
        <CardDescription>
          {useVariants 
            ? "Manage your product variants and their specific details."
            : "Manage your product details and pricing."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Image URL</TableHead>
                <TableHead>Weight Value</TableHead>
                <TableHead>Weight Unit</TableHead>
                <TableHead>Inventory Quantity</TableHead>
                {shopSettings?.[0]?.acceptedCurrencies.map(currency => (
                  <TableHead key={currency.id}>Price ({currency.code})</TableHead>
                ))}
                {useVariants && <TableHead>Attributes</TableHead>}
                {useVariants && <TableHead></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {useVariants ? (
                variants.map((variant, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Input
                        value={variant.title}
                        onChange={(e) => handleVariantChange(index, 'title', e.target.value)}
                        className="bg-background border-input text-foreground"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={variant.sku}
                        onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                        className="bg-background border-input text-foreground"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={variant.imageUrl}
                        onChange={(e) => handleVariantChange(index, 'imageUrl', e.target.value)}
                        className="bg-background border-input text-foreground"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={variant.weightValue}
                        onChange={(e) => handleVariantChange(index, 'weightValue', parseFloat(e.target.value))}
                        className="bg-background border-input text-foreground"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={variant.weightUnit}
                        onChange={(e) => handleVariantChange(index, 'weightUnit', e.target.value)}
                        className="bg-background border-input text-foreground"
                      />
                    </TableCell>
                    <TableCell>
                      
                      <Input
                        type="number"
                        value={variant.inventoryQuantity}
                        onChange={(e) => handleVariantChange(index, 'inventoryQuantity', parseInt(e.target.value))}
                        className="bg-background border-input text-foreground"
                      />
                    </TableCell>
                    {shopSettings?.[0]?.acceptedCurrencies.map(currency => (
                      <TableCell key={currency.id}>
                        <Input
                          type="number"
                          value={variant.prices.find(p => p.currencyId === currency.id)?.price || ''}
                          onChange={(e) => handleVariantPriceChange(index, currency.id, parseFloat(e.target.value))}
                          className="bg-background border-input text-foreground"
                        />
                      </TableCell>
                    ))}
                    <TableCell>
                      <Input
                        value={JSON.stringify(variant.attributes)}
                        onChange={(e) => handleVariantChange(index, 'attributes', JSON.parse(e.target.value))}
                        className="bg-background border-input text-foreground"
                      />
                    </TableCell>
                    <TableCell>
                      {variants.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeVariant(index)}
                          className="text-destructive hover:text-destructive/90"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell>
                    <Input
                      value={formData.title}
                      onChange={(e) => handleChange(e)}
                      name="title"
                      className="bg-background border-input text-foreground"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={formData.sku}
                      onChange={(e) => handleChange(e)}
                      name="sku"
                      className="bg-background border-input text-foreground"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={formData.imageUrls[0] || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, imageUrls: [e.target.value] }))}
                      className="bg-background border-input text-foreground"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={formData.weightValue}
                      onChange={(e) => handleWeightValueChange (e)}
                      name="weightValue"
                      className="bg-background border-input text-foreground"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={formData.weightUnit}
                      onChange={(e) => handleChange(e)}
                      name="weightUnit"
                      className="bg-background border-input text-foreground"
                    />
                  </TableCell>
                  <TableCell>
                    
                    <Input
                      type="number"
                      value={formData.inventoryQuantity}
                      onChange={(e) => handleInventoryQuantityChange (e)}
                      name="inventoryQuantity"
                      className="bg-background border-input text-foreground"
                    />
                  </TableCell>
                  {shopSettings?.[0]?.acceptedCurrencies.map(currency => (
                    <TableCell key={currency.id}>
                      <Input
                        type="number"
                        value={formData.prices.find(p => p.currencyId === currency.id)?.price || ''}
                        onChange={(e) => handleVariantPriceChange(0, currency.id, parseFloat(e.target.value))}
                        className="bg-background border-input text-foreground"
                      />
                    </TableCell>
                  ))}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {useVariants && (
          <Button
            onClick={addVariant}
            className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Variant
          </Button>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 flex items-center justify-between px-6 h-[57px] border-b border-border bg-background">
        <div className="flex gap-4">
          <Button
            variant="ghost"
            className={cn(
              "text-muted-foreground hover:text-foreground",
              currentStep === 1 && "text-foreground border-b-2 border-foreground rounded-none"
            )}
            onClick={() => setCurrentStep(1)}
          >
            Details
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "text-muted-foreground hover:text-foreground",
              currentStep === 2 && "text-foreground border-b-2 border-foreground rounded-none"
            )}
            onClick={() => setCurrentStep(2)}
          >
            Variants
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="border-border text-muted-foreground hover:bg-accent"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Create Product
          </Button>
        </div>
      </header>
      <div className="min-h-[calc(100vh-3.5rem)] p-6">
        <ScrollArea className="h-[calc(100vh-5.5rem)]">
          {currentStep === 1 ? renderStep1() : renderStep2()}
        </ScrollArea>
        <div className="flex justify-between mt-6">
          <Button
            onClick={() => setCurrentStep(1)}
            disabled={currentStep === 1}
            variant="outline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
          <Button
            onClick={() => setCurrentStep(2)}
            disabled={currentStep === 2}
          >
            Next <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

