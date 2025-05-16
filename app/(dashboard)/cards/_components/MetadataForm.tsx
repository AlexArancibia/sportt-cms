"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Alert,   AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, ArrowLeft, Info, Plus, Sparkles, Tag, X } from "lucide-react"
import { Loader2 } from "lucide-react"
import type { CardSectionMetadata, CreateCardSectionDto, UpdateCardSectionDto } from "@/types/card"

interface MetadataFormProps {
  formData: CreateCardSectionDto | UpdateCardSectionDto
  updateFormData: (data: Partial<CreateCardSectionDto | UpdateCardSectionDto>) => void
  setActiveTab: (tab: string) => void
  isSubmitting: boolean
}

export function MetadataForm({ formData, updateFormData, setActiveTab, isSubmitting }: MetadataFormProps) {
  const [newTag, setNewTag] = useState("")
  const cardCount = formData.cards?.length || 0

  const handleMetadataChange = (path: string, value: any) => {
    const keys = path.split(".")
    const newMetadata = { ...formData.metadata } as CardSectionMetadata

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

    updateFormData({ metadata: newMetadata })
  }

  const handleAddTag = () => {
    if (newTag.trim() && formData.metadata?.tags && !formData.metadata.tags.includes(newTag.trim())) {
      updateFormData({
        metadata: {
          ...formData.metadata!,
          tags: [...(formData.metadata?.tags || []), newTag.trim()],
        },
      })
      setNewTag("")
    }
  }

  const handleRemoveTag = (tag: string) => {
    updateFormData({
      metadata: {
        ...formData.metadata!,
        tags: formData.metadata?.tags?.filter((t) => t !== tag) || [],
      },
    })
  }

  return (
    <TooltipProvider>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card className="border border-border/30 shadow-sm overflow-hidden bg-card">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 pb-3 sm:pb-4 border-b border-border/20 px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl flex items-center gap-1.5 sm:gap-2 text-primary">
              <Tag className="h-4 w-4 sm:h-5 sm:w-5" />
              Metadatos y SEO
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Configure metadatos adicionales y opciones de SEO
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 sm:space-y-8 pt-6 sm:pt-8 px-4 sm:px-6">
            {cardCount === 0 && (
              <Alert variant="destructive" className="mb-4 text-xs sm:text-sm">
                <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <AlertTitle className="text-sm sm:text-base">Atención</AlertTitle>
                <AlertDescription className="text-xs sm:text-sm">
                  Debe añadir al menos una tarjeta antes de guardar la sección. Vaya a la pestaña "Tarjetas" para añadir
                  una.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="metadata.seoTitle"
                  className="text-sm sm:text-base font-medium flex items-center gap-1.5"
                >
                  Título SEO
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>Título optimizado para motores de búsqueda</TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  id="metadata.seoTitle"
                  value={formData.metadata?.seoTitle || ""}
                  onChange={(e) => handleMetadataChange("seoTitle", e.target.value)}
                  placeholder="Título para SEO"
                  className="h-10 sm:h-11 rounded-lg border-input focus-visible:ring-ring/30 transition-all duration-200 text-sm sm:text-base"
                />
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                  Si se deja vacío, se utilizará el título de la sección
                </p>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="metadata.seoDescription"
                  className="text-sm sm:text-base font-medium flex items-center gap-1.5"
                >
                  Descripción SEO
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>Descripción optimizada para motores de búsqueda</TooltipContent>
                  </Tooltip>
                </Label>
                <Textarea
                  id="metadata.seoDescription"
                  value={formData.metadata?.seoDescription || ""}
                  onChange={(e) => handleMetadataChange("seoDescription", e.target.value)}
                  placeholder="Descripción para SEO"
                  rows={3}
                  className="resize-y rounded-lg border-input focus-visible:ring-ring/30 transition-all duration-200 text-sm sm:text-base"
                />
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                  Si se deja vacío, se utilizará la descripción de la sección
                </p>
              </div>
            </div>

            <Separator className="my-4 sm:my-6 bg-border/30" />

            <div className="space-y-4">
              <Label className="text-sm sm:text-base font-medium flex items-center gap-1.5">
                Etiquetas
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>Palabras clave para categorizar esta sección</TooltipContent>
                </Tooltip>
              </Label>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Nueva etiqueta"
                  className="flex-1 h-10 sm:h-11 rounded-lg border-input focus-visible:ring-ring/30 transition-all duration-200 text-sm sm:text-base"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddTag()
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={handleAddTag}
                  className="gap-1 sm:gap-2 bg-primary hover:bg-primary/90 transition-colors duration-200 h-10 sm:h-11 text-xs sm:text-sm"
                >
                  <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>Añadir</span>
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 mt-2 min-h-[100px] p-3 sm:p-4 border rounded-lg bg-muted/5 border-border/30">
                {formData.metadata?.tags && formData.metadata.tags.length > 0 ? (
                  formData.metadata.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-primary/10 text-primary-foreground hover:bg-primary/20 transition-colors"
                    >
                      {tag}
                      <button
                        type="button"
                        className="ml-1 sm:ml-2 text-primary-foreground/70 hover:text-primary-foreground"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      </button>
                    </Badge>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center w-full h-full py-4 sm:py-6">
                    <Tag className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground/30 mb-2" />
                    <p className="text-xs sm:text-sm text-muted-foreground text-center">
                      No hay etiquetas. Añada algunas para categorizar esta sección.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/5 border-t border-border/20 px-4 sm:px-6 py-3 sm:py-4 flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveTab("cards")}
              className="gap-1 sm:gap-2 hover:bg-primary/5 transition-colors duration-200 text-xs sm:text-sm h-9 sm:h-10"
            >
              <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Volver</span>
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || cardCount === 0}
              className={`gap-1 sm:gap-2 ${
                cardCount === 0 ? "bg-muted text-muted-foreground" : "bg-primary hover:bg-primary/90"
              } transition-colors duration-200 text-xs sm:text-sm h-9 sm:h-10`}
              title={cardCount === 0 ? "Debe añadir al menos una tarjeta" : ""}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                  <span className="hidden sm:inline">Guardando...</span>
                  <span className="sm:hidden">Guardando</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Guardar sección</span>
                  <span className="sm:hidden">Guardar</span>
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </TooltipProvider>
  )
}
