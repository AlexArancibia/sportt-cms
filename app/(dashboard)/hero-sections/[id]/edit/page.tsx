"use client"

import type React from "react"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
 
import { useToast } from "@/hooks/use-toast"
import { HeaderBar } from "@/components/HeaderBar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { useMainStore } from "@/stores/mainStore"
import { ImageUpload } from "@/components/ImageUpload"
import { HeroSectionPreview } from "../../new/_components/heroSectionPreview"
 

 

interface UpdateHeroSectionDto {
  title: string
  subtitle: string
  buttonText: string
  buttonLink: string
  backgroundImage: string
  mobileBackgroundImage: string
  styles: {}
  metadata: {}
  isActive: boolean
}
  
export default function EditHeroSectionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const id = resolvedParams.id
  const router = useRouter()
  const { toast } = useToast()
  const { fetchHeroSection, updateHeroSection, fetchShopSettings } = useMainStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<UpdateHeroSectionDto>({
    title: "",
    subtitle: "",
    buttonText: "",
    buttonLink: "",
    backgroundImage: "",
    mobileBackgroundImage: "",
    styles: {},
    metadata: {},
    isActive: true,
  })

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        // Cargar la configuración de la tienda para la subida de imágenes
        await fetchShopSettings()

        // Cargar los datos de la sección hero
        const heroSection = await fetchHeroSection(id)
        setFormData({
          title: heroSection.title || "",
          subtitle: heroSection.subtitle || "",
          buttonText: heroSection.buttonText || "",
          buttonLink: heroSection.buttonLink || "",
          backgroundImage: heroSection.backgroundImage || "",
          mobileBackgroundImage: heroSection.mobileBackgroundImage || "",
          styles: heroSection.styles || {},
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
  }, [id, fetchHeroSection, fetchShopSettings, toast, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, isActive: checked }))
  }

  const handleBackgroundImageUpload = (imageUrl: string) => {
    setFormData((prev) => ({ ...prev, backgroundImage: imageUrl }))
  }

  const handleMobileBackgroundImageUpload = (imageUrl: string) => {
    setFormData((prev) => ({ ...prev, mobileBackgroundImage: imageUrl }))
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
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-6">
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
                  <CardTitle>Imágenes</CardTitle>
                  <CardDescription>Imágenes para escritorio y móvil</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Imagen de fondo (escritorio)</Label>
                    <div className="flex justify-center">
                      <ImageUpload
                        onImageUpload={handleBackgroundImageUpload}
                        currentImageUrl={formData.backgroundImage}
                        width={400}
                        height={200}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Imagen de fondo (móvil)</Label>
                    <div className="flex justify-center">
                      <ImageUpload
                        onImageUpload={handleMobileBackgroundImageUpload}
                        currentImageUrl={formData.mobileBackgroundImage}
                        width={200}
                        height={200}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configuración</CardTitle>
                  <CardDescription>Ajustes de botón y visualización</CardDescription>
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
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch id="isActive" checked={formData.isActive} onCheckedChange={handleSwitchChange} />
                    <Label htmlFor="isActive">Activo</Label>
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

              <Card>
                <CardHeader>
                  <CardTitle>Vista previa</CardTitle>
                  <CardDescription>Así se verá tu sección hero</CardDescription>
                </CardHeader>
                <CardContent>
                  <HeroSectionPreview
                    title={formData.title || "Título de ejemplo"}
                    subtitle={formData.subtitle}
                    buttonText={formData.buttonText}
                    buttonLink={formData.buttonLink}
                    backgroundImage={formData.backgroundImage}
                    mobileBackgroundImage={formData.mobileBackgroundImage}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </>
  )
}

