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

  const [newCard, setNewCard] = useState<CardDto>({
    title: "",
    subtitle: "",
    description: "",
    imageUrl: "",
    linkUrl: "",
    linkText: "", // Correcto según el esquema de la BD
    backgroundColor: "#ffffff",
    textColor: "#000000",
    position: 0,
    isActive: true,
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
      linkText: "", // Correcto según el esquema de la BD
      backgroundColor: "#ffffff",
      textColor: "#000000",
      position: formData.cards?.length ?? 0,
      isActive: true,
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

  const handleEditCard = (index: number) => {
    const card = formData.cards?.[index]
    if (card) {
      setNewCard({
        title: card.title || "",
        subtitle: card.subtitle || "",
        description: card.description || "",
        imageUrl: card.imageUrl || "",
        linkUrl: card.linkUrl || "",
        linkText: card.linkText || "", // Correcto según el esquema de la BD
        backgroundColor: card.backgroundColor || "#ffffff",
        textColor: card.textColor || "#000000",
        position: card.position || 0,
        isActive: card.isActive,
      })
      setEditingCardIndex(index)
      setIsCardDialogOpen(true)
    }
  }

  const handleRemoveCard = (index: number) => {
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

  const handleDuplicateCard = (index: number) => {
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

  const handleMoveCard = (index: number, direction: "up" | "down") => {
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

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className="border border-border/30 shadow-sm overflow-hidden bg-card">
        <CardHeader className="bg-gradient-to-r from-accent/10 to-accent/5 dark:from-accent/20 dark:to-accent/10 pb-3 sm:pb-4 border-b border-border/20 px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <CardTitle className="text-lg sm:text-xl flex items-center gap-1.5 sm:gap-2 text-accent-foreground">
                <LayoutTemplate className="h-4 w-4 sm:h-5 sm:w-5" />
                Tarjetas
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
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
                  className="gap-1 sm:gap-2 bg-accent hover:bg-accent/90 text-accent-foreground transition-colors duration-200 text-xs sm:text-sm h-9 sm:h-10"
                >
                  <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>Añadir Tarjeta</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                <DialogHeader>
                  <DialogTitle className="text-base sm:text-lg">
                    {editingCardIndex !== null ? "Editar Tarjeta" : "Añadir Nueva Tarjeta"}
                  </DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm">
                    Complete los detalles de la tarjeta a continuación
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-3 sm:py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="card-title" className="text-xs sm:text-sm">
                        Título <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="card-title"
                        name="title"
                        value={newCard.title}
                        onChange={handleCardChange}
                        placeholder="Título de la tarjeta"
                        required
                        className="h-9 sm:h-10 rounded-lg border-input focus-visible:ring-ring/30 transition-all duration-200 text-xs sm:text-sm"
                      />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="card-subtitle" className="text-xs sm:text-sm">
                        Subtítulo
                      </Label>
                      <Input
                        id="card-subtitle"
                        name="subtitle"
                        value={newCard.subtitle || ""}
                        onChange={handleCardChange}
                        placeholder="Subtítulo de la tarjeta"
                        className="h-9 sm:h-10 rounded-lg border-input focus-visible:ring-ring/30 transition-all duration-200 text-xs sm:text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="card-description" className="text-xs sm:text-sm">
                      Descripción
                    </Label>
                    <Textarea
                      id="card-description"
                      name="description"
                      value={newCard.description || ""}
                      onChange={handleCardChange}
                      placeholder="Descripción de la tarjeta"
                      rows={3}
                      className="rounded-lg border-input focus-visible:ring-ring/30 transition-all duration-200 text-xs sm:text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="card-imageUrl" className="flex items-center gap-1.5 text-xs sm:text-sm">
                        <ImageIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                        URL de la imagen
                      </Label>
                      <Input
                        id="card-imageUrl"
                        name="imageUrl"
                        value={newCard.imageUrl || ""}
                        onChange={handleCardChange}
                        placeholder="https://ejemplo.com/imagen.jpg"
                        className="h-9 sm:h-10 rounded-lg border-input focus-visible:ring-ring/30 transition-all duration-200 text-xs sm:text-sm"
                      />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="card-position" className="text-xs sm:text-sm">
                        Posición
                      </Label>
                      <Input
                        id="card-position"
                        name="position"
                        type="number"
                        value={newCard.position}
                        onChange={(e) => handleCardNumberChange("position", e.target.value)}
                        min={0}
                        className="h-9 sm:h-10 rounded-lg border-input focus-visible:ring-ring/30 transition-all duration-200 text-xs sm:text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="card-linkUrl" className="flex items-center gap-1.5 text-xs sm:text-sm">
                        <Link2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        URL del enlace
                      </Label>
                      <Input
                        id="card-linkUrl"
                        name="linkUrl"
                        value={newCard.linkUrl || ""}
                        onChange={handleCardChange}
                        placeholder="https://ejemplo.com/pagina"
                        className="h-9 sm:h-10 rounded-lg border-input focus-visible:ring-ring/30 transition-all duration-200 text-xs sm:text-sm"
                      />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="card-linkText" className="text-xs sm:text-sm">
                        Texto del botón
                      </Label>
                      <Input
                        id="card-linkText"
                        name="linkText"
                        value={newCard.linkText || ""}
                        onChange={handleCardChange}
                        placeholder="Leer más"
                        className="h-9 sm:h-10 rounded-lg border-input focus-visible:ring-ring/30 transition-all duration-200 text-xs sm:text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="card-backgroundColor" className="text-xs sm:text-sm">
                        Color de fondo
                      </Label>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-lg border"
                          style={{ backgroundColor: newCard.backgroundColor as string }}
                        />
                        <ColorPicker
                          value={newCard.backgroundColor as string}
                          onChange={(value) => handleCardColorChange("backgroundColor", value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="card-textColor" className="text-xs sm:text-sm">
                        Color de texto
                      </Label>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-lg border flex items-center justify-center"
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

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="card-isActive" className="block mb-1 sm:mb-2 text-xs sm:text-sm">
                      Estado
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="card-isActive"
                        checked={newCard.isActive}
                        onCheckedChange={(checked) => handleCardSwitchChange("isActive", checked)}
                        className="data-[state=checked]:bg-success"
                      />
                      <Label htmlFor="card-isActive" className="cursor-pointer">
                        {newCard.isActive ? (
                          <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs">
                            Activo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-muted/30 text-muted-foreground border-muted text-xs">
                            Inactivo
                          </Badge>
                        )}
                      </Label>
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
                    className="hover:bg-muted/20 transition-colors duration-200 text-xs sm:text-sm h-9 sm:h-10"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAddCard}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground transition-colors duration-200 text-xs sm:text-sm h-9 sm:h-10"
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
            <div className="text-center py-8 sm:py-12 border-2 border-dashed rounded-lg bg-muted/5 border-border/30">
              <LayoutTemplate className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-accent/30 mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2 text-accent-foreground">No hay tarjetas</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 max-w-md mx-auto px-4">
                Añada tarjetas a esta sección para mostrar contenido a sus usuarios.
              </p>
              <Button
                type="button"
                onClick={() => {
                  resetCardForm()
                  setIsCardDialogOpen(true)
                }}
                className="gap-1 sm:gap-2 bg-accent hover:bg-accent/90 text-accent-foreground transition-colors duration-200 text-xs sm:text-sm h-9 sm:h-10"
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
                      <Card className="h-full border border-border/30 hover:border-accent/50 transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md">
                        <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <div className="flex gap-1 bg-background/90 backdrop-blur-sm p-1 rounded-md shadow-sm">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 sm:h-7 sm:w-7 text-accent hover:text-accent-foreground hover:bg-accent/20"
                              onClick={() => handleEditCard(index)}
                            >
                              <Edit className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              <span className="sr-only">Editar</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 sm:h-7 sm:w-7 text-accent hover:text-accent-foreground hover:bg-accent/20"
                              onClick={() => setPreviewCard(index)}
                            >
                              <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              <span className="sr-only">Vista previa</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 sm:h-7 sm:w-7 text-accent hover:text-accent-foreground hover:bg-accent/20"
                              onClick={() => handleDuplicateCard(index)}
                            >
                              <Copy className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              <span className="sr-only">Duplicar</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 sm:h-7 sm:w-7 text-destructive hover:text-destructive-foreground hover:bg-destructive/10"
                              onClick={() => handleRemoveCard(index)}
                            >
                              <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              <span className="sr-only">Eliminar</span>
                            </Button>
                          </div>
                        </div>

                        <div className="absolute bottom-1.5 sm:bottom-2 right-1.5 sm:right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex gap-1 bg-background/90 backdrop-blur-sm p-1 rounded-md shadow-sm">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 sm:h-7 sm:w-7 text-accent hover:text-accent-foreground hover:bg-accent/20"
                              onClick={() => handleMoveCard(index, "up")}
                              disabled={index === 0}
                            >
                              <MoveVertical className="h-3 w-3 sm:h-3.5 sm:w-3.5 rotate-180" />
                              <span className="sr-only">Subir</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 sm:h-7 sm:w-7 text-accent hover:text-accent-foreground hover:bg-accent/20"
                              onClick={() => handleMoveCard(index, "down")}
                              disabled={index === formData.cards!.length - 1}
                            >
                              <MoveVertical className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
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
                                  ? "bg-accent/10 text-accent-foreground border-accent/20"
                                  : "bg-muted/30 text-muted-foreground"
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
                              <Badge variant="outline" className="text-[10px] sm:text-xs">
                                {card.linkText}
                              </Badge>
                            </div>
                          )}
                        </CardContent>
                        {!card.isActive && (
                          <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex items-center justify-center">
                            <Badge variant="secondary" className="text-xs">
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
          <CardFooter className="flex justify-between border-t border-border/20 p-3 sm:p-4 bg-muted/5">
            <div className="text-xs sm:text-sm text-muted-foreground">Total: {formData.cards.length} tarjetas</div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                resetCardForm()
                setIsCardDialogOpen(true)
              }}
              className="gap-1 sm:gap-2 border-accent/20 text-accent-foreground hover:bg-accent/10 transition-colors duration-200 text-xs h-7 sm:h-8"
            >
              <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>Añadir Tarjeta</span>
            </Button>
          </CardFooter>
        )}
        <CardFooter className="bg-muted/5 border-t border-border/20 px-4 sm:px-6 py-3 sm:py-4 flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setActiveTab("styles")}
            className="gap-1 sm:gap-2 hover:bg-primary/5 transition-colors duration-200 text-xs sm:text-sm h-9 sm:h-10"
          >
            <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Volver</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setActiveTab("metadata")}
            className="gap-1 sm:gap-2 hover:bg-primary/5 transition-colors duration-200 text-xs sm:text-sm h-9 sm:h-10"
          >
            <span>Siguiente</span>
            <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        </CardFooter>
      </Card>

      {/* Card Preview Dialog */}
      {previewCard !== null && formData.cards && formData.cards[previewCard] && (
        <Dialog open={previewCard !== null} onOpenChange={() => setPreviewCard(null)}>
          <DialogContent className="sm:max-w-[500px] p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">Vista previa de tarjeta</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">Así se verá la tarjeta en la sección</DialogDescription>
            </DialogHeader>
            <div className="py-3 sm:py-4">
              <Card className="overflow-hidden shadow-md">
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
              <div className="mt-3 sm:mt-4 flex justify-between text-xs sm:text-sm text-muted-foreground">
                <div>Posición: {formData.cards[previewCard].position}</div>
                <div>Estado: {formData.cards[previewCard].isActive ? "Activo" : "Inactivo"}</div>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setPreviewCard(null)} className="text-xs sm:text-sm h-9 sm:h-10">
                Cerrar
              </Button>
              <Button
                onClick={() => {
                  handleEditCard(previewCard)
                  setPreviewCard(null)
                }}
                className="bg-accent hover:bg-accent/90 text-accent-foreground transition-colors duration-200 text-xs sm:text-sm h-9 sm:h-10"
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
