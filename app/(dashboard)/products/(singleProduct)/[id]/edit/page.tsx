'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMainStore } from '@/stores/mainStore'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { UpdateProductDto } from '@/types/product'
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowLeft, ArrowRight, Circle, CircleDollarSign, ImagePlus, Loader2, PackageIcon, Plug, Plus, RotateCcw, TrendingUpIcon as TrendingUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DescriptionEditor } from '../../_components/RichTextEditor'
import { ImageGallery } from '../../_components/ImageGallery'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { isEqual } from 'lodash'
import { UpdateProductVariantDto, ProductVariant } from '@/types/productVariant'
import { CreateVariantPriceDto, VariantPrice } from '@/types/variantPrice'
import { ProductStatus } from '@/types/common'
import { CreateProductPriceDto } from '@/types/productPrice'
import { VariantOptions } from './_components/VariantOptionsE'
import Image from 'next/image';
import { getImageUrl } from '@/lib/imageUtils';
import { slugify } from '@/lib/slugify'
import { uploadAndGetUrl } from '@/lib/imageUploader'

// Define the structure of the form data, extending UpdateProductDto
type FormData = Omit<UpdateProductDto, 'variants'> & {
  variants: ProductVariant[];
  options: ProductOption[];
  prices: CreateProductPriceDto[];
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
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const { 
    getProductById, 
    updateProduct, 
    categories, 
    collections, 
    fetchCategories, 
    fetchProducts,
    fetchCollections, 
    fetchShopSettings, 
    shopSettings 
  } = useMainStore()
  const { toast } = useToast()
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
 
    prices: [],
    variants: [],
    options: []
  })
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false)
  const [productOptions, setProductOptions] = useState<ProductOption[]>([])
  const [variantCombinations, setVariantCombinations] = useState<VariantCombination[]>([])
  const [product, setProduct] = useState<any>(null)
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState("")

  useEffect(() => {
    const fetchProductData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchProducts(),
          fetchCategories(),
          fetchCollections(),
          fetchShopSettings()
        ]);

        const fetchedProduct = getProductById(id);
        if (fetchedProduct) {
          setProduct(fetchedProduct);
          const initialVariants = fetchedProduct.variants || [];
          setUseVariants(initialVariants.length > 0);

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

            prices: fetchedProduct.prices || [],
            variants: initialVariants,
            options: extractProductOptions(initialVariants)
          });

          const extractedOptions = extractProductOptions(initialVariants);
          setProductOptions(extractedOptions);

          const extractedCombinations = initialVariants.map(variant => ({
            id: variant.id,
            enabled: true,
            attributes: variant.attributes
          }));
          setVariantCombinations(extractedCombinations);
        } else {
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
  }, [id, getProductById, fetchCategories, fetchCollections, fetchShopSettings,fetchProducts, router, toast]);

  useEffect(() => {
    console.log("variantCombinations changed:", variantCombinations);
    if (useVariants && variantCombinations.length > 0) {
      const enabledVariants = variantCombinations.filter(v => v.enabled);
      const newVariants: ProductVariant[] = enabledVariants.map(combo => {
        const existingVariant = formData.variants.find(v =>
          isEqual(v.attributes, combo.attributes)
        );

        return existingVariant || {
          id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: Object.values(combo.attributes).join(' / '),
          sku: '',
          imageUrl: '',
          inventoryQuantity: 0,
          weightValue: 0,
          prices: [],
          attributes: combo.attributes,
          product: {} as any,
          productId: '',
          compareAtPrice: 0,
          position: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      });

      if (!isEqual(formData.variants, newVariants)) {
        setFormData(prev => ({
          ...prev,
          variants: newVariants,
          prices: []
        }));
      }
    } else if (!useVariants && formData.variants.length > 0) {
      const defaultVariant = formData.variants[0];
      setFormData(prev => ({
        ...prev,
        variants: [],
        sku: defaultVariant.sku || '',
        imageUrls: defaultVariant.imageUrl ? [defaultVariant.imageUrl] : [],
        inventoryQuantity: defaultVariant.inventoryQuantity,
        weightValue: defaultVariant.weightValue || 0,

        prices: defaultVariant.prices
      }));
    }
  }, [useVariants, variantCombinations]);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      options: productOptions
    }));
  }, [productOptions]);

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

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, slug: slugify(e.target.value) }))
    setIsSlugManuallyEdited(true)
  }

  const handleImageUpload = async (variantId: string) => {
    const input = document.createElement("input");
    console.log(variantId)
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
  
      const uploadedUrl = await uploadAndGetUrl(file);
      console.log(uploadedUrl)
      if (!uploadedUrl) return;
  
      setFormData(prev => ({
        ...prev,
        variants: prev.variants.map(v =>
          v.id === variantId ? { ...v, imageUrl: getImageUrl(uploadedUrl) } : v
        )
      }));
    };
    input.click();
    console.log("ORFRMRMRMRM, ")
    console.log(formData)
 
  };
  

  const handleInputChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

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
              currency: {} as any,
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

  const handleCellClick = (cellId: string) => {
    setSelectedCell(cellId);
  };

  const renderStep1 = () => (
    <>
      <div className='box-container h-fit'>
        <div className='box-section flex flex-col justify-start items-start '>
          <h3 className=''>Detalle del Producto</h3>
          <span className='content-font text-gray-500'>Actualice la información básica de su producto.</span>
        </div>

        <div className=" box-section border-none flex-row  gap-12 pb-6 items-start ">
          <div className='w-1/2 flex flex-col gap-3 '>
            <div className="space-y-2">
              <Label htmlFor="title" className="content-font">
                Nombre
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className=" "
              />
            </div>

            <div className='flex gap-4'>
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
                  className=" "
                />
              </div>
            </div>

            <div className='flex gap-4'>
              <div className="space-y-3 w-1/2">
                <Label className="text-sm font-medium text-muted-foreground">Colección</Label>
                <Select
                  value={formData.collectionIds![0] || ''}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, collectionIds: [value] }))}
                >
                  <SelectTrigger className=" ">
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
                  value={formData.categoryIds![0] || ''}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, categoryIds: [value] }))}
                >
                  <SelectTrigger className=" ">
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
              isEditing={true}
            />
          </div>
        </div>
      </div>
    </>
  );

  const renderStep2 = () => (
    <>
      <div className='box-container h-fit'>
        <div className='box-section flex flex-col justify-start items-start '>
          <h3>{useVariants ? "Detalles de Variantes" : "Detalles de Producto"}</h3>
          <span className='content-font text-gray-500'>
            {useVariants
              ? "Gestione sus variantes de producto y sus detalles específicos."
              : "Gestione su producto y sus detalles específicos."}
          </span>
        </div>
        <div className="box-section border-none px-0 gap-12 pb-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='p-0 pl-6 '>Nombre</TableHead>
                <TableHead className='p-0  w-[250px]'>SKU</TableHead>
  
                <TableHead className='p-0 w-[100px]'>Peso</TableHead>
 
                <TableHead className='p-0 w-[100px]'>Cantidad</TableHead>
                {shopSettings?.[0]?.acceptedCurrencies.map(currency => (
                  <TableHead className='p-0 w-[100px]' key={currency.id}>Precio ({currency.code})</TableHead>
                ))}
                {useVariants && <TableHead className='p-0 w-[300px]'>Atributos</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {useVariants ? (
                formData.variants.map((variant) => (
                  <TableRow key={variant.id} className='content-font'>
                    {renderVariantCells(variant)}
                  </TableRow>
                ))
              ) : (
                <TableRow className='pl-3 h-6'>
                  {renderSimpleProductCells()}
                </TableRow>
              )}
            </TableBody>
          </Table>
           
        </div>
      </div>
    </>
  );

  const renderVariantCells = (variant: ProductVariant) => {
    const cellsData = [
      { 
        id: `${variant.id}`, 
        content: variant.title, 
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleVariantChange(variant.id, 'title', e.target.value),
        imageUrl: variant.imageUrl
      },
      { id: `sku-${variant.id}`, content: variant.sku, onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleVariantChange(variant.id, 'sku', e.target.value) },
      { id: `weightValue-${variant.id}`, content: variant.weightValue.toString(), onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleVariantChange(variant.id, 'weightValue', parseFloat(e.target.value) || 0), type: 'number' },
      { id: `inventoryQuantity-${variant.id}`, content: variant.inventoryQuantity.toString(), onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleVariantChange(variant.id, 'inventoryQuantity', parseInt(e.target.value) || 0), type: 'number' },
      ...shopSettings?.[0]?.acceptedCurrencies.map(currency => ({
        id: `price-${variant.id}-${currency.id}`,
        content: (variant.prices.find(p => p.currencyId === currency.id)?.price || 0).toString(),
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleVariantPriceChange(variant.id, currency.id, parseFloat(e.target.value) || 0),
        type: 'number'
      })),
      ...(useVariants ? [{ id: `attributes-${variant.id}`, content: JSON.stringify(variant.attributes), disabled: true }] : [])
    ];

    return cellsData.map((cell, index) => (
      <TableCell
        key={cell.id}
        className={cn(
          'p-1 ',
          selectedCell === cell.id ? 'bg-blue-100/80 dark:bg-blue-800/30 border border-blue-500 dark:border-sky-300/50' : ''
        )}
        onClick={() => handleCellClick(cell.id)}
      >
        {index === 0 && (
          <div className="flex items-center gap-2">
            
            <div className="relative w-10 h-10 bg-accent rounded-md py-1 ml-6 inline-block">
            {cell.imageUrl ? (
              <Image src={getImageUrl(cell.imageUrl)} alt="Variant Image" layout="fill" objectFit="cover" className="rounded-md" />
            ) : (
              <Button
                onClick={() => handleImageUpload(cell.id)}
                variant="ghost"
                className="flex items-center justify-center w-full h-full   transition"
              >
                <ImagePlus className="w-5 h-5 text-gray-500" />
              </Button>
            )}
          </div>


    
            <Input
              value={cell.content}
              onChange={cell.onChange}
              type={cell.type || 'text'}
              disabled={cell.disabled}
              className="bg-transparent border-0 content-font p-0 h-auto focus:ring-0 focus:outline-none"
            />
          </div>
        )}
        {index !== 0 && (
          <Input
            value={cell.content}
            onChange={cell.onChange}
            type={cell.type || 'text'}
            disabled={cell.disabled}
            className="bg-transparent border-0 content-font p-0 h-auto focus:ring-0 focus:outline-none"
          />
        )}
      </TableCell>
    ));
  };

  const renderSimpleProductCells = () => {
    const cellsData = [
      { id: 'title', content: formData.title, onChange: handleChange, imageUrl: formData.imageUrls![0] || '' },
      { id: 'sku', content: formData.sku, onChange: handleChange },
      { id: 'weightValue', content: formData.weightValue?.toString() || '', onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('weightValue', parseFloat(e.target.value)), type: 'number' },
      { id: 'inventoryQuantity', content: formData.inventoryQuantity?.toString() || '', onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('inventoryQuantity', parseInt(e.target.value)), type: 'number' },
      ...shopSettings?.[0]?.acceptedCurrencies.map(currency => ({
        id: `price-${currency.id}`,
        content: (formData.prices.find(p => p.currencyId === currency.id)?.price || '').toString(),
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
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
        },
        type: 'number'
      }))
    ];

    return cellsData.map((cell, index) => (
      <TableCell
        key={cell.id}
        className={cn(
          'p-1 h-6',
          selectedCell === cell.id ? 'bg-blue-100/80 dark:bg-blue-800/30 border border-blue-500 dark:border-sky-300/50' : ''
        )}
        onClick={() => handleCellClick(cell.id)}
      >
        {index === 0 && (
          <div className="flex items-center gap-2">
            
              <div className="relative w-10 h-10 mr-2 bg-accent rounded-md py-1 inline-block ml-6">
              {cell.imageUrl && (
                <Image
                  src={getImageUrl(cell.imageUrl) || ""}
                  alt={formData.title || ""}
                  layout="fill"
                  objectFit="cover"
                  className="rounded-md"
                />
              )
        
            }
            </div>
            <Input
              value={cell.content}
              onChange={cell.onChange}
              name={cell.id}
              type={cell.type || 'text'}
              className="bg-transparent border-0 text-foreground h-7 p-0 focus:ring-0 focus:outline-none"
            />
          </div>
        )}
        {index !== 0 && (
          <Input
            value={cell.content}
            onChange={cell.onChange}
            name={cell.id}
            type={cell.type || 'text'}
            className="bg-transparent border-0 text-foreground h-7 p-0 focus:ring-0 focus:outline-none"
          />
        )}
      </TableCell>
    ));
  };

  return (
    <div className="text-foreground">
      <header className="sticky top-0 z-10 flex items-center justify-between h-[57px] border-b border-border bg-background px-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            className={cn(
              "text-muted-foreground hover:text-foreground h-[57px] rounded-none px-8",
              currentStep === 1 && "text-foreground border-b-[3px] pt-[10px] border-sky-600 "
            )}
            onClick={() => setCurrentStep(1)}
          >
            <PackageIcon className='text-foreground mr-2' />
            Detalles
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "text-muted-foreground hover:text-foreground h-[57px] rounded-none px-8",
              currentStep === 2 && "text-foreground border-b-[3px] pt-[10px] border-sky-600 "
            )}
            onClick={() => setCurrentStep(2)}
          >
            <CircleDollarSign className='text-foreground mr-2' />
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
          <Button
            onClick={handleSubmit}
            className="create-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Actualizar Producto'
            )}
          </Button>
        </div>
      </header>
      <ScrollArea className="h-[calc(100vh-3.6em)]">
      <div className="p-6">
        
          {currentStep === 1 ? renderStep1() : renderStep2()}
        
      </div>
      </ScrollArea>
    </div>
  )
}

