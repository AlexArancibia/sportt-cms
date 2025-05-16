"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { motion } from "framer-motion"
import { Info, Sliders, Users, Tag, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useMainStore } from "@/stores/mainStore"

// Define the form schema using zod
const teamMemberSchema = z.object({
  id: z.string().optional(),
  teamSectionId: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  position: z.string().min(1, "Position is required"),
  imageUrl: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  order: z.number().optional(),
  linkedinUrl: z.string().url().optional().nullable(),
  twitterUrl: z.string().url().optional().nullable(),
  facebookUrl: z.string().url().optional().nullable(),
  instagramUrl: z.string().url().optional().nullable(),
  isActive: z.boolean().default(true),
})

const teamSectionSchema = z.object({
  id: z.string().optional(),
  storeId: z.string().min(1, "Store ID is required"),
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  layout: z.enum(["grid", "carousel", "list"]).optional().nullable(),
  backgroundColor: z.string().optional().nullable(),
  textColor: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  position: z.number().optional(),
  styles: z
    .object({
      layout: z.enum(["grid", "carousel", "list"]),
      gridColumns: z
        .object({
          mobile: z.number().min(1).max(4),
          tablet: z.number().min(1).max(6),
          desktop: z.number().min(1).max(12),
        })
        .optional(),
      gap: z.string().optional(),
      padding: z.string().optional(),
      margin: z.string().optional(),
    })
    .optional()
    .nullable(),
  metadata: z
    .object({
      tags: z.array(z.string()).optional(),
      seoTitle: z.string().optional(),
      seoDescription: z.string().optional(),
    })
    .optional()
    .nullable(),
  members: z.array(teamMemberSchema).optional(),
})

type TeamSectionFormValues = z.infer<typeof teamSectionSchema>

interface TeamsFormProps {
  initialData?: any // TeamSection | null
  onSubmit: (data: TeamSectionFormValues) => Promise<void>
  isSubmitting: boolean
  onFormChange?: (data: TeamSectionFormValues) => void
}

