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
import type { CreateContentDto, UpdateContentDto } from "@/types/content"
import { RichTextEditor } from "../../_components/RichTextEditor"
import { ImageUpload } from "@/components/ImageUpload"

export default function EditContentPage() {
  const { id } = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { fetchContent, updateContent, createContent, fetchUsers, loading, error } = useMainStore()
  const [content, setContent] = useState<UpdateContentDto & Partial<CreateContentDto>>({
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
  const [users, setUsers] = useState<{ id: string; name: string }[]>([])
  const [featuredImage, setFeaturedImage] = useState("")
  const isNewContent = id === "new"

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch users for author dropdown
        const fetchedUsers = await fetchUsers()
        setUsers(fetchedUsers.map((user) => ({ id: user.id, name: `${user.firstName} ${user.lastName}` })))

        // If editing existing content, fetch it
        if (!isNewContent) {
          const fetchedContent = await fetchContent(id as string)

          // Ensure we're properly handling the HTML content in the body field
          setContent({
            ...fetchedContent,
            body: fetchedContent.body || "",
            publishedAt: fetchedContent.publishedAt ? new Date(fetchedContent.publishedAt) : undefined,
          })
          setFeaturedImage(fetchedContent.featuredImage || "")
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los datos",
        })
      }
    }
    loadData()
  }, [id, fetchContent, fetchUsers, toast, isNewContent])

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

  const handleImageUpload = (imageUrl: string) => {
    setFeaturedImage(imageUrl)
    setContent((prev) => ({ ...prev, featuredImage: imageUrl }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Create a new object with ONLY the specified fields
      const contentToSubmit = {
        title: content.title,
        slug: content.slug,
        body: content.body,
        type: content.type,
        authorId: content.authorId,

        published: content.published,
        publishedAt: content.publishedAt,
        featuredImage: featuredImage,
        metadata: content.metadata || {},
      }

      // Add detailed console logging
      console.log("=== CONTENT UPDATE DEBUG ===")
      console.log("Content ID:", id)
      console.log("Is new content:", isNewContent)
      console.log("Content to submit:", JSON.stringify(contentToSubmit, null, 2))
      console.log("Body content length:", contentToSubmit.body?.length || 0)
      console.log("Body content preview:", contentToSubmit.body?.substring(0, 100))
      console.log("=== END DEBUG ===")

      if (isNewContent) {
        await createContent(contentToSubmit as CreateContentDto)
        toast({
          title: "Éxito",
          description: "Contenido creado correctamente",
        })
      } else {
        await updateContent(id as string, contentToSubmit as UpdateContentDto)
        toast({
          title: "Éxito",
          description: "Contenido actualizado correctamente",
        })
      }
      router.push("/contents")
    } catch (error) {
      console.error(`Error ${isNewContent ? "creating" : "updating"} content:`, error)
      console.log("Failed content data:", JSON.stringify(content, null, 2))
      toast({
        variant: "destructive",
        title: "Error",
        description: `No se pudo ${isNewContent ? "crear" : "actualizar"} el contenido`,
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
      <HeaderBar title={isNewContent ? "Crear Contenido" : "Editar Contenido"} />
      <div className="container-section">
        <Card>
          <CardHeader>
            <CardTitle>{isNewContent ? "Crear Nuevo Contenido" : "Editar Contenido"}</CardTitle>
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
                <RichTextEditor
                  content={content.body || ""}
                  onChange={(newContent) => {
                    setContent((prev) => ({ ...prev, body: newContent }))
                  }}
                />
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
                <Label htmlFor="authorId">Autor</Label>
                <Select
                  name="authorId"
                  value={content.authorId || ""}
                  onValueChange={(value) => handleSelectChange("authorId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar autor" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="featuredImage">Imagen Destacada</Label>
                <ImageUpload
                  onImageUpload={handleImageUpload}
                  currentImageUrl={featuredImage}
                  width={300}
                  height={200}
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
              <Button type="submit">{isNewContent ? "Crear Contenido" : "Actualizar Contenido"}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

