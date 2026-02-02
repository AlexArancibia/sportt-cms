"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useStores } from "@/hooks/useStores"
import { useTeamSectionById, useTeamSectionMutations } from "@/hooks/useTeamSections"
import { useForm } from "react-hook-form"
import { motion } from "framer-motion"
import { Info, Sliders, Users, Tag, Plus, Trash2, Loader2, ArrowLeft, Save } from "lucide-react"

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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// TypeScript interfaces
interface TeamSectionStyles {
  layout: "grid" | "carousel" | "list"
  gridColumns?: {
    mobile: number
    tablet: number
    desktop: number
  }
  gap?: string
  padding?: string
  margin?: string
}

interface TeamSectionMetadata {
  tags?: string[]
  seoTitle?: string
  seoDescription?: string
}

// Definición de la interfaz para miembros del equipo en el formulario
interface FormTeamMember {
  name: string
  position: string
  imageUrl?: string | null
  bio?: string | null
  email?: string | null
  phone?: string | null
  order: number
  linkedinUrl?: string | null
  twitterUrl?: string | null
  facebookUrl?: string | null
  instagramUrl?: string | null
  isActive: boolean
}

// Definición de la interfaz para la sección de equipo en el formulario
interface FormTeamSection {
  storeId: string
  title: string
  subtitle?: string | null
  description?: string | null
  layout?: string | null
  backgroundColor?: string | null
  textColor?: string | null
  isActive: boolean
  position: number
  styles?: TeamSectionStyles | null
  metadata?: TeamSectionMetadata | null
  members?: FormTeamMember[]
}

// Interfaces para los modelos completos (con propiedades generadas por el servidor)
interface TeamMember extends FormTeamMember {
  id: string
  teamSectionId: string
  createdAt: Date
  updatedAt: Date
}

interface TeamSection extends FormTeamSection {
  id: string
  members?: TeamMember[]
  createdAt: Date
  updatedAt: Date
}

// Interfaces para DTOs
interface UpdateTeamSectionDto {
  title?: string
  subtitle?: string | null
  description?: string | null
  layout?: string | null
  backgroundColor?: string | null
  textColor?: string | null
  position?: number
  styles?: TeamSectionStyles | null
  metadata?: TeamSectionMetadata | null
  isActive?: boolean
  members?: FormTeamMember[]
}

// Tipo para el formulario
type TeamSectionFormValues = FormTeamSection

