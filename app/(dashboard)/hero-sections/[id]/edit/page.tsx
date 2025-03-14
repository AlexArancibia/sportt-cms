"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useMainStore } from "@/stores/mainStore"
import { useToast } from "@/hooks/use-toast"
import { HeaderBar } from "@/components/HeaderBar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ArrowLeft,
  Save,
  Upload,
  Smartphone,
  Monitor,
  ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react"
import Link from "next/link"
import { uploadImage } from "@/app/actions/upload-file"
import Image from "next/image"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { use } from "react"
import { HeroSectionPreview } from "../../new/_components/heroSectionPreview"

 

interface UpdateHeroSectionDto {
  title: string
  subtitle?: string
  buttonText?: string
  buttonLink?: string
  backgroundImage?: string
  mobileBackgroundImage?: string
  styles?: Record<string, any>
  metadata?: Record<string, any>
  isActive: boolean
}   

export default function EditHeroSectionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const id = resolvedParams.id
  const router = useRouter()
  const { toast } = useToast()
  const { fetchHeroSection, updateHeroSection, shopSettings } = useMainStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingDesktop, setIsUploadingDesktop] = useState(false)
  const [isUploadingMobile, setIsUploadingMobile] = useState(false)
  const [formData, setFormData] = useState<UpdateHeroSectionDto>({
    title: "",
    subtitle: "",
    buttonText: "",
    buttonLink: "",
    backgroundImage: "",
    mobileBackgroundImage: "",
    styles: {
      titleColor: "text-white",
      subtitleColor: "text-gray-200",
      textAlign: "text-left",
      overlayColor: "bg-black/40",
      buttonVariant: "default",
      buttonSize: "default",
      contentWidth: "max-w-xl",
      contentPadding: "py-16 px-6 md:py-24",
      height: "min-h-[400px]",
      titleSize: "text-3xl md:text-4xl lg:text-5xl",
      subtitleSize: "text-base md:text-lg",
      textShadow: "drop-shadow-md",
      animation: "animate-fade-in",
      backgroundPosition: "bg-center",
      backgroundSize: "bg-cover",
    },
    metadata: {},
    isActive: true,
  })

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
        setFormData({
          title: heroSection.title || "",
          subtitle: heroSection.subtitle || "",
          buttonText: heroSection.buttonText || "",
          buttonLink: heroSection.buttonLink || "",
          backgroundImage: heroSection.backgroundImage || "",
          mobileBackgroundImage: heroSection.mobileBackgroundImage || "",
          styles: heroSection.styles || {
            titleColor: "text-white",
            subtitleColor: "text-gray-200",
            textAlign: "text-left",
            overlayColor: "bg-black/40",
            buttonVariant: "default",
            buttonSize: "default",
            contentWidth: "max-w-xl",
            contentPadding: "py-16 px-6 md:py-24",
            height: "min-h-[400px]",
            titleSize: "text-3xl md:text-4xl lg:text-5xl",
            subtitleSize: "text-base md:text-lg",
            textShadow: "drop-shadow-md",
            animation: "animate-fade-in",
            backgroundPosition: "bg-center",
            backgroundSize: "bg-cover",
          },
          metadata: heroSection.metadata || {},
          isActive: heroSection.isActive || false,
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

  const handleStyleChange = (name: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      styles: {
        ...prev.styles,
        [name]: value,
      },
    }))
  }

  const handleDesktopImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingDesktop(true)
    try {
      const shopId = shopSettings?.[0]?.name || "default-shop"

      const { success, presignedUrl, fileUrl, error } = await uploadImage(shopId, file.name, file.type)

      if (!success || !presignedUrl) {
        console.error("Error al obtener la presigned URL:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo generar la URL para subir la imagen",
        })
        return
      }

      const uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      })

      if (!uploadResponse.ok) {
        throw new Error("Error al subir la imagen")
      }

      setFormData((prev) => ({ ...prev, backgroundImage: fileUrl }))
      toast({
        title: "Éxito",
        description: "Imagen de escritorio subida correctamente",
      })
    } catch (error) {
      console.error("Error en la subida de imagen:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo subir la imagen de escritorio",
      })
    } finally {
      setIsUploadingDesktop(false)
    }
  }

  const handleMobileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingMobile(true)
    try {
      const shopId = shopSettings?.[0]?.name || "default-shop"

      const { success, presignedUrl, fileUrl, error } = await uploadImage(shopId, file.name, file.type)

      if (!success || !presignedUrl) {
        console.error("Error al obtener la presigned URL:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo generar la URL para subir la imagen",
        })
        return
      }

      const uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      })

      if (!uploadResponse.ok) {
        throw new Error("Error al subir la imagen")
      }

      setFormData((prev) => ({ ...prev, mobileBackgroundImage: fileUrl }))
      toast({
        title: "Éxito",
        description: "Imagen móvil subida correctamente",
      })
    } catch (error) {
      console.error("Error en la subida de imagen:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo subir la imagen móvil",
      })
    } finally {
      setIsUploadingMobile(false)
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
      <>
        <HeaderBar title="Editando Sección Hero" />
        <div className="container-section">
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <HeaderBar title={`Editando: ${formData.title}`} />
      <div className="container-section">
        <div className="mb-4">
          <Link href="/hero-sections">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" /> Volver
            </Button>
          </Link>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Columna izquierda - Información básica */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Información General</CardTitle>
                  <CardDescription>Información básica de la sección hero</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      placeholder="Título de la sección hero"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subtitle">Subtítulo</Label>
                    <Textarea
                      id="subtitle"
                      name="subtitle"
                      value={formData.subtitle}
                      onChange={handleChange}
                      placeholder="Subtítulo o descripción"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Imágenes de Fondo</CardTitle>
                  <CardDescription>Sube imágenes para escritorio y móvil</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="desktop" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="desktop">
                        <Monitor className="h-4 w-4 mr-2" /> Escritorio
                      </TabsTrigger>
                      <TabsTrigger value="mobile">
                        <Smartphone className="h-4 w-4 mr-2" /> Móvil
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="desktop" className="space-y-4">
                      <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 bg-muted/30">
                        {formData.backgroundImage ? (
                          <div className="relative w-full aspect-[21/9] mb-4">
                            <Image
                              src={formData.backgroundImage || "/placeholder.svg"}
                              alt="Background image"
                              fill
                              className="object-cover rounded-md"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={() => setFormData((prev) => ({ ...prev, backgroundImage: "" }))}
                            >
                              Eliminar
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center mb-4">
                            <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                            <p className="mt-2 text-sm text-muted-foreground">Imagen para pantallas de escritorio</p>
                          </div>
                        )}

                        <div className="w-full">
                          <Input
                            id="desktopImageUpload"
                            type="file"
                            accept="image/*"
                            onChange={handleDesktopImageUpload}
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
                                    Subir imagen de escritorio
                                  </>
                                )}
                              </span>
                            </Button>
                          </Label>
                        </div>

                        <div className="mt-4 w-full">
                          <Label htmlFor="backgroundImage">O ingresa la URL de la imagen</Label>
                          <Input
                            id="backgroundImage"
                            name="backgroundImage"
                            value={formData.backgroundImage}
                            onChange={handleChange}
                            placeholder="https://ejemplo.com/imagen.jpg"
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="mobile" className="space-y-4">
                      <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 bg-muted/30">
                        {formData.mobileBackgroundImage ? (
                          <div className="relative w-full max-w-[250px] aspect-[9/16] mb-4">
                            <Image
                              src={formData.mobileBackgroundImage || "/placeholder.svg"}
                              alt="Mobile background image"
                              fill
                              className="object-cover rounded-md"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={() => setFormData((prev) => ({ ...prev, mobileBackgroundImage: "" }))}
                            >
                              Eliminar
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center mb-4">
                            <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                            <p className="mt-2 text-sm text-muted-foreground">Imagen para dispositivos móviles</p>
                          </div>
                        )}

                        <div className="w-full">
                          <Input
                            id="mobileImageUpload"
                            type="file"
                            accept="image/*"
                            onChange={handleMobileImageUpload}
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
                                    Subir imagen móvil
                                  </>
                                )}
                              </span>
                            </Button>
                          </Label>
                        </div>

                        <div className="mt-4 w-full">
                          <Label htmlFor="mobileBackgroundImage">O ingresa la URL de la imagen</Label>
                          <Input
                            id="mobileBackgroundImage"
                            name="mobileBackgroundImage"
                            value={formData.mobileBackgroundImage}
                            onChange={handleChange}
                            placeholder="https://ejemplo.com/imagen-mobile.jpg"
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Configuración del Botón</CardTitle>
                  <CardDescription>Personaliza el botón de llamada a la acción</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="buttonText">Texto del botón</Label>
                    <Input
                      id="buttonText"
                      name="buttonText"
                      value={formData.buttonText}
                      onChange={handleChange}
                      placeholder="Comprar ahora"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buttonLink">Enlace del botón</Label>
                    <Input
                      id="buttonLink"
                      name="buttonLink"
                      value={formData.buttonLink}
                      onChange={handleChange}
                      placeholder="/productos"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Opciones de Publicación</CardTitle>
                  <CardDescription>Configura la visibilidad de la sección</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="isActive" className="text-base">
                        Estado
                      </Label>
                      <p className="text-sm text-muted-foreground">Activa o desactiva la sección hero</p>
                    </div>
                    <Switch id="isActive" checked={formData.isActive} onCheckedChange={handleSwitchChange} />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Guardando...
                      </div>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" /> Actualizar Sección Hero
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Columna derecha - Estilos y vista previa */}
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Vista Previa</CardTitle>
                  <CardDescription>Así se verá tu sección hero</CardDescription>
                </CardHeader>
                <CardContent className="p-0 overflow-hidden rounded-b-lg">
                  <div className="bg-gray-100 dark:bg-gray-800 p-4">
                    <HeroSectionPreview
                      title={formData.title || "Título de ejemplo"}
                      subtitle={formData.subtitle || "Subtítulo de ejemplo para mostrar cómo se verá tu sección hero"}
                      buttonText={formData.buttonText || "Botón"}
                      buttonLink={formData.buttonLink || "#"}
                      backgroundImage={formData.backgroundImage}
                      mobileBackgroundImage={formData.mobileBackgroundImage}
                      styles={formData.styles}
                      deviceType="desktop"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Estilos Avanzados</CardTitle>
                  <CardDescription>Personaliza la apariencia de tu sección hero</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="text" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                      <TabsTrigger value="text">Texto</TabsTrigger>
                      <TabsTrigger value="layout">Diseño</TabsTrigger>
                      <TabsTrigger value="background">Fondo</TabsTrigger>
                    </TabsList>

                    <TabsContent value="text" className="space-y-4">
                      <div className="space-y-2">
                        <Label>Color del título</Label>
                        <Select
                          value={formData.styles?.titleColor}
                          onValueChange={(value) => handleStyleChange("titleColor", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar color" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text-white">Blanco</SelectItem>
                            <SelectItem value="text-black">Negro</SelectItem>
                            <SelectItem value="text-gray-200">Gris claro</SelectItem>
                            <SelectItem value="text-gray-800">Gris oscuro</SelectItem>
                            <SelectItem value="text-primary">Primario</SelectItem>
                            <SelectItem value="text-secondary">Secundario</SelectItem>
                            <SelectItem value="text-accent">Acento</SelectItem>
                            <SelectItem value="text-yellow-400">Amarillo</SelectItem>
                            <SelectItem value="text-green-500">Verde</SelectItem>
                            <SelectItem value="text-blue-500">Azul</SelectItem>
                            <SelectItem value="text-red-500">Rojo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Color del subtítulo</Label>
                        <Select
                          value={formData.styles?.subtitleColor}
                          onValueChange={(value) => handleStyleChange("subtitleColor", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar color" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text-white">Blanco</SelectItem>
                            <SelectItem value="text-black">Negro</SelectItem>
                            <SelectItem value="text-gray-200">Gris claro</SelectItem>
                            <SelectItem value="text-gray-800">Gris oscuro</SelectItem>
                            <SelectItem value="text-primary">Primario</SelectItem>
                            <SelectItem value="text-secondary">Secundario</SelectItem>
                            <SelectItem value="text-accent">Acento</SelectItem>
                            <SelectItem value="text-yellow-400">Amarillo</SelectItem>
                            <SelectItem value="text-green-500">Verde</SelectItem>
                            <SelectItem value="text-blue-500">Azul</SelectItem>
                            <SelectItem value="text-red-500">Rojo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Alineación del texto</Label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={formData.styles?.textAlign === "text-left" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleStyleChange("textAlign", "text-left")}
                          >
                            <AlignLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant={formData.styles?.textAlign === "text-center" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleStyleChange("textAlign", "text-center")}
                          >
                            <AlignCenter className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant={formData.styles?.textAlign === "text-right" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleStyleChange("textAlign", "text-right")}
                          >
                            <AlignRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Tamaño del título</Label>
                        <Select
                          value={formData.styles?.titleSize}
                          onValueChange={(value) => handleStyleChange("titleSize", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tamaño" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text-2xl md:text-3xl">Pequeño</SelectItem>
                            <SelectItem value="text-3xl md:text-4xl lg:text-5xl">Mediano</SelectItem>
                            <SelectItem value="text-4xl md:text-5xl lg:text-6xl">Grande</SelectItem>
                            <SelectItem value="text-5xl md:text-6xl lg:text-7xl">Extra grande</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Tamaño del subtítulo</Label>
                        <Select
                          value={formData.styles?.subtitleSize}
                          onValueChange={(value) => handleStyleChange("subtitleSize", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tamaño" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text-sm md:text-base">Pequeño</SelectItem>
                            <SelectItem value="text-base md:text-lg">Mediano</SelectItem>
                            <SelectItem value="text-lg md:text-xl">Grande</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Sombra de texto</Label>
                        <Select
                          value={formData.styles?.textShadow}
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
                    </TabsContent>

                    <TabsContent value="layout" className="space-y-4">
                      <div className="space-y-2">
                        <Label>Altura de la sección</Label>
                        <Select
                          value={formData.styles?.height}
                          onValueChange={(value) => handleStyleChange("height", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar altura" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="min-h-[300px]">Baja (300px)</SelectItem>
                            <SelectItem value="min-h-[400px]">Media (400px)</SelectItem>
                            <SelectItem value="min-h-[500px]">Alta (500px)</SelectItem>
                            <SelectItem value="min-h-[600px]">Muy alta (600px)</SelectItem>
                            <SelectItem value="min-h-screen">Pantalla completa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Ancho del contenido</Label>
                        <Select
                          value={formData.styles?.contentWidth}
                          onValueChange={(value) => handleStyleChange("contentWidth", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar ancho" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="max-w-md">Estrecho</SelectItem>
                            <SelectItem value="max-w-xl">Medio</SelectItem>
                            <SelectItem value="max-w-3xl">Ancho</SelectItem>
                            <SelectItem value="max-w-5xl">Muy ancho</SelectItem>
                            <SelectItem value="max-w-full">Completo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Relleno del contenido</Label>
                        <Select
                          value={formData.styles?.contentPadding}
                          onValueChange={(value) => handleStyleChange("contentPadding", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar relleno" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="py-8 px-4 md:py-12">Pequeño</SelectItem>
                            <SelectItem value="py-16 px-6 md:py-24">Normal</SelectItem>
                            <SelectItem value="py-24 px-8 md:py-32">Grande</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Animación</Label>
                        <Select
                          value={formData.styles?.animation}
                          onValueChange={(value) => handleStyleChange("animation", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar animación" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Ninguna</SelectItem>
                            <SelectItem value="animate-fade-in">Desvanecer</SelectItem>
                            <SelectItem value="animate-slide-up">Deslizar hacia arriba</SelectItem>
                            <SelectItem value="animate-slide-in">Deslizar desde el lado</SelectItem>
                            <SelectItem value="animate-zoom-in">Zoom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TabsContent>

                    <TabsContent value="background" className="space-y-4">
                      <div className="space-y-2">
                        <Label>Color de superposición</Label>
                        <Select
                          value={formData.styles?.overlayColor}
                          onValueChange={(value) => handleStyleChange("overlayColor", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar color" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sin superposición</SelectItem>
                            <SelectItem value="bg-black/20">Negro ligero (20%)</SelectItem>
                            <SelectItem value="bg-black/40">Negro medio (40%)</SelectItem>
                            <SelectItem value="bg-black/60">Negro fuerte (60%)</SelectItem>
                            <SelectItem value="bg-black/80">Negro intenso (80%)</SelectItem>
                            <SelectItem value="bg-primary/30">Primario (30%)</SelectItem>
                            <SelectItem value="bg-primary/50">Primario (50%)</SelectItem>
                            <SelectItem value="bg-secondary/30">Secundario (30%)</SelectItem>
                            <SelectItem value="bg-secondary/50">Secundario (50%)</SelectItem>
                            <SelectItem value="bg-blue-900/40">Azul oscuro (40%)</SelectItem>
                            <SelectItem value="bg-red-900/40">Rojo oscuro (40%)</SelectItem>
                            <SelectItem value="bg-green-900/40">Verde oscuro (40%)</SelectItem>
                            <SelectItem value="bg-gradient-to-r from-black/60 to-transparent">
                              Gradiente horizontal
                            </SelectItem>
                            <SelectItem value="bg-gradient-to-b from-black/60 to-transparent">
                              Gradiente vertical
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Posición del fondo</Label>
                        <Select
                          value={formData.styles?.backgroundPosition}
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
                        <Label>Tamaño del fondo</Label>
                        <Select
                          value={formData.styles?.backgroundSize}
                          onValueChange={(value) => handleStyleChange("backgroundSize", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tamaño" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bg-cover">Cubrir</SelectItem>
                            <SelectItem value="bg-contain">Contener</SelectItem>
                            <SelectItem value="bg-auto">Automático</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Estilo del botón</Label>
                        <Select
                          value={formData.styles?.buttonVariant as string}
                          onValueChange={(value) => handleStyleChange("buttonVariant", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar estilo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Predeterminado</SelectItem>
                            <SelectItem value="outline">Contorno</SelectItem>
                            <SelectItem value="secondary">Secundario</SelectItem>
                            <SelectItem value="destructive">Destacado</SelectItem>
                            <SelectItem value="ghost">Fantasma</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Tamaño del botón</Label>
                        <Select
                          value={formData.styles?.buttonSize as string}
                          onValueChange={(value) => handleStyleChange("buttonSize", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tamaño" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sm">Pequeño</SelectItem>
                            <SelectItem value="default">Mediano</SelectItem>
                            <SelectItem value="lg">Grande</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </>
  )
}

