"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useMainStore } from "@/stores/mainStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ColorPicker } from "@/components/ui/color-picker"
import { JsonPreviewDialog } from "@/components/json-preview-dialog"
import {
  Loader2,
  Save,
  CreditCard,
  Palette,
  LayoutGrid,
  Tag,
  Plus,
  Trash2,
  ImageIcon,
  Link2,
  Edit,
  Eye,
  Copy,
  X,
  MoveVertical,
  Layers,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import type {
  CardSection,
  CardSectionMetadata,
  CardSectionStyles,
  CreateCardSectionDto,
  UpdateCardSectionDto,
  CreateCardDto,
} from "@/types/card"

interface CardSectionFormProps {
  cardSectionId?: string
  initialData?: CardSection
}

export function CardSectionForm({ cardSectionId, initialData }: CardSectionFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { createCardSection, updateCardSection, currentStore } = useMainStore()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("general")
  const [newTag, setNewTag] = useState("")
  const [editingCardIndex, setEditingCardIndex] = useState<number | null>(null)
  const [isCardDialogOpen, setIsCardDialogOpen] = useState(false)
  const [previewCard, setPreviewCard] = useState<number | null>(null)

  const [formData, setFormData] = useState<CreateCardSectionDto | UpdateCardSectionDto>({
    title: "",
    subtitle: "",
    description: "",
    layout: "grid",
    backgroundColor: "#ffffff",
    textColor: "#000000",
    maxCards: 12,
    position: 0,
    isActive: true,
    styles: {
      layout: "grid",
      gridColumns: {
        mobile: 1,
        tablet: 2,
        desktop: 3,
      },
      gap: "1rem",
      padding: "1rem",
      margin: "0",
      carouselOptions: {
        autoplay: true,
        loop: true,
        arrows: true,
        dots: true,
      },
    },
    metadata: {
      tags: [],
      seoTitle: "",
      seoDescription: "",
    },
    cards: [], // This is causing the type error
  })

  const [newCard, setNewCard] = useState<CreateCardDto>({
    title: "",
    subtitle: "",
    description: "",
    imageUrl: "",
    linkUrl: "",
    linkText: "",
    backgroundColor: "#ffffff",
    textColor: "#000000",
    position: 0,
    cardSectionId: cardSectionId || "",
    isActive: true,
  })

  // Cargar datos de la sección si estamos en modo edición
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        subtitle: initialData.subtitle || "",
        description: initialData.description || "",
        layout: initialData.layout || "grid",
        backgroundColor: initialData.backgroundColor || "#ffffff",
        textColor: initialData.textColor || "#000000",
        maxCards: initialData.maxCards || 12,
        position: initialData.position || 0,
        isActive: initialData.isActive,
        styles: initialData.styles || {
          layout: "grid",
          gridColumns: {
            mobile: 1,
            tablet: 2,
            desktop: 3,
          },
          gap: "1rem",
          padding: "1rem",
          margin: "0",
          carouselOptions: {
            autoplay: true,
            loop: true,
            arrows: true,
            dots: true,
          },
        },
        metadata: initialData.metadata || {
          tags: [],
          seoTitle: "",
          seoDescription: "",
        },
        cards: initialData.cards || [],
      })
    }
  }, [initialData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleNumberChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value === "" ? null : Number.parseInt(value) }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleColorChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleStylesChange = (path: string, value: any) => {
    const keys = path.split(".")
    setFormData((prev) => {
      const newStyles = { ...prev.styles } as CardSectionStyles

      if (keys.length === 1) {
        // @ts-ignore
        newStyles[keys[0]] = value
      } else if (keys.length === 2) {
        // @ts-ignore
        if (!newStyles[keys[0]]) {
          // @ts-ignore
          newStyles[keys[0]] = {}
        }
        // @ts-ignore
        newStyles[keys[0]][keys[1]] = value
      } else if (keys.length === 3) {
        // @ts-ignore
        if (!newStyles[keys[0]]) {
          // @ts-ignore
          newStyles[keys[0]] = {}
        }
        // @ts-ignore
        if (!newStyles[keys[0]][keys[1]]) {
          // @ts-ignore
          newStyles[keys[0]][keys[1]] = {}
        }
        // @ts-ignore
        newStyles[keys[0]][keys[1]][keys[2]] = value
      }

      return { ...prev, styles: newStyles }
    })
  }

  const handleMetadataChange = (path: string, value: any) => {
    const keys = path.split(".")
    setFormData((prev) => {
      const newMetadata = { ...prev.metadata } as CardSectionMetadata

      if (keys.length === 1) {
        // @ts-ignore
        newMetadata[keys[0]] = value
      } else if (keys.length === 2) {
        // @ts-ignore
        if (!newMetadata[keys[0]]) {
          // @ts-ignore
          newMetadata[keys[0]] = {}
        }
        // @ts-ignore
        newMetadata[keys[0]][keys[1]] = value
      }

      return { ...prev, metadata: newMetadata }
    })
  }

  const handleAddTag = () => {
    if (newTag.trim() && formData.metadata?.tags && !formData.metadata.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        metadata: {
          ...prev.metadata!,
          tags: [...(prev.metadata?.tags || []), newTag.trim()],
        },
      }))
      setNewTag("")
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      metadata: {
        ...prev.metadata!,
        tags: prev.metadata?.tags?.filter((t) => t !== tag) || [],
      },
    }))
  }

  // Card handling functions
  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewCard((prev) => ({ ...prev, [name]: value }))
  }

  const handleCardNumberChange = (name: string, value: string) => {
    setNewCard((prev) => ({ ...prev, [name]: value === "" ? 0 : Number.parseInt(value) }))
  }

  const handleCardColorChange = (name: string, value: string) => {
    setNewCard((prev) => ({ ...prev, [name]: value }))
  }

  const handleCardSwitchChange = (name: string, checked: boolean) => {
    setNewCard((prev) => ({ ...prev, [name]: checked }))
  }

  const resetCardForm = () => {
    setNewCard({
      title: "",
      subtitle: "",
      description: "",
      imageUrl: "",
      linkUrl: "",
      linkText: "",
      backgroundColor: "#ffffff",
      textColor: "#000000",
      position: formData.cards?.length ?? 0, // Ensure position is always a number
      cardSectionId: cardSectionId || "",
      isActive: true, // Always set a default value
    })
    setEditingCardIndex(null)
  }

  const handleAddCard = () => {
    if (!newCard.title.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El título de la tarjeta es obligatorio",
      })
      return
    }

    if (editingCardIndex !== null) {
      // Editing existing card
      setFormData((prev) => {
        const updatedCards = [...(prev.cards || [])]
        updatedCards[editingCardIndex] = {
          ...updatedCards[editingCardIndex],
          ...newCard,
          // Preserve the ID if it exists
          id: updatedCards[editingCardIndex].id,
        }
        return { ...prev, cards: updatedCards }
      })
      toast({
        title: "Tarjeta actualizada",
        description: "La tarjeta ha sido actualizada correctamente",
      })
    } else {
      // Adding new card
      setFormData((prev) => ({
        ...prev,
        cards: [
          ...(prev.cards || []),
          {
            ...newCard,
            id: `temp-${Date.now()}`,
            position: newCard.position ?? formData.cards?.length ?? 0, // Ensure position is always a number
            isActive: newCard.isActive ?? true, // Ensure isActive is always a boolean
          },
        ],
      }))
      toast({
        title: "Tarjeta añadida",
        description: "La tarjeta ha sido añadida correctamente",
      })
    }

    resetCardForm()
    setIsCardDialogOpen(false)
  }

  const handleEditCard = (index: number) => {
    const card = formData.cards?.[index]
    if (card) {
      setNewCard({
        title: card.title || "",
        subtitle: card.subtitle || "",
        description: card.description || "",
        imageUrl: card.imageUrl || "",
        linkUrl: card.linkUrl || "",
        linkText: card.linkText || "",
        backgroundColor: card.backgroundColor || "#ffffff",
        textColor: card.textColor || "#000000",
        position: card.position || 0,
        cardSectionId: cardSectionId || "",
        isActive: card.isActive, // This is already a boolean in the Card interface
      })
      setEditingCardIndex(index)
      setIsCardDialogOpen(true)
    }
  }

  const handleRemoveCard = (index: number) => {
    setFormData((prev) => {
      const updatedCards = [...(prev.cards || [])]
      updatedCards.splice(index, 1)
      // Update positions
      updatedCards.forEach((card, idx) => {
        card.position = idx
      })
      return { ...prev, cards: updatedCards }
    })
    toast({
      title: "Tarjeta eliminada",
      description: "La tarjeta ha sido eliminada correctamente",
    })
  }

  const handleDuplicateCard = (index: number) => {
    const card = formData.cards?.[index]
    if (card) {
      const newCardCopy = {
        ...card,
        id: `temp-${Date.now()}`,
        title: `${card.title} (copia)`,
        position: formData.cards?.length || 0,
      }
      setFormData((prev) => ({
        ...prev,
        cards: [...(prev.cards || []), newCardCopy],
      }))
      toast({
        title: "Tarjeta duplicada",
        description: "La tarjeta ha sido duplicada correctamente",
      })
    }
  }

  const handleMoveCard = (index: number, direction: "up" | "down") => {
    if (!formData.cards || formData.cards.length <= 1) return

    const newIndex = direction === "up" ? index - 1 : index + 1

    if (newIndex < 0 || newIndex >= formData.cards.length) return

    setFormData((prev) => {
      const updatedCards = [...(prev.cards || [])]
      const temp = updatedCards[index]
      updatedCards[index] = updatedCards[newIndex]
      updatedCards[newIndex] = temp

      // Update positions
      updatedCards.forEach((card, idx) => {
        card.position = idx
      })

      return { ...prev, cards: updatedCards }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title?.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El título de la sección es obligatorio",
      })
      return
    }

    setIsSubmitting(true)

    try {
      if (cardSectionId) {
        // Actualizar sección existente
        await updateCardSection(cardSectionId, formData as UpdateCardSectionDto)
        toast({
          title: "Sección actualizada",
          description: "La sección de tarjetas ha sido actualizada correctamente",
        })
      } else {
        // Crear nueva sección
        await createCardSection({
          ...formData,
          storeId: currentStore!,
        } as CreateCardSectionDto)
        toast({
          title: "Sección creada",
          description: "La sección de tarjetas ha sido creada correctamente",
        })
      }

      router.push("/cards")
    } catch (error) {
      console.error("Error al guardar la sección:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error al guardar la sección. Por favor, inténtelo de nuevo.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Preparar datos para el diálogo de JSON
  const jsonData = cardSectionId ? { ...formData } : { ...formData, storeId: currentStore }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <TabsList className="grid grid-cols-4 w-full sm:w-auto">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">General</span>
              </TabsTrigger>
              <TabsTrigger value="styles" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline">Estilos</span>
              </TabsTrigger>
              <TabsTrigger value="cards" className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                <span className="hidden sm:inline">Tarjetas</span>
                {formData.cards && formData.cards.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {formData.cards.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="metadata" className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                <span className="hidden sm:inline">Metadatos</span>
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <JsonPreviewDialog title="Datos de la sección de tarjetas" data={jsonData} />
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {cardSectionId ? "Actualizando..." : "Guardando..."}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {cardSectionId ? "Actualizar" : "Guardar"}
                  </>
                )}
              </Button>
            </div>
          </div>

          <TabsContent value="general" className="mt-0">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card className="border-primary/10 shadow-md">
                <CardHeader className="bg-muted/30">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Información General
                  </CardTitle>
                  <CardDescription>Configure la información básica de la sección de tarjetas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-base font-medium">
                        Título <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Título de la sección"
                        required
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subtitle" className="text-base font-medium">
                        Subtítulo
                      </Label>
                      <Input
                        id="subtitle"
                        name="subtitle"
                        value={formData.subtitle || ""}
                        onChange={handleChange}
                        placeholder="Subtítulo de la sección"
                        className="h-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-base font-medium">
                      Descripción
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description || ""}
                      onChange={handleChange}
                      placeholder="Descripción de la sección"
                      rows={3}
                      className="resize-y"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="layout" className="text-base font-medium">
                        Diseño
                      </Label>
                      <Select
                        value={formData.layout as string}
                        onValueChange={(value) => handleSelectChange("layout", value)}
                      >
                        <SelectTrigger id="layout" className="h-10">
                          <SelectValue placeholder="Seleccionar diseño" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="grid">
                            <div className="flex items-center gap-2">
                              <LayoutGrid className="h-4 w-4" />
                              <span>Cuadrícula</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="carousel">
                            <div className="flex items-center gap-2">
                              <Layers className="h-4 w-4" />
                              <span>Carrusel</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="masonry">
                            <div className="flex items-center gap-2">
                              <LayoutGrid className="h-4 w-4" />
                              <span>Mosaico</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="flex">
                            <div className="flex items-center gap-2">
                              <LayoutGrid className="h-4 w-4" />
                              <span>Flexible</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxCards" className="text-base font-medium">
                        Máximo de tarjetas
                      </Label>
                      <Input
                        id="maxCards"
                        type="number"
                        value={formData.maxCards?.toString() || ""}
                        onChange={(e) => handleNumberChange("maxCards", e.target.value)}
                        min={0}
                        placeholder="Sin límite"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="position" className="text-base font-medium">
                        Posición
                      </Label>
                      <Input
                        id="position"
                        name="position"
                        type="number"
                        value={formData.position}
                        onChange={handleChange}
                        min={0}
                        className="h-10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="backgroundColor" className="text-base font-medium">
                        Color de fondo
                      </Label>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-10 h-10 rounded border"
                          style={{ backgroundColor: formData.backgroundColor as string }}
                        />
                        <ColorPicker
                          value={formData.backgroundColor as string}
                          onChange={(value) => handleColorChange("backgroundColor", value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="textColor" className="text-base font-medium">
                        Color de texto
                      </Label>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-10 h-10 rounded border flex items-center justify-center"
                          style={{ backgroundColor: formData.backgroundColor as string }}
                        >
                          <span style={{ color: formData.textColor as string }}>T</span>
                        </div>
                        <ColorPicker
                          value={formData.textColor as string}
                          onChange={(value) => handleColorChange("textColor", value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="isActive" className="block mb-2 text-base font-medium">
                        Estado
                      </Label>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isActive"
                          checked={formData.isActive}
                          onCheckedChange={(checked) => handleSwitchChange("isActive", checked)}
                        />
                        <Label htmlFor="isActive" className="cursor-pointer">
                          {formData.isActive ? (
                            <Badge variant="success">Activo</Badge>
                          ) : (
                            <Badge variant="secondary">Inactivo</Badge>
                          )}
                        </Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="styles" className="mt-0">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card className="border-primary/10 shadow-md">
                <CardHeader className="bg-muted/30">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Palette className="h-5 w-5 text-primary" />
                    Estilos y Diseño
                  </CardTitle>
                  <CardDescription>Configure los estilos visuales y el diseño de la sección</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <LayoutGrid className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-medium">Configuración de Cuadrícula</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="gridColumns.mobile" className="text-base font-medium">
                          Columnas (Móvil)
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="gridColumns.mobile"
                            type="number"
                            value={(formData.styles?.gridColumns?.mobile || 1).toString()}
                            onChange={(e) => handleStylesChange("gridColumns.mobile", Number.parseInt(e.target.value))}
                            min={1}
                            max={4}
                            className="h-10"
                          />
                          <div className="flex-shrink-0 w-16 h-10 border rounded flex items-center justify-center bg-muted/30">
                            <div
                              className="grid"
                              style={{
                                gridTemplateColumns: `repeat(${formData.styles?.gridColumns?.mobile || 1}, 1fr)`,
                                gap: "2px",
                                width: "100%",
                                padding: "0 4px",
                              }}
                            >
                              {Array.from({ length: formData.styles?.gridColumns?.mobile || 1 }).map((_, i) => (
                                <div key={i} className="bg-primary h-6 rounded-sm"></div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gridColumns.tablet" className="text-base font-medium">
                          Columnas (Tablet)
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="gridColumns.tablet"
                            type="number"
                            value={(formData.styles?.gridColumns?.tablet || 2).toString()}
                            onChange={(e) => handleStylesChange("gridColumns.tablet", Number.parseInt(e.target.value))}
                            min={1}
                            max={6}
                            className="h-10"
                          />
                          <div className="flex-shrink-0 w-16 h-10 border rounded flex items-center justify-center bg-muted/30">
                            <div
                              className="grid"
                              style={{
                                gridTemplateColumns: `repeat(${formData.styles?.gridColumns?.tablet || 2}, 1fr)`,
                                gap: "2px",
                                width: "100%",
                                padding: "0 4px",
                              }}
                            >
                              {Array.from({ length: formData.styles?.gridColumns?.tablet || 2 }).map((_, i) => (
                                <div key={i} className="bg-primary h-6 rounded-sm"></div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gridColumns.desktop" className="text-base font-medium">
                          Columnas (Escritorio)
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="gridColumns.desktop"
                            type="number"
                            value={(formData.styles?.gridColumns?.desktop || 3).toString()}
                            onChange={(e) => handleStylesChange("gridColumns.desktop", Number.parseInt(e.target.value))}
                            min={1}
                            max={12}
                            className="h-10"
                          />
                          <div className="flex-shrink-0 w-16 h-10 border rounded flex items-center justify-center bg-muted/30">
                            <div
                              className="grid"
                              style={{
                                gridTemplateColumns: `repeat(${formData.styles?.gridColumns?.desktop || 3}, 1fr)`,
                                gap: "2px",
                                width: "100%",
                                padding: "0 4px",
                              }}
                            >
                              {Array.from({ length: Math.min(formData.styles?.gridColumns?.desktop || 3, 6) }).map(
                                (_, i) => (
                                  <div key={i} className="bg-primary h-6 rounded-sm"></div>
                                ),
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="styles.gap" className="text-base font-medium">
                        Espacio entre elementos
                      </Label>
                      <Input
                        id="styles.gap"
                        value={formData.styles?.gap || "1rem"}
                        onChange={(e) => handleStylesChange("gap", e.target.value)}
                        placeholder="1rem"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="styles.padding" className="text-base font-medium">
                        Relleno interno
                      </Label>
                      <Input
                        id="styles.padding"
                        value={formData.styles?.padding || "1rem"}
                        onChange={(e) => handleStylesChange("padding", e.target.value)}
                        placeholder="1rem"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="styles.margin" className="text-base font-medium">
                        Margen externo
                      </Label>
                      <Input
                        id="styles.margin"
                        value={formData.styles?.margin || "0"}
                        onChange={(e) => handleStylesChange("margin", e.target.value)}
                        placeholder="0"
                        className="h-10"
                      />
                    </div>
                  </div>

                  {formData.layout === "carousel" && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Layers className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-medium">Opciones de Carrusel</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="carouselOptions.autoplay" className="block mb-2 text-base font-medium">
                              Reproducción automática
                            </Label>
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="carouselOptions.autoplay"
                                checked={formData.styles?.carouselOptions?.autoplay}
                                onCheckedChange={(checked) => handleStylesChange("carouselOptions.autoplay", checked)}
                              />
                              <Label htmlFor="carouselOptions.autoplay" className="cursor-pointer">
                                {formData.styles?.carouselOptions?.autoplay ? (
                                  <Badge variant="outline" className="bg-primary/10">
                                    Activado
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">Desactivado</Badge>
                                )}
                              </Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="carouselOptions.loop" className="block mb-2 text-base font-medium">
                              Bucle infinito
                            </Label>
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="carouselOptions.loop"
                                checked={formData.styles?.carouselOptions?.loop}
                                onCheckedChange={(checked) => handleStylesChange("carouselOptions.loop", checked)}
                              />
                              <Label htmlFor="carouselOptions.loop" className="cursor-pointer">
                                {formData.styles?.carouselOptions?.loop ? (
                                  <Badge variant="outline" className="bg-primary/10">
                                    Activado
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">Desactivado</Badge>
                                )}
                              </Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="carouselOptions.arrows" className="block mb-2 text-base font-medium">
                              Mostrar flechas
                            </Label>
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="carouselOptions.arrows"
                                checked={formData.styles?.carouselOptions?.arrows}
                                onCheckedChange={(checked) => handleStylesChange("carouselOptions.arrows", checked)}
                              />
                              <Label htmlFor="carouselOptions.arrows" className="cursor-pointer">
                                {formData.styles?.carouselOptions?.arrows ? (
                                  <Badge variant="outline" className="bg-primary/10">
                                    Activado
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">Desactivado</Badge>
                                )}
                              </Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="carouselOptions.dots" className="block mb-2 text-base font-medium">
                              Mostrar indicadores
                            </Label>
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="carouselOptions.dots"
                                checked={formData.styles?.carouselOptions?.dots}
                                onCheckedChange={(checked) => handleStylesChange("carouselOptions.dots", checked)}
                              />
                              <Label htmlFor="carouselOptions.dots" className="cursor-pointer">
                                {formData.styles?.carouselOptions?.dots ? (
                                  <Badge variant="outline" className="bg-primary/10">
                                    Activado
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">Desactivado</Badge>
                                )}
                              </Label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="cards" className="mt-0">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card className="border-primary/10 shadow-md">
                <CardHeader className="bg-muted/30">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Layers className="h-5 w-5 text-primary" />
                        Tarjetas
                      </CardTitle>
                      <CardDescription>Gestione las tarjetas que se mostrarán en esta sección</CardDescription>
                    </div>
                    <Dialog open={isCardDialogOpen} onOpenChange={setIsCardDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => {
                            resetCardForm()
                            setIsCardDialogOpen(true)
                          }}
                          className="gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Añadir Tarjeta</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>
                            {editingCardIndex !== null ? "Editar Tarjeta" : "Añadir Nueva Tarjeta"}
                          </DialogTitle>
                          <DialogDescription>Complete los detalles de la tarjeta a continuación</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="card-title">
                                Título <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="card-title"
                                name="title"
                                value={newCard.title}
                                onChange={handleCardChange}
                                placeholder="Título de la tarjeta"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="card-subtitle">Subtítulo</Label>
                              <Input
                                id="card-subtitle"
                                name="subtitle"
                                value={newCard.subtitle || ""}
                                onChange={handleCardChange}
                                placeholder="Subtítulo de la tarjeta"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="card-description">Descripción</Label>
                            <Textarea
                              id="card-description"
                              name="description"
                              value={newCard.description || ""}
                              onChange={handleCardChange}
                              placeholder="Descripción de la tarjeta"
                              rows={3}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="card-imageUrl" className="flex items-center gap-2">
                                <ImageIcon className="h-4 w-4" />
                                URL de la imagen
                              </Label>
                              <Input
                                id="card-imageUrl"
                                name="imageUrl"
                                value={newCard.imageUrl || ""}
                                onChange={handleCardChange}
                                placeholder="https://ejemplo.com/imagen.jpg"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="card-position">Posición</Label>
                              <Input
                                id="card-position"
                                name="position"
                                type="number"
                                value={newCard.position}
                                onChange={handleCardChange}
                                min={0}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="card-linkUrl" className="flex items-center gap-2">
                                <Link2 className="h-4 w-4" />
                                URL del enlace
                              </Label>
                              <Input
                                id="card-linkUrl"
                                name="linkUrl"
                                value={newCard.linkUrl || ""}
                                onChange={handleCardChange}
                                placeholder="https://ejemplo.com/pagina"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="card-linkText">Texto del botón</Label>
                              <Input
                                id="card-linkText"
                                name="linkText"
                                value={newCard.linkText || ""}
                                onChange={handleCardChange}
                                placeholder="Leer más"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="card-backgroundColor">Color de fondo</Label>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-8 h-8 rounded border"
                                  style={{ backgroundColor: newCard.backgroundColor as string }}
                                />
                                <ColorPicker
                                  value={newCard.backgroundColor as string}
                                  onChange={(value) => handleCardColorChange("backgroundColor", value)}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="card-textColor">Color de texto</Label>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-8 h-8 rounded border flex items-center justify-center"
                                  style={{ backgroundColor: newCard.backgroundColor as string }}
                                >
                                  <span style={{ color: newCard.textColor as string }}>T</span>
                                </div>
                                <ColorPicker
                                  value={newCard.textColor as string}
                                  onChange={(value) => handleCardColorChange("textColor", value)}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="card-isActive" className="block mb-2">
                              Estado
                            </Label>
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="card-isActive"
                                checked={newCard.isActive}
                                onCheckedChange={(checked) => handleCardSwitchChange("isActive", checked)}
                              />
                              <Label htmlFor="card-isActive" className="cursor-pointer">
                                {newCard.isActive ? "Activo" : "Inactivo"}
                              </Label>
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              resetCardForm()
                              setIsCardDialogOpen(false)
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button type="button" onClick={handleAddCard}>
                            {editingCardIndex !== null ? "Actualizar Tarjeta" : "Añadir Tarjeta"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {!formData.cards || formData.cards.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                      <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No hay tarjetas</h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Añada tarjetas a esta sección para mostrar contenido a sus usuarios.
                      </p>
                      <Button
                        onClick={() => {
                          resetCardForm()
                          setIsCardDialogOpen(true)
                        }}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Añadir Primera Tarjeta</span>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <AnimatePresence>
                          {formData.cards.map((card, index) => (
                            <motion.div
                              key={card.id || index}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ duration: 0.2 }}
                              className="relative group"
                            >
                              <Card className="h-full border-primary/10 hover:border-primary/30 transition-all duration-200 overflow-hidden">
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                  <div className="flex gap-1 bg-background/80 backdrop-blur-sm p-1 rounded-md shadow-sm">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => handleEditCard(index)}
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                      <span className="sr-only">Editar</span>
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => setPreviewCard(index)}
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                      <span className="sr-only">Vista previa</span>
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => handleDuplicateCard(index)}
                                    >
                                      <Copy className="h-3.5 w-3.5" />
                                      <span className="sr-only">Duplicar</span>
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-destructive hover:text-destructive/80"
                                      onClick={() => handleRemoveCard(index)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      <span className="sr-only">Eliminar</span>
                                    </Button>
                                  </div>
                                </div>

                                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="flex gap-1 bg-background/80 backdrop-blur-sm p-1 rounded-md shadow-sm">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => handleMoveCard(index, "up")}
                                      disabled={index === 0}
                                    >
                                      <MoveVertical className="h-3.5 w-3.5 rotate-180" />
                                      <span className="sr-only">Subir</span>
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => handleMoveCard(index, "down")}
                                      disabled={index === formData.cards!.length - 1}
                                    >
                                      <MoveVertical className="h-3.5 w-3.5" />
                                      <span className="sr-only">Bajar</span>
                                    </Button>
                                  </div>
                                </div>

                                {card.imageUrl && (
                                  <div
                                    className="h-40 bg-cover bg-center"
                                    style={{
                                      backgroundImage: `url(${card.imageUrl})`,
                                      backgroundColor: card.backgroundColor || "#ffffff",
                                    }}
                                  />
                                )}
                                <CardContent
                                  className="p-4"
                                  style={{
                                    backgroundColor: card.backgroundColor || "#ffffff",
                                    color: card.textColor || "#000000",
                                  }}
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <h3 className="font-semibold text-lg line-clamp-1">{card.title}</h3>
                                      {card.subtitle && (
                                        <p className="text-sm opacity-80 line-clamp-1">{card.subtitle}</p>
                                      )}
                                    </div>
                                    <Badge
                                      variant={card.isActive ? "outline" : "secondary"}
                                      className="ml-2 flex-shrink-0"
                                    >
                                      {card.position}
                                    </Badge>
                                  </div>
                                  {card.description && <p className="text-sm mt-2 line-clamp-2">{card.description}</p>}
                                  {card.linkUrl && card.linkText && (
                                    <div className="mt-3">
                                      <Badge variant="outline" className="text-xs">
                                        {card.linkText}
                                      </Badge>
                                    </div>
                                  )}
                                </CardContent>
                                {!card.isActive && (
                                  <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex items-center justify-center">
                                    <Badge variant="secondary">Inactivo</Badge>
                                  </div>
                                )}
                              </Card>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}
                </CardContent>
                {formData.cards && formData.cards.length > 0 && (
                  <CardFooter className="flex justify-between border-t p-4">
                    <div className="text-sm text-muted-foreground">Total: {formData.cards.length} tarjetas</div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        resetCardForm()
                        setIsCardDialogOpen(true)
                      }}
                      className="gap-2"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Añadir Tarjeta</span>
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="metadata" className="mt-0">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card className="border-primary/10 shadow-md">
                <CardHeader className="bg-muted/30">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Tag className="h-5 w-5 text-primary" />
                    Metadatos y SEO
                  </CardTitle>
                  <CardDescription>Configure metadatos adicionales y opciones de SEO</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="metadata.seoTitle" className="text-base font-medium">
                        Título SEO
                      </Label>
                      <Input
                        id="metadata.seoTitle"
                        value={formData.metadata?.seoTitle || ""}
                        onChange={(e) => handleMetadataChange("seoTitle", e.target.value)}
                        placeholder="Título para SEO"
                        className="h-10"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Si se deja vacío, se utilizará el título de la sección
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="metadata.seoDescription" className="text-base font-medium">
                        Descripción SEO
                      </Label>
                      <Textarea
                        id="metadata.seoDescription"
                        value={formData.metadata?.seoDescription || ""}
                        onChange={(e) => handleMetadataChange("seoDescription", e.target.value)}
                        placeholder="Descripción para SEO"
                        rows={3}
                        className="resize-y"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Si se deja vacío, se utilizará la descripción de la sección
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label className="text-base font-medium">Etiquetas</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Nueva etiqueta"
                        className="flex-1 h-10"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            handleAddTag()
                          }
                        }}
                      />
                      <Button type="button" onClick={handleAddTag} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Añadir
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2 min-h-[100px] p-4 border rounded-md bg-muted/20">
                      {formData.metadata?.tags && formData.metadata.tags.length > 0 ? (
                        formData.metadata.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="px-3 py-1.5 text-sm">
                            {tag}
                            <button
                              type="button"
                              className="ml-2 text-muted-foreground hover:text-foreground"
                              onClick={() => handleRemoveTag(tag)}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-center w-full my-8">
                          No hay etiquetas. Añada algunas para categorizar esta sección.
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between gap-4 mt-8">
          <Button type="button" variant="outline" onClick={() => router.push("/cards")} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {cardSectionId ? "Actualizando..." : "Guardando..."}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {cardSectionId ? "Actualizar sección" : "Guardar sección"}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Card Preview Dialog */}
      {previewCard !== null && formData.cards && formData.cards[previewCard] && (
        <Dialog open={previewCard !== null} onOpenChange={() => setPreviewCard(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Vista previa de tarjeta</DialogTitle>
              <DialogDescription>Así se verá la tarjeta en la sección</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Card className="overflow-hidden">
                {formData.cards[previewCard].imageUrl && (
                  <div
                    className="h-48 bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${formData.cards[previewCard].imageUrl})`,
                      backgroundColor: formData.cards[previewCard].backgroundColor || "#ffffff",
                    }}
                  />
                )}
                <CardContent
                  className="p-6"
                  style={{
                    backgroundColor: formData.cards[previewCard].backgroundColor || "#ffffff",
                    color: formData.cards[previewCard].textColor || "#000000",
                  }}
                >
                  <h3 className="font-semibold text-xl mb-2">{formData.cards[previewCard].title}</h3>
                  {formData.cards[previewCard].subtitle && (
                    <p className="text-base opacity-80 mb-3">{formData.cards[previewCard].subtitle}</p>
                  )}
                  {formData.cards[previewCard].description && (
                    <p className="text-sm mb-4">{formData.cards[previewCard].description}</p>
                  )}
                  {formData.cards[previewCard].linkUrl && formData.cards[previewCard].linkText && (
                    <Button
                      variant="outline"
                      className="mt-2"
                      style={{
                        borderColor: formData.cards[previewCard].textColor || "#000000",
                        color: formData.cards[previewCard].textColor || "#000000",
                      }}
                    >
                      {formData.cards[previewCard].linkText}
                    </Button>
                  )}
                </CardContent>
              </Card>
              <div className="mt-4 flex justify-between text-sm text-muted-foreground">
                <div>Posición: {formData.cards[previewCard].position}</div>
                <div>Estado: {formData.cards[previewCard].isActive ? "Activo" : "Inactivo"}</div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPreviewCard(null)}>
                Cerrar
              </Button>
              <Button
                onClick={() => {
                  handleEditCard(previewCard)
                  setPreviewCard(null)
                }}
              >
                Editar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </form>
  )
}
