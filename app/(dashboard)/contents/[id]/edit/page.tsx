"use client"

import type React from "react"
import { format, parseISO } from "date-fns"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
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
import type { UpdateContentDto } from "@/types/content"
import { RichTextEditor } from "../../_components/RichTextEditor"
 

export default function ContentDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { fetchContent, updateContent, createContent, loading, error } = useMainStore()
  const [content, setContent] = useState<UpdateContentDto>({
    title: "",
    slug: "",
    body: "",
    type: ContentType.PAGE,
    authorId: "",
    published: false,
    publishedAt: undefined,
    featuredImage: "",
    metadata: {},
  })

  useEffect(() => {
    const loadContent = async () => {
      if (id === "new") return
      try {
        const fetchedContent = await fetchContent(id as string)
        setContent({
          ...fetchedContent,
          publishedAt: fetchedContent.publishedAt ? new Date(fetchedContent.publishedAt) : undefined,
        })
      } catch (error) {
        console.error("Error fetching content:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo cargar el contenido",
        })
      }
    }
    loadContent()
  }, [id, fetchContent, toast])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (name === "publishedAt") {
      setContent((prev) => ({ ...prev, [name]: value ? parseISO(value) : undefined }))
    } else {
      setContent((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setContent((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setContent((prev) => ({ ...prev, [name]: checked }))
  }

  const handleRichTextChange = (newContent: string) => {
    setContent((prev) => ({ ...prev, body: newContent }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const contentToSubmit: UpdateContentDto = {
        ...content,
        publishedAt: content.publishedAt,
      }
      await updateContent(id as string, contentToSubmit)
      toast({
        title: "Éxito",
        description: "Contenido actualizado correctamente",
      })
      router.push("/contents")
    } catch (error) {
      console.error("Error updating content:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el contenido",
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

  return (
    <>
      <HeaderBar title={id === "new" ? "Crear Contenido" : "Editar Contenido"} />
      <div className="container-section">
        <Card>
          <CardHeader>
            <CardTitle>{id === "new" ? "Crear Nuevo Contenido" : "Editar Contenido"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Título</Label>
                <Input id="title" name="title" value={content.title} onChange={handleInputChange} required />
              </div>
              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" name="slug" value={content.slug} onChange={handleInputChange} required />
              </div>
              <div>
                <Label htmlFor="body">Contenido</Label>
                <RichTextEditor content={content.body || ""} onChange={handleRichTextChange} />
              </div>
              <div>
                <Label htmlFor="type">Tipo</Label>
                <Select name="type" value={content.type} onValueChange={(value) => handleSelectChange("type", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
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
                <Label htmlFor="authorId">ID del Autor</Label>
                <Input id="authorId" name="authorId" value={content.authorId || ""} onChange={handleInputChange} />
              </div>
              <div>
                <Label htmlFor="featuredImage">Imagen Destacada</Label>
                <Input
                  id="featuredImage"
                  name="featuredImage"
                  value={content.featuredImage || ""}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="published"
                  checked={content.published}
                  onCheckedChange={(checked) => handleSwitchChange("published", checked)}
                />
                <Label htmlFor="published">Publicado</Label>
              </div>
              {content.published && (
                <div>
                  <Label htmlFor="publishedAt">Fecha de Publicación</Label>
                  <Input
                    id="publishedAt"
                    name="publishedAt"
                    type="datetime-local"
                    value={content.publishedAt ? format(content.publishedAt, "yyyy-MM-dd'T'HH:mm") : ""}
                    onChange={handleInputChange}
                  />
                </div>
              )}
              <Button type="submit">{id === "new" ? "Crear Contenido" : "Actualizar Contenido"}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

