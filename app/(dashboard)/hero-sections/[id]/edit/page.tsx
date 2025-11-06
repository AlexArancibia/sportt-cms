"use client"

import { cn } from "@/lib/utils"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
// Primero, agregar los iconos Tags y X a las importaciones de lucide-react
import {
  ArrowLeft,
  Save,
  Upload,
  Smartphone,
  Monitor,
  Tablet,
  ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  Type,
  Layout,
  ImageIcon as ImageLucide,
  Settings,
  Layers,
  LayoutGrid,
  Trash2,
  ChevronDown,
  Video,
  Tags,
  X,
} from "lucide-react"
import Link from "next/link"
import { useMainStore } from "@/stores/mainStore"
import Image from "next/image"
import { uploadImageToR2 } from "@/lib/imageUpload"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { use } from "react"

// Importar el componente Checkbox
import { Checkbox } from "@/components/ui/checkbox"
import { UpdateHeroSectionDto } from "@/types/heroSection"
import { HeroSectionPreview } from "../../new/_components/heroSectionPreview"
import { SimpleRichTextEditor } from "@/components/SimpleRichTextEditor"

// Cambiar la declaración de la función para usar el formato correcto de parámetros
export default function EditHeroSectionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const id = resolvedParams?.id as string

  // Reemplazar la línea anterior que usaba unwrappedParams
  // const { id } = unwrappedParams

  interface EditHeroSectionPageProps {
    params: {
      id: string
    }
  }

  // Añadir estas funciones de utilidad al principio del componente, justo después de las declaraciones de estado
  // Funciones de utilidad para convertir entre hex y rgba
  // Corregir la función rgbaToHex para que maneje correctamente los valores de color
  const rgbaToHex = (rgba: string): string => {
    // Extraer los valores RGBA
    const match = rgba.match(/rgba?$$\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d+(?:\.\d+)?))?\s*$$/)
    if (!match) return "#000000"

    const r = Number.parseInt(match[1], 10)
    const g = Number.parseInt(match[2], 10)
    const b = Number.parseInt(match[3], 10)

    // Convertir a hex
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
  }

  // Corregir la función hexToRgba para asegurar que genera un formato RGBA válido
  const hexToRgba = (hex: string, opacity: number): string => {
    // Eliminar el # si existe
    hex = hex.replace("#", "")

    // Convertir a valores RGB
    const r = Number.parseInt(hex.substring(0, 2), 16)
    const g = Number.parseInt(hex.substring(2, 4), 16)
    const b = Number.parseInt(hex.substring(4, 6), 16)

    // Devolver como rgba
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }

  function hexToRgbaOld(hex: string, opacity: number): string {
    hex = hex.replace("#", "")
    const r = Number.parseInt(hex.substring(0, 2), 16)
    const g = Number.parseInt(hex.substring(2, 4), 16)
    const b = Number.parseInt(hex.substring(4, 6), 16)

    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }

  function rgbaToHexOld(rgba: string): string {
    const match = rgba.match(/rgba?$$(\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+\.?\d*))?$$/)
    if (!match) return "#000000"

    const r = Number.parseInt(match[1])
    const g = Number.parseInt(match[2])
    const b = Number.parseInt(match[3])

    const componentToHex = (c: number) => {
      const hex = c.toString(16)
      return hex.length == 1 ? "0" + hex : hex
    }

    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b)
  }

  //export default function EditHeroSectionPage({ params }: EditHeroSectionPageProps) {
  //const unwrappedParams = use(params)
  //const { id } = unwrappedParams
  const router = useRouter()
  const { toast } = useToast()
  const { fetchHeroSection, updateHeroSection, shopSettings } = useMainStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingDesktop, setIsUploadingDesktop] = useState(false)
  const [isUploadingMobile, setIsUploadingMobile] = useState(false)
  const [activeDevice, setActiveDevice] = useState<"mobile" | "tablet" | "desktop">("desktop")

  // Estado para tamaños de fuente
  const [titleFontSize, setTitleFontSize] = useState({
    mobile: 1.5,
    tablet: 2,
    desktop: 2.5,
  })

  const [subtitleFontSize, setSubtitleFontSize] = useState({
    mobile: 0.875,
    tablet: 1,
    desktop: 1.125,
  })

  // Estado para altura personalizada
  const [useCustomHeight, setUseCustomHeight] = useState({
    mobile: false,
    tablet: false,
    desktop: false,
  })

  const [customHeight, setCustomHeight] = useState({
    mobile: 400,
    tablet: 400,
    desktop: 400,
  })

  // Actualizar el estado formData para incluir los campos de video
  const [formData, setFormData] = useState<UpdateHeroSectionDto>({
    title: "",
    subtitle: "",
    buttonText: "",
    buttonLink: "",
    backgroundImage: "",
    mobileBackgroundImage: "",
    backgroundVideo: "",
    mobileBackgroundVideo: "",
    styles: {
      titleColor: "text-white",
      subtitleColor: "text-gray-200",
      textAlign: "text-left",
      verticalAlign: "items-center",
      overlayColor: "bg-black/40",
      buttonVariant: "default",
      buttonSize: "default",
      contentWidth: {
        mobile: "max-w-full",
        tablet: "max-w-2xl",
        desktop: "max-w-3xl",
      },
      contentPadding: {
        mobile: "py-8 px-4",
        tablet: "py-12 px-6",
        desktop: "py-16 px-8",
      },
      height: {
        mobile: "min-h-screen",
        tablet: "min-h-screen",
        desktop: "min-h-screen",
      },
      titleSize: {
        mobile: "text-[1.5em]",
        tablet: "text-[2em]",
        desktop: "text-[2.5em]",
      },
      subtitleSize: {
        mobile: "text-[0.875em]",
        tablet: "text-[1em]",
        desktop: "text-[1.125em]",
      },
      textShadow: "drop-shadow-md",
      animation: "animate-fade-in",
      backgroundPosition: "bg-center",
      backgroundSize: "bg-cover",
    },
    metadata: {},
    isActive: true,
  })

  // Replace the handleStyleChange function with this:
  const handleStyleChange = (name: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      styles: {
        ...(prev.styles || {}),
        [name]: value,
      },
    }))
  }

  // Replace handleResponsiveStyleChange function with this:
  const handleResponsiveStyleChange = (name: string, device: "mobile" | "tablet" | "desktop", value: any) => {
    setFormData((prev) => ({
      ...prev,
      styles: {
        ...(prev.styles || {}),
        [name]: {
          ...(prev.styles?.[name] || {}),
          [device]: value,
        },
      },
    }))
  }

  // Replace useEffect with this version that properly handles potentially undefined values:
  // Actualizar el estado useEffect para cargar los datos de video
  // Asegurarse de que los valores iniciales de los degradados se establezcan correctamente
  // Modificar la función useEffect para inicializar correctamente los valores de degradado
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        // Cargar la configuración de la tienda para la subida de imágenes
        if (!shopSettings || shopSettings.length === 0) {
          await useMainStore.getState().fetchShopSettings()
        }

        // Cargar los datos de la sección hero
        const heroSection = await fetchHeroSection(id)

        // Convertir el formato antiguo al nuevo formato si es necesario
        const styles = heroSection.styles || {}

        // Inicializar estructuras anidadas si no existen
        const updatedStyles = {
          ...styles,
          contentWidth:
            typeof styles.contentWidth === "object"
              ? styles.contentWidth
              : { mobile: "max-w-full", tablet: "max-w-2xl", desktop: styles.contentWidth || "max-w-3xl" },
          contentPadding:
            typeof styles.contentPadding === "object"
              ? styles.contentPadding
              : { mobile: "py-8 px-4", tablet: "py-12 px-6", desktop: styles.contentPadding || "py-16 px-8" },
          height:
            typeof styles.height === "object"
              ? styles.height
              : { mobile: "min-h-screen", tablet: "min-h-screen", desktop: styles.height || "min-h-screen" },
          titleSize:
            typeof styles.titleSize === "object"
              ? styles.titleSize
              : { mobile: "text-[1.5em]", tablet: "text-[2em]", desktop: styles.titleSize || "text-[2.5em]" },
          subtitleSize:
            typeof styles.subtitleSize === "object"
              ? styles.subtitleSize
              : { mobile: "text-[0.875em]", tablet: "text-[1em]", desktop: styles.subtitleSize || "text-[1.125em]" },
          verticalAlign: styles.verticalAlign || "items-center",
          titleColor: styles.titleColor || "text-white",
          subtitleColor: styles.subtitleColor || "text-gray-200",
          textAlign: styles.textAlign || "text-left",
          overlayType: styles.overlayType || "color",
          overlayColor: styles.overlayColor || "rgba(0,0,0,0.4)",
          overlayOpacity: styles.overlayOpacity || 0.4,
          overlayGradient: styles.overlayGradient || {
            colorStart: "rgba(0,0,0,0.4)",
            colorEnd: "rgba(0,0,0,0)",
            angle: 90,
          },
          overlayGradientStartOpacity: styles.overlayGradientStartOpacity || 0.4,
          overlayGradientEndOpacity: styles.overlayGradientEndOpacity || 0,
          buttonVariant: styles.buttonVariant || "default",
          buttonSize: styles.buttonSize || "default",
          textShadow: styles.textShadow || "drop-shadow-md",
          animation: styles.animation || "animate-fade-in",
          backgroundPosition: styles.backgroundPosition || "bg-center",
          backgroundSize: styles.backgroundSize || "bg-cover",
        }

        // Actualizar el estado del formulario
        setFormData({
          title: heroSection.title || "",
          subtitle: heroSection.subtitle || "",
          buttonText: heroSection.buttonText || "",
          buttonLink: heroSection.buttonLink || "",
          backgroundImage: heroSection.backgroundImage || "",
          mobileBackgroundImage: heroSection.mobileBackgroundImage || "",
          backgroundVideo: heroSection.backgroundVideo || "",
          mobileBackgroundVideo: heroSection.mobileBackgroundVideo || "",
          styles: updatedStyles,
          metadata: heroSection.metadata || {},
          isActive: heroSection.isActive || false,
        })

        // Actualizar estados de tamaño de fuente
        setTitleFontSize({
          mobile: Number.parseFloat(updatedStyles.titleSize.mobile?.replace("text-[", "").replace("em]", "") || "1.5"),
          tablet: Number.parseFloat(updatedStyles.titleSize.tablet?.replace("text-[", "").replace("em]", "") || "2"),
          desktop: Number.parseFloat(
            updatedStyles.titleSize.desktop?.replace("text-[", "").replace("em]", "") || "2.5",
          ),
        })

        setSubtitleFontSize({
          mobile: Number.parseFloat(
            updatedStyles.subtitleSize.mobile?.replace("text-[", "").replace("em]", "") || "0.875",
          ),
          tablet: Number.parseFloat(updatedStyles.subtitleSize.tablet?.replace("text-[", "").replace("em]", "") || "1"),
          desktop: Number.parseFloat(
            updatedStyles.subtitleSize.desktop?.replace("text-[", "").replace("em]", "") || "1.125",
          ),
        })

        // Configurar altura personalizada
        Object.entries(updatedStyles.height).forEach(([device, value]) => {
          const deviceType = device as "mobile" | "tablet" | "desktop"
          if (
            typeof value === "string" &&
            value !== "min-h-screen" &&
            value.includes("min-h-[") &&
            value.includes("px]")
          ) {
            const heightValue = Number.parseInt(value.replace("min-h-[", "").replace("px]", ""))
            setUseCustomHeight((prev) => ({ ...prev, [deviceType]: true }))
            setCustomHeight((prev) => ({ ...prev, [deviceType]: heightValue }))
          }
        })
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los datos",
        })
        router.push("/hero-sections")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [id, fetchHeroSection, shopSettings, toast, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, isActive: checked }))
  }

  const handleTitleFontSizeChange = (device: "mobile" | "tablet" | "desktop", value: number) => {
    setTitleFontSize((prev) => ({
      ...prev,
      [device]: value,
    }))

    handleResponsiveStyleChange("titleSize", device, `text-[${value}em]`)
  }

  const handleSubtitleFontSizeChange = (device: "mobile" | "tablet" | "desktop", value: number) => {
    setSubtitleFontSize((prev) => ({
      ...prev,
      [device]: value,
    }))

    handleResponsiveStyleChange("subtitleSize", device, `text-[${value}em]`)
  }

  // Actualizar el manejo de la alineación vertical para usar las clases correctas
  const handleVerticalAlignChange = (alignment: string) => {
    handleStyleChange("verticalAlign", alignment)
  }

  // Modificar la función handleResponsiveStyleChange para manejar la altura personalizada
  const handleCustomHeightChange = (device: "mobile" | "tablet" | "desktop", value: number) => {
    setCustomHeight((prev) => ({
      ...prev,
      [device]: value,
    }))

    // Actualizar el estilo de altura
    handleResponsiveStyleChange("height", device, `min-h-[${value}px]`)
  }

  // Modificar la función para cambiar entre altura completa y personalizada
  const toggleCustomHeight = (device: "mobile" | "tablet" | "desktop", useCustom: boolean) => {
    setUseCustomHeight((prev) => ({
      ...prev,
      [device]: useCustom,
    }))

    // Actualizar el estilo de altura
    if (useCustom) {
      handleResponsiveStyleChange("height", device, `min-h-[${customHeight[device]}px]`)
    } else {
      handleResponsiveStyleChange("height", device, "min-h-screen")
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "desktop" | "mobile") => {
    const file = e.target.files?.[0]
    if (!file) return

    const setUploading = type === "desktop" ? setIsUploadingDesktop : setIsUploadingMobile
    const imageField = type === "desktop" ? "backgroundImage" : "mobileBackgroundImage"

    setUploading(true)
    try {
      const shopId = shopSettings?.[0]?.name || "default-shop"
      const { success, fileUrl, error } = await uploadImageToR2(file, shopId)

      if (!success || !fileUrl) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error || "No se pudo subir la imagen",
        })
        return
      }

      setFormData((prev) => ({ ...prev, [imageField]: fileUrl }))
      toast({
        title: "Éxito",
        description: `Imagen ${type} subida correctamente`,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `No se pudo subir la imagen ${type}`,
      })
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await updateHeroSection(id, formData)
      toast({
        title: "Éxito",
        description: "Sección hero actualizada correctamente",
      })
      router.push("/hero-sections")
    } catch (error) {
      console.error("Error updating hero section:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar la sección hero",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
      {/* Sidebar - Estilo Elementor */}
      <div className="w-[320px] bg-white dark:bg-gray-950 border-r flex flex-col h-full">
        <div className="p-4 border-b flex items-center justify-between bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center">
            <Link href="/hero-sections">
              <Button variant="ghost" size="icon" className="mr-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h2 className="text-lg font-medium">Editor de Hero</h2>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              type="submit"
              form="hero-form"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  <span>Guardando</span>
                </div>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" /> Guardar
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="flex border-b bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-center w-full py-2 space-x-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn("h-8 px-3 rounded", activeDevice === "mobile" ? "bg-blue-600 text-white" : "")}
              onClick={() => setActiveDevice("mobile")}
            >
              <Smartphone className="h-4 w-4 mr-1" /> Móvil
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn("h-8 px-3 rounded", activeDevice === "tablet" ? "bg-blue-600 text-white" : "")}
              onClick={() => setActiveDevice("tablet")}
            >
              <Tablet className="h-4 w-4 mr-1" /> Tablet
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn("h-8 px-3 rounded", activeDevice === "desktop" ? "bg-blue-600 text-white" : "")}
              onClick={() => setActiveDevice("desktop")}
            >
              <Monitor className="h-4 w-4 mr-1" /> Escritorio
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <form id="hero-form" onSubmit={handleSubmit} className="p-0">
            {/* Secciones de Elementor con Collapsible */}
            <div className="space-y-1">
              {/* Sección de Contenido */}
              <Collapsible defaultOpen className="border-b">
                <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-900">
                  <div className="flex items-center">
                    <LayoutGrid className="h-4 w-4 mr-2 text-blue-600" />
                    <span className="font-medium">Contenido</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500 ui-open:rotate-180 transition-transform" />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 pb-4 space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="title">Título</Label>
                      <Input
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Título de la sección hero (opcional)"
                      />
                    </div>

                    <div className="space-y-2">
                    <Label htmlFor="subtitle">Subtítulo</Label>
                    <SimpleRichTextEditor
                      content={formData.subtitle || ""}
                      onChange={(content) => {
                        handleChange({
                          target: {
                            name: 'subtitle',
                            value: content
                          }
                        } as React.ChangeEvent<HTMLTextAreaElement>)
                      }}
                      maxLength={1000}
                    />
                  </div>

                    <div className="space-y-2">
                      <Label htmlFor="buttonText">Texto del botón</Label>
                      <Input
                        id="buttonText"
                        name="buttonText"
                        value={formData.buttonText}
                        onChange={handleChange}
                        placeholder="Texto del botón (opcional)"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="buttonLink">Enlace del botón</Label>
                      <Input
                        id="buttonLink"
                        name="buttonLink"
                        value={formData.buttonLink}
                        onChange={handleChange}
                        placeholder="Enlace del botón (opcional)"
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Sección de Estilo */}
              <Collapsible defaultOpen className="border-b">
                <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-900">
                  <div className="flex items-center">
                    <Type className="h-4 w-4 mr-2 text-blue-600" />
                    <span className="font-medium">Estilo</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500 ui-open:rotate-180 transition-transform" />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1">
                  {/* Subsección de Tipografía */}
                  <Collapsible className="border-t">
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-900 pl-6">
                      <div className="flex items-center">
                        <Type className="h-4 w-4 mr-2 text-gray-500" />
                        <span>Tipografía</span>
                      </div>
                      <ChevronDown className="h-4 w-4 text-gray-500 ui-open:rotate-180 transition-transform" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-4 space-y-4 pt-2">
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Tamaño del título</Label>
                            <Badge variant="outline" className="font-mono">
                              {titleFontSize[activeDevice]}em
                            </Badge>
                          </div>
                          <Slider
                            value={[titleFontSize[activeDevice]]}
                            min={0.75}
                            max={activeDevice === "mobile" ? 2.5 : activeDevice === "tablet" ? 3.5 : 5}
                            step={0.125}
                            onValueChange={(value) => handleTitleFontSizeChange(activeDevice, value[0])}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Tamaño del subtítulo</Label>
                            <Badge variant="outline" className="font-mono">
                              {subtitleFontSize[activeDevice]}em
                            </Badge>
                          </div>
                          <Slider
                            value={[subtitleFontSize[activeDevice]]}
                            min={0.75}
                            max={activeDevice === "mobile" ? 1.5 : activeDevice === "tablet" ? 2 : 2.5}
                            step={0.125}
                            onValueChange={(value) => handleSubtitleFontSizeChange(activeDevice, value[0])}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Color del título</Label>
                          <Select
                            value={formData.styles?.titleColor || "text-white"}
                            onValueChange={(value) => handleStyleChange("titleColor", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar color" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text-white">Blanco</SelectItem>
                              <SelectItem value="text-black">Negro</SelectItem>
                              <SelectItem value="text-gray-900">Gris oscuro</SelectItem>
                              <SelectItem value="text-gray-600">Gris medio</SelectItem>
                              <SelectItem value="text-gray-400">Gris claro</SelectItem>
                              <SelectItem value="text-primary">Primario</SelectItem>
                              <SelectItem value="text-secondary">Secundario</SelectItem>
                              <SelectItem value="text-accent">Acento</SelectItem>
                              <SelectItem value="text-yellow-600">Amarillo</SelectItem>
                              <SelectItem value="text-green-600">Verde</SelectItem>
                              <SelectItem value="text-blue-600">Azul</SelectItem>
                              <SelectItem value="text-red-600">Rojo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Color del subtítulo</Label>
                          <Select
                            value={formData.styles?.subtitleColor || "text-gray-600"}
                            onValueChange={(value) => handleStyleChange("subtitleColor", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar color" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text-white">Blanco</SelectItem>
                              <SelectItem value="text-black">Negro</SelectItem>
                              <SelectItem value="text-gray-900">Gris oscuro</SelectItem>
                              <SelectItem value="text-gray-600">Gris medio</SelectItem>
                              <SelectItem value="text-gray-400">Gris claro</SelectItem>
                              <SelectItem value="text-primary">Primario</SelectItem>
                              <SelectItem value="text-secondary">Secundario</SelectItem>
                              <SelectItem value="text-accent">Acento</SelectItem>
                              <SelectItem value="text-yellow-600">Amarillo</SelectItem>
                              <SelectItem value="text-green-600">Verde</SelectItem>
                              <SelectItem value="text-blue-600">Azul</SelectItem>
                              <SelectItem value="text-red-600">Rojo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Sombra de texto</Label>
                          <Select
                            value={formData.styles?.textShadow || "none"}
                            onValueChange={(value) => handleStyleChange("textShadow", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar sombra" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sin sombra</SelectItem>
                              <SelectItem value="drop-shadow-sm">Ligera</SelectItem>
                              <SelectItem value="drop-shadow-md">Media</SelectItem>
                              <SelectItem value="drop-shadow-lg">Fuerte</SelectItem>
                              <SelectItem value="drop-shadow-xl">Extra fuerte</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Subsección de Alineación */}
                  <Collapsible className="border-t">
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-900 pl-6">
                      <div className="flex items-center">
                        <Layout className="h-4 w-4 mr-2 text-gray-500" />
                        <span>Alineación</span>
                      </div>
                      <ChevronDown className="h-4 w-4 text-gray-500 ui-open:rotate-180 transition-transform" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-4 space-y-4 pt-2">
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label>Alineación horizontal</Label>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant={formData.styles?.textAlign === "text-left" ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleStyleChange("textAlign", "text-left")}
                              className="flex-1"
                            >
                              <AlignLeft className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant={formData.styles?.textAlign === "text-center" ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleStyleChange("textAlign", "text-center")}
                              className="flex-1"
                            >
                              <AlignCenter className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant={formData.styles?.textAlign === "text-right" ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleStyleChange("textAlign", "text-right")}
                              className="flex-1"
                            >
                              <AlignRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Alineación vertical</Label>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant={formData.styles?.verticalAlign === "items-start" ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleVerticalAlignChange("items-start")}
                              className="flex-1"
                            >
                              <AlignStartVertical className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant={formData.styles?.verticalAlign === "items-center" ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleVerticalAlignChange("items-center")}
                              className="flex-1"
                            >
                              <AlignCenterVertical className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant={formData.styles?.verticalAlign === "items-end" ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleVerticalAlignChange("items-end")}
                              className="flex-1"
                            >
                              <AlignEndVertical className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Subsección de Dimensiones */}
                  <Collapsible className="border-t">
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-gray-50 dark:bg-gray-900 pl-6">
                      <div className="flex items-center">
                        <Layers className="h-4 w-4 mr-2 text-gray-500" />
                        <span>Dimensiones</span>
                      </div>
                      <ChevronDown className="h-4 w-4 text-gray-500 ui-open:rotate-180 transition-transform" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-4 space-y-4 pt-2">
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Altura de la sección</Label>
                            <Switch
                              checked={!useCustomHeight[activeDevice]}
                              onCheckedChange={(checked) => toggleCustomHeight(activeDevice, !checked)}
                              className="data-[state=checked]:bg-blue-600"
                            />
                            <span className="text-xs text-muted-foreground ml-2">
                              {useCustomHeight[activeDevice] ? "Personalizada" : "Pantalla completa"}
                            </span>
                          </div>

                          {useCustomHeight[activeDevice] && (
                            <div className="space-y-2 mt-3">
                              <div className="flex items-center justify-between">
                                <Label>Altura personalizada</Label>
                                <Badge variant="outline" className="font-mono">
                                  {customHeight[activeDevice]}px
                                </Badge>
                              </div>
                              <Slider
                                value={[customHeight[activeDevice]]}
                                min={200}
                                max={1000}
                                step={10}
                                onValueChange={(value) => handleCustomHeightChange(activeDevice, value[0])}
                              />
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>Ancho del contenido</Label>
                          <Select
                            value={formData.styles?.contentWidth?.[activeDevice] || "max-w-full"}
                            onValueChange={(value) => handleResponsiveStyleChange("contentWidth", activeDevice, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar ancho" />
                            </SelectTrigger>
                            <SelectContent>
                              {activeDevice === "mobile" ? (
                                <>
                                  <SelectItem value="max-w-xs">Estrecho</SelectItem>
                                  <SelectItem value="max-w-sm">Medio</SelectItem>
                                  <SelectItem value="max-w-md">Ancho</SelectItem>
                                  <SelectItem value="max-w-full">Completo</SelectItem>
                                </>
                              ) : activeDevice === "tablet" ? (
                                <>
                                  <SelectItem value="max-w-md">Estrecho</SelectItem>
                                  <SelectItem value="max-w-lg">Medio</SelectItem>
                                  <SelectItem value="max-w-xl">Ancho</SelectItem>
                                  <SelectItem value="max-w-2xl">Muy ancho</SelectItem>
                                  <SelectItem value="max-w-full">Completo</SelectItem>
                                </>
                              ) : (
                                <>
                                  <SelectItem value="max-w-xl">Estrecho</SelectItem>
                                  <SelectItem value="max-w-2xl">Medio</SelectItem>
                                  <SelectItem value="max-w-3xl">Ancho</SelectItem>
                                  <SelectItem value="max-w-5xl">Muy ancho</SelectItem>
                                  <SelectItem value="max-w-full">Completo</SelectItem>
                                </>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Subsección de Fondo */}
                  <Collapsible className="border-t">
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-gray-50 dark:bg-gray-900 pl-6">
                      <div className="flex items-center">
                        <ImageLucide className="h-4 w-4 mr-2 text-gray-500" />
                        <span>Fondo</span>
                      </div>
                      <ChevronDown className="h-4 w-4 text-gray-500 ui-open:rotate-180 transition-transform" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-4 space-y-4 pt-2">
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label>Imagen de fondo</Label>
                          {activeDevice === "mobile" ? (
                            <div className="space-y-3">
                              {formData.mobileBackgroundImage ? (
                                <div className="relative w-full max-w-[200px] mx-auto aspect-[9/16] rounded-md overflow-hidden border">
                                  <Image
                                    src={formData.mobileBackgroundImage || "/placeholder.svg"}
                                    alt="Mobile background"
                                    fill
                                    className="object-cover"
                                  />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="absolute top-2 right-2"
                                    onClick={() => setFormData((prev) => ({ ...prev, mobileBackgroundImage: "" }))}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="border border-dashed rounded-md p-4 text-center">
                                  <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground" />
                                  <p className="text-sm text-muted-foreground mt-2">Imagen para dispositivos móviles</p>
                                </div>
                              )}

                              <div>
                                <Input
                                  id="mobileImageUpload"
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleImageUpload(e, "mobile")}
                                  disabled={isUploadingMobile}
                                  className="hidden"
                                />
                                <Label htmlFor="mobileImageUpload" className="w-full">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    disabled={isUploadingMobile}
                                    asChild
                                  >
                                    <span>
                                      {isUploadingMobile ? (
                                        <>
                                          <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
                                          Subiendo...
                                        </>
                                      ) : (
                                        <>
                                          <Upload className="h-4 w-4 mr-2" />
                                          Subir imagen
                                        </>
                                      )}
                                    </span>
                                  </Button>
                                </Label>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {formData.backgroundImage ? (
                                <div className="relative w-full aspect-video rounded-md overflow-hidden border">
                                  <Image
                                    src={formData.backgroundImage || "/placeholder.svg"}
                                    alt="Desktop background"
                                    fill
                                    className="object-cover"
                                  />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="absolute top-2 right-2"
                                    onClick={() => setFormData((prev) => ({ ...prev, backgroundImage: "" }))}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="border border-dashed rounded-md p-4 text-center">
                                  <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground" />
                                  <p className="text-sm text-muted-foreground mt-2">Imagen para escritorio y tablet</p>
                                </div>
                              )}

                              <div>
                                <Input
                                  id="desktopImageUpload"
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleImageUpload(e, "desktop")}
                                  disabled={isUploadingDesktop}
                                  className="hidden"
                                />
                                <Label htmlFor="desktopImageUpload" className="w-full">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    disabled={isUploadingDesktop}
                                    asChild
                                  >
                                    <span>
                                      {isUploadingDesktop ? (
                                        <>
                                          <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
                                          Subiendo...
                                        </>
                                      ) : (
                                        <>
                                          <Upload className="h-4 w-4 mr-2" />
                                          Subir imagen
                                        </>
                                      )}
                                    </span>
                                  </Button>
                                </Label>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>Posición de la imagen</Label>
                          <Select
                            value={formData.styles?.backgroundPosition || "bg-center"}
                            onValueChange={(value) => handleStyleChange("backgroundPosition", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar posición" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bg-center">Centro</SelectItem>
                              <SelectItem value="bg-top">Superior</SelectItem>
                              <SelectItem value="bg-bottom">Inferior</SelectItem>
                              <SelectItem value="bg-left">Izquierda</SelectItem>
                              <SelectItem value="bg-right">Derecha</SelectItem>
                              <SelectItem value="bg-left-top">Superior izquierda</SelectItem>
                              <SelectItem value="bg-right-top">Superior derecha</SelectItem>
                              <SelectItem value="bg-left-bottom">Inferior izquierda</SelectItem>
                              <SelectItem value="bg-right-bottom">Inferior derecha</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Tamaño de la imagen</Label>
                          <Select
                            value={formData.styles?.backgroundSize || "bg-cover"}
                            onValueChange={(value) => handleStyleChange("backgroundSize", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar tamaño" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bg-cover">Cubrir (cover)</SelectItem>
                              <SelectItem value="bg-contain">Contener (contain)</SelectItem>
                              <SelectItem value="bg-auto">Automático (auto)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Tipo de overlay */}
                        <div className="space-y-2">
                          <Label>Tipo de superposición</Label>
                          <Select
                            value={formData.styles?.overlayType || "color"}
                            onValueChange={(value) => handleStyleChange("overlayType", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar tipo de superposición" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sin superposición</SelectItem>
                              <SelectItem value="color">Color sólido</SelectItem>
                              <SelectItem value="gradient">Degradado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Modificar el manejo del cambio de color para el overlay de color sólido */}
                        {formData.styles?.overlayType === "color" && (
                          <div className="space-y-2">
                            <Label>Color de superposición</Label>
                            <div className="flex items-center space-x-2">
                              <div
                                className="h-10 w-14 rounded border overflow-hidden relative overlay-color-preview"
                                style={{ backgroundColor: formData.styles?.overlayColor || "rgba(0,0,0,0.4)" }}
                              >
                                <Input
                                  type="color"
                                  value={rgbaToHex(formData.styles?.overlayColor || "rgba(0,0,0,0.4)")}
                                  onChange={(e) => {
                                    const opacity = formData.styles?.overlayOpacity || 0.4
                                    const newColor = hexToRgba(e.target.value, opacity)
                                    handleStyleChange("overlayColor", newColor)

                                    // Forzar actualización visual
                                    const colorPreview = document.querySelector(".overlay-color-preview") as HTMLElement
                                    if (colorPreview) {
                                      colorPreview.style.backgroundColor = newColor
                                    }
                                  }}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                              </div>
                              <div className="flex-grow space-y-1">
                                <Label className="text-xs">
                                  Opacidad: {Math.round((formData.styles?.overlayOpacity || 0.4) * 100)}%
                                </Label>
                                <Slider
                                  value={[formData.styles?.overlayOpacity || 0.4]}
                                  min={0}
                                  max={1}
                                  step={0.01}
                                  onValueChange={(value) => {
                                    // Guardar la opacidad
                                    handleStyleChange("overlayOpacity", value[0])

                                    // Obtener el color actual en formato hex (sin perder el color)
                                    if (formData.styles?.overlayColor) {
                                      const currentColor = formData.styles.overlayColor
                                      const hexColor = rgbaToHex(currentColor)
                                      // Aplicar la nueva opacidad al mismo color
                                      const newColor = hexToRgba(hexColor, value[0])
                                      handleStyleChange("overlayColor", newColor)

                                      // Actualizar la vista previa
                                      const colorPreview = document.querySelector(
                                        ".overlay-color-preview",
                                      ) as HTMLElement
                                      if (colorPreview) {
                                        colorPreview.style.backgroundColor = newColor
                                      }
                                    }
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Modificar el manejo del cambio de color para el degradado */}
                        {formData.styles?.overlayType === "gradient" && (
                          <>
                            <div className="space-y-2">
                              <Label>Color inicial del degradado</Label>
                              <div className="flex items-center space-x-2">
                                <div
                                  className="h-10 w-14 rounded border overflow-hidden relative gradient-start-preview"
                                  style={{
                                    backgroundColor: formData.styles?.overlayGradient?.colorStart || "rgba(0,0,0,0.4)",
                                  }}
                                >
                                  <Input
                                    type="color"
                                    value={
                                      formData.styles?.overlayGradient?.colorStart?.startsWith("rgba")
                                        ? rgbaToHex(formData.styles.overlayGradient.colorStart)
                                        : "#000000"
                                    }
                                    onChange={(e) => {
                                      const opacity = formData.styles?.overlayGradientStartOpacity || 0.4
                                      const newColor = hexToRgba(e.target.value, opacity)
                                      const updatedGradient = {
                                        ...(formData.styles?.overlayGradient || {}),
                                        colorStart: newColor,
                                      }
                                      handleStyleChange("overlayGradient", updatedGradient)

                                      // Actualizar la vista previa
                                      const colorPreview = document.querySelector(
                                        ".gradient-start-preview",
                                      ) as HTMLElement
                                      if (colorPreview) {
                                        colorPreview.style.backgroundColor = newColor
                                      }
                                    }}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                  />
                                </div>
                                <div className="flex-grow space-y-1">
                                  <Label className="text-xs">
                                    Opacidad: {Math.round((formData.styles?.overlayGradientStartOpacity || 0.4) * 100)}%
                                  </Label>
                                  <Slider
                                    value={[formData.styles?.overlayGradientStartOpacity || 0.4]}
                                    min={0}
                                    max={1}
                                    step={0.01}
                                    onValueChange={(value) => {
                                      handleStyleChange("overlayGradientStartOpacity", value[0])
                                      // Actualizar también el color RGBA con la nueva opacidad
                                      if (formData.styles?.overlayGradient?.colorStart) {
                                        const currentColor = formData.styles.overlayGradient.colorStart
                                        const hexColor = rgbaToHex(currentColor)
                                        const updatedGradient = {
                                          ...(formData.styles?.overlayGradient || {}),
                                          colorStart: hexToRgba(hexColor, value[0]),
                                        }
                                        handleStyleChange("overlayGradient", updatedGradient)

                                        // Actualizar la vista previa
                                        const colorPreview = document.querySelector(
                                          ".gradient-start-preview",
                                        ) as HTMLElement
                                        if (colorPreview) {
                                          colorPreview.style.backgroundColor = hexToRgba(hexColor, value[0])
                                        }
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>Color final del degradado</Label>
                              <div className="flex items-center space-x-2">
                                <div
                                  className="h-10 w-14 rounded border overflow-hidden relative gradient-end-preview"
                                  style={{
                                    backgroundColor: formData.styles?.overlayGradient?.colorEnd || "rgba(0,0,0,0)",
                                  }}
                                >
                                  <Input
                                    type="color"
                                    value={
                                      formData.styles?.overlayGradient?.colorEnd?.startsWith("rgba")
                                        ? rgbaToHex(formData.styles.overlayGradient.colorEnd)
                                        : "#000000"
                                    }
                                    onChange={(e) => {
                                      const opacity = formData.styles?.overlayGradientEndOpacity || 0
                                      const newColor = hexToRgba(e.target.value, opacity)
                                      const updatedGradient = {
                                        ...(formData.styles?.overlayGradient || {}),
                                        colorEnd: newColor,
                                      }
                                      handleStyleChange("overlayGradient", updatedGradient)

                                      // Actualizar la vista previa
                                      const colorPreview = document.querySelector(
                                        ".gradient-end-preview",
                                      ) as HTMLElement
                                      if (colorPreview) {
                                        colorPreview.style.backgroundColor = newColor
                                      }
                                    }}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                  />
                                </div>
                                <div className="flex-grow space-y-1">
                                  <Label className="text-xs">
                                    Opacidad: {Math.round((formData.styles?.overlayGradientEndOpacity || 0) * 100)}%
                                  </Label>
                                  <Slider
                                    value={[formData.styles?.overlayGradientEndOpacity || 0]}
                                    min={0}
                                    max={1}
                                    step={0.01}
                                    onValueChange={(value) => {
                                      handleStyleChange("overlayGradientEndOpacity", value[0])
                                      // Actualizar también el color RGBA con la nueva opacidad
                                      if (formData.styles?.overlayGradient?.colorEnd) {
                                        const currentColor = formData.styles.overlayGradient.colorEnd
                                        const hexColor = rgbaToHex(currentColor)
                                        const updatedGradient = {
                                          ...(formData.styles?.overlayGradient || {}),
                                          colorEnd: hexToRgba(hexColor, value[0]),
                                        }
                                        handleStyleChange("overlayGradient", updatedGradient)

                                        // Actualizar la vista previa
                                        const colorPreview = document.querySelector(
                                          ".gradient-end-preview",
                                        ) as HTMLElement
                                        if (colorPreview) {
                                          colorPreview.style.backgroundColor = hexToRgba(hexColor, value[0])
                                        }
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                  {/* Añadir la sección de Videos de Fondo después de la sección de Fondo */}

                  <Collapsible className="border-t">
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-gray-50 dark:bg-gray-900 pl-6">
                      <div className="flex items-center">
                        <Video className="h-4 w-4 mr-2 text-gray-500" />
                        <span>Videos de Fondo</span>
                      </div>
                      <ChevronDown className="h-4 w-4 text-gray-500 ui-open:rotate-180 transition-transform" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-4 space-y-4 pt-2">
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label>Video de fondo (Desktop)</Label>
                          <Input
                            placeholder="URL del video de YouTube (ej: https://www.youtube.com/watch?v=VIDEO_ID)"
                            value={formData.backgroundVideo || ""}
                            onChange={(e) => setFormData((prev) => ({ ...prev, backgroundVideo: e.target.value }))}
                          />
                          <p className="text-xs text-muted-foreground">
                            El video se reproducirá automáticamente, en silencio y en bucle. La imagen de fondo se
                            mostrará mientras el video carga.
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label>Video de fondo (Mobile)</Label>
                          <Input
                            placeholder="URL del video de YouTube (ej: https://www.youtube.com/watch?v=VIDEO_ID)"
                            value={formData.mobileBackgroundVideo || ""}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, mobileBackgroundVideo: e.target.value }))
                            }
                          />
                          <p className="text-xs text-muted-foreground">
                            Opcional. Si no se especifica, se usará el video de escritorio en dispositivos móviles.
                          </p>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </CollapsibleContent>
              </Collapsible>

              {/* Sección de Avanzado */}
              <Collapsible className="border-b">
                <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-gray-50 dark:bg-gray-900">
                  <div className="flex items-center">
                    <Settings className="h-4 w-4 mr-2 text-blue-600" />
                    <span className="font-medium">Avanzado</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500 ui-open:rotate-180 transition-transform" />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 pb-4 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <div>
                        <Label htmlFor="isActive" className="text-base font-medium">
                          Estado
                        </Label>
                        <p className="text-sm text-muted-foreground">Activa o desactiva la sección hero</p>
                      </div>
                      <Switch
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={handleSwitchChange}
                        className="data-[state=checked]:bg-blue-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Estilo del botón</Label>
                      <Select
                        value={formData.styles?.buttonVariant || "default"}
                        onValueChange={(value) => handleStyleChange("buttonVariant", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar estilo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Primario</SelectItem>
                          <SelectItem value="outline">Contorno</SelectItem>
                          <SelectItem value="secondary">Secundario</SelectItem>
                          <SelectItem value="destructive">Destacado</SelectItem>
                          <SelectItem value="ghost">Fantasma</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
              {/* Agregar la sección de metadata después de la sección de Avanzado, justo antes de cerrar el div de space-y-1
              Buscar la línea que contiene </Collapsible> justo después de la sección de Avanzado
              y agregar el siguiente código después de esa línea:
              */}
              <Collapsible className="border-t">
                <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-900 pl-6">
                  <div className="flex items-center">
                    <Tags className="h-4 w-4 mr-2 text-gray-500" />
                    <span>Metadata</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500 ui-open:rotate-180 transition-transform" />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 pb-4 space-y-4 pt-2">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Sección</Label>
                      <Input
                        placeholder="Identificador de sección"
                        value={formData.metadata?.section || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            metadata: { ...prev.metadata, section: e.target.value },
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Tags</Label>
                      <div className="flex flex-wrap gap-2">
                        {formData.metadata?.tags?.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {tag}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  metadata: {
                                    ...prev.metadata,
                                    tags: prev.metadata?.tags?.filter((_, i) => i !== index),
                                  },
                                }))
                              }
                            />
                          </Badge>
                        ))}
                        <Input
                          placeholder="Agregar tag"
                          className="w-32"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && e.currentTarget.value) {
                              e.preventDefault()
                              setFormData((prev) => ({
                                ...prev,
                                metadata: {
                                  ...prev.metadata,
                                  tags: [...(prev.metadata?.tags || []), e.currentTarget.value],
                                },
                              }))
                              e.currentTarget.value = ""
                            }
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Prioridad</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.metadata?.priority || 0}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            metadata: { ...prev.metadata, priority: Number(e.target.value) },
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Tema</Label>
                      <Select
                        value={formData.metadata?.theme || "default"}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            metadata: { ...prev.metadata, theme: value },
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tema" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="light">Light</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Visibilidad por dispositivo</Label>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={formData.metadata?.deviceVisibility?.mobile}
                            onCheckedChange={(checked) =>
                              setFormData((prev) => ({
                                ...prev,
                                metadata: {
                                  ...prev.metadata,
                                  deviceVisibility: {
                                    ...prev.metadata?.deviceVisibility,
                                    mobile: checked as boolean,
                                  },
                                },
                              }))
                            }
                          />
                          <Label>Mobile</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={formData.metadata?.deviceVisibility?.tablet}
                            onCheckedChange={(checked) =>
                              setFormData((prev) => ({
                                ...prev,
                                metadata: {
                                  ...prev.metadata,
                                  deviceVisibility: {
                                    ...prev.metadata?.deviceVisibility,
                                    tablet: checked as boolean,
                                  },
                                },
                              }))
                            }
                          />
                          <Label>Tablet</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={formData.metadata?.deviceVisibility?.desktop}
                            onCheckedChange={(checked) =>
                              setFormData((prev) => ({
                                ...prev,
                                metadata: {
                                  ...prev.metadata,
                                  deviceVisibility: {
                                    ...prev.metadata?.deviceVisibility,
                                    desktop: checked as boolean,
                                  },
                                },
                              }))
                            }
                          />
                          <Label>Desktop</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </form>
        </ScrollArea>
      </div>

      {/* Área de previsualización */}
      <div className="flex-1 bg-gray-100 dark:bg-gray-900 overflow-auto">
        <div className="h-full flex flex-col">
          <div className="p-4 flex items-center justify-between border-b bg-white dark:bg-gray-950">
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {activeDevice === "mobile" ? "Móvil" : activeDevice === "tablet" ? "Tablet" : "Escritorio"}
              </Badge>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn("h-8 w-8 p-0 rounded-full", activeDevice === "mobile" ? "bg-blue-600 text-white" : "")}
                onClick={() => setActiveDevice("mobile")}
              >
                <Smartphone className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn("h-8 w-8 p-0 rounded-full", activeDevice === "tablet" ? "bg-blue-600 text-white" : "")}
                onClick={() => setActiveDevice("tablet")}
              >
                <Tablet className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn("h-8 w-8 p-0 rounded-full", activeDevice === "desktop" ? "bg-blue-600 text-white" : "")}
                onClick={() => setActiveDevice("desktop")}
              >
                <Monitor className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center p-4">
            {/* Área de previsualización con dimensiones específicas para cada dispositivo */}
            <div
              className={cn(
                "transition-all duration-300 ease-in-out shadow-lg",
                activeDevice === "mobile"
                  ? "w-[375px] h-[667px]" // Dimensiones exactas para móvil (proporción 9:16)
                  : activeDevice === "tablet"
                    ? "w-[1024px] h-[768px]" // Dimensiones exactas para tablet (proporción 4:3) - invertidas
                    : "w-[1280px] h-[640px]", // Dimensiones exactas para desktop (proporción 2:1)
              )}
            >
              <div className="w-full h-full bg-white">
                <HeroSectionPreview
                  title={formData.title || ""}
                  subtitle={formData.subtitle}
                  buttonText={formData.buttonText}
                  buttonLink={formData.buttonLink}
                  backgroundImage={formData.backgroundImage}
                  mobileBackgroundImage={formData.mobileBackgroundImage}
                  backgroundVideo={formData.backgroundVideo}
                  mobileBackgroundVideo={formData.mobileBackgroundVideo}
                  styles={formData.styles}
                  deviceType={activeDevice}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

