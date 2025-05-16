"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { ArrowLeft, ChevronRight, Grid3X3, Info, Layers, Sliders } from "lucide-react"
import type { CardSectionStyles, CreateCardSectionDto, UpdateCardSectionDto } from "@/types/card"

interface StylesFormProps {
  formData: CreateCardSectionDto | UpdateCardSectionDto
  updateFormData: (data: Partial<CreateCardSectionDto | UpdateCardSectionDto>) => void
  setActiveTab: (tab: string) => void
}

export function StylesForm({ formData, updateFormData, setActiveTab }: StylesFormProps) {
  const handleStylesChange = (path: string, value: any) => {
    const keys = path.split(".")
    const newStyles = { ...formData.styles } as CardSectionStyles

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

    updateFormData({ styles: newStyles })
  }

  return (
    <TooltipProvider>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card className="border border-border/30 shadow-sm overflow-hidden bg-card">
          <CardHeader className="bg-gradient-to-r from-secondary/10 to-secondary/5 dark:from-secondary/20 dark:to-secondary/10 pb-3 sm:pb-4 border-b border-border/20 px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl flex items-center gap-1.5 sm:gap-2 text-secondary-foreground">
              <Sliders className="h-4 w-4 sm:h-5 sm:w-5" />
              Estilos y Diseño
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Configure los estilos visuales y el diseño de la sección
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 sm:space-y-8 pt-6 sm:pt-8 px-4 sm:px-6">
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center gap-1.5 sm:gap-2 pb-1 sm:pb-2 border-b border-border/20">
                <Grid3X3 className="h-4 w-4 sm:h-5 sm:w-5 text-secondary" />
                <h3 className="text-base sm:text-lg font-medium text-secondary-foreground">
                  Configuración de Cuadrícula
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label
                    htmlFor="gridColumns.mobile"
                    className="text-sm sm:text-base font-medium flex items-center gap-1.5"
                  >
                    Columnas (Móvil)
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>Número de columnas en dispositivos móviles</TooltipContent>
                    </Tooltip>
                  </Label>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Input
                      id="gridColumns.mobile"
                      type="number"
                      value={(formData.styles?.gridColumns?.mobile || 1).toString()}
                      onChange={(e) => handleStylesChange("gridColumns.mobile", Number.parseInt(e.target.value))}
                      min={1}
                      max={4}
                      className="h-9 sm:h-11 rounded-lg border-input focus-visible:ring-ring/30 transition-all duration-200 text-xs sm:text-sm"
                    />
                    <div className="flex-shrink-0 w-12 sm:w-16 h-9 sm:h-11 border rounded-lg flex items-center justify-center bg-secondary/5">
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
                          <div key={i} className="bg-secondary/40 h-5 sm:h-6 rounded-sm"></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label
                    htmlFor="gridColumns.tablet"
                    className="text-sm sm:text-base font-medium flex items-center gap-1.5"
                  >
                    Columnas (Tablet)
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>Número de columnas en tablets</TooltipContent>
                    </Tooltip>
                  </Label>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Input
                      id="gridColumns.tablet"
                      type="number"
                      value={(formData.styles?.gridColumns?.tablet || 2).toString()}
                      onChange={(e) => handleStylesChange("gridColumns.tablet", Number.parseInt(e.target.value))}
                      min={1}
                      max={6}
                      className="h-9 sm:h-11 rounded-lg border-input focus-visible:ring-ring/30 transition-all duration-200 text-xs sm:text-sm"
                    />
                    <div className="flex-shrink-0 w-12 sm:w-16 h-9 sm:h-11 border rounded-lg flex items-center justify-center bg-secondary/5">
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
                          <div key={i} className="bg-secondary/40 h-5 sm:h-6 rounded-sm"></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label
                    htmlFor="gridColumns.desktop"
                    className="text-sm sm:text-base font-medium flex items-center gap-1.5"
                  >
                    Columnas (Escritorio)
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>Número de columnas en escritorio</TooltipContent>
                    </Tooltip>
                  </Label>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Input
                      id="gridColumns.desktop"
                      type="number"
                      value={(formData.styles?.gridColumns?.desktop || 3).toString()}
                      onChange={(e) => handleStylesChange("gridColumns.desktop", Number.parseInt(e.target.value))}
                      min={1}
                      max={12}
                      className="h-9 sm:h-11 rounded-lg border-input focus-visible:ring-ring/30 transition-all duration-200 text-xs sm:text-sm"
                    />
                    <div className="flex-shrink-0 w-12 sm:w-16 h-9 sm:h-11 border rounded-lg flex items-center justify-center bg-secondary/5">
                      <div
                        className="grid"
                        style={{
                          gridTemplateColumns: `repeat(${Math.min(
                            formData.styles?.gridColumns?.desktop || 3,
                            6,
                          )}, 1fr)`,
                          gap: "2px",
                          width: "100%",
                          padding: "0 4px",
                        }}
                      >
                        {Array.from({
                          length: Math.min(formData.styles?.gridColumns?.desktop || 3, 6),
                        }).map((_, i) => (
                          <div key={i} className="bg-secondary/40 h-5 sm:h-6 rounded-sm"></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-4 sm:my-6 bg-border/30" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="styles.gap" className="text-sm sm:text-base font-medium flex items-center gap-1.5">
                  Espacio entre elementos
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>Espacio entre las tarjetas (ej: 1rem, 10px)</TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  id="styles.gap"
                  value={formData.styles?.gap || "1rem"}
                  onChange={(e) => handleStylesChange("gap", e.target.value)}
                  placeholder="1rem"
                  className="h-9 sm:h-11 rounded-lg border-input focus-visible:ring-ring/30 transition-all duration-200 text-xs sm:text-sm"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="styles.padding" className="text-sm sm:text-base font-medium flex items-center gap-1.5">
                  Relleno interno
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>Espacio interno de la sección (ej: 1rem, 10px)</TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  id="styles.padding"
                  value={formData.styles?.padding || "1rem"}
                  onChange={(e) => handleStylesChange("padding", e.target.value)}
                  placeholder="1rem"
                  className="h-9 sm:h-11 rounded-lg border-input focus-visible:ring-ring/30 transition-all duration-200 text-xs sm:text-sm"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="styles.margin" className="text-sm sm:text-base font-medium flex items-center gap-1.5">
                  Margen externo
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>Espacio externo de la sección (ej: 1rem, 10px)</TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  id="styles.margin"
                  value={formData.styles?.margin || "0"}
                  onChange={(e) => handleStylesChange("margin", e.target.value)}
                  placeholder="0"
                  className="h-9 sm:h-11 rounded-lg border-input focus-visible:ring-ring/30 transition-all duration-200 text-xs sm:text-sm"
                />
              </div>
            </div>

            {formData.layout === "carousel" && (
              <>
                <Separator className="my-4 sm:my-6 bg-border/30" />
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-center gap-1.5 sm:gap-2 pb-1 sm:pb-2 border-b border-border/20">
                    <Layers className="h-4 w-4 sm:h-5 sm:w-5 text-secondary" />
                    <h3 className="text-base sm:text-lg font-medium text-secondary-foreground">Opciones de Carrusel</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label
                        htmlFor="carouselOptions.autoplay"
                        className="mb-1 sm:mb-2 text-sm sm:text-base font-medium flex items-center gap-1.5"
                      >
                        Reproducción automática
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>Avanza automáticamente las diapositivas</TooltipContent>
                        </Tooltip>
                      </Label>
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <Switch
                          id="carouselOptions.autoplay"
                          checked={formData.styles?.carouselOptions?.autoplay}
                          onCheckedChange={(checked) => handleStylesChange("carouselOptions.autoplay", checked)}
                          className="data-[state=checked]:bg-secondary"
                        />
                        <Label htmlFor="carouselOptions.autoplay" className="cursor-pointer">
                          {formData.styles?.carouselOptions?.autoplay ? (
                            <Badge
                              variant="outline"
                              className="bg-secondary/10 text-secondary border-secondary/20 text-xs"
                            >
                              Activado
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-muted/30 text-muted-foreground border-muted text-xs">
                              Desactivado
                            </Badge>
                          )}
                        </Label>
                      </div>
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label
                        htmlFor="carouselOptions.loop"
                        className="mb-1 sm:mb-2 text-sm sm:text-base font-medium flex items-center gap-1.5"
                      >
                        Bucle infinito
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>Vuelve al inicio al llegar al final</TooltipContent>
                        </Tooltip>
                      </Label>
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <Switch
                          id="carouselOptions.loop"
                          checked={formData.styles?.carouselOptions?.loop}
                          onCheckedChange={(checked) => handleStylesChange("carouselOptions.loop", checked)}
                          className="data-[state=checked]:bg-secondary"
                        />
                        <Label htmlFor="carouselOptions.loop" className="cursor-pointer">
                          {formData.styles?.carouselOptions?.loop ? (
                            <Badge
                              variant="outline"
                              className="bg-secondary/10 text-secondary border-secondary/20 text-xs"
                            >
                              Activado
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-muted/30 text-muted-foreground border-muted text-xs">
                              Desactivado
                            </Badge>
                          )}
                        </Label>
                      </div>
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label
                        htmlFor="carouselOptions.arrows"
                        className="mb-1 sm:mb-2 text-sm sm:text-base font-medium flex items-center gap-1.5"
                      >
                        Mostrar flechas
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>Muestra flechas de navegación</TooltipContent>
                        </Tooltip>
                      </Label>
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <Switch
                          id="carouselOptions.arrows"
                          checked={formData.styles?.carouselOptions?.arrows}
                          onCheckedChange={(checked) => handleStylesChange("carouselOptions.arrows", checked)}
                          className="data-[state=checked]:bg-secondary"
                        />
                        <Label htmlFor="carouselOptions.arrows" className="cursor-pointer">
                          {formData.styles?.carouselOptions?.arrows ? (
                            <Badge
                              variant="outline"
                              className="bg-secondary/10 text-secondary border-secondary/20 text-xs"
                            >
                              Activado
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-muted/30 text-muted-foreground border-muted text-xs">
                              Desactivado
                            </Badge>
                          )}
                        </Label>
                      </div>
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label
                        htmlFor="carouselOptions.dots"
                        className="mb-1 sm:mb-2 text-sm sm:text-base font-medium flex items-center gap-1.5"
                      >
                        Mostrar indicadores
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>Muestra puntos de navegación</TooltipContent>
                        </Tooltip>
                      </Label>
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <Switch
                          id="carouselOptions.dots"
                          checked={formData.styles?.carouselOptions?.dots}
                          onCheckedChange={(checked) => handleStylesChange("carouselOptions.dots", checked)}
                          className="data-[state=checked]:bg-secondary"
                        />
                        <Label htmlFor="carouselOptions.dots" className="cursor-pointer">
                          {formData.styles?.carouselOptions?.dots ? (
                            <Badge
                              variant="outline"
                              className="bg-secondary/10 text-secondary border-secondary/20 text-xs"
                            >
                              Activado
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-muted/30 text-muted-foreground border-muted text-xs">
                              Desactivado
                            </Badge>
                          )}
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="bg-muted/5 border-t border-border/20 px-4 sm:px-6 py-3 sm:py-4 flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveTab("general")}
              className="gap-1 sm:gap-2 hover:bg-primary/5 transition-colors duration-200 text-xs sm:text-sm h-9 sm:h-10"
            >
              <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Volver</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveTab("cards")}
              className="gap-1 sm:gap-2 hover:bg-primary/5 transition-colors duration-200 text-xs sm:text-sm h-9 sm:h-10"
            >
              <span>Siguiente</span>
              <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </TooltipProvider>
  )
}