const scrollbarHideStyle = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`

export default function EditTeamSectionPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { currentStoreId } = useStores()
  const currentStore = currentStoreId ?? null
  const teamSectionId = params.id as string
  const { data: teamSectionData, isLoading, isError, error: queryError, refetch } = useTeamSectionById(teamSectionId)
  const { updateTeamSection, isUpdating } = useTeamSectionMutations(currentStore)

  const [teamSection, setTeamSection] = useState<TeamSection | null>(null)
  const [activeTab, setActiveTab] = useState("basic")
  const [error, setError] = useState<string | null>(null)
  const isSubmitting = isUpdating

  const form = useForm<TeamSectionFormValues>({
    defaultValues: {
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

  useEffect(() => {
    if (teamSectionData) {
      setTeamSection(teamSectionData)
      setError(null)
      form.reset(teamSectionData)
    }
  }, [teamSectionData, form])

  useEffect(() => {
    if (currentStore && !form.getValues("storeId")) {
      form.setValue("storeId", currentStore)
    }
  }, [currentStore, form])

  useEffect(() => {
    if (isError && queryError) {
      setError(
        (queryError as Error)?.message ?? "Error al cargar los datos de la sección"
      )
    }
  }, [isError, queryError])

  // Modifica la función addTeamMember para usar el tipo correcto
  const addTeamMember = () => {
    const currentMembers = form.getValues("members") || []
    const newMember: FormTeamMember = {
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
    }

    form.setValue("members", [...currentMembers, newMember])
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

  // Validate form data
  const validateFormData = (data: TeamSectionFormValues): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {}

    // Basic validation
    if (!data.title) {
      errors.title = "El título es obligatorio"
    }

    if (!data.storeId) {
      errors.storeId = "El ID de la tienda es obligatorio"
    }

    // Validate members if they exist
    if (data.members && data.members.length > 0) {
      data.members.forEach((member, index) => {
        if (!member.name) {
          errors[`members.${index}.name`] = "El nombre es obligatorio"
        }
        if (!member.position) {
          errors[`members.${index}.position`] = "El cargo es obligatorio"
        }
        if (member.email && !/^\S+@\S+\.\S+$/.test(member.email)) {
          errors[`members.${index}.email`] = "El email no es válido"
        }
        if (member.linkedinUrl && !/^https?:\/\//.test(member.linkedinUrl)) {
          errors[`members.${index}.linkedinUrl`] = "La URL debe comenzar con http:// o https://"
        }
        if (member.twitterUrl && !/^https?:\/\//.test(member.twitterUrl)) {
          errors[`members.${index}.twitterUrl`] = "La URL debe comenzar con http:// o https://"
        }
        if (member.facebookUrl && !/^https?:\/\//.test(member.facebookUrl)) {
          errors[`members.${index}.facebookUrl`] = "La URL debe comenzar con http:// o https://"
        }
        if (member.instagramUrl && !/^https?:\/\//.test(member.instagramUrl)) {
          errors[`members.${index}.instagramUrl`] = "La URL debe comenzar con http:// o https://"
        }
      })
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    }
  }

  // Modificar la función handleSubmit para formatear correctamente los miembros del equipo
  const handleSubmit = async (data: TeamSectionFormValues) => {
    // Ensure we have a currentStore
    if (!currentStore) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No hay tienda seleccionada. Por favor, seleccione una tienda primero.",
      })
      return
    }

    // Ensure storeId is set to currentStore
    data.storeId = currentStore

    // Verify that there is at least one member
    if (!data.members || data.members.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debe añadir al menos un miembro antes de guardar la sección",
      })
      return
    }

    // Validate form data
    const { isValid, errors } = validateFormData(data)

    if (!isValid) {
      // Set errors in the form
      Object.entries(errors).forEach(([field, message]) => {
        form.setError(field as any, { type: "manual", message })
      })

      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "Por favor, corrija los errores en el formulario",
      })
      return
    }

    try {
      const formattedMembers = data.members?.map((member) => ({
        name: member.name,
        position: member.position,
        bio: member.bio || null,
        imageUrl: member.imageUrl || null,
        email: member.email || null,
        phone: member.phone || null,
        order: member.order || 0,
        linkedinUrl: member.linkedinUrl || null,
        twitterUrl: member.twitterUrl || null,
        facebookUrl: member.facebookUrl || null,
        instagramUrl: member.instagramUrl || null,
        isActive: member.isActive !== undefined ? member.isActive : true,
      }))

      const updateData: UpdateTeamSectionDto = {
        title: data.title,
        subtitle: data.subtitle,
        description: data.description,
        layout: data.layout,
        backgroundColor: data.backgroundColor,
        textColor: data.textColor,
        position: data.position,
        styles: data.styles,
        metadata: data.metadata,
        isActive: data.isActive,
        members: formattedMembers,
      }

      await updateTeamSection({ id: teamSectionId, data: updateData })
      toast({
        title: "Sección actualizada",
        description: "La sección de equipo ha sido actualizada correctamente",
      })
      router.push("/teams")
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido"
      toast({
        variant: "destructive",
        title: "Error",
        description: `Ocurrió un error al actualizar la sección: ${message}`,
      })
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Cargando datos de la sección...</p>
      </div>
    )
  }

  // Show no store selected state
  if (!currentStore) {
    return (
      <Alert variant="warning" className="m-6">
        <AlertTitle>Tienda no seleccionada</AlertTitle>
        <AlertDescription>Debe seleccionar una tienda antes de poder editar una sección de equipo.</AlertDescription>
        <div className="mt-4">
          <Button variant="outline" onClick={() => router.push("/teams")}>
            Volver a la lista de secciones
          </Button>
        </div>
      </Alert>
    )
  }

  // Show error state
  if (error) {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" onClick={() => router.push("/teams")}>
            Volver a la lista de secciones
          </Button>
          <Button variant="default" onClick={() => void refetch()}>
            Reintentar
          </Button>
        </div>
      </Alert>
    )
  }

  // Show not found state
  if (!teamSection) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">No se encontró la sección de equipo</p>
        <Button variant="outline" onClick={() => router.push("/teams")} className="mt-4">
          Volver a la lista de secciones
        </Button>
      </div>
    )
  }

  // Calculate member count for display
  const memberCount = form.watch("members")?.length || 0

  return (
    <div className="flex flex-col w-full max-w-full overflow-hidden">
      {/* Header Component (inline implementation of TeamsHeader) */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-10 py-2 sm:py-3 px-4 sm:px-6 border-b backdrop-blur-md bg-background/90 flex justify-between items-center transition-all duration-200 w-full max-w-full shadow-sm"
      >
        <div className="flex gap-2 sm:gap-3 items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/teams")}
            className="h-8 w-8 sm:h-9 sm:w-9 rounded-full hover:bg-muted transition-colors duration-200 flex-shrink-0"
            aria-label="Volver"
          >
            <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
          <div className="overflow-hidden">
            <h2 className="font-medium tracking-tight text-base sm:text-lg truncate max-w-[150px] sm:max-w-[300px] md:max-w-none">
              Editar Sección de Equipo
            </h2>
            <p className="text-xs text-muted-foreground hidden sm:block truncate max-w-[200px] md:max-w-none">
              Configura todos los detalles de tu sección de equipo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
              <span className={`${memberCount === 0 ? "text-destructive" : "text-primary"}`}>
                {memberCount} {memberCount === 1 ? "miembro" : "miembros"}
              </span>
            </div>
            <Button
              type="button"
              onClick={() => form.handleSubmit(handleSubmit)()}
              disabled={isSubmitting}
              size="sm"
              className="gap-1 sm:gap-1.5 bg-primary hover:bg-primary/90 transition-colors duration-200 shadow-sm hover:shadow text-xs sm:text-sm h-8 px-2 sm:px-3"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" />
                  <span className="hidden sm:inline">Guardando...</span>
                  <span className="sm:hidden">Guardando</span>
                </>
              ) : (
                <>
                  <Save className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span>Guardar</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Form Component (inline implementation of TeamsForm) */}
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
                              <Input
                                placeholder="Ingresa el subtítulo (opcional)"
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
                                  <Input
                                    placeholder="Ingresa la URL de la imagen"
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
                  <Button
                    type="button"
                    onClick={() => form.handleSubmit(handleSubmit)()}
                    disabled={isSubmitting}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isSubmitting ? "Guardando..." : "Guardar Sección"}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </form>
        </Form>
      </motion.div>
    </div>
  )
}
