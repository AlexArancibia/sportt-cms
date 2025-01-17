'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Search, ChevronRight, ChevronDown, Pencil, Plus, Trash2, MoreHorizontal, ChevronLeft, LinkIcon as NextPageIcon } from 'lucide-react'
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
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Category, CreateCategoryDto, UpdateCategoryDto } from '@/types/category'
import { useMainStore } from '@/stores/mainStore'
import { useToast } from "@/hooks/use-toast"
import Link from 'next/link'
import { HeaderBar } from '@/components/HeaderBar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

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

const CategorySkeleton = () => (
  <TableRow>
    <TableCell className="w-[30%] py-2 px-2">
      <Skeleton className="h-4 w-4 mr-2" />
      <Skeleton className="h-4 w-full max-w-[200px]" />
    </TableCell>
    <TableCell className="w-[20%] py-2 px-2"><Skeleton className="h-4 w-12" /></TableCell>
    <TableCell className="w-[30%] py-2 px-2"><Skeleton className="h-4 w-full" /></TableCell>
    <TableCell className="w-[10%] py-2 px-2"><Skeleton className="h-4 w-12" /></TableCell>
    <TableCell className="w-[10%] py-2 px-2"><Skeleton className="h-8 w-8" /></TableCell>
  </TableRow>
)

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithChildren[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryWithChildren | null>(null)
  const [newCategory, setNewCategory] = useState<CreateCategoryDto>({
    name: '',
    slug: '',
    description: '',
    parentId: "none",
  })
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const { fetchCategories, createCategory, updateCategory, deleteCategory } = useMainStore()
  const [currentPage, setCurrentPage] = useState(1)
  const categoriesPerPage = 10

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
      const categoryToCreate = {
        ...newCategory,
        parentId: newCategory.parentId === "none" ? undefined : newCategory.parentId
      };
      await createCategory(categoryToCreate)
      setIsCreateModalOpen(false)
      setNewCategory({
        name: '',
        slug: '',
        description: '',
        parentId: "none",
      })
      const updatedCategories = await fetchCategories()
      setCategories(buildCategoryHierarchy(updatedCategories))
      toast({
        title: "Success",
        description: "Category created successfully",
      })
    } catch (err) {
      console.log(err)
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
        name: newCategory.name || editingCategory.name,
        slug: newCategory.slug || editingCategory.slug,
        description: newCategory.description,
        parentId: newCategory.parentId === "none" ? undefined : newCategory.parentId,
      };
      await updateCategory(editingCategory.id, updatedCategory)
      setIsEditModalOpen(false)
      setEditingCategory(null)
      setNewCategory({
        name: '',
        slug: '',
        description: '',
        parentId: "none",
      })
      const updatedCategories = await fetchCategories()
      setCategories(buildCategoryHierarchy(updatedCategories))
      toast({
        title: "Success",
        description: "Category updated successfully",
      })
    } catch (err) {
      console.log(err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update category. Please try again.",
      })
    }
  }

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategory(id);
      const updatedCategories = await fetchCategories();
      setCategories(buildCategoryHierarchy(updatedCategories));
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete category. Please try again.",
      });
    }
  };

  const handleDeleteSelectedCategories = async () => {
    try {
      await Promise.all(selectedCategories.map(id => handleDeleteCategory(id)));
      setSelectedCategories([]);
      toast({
        title: "Success",
        description: "Selected categories deleted successfully",
      })
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete some categories. Please try again.",
      });
    }
  };

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
        onClick={() => {if (hasChildren) toggleCategoryExpansion(category.id)}}
      >
        <TableCell className="w-[30%] py-2 pl-3">
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
        <TableCell className="w-[20%] texto py-2 pl-6">{category.slug}</TableCell>
        <TableCell className="w-[30%] texto py-2 pl-6">{category.description}</TableCell>
        <TableCell className="w-[10%] texto py-2 pl-6">{category.children.length}</TableCell>
        <TableCell className="w-[10%] texto py-2 pl-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="shadow-none">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingCategory(category);
                  setIsEditModalOpen(true);
                  setNewCategory({
                    name: category.name,
                    slug: category.slug,
                    description: category.description || '',
                    parentId: category.parentId,
                  });
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Are you sure you want to delete ${category.name}?`)) {
                    handleDeleteCategory(category.id);
                  }
                }}
                className="text-red-500"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
const matchesSearch =
category.name.toLowerCase().includes(searchLower) ||
category.slug.toLowerCase().includes(searchLower) ||
(category.description && category.description.toLowerCase().includes(searchLower));

// Filtrar las subcategorías recursivamente
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

const indexOfLastCategory = currentPage * categoriesPerPage
const indexOfFirstCategory = indexOfLastCategory - categoriesPerPage
const currentCategories = filteredCategories.slice(indexOfFirstCategory, indexOfLastCategory)

const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

return (
<>
<HeaderBar title='Categorias' />
<div className="container-section">
<div className="content-section box-container">
<div className="box-section justify-between">
<h3>Categorias</h3>
<Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
<DialogTrigger asChild>
<Button className='bg-gradient-to-tr from-emerald-700 to-emerald-500 dark:text-white'>
<Plus className="h-4 w-4 mr-2" /> Crear
</Button>
</DialogTrigger>
<DialogContent>
<DialogHeader>
<DialogTitle>Crear Nueva Categoria</DialogTitle>
</DialogHeader>
<div className="space-y-4">
<div>
<Label htmlFor="newCategoryName">Nombre de la Categoria</Label>
<Input
id="newCategoryName"
value={newCategory.name}
onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
/>
</div>
<div>
<Label htmlFor="newCategorySlug">Slug</Label>
<Input
id="newCategorySlug"
value={newCategory.slug}
onChange={(e) => setNewCategory(prev => ({ ...prev, slug: e.target.value }))}
/>
</div>
<div>
<Label htmlFor="newCategoryDescription">Description</Label>
<Textarea
id="newCategoryDescription"
value={newCategory.description}
onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
/>
</div>
<div>
<Label htmlFor="parentCategory">Parent Category</Label>
<Select
value={newCategory.parentId || "none"}
onValueChange={(value) => setNewCategory(prev => ({ ...prev, parentId: value === "none" ? undefined : value }))}
>
<SelectTrigger>
<SelectValue placeholder="Select parent category" />
</SelectTrigger>
<SelectContent>
<SelectItem value="none">None</SelectItem>
{renderCategoryOptions(categories)}
</SelectContent>
</Select>
</div>
<Button onClick={handleCreateCategory}>Create</Button>
</div>
</DialogContent>
</Dialog>
</div>
<div className="box-section space-x-2">
<Search className="h-4 w-4 text-gray-500" />
<Input
placeholder="Search categories..."
value={searchQuery}
onChange={(e) => setSearchQuery(e.target.value)}
className="max-w-sm bg-accent/40 focus:bg-white"
/>
</div>
<div className='box-section p-0'>
<Table>
<TableHeader>
<TableRow>
<TableHead className='pl-6 w-[350px]'>Nombre</TableHead>
<TableHead className='w-[200px]'>Slug</TableHead>
<TableHead className='w-[200px]'>Descripción</TableHead>
<TableHead className='w-[100px]'>Subcategorias</TableHead>
<TableHead> </TableHead>
</TableRow>
</TableHeader>
<TableBody>
{currentCategories.flatMap(category => renderCategoryRow(category))}
</TableBody>
</Table>
</div>
<div className="box-section border-none justify-between items-center ">
<div className='content-font'>
Mostrando {indexOfFirstCategory + 1} a {Math.min(indexOfLastCategory, filteredCategories.length)} de {filteredCategories.length} categorias
</div>
<div className="flex gap-2">
<Button
onClick={() => paginate(currentPage - 1)}
disabled={currentPage === 1}
variant="outline"
>
<ChevronLeft className="h-4 w-4" />
</Button>
<Button
onClick={() => paginate(currentPage + 1)}
disabled={indexOfLastCategory >= filteredCategories.length}
variant="outline"
>
<ChevronRight className="h-4 w-4" />
</Button>
</div>
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
value={newCategory.name}
onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
/>
</div>
<div>
<Label htmlFor="editCategorySlug">Slug</Label>
<Input
id="editCategorySlug"
value={newCategory.slug}
onChange={(e) => setNewCategory(prev => ({ ...prev, slug: e.target.value }))}
/>
</div>
<div>
<Label htmlFor="editCategoryDescription">Description</Label>
<Textarea
id="editCategoryDescription"
value={newCategory.description}
onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
/>
</div>
<div>
<Label htmlFor="editParentCategory">Parent Category</Label>
<Select
value={newCategory.parentId || "none"}
onValueChange={(value) => setNewCategory(prev => ({ ...prev, parentId: value === "none" ? undefined : value }))}
>
<SelectTrigger>
<SelectValue placeholder="Select parent category" />
</SelectTrigger>
<SelectContent>
<SelectItem value="none">None</SelectItem>
{renderCategoryOptions(categories)}
</SelectContent>
</Select>
</div>
<Button onClick={handleUpdateCategory}>Update</Button>
</div>
</DialogContent>
</Dialog>
</div>
</div>
</>
)
}
