import { useState, useEffect } from 'react';
import { useMainStore } from '@/stores/mainStore';
import { Collection, CreateCollectionDto, UpdateCollectionDto } from '@/types/collection';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ImageUpload } from '@/components/ImageUpload';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';

interface CollectionFormProps {
  collection?: Collection;
  onSuccess: () => void;
}

export function CollectionForm({ collection, onSuccess }: CollectionFormProps) {
  const { createCollection, updateCollection, products, categories, fetchProducts, fetchCategories } = useMainStore();
  const { toast } = useToast();
  const [formData, setFormData] = useState<CreateCollectionDto | UpdateCollectionDto>({
    title: '',
    description: '',
    slug: '',
    productIds: [],
    imageUrl: '',
  });
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchProducts();
        await fetchCategories();
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to fetch products or categories.',
        });
      }
    };

    fetchData();

    if (collection) {
      setFormData({
        title: collection.title || '',
        description: collection.description || '',
        productIds: collection.products.map((p) => p.id) || [],
        slug: collection.slug || '',
        imageUrl: collection.imageUrl || '',
      });
    }
  }, [collection, fetchProducts, fetchCategories, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, isFeatured: checked }));
  };

  const handleImageUpload = (imageUrl: string) => {
    setFormData((prev) => ({ ...prev, imageUrl }));
  };

  const handleProductSelection = (productId: string, isChecked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      productIds: isChecked
        ? [...(prev.productIds || []), productId]
        : (prev.productIds || []).filter((id) => id !== productId),
    }));
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category?.name || 'Unknown Category';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (collection) {
        await updateCollection(collection.id, formData as UpdateCollectionDto);
        toast({
          title: 'Success',
          description: 'Collection updated successfully',
        });
      } else {
        console.log("Colecion Payload: ",formData)
        await createCollection(formData as CreateCollectionDto);
        toast({
          title: 'Success',
          description: 'Collection created successfully',
        });
      }
      onSuccess();
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: collection ? 'Failed to update collection' : 'Failed to create collection',
      });
    }
  };

  return (
    <>
      <div className="box-section flex items-center justify-between mb-6">
        <h3>{collection ? 'Editar' : 'Crear'} Colección</h3>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => router.back()}>
            Back
          </Button>
          <Button type="submit" onClick={handleSubmit} className="bg-gradient-to-tr text-white from-emerald-700 to-emerald-500">
            {collection ? 'Update' : 'Create'} Collection
          </Button>
        </div>
      </div>
      <div className="px-6 py-3">
 
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Name</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label>Products</Label>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Select</TableHead>
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
                    <TableCell>{product.title}</TableCell>
                    <TableCell>${product.prices[0]?.price}</TableCell>
                    <TableCell>{product.inventoryQuantity}</TableCell>
                    <TableCell>{getCategoryName(product.categories[0]?.id)}</TableCell>
                    <TableCell>{product.isArchived ? 'Archived' : 'Active'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="space-y-2">
            <Label>Collection Image</Label>
            <ImageUpload
              onImageUpload={handleImageUpload}
              currentImageUrl={formData.imageUrl}
              width={300}
              height={200}
            />
          </div>
      </div>
    </>
  );
}
