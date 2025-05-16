"use client"

import type React from "react"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { ColorPicker } from "@/components/ui/color-picker"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, Grid3X3, Info, Layers, LayoutGrid, LayoutTemplate } from "lucide-react"
import type { CreateCardSectionDto, UpdateCardSectionDto } from "@/types/card"

interface GeneralFormProps {
  formData: CreateCardSectionDto | UpdateCardSectionDto
  updateFormData: (data: Partial<CreateCardSectionDto | UpdateCardSectionDto>) => void
  setActiveTab: (tab: string) => void
}

export function GeneralForm({ formData, updateFormData, setActiveTab }: GeneralFormProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    updateFormData({ [name]: value })
  }

  const handleNumberChange = (name: string, value: string) => {
    updateFormData({ [name]: value === "" ? null : Number.parseInt(value) })
  }

  const handleSelectChange = (name: string, value: string) => {
    updateFormData({ [name]: value })
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    updateFormData({ [name]: checked })
  }

  const handleColorChange = (name: string, value: string) => {
    updateFormData({ [name]: value })
  }

  return (
    <TooltipProvider>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card className="border border-border/30 shadow-sm overflow-hidden bg-card">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 pb-3 sm:pb-4 border-b border-border/20 px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl flex items-center gap-1.5 sm:gap-2 text-primary">
              <Info className="h-4 w-4 sm:h-5 sm:w-5" />
              Información General
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Configure la información básica de la sección de tarjetas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 sm:space-y-8 pt-6 sm:pt-8 px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm sm:text-base font-medium flex items-center gap-1.5">
                  Título
                  <span className="text-destructive">*</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>El título principal de la sección</TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Título de la sección"
                  required
                  className="h-10 sm:h-11 rounded-lg border-input focus-visible:ring-ring/30 transition-all duration-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtitle" className="text-sm sm:text-base font-medium flex items-center gap-1.5">
                  Subtítulo
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>Un texto secundario que complementa al título</TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  id="subtitle"
                  name="subtitle"
                  value={formData.subtitle || ""}
                  onChange={handleChange}
                  placeholder="Subtítulo de la sección"
                  className="h-10 sm:h-11 rounded-lg border-input focus-visible:ring-ring/30 transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm sm:text-base font-medium flex items-center gap-1.5">
                Descripción
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>Una descripción detallada de la sección</TooltipContent>
                </Tooltip>
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description || ""}
                onChange={handleChange}
                placeholder="Descripción de la sección"
                rows={3}
                className="resize-y rounded-lg border-input focus-visible:ring-ring/30 transition-all duration-200 text-sm sm:text-base"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              <div className="space-y-2">
                <Label htmlFor="layout" className="text-sm sm:text-base font-medium flex items-center gap-1.5">
                  Diseño
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>El tipo de diseño para mostrar las tarjetas</TooltipContent>
                  </Tooltip>
                </Label>
                <Select
                  value={formData.layout as string}
                  onValueChange={(value) => handleSelectChange("layout", value)}
                >
                  <SelectTrigger
                    id="layout"
                    className="h-10 sm:h-11 rounded-lg border-input focus-visible:ring-ring/30 transition-all duration-200"
                  >
                    <SelectValue placeholder="Seleccionar diseño" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">
                      <div className="flex items-center gap-2">
                        <Grid3X3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span>Cuadrícula</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="carousel">
                      <div className="flex items-center gap-2">
                        <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span>Carrusel</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="masonry">
                      <div className="flex items-center gap-2">
                        <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span>Mosaico</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="flex">
                      <div className="flex items-center gap-2">
                        <LayoutTemplate className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span>Flexible</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxCards" className="text-sm sm:text-base font-medium flex items-center gap-1.5">
                  Máximo de tarjetas
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>Número máximo de tarjetas a mostrar</TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  id="maxCards"
                  type="number"
                  value={formData.maxCards?.toString() || ""}
                  onChange={(e) => handleNumberChange("maxCards", e.target.value)}
                  min={0}
                  placeholder="Sin límite"
                  className="h-10 sm:h-11 rounded-lg border-input focus-visible:ring-ring/30 transition-all duration-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position" className="text-sm sm:text-base font-medium flex items-center gap-1.5">
                  Posición
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>Orden de aparición de esta sección</TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  id="position"
                  name="position"
                  type="number"
                  value={formData.position}
                  onChange={handleChange}
                  min={0}
                  className="h-10 sm:h-11 rounded-lg border-input focus-visible:ring-ring/30 transition-all duration-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              <div className="space-y-2">
                <Label htmlFor="backgroundColor" className="text-sm sm:text-base font-medium flex items-center gap-1.5">
                  Color de fondo
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>Color de fondo de la sección</TooltipContent>
                  </Tooltip>
                </Label>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg border shadow-sm"
                    style={{ backgroundColor: formData.backgroundColor as string }}
                  />
                  <ColorPicker
                    value={formData.backgroundColor as string}
                    onChange={(value) => handleColorChange("backgroundColor", value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="textColor" className="text-sm sm:text-base font-medium flex items-center gap-1.5">
                  Color de texto
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>Color del texto en la sección</TooltipContent>
                  </Tooltip>
                </Label>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg border shadow-sm flex items-center justify-center"
                    style={{ backgroundColor: formData.backgroundColor as string }}
                  >
                    <span style={{ color: formData.textColor as string, fontWeight: "bold" }}>T</span>
                  </div>
                  <ColorPicker
                    value={formData.textColor as string}
                    onChange={(value) => handleColorChange("textColor", value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="isActive" className="mb-2 text-sm sm:text-base font-medium flex items-center gap-1.5">
                  Estado
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>Activa o desactiva la sección</TooltipContent>
                  </Tooltip>
                </Label>
                <div className="flex items-center space-x-3">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleSwitchChange("isActive", checked)}
                    className="data-[state=checked]:bg-success"
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">
                    {formData.isActive ? (
                      <Badge
                        variant="outline"
                        className="bg-success/10 text-success border-success/20 text-xs sm:text-sm"
                      >
                        Activo
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-muted/30 text-muted-foreground border-muted text-xs sm:text-sm"
                      >
                        Inactivo
                      </Badge>
                    )}
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/5 border-t border-border/20 px-4 sm:px-6 py-3 sm:py-4 flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveTab("styles")}
              className="gap-1 sm:gap-2 hover:bg-primary/5 transition-colors duration-200 text-xs sm:text-sm h-9 sm:h-10"
            >
              Siguiente: Estilos
              <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </TooltipProvider>
  )
}
