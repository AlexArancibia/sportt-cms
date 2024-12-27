'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Search, ChevronRight, ChevronDown, Pencil, Plus, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Category, CreateCategoryDto, UpdateCategoryDto } from '@/types/category'
import { useMainStore } from '@/stores/mainStore'
import { useToast } from "@/hooks/use-toast"

interface CategoryWithChildren extends Category {
  children: CategoryWithChildren[];
}

const renderCategoryOptions = (categories: CategoryWithChildren[], depth = 0): React.ReactNode[] => {
  return categories.flatMap(category => [
    <SelectItem key={category.id} value={category.id}>
      {'\u00A0'.repeat(depth * 2)}{category.name}
    </SelectItem>,
    ...renderCategoryOptions(category.children, depth + 1)
  ]);
};

const CategorySkeleton = ({ depth = 0 }: { depth?: number }) => {
  const paddingLeft = depth * 20 + 12;
  return (
    <TableRow>
      <TableCell className="w-[50%] py-2 px-2">
        <div className="flex items-center w-full" style={{ paddingLeft: `${paddingLeft}px` }}>
          <Skeleton className="h-4 w-4 mr-2" />
          <Skeleton className="h-4 w-full max-w-[200px]" />
        </div>
      </TableCell>
      <TableCell className="w-[20%] py-2 px-2"><Skeleton className="h-4 w-12" /></TableCell>
      <TableCell className="w-[20%] py-2 px-2"><Skeleton className="h-4 w-12" /></TableCell>
      <TableCell className="w-[10%] py-2 px-2"><Skeleton className="h-8 w-8" /></TableCell>
    </TableRow>
  );
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithChildren[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryWithChildren | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isSubcategory, setIsSubcategory] = useState(false)
  const [parentCategoryId, setParentCategoryId] = useState<string | undefined>(undefined)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const { fetchCategories, createCategory, updateCategory, deleteCategory } = useMainStore()

  useEffect(() => {
    const loadCategories = async () => {
      setIsLoading(true)
      try {
        const fetchedCategories = await fetchCategories()
        setCategories(buildCategoryHierarchy(fetchedCategories))
      } catch (error) {
        console.error('Error fetching categories:', error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch categories. Please try again.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadCategories()
  }, [fetchCategories, toast])

  const buildCategoryHierarchy = (flatCategories: Category[]): CategoryWithChildren[] => {
    const categoryMap = new Map<string, CategoryWithChildren>();
    const rootCategories: CategoryWithChildren[] = [];

    flatCategories.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] });
    });

    flatCategories.forEach(category => {
      if (category.parentId) {
        const parent = categoryMap.get(category.parentId);
        if (parent) {
          parent.children.push(categoryMap.get(category.id)!);
        }
      } else {
        rootCategories.push(categoryMap.get(category.id)!);
      }
    });

    return rootCategories;
  };

  const handleCreateCategory = async () => {
    try {
      const newCategory: CreateCategoryDto = {
        name: newCategoryName,
        parentId: isSubcategory ? parentCategoryId : undefined,
      }
      await createCategory(newCategory)
      setIsCreateModalOpen(false)
      setNewCategoryName('')
      setIsSubcategory(false)
      setParentCategoryId(undefined)
      const updatedCategories = await fetchCategories()
      setCategories(buildCategoryHierarchy(updatedCategories))
      toast({
        title: "Success",
        description: "Category created successfully",
      })
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create category. Please try again.",
      })
    }
  }

  const handleUpdateCategory = async () => {
    if (!editingCategory) return
    try {
      const updatedCategory: UpdateCategoryDto = {
        name: newCategoryName || editingCategory.name,
        parentId: isSubcategory ? parentCategoryId : null,
      };
      await updateCategory(editingCategory.id, updatedCategory)
      setIsEditModalOpen(false)
      setEditingCategory(null)
      setNewCategoryName('')
      setIsSubcategory(false)
      setParentCategoryId(undefined)
      const updatedCategories = await fetchCategories()
      setCategories(buildCategoryHierarchy(updatedCategories))
      toast({
        title: "Success",
        description: "Category updated successfully",
      })
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update category. Please try again.",
      })
    }
  }

  const handleDeleteSelectedCategories = async () => {
    try {
      await Promise.all(selectedCategories.map(id => deleteCategory(id)))
      const updatedCategories = await fetchCategories()
      setCategories(buildCategoryHierarchy(updatedCategories))
      setSelectedCategories([])
      toast({
        title: "Success",
        description: "Selected categories deleted successfully",
      })
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete selected categories. Please try again.",
      })
    }
  }

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  const renderCategoryRow = (category: CategoryWithChildren, depth: number = 0): React.ReactElement[] => {
    const hasChildren = category.children.length > 0;
    const paddingLeft = depth * 20 + 12;
    const isExpanded = expandedCategories.has(category.id);

    const rows: React.ReactElement[] = [
      <TableRow
        key={category.id}
        className="text-sm"
        onClick={() => hasChildren && toggleCategoryExpansion(category.id)}
      >
        <TableCell className="w-[50%] py-2 pl-3 ">
          <div className="flex items-center w-full" style={{ paddingLeft: `${paddingLeft}px` }}>
            <Checkbox
              checked={selectedCategories.includes(category.id)}
              onCheckedChange={(checked) => {
                if (typeof checked === 'boolean') {
                  setSelectedCategories(prev =>
                    checked ? [...prev, category.id] : prev.filter(id => id !== category.id)
                  )
                }
              }}
              className="mr-2 shadow-none"
              onClick={(e) => e.stopPropagation()}
            />
            {hasChildren && (
              <span className="mr-2">
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </span>
            )}
            <span className='texto flex-grow truncate'>{category.name}</span>
          </div>
        </TableCell>
        <TableCell className="w-[20%] texto py-2 pl-6">{category.products?.length || 0}</TableCell>
        <TableCell className="w-[20%] texto py-2 pl-6">{category.children.length}</TableCell>
        <TableCell className="w-[10%] texto py-2 pl-6">
          <Button
            variant="outline"
            size="sm"
            className='shadow-none'
            onClick={(e) => {
              e.stopPropagation();
              setEditingCategory(category);
              setIsEditModalOpen(true);
              setNewCategoryName(category.name);
              setIsSubcategory(!!category.parentId);
              setParentCategoryId(category.parentId || undefined);
            }}
            aria-label={`Edit ${category.name}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
    ];

    if (isExpanded && hasChildren) {
      category.children.forEach((child) => {
        rows.push(...renderCategoryRow(child, depth + 1));
      });
    }

    return rows;
  };

  const filteredCategories = useMemo(() => {
    const searchLower = searchQuery.toLowerCase();

    const filterCategory = (category: CategoryWithChildren): CategoryWithChildren | null => {
      const matchesSearch = category.name.toLowerCase().includes(searchLower);
      const filteredChildren = category.children
        .map(child => filterCategory(child))
        .filter((c): c is CategoryWithChildren => c !== null);

      if (matchesSearch || filteredChildren.length > 0) {
        return {
          ...category,
          children: filteredChildren,
        };
      }

      return null;
    };

    return categories
      .map(filterCategory)
      .filter((c): c is CategoryWithChildren => c !== null);
  }, [categories, searchQuery]);

  return (
    <div className="">
      <header className="border-b">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h1 className="text-lg font-semibold">Categories</h1>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" /> <p>New Category</p>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Category</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="newCategoryName">Category Name</Label>
                  <Input
                    id="newCategoryName"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isSubcategory"
                    checked={isSubcategory}
                    onCheckedChange={(checked) => setIsSubcategory(!!checked)}
                  />
                  <Label htmlFor="isSubcategory">Is Subcategory</Label>
                </div>
                {isSubcategory && (
                  <div>
                    <Label htmlFor="parentCategory">Parent Category</Label>
                    <Select value={parentCategoryId} onValueChange={setParentCategoryId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select parent category" />
                      </SelectTrigger>
                      <SelectContent>
                        {renderCategoryOptions(categories)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button onClick={handleCreateCategory}>Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search categories..."
              className="pl-8 w-full border-gray-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search categories"
            />
          </div>
          {selectedCategories.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelectedCategories}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected
            </Button>
          )}
        </div>
      </header>
      <div className="w-full overflow-x-auto">
        <Table className="w-full border-collapse" aria-label="Categories">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50%] py-2 px-5 font-medium">Category Name</TableHead>
              <TableHead className="w-[20%] py-2 px-5 font-medium">Products</TableHead>
              <TableHead className="w-[20%] py-2 px-5 font-medium">Subcategories</TableHead>
              <TableHead className="w-[10%] py-2 px-5 font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <>
                {[...Array(5)].map((_, index) => (
                  <CategorySkeleton key={index} depth={index % 2} />
                ))}
              </>
            ) : filteredCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4">
                  <p>No categories found</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredCategories.flatMap((category) => renderCategoryRow(category))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editCategoryName">Category Name</Label>
              <Input
                id="editCategoryName"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isSubcategoryEdit"
                checked={isSubcategory}
                onCheckedChange={(checked) => setIsSubcategory(!!checked)}
              />
              <Label htmlFor="isSubcategoryEdit">Is Subcategory</Label>
            </div>
            {isSubcategory && (
              <div>
                <Label htmlFor="parentCategoryEdit">Parent Category</Label>
                <Select value={parentCategoryId} onValueChange={setParentCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent category" />
                  </SelectTrigger>
                  <SelectContent>
                    {renderCategoryOptions(categories)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button onClick={handleUpdateCategory}>Update</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

