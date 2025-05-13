"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import {
  Search,
  ChevronRight,
  ChevronDown,
  Pencil,
  Plus,
  Trash2,
  MoreHorizontal,
  ChevronLeft,
  Loader2,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { Category, CreateCategoryDto, UpdateCategoryDto } from "@/types/category"
import { useMainStore } from "@/stores/mainStore"
import { useToast } from "@/hooks/use-toast"
import { HeaderBar } from "@/components/HeaderBar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { slugify } from "@/lib/slugify"

interface CategoryWithChildren extends Category {
  children: CategoryWithChildren[]
}

const renderCategoryOptions = (
  categories: CategoryWithChildren[],
  depth = 0,
  excludeId?: string,
): React.ReactNode[] => {
  return categories.flatMap((category) => {
    // Skip this category and its children if it's the one we're excluding
    if (category.id === excludeId) return []

    return [
      <SelectItem key={category.id} value={category.id}>
        {"\u00A0".repeat(depth * 2)}
        {category.name}
      </SelectItem>,
      ...renderCategoryOptions(category.children, depth + 1, excludeId),
    ]
  })
}

const CategorySkeleton = () => (
  <TableRow>
    <TableCell className="w-[30%] py-2 px-2">
      <div className="flex items-center">
        <Skeleton className="h-4 w-4 mr-2" />
        <Skeleton className="h-4 w-full max-w-[200px]" />
      </div>
    </TableCell>
    <TableCell className="w-[20%] py-2 px-2">
      <Skeleton className="h-4 w-12" />
    </TableCell>
    <TableCell className="w-[30%] py-2 px-2">
      <Skeleton className="h-4 w-full" />
    </TableCell>
    <TableCell className="w-[10%] py-2 px-2">
      <Skeleton className="h-4 w-12" />
    </TableCell>
    <TableCell className="w-[10%] py-2 px-2">
      <Skeleton className="h-8 w-8" />
    </TableCell>
  </TableRow>
)

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithChildren[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null)
  const [editingCategory, setEditingCategory] = useState<CategoryWithChildren | null>(null)
  const { currentStore, fetchCategories, fetchCategoriesByStore, createCategory, updateCategory, deleteCategory } =
    useMainStore()
  const [newCategory, setNewCategory] = useState<CreateCategoryDto>({
    name: "",
    slug: "",
    description: "",
    parentId: undefined,
    storeId: "", // Set storeId from currentStore
    imageUrl: "",
    metaTitle: "",
    metaDescription: "",
  })
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const { toast } = useToast()
  const [currentPage, setCurrentPage] = useState(1)
  const categoriesPerPage = 10

  useEffect(() => {
    if (currentStore) {
      setNewCategory((prev) => ({ ...prev, storeId: currentStore }))
    }
  }, [currentStore])

  useEffect(() => {
    const loadCategories = async () => {
      setIsLoading(true)
      try {
        let fetchedCategories: Category[] = []

        if (currentStore) {
          console.log(`Fetching categories for store: ${currentStore}`)
          fetchedCategories = await fetchCategoriesByStore(currentStore)
        } else {
          console.log("Fetching all categories")
          fetchedCategories = await fetchCategories()
        }

        console.log(`Fetched ${fetchedCategories.length} categories`)
        setCategories(buildCategoryHierarchy(fetchedCategories))
      } catch (error) {
        console.error("Error fetching categories:", error)
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
  }, [fetchCategories, fetchCategoriesByStore, currentStore, toast])

  const buildCategoryHierarchy = (flatCategories: Category[]): CategoryWithChildren[] => {
    const categoryMap = new Map<string, CategoryWithChildren>()
    const rootCategories: CategoryWithChildren[] = []

    // First pass: create all category objects with empty children arrays
    flatCategories.forEach((category) => {
      categoryMap.set(category.id, { ...category, children: [] })
    })

    // Second pass: build the hierarchy
    flatCategories.forEach((category) => {
      if (category.parentId) {
        const parent = categoryMap.get(category.parentId)
        if (parent) {
          const child = categoryMap.get(category.id)
          if (child) {
            parent.children.push(child)
          }
        } else {
          // If parent doesn't exist, treat as root category
          const orphan = categoryMap.get(category.id)
          if (orphan) {
            rootCategories.push(orphan)
          }
        }
      } else {
        // No parent, so it's a root category
        const root = categoryMap.get(category.id)
        if (root) {
          rootCategories.push(root)
        }
      }
    })

    return rootCategories
  }

  const refreshCategories = async () => {
    try {
      let fetchedCategories: Category[] = []

      if (currentStore) {
        fetchedCategories = await fetchCategoriesByStore(currentStore)
      } else {
        fetchedCategories = await fetchCategories()
      }

      setCategories(buildCategoryHierarchy(fetchedCategories))
    } catch (error) {
      console.error("Error refreshing categories:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to refresh categories. Please try again.",
      })
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategory.name || !newCategory.slug) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Name and slug are required fields.",
      })
      return
    }

    if (!currentStore) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a store before creating a category.",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const categoryToCreate: CreateCategoryDto = {
        ...newCategory,
        storeId: currentStore,
      }

      await createCategory(categoryToCreate)
      setIsCreateModalOpen(false)
      setNewCategory({
        name: "",
        slug: "",
        description: "",
        parentId: undefined,
        storeId: currentStore,
        imageUrl: "",
        metaTitle: "",
        metaDescription: "",
      })

      await refreshCategories()

      toast({
        title: "Success",
        description: "Category created successfully",
      })
    } catch (err) {
      console.error("Error creating category:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create category. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateCategory = async () => {
    if (!editingCategory) return
    if (!newCategory.name || !newCategory.slug) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Name and slug are required fields.",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const updatedCategory: UpdateCategoryDto = {
        name: newCategory.name,
        slug: newCategory.slug,
        description: newCategory.description,
        parentId: newCategory.parentId === "none" ? null : newCategory.parentId,
        imageUrl: newCategory.imageUrl,
        metaTitle: newCategory.metaTitle,
        metaDescription: newCategory.metaDescription,
      }

      await updateCategory(editingCategory.id, updatedCategory)
      setIsEditModalOpen(false)
      setEditingCategory(null)
      setNewCategory({
        name: "",
        slug: "",
        description: "",
        parentId: undefined,
        storeId: currentStore || "",
        imageUrl: "",
        metaTitle: "",
        metaDescription: "",
      })

      await refreshCategories()

      toast({
        title: "Success",
        description: "Category updated successfully",
      })
    } catch (err) {
      console.error("Error updating category:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update category. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    setIsSubmitting(true)
    try {
      await deleteCategory(id)
      await refreshCategories()
      toast({
        title: "Success",
        description: "Category deleted successfully",
      })
    } catch (err) {
      console.error("Error deleting category:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete category. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
      setCategoryToDelete(null)
      setIsDeleteDialogOpen(false)
    }
  }

  const handleDeleteSelectedCategories = async () => {
    if (selectedCategories.length === 0) return

    setIsSubmitting(true)
    try {
      for (const id of selectedCategories) {
        await deleteCategory(id)
      }

      setSelectedCategories([])
      await refreshCategories()

      toast({
        title: "Success",
        description: `${selectedCategories.length} categories deleted successfully`,
      })
    } catch (err) {
      console.error("Error deleting categories:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete some categories. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
      setIsBulkDeleteDialogOpen(false)
    }
  }

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  const renderCategoryRow = (category: CategoryWithChildren, depth = 0): React.ReactElement[] => {
    const hasChildren = category.children.length > 0
    const paddingLeft = depth * 20 + 12
    const isExpanded = expandedCategories.has(category.id)

    const rows: React.ReactElement[] = [
      <TableRow key={category.id} className="text-sm hover:bg-muted/30">
        <TableCell className="w-[30%] py-2 pl-3">
          <div
            className="flex items-center w-full cursor-pointer"
            style={{ paddingLeft: `${paddingLeft}px` }}
            onClick={() => {
              if (hasChildren) toggleCategoryExpansion(category.id)
            }}
          >
            <Checkbox
              checked={selectedCategories.includes(category.id)}
              onCheckedChange={(checked) => {
                if (typeof checked === "boolean") {
                  setSelectedCategories((prev) =>
                    checked ? [...prev, category.id] : prev.filter((id) => id !== category.id),
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
            <span className="texto flex-grow truncate">{category.name}</span>
          </div>
        </TableCell>
        <TableCell className="w-[20%] texto py-2 pl-6">{category.slug}</TableCell>
        <TableCell className="w-[30%] texto py-2 pl-6">
          <div className="truncate max-w-[300px]">{category.description || "-"}</div>
        </TableCell>
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
                  e.stopPropagation()
                  setEditingCategory(category)
                  setIsEditModalOpen(true)
                  setNewCategory({
                    name: category.name,
                    slug: category.slug,
                    description: category.description || "",
                    parentId: category.parentId || "none",
                    storeId: category.storeId,
                    imageUrl: category.imageUrl || "",
                    metaTitle: category.metaTitle || "",
                    metaDescription: category.metaDescription || "",
                  })
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  setCategoryToDelete(category.id)
                  setIsDeleteDialogOpen(true)
                }}
                className="text-red-500"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>,
    ]

    if (isExpanded && hasChildren) {
      category.children.forEach((child) => {
        rows.push(...renderCategoryRow(child, depth + 1))
      })
    }

    return rows
  }

  const filteredCategories = useMemo(() => {
    const searchLower = searchQuery.toLowerCase()

    const filterCategory = (category: CategoryWithChildren): CategoryWithChildren | null => {
      const matchesSearch =
        category.name.toLowerCase().includes(searchLower) ||
        category.slug.toLowerCase().includes(searchLower) ||
        (category.description && category.description.toLowerCase().includes(searchLower))

      // Filtrar las subcategorías recursivamente
      const filteredChildren = category.children
        .map((child) => filterCategory(child))
        .filter((c): c is CategoryWithChildren => c !== null)

      if (matchesSearch || filteredChildren.length > 0) {
        return {
          ...category,
          children: filteredChildren,
        }
      }

      return null
    }

    return categories.map(filterCategory).filter((c): c is CategoryWithChildren => c !== null)
  }, [categories, searchQuery])

  // Calculate total number of categories (flattened)
  const flattenCategories = (cats: CategoryWithChildren[]): CategoryWithChildren[] => {
    return cats.reduce((acc, cat) => {
      return [...acc, cat, ...flattenCategories(cat.children)]
    }, [] as CategoryWithChildren[])
  }

  const allFlattenedCategories = flattenCategories(filteredCategories)
  const totalCategories = allFlattenedCategories.length

  // Pagination logic
  const indexOfLastCategory = currentPage * categoriesPerPage
  const indexOfFirstCategory = indexOfLastCategory - categoriesPerPage

  // For pagination, we'll use the top-level categories only
  const currentCategories = filteredCategories.slice(indexOfFirstCategory, indexOfLastCategory)

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  return (
    <>
      <HeaderBar title="Categorias" />
      <div className="container-section">
        <div className="content-section box-container">
          <div className="box-section justify-between">
            <h4>Categorias</h4>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="create-button">
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
                      onChange={(e) =>
                        setNewCategory((prev) => ({ ...prev, name: e.target.value, slug: slugify(e.target.value) }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="newCategorySlug">Slug</Label>
                    <Input
                      id="newCategorySlug"
                      value={newCategory.slug}
                      onChange={(e) => setNewCategory((prev) => ({ ...prev, slug: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="newCategoryDescription">Description</Label>
                    <Textarea
                      id="newCategoryDescription"
                      value={newCategory.description}
                      onChange={(e) => setNewCategory((prev) => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="newCategoryImageUrl">Image URL</Label>
                    <Input
                      id="newCategoryImageUrl"
                      value={newCategory.imageUrl || ""}
                      onChange={(e) => setNewCategory((prev) => ({ ...prev, imageUrl: e.target.value }))}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newCategoryMetaTitle">Meta Title (SEO)</Label>
                    <Input
                      id="newCategoryMetaTitle"
                      value={newCategory.metaTitle || ""}
                      onChange={(e) => setNewCategory((prev) => ({ ...prev, metaTitle: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="newCategoryMetaDescription">Meta Description (SEO)</Label>
                    <Textarea
                      id="newCategoryMetaDescription"
                      value={newCategory.metaDescription || ""}
                      onChange={(e) => setNewCategory((prev) => ({ ...prev, metaDescription: e.target.value }))}
                      placeholder="Brief description for search engines"
                    />
                  </div>
                  <div>
                    <Label htmlFor="parentCategory">Parent Category</Label>
                    <Select
                      value={newCategory.parentId || "none"}
                      onValueChange={(value) =>
                        setNewCategory((prev) => ({ ...prev, parentId: value === "none" ? undefined : value }))
                      }
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
                </div>
                <DialogFooter className="mt-4">
                  <Button variant="outline" onClick={() => setIsCreateModalOpen(false)} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateCategory} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="box-section justify-between">
            <div className="flex items-center space-x-2">
              <div className="relative max-w-sm">
                <Search className="absolute top-1/2 left-3 h-4 w-4 text-gray-500 -translate-y-1/2" />
                <Input
                  placeholder="Buscar categorias..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 h-8 bg-accent/40"
                />
              </div>
            </div>

            {selectedCategories.length > 0 && (
              <Button variant="outline" className="text-red-500" onClick={() => setIsBulkDeleteDialogOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected ({selectedCategories.length})
              </Button>
            )}
          </div>

          <div className="box-section p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6 w-[350px]">Nombre</TableHead>
                  <TableHead className="w-[200px]">Slug</TableHead>
                  <TableHead className="w-[200px]">Descripción</TableHead>
                  <TableHead className="w-[100px]">Subcategorias</TableHead>
                  <TableHead> </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5)
                    .fill(0)
                    .map((_, index) => <CategorySkeleton key={index} />)
                ) : filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      {searchQuery ? (
                        <div>
                          <p className="text-lg mb-2">No categories match your search</p>
                          <p className="text-muted-foreground">Try a different search term</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-lg mb-2">No categories found</p>
                          <p className="text-muted-foreground mb-4">Create your first category to get started</p>
                          <Button onClick={() => setIsCreateModalOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" /> Create Category
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  currentCategories.flatMap((category) => renderCategoryRow(category))
                )}
              </TableBody>
            </Table>
          </div>

          {filteredCategories.length > 0 && (
            <div className="box-section border-none justify-between items-center ">
              <div className="content-font">
                Mostrando {indexOfFirstCategory + 1} a {Math.min(indexOfLastCategory, filteredCategories.length)} de{" "}
                {totalCategories} categorias
              </div>
              <div className="flex gap-2">
                <Button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} variant="outline">
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
          )}

          {/* Edit Category Dialog */}
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
                    onChange={(e) => setNewCategory((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="editCategorySlug">Slug</Label>
                  <Input
                    id="editCategorySlug"
                    value={newCategory.slug}
                    onChange={(e) => setNewCategory((prev) => ({ ...prev, slug: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="editCategoryDescription">Description</Label>
                  <Textarea
                    id="editCategoryDescription"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="editCategoryImageUrl">Image URL</Label>
                  <Input
                    id="editCategoryImageUrl"
                    value={newCategory.imageUrl || ""}
                    onChange={(e) => setNewCategory((prev) => ({ ...prev, imageUrl: e.target.value }))}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div>
                  <Label htmlFor="editCategoryMetaTitle">Meta Title (SEO)</Label>
                  <Input
                    id="editCategoryMetaTitle"
                    value={newCategory.metaTitle || ""}
                    onChange={(e) => setNewCategory((prev) => ({ ...prev, metaTitle: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="editCategoryMetaDescription">Meta Description (SEO)</Label>
                  <Textarea
                    id="editCategoryMetaDescription"
                    value={newCategory.metaDescription || ""}
                    onChange={(e) => setNewCategory((prev) => ({ ...prev, metaDescription: e.target.value }))}
                    placeholder="Brief description for search engines"
                  />
                </div>
                <div>
                  <Label htmlFor="editParentCategory">Parent Category</Label>
                  <Select
                    value={newCategory.parentId || "none"}
                    onValueChange={(value) =>
                      setNewCategory((prev) => ({ ...prev, parentId: value === "none" ? undefined : value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {renderCategoryOptions(categories, 0, editingCategory?.id)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateCategory} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the category and all its subcategories.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => categoryToDelete && handleDeleteCategory(categoryToDelete)}
                  disabled={isSubmitting}
                  className="bg-red-500 hover:bg-red-600"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Bulk Delete Confirmation Dialog */}
          <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {selectedCategories.length} categories?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the selected categories and all their
                  subcategories.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteSelectedCategories}
                  disabled={isSubmitting}
                  className="bg-red-500 hover:bg-red-600"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete All"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </>
  )
}
