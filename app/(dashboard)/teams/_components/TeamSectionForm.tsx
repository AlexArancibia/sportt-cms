"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useMainStore } from "@/stores/mainStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ColorPicker } from "@/components/ui/color-picker"
import { JsonPreviewDialog } from "@/components/json-preview-dialog"
import { Loader2, Save, Users, Palette, LayoutGrid, Tag } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { CreateTeamSectionDto, TeamSection, TeamSectionMetadata, TeamSectionStyles, UpdateTeamSectionDto } from "@/types/team"
 

interface TeamSectionFormProps {
  teamSectionId?: string
  initialData?: TeamSection
}

export function TeamSectionForm({ teamSectionId, initialData }: TeamSectionFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { createTeamSection, updateTeamSection, currentStore } = useMainStore()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("general")
  const [newTag, setNewTag] = useState("")

  const [formData, setFormData] = useState<CreateTeamSectionDto | UpdateTeamSectionDto>({
    title: "",
    subtitle: "",
    description: "",
    layout: "grid",
    backgroundColor: "#ffffff",
    textColor: "#000000",
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
    },
    metadata: {
      tags: [],
      seoTitle: "",
      seoDescription: "",
    },
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
        },
        metadata: initialData.metadata || {
          tags: [],
          seoTitle: "",
          seoDescription: "",
        },
      })
    }
  }, [initialData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
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
      const newStyles = { ...prev.styles } as TeamSectionStyles

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
      const newMetadata = { ...prev.metadata } as TeamSectionMetadata

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
      if (teamSectionId) {
        // Actualizar sección existente
        await updateTeamSection(teamSectionId, formData as UpdateTeamSectionDto)
        toast({
          title: "Sección actualizada",
          description: "La sección de equipo ha sido actualizada correctamente",
        })
      } else {
        // Crear nueva sección
        await createTeamSection({
          ...formData,
          storeId: currentStore!,
        } as CreateTeamSectionDto)
        toast({
          title: "Sección creada",
          description: "La sección de equipo ha sido creada correctamente",
        })
      }

      router.push("/team-sections")
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
  const jsonData = teamSectionId ? { ...formData } : { ...formData, storeId: currentStore }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 w-full md:w-auto">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">General</span>
              </TabsTrigger>
              <TabsTrigger value="styles" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline">Estilos</span>
              </TabsTrigger>
              <TabsTrigger value="metadata" className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                <span className="hidden sm:inline">Metadatos</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <JsonPreviewDialog title="Datos de la sección de equipo" data={jsonData} className="ml-2" />
        </div>

        <TabsContent value="general" className="mt-0">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Información General
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">
                      Título <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="Título de la sección"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subtitle">Subtítulo</Label>
                    <Input
                      id="subtitle"
                      name="subtitle"
                      value={formData.subtitle || ""}
                      onChange={handleChange}
                      placeholder="Subtítulo de la sección"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description || ""}
                    onChange={handleChange}
                    placeholder="Descripción de la sección"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="layout">Diseño</Label>
                    <Select
                      value={formData.layout as string}
                      onValueChange={(value) => handleSelectChange("layout", value)}
                    >
                      <SelectTrigger id="layout">
                        <SelectValue placeholder="Seleccionar diseño" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grid">Cuadrícula</SelectItem>
                        <SelectItem value="carousel">Carrusel</SelectItem>
                        <SelectItem value="list">Lista</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Posición</Label>
                    <Input
                      id="position"
                      name="position"
                      type="number"
                      value={formData.position}
                      onChange={handleChange}
                      min={0}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="isActive" className="block mb-2">
                      Estado
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked) => handleSwitchChange("isActive", checked)}
                      />
                      <Label htmlFor="isActive" className="cursor-pointer">
                        {formData.isActive ? "Activo" : "Inactivo"}
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="backgroundColor">Color de fondo</Label>
                    <ColorPicker
                      value={formData.backgroundColor as string}
                      onChange={(value) => handleColorChange("backgroundColor", value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="textColor">Color de texto</Label>
                    <ColorPicker
                      value={formData.textColor as string}
                      onChange={(value) => handleColorChange("textColor", value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="styles" className="mt-0">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  Estilos y Diseño
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-medium">Configuración de Cuadrícula</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="gridColumns.mobile">Columnas (Móvil)</Label>
                      <Input
                        id="gridColumns.mobile"
                        type="number"
                        value={(formData.styles?.gridColumns?.mobile || 1).toString()}
                        onChange={(e) => handleStylesChange("gridColumns.mobile", Number.parseInt(e.target.value))}
                        min={1}
                        max={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gridColumns.tablet">Columnas (Tablet)</Label>
                      <Input
                        id="gridColumns.tablet"
                        type="number"
                        value={(formData.styles?.gridColumns?.tablet || 2).toString()}
                        onChange={(e) => handleStylesChange("gridColumns.tablet", Number.parseInt(e.target.value))}
                        min={1}
                        max={6}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gridColumns.desktop">Columnas (Escritorio)</Label>
                      <Input
                        id="gridColumns.desktop"
                        type="number"
                        value={(formData.styles?.gridColumns?.desktop || 3).toString()}
                        onChange={(e) => handleStylesChange("gridColumns.desktop", Number.parseInt(e.target.value))}
                        min={1}
                        max={12}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="styles.gap">Espacio entre elementos</Label>
                    <Input
                      id="styles.gap"
                      value={formData.styles?.gap || "1rem"}
                      onChange={(e) => handleStylesChange("gap", e.target.value)}
                      placeholder="1rem"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="styles.padding">Relleno interno</Label>
                    <Input
                      id="styles.padding"
                      value={formData.styles?.padding || "1rem"}
                      onChange={(e) => handleStylesChange("padding", e.target.value)}
                      placeholder="1rem"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="styles.margin">Margen externo</Label>
                    <Input
                      id="styles.margin"
                      value={formData.styles?.margin || "0"}
                      onChange={(e) => handleStylesChange("margin", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="metadata" className="mt-0">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Tag className="h-5 w-5 text-primary" />
                  Metadatos y SEO
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="metadata.seoTitle">Título SEO</Label>
                    <Input
                      id="metadata.seoTitle"
                      value={formData.metadata?.seoTitle || ""}
                      onChange={(e) => handleMetadataChange("seoTitle", e.target.value)}
                      placeholder="Título para SEO"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="metadata.seoDescription">Descripción SEO</Label>
                    <Textarea
                      id="metadata.seoDescription"
                      value={formData.metadata?.seoDescription || ""}
                      onChange={(e) => handleMetadataChange("seoDescription", e.target.value)}
                      placeholder="Descripción para SEO"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Etiquetas</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Nueva etiqueta"
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleAddTag()
                        }
                      }}
                    />
                    <Button type="button" onClick={handleAddTag}>
                      Añadir
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.metadata?.tags && formData.metadata.tags.length > 0 ? (
                      formData.metadata.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="px-3 py-1">
                          {tag}
                          <button
                            type="button"
                            className="ml-2 text-muted-foreground hover:text-foreground"
                            onClick={() => handleRemoveTag(tag)}
                          >
                            &times;
                          </button>
                        </Badge>
                      ))
                    ) : (
                      <p className="text-muted-foreground">
                        No hay etiquetas. Añada algunas para categorizar esta sección.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.push("/team-sections")} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {teamSectionId ? "Actualizando..." : "Guardando..."}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {teamSectionId ? "Actualizar sección" : "Guardar sección"}
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}
