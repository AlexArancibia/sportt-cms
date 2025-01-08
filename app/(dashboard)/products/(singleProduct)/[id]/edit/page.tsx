'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMainStore } from '@/stores/mainStore'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { UpdateProductDto,  } from '@/types/product'
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowLeft, ArrowRight, Loader2, Plus } from 'lucide-react'
import { cn, slugify } from '@/lib/utils'
import { DescriptionEditor } from '../../_components/RichTextEditor'
import { ImageGallery } from '../../_components/ImageGallery'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { isEqual } from 'lodash'
import { UpdateProductVariantDto, CreateProductVariantDto, ProductVariant } from '@/types/productVariant'
import { CreateVariantPriceDto, VariantPrice,  } from '@/types/variantPrice'
import { ProductStatus } from '@/types/common'
import { CreateProductPriceDto } from '@/types/productPrice'
import { VariantOptions } from './_components/VariantOptionsE'
// Define the structure of the form data, extending UpdateProductDto
type FormData = Omit<UpdateProductDto, 'variants'> & {
  variants: ProductVariant[];
  options: ProductOption[];
  prices: CreateProductPriceDto[]; // Ensure this is always an array
};

// Define the structure of a product option
interface ProductOption {
  title: string;
  values: string[];
}

// Define the structure of a variant combination
interface VariantCombination {
  id: string;
  enabled: boolean;
  attributes: Record<string, string>;
}

// Function to extract product options from variants
const extractProductOptions = (variants: ProductVariant[]): ProductOption[] => {
  const optionsMap: { [key: string]: Set<string> } = {};

  variants.forEach(variant => {
    if (variant.attributes) {
      Object.entries(variant.attributes).forEach(([key, value]) => {
        if (!optionsMap[key]) {
          optionsMap[key] = new Set();
        }
        optionsMap[key].add(value);
      });
    }
  });

  return Object.entries(optionsMap).map(([title, values]) => ({
    title,
    values: Array.from(values)
  }));
};

