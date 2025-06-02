"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { ColorPicker } from "@/components/ui/color-picker"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import {
  ArrowLeft,
  ChevronRight,
  Copy,
  Edit,
  Eye,
  ImageIcon,
  LayoutTemplate,
  Link2,
  MoveVertical,
  Plus,
  Trash2,
} from "lucide-react"
import type { CardDto, CreateCardSectionDto, UpdateCardSectionDto } from "@/types/card"
import { ImageUploadZone } from "@/components/ui/image-upload-zone"
import { useImageUpload } from "@/hooks/use-image-upload"

interface CardsFormProps {
  formData: CreateCardSectionDto | UpdateCardSectionDto
  updateFormData: (data: Partial<CreateCardSectionDto | UpdateCardSectionDto>) => void
  setActiveTab: (tab: string) => void
}

export function CardsForm({ formData, updateFormData, setActiveTab }: CardsFormProps) {
  const { toast } = useToast()
  const [editingCardIndex, setEditingCardIndex] = useState<number | null>(null)
  const [isCardDialogOpen, setIsCardDialogOpen] = useState(false)
  const [previewCard, setPreviewCard] = useState<number | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const [newCard, setNewCard] = useState<CardDto>({
    title: "",
    subtitle: "",
    description: "",
    imageUrl: "",
    linkUrl: "",
    linkText: "",
    backgroundColor: "#ffffff",
    textColor: "#000000",
    position: 0,
    isActive: true,
  })

  // Configuramos el hook de upload de imágenes
  const { triggerFileSelect, isUploading } = useImageUpload({
    onSuccess: (fileUrl) => {
      setNewCard((prev) => ({ ...prev, imageUrl: fileUrl }))
      toast({
        title: "Imagen subida",
        description: "La imagen se ha subido correctamente",
      })
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error,
      })
    },
    maxFileSize: 5, // 5MB
  })

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
      position: formData.cards?.length ?? 0,
      isActive: true,
    })
    setEditingCardIndex(null)
    setImagePreview(null)
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
      const updatedCards = [...(formData.cards || [])]
      updatedCards[editingCardIndex] = {
        ...updatedCards[editingCardIndex],
        ...newCard,
      }

      updateFormData({ cards: updatedCards })

      toast({
        title: "Tarjeta actualizada",
        description: "La tarjeta ha sido actualizada correctamente",
      })
    } else {
      // Adding new card
      const updatedCards = [
        ...(formData.cards || []),
        {
          ...newCard,
          position: newCard.position ?? formData.cards?.length ?? 0,
          isActive: newCard.isActive ?? true,
        },
      ]

      updateFormData({ cards: updatedCards })

      toast({
        title: "Tarjeta añadida",
        description: "La tarjeta ha sido añadida correctamente",
      })
    }

    resetCardForm()
    setIsCardDialogOpen(false)
  }

  const handleEditCard = (index: number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

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
        isActive: card.isActive,
      })
      setEditingCardIndex(index)
      setIsCardDialogOpen(true)
    }
  }

  const handleRemoveCard = (index: number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    const updatedCards = [...(formData.cards || [])]
    updatedCards.splice(index, 1)

    // Update positions
    updatedCards.forEach((card, idx) => {
      card.position = idx
    })

    updateFormData({ cards: updatedCards })

    toast({
      title: "Tarjeta eliminada",
      description: "La tarjeta ha sido eliminada correctamente",
    })
  }

  const handleDuplicateCard = (index: number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    const card = formData.cards?.[index]
    if (card) {
      const newCardCopy = {
        ...card,
        title: `${card.title} (copia)`,
        position: formData.cards?.length || 0,
      }

      updateFormData({
        cards: [...(formData.cards || []), newCardCopy],
      })

      toast({
        title: "Tarjeta duplicada",
        description: "La tarjeta ha sido duplicada correctamente",
      })
    }
  }

  const handleMoveCard = (index: number, direction: "up" | "down", e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (!formData.cards || formData.cards.length <= 1) return

    const newIndex = direction === "up" ? index - 1 : index + 1

    if (newIndex < 0 || newIndex >= formData.cards.length) return

    const updatedCards = [...(formData.cards || [])]
    const temp = updatedCards[index]
    updatedCards[index] = updatedCards[newIndex]
    updatedCards[newIndex] = temp

    // Update positions
    updatedCards.forEach((card, idx) => {
      card.position = idx
    })

    updateFormData({ cards: updatedCards })
  }

  // Función para manejar la subida de imágenes
  const handleImageUpload = () => {
    triggerFileSelect({
      accept: "image/jpeg,image/png,image/webp,image/gif",
    })
  }

  // Función para eliminar la imagen
  const handleRemoveImage = () => {
    setNewCard((prev) => ({ ...prev, imageUrl: "" }))
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className="border border-border/30 shadow-sm overflow-hidden bg-card dark:bg-card">
        <CardHeader className="bg-gradient-to-r from-teal-500/10 to-teal-500/5 dark:from-teal-400/20 dark:to-teal-400/10 pb-3 sm:pb-4 border-b border-border/20 dark:border-border/30 px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <CardTitle className="text-lg sm:text-xl flex items-center gap-1.5 sm:gap-2 text-teal-700 dark:text-teal-300">
                <LayoutTemplate className="h-4 w-4 sm:h-5 sm:w-5" />
                Tarjetas
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground">
                Gestione las tarjetas que se mostrarán en esta sección
              </CardDescription>
            </div>
            <Dialog open={isCardDialogOpen} onOpenChange={setIsCardDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  onClick={() => {
                    resetCardForm()
                    setIsCardDialogOpen(true)
                  }}
                  className="gap-1 sm:gap-2 bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white transition-colors duration-200 text-xs sm:text-sm h-9 sm:h-10"
                >
                  <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>Añadir Tarjeta</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6 bg-background dark:bg-background border border-border dark:border-border">
                <DialogHeader>
                  <DialogTitle className="text-base sm:text-lg text-foreground dark:text-foreground">
                    {editingCardIndex !== null ? "Editar Tarjeta" : "Añadir Nueva Tarjeta"}
                  </DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground">
                    Complete los detalles de la tarjeta a continuación
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-3 sm:py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="card-title" className="text-xs sm:text-sm text-foreground dark:text-foreground">
                        Título <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="card-title"
                        name="title"
                        value={newCard.title}
                        onChange={handleCardChange}
                        placeholder="Título de la tarjeta"
                        required
                        className="h-9 sm:h-10 rounded-lg border-input dark:border-input bg-background dark:bg-background text-foreground dark:text-foreground focus-visible:ring-teal-500/30 dark:focus-visible:ring-teal-400/30 transition-all duration-200 text-xs sm:text-sm"
                      />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label
                        htmlFor="card-subtitle"
                        className="text-xs sm:text-sm text-foreground dark:text-foreground"
                      >
                        Subtítulo
                      </Label>
                      <Input
                        id="card-subtitle"
                        name="subtitle"
                        value={newCard.subtitle || ""}
                        onChange={handleCardChange}
                        placeholder="Subtítulo de la tarjeta"
                        className="h-9 sm:h-10 rounded-lg border-input dark:border-input bg-background dark:bg-background text-foreground dark:text-foreground focus-visible:ring-teal-500/30 dark:focus-visible:ring-teal-400/30 transition-all duration-200 text-xs sm:text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label
                      htmlFor="card-description"
                      className="text-xs sm:text-sm text-foreground dark:text-foreground"
                    >
                      Descripción
                    </Label>
                    <Textarea
                      id="card-description"
                      name="description"
                      value={newCard.description || ""}
                      onChange={handleCardChange}
                      placeholder="Descripción de la tarjeta"
                      rows={3}
                      className="rounded-lg border-input dark:border-input bg-background dark:bg-background text-foreground dark:text-foreground focus-visible:ring-teal-500/30 dark:focus-visible:ring-teal-400/30 transition-all duration-200 text-xs sm:text-sm"
                    />
                  </div>

                  {/* Nuevo componente de upload de imágenes */}
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label
                      htmlFor="card-image"
                      className="flex items-center gap-1.5 text-xs sm:text-sm text-foreground dark:text-foreground"
                    >
                      <ImageIcon className="h-3 w-3 sm:h-4 sm:w-4 text-teal-600 dark:text-teal-400" />
                      Imagen de la tarjeta
                    </Label>

                    <ImageUploadZone
                      currentImage={newCard.imageUrl || ""}
                      onImageUploaded={(url) => setNewCard((prev) => ({ ...prev, imageUrl: url }))}
                      onRemoveImage={handleRemoveImage}
                      placeholder="Arrastra una imagen aquí o haz clic para seleccionar"
                      className="h-48"
                      maxFileSize={3}
                      variant="default"
                    />

                    <p className="text-xs text-muted-foreground mt-1">
                      Recomendado: Imagen de 1200x800px o similar. Máximo 5MB.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label
                        htmlFor="card-linkUrl"
                        className="flex items-center gap-1.5 text-xs sm:text-sm text-foreground dark:text-foreground"
                      >
                        <Link2 className="h-3 w-3 sm:h-4 sm:w-4 text-teal-600 dark:text-teal-400" />
                        URL del enlace
                      </Label>
                      <Input
                        id="card-linkUrl"
                        name="linkUrl"
                        value={newCard.linkUrl || ""}
                        onChange={handleCardChange}
                        placeholder="https://ejemplo.com/pagina"
                        className="h-9 sm:h-10 rounded-lg border-input dark:border-input bg-background dark:bg-background text-foreground dark:text-foreground focus-visible:ring-teal-500/30 dark:focus-visible:ring-teal-400/30 transition-all duration-200 text-xs sm:text-sm"
                      />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label
                        htmlFor="card-linkText"
                        className="text-xs sm:text-sm text-foreground dark:text-foreground"
                      >
                        Texto del botón
                      </Label>
                      <Input
                        id="card-linkText"
                        name="linkText"
                        value={newCard.linkText || ""}
                        onChange={handleCardChange}
                        placeholder="Leer más"
                        className="h-9 sm:h-10 rounded-lg border-input dark:border-input bg-background dark:bg-background text-foreground dark:text-foreground focus-visible:ring-teal-500/30 dark:focus-visible:ring-teal-400/30 transition-all duration-200 text-xs sm:text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label
                        htmlFor="card-backgroundColor"
                        className="text-xs sm:text-sm text-foreground dark:text-foreground"
                      >
                        Color de fondo
                      </Label>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-lg border border-border dark:border-border"
                          style={{ backgroundColor: newCard.backgroundColor as string }}
                        />
                        <ColorPicker
                          value={newCard.backgroundColor as string}
                          onChange={(value) => handleCardColorChange("backgroundColor", value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label
                        htmlFor="card-textColor"
                        className="text-xs sm:text-sm text-foreground dark:text-foreground"
                      >
                        Color de texto
                      </Label>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-lg border border-border dark:border-border flex items-center justify-center"
                          style={{ backgroundColor: newCard.backgroundColor as string }}
                        >
                          <span style={{ color: newCard.textColor as string, fontWeight: "bold" }}>T</span>
                        </div>
                        <ColorPicker
                          value={newCard.textColor as string}
                          onChange={(value) => handleCardColorChange("textColor", value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label
                        htmlFor="card-position"
                        className="text-xs sm:text-sm text-foreground dark:text-foreground"
                      >
                        Posición
                      </Label>
                      <Input
                        id="card-position"
                        name="position"
                        type="number"
                        value={newCard.position}
                        onChange={(e) => handleCardNumberChange("position", e.target.value)}
                        min={0}
                        className="h-9 sm:h-10 rounded-lg border-input dark:border-input bg-background dark:bg-background text-foreground dark:text-foreground focus-visible:ring-teal-500/30 dark:focus-visible:ring-teal-400/30 transition-all duration-200 text-xs sm:text-sm"
                      />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label
                        htmlFor="card-isActive"
                        className="block mb-1 sm:mb-2 text-xs sm:text-sm text-foreground dark:text-foreground"
                      >
                        Estado
                      </Label>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="card-isActive"
                          checked={newCard.isActive}
                          onCheckedChange={(checked) => handleCardSwitchChange("isActive", checked)}
                          className="data-[state=checked]:bg-emerald-500 dark:data-[state=checked]:bg-emerald-400"
                        />
                        <Label htmlFor="card-isActive" className="cursor-pointer">
                          {newCard.isActive ? (
                            <Badge
                              variant="outline"
                              className="bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800 text-xs"
                            >
                              Activo
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-muted/30 text-muted-foreground border-muted dark:bg-muted/30 dark:text-muted-foreground dark:border-muted text-xs"
                            >
                              Inactivo
                            </Badge>
                          )}
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      resetCardForm()
                      setIsCardDialogOpen(false)
                    }}
                    className="hover:bg-muted/20 dark:hover:bg-muted/20 border-border dark:border-border text-foreground dark:text-foreground transition-colors duration-200 text-xs sm:text-sm h-9 sm:h-10"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAddCard}
                    className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white transition-colors duration-200 text-xs sm:text-sm h-9 sm:h-10"
                  >
                    {editingCardIndex !== null ? "Actualizar" : "Añadir"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
          {!formData.cards || formData.cards.length === 0 ? (
            <div className="text-center py-8 sm:py-12 border-2 border-dashed rounded-lg bg-muted/5 dark:bg-muted/5 border-border/30 dark:border-border/30">
              <LayoutTemplate className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-teal-500/40 dark:text-teal-400/40 mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2 text-teal-700 dark:text-teal-300">
                No hay tarjetas
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground mb-4 sm:mb-6 max-w-md mx-auto px-4">
                Añada tarjetas a esta sección para mostrar contenido a sus usuarios.
              </p>
              <Button
                type="button"
                onClick={() => {
                  resetCardForm()
                  setIsCardDialogOpen(true)
                }}
                className="gap-1 sm:gap-2 bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white transition-colors duration-200 text-xs sm:text-sm h-9 sm:h-10"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Añadir Primera Tarjeta</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <AnimatePresence>
                  {formData.cards.map((card, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      className="relative group"
                    >
                      <Card className="h-full border border-border/30 dark:border-border/30 hover:border-teal-500/50 dark:hover:border-teal-400/50 transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md bg-card dark:bg-card">
                        {/* Action buttons - top */}
                        <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <div className="flex gap-1.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-1.5 rounded-lg shadow-sm border border-gray-200/50 dark:border-gray-700/50">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 sm:h-8 sm:w-8 text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/30 rounded-md"
                              onClick={(e) => handleEditCard(index, e)}
                              title="Editar"
                            >
                              <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              <span className="sr-only">Editar</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setPreviewCard(index)
                              }}
                              title="Vista previa"
                            >
                              <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              <span className="sr-only">Vista previa</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 sm:h-8 sm:w-8 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-md"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleDuplicateCard(index)
                              }}
                              title="Duplicar"
                            >
                              <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              <span className="sr-only">Duplicar</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 sm:h-8 sm:w-8 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleRemoveCard(index)
                              }}
                              title="Eliminar"
                            >
                              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              <span className="sr-only">Eliminar</span>
                            </Button>
                          </div>
                        </div>

                        {/* Move buttons - bottom */}
                        <div className="absolute bottom-1.5 sm:bottom-2 right-1.5 sm:right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex gap-1.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-1.5 rounded-lg shadow-sm border border-gray-200/50 dark:border-gray-700/50">
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-7 w-7 sm:h-8 sm:w-8 rounded-md ${
                                index === 0
                                  ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                                  : "text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/30"
                              }`}
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleMoveCard(index, "up")
                              }}
                              disabled={index === 0}
                              title="Mover arriba"
                            >
                              <MoveVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4 rotate-180" />
                              <span className="sr-only">Subir</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-7 w-7 sm:h-8 sm:w-8 rounded-md ${
                                index === formData.cards!.length - 1
                                  ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                                  : "text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/30"
                              }`}
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleMoveCard(index, "down")
                              }}
                              disabled={index === formData.cards!.length - 1}
                              title="Mover abajo"
                            >
                              <MoveVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              <span className="sr-only">Bajar</span>
                            </Button>
                          </div>
                        </div>

                        {card.imageUrl && (
                          <div
                            className="h-32 sm:h-40 bg-cover bg-center"
                            style={{
                              backgroundImage: `url(${card.imageUrl})`,
                              backgroundColor: card.backgroundColor || "#ffffff",
                            }}
                          />
                        )}
                        <CardContent
                          className="p-3 sm:p-4"
                          style={{
                            backgroundColor: card.backgroundColor || "#ffffff",
                            color: card.textColor || "#000000",
                          }}
                        >
                          <div className="flex items-start justify-between mb-1 sm:mb-2">
                            <div className="max-w-[80%]">
                              <h3 className="font-semibold text-sm sm:text-lg line-clamp-1">{card.title}</h3>
                              {card.subtitle && (
                                <p className="text-xs sm:text-sm opacity-80 line-clamp-1">{card.subtitle}</p>
                              )}
                            </div>
                            <Badge
                              variant={card.isActive ? "outline" : "secondary"}
                              className={`ml-1 sm:ml-2 flex-shrink-0 text-[10px] sm:text-xs ${
                                card.isActive
                                  ? "bg-teal-50 text-teal-600 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800"
                                  : "bg-muted/30 text-muted-foreground dark:bg-muted/30 dark:text-muted-foreground"
                              }`}
                            >
                              {card.position}
                            </Badge>
                          </div>
                          {card.description && (
                            <p className="text-xs sm:text-sm mt-1 sm:mt-2 line-clamp-2">{card.description}</p>
                          )}
                          {card.linkUrl && card.linkText && (
                            <div className="mt-2 sm:mt-3">
                              <Badge variant="outline" className="text-[10px] sm:text-xs border-current">
                                {card.linkText}
                              </Badge>
                            </div>
                          )}
                        </CardContent>
                        {!card.isActive && (
                          <div className="absolute inset-0 bg-gray-100/70 dark:bg-gray-900/70 backdrop-blur-[1px] flex items-center justify-center">
                            <Badge
                              variant="secondary"
                              className="text-xs px-3 py-1 bg-background/80 dark:bg-background/80 text-foreground dark:text-foreground"
                            >
                              Inactivo
                            </Badge>
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
          <CardFooter className="flex justify-between border-t border-border/20 dark:border-border/30 p-3 sm:p-4 bg-muted/5 dark:bg-muted/5">
            <div className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground">
              Total: {formData.cards.length} tarjetas
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                resetCardForm()
                setIsCardDialogOpen(true)
              }}
              className="gap-1 sm:gap-2 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors duration-200 text-xs h-7 sm:h-8"
            >
              <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>Añadir Tarjeta</span>
            </Button>
          </CardFooter>
        )}
        <CardFooter className="bg-muted/5 dark:bg-muted/5 border-t border-border/20 dark:border-border/30 px-4 sm:px-6 py-3 sm:py-4 flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setActiveTab("styles")}
            className="gap-1 sm:gap-2 hover:bg-muted/20 dark:hover:bg-muted/20 border-border dark:border-border text-foreground dark:text-foreground transition-colors duration-200 text-xs sm:text-sm h-9 sm:h-10"
          >
            <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Volver</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setActiveTab("metadata")}
            className="gap-1 sm:gap-2 hover:bg-muted/20 dark:hover:bg-muted/20 border-border dark:border-border text-foreground dark:text-foreground transition-colors duration-200 text-xs sm:text-sm h-9 sm:h-10"
          >
            <span>Siguiente</span>
            <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        </CardFooter>
      </Card>

      {/* Card Preview Dialog */}
      {previewCard !== null && formData.cards && formData.cards[previewCard] && (
        <Dialog open={previewCard !== null} onOpenChange={() => setPreviewCard(null)}>
          <DialogContent className="sm:max-w-[500px] p-4 sm:p-6 bg-background dark:bg-background border border-border dark:border-border">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg text-foreground dark:text-foreground">
                Vista previa de tarjeta
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground">
                Así se verá la tarjeta en la sección
              </DialogDescription>
            </DialogHeader>
            <div className="py-3 sm:py-4">
              <Card className="overflow-hidden shadow-md bg-card dark:bg-card border border-border dark:border-border">
                {formData.cards[previewCard].imageUrl && (
                  <div
                    className="h-40 sm:h-48 bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${formData.cards[previewCard].imageUrl})`,
                      backgroundColor: formData.cards[previewCard].backgroundColor || "#ffffff",
                    }}
                  />
                )}
                <CardContent
                  className="p-4 sm:p-6"
                  style={{
                    backgroundColor: formData.cards[previewCard].backgroundColor || "#ffffff",
                    color: formData.cards[previewCard].textColor || "#000000",
                  }}
                >
                  <h3 className="font-semibold text-base sm:text-xl mb-1 sm:mb-2">
                    {formData.cards[previewCard].title}
                  </h3>
                  {formData.cards[previewCard].subtitle && (
                    <p className="text-sm sm:text-base opacity-80 mb-2 sm:mb-3">
                      {formData.cards[previewCard].subtitle}
                    </p>
                  )}
                  {formData.cards[previewCard].description && (
                    <p className="text-xs sm:text-sm mb-3 sm:mb-4">{formData.cards[previewCard].description}</p>
                  )}
                  {formData.cards[previewCard].linkUrl && formData.cards[previewCard].linkText && (
                    <Button
                      variant="outline"
                      className="mt-1 sm:mt-2 text-xs sm:text-sm h-8 sm:h-9"
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
              <div className="mt-3 sm:mt-4 flex justify-between text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground">
                <div>Posición: {formData.cards[previewCard].position}</div>
                <div>Estado: {formData.cards[previewCard].isActive ? "Activo" : "Inactivo"}</div>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setPreviewCard(null)}
                className="text-xs sm:text-sm h-9 sm:h-10 border-border dark:border-border hover:bg-muted/20 dark:hover:bg-muted/20 text-foreground dark:text-foreground"
              >
                Cerrar
              </Button>
              <Button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleEditCard(previewCard)
                  setPreviewCard(null)
                }}
                className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white transition-colors duration-200 text-xs sm:text-sm h-9 sm:h-10"
              >
                Editar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  )
}
