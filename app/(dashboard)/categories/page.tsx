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
  Code,
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
import { Badge } from "@/components/ui/badge"
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
import { useStores } from "@/hooks/useStores"
import { useCategories, useCategoryMutations } from "@/hooks/useCategories"
import { useToast } from "@/hooks/use-toast"
import { HeaderBar } from "@/components/HeaderBar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { slugify } from "@/lib/slugify"
import { getApiErrorMessage } from "@/lib/errorHelpers"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ImageUploadZone } from "@/components/ui/image-upload-zone"
import { JsonPreviewDialog } from "@/components/json-preview-dialog"

interface CategoryWithChildren extends Omit<Category, "children"> {
  children?: CategoryWithChildren[]
}

const getChildren = (c: CategoryWithChildren) => c.children ?? []
const categoryHasChildren = (c: CategoryWithChildren) => getChildren(c).length > 0

const renderCategoryOptions = (
  categories: CategoryWithChildren[],
  depth = 0,
  excludeId?: string,
): React.ReactNode[] => {
  if (!categories?.length) return []
  return categories.flatMap((category) => {
    // Skip this category and its children if it's the one we're excluding
    if (category.id === excludeId) return []

    return [
      <SelectItem key={category.id} value={category.id}>
        {"\u00A0".repeat(depth * 2)}
        {category.name}
      </SelectItem>,
      ...renderCategoryOptions(getChildren(category), depth + 1, excludeId),
    ]
  })
}

