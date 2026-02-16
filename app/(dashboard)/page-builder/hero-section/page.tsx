"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useAuthStore } from "@/stores/authStore"
import apiClient from "@/lib/axiosConfig"
import { HeaderBar } from "@/components/HeaderBar"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import dynamic from "next/dynamic"
import type { PuckData } from "@/lib/page-builder/types"

const COMPONENT_KEY = "hero-section"

const emptyPuckData: PuckData = { root: { props: {} }, content: [] }

/** Backend devuelve { data: { data: <puck> } }; extrae el payload. */
function getPageBuilderPayload<T>(raw: unknown): T | null {
  const d = raw as { data?: { data?: T | null } } | undefined
  return d?.data?.data ?? null
}

export default function PageBuilderHeroSectionPage() {
  const { currentStoreId } = useAuthStore()
  const { toast } = useToast()
  const [data, setData] = useState<PuckData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    if (!currentStoreId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await apiClient.get(
        `/page-builder/${currentStoreId}/${COMPONENT_KEY}`,
      )
      setData(getPageBuilderPayload<PuckData>(res.data))
    } catch (err) {
      console.error("Error fetching page builder data:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar el contenido del Page Builder.",
      })
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [currentStoreId, toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const saveData = useCallback(
    async (newData: PuckData) => {
      if (!currentStoreId) return
      setSaving(true)
      try {
        await apiClient.put(`/page-builder/${currentStoreId}/${COMPONENT_KEY}`, {
          data: newData,
        })
        setData(newData)
        toast({
          title: "Guardado",
          description: "El contenido del Hero Section se guardó correctamente.",
        })
      } catch (err) {
        console.error("Error saving page builder data:", err)
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo guardar el contenido.",
        })
      } finally {
        setSaving(false)
      }
    },
    [currentStoreId, toast],
  )

  if (!currentStoreId) {
    return (
      <>
        <HeaderBar title="Page Builder – Hero Section" />
        <div className="p-4 md:p-6">
          <p className="text-muted-foreground">Selecciona una tienda para continuar.</p>
        </div>
      </>
    )
  }

  if (loading) {
    return (
      <>
        <HeaderBar title="Page Builder – Hero Section" />
        <div className="p-4 md:p-6 flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    )
  }

  return (
    <PageBuilderHeroSectionEditor
      initialData={data ?? emptyPuckData}
      onSave={saveData}
      saving={saving}
    />
  )
}

const PuckEditor = dynamic(
  () => import("@/app/(dashboard)/page-builder/hero-section/PuckEditor").then((m) => m.PuckEditor),
  {
    ssr: false,
    loading: () => (
      <div className="border rounded-lg p-8 bg-muted/30 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    ),
  },
)

function PageBuilderHeroSectionEditor({
  initialData,
  onSave,
  saving,
}: {
  initialData: PuckData
  onSave: (data: PuckData) => Promise<void>
  saving: boolean
}) {
  const [data, setData] = useState<PuckData>(initialData)
  const latestRef = useRef<PuckData>(initialData)

  useEffect(() => {
    setData(initialData)
    latestRef.current = initialData
  }, [initialData])

  const onDataChange = useCallback((d: PuckData) => {
    setData(d)
    latestRef.current = d
  }, [])

  return (
    <>
      <HeaderBar title="Page Builder – Hero Section" />
      <div className="p-4 md:p-6">
        <PuckEditor
          data={data}
          onDataChange={onDataChange}
          onSave={() => onSave(latestRef.current)}
          saving={saving}
        />
      </div>
    </>
  )
}
