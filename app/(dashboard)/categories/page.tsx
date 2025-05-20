"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
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
  FolderTree,
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
import { ScrollArea } from "@/components/ui/scroll-area"

interface CategoryWithChildren extends Omit<Category, "children"> {
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
    <TableCell className="w-[20%] py-2 px-2 hidden sm:table-cell">
      <Skeleton className="h-4 w-12" />
    </TableCell>
    <TableCell className="w-[30%] py-2 px-2 hidden md:table-cell">
      <Skeleton className="h-4 w-full" />
    </TableCell>
    <TableCell className="w-[10%] py-2 px-2 hidden sm:table-cell">
      <Skeleton className="h-4 w-12" />
    </TableCell>
    <TableCell className="w-[10%] py-2 px-2">
      <Skeleton className="h-8 w-8" />
    </TableCell>
  </TableRow>
)

// Componente para la vista de tarjeta móvil - versión minimalista
const CategoryCard = ({
  category,
  depth = 0,
  isExpanded,
  onToggleExpand,
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
}: {
  category: CategoryWithChildren
  depth?: number
  isExpanded: boolean
  onToggleExpand: () => void
  isSelected: boolean
  onToggleSelect: (checked: boolean) => void
  onEdit: () => void
  onDelete: () => void
}) => {
  const hasChildren = category.children.length > 0
  const paddingLeft = depth * 12

  return (
    <div
      className="border-b py-3 px-2 animate-in fade-in-50"
      style={{
        paddingLeft: `${paddingLeft + 8}px`,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <Checkbox checked={isSelected} onCheckedChange={onToggleSelect} className="mr-1" />
          <div className="flex items-center gap-1 flex-1 min-w-0" onClick={hasChildren ? onToggleExpand : undefined}>
            {hasChildren && (
              <span className="text-muted-foreground">
                {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </span>
            )}
            <span className="font-medium text-sm truncate">{category.name}</span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-red-500">
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export default function CategoriesPage() {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null)
  const [editingCategory, setEditingCategory] = useState<CategoryWithChildren | null>(null)
  const { currentStore, categories, fetchCategoriesByStore, createCategory, updateCategory, deleteCategory } =
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

  // Añadir estas constantes para el sistema de fetching mejorado
  const FETCH_COOLDOWN_MS = 2000 // Tiempo mínimo entre fetches (2 segundos)
  const MAX_RETRIES = 3 // Número máximo de reintentos
  const RETRY_DELAY_MS = 1500 // Tiempo base entre reintentos (1.5 segundos)
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)
  const [fetchAttempts, setFetchAttempts] = useState<number>(0)
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (currentStore) {
      setNewCategory((prev) => ({ ...prev, storeId: currentStore }))
    }
  }, [currentStore])

  // Reemplazar la función loadCategories con esta versión mejorada
  const loadCategories = async (forceRefresh = false) => {
    // Evitar fetches duplicados o muy frecuentes
    const now = Date.now()
    if (!forceRefresh && now - lastFetchTime < FETCH_COOLDOWN_MS) {
      console.log("Fetch cooldown active, using cached data")
      return
    }

    // Limpiar cualquier timeout pendiente
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current)
      fetchTimeoutRef.current = null
    }

    setIsLoading(true)

    try {
      if (currentStore) {
        console.log(`Fetching categories for store: ${currentStore} (attempt ${fetchAttempts + 1})`)
        await fetchCategoriesByStore(currentStore)
      }

      // Restablecer los contadores de reintento
      setFetchAttempts(0)
      setLastFetchTime(Date.now())
    } catch (error) {
      console.error("Error fetching categories:", error)

      // Implementar reintento con backoff exponencial
      if (fetchAttempts < MAX_RETRIES) {
        const nextAttempt = fetchAttempts + 1
        const delay = RETRY_DELAY_MS * Math.pow(1.5, nextAttempt - 1) // Backoff exponencial

        console.log(`Retrying fetch in ${delay}ms (attempt ${nextAttempt}/${MAX_RETRIES})`)

        setFetchAttempts(nextAttempt)
        fetchTimeoutRef.current = setTimeout(() => {
          loadCategories(true)
        }, delay)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch categories after multiple attempts. Please try again.",
        })
        setFetchAttempts(0)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Reemplazar el useEffect existente con esta versión mejorada
  useEffect(() => {
    // Usar un debounce para el término de búsqueda
    const debounceTimeout = setTimeout(
      () => {
        loadCategories()
      },
      searchQuery ? 300 : 0,
    ) // Debounce de 300ms solo para búsquedas

    return () => {
      clearTimeout(debounceTimeout)
      // Limpiar cualquier fetch pendiente al desmontar
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
      }
    }
  }, [currentStore, searchQuery])

  const buildCategoryHierarchy = (flatCategories: Category[]): CategoryWithChildren[] => {
    const categoryMap = new Map<string, CategoryWithChildren>()
    const rootCategories: CategoryWithChildren[] = []

    // First pass: create all category objects with empty children arrays
    flatCategories.forEach((category) => {
      categoryMap.set(category.id, { ...category, children: [] as CategoryWithChildren[] })
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

  // Simplificar la función refreshCategories para usar loadCategories
  const refreshCategories = async () => {
    await loadCategories(true) // forzar refresco
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
        <TableCell className="w-[20%] texto py-2 pl-6 hidden sm:table-cell">{category.slug}</TableCell>
        <TableCell className="w-[30%] texto py-2 pl-6 hidden md:table-cell">
          <div className="truncate max-w-[300px]">{category.description || "-"}</div>
        </TableCell>
        <TableCell className="w-[10%] texto py-2 pl-6 hidden sm:table-cell">{category.children.length}</TableCell>
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
                Editar
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
                Eliminar
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

  // Renderizado de categorías para móvil - versión minimalista
  const renderMobileCategories = (categories: CategoryWithChildren[], depth = 0): React.ReactElement[] => {
    return categories.flatMap((category) => {
      const isExpanded = expandedCategories.has(category.id)
      const elements: React.ReactElement[] = [
        <CategoryCard
          key={category.id}
          category={category}
          depth={depth}
          isExpanded={isExpanded}
          onToggleExpand={() => toggleCategoryExpansion(category.id)}
          isSelected={selectedCategories.includes(category.id)}
          onToggleSelect={(checked) => {
            setSelectedCategories((prev) =>
              checked ? [...prev, category.id] : prev.filter((id) => id !== category.id),
            )
          }}
          onEdit={() => {
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
          onDelete={() => {
            setCategoryToDelete(category.id)
            setIsDeleteDialogOpen(true)
          }}
        />,
      ]

      if (isExpanded && category.children.length > 0) {
        elements.push(...renderMobileCategories(category.children, depth + 1))
      }

      return elements
    })
  }

  const filteredCategories = (() => {
    if (!searchQuery) return buildCategoryHierarchy(categories)

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

    return buildCategoryHierarchy(categories)
      .map(filterCategory)
      .filter((c): c is CategoryWithChildren => c !== null)
  })()

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
  const currentCategories: CategoryWithChildren[] = filteredCategories.slice(indexOfFirstCategory, indexOfLastCategory)

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  // Renderizado del estado vacío para móvil - versión minimalista
  const renderMobileEmptyState = () => (
    <div className="w-full px-4 py-6">
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center bg-gray-50 dark:bg-gray-900/20 rounded-lg">
        <div className="h-10 w-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center mb-3 shadow-sm">
          <FolderTree className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-base font-medium mb-1">No hay categorías</h3>
        <p className="text-muted-foreground mb-4 text-sm max-w-md">
          {searchQuery ? "Intenta con otros términos de búsqueda" : "Crea tu primera categoría para comenzar"}
        </p>
        <div className="flex flex-col gap-2 w-full">
          {searchQuery && (
            <Button variant="outline" onClick={() => setSearchQuery("")} className="w-full text-sm h-9">
              Limpiar filtros
            </Button>
          )}
          {!searchQuery && (
            <Button onClick={() => setIsCreateModalOpen(true)} className="w-full text-sm h-9 create-button">
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Crear Categoría
            </Button>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <>
      <HeaderBar title="Categorias" jsonData={{ categories }} />
      <ScrollArea className="h-[calc(100vh-4em)]">
        <div className="container-section">
          <div className="content-section box-container">
            <div className="box-section justify-between items-center">
              <div className="flex items-center justify-between w-full">
                <h3 className="text-lg sm:text-base">Categorias</h3>
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                  <DialogTrigger asChild>
                    <Button size="icon" className="sm:hidden h-9 w-9 create-button">
                      <Plus className="h-5 w-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogTrigger asChild>
                    <Button className="hidden sm:flex create-button">
                      <Plus className="h-4 w-4 mr-2" /> Crear Categoría
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
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
                            {renderCategoryOptions(buildCategoryHierarchy(categories))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter className="mt-4">
                      <Button variant="outline" onClick={() => setIsCreateModalOpen(false)} disabled={isSubmitting}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateCategory} disabled={isSubmitting} className="create-button">
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
            </div>

            <div className="box-section justify-between flex-col sm:flex-row gap-3 sm:gap-0">
              <div className="relative w-full sm:max-w-sm">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Buscar categorias..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>

              {selectedCategories.length > 0 && (
                <Button
                  variant="outline"
                  className="text-red-500 w-full sm:w-auto hidden sm:flex"
                  onClick={() => setIsBulkDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar ({selectedCategories.length})
                </Button>
              )}
            </div>

            <div className="box-section p-0">
              {isLoading ? (
                <div className="flex flex-col w-full p-6 space-y-4">
                  <div className="flex justify-center items-center p-4 bg-sky-50 dark:bg-sky-950/20 rounded-lg border border-sky-100 dark:border-sky-900/50 animate-pulse">
                    <Loader2 className="h-8 w-8 animate-spin text-sky-600 mr-3" />
                    <div>
                      <p className="font-medium text-sky-700 dark:text-sky-400">Cargando categorías</p>
                      <p className="text-sm text-sky-600/70 dark:text-sky-500/70">Esto puede tomar unos momentos...</p>
                    </div>
                  </div>

                  {/* Skeleton loader para móvil */}
                  <div className="sm:hidden space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="border-b py-3 px-2 animate-pulse">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded-sm"></div>
                            <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
                          </div>
                          <div className="h-7 w-7 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Skeleton loader para desktop */}
                  <div className="hidden sm:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="pl-6 w-[350px]">Nombre</TableHead>
                          <TableHead className="w-[200px] hidden sm:table-cell">Slug</TableHead>
                          <TableHead className="w-[200px] hidden md:table-cell">Descripción</TableHead>
                          <TableHead className="w-[100px] hidden sm:table-cell">Subcategorias</TableHead>
                          <TableHead> </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Array(5)
                          .fill(0)
                          .map((_, index) => (
                            <CategorySkeleton key={index} />
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : filteredCategories.length === 0 ? (
                <div className="w-full">
                  {/* Vista de tabla para pantallas medianas y grandes */}
                  <div className="hidden sm:block w-full">
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
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            {searchQuery ? (
                              <div>
                                <p className="text-lg mb-2">No hay categorías que coincidan con tu búsqueda</p>
                                <p className="text-muted-foreground">Intenta con otros términos de búsqueda</p>
                                <Button variant="outline" onClick={() => setSearchQuery("")} className="mt-4">
                                  Limpiar búsqueda
                                </Button>
                              </div>
                            ) : (
                              <div>
                                <p className="text-lg mb-2">No hay categorías</p>
                                <p className="text-muted-foreground mb-4">Crea tu primera categoría para comenzar</p>
                                <Button onClick={() => setIsCreateModalOpen(true)} className="create-button">
                                  <Plus className="h-4 w-4 mr-2" /> Crear Categoría
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Vista móvil para pantallas pequeñas */}
                  <div className="sm:hidden">{renderMobileEmptyState()}</div>
                </div>
              ) : (
                <>
                  {/* Vista de tabla para pantallas medianas y grandes */}
                  <div className="hidden sm:block w-full">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="pl-6 w-[350px]">Nombre</TableHead>
                          <TableHead className="w-[200px] hidden sm:table-cell">Slug</TableHead>
                          <TableHead className="w-[200px] hidden md:table-cell">Descripción</TableHead>
                          <TableHead className="w-[100px] hidden sm:table-cell">Subcategorias</TableHead>
                          <TableHead> </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>{currentCategories.flatMap((category) => renderCategoryRow(category))}</TableBody>
                    </Table>
                  </div>

                  {/* Vista de tarjetas para móviles */}
                  <div className="sm:hidden w-full">
                    {selectedCategories.length > 0 && (
                      <div className="sticky top-0 z-10 bg-white dark:bg-gray-950 py-2 border-b flex items-center justify-between px-2">
                        <div className="flex items-center">
                          <span className="text-xs font-medium">{selectedCategories.length} seleccionados</span>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setIsBulkDeleteDialogOpen(true)}
                          className="h-7 text-xs"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    )}
                    {renderMobileCategories(currentCategories)}
                  </div>
                </>
              )}
            </div>

            {filteredCategories.length > 0 && (
              <div className="box-section border-none justify-between items-center text-sm flex-col sm:flex-row gap-3 sm:gap-0">
                <div className="text-muted-foreground text-center sm:text-left">
                  Mostrando {indexOfFirstCategory + 1} a {Math.min(indexOfLastCategory, filteredCategories.length)} de{" "}
                  {totalCategories} categorias
                </div>
                <div className="flex items-center justify-center sm:justify-end w-full sm:w-auto">
                  <nav className="flex items-center gap-1 rounded-md bg-muted/40 p-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-sm"
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="sr-only">Página anterior</span>
                    </Button>

                    {/* Paginación para pantallas medianas y grandes */}
                    <div className="hidden xs:flex">
                      {(() => {
                        const totalPages = Math.ceil(filteredCategories.length / categoriesPerPage)
                        const maxVisiblePages = 5
                        let startPage = 1
                        let endPage = totalPages

                        if (totalPages > maxVisiblePages) {
                          // Siempre mostrar la primera página
                          const leftSiblingIndex = Math.max(currentPage - 1, 1)
                          // Siempre mostrar la última página
                          const rightSiblingIndex = Math.min(currentPage + 1, totalPages)

                          // Calcular páginas a mostrar
                          if (currentPage <= 3) {
                            // Estamos cerca del inicio
                            endPage = 5
                          } else if (currentPage >= totalPages - 2) {
                            // Estamos cerca del final
                            startPage = totalPages - 4
                          } else {
                            // Estamos en el medio
                            startPage = currentPage - 2
                            endPage = currentPage + 2
                          }
                        }

                        const pages = []

                        // Añadir primera página si no está incluida en el rango
                        if (startPage > 1) {
                          pages.push(
                            <Button
                              key="1"
                              variant={currentPage === 1 ? "default" : "ghost"}
                              size="icon"
                              className="h-7 w-7 rounded-sm"
                              onClick={() => paginate(1)}
                            >
                              1
                            </Button>,
                          )

                          // Añadir elipsis si hay un salto
                          if (startPage > 2) {
                            pages.push(
                              <span key="start-ellipsis" className="px-1 text-muted-foreground">
                                ...
                              </span>,
                            )
                          }
                        }

                        // Añadir páginas del rango calculado
                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(
                            <Button
                              key={i}
                              variant={currentPage === i ? "default" : "ghost"}
                              size="icon"
                              className="h-7 w-7 rounded-sm"
                              onClick={() => paginate(i)}
                            >
                              {i}
                            </Button>,
                          )
                        }

                        // Añadir última página si no está incluida en el rango
                        if (endPage < totalPages) {
                          // Añadir elipsis si hay un salto
                          if (endPage < totalPages - 1) {
                            pages.push(
                              <span key="end-ellipsis" className="px-1 text-muted-foreground">
                                ...
                              </span>,
                            )
                          }

                          pages.push(
                            <Button
                              key={totalPages}
                              variant={currentPage === totalPages ? "default" : "ghost"}
                              size="icon"
                              className="h-7 w-7 rounded-sm"
                              onClick={() => paginate(totalPages)}
                            >
                              {totalPages}
                            </Button>,
                          )
                        }

                        return pages
                      })()}
                    </div>

                    {/* Indicador de página actual para pantallas pequeñas */}
                    <div className="flex xs:hidden items-center px-2 text-xs font-medium">
                      <span>
                        {currentPage} / {Math.ceil(filteredCategories.length / categoriesPerPage)}
                      </span>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-sm"
                      onClick={() => paginate(currentPage + 1)}
                      disabled={indexOfLastCategory >= filteredCategories.length}
                    >
                      <ChevronRight className="h-4 w-4" />
                      <span className="sr-only">Página siguiente</span>
                    </Button>
                  </nav>
                </div>
              </div>
            )}

            {/* Edit Category Dialog */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
              <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Editar Categoría</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="editCategoryName">Nombre de la Categoría</Label>
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
                    <Label htmlFor="editCategoryDescription">Descripción</Label>
                    <Textarea
                      id="editCategoryDescription"
                      value={newCategory.description}
                      onChange={(e) => setNewCategory((prev) => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="editCategoryImageUrl">URL de Imagen</Label>
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
                    <Label htmlFor="editParentCategory">Categoría Padre</Label>
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
                        {renderCategoryOptions(buildCategoryHierarchy(categories), 0, editingCategory?.id)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={isSubmitting}>
                    Cancelar
                  </Button>
                  <Button onClick={handleUpdateCategory} disabled={isSubmitting} className="create-button">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Actualizando...
                      </>
                    ) : (
                      "Actualizar"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Se eliminará permanentemente la categoría y todas sus
                    subcategorías.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => categoryToDelete && handleDeleteCategory(categoryToDelete)}
                    disabled={isSubmitting}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Eliminando...
                      </>
                    ) : (
                      "Eliminar"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Bulk Delete Confirmation Dialog */}
            <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar {selectedCategories.length} categorías?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Se eliminarán permanentemente las categorías seleccionadas y todas
                    sus subcategorías.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteSelectedCategories}
                    disabled={isSubmitting}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Eliminando...
                      </>
                    ) : (
                      "Eliminar Todas"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </ScrollArea>
    </>
  )
}