const CategorySkeleton = () => (
  <TableRow>
    <TableCell className="w-[25%] py-2 px-2">
      <div className="flex items-center">
        <Skeleton className="h-4 w-4 mr-2" />
        <Skeleton className="h-4 w-full max-w-[200px]" />
      </div>
    </TableCell>
    <TableCell className="w-[15%] py-2 px-2 hidden sm:table-cell">
      <Skeleton className="h-4 w-12" />
    </TableCell>
    <TableCell className="w-[25%] py-2 px-2 hidden md:table-cell">
      <Skeleton className="h-4 w-full" />
    </TableCell>
    <TableCell className="w-[10%] py-2 px-2 hidden lg:table-cell">
      <Skeleton className="h-4 w-8" />
    </TableCell>
    <TableCell className="w-[10%] py-2 px-2 hidden sm:table-cell">
      <Skeleton className="h-4 w-12" />
    </TableCell>
    <TableCell className="w-[15%] py-2 px-2">
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
  animationDelay = 0,
}: {
  category: CategoryWithChildren
  depth?: number
  isExpanded: boolean
  onToggleExpand: () => void
  isSelected: boolean
  onToggleSelect: (checked: boolean) => void
  onEdit: () => void
  onDelete: () => void
  animationDelay?: number
}) => {
  const paddingLeft = depth * 12

  return (
    <div
      className="border-b py-3 px-2 animate-in fade-in-50"
      style={{
        paddingLeft: `${paddingLeft + 8}px`,
        animationDelay: `${animationDelay}ms`,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <Checkbox checked={isSelected} onCheckedChange={onToggleSelect} className="mr-1" />
          <div className="flex items-center gap-1 flex-1 min-w-0" onClick={categoryHasChildren(category) ? onToggleExpand : undefined}>
            {categoryHasChildren(category) && (
              <span className="text-muted-foreground">
                {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </span>
            )}
            <div className="flex flex-col flex-1 min-w-0">
              <span className="font-medium text-sm truncate">{category.name}</span>
              <div className="flex items-center gap-2 mt-1">
                {category.priority !== undefined && category.priority !== null && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                    Prioridad: {category.priority}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">{category.slug}</span>
              </div>
            </div>
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
  const [currentPage, setCurrentPage] = useState(1)
  const categoriesPerPage = 20
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(t)
  }, [searchQuery])
  const { currentStoreId } = useStores()
  const { data: categoriesData, isLoading } = useCategories(
    currentStoreId,
    {
      page: currentPage,
      limit: categoriesPerPage,
      query: debouncedSearch || undefined,
      sortBy: "createdAt",
      sortOrder: "desc",
      mode: "tree",
    },
    !!currentStoreId
  )
  const categories = (categoriesData?.data ?? []) as CategoryWithChildren[]
  const categoriesPagination = categoriesData?.pagination ?? null
  const {
    createCategory,
    updateCategory,
    deleteCategory,
    isCreating,
    isUpdating,
    isDeleting,
  } = useCategoryMutations(currentStoreId)
  const [newCategory, setNewCategory] = useState<CreateCategoryDto>({
    name: "",
    slug: "",
    description: "",
    parentId: undefined,
    imageUrl: "",
    metaTitle: "",
    metaDescription: "",
    priority: undefined,
  })
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const isSubmitting = isCreating || isUpdating || isDeleting
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const { toast } = useToast()

  // Reset a página 1 cuando cambia la búsqueda
  useEffect(() => {
    if (searchQuery && currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [searchQuery])

  const flattenTree = (cats: CategoryWithChildren[]): Category[] => {
    return cats.flatMap((c) => [
      { ...c, children: undefined },
      ...flattenTree(getChildren(c)),
    ])
  }

  /**
   * Limpia y valida los datos de categoría antes de enviarlos al servidor
   * Convierte strings vacíos a null/undefined según el tipo de operación
   * @param data - Datos de la categoría del formulario
   * @param isUpdate - Si es true, usa null para campos opcionales (UpdateCategoryDto)
   * @returns Datos limpios y validados
   */
  const cleanCategoryData = (data: any, isUpdate = false) => {
    const cleaned = {
      name: data.name,
      slug: data.slug,
      description: data.description && data.description.trim() !== "" ? data.description : undefined,
      parentId: data.parentId === undefined || data.parentId === "none" ? undefined : data.parentId,
      imageUrl: data.imageUrl && data.imageUrl.trim() !== "" ? data.imageUrl : undefined,
      metaTitle: data.metaTitle && data.metaTitle.trim() !== "" ? data.metaTitle : undefined,
      metaDescription: data.metaDescription && data.metaDescription.trim() !== "" ? data.metaDescription : undefined,
      priority: data.priority !== undefined && data.priority !== null && String(data.priority).trim() !== "" ? Number(data.priority) : undefined,
    }

    return cleaned
  }

  const handleCreateCategory = async () => {
    if (!newCategory.name || !newCategory.slug) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El nombre y el slug son obligatorios.",
      })
      return
    }

    if (!currentStoreId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Selecciona una tienda antes de crear una categoría.",
      })
      return
    }

    try {
      const categoryToCreate: CreateCategoryDto = cleanCategoryData(newCategory, false)
      await createCategory(categoryToCreate)
      
      setIsCreateModalOpen(false)
      setNewCategory({
        name: "",
        slug: "",
        description: "",
        parentId: undefined,
        imageUrl: "",
        metaTitle: "",
        metaDescription: "",
        priority: undefined,
      })

      toast({
        title: "Success",
        description: "Category created successfully",
      })
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: getApiErrorMessage(err, "No se pudo crear la categoría."),
      })
    }
  }

  const handleUpdateCategory = async () => {
    if (!editingCategory) return
    if (!newCategory.name || !newCategory.slug) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El nombre y el slug son obligatorios.",
      })
      return
    }

    if (!currentStoreId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Selecciona una tienda antes de actualizar una categoría.",
      })
      return
    }

    try {
      const updatedCategory: UpdateCategoryDto = cleanCategoryData(newCategory, true)
      await updateCategory({ id: editingCategory.id, data: updatedCategory })
      
      setIsEditModalOpen(false)
      setEditingCategory(null)
      setNewCategory({
        name: "",
        slug: "",
        description: "",
        parentId: undefined,
        imageUrl: "",
        metaTitle: "",
        metaDescription: "",
        priority: undefined,
      })

      toast({
        title: "Success",
        description: "Category updated successfully",
      })
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: getApiErrorMessage(err, "No se pudo actualizar la categoría."),
      })
    }
  }

  const handleDeleteCategory = async (id: string) => {
    try {
      const flatCategories = flattenTree(categories)
      const hasSubcategories = flatCategories.some((c) => c.parentId === id)
      await deleteCategory({ id, flatCategories })
      
      toast({
        title: "Success",
        description: hasSubcategories
          ? "Category and all its subcategories deleted successfully"
          : "Category deleted successfully",
      })
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: getApiErrorMessage(err, "No se pudo eliminar la categoría."),
      })
    } finally {
      setCategoryToDelete(null)
      setIsDeleteDialogOpen(false)
    }
  }

  const handleDeleteSelectedCategories = async () => {
    if (selectedCategories.length === 0) return

    try {
      const flatCategories = flattenTree(categories)
      for (const id of selectedCategories) {
        await deleteCategory({ id, flatCategories })
      }

      setSelectedCategories([])

      toast({
        title: "Success",
        description: `${selectedCategories.length} categories and their subcategories deleted successfully`,
      })
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: getApiErrorMessage(err, "No se pudo eliminar algunas categorías."),
      })
    } finally {
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

  const renderCategoryRow = (
    category: CategoryWithChildren,
    depth = 0,
    rowIndexRef?: { current: number },
  ): React.ReactElement[] => {
    const hasChildren = categoryHasChildren(category)
    const paddingLeft = depth * 20 + 12
    const isExpanded = expandedCategories.has(category.id)
    const rowIndex = rowIndexRef ? rowIndexRef.current++ : 0

    const rows: React.ReactElement[] = [
      <TableRow
        key={category.id}
        className="text-sm hover:bg-muted/30 animate-in fade-in-50"
        style={{ animationDelay: `${rowIndex * 50}ms` }}
      >
        <TableCell className="w-[25%] py-2 pl-3">
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
        <TableCell className="w-[15%] texto py-2 pl-6 hidden sm:table-cell">{category.slug}</TableCell>
        <TableCell className="w-[25%] texto py-2 pl-6 hidden md:table-cell">
          <div className="truncate max-w-[300px]">{category.description || "-"}</div>
        </TableCell>
        <TableCell className="w-[10%] texto py-2 pl-6 hidden lg:table-cell">
          {category.priority !== undefined && category.priority !== null ? (
            <Badge variant="outline" className="text-xs">
              {category.priority}
            </Badge>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </TableCell>
        <TableCell className="w-[10%] texto py-2 pl-6 hidden sm:table-cell">{getChildren(category).length}</TableCell>
        <TableCell className="w-[15%] texto py-2 pl-6">
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
                    imageUrl: category.imageUrl || "",
                    metaTitle: category.metaTitle || "",
                    metaDescription: category.metaDescription || "",
                    priority: category.priority ?? undefined,
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
      getChildren(category).forEach((child) => {
        rows.push(...renderCategoryRow(child, depth + 1, rowIndexRef))
      })
    }

    return rows
  }

  // Renderizado de categorías para móvil - versión minimalista
  const renderMobileCategories = (
    categories: CategoryWithChildren[],
    depth = 0,
    cardIndexRef?: { current: number },
  ): React.ReactElement[] => {
    if (!categories?.length) return []
    return categories.flatMap((category) => {
      const isExpanded = expandedCategories.has(category.id)
      const idx = cardIndexRef ? cardIndexRef.current++ : 0
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
              imageUrl: category.imageUrl || "",
              metaTitle: category.metaTitle || "",
              metaDescription: category.metaDescription || "",
              priority: category.priority ?? undefined,
            })
          }}
          onDelete={() => {
            setCategoryToDelete(category.id)
            setIsDeleteDialogOpen(true)
          }}
          animationDelay={idx * 50}
        />,
      ]

      if (isExpanded && (category.children?.length ?? 0) > 0) {
        elements.push(...renderMobileCategories(getChildren(category), depth + 1, cardIndexRef))
      }

      return elements
    })
  }

  // With mode=tree, API returns roots with children - use directly
  const currentCategories = categories

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
    <div className="h-[calc(100vh-1.5em)] bg-background rounded-xl text-foreground">
      <HeaderBar title="Categorias" jsonData={{ categories }} />
      <ScrollArea className="h-[calc(100vh-5.5rem)]">
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
                      <div className="flex items-center justify-between">
                        <DialogTitle>Crear Nueva Categoria</DialogTitle>
                        <JsonPreviewDialog
                          title="Payload de Creación de Categoría"
                          data={cleanCategoryData(newCategory, false)}
                          trigger={
                            <Button variant="outline" size="sm" className="gap-2">
                              <Code className="h-4 w-4" />
                              <span className="hidden sm:inline">Ver JSON</span>
                            </Button>
                          }
                        />
                      </div>
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

                      {/* Campo de prioridad */}
                      <div>
                        <Label htmlFor="newCategoryPriority">
                          Prioridad (opcional)
                          <span className="text-xs text-muted-foreground ml-2">0 = mayor prioridad</span>
                        </Label>
                        <Input
                          id="newCategoryPriority"
                          type="number"
                          min="0"
                          step="1"
                          value={newCategory.priority ?? ""}
                          onChange={(e) => {
                            const value = e.target.value
                            setNewCategory((prev) => ({
                              ...prev,
                              priority: value === "" ? undefined : Number.parseInt(value, 10),
                            }))
                          }}
                          placeholder="Ej: 0, 1, 2..."
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Las categorías se ordenarán por prioridad (0 primero). Dejar vacío para sin prioridad.
                        </p>
                      </div>

                      {/* Reemplazar el campo de Image URL con ImageUploadZone */}
                      <div>
                        <Label htmlFor="newCategoryImage">Imagen de la Categoría</Label>
                        <ImageUploadZone
                          currentImage={newCategory.imageUrl || ""}
                          onImageUploaded={(url) => setNewCategory((prev) => ({ ...prev, imageUrl: url }))}
                          onRemoveImage={() => setNewCategory((prev) => ({ ...prev, imageUrl: "" }))}
                          placeholder="Arrastra una imagen aquí o haz clic para seleccionar"
                          maxFileSize={5}
                          variant="card"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Recomendado: Imagen de 800x600px o similar. Máximo 5MB.
                        </p>
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
                      <div key={index} className="border rounded-lg p-4 animate-pulse">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded-sm"></div>
                            <div>
                              <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            </div>
                          </div>
                          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Skeleton loader para desktop */}
                  <div className="hidden sm:block space-y-3">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div key={index} className="flex items-center w-full p-3 border rounded-md animate-pulse">
                        <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded mr-4"></div>
                        <div className="h-4 w-[200px] bg-gray-200 dark:bg-gray-700 rounded mr-4"></div>
                        <div className="h-4 w-[120px] bg-gray-200 dark:bg-gray-700 rounded mr-4"></div>
                        <div className="h-4 w-[200px] bg-gray-200 dark:bg-gray-700 rounded mr-4"></div>
                        <div className="h-4 w-[80px] bg-gray-200 dark:bg-gray-700 rounded mr-4"></div>
                        <div className="h-4 w-[80px] bg-gray-200 dark:bg-gray-700 rounded mr-4"></div>
                        <div className="ml-auto h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : categories.length === 0 ? (
                <div className="w-full">
                  {/* Vista de tabla para pantallas medianas y grandes */}
                  <div className="hidden sm:block w-full">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="pl-6 w-[25%]">Nombre</TableHead>
                          <TableHead className="w-[15%] hidden sm:table-cell">Slug</TableHead>
                          <TableHead className="w-[25%] hidden md:table-cell">Descripción</TableHead>
                          <TableHead className="w-[10%] hidden lg:table-cell">Prioridad</TableHead>
                          <TableHead className="w-[10%] hidden sm:table-cell">Subcategorias</TableHead>
                          <TableHead className="w-[15%]"> </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
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
                          <TableHead className="pl-6 w-[25%]">Nombre</TableHead>
                          <TableHead className="w-[15%] hidden sm:table-cell">Slug</TableHead>
                          <TableHead className="w-[25%] hidden md:table-cell">Descripción</TableHead>
                          <TableHead className="w-[10%] hidden lg:table-cell">Prioridad</TableHead>
                          <TableHead className="w-[10%] hidden sm:table-cell">Subcategorias</TableHead>
                          <TableHead className="w-[15%]"> </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          const rowIndexRef = { current: 0 }
                          return currentCategories.flatMap((category) =>
                            renderCategoryRow(category, 0, rowIndexRef),
                          )
                        })()}
                      </TableBody>
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
                    {renderMobileCategories(currentCategories, 0, { current: 0 })}
                  </div>
                </>
              )}
            </div>

            {categories.length > 0 && (
              <div className="box-section border-none justify-between items-center text-sm flex-col sm:flex-row gap-3 sm:gap-0">
                <div className="text-muted-foreground text-center sm:text-left">
                  {categoriesPagination ? (
                    <>
                      Mostrando {((currentPage - 1) * categoriesPerPage) + 1} a{" "}
                      {Math.min(currentPage * categoriesPerPage, categoriesPagination.total)} de{" "}
                      {categoriesPagination.total} categorías
                    </>
                  ) : (
                    `${categories.length} categorías`
                  )}
                </div>
                {categoriesPagination && categoriesPagination.totalPages > 1 && (
                  <div className="flex items-center justify-center sm:justify-end w-full sm:w-auto">
                    <nav className="flex items-center gap-1 rounded-md bg-muted/40 p-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-sm"
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage <= 1 || isLoading}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Página anterior</span>
                      </Button>

                      {/* Paginación para pantallas medianas y grandes */}
                      <div className="hidden xs:flex">
                        {(() => {
                          const totalPages = categoriesPagination.totalPages
                          const maxVisiblePages = 5
                          let startPage = 1
                          let endPage = totalPages

                          if (totalPages > maxVisiblePages) {
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
                                disabled={isLoading}
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
                                disabled={isLoading}
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
                                disabled={isLoading}
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
                          {currentPage} / {categoriesPagination.totalPages}
                        </span>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-sm"
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage >= categoriesPagination.totalPages || isLoading}
                      >
                        <ChevronRight className="h-4 w-4" />
                        <span className="sr-only">Página siguiente</span>
                      </Button>
                    </nav>
                  </div>
                )}
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

                  {/* Campo de prioridad para editar */}
                  <div>
                    <Label htmlFor="editCategoryPriority">
                      Prioridad (opcional)
                      <span className="text-xs text-muted-foreground ml-2">0 = mayor prioridad</span>
                    </Label>
                    <Input
                      id="editCategoryPriority"
                      type="number"
                      min="0"
                      step="1"
                      value={newCategory.priority ?? ""}
                      onChange={(e) => {
                        const value = e.target.value
                        setNewCategory((prev) => ({
                          ...prev,
                          priority: value === "" ? undefined : Number.parseInt(value, 10),
                        }))
                      }}
                      placeholder="Ej: 0, 1, 2..."
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Las categorías se ordenarán por prioridad (0 primero). Dejar vacío para sin prioridad.
                    </p>
                  </div>

                  {/* Reemplazar el campo de Image URL con ImageUploadZone para editar */}
                  <div>
                    <Label htmlFor="editCategoryImage">Imagen de la Categoría</Label>
                    <ImageUploadZone
                      currentImage={newCategory.imageUrl || ""}
                      onImageUploaded={(url) => setNewCategory((prev) => ({ ...prev, imageUrl: url }))}
                      onRemoveImage={() => setNewCategory((prev) => ({ ...prev, imageUrl: "" }))}
                      placeholder="Arrastra una imagen aquí o haz clic para seleccionar"
                      maxFileSize={5}
                      variant="minimal"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Recomendado: Imagen de 800x600px o similar. Máximo 5MB.
                    </p>
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
                        {renderCategoryOptions(categories, 0, editingCategory?.id)}
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
    </div>
  )
}