export default function EditProductPage() {
  // Initialize router and params
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  // Get necessary functions and data from the main store
  const { 
    getProductById, 
    updateProduct, 
    categories, 
    collections, 
    fetchCategories, 
    fetchCollections, 
    fetchShopSettings, 
    shopSettings 
  } = useMainStore()

  // Initialize toast for notifications
  const { toast } = useToast()

  // State variables
  const [currentStep, setCurrentStep] = useState(1)
  const [useVariants, setUseVariants] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [formData, setFormData] = useState<FormData>({
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
    prices: [], // Initialize as an empty array
    variants: [],
    options: []
  })
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false)
  const [productOptions, setProductOptions] = useState<ProductOption[]>([])
  const [variantCombinations, setVariantCombinations] = useState<VariantCombination[]>([])
  const [product, setProduct] = useState<any>(null)

  // Effect to fetch product data and initialize form
  useEffect(() => {
    const fetchProductData = async () => {
      setIsLoading(true);
      try {
        // Fetch necessary data
        await Promise.all([
          fetchCategories(),
          fetchCollections(),
          fetchShopSettings()
        ]);

        // Get product by ID
        const fetchedProduct = getProductById(id);
        if (fetchedProduct) {
          setProduct(fetchedProduct);
          const initialVariants = fetchedProduct.variants || [];
          setUseVariants(initialVariants.length > 0);

          // Set form data
          setFormData({
            title: fetchedProduct.title,
            description: fetchedProduct.description,
            slug: fetchedProduct.slug,
            vendor: fetchedProduct.vendor || '',
            status: fetchedProduct.status,
            categoryIds: fetchedProduct.categories.map(c => c.id),
            collectionIds: fetchedProduct.collections.map(c => c.id),
            imageUrls: fetchedProduct.imageUrls || [],
            sku: fetchedProduct.sku || '',
            inventoryQuantity: fetchedProduct.inventoryQuantity,
            weightValue: fetchedProduct.weightValue || 0,
            weightUnit: fetchedProduct.weightUnit || '',
            prices: fetchedProduct.prices || [], // Ensure it's an array even if undefined
            variants: initialVariants,
            options: extractProductOptions(initialVariants)
          });

          // Extract product options and variant combinations
          const extractedOptions = extractProductOptions(initialVariants);
          setProductOptions(extractedOptions);

          const extractedCombinations = initialVariants.map(variant => ({
            id: variant.id,
            enabled: true,
            attributes: variant.attributes
          }));
          setVariantCombinations(extractedCombinations);

        } else {
          // Show error if product not found
          toast({
            variant: "destructive",
            title: "Error",
            description: "Product not found",
          });
          router.push('/products');
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load product data",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductData();
  }, [id, getProductById, fetchCategories, fetchCollections, fetchShopSettings, router, toast]);

  // Effect to handle variant changes
  useEffect(() => {
    console.log("variantCombinations changed:", variantCombinations);

    // Check if using variants and if there are any variant combinations
    if (useVariants && variantCombinations.length > 0) {
      const enabledVariants = variantCombinations.filter(v => v.enabled);

      // Create a new array of variants only if the combinations have changed
      const newVariants: ProductVariant[] = enabledVariants.map(combo => {
        const existingVariant = formData.variants.find(v =>
          isEqual(v.attributes, combo.attributes) // Use isEqual for deep comparison
        );

        return existingVariant || {
          id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: Object.values(combo.attributes).join(' / '),
          sku: '',
          imageUrl: '',
          inventoryQuantity: 0,
          weightValue: 0,
          weightUnit: 'kg',
          prices: [],
          attributes: combo.attributes,
          product: {} as any, // This is a placeholder, it will be set by the backend
          productId: '',
          compareAtPrice: 0,
          position: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      });

      // Update formData.variants only if the newVariants array is different
      if (!isEqual(formData.variants, newVariants)) {
        setFormData(prev => ({
          ...prev,
          variants: newVariants,
          prices: [] // Reset prices if variants change
        }));
      }
    } else if (!useVariants && formData.variants.length > 0) {
      // Handle the case where useVariants is toggled off
      const defaultVariant = formData.variants[0];
      setFormData(prev => ({
        ...prev,
        variants: [],
        sku: defaultVariant.sku || '',
        imageUrls: defaultVariant.imageUrl ? [defaultVariant.imageUrl] : [],
        inventoryQuantity: defaultVariant.inventoryQuantity,
        weightValue: defaultVariant.weightValue || 0,
        weightUnit: defaultVariant.weightUnit || '',
        prices: defaultVariant.prices
      }));
    }
  }, [useVariants, variantCombinations]); // Dependency array includes useVariants

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      options: productOptions
    }));
  }, [productOptions]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => {
      const newData = { ...prev, [name]: value }
      if (name === 'title' && !isSlugManuallyEdited) {
        newData.slug = slugify(value)
      }
      console.log('formData updated:', newData);
      return newData
    })
  }

  // Handle slug changes
  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, slug: slugify(e.target.value) }))
    setIsSlugManuallyEdited(true)
  }

  const handleInputChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return

    console.log('Current formData state:', formData);
    console.log('Original product state:', product);

    const changedData: Partial<UpdateProductDto> = {};
    
    (Object.keys(formData) as Array<keyof FormData>).forEach((key) => {
      if (!isEqual(formData[key], product[key])) {
        if (key === 'variants') {
          changedData[key] = formData[key].map(({ id, product, productId, createdAt, updatedAt, ...rest }) => 
            rest
          );
        } else if (key === 'options') {
          // Options are now handled directly in the variants
        } else {
          (changedData as any)[key] = formData[key];
        }
        console.log(`Modified field: ${key}`, {
          original: product[key],
          new: formData[key]
        });
      }
    });

    if (Object.keys(changedData).length === 0) {
      console.log('No changes detected');
      toast({
        title: "No changes",
        description: "No changes were made to the product.",
      });
      return;
    }

    console.log('Final update payload:', changedData);

    setIsLoading(true)
    try {
      await updateProduct(product.id, changedData);
      console.log('Product updated successfully');
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      router.push('/products');
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update product",
      });
    } finally {
      setIsLoading(false)
    }
  }

  // Handle variant changes
  const handleVariantChange = (
    variantId: string,
    field: keyof ProductVariant,
    value: any
  ) => {
    console.log(`Updating variant ${variantId}, field ${field} to ${value}`);
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map(variant =>
        variant.id === variantId ? { ...variant, [field]: value } : variant
      )
    }));
  };

  // Handle variant price changes
  const handleVariantPriceChange = (
    variantId: string,
    currencyId: string,
    price: number
  ) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map(variant => {
        if (variant.id === variantId) {
          const existingPriceIndex = variant.prices.findIndex(p => p.currencyId === currencyId);
          const newPrices = [...variant.prices];

          if (existingPriceIndex >= 0) {
            newPrices[existingPriceIndex] = { 
              ...newPrices[existingPriceIndex], 
              price 
            } as VariantPrice;
          } else {
            newPrices.push({ 
              id: `new-${Date.now()}`, 
              variantId: variant.id, 
              currencyId, 
              price,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              currency: {} as any, // This is a placeholder, it will be set by the backend
              variant: variant
            });
          }
          return { ...variant, prices: newPrices };
        }
        return variant;
      })
    }));
  };

  const addVariant = () => {
    const newVariant: ProductVariant = {
      id: `new-${Date.now()}`,
      title: `New Variant`,
      sku: '',
      imageUrl: '',
      inventoryQuantity: 0,
      weightValue: 0,
      weightUnit: 'kg',
      prices: [],
      attributes: {},
      product: {} as any,
      productId: '',
      compareAtPrice: 0,
      position: formData.variants.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, newVariant]
    }));
  };

  // Render the first step of the form
  const renderStep1 = () => (
    <Card className="p-6 space-y-6">
      <CardHeader>
        <CardTitle>Product Details</CardTitle>
        <CardDescription>Update the basic information for your product.</CardDescription></CardHeader>
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
              value={formData.collectionIds![0] || ''}
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
              value={formData.categoryIds![0] || ''}
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
          isEditing={true}
        />
      </CardContent>
    </Card>
  )

  // Render the second step of the form
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {useVariants ? (
                formData.variants.map((variant) => (
                  <TableRow key={variant.id}>
                    {/* Variant fields */}
                    <TableCell>
                      <Input
                        value={variant.title}
                        onChange={(e) => handleVariantChange(variant.id, 'title', e.target.value)}
                        className="bg-background border-input text-foreground"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={variant.sku}
                        onChange={(e) => handleVariantChange(variant.id, 'sku', e.target.value)}
                        className="bg-background border-input text-foreground"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={variant.imageUrl}
                        onChange={(e) => handleVariantChange(variant.id, 'imageUrl', e.target.value)}
                        className="bg-background border-input text-foreground"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={variant.weightValue}
                        onChange={(e) => handleVariantChange(variant.id, 'weightValue', parseFloat(e.target.value) || 0)}
                        className="bg-background border-input text-foreground"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={variant.weightUnit}
                        onChange={(e) => handleVariantChange(variant.id, 'weightUnit', e.target.value)}
                        className="bg-background border-input text-foreground"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={variant.inventoryQuantity}
                        onChange={(e) => handleVariantChange(variant.id, 'inventoryQuantity', parseInt(e.target.value) || 0)}
                        className="bg-background border-input text-foreground"
                      />
                    </TableCell>
                    {shopSettings?.[0]?.acceptedCurrencies.map(currency => (
                      <TableCell key={currency.id}>
                        <Input
                          type="number"
                          value={variant.prices.find(p => p.currencyId === currency.id)?.price || 0}
                          onChange={(e) => handleVariantPriceChange(variant.id, currency.id, parseFloat(e.target.value) || 0)}
                          className="bg-background border-input text-foreground"
                        />
                      </TableCell>
                    ))}
                    {useVariants && (
                      <TableCell>
                        <Input
                          value={JSON.stringify(variant.attributes)}
                          disabled
                          className="bg-background border-input text-foreground"
                        />
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                // Simple product fields
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
                      value={formData.imageUrls![0] || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, imageUrls: [e.target.value] }))}
                      className="bg-background border-input text-foreground"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={formData.weightValue}
                      onChange={(e) => handleInputChange('weightValue', parseFloat(e.target.value))}
                      className="bg-background border-input text-foreground"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={formData.weightUnit}
                      onChange={(e) => handleInputChange('weightUnit', e.target.value)}
                      className="bg-background border-input text-foreground"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={formData.inventoryQuantity}
                      onChange={(e) => handleInputChange('inventoryQuantity', parseInt(e.target.value))}
                      className="bg-background border-input text-foreground"
                    />
                  </TableCell>
                  {shopSettings?.[0]?.acceptedCurrencies.map(currency => (
                    <TableCell key={currency.id}>
                      <Input
                        type="number"
                        value={formData.prices.find(p => p.currencyId === currency.id)?.price || ''}
                        onChange={(e) => {
                          const price = parseFloat(e.target.value);
                          setFormData(prev => ({
                            ...prev,
                            prices: prev.prices.map(p =>
                              p.currencyId === currency.id 
                                ? { ...p, price } 
                                : p
                            ).concat(
                              prev.prices.some(p => p.currencyId === currency.id)
                                ? []
                                : [{ currencyId: currency.id, price }]
                            )
                          }));
                        }}
                        className="bg-background border-input text-foreground"
                      />
                    </TableCell>
                  ))}
                </TableRow>
              )}
            </TableBody>
          </Table>
          {useVariants && (
            <Button
              onClick={addVariant}
              className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Variant
            </Button>
          )}
        </div>
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
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
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