const scrollbarHideStyle = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`

export function TeamsForm({ initialData, onSubmit, isSubmitting, onFormChange }: TeamsFormProps) {
  const { currentStore } = useMainStore()
  const [activeTab, setActiveTab] = useState("basic")

  // Initialize form with default values or initial data
  const form = useForm<TeamSectionFormValues>({
    resolver: zodResolver(teamSectionSchema),
    defaultValues: initialData || {
      storeId: currentStore || "",
      title: "",
      subtitle: "",
      description: "",
      layout: "grid",
      backgroundColor: "#ffffff",
      textColor: "#000000",
      isActive: true,
      position: 0,
      styles: {
        layout: "grid",
        gridColumns: {
          mobile: 1,
          tablet: 2,
          desktop: 3,
        },
        gap: "1rem",
        padding: "2rem",
        margin: "0",
      },
      metadata: {
        tags: [],
        seoTitle: "",
        seoDescription: "",
      },
      members: [],
    },
  })

  // Update form when initialData or currentStore changes
  useEffect(() => {
    if (initialData) {
      form.reset(initialData)
    } else if (currentStore && !form.getValues("storeId")) {
      form.setValue("storeId", currentStore)
    }
  }, [initialData, currentStore, form])

  // Notify parent component when form values change
  useEffect(() => {
    // Use a debounced version to prevent too many updates
    const timeoutId = setTimeout(() => {
      if (onFormChange) {
        const currentValues = form.getValues()
        onFormChange(currentValues)
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [form, onFormChange])

  // Add a new empty team member
  const addTeamMember = () => {
    const currentMembers = form.getValues("members") || []
    form.setValue("members", [
      ...currentMembers,
      {
        name: "",
        position: "",
        imageUrl: "",
        bio: "",
        email: "",
        phone: "",
        order: currentMembers.length,
        linkedinUrl: "",
        twitterUrl: "",
        facebookUrl: "",
        instagramUrl: "",
        isActive: true,
      },
    ])
  }

  // Remove a team member at a specific index
  const removeTeamMember = (index: number) => {
    const currentMembers = form.getValues("members") || []
    const updatedMembers = currentMembers.filter((_, i) => i !== index)

    // Update order for remaining members
    const reorderedMembers = updatedMembers.map((member, i) => ({
      ...member,
      order: i,
    }))

    form.setValue("members", reorderedMembers)
  }

  // Handle form submission
  const handleSubmit = async (data: TeamSectionFormValues) => {
    // Ensure storeId is set
    data.storeId = currentStore || ""
    await onSubmit(data)
  }

  const memberCount = form.watch("members")?.length || 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="container max-w-6xl py-6 sm:py-8 px-4 sm:px-6"
    >
      <style jsx global>
        {scrollbarHideStyle}
      </style>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8 max-w-full">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
              <TabsList className="flex w-full sm:w-auto overflow-x-auto scrollbar-hide bg-transparent p-0 rounded-none border-b border-border/30 gap-1 sm:gap-2">
                <TabsTrigger
                  value="basic"
                  className={`group flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 transition-all duration-200 text-sm sm:text-base font-medium relative`}
                >
                  <div
                    className={`p-1.5 rounded-full bg-blue-500/10 group-data-[state=active]:bg-blue-500/20 group-hover:bg-blue-500/15 transition-colors`}
                  >
                    <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                  </div>
                  <span className="hidden sm:inline text-foreground/80 group-hover:text-foreground group-data-[state=active]:text-foreground transition-colors">
                    General
                  </span>
                  <span className="sm:hidden text-foreground/80 group-hover:text-foreground group-data-[state=active]:text-foreground transition-colors">
                    1
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="styling"
                  className={`group flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-violet-500 transition-all duration-200 text-sm sm:text-base font-medium relative`}
                >
                  <div
                    className={`p-1.5 rounded-full bg-violet-500/10 group-data-[state=active]:bg-violet-500/20 group-hover:bg-violet-500/15 transition-colors`}
                  >
                    <Sliders className="h-4 w-4 sm:h-5 sm:w-5 text-violet-500" />
                  </div>
                  <span className="hidden sm:inline text-foreground/80 group-hover:text-foreground group-data-[state=active]:text-foreground transition-colors">
                    Estilos
                  </span>
                  <span className="sm:hidden text-foreground/80 group-hover:text-foreground group-data-[state=active]:text-foreground transition-colors">
                    2
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="members"
                  className={`group flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 transition-all duration-200 text-sm sm:text-base font-medium relative`}
                >
                  <div
                    className={`p-1.5 rounded-full bg-emerald-500/10 group-data-[state=active]:bg-emerald-500/20 group-hover:bg-emerald-500/15 transition-colors relative`}
                  >
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
                    {memberCount > 0 && (
                      <Badge
                        variant="secondary"
                        className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-medium rounded-full bg-emerald-500 text-white border-none"
                      >
                        {memberCount}
                      </Badge>
                    )}
                  </div>
                  <span className="hidden sm:inline text-foreground/80 group-hover:text-foreground group-data-[state=active]:text-foreground transition-colors">
                    Miembros
                  </span>
                  <span className="sm:hidden text-foreground/80 group-hover:text-foreground group-data-[state=active]:text-foreground transition-colors">
                    3
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="seo"
                  className={`group flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 transition-all duration-200 text-sm sm:text-base font-medium relative`}
                >
                  <div
                    className={`p-1.5 rounded-full bg-amber-500/10 group-data-[state=active]:bg-amber-500/20 group-hover:bg-amber-500/15 transition-colors`}
                  >
                    <Tag className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                  </div>
                  <span className="hidden sm:inline text-foreground/80 group-hover:text-foreground group-data-[state=active]:text-foreground transition-colors">
                    Metadatos
                  </span>
                  <span className="sm:hidden text-foreground/80 group-hover:text-foreground group-data-[state=active]:text-foreground transition-colors">
                    4
                  </span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="mt-0 space-y-4">
              <Card className="overflow-hidden border border-border/40 shadow-sm">
                <CardHeader className="p-4 sm:p-6 bg-muted/30">
                  <CardTitle className="text-lg sm:text-xl font-medium">Información Básica</CardTitle>
                  <CardDescription>Ingresa los detalles básicos para tu sección de equipo.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-4 sm:p-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título</FormLabel>
                        <FormControl>
                          <Input placeholder="Ingresa el título de la sección" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="subtitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subtítulo</FormLabel>
                          <FormControl>
                            <Input placeholder="Ingresa el subtítulo (opcional)" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Posición</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Posición de visualización"
                              {...field}
                              onChange={(e) => field.onChange(Number.parseInt(e.target.value) || 0)}
                              value={field.value || 0}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">Orden en que aparece esta sección</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Ingresa la descripción (opcional)"
                            className="min-h-[100px] resize-y"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 sm:p-4 bg-muted/30">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Estado Activo</FormLabel>
                          <FormDescription className="text-xs">
                            Habilita o deshabilita esta sección de equipo en tu sitio.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Hidden storeId field */}
                  <FormField
                    control={form.control}
                    name="storeId"
                    render={({ field }) => <input type="hidden" {...field} value={currentStore || ""} />}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={() => setActiveTab("styling")}
                  className="bg-violet-500 hover:bg-violet-600 text-white"
                >
                  Continuar a Estilos
                </Button>
              </div>
            </TabsContent>

            {/* Styling & Layout Tab */}
            <TabsContent value="styling" className="mt-0 space-y-4">
              <Card className="overflow-hidden border border-border/40 shadow-sm">
                <CardHeader className="p-4 sm:p-6 bg-muted/30">
                  <CardTitle className="text-lg sm:text-xl font-medium">Estilo y Diseño</CardTitle>
                  <CardDescription>Configura la apariencia y el diseño de tu sección de equipo.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-4 sm:p-6">
                  <FormField
                    control={form.control}
                    name="layout"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Diseño</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || "grid"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un diseño" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="grid">Cuadrícula</SelectItem>
                            <SelectItem value="carousel">Carrusel</SelectItem>
                            <SelectItem value="list">Lista</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-xs">
                          Elige cómo se mostrarán los miembros de tu equipo.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="backgroundColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Color de Fondo</FormLabel>
                          <div className="flex items-center gap-2">
                            <FormControl>
                              <Input
                                type="color"
                                className="w-12 h-10 p-1"
                                {...field}
                                value={field.value || "#ffffff"}
                              />
                            </FormControl>
                            <Input
                              type="text"
                              placeholder="#ffffff"
                              value={field.value || "#ffffff"}
                              onChange={field.onChange}
                              className="flex-1"
                            />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="textColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Color de Texto</FormLabel>
                          <div className="flex items-center gap-2">
                            <FormControl>
                              <Input
                                type="color"
                                className="w-12 h-10 p-1"
                                {...field}
                                value={field.value || "#000000"}
                              />
                            </FormControl>
                            <Input
                              type="text"
                              placeholder="#000000"
                              value={field.value || "#000000"}
                              onChange={field.onChange}
                              className="flex-1"
                            />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Configuración de Cuadrícula</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="styles.gridColumns.mobile"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Columnas en Móvil</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                max={4}
                                {...field}
                                onChange={(e) => field.onChange(Number.parseInt(e.target.value) || 1)}
                                value={field.value || 1}
                              />
                            </FormControl>
                            <FormDescription className="text-xs">Dispositivos móviles</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="styles.gridColumns.tablet"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Columnas en Tablet</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                max={6}
                                {...field}
                                onChange={(e) => field.onChange(Number.parseInt(e.target.value) || 2)}
                                value={field.value || 2}
                              />
                            </FormControl>
                            <FormDescription className="text-xs">Dispositivos tablet</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="styles.gridColumns.desktop"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Columnas en Escritorio</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                max={12}
                                {...field}
                                onChange={(e) => field.onChange(Number.parseInt(e.target.value) || 3)}
                                value={field.value || 3}
                              />
                            </FormControl>
                            <FormDescription className="text-xs">Dispositivos de escritorio</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="styles.gap"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Espacio entre elementos</FormLabel>
                            <FormControl>
                              <Input placeholder="1rem" {...field} value={field.value || "1rem"} />
                            </FormControl>
                            <FormDescription className="text-xs">Ej. 1rem, 16px</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="styles.padding"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Relleno</FormLabel>
                            <FormControl>
                              <Input placeholder="2rem" {...field} value={field.value || "2rem"} />
                            </FormControl>
                            <FormDescription className="text-xs">Ej. 2rem, 32px</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="styles.margin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Margen</FormLabel>
                            <FormControl>
                              <Input placeholder="0" {...field} value={field.value || "0"} />
                            </FormControl>
                            <FormDescription className="text-xs">Ej. 0, 1rem 0</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setActiveTab("basic")}>
                  Volver a General
                </Button>
                <Button
                  type="button"
                  onClick={() => setActiveTab("members")}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  Continuar a Miembros
                </Button>
              </div>
            </TabsContent>

            {/* Team Members Tab */}
            <TabsContent value="members" className="mt-0 space-y-4">
              <Card className="overflow-hidden border border-border/40 shadow-sm">
                <CardHeader className="p-4 sm:p-6 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg sm:text-xl font-medium">Miembros del Equipo</CardTitle>
                      <CardDescription>Añade y gestiona los miembros del equipo para esta sección.</CardDescription>
                    </div>
                    <Button
                      type="button"
                      onClick={addTeamMember}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white"
                      size="sm"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Añadir Miembro</span>
                      <span className="sm:hidden">Añadir</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 p-4 sm:p-6">
                  {(form.watch("members") || []).map((_, index) => (
                    <Card key={index} className="mb-4 overflow-hidden border border-border/40">
                      <CardHeader className="p-3 sm:p-4 pb-2 bg-muted/20">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base sm:text-lg">Miembro {index + 1}</CardTitle>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTeamMember(index)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4 p-3 sm:p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`members.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nombre</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ingresa el nombre" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`members.${index}.position`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Cargo</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ingresa el cargo" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name={`members.${index}.imageUrl`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>URL de Imagen</FormLabel>
                              <FormControl>
                                <Input placeholder="Ingresa la URL de la imagen" {...field} value={field.value || ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`members.${index}.bio`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Biografía</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Ingresa la biografía"
                                  className="min-h-[80px] resize-y"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`members.${index}.email`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ingresa el email" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`members.${index}.phone`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Teléfono</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ingresa el teléfono" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <Separator className="my-2" />

                        <h4 className="text-sm font-medium">Enlaces de Redes Sociales</h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`members.${index}.linkedinUrl`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>LinkedIn</FormLabel>
                                <FormControl>
                                  <Input placeholder="URL de LinkedIn" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`members.${index}.twitterUrl`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Twitter</FormLabel>
                                <FormControl>
                                  <Input placeholder="URL de Twitter" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`members.${index}.facebookUrl`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Facebook</FormLabel>
                                <FormControl>
                                  <Input placeholder="URL de Facebook" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`members.${index}.instagramUrl`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Instagram</FormLabel>
                                <FormControl>
                                  <Input placeholder="URL de Instagram" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name={`members.${index}.isActive`}
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 sm:p-4 bg-muted/20">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Estado Activo</FormLabel>
                                <FormDescription className="text-xs">
                                  Habilita o deshabilita este miembro del equipo.
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  ))}

                  {(form.watch("members")?.length || 0) === 0 && (
                    <div className="flex flex-col items-center justify-center p-6 sm:p-8 border border-dashed rounded-lg">
                      <p className="text-muted-foreground mb-4 text-center">
                        Aún no se han añadido miembros del equipo
                      </p>
                      <Button
                        type="button"
                        onClick={addTeamMember}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Añadir Miembro
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setActiveTab("styling")}>
                  Volver a Estilos
                </Button>
                <Button
                  type="button"
                  onClick={() => setActiveTab("seo")}
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                >
                  Continuar a Metadatos
                </Button>
              </div>
            </TabsContent>

            {/* SEO & Metadata Tab */}
            <TabsContent value="seo" className="mt-0 space-y-4">
              <Card className="overflow-hidden border border-border/40 shadow-sm">
                <CardHeader className="p-4 sm:p-6 bg-muted/30">
                  <CardTitle className="text-lg sm:text-xl font-medium">SEO y Metadatos</CardTitle>
                  <CardDescription>Configura ajustes de SEO y metadatos adicionales.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-4 sm:p-6">
                  <FormField
                    control={form.control}
                    name="metadata.seoTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título SEO</FormLabel>
                        <FormControl>
                          <Input placeholder="Ingresa el título SEO" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Si se deja vacío, se utilizará el título de la sección.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="metadata.seoDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción SEO</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Ingresa la descripción SEO"
                            className="min-h-[100px] resize-y"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Una breve descripción para motores de búsqueda.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="metadata.tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Etiquetas</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ingresa etiquetas separadas por comas"
                            value={field.value?.join(", ") || ""}
                            onChange={(e) => {
                              const value = e.target.value
                              field.onChange(
                                value
                                  .split(",")
                                  .map((tag) => tag.trim())
                                  .filter(Boolean),
                              )
                            }}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Las etiquetas ayudan con la categorización y búsqueda.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setActiveTab("members")}>
                  Volver a Miembros
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
                  {isSubmitting ? "Guardando..." : "Guardar Sección"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </form>
      </Form>
    </motion.div>
  )
}
