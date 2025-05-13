"use client"

import type React from "react"
import { format, parseISO } from "date-fns"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useMainStore } from "@/stores/mainStore"
import { useToast } from "@/hooks/use-toast"
import { HeaderBar } from "@/components/HeaderBar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ContentType } from "@/types/common"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import type { CreateContentDto } from "@/types/content"
import { ImageUpload } from "@/components/ImageUpload"
import { RichTextEditor } from "../_components/RichTextEditor"

export default function NewContentPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { 
    createContent, 
    currentStore, // ID de la tienda
    stores, // Lista de tiendas para obtener el ownerId
    loading, 
    error 
  } = useMainStore()
  
  // Obtenemos el store completo para acceder al ownerId
  const store = stores.find(s => s.id === currentStore)
  
  const [content, setContent] = useState<CreateContentDto>({
    storeId: currentStore || "",
    title: "",
    slug: "",
    body: "",
    type: ContentType.PAGE,
    authorId: store?.ownerId || "", // Usamos el ownerId como authorId
    published: false,
    publishedAt: undefined,
    featuredImage: "",
    metadata: {},
    category: ""
  })
  
  const [featuredImage, setFeaturedImage] = useState("")

  useEffect(() => {
    if (!currentStore) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No hay una tienda seleccionada",
      })
      router.push("/")
      return
    }

    // Actualizamos el storeId y authorId cuando currentStore cambia
    const currentStoreData = stores.find(s => s.id === currentStore)
    setContent(prev => ({ 
      ...prev, 
      storeId: currentStore,
      authorId: currentStoreData?.ownerId || "" 
    }))
  }, [currentStore, stores, router, toast])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setContent(prev => ({ 
      ...prev, 
      [name]: name === "publishedAt" ? (value ? parseISO(value) : undefined) : value 
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setContent(prev => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setContent(prev => ({ ...prev, [name]: checked }))
  }

  const handleImageUpload = (imageUrl: string) => {
    setFeaturedImage(imageUrl)
    setContent(prev => ({ ...prev, featuredImage: imageUrl }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentStore || !store?.ownerId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No hay una tienda seleccionada o no tiene dueño asignado",
      })
      return
    }

    try {
      await createContent({
        ...content,
        storeId: currentStore,
        authorId: store.ownerId, // Forzamos el ownerId como authorId
        featuredImage,
      })
      
      toast({
        title: "Éxito",
        description: "Contenido creado correctamente",
      })
      router.push("/contents")
    } catch (error) {
      console.error("Error creating content:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear el contenido",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center text-red-500">{error}</div>
      </div>
    )
  }

  if (!currentStore || !store) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">No hay tienda seleccionada o no se encontraron datos</div>
      </div>
    )
  }

  return (
    <>
      <HeaderBar title="Crear Nuevo Contenido" />
      <div className="container-section">
        <Card>
          <CardHeader>
            <CardTitle>
              Crear Contenido para: {store.name}
              <span className="block text-sm text-muted-foreground">
                Autor: {store.owner?.firstName} {store.owner?.lastName}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input 
                    id="title" 
                    name="title" 
                    value={content.title} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>
                
                <div>
                  <Label htmlFor="slug">Slug *</Label>
                  <Input 
                    id="slug" 
                    name="slug" 
                    value={content.slug} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="type">Tipo de Contenido *</Label>
                <Select 
                  name="type" 
                  value={content.type} 
                  onValueChange={(value) => handleSelectChange("type", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ContentType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="body">Contenido</Label>
                <RichTextEditor
                  content={content.body || ""}
                  onChange={(value) => setContent(prev => ({ ...prev, body: value }))}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Categoría</Label>
                  <Input 
                    id="category" 
                    name="category" 
                    value={content.category || ""} 
                    onChange={handleInputChange} 
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="featuredImage">Imagen Destacada</Label>
                <ImageUpload
                  onImageUpload={handleImageUpload}
                  currentImageUrl={content.featuredImage}
                  width={800}
                  height={450}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="published"
                    checked={content.published}
                    onCheckedChange={(checked) => handleSwitchChange("published", checked)}
                  />
                  <Label htmlFor="published">Publicar contenido</Label>
                </div>
                
                {content.published && (
                  <div className="w-full md:w-auto">
                    <Label htmlFor="publishedAt">Fecha de publicación</Label>
                    <Input
                      id="publishedAt"
                      name="publishedAt"
                      type="datetime-local"
                      value={content.publishedAt ? format(content.publishedAt, "yyyy-MM-dd'T'HH:mm") : ""}
                      onChange={handleInputChange}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push("/contents")}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creando...
                    </>
                  ) : "Crear Contenido"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  )
}