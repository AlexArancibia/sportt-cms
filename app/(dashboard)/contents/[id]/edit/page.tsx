"use client"

import type React from "react"
import { format, parseISO } from "date-fns"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useStores } from "@/hooks/useStores"
import { useContentById, useContentMutations } from "@/hooks/useContents"
import { useUsers } from "@/hooks/useUsers"
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
import { ImageUpload } from "@/components/ImageUpload"
import { RichTextEditor } from "@/components/RichTextEditor"
import { slugify } from "@/lib/slugify"
import { getApiErrorMessage } from "@/lib/errorHelpers"

type ContentFormState = {
  title: string
  slug: string
  body: string | null
  type: ContentType
  authorId: string | null
  published: boolean
  publishedAt?: Date | null
  featuredImage: string | null
  metadata: Record<string, any> | null
  storeId: string
  category?: string | null
}

export default function EditContentPage() {
  const { id } = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { currentStoreId } = useStores()
  const { data: contentItem, isLoading: isLoadingContent, isError } = useContentById(
    currentStoreId ?? null,
    (id as string) ?? null,
    !!currentStoreId && !!id
  )
  const { updateContent, isUpdating } = useContentMutations(currentStoreId ?? null)

  const [content, setContent] = useState<ContentFormState>({
    title: "",
    slug: "",
    body: "",
    type: ContentType.PAGE,
    authorId: "",
    published: false,
    publishedAt: undefined,
    featuredImage: "",
    metadata: {},
    storeId: "",
    category: null,
  })
  const { data: usersData } = useUsers(currentStoreId ?? null, !!currentStoreId)
  const users = (usersData ?? []).map((user) => ({ id: user.id, name: `${user.firstName} ${user.lastName}` }))
  const [featuredImage, setFeaturedImage] = useState("")


  useEffect(() => {
    if (contentItem) {
      setContent({
        title: contentItem.title,
        slug: contentItem.slug,
        body: contentItem.body || "",
        type: contentItem.type,
        authorId: contentItem.authorId || null,
        published: contentItem.published,
        publishedAt: contentItem.publishedAt ? new Date(contentItem.publishedAt) : null,
        featuredImage: contentItem.featuredImage || null,
        metadata: contentItem.metadata || {},
        storeId: contentItem.storeId,
        category: contentItem.category || null,
      })
      setFeaturedImage(contentItem.featuredImage || "")
    }
  }, [contentItem])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  const { name, value } = e.target

  if (name === "publishedAt") {
    setContent((prev) => ({ ...prev, [name]: value ? parseISO(value) : undefined }))
  } else {
    setContent((prev) => {
      const updated = { ...prev, [name]: value }

      // Si se cambia el título o el slug, actualizamos el slug
      if (name === "title" || name === "slug") {
        updated.slug = slugify(value)
      }

      return updated
    })
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
    if (!id || typeof id !== "string") return
    try {
      const contentToSubmit: UpdateContentDto = {
        title: content.title,
        slug: content.slug,
        body: content.body,
        type: content.type,
        authorId: content.authorId,
        published: content.published,
        publishedAt: content.publishedAt,
        featuredImage: featuredImage || null,
        metadata: content.metadata,
        category: content.category,
      }
      await updateContent({ id, data: contentToSubmit })
      toast({
        title: "Éxito",
        description: "Contenido actualizado correctamente",
      })
      router.push("/contents")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: getApiErrorMessage(error, "No se pudo actualizar el contenido"),
      })
    }
  }

  useEffect(() => {
    if (!isLoadingContent && (isError || !contentItem)) {
      router.replace("/contents")
    }
  }, [isLoadingContent, isError, contentItem, router])

  if (isLoadingContent) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isError || !contentItem) {
    return null
  }

  return (
    <>
      <HeaderBar title="Editar Contenido" />
      <div className="container-section">
        <Card>
          <CardHeader>
            <CardTitle>Editar Contenido</CardTitle>
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
                <Label htmlFor="storeId">Tienda</Label>
                <Input
                  id="storeId"
                  name="storeId"
                  value={content.storeId || ""}
                  onChange={handleInputChange}
                  required={false}
                />
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
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Actualizando...
                  </>
                ) : (
                  "Actualizar Contenido"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
