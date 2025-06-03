"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useMainStore } from "@/stores/mainStore"

const storeFormSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  slug: z
    .string()
    .min(2, {
      message: "El slug debe tener al menos 2 caracteres.",
    })
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: "El slug solo puede contener letras minúsculas, números y guiones.",
    }),
  isActive: z.boolean().default(true),
  maxProducts: z.string().optional(),
  planType: z.string().optional(),
})

type StoreFormValues = z.infer<typeof storeFormSchema>

export default function StoreSettings() {
  const { currentStore, stores, updateStore, loading } = useMainStore()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)

  const currentStoreData = stores.find((store) => store.id === currentStore)

  const form = useForm<StoreFormValues>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: {
      name: currentStoreData?.name || "",
      slug: currentStoreData?.slug || "",
      isActive: currentStoreData?.isActive ?? true,
      maxProducts: currentStoreData?.maxProducts?.toString() || "",
      planType: currentStoreData?.planType || "",
    },
  })

  async function onSubmit(values: StoreFormValues) {
    if (!currentStore) return

    // Crear una copia de los valores para modificarlos
    const submitValues = {
      ...values,
      // Convertir maxProducts a número solo si tiene un valor
      maxProducts:
        values.maxProducts && values.maxProducts.trim() !== "" ? Number.parseInt(values.maxProducts, 10) : null,
    }

    setIsSaving(true)
    try {
      await updateStore(currentStore, submitValues)
      toast({
        title: "Configuración actualizada",
        description: "La configuración de la tienda se ha actualizado correctamente.",
      })
    } catch (error) {
      console.error("Error updating store settings:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar la configuración de la tienda.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (!currentStoreData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Tienda</CardTitle>
          <CardDescription>No se encontró la tienda seleccionada.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de Tienda</CardTitle>
        <CardDescription>Administre la configuración básica de su tienda.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la tienda</FormLabel>
                  <FormControl>
                    <Input placeholder="Mi Tienda" {...field} />
                  </FormControl>
                  <FormDescription>Este es el nombre público de su tienda.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="mi-tienda" {...field} />
                  </FormControl>
                  <FormDescription>
                    El slug se usa en la URL de su tienda. Solo puede contener letras minúsculas, números y guiones.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Tienda activa</FormLabel>
                    <FormDescription>
                      Cuando está desactivada, la tienda no será accesible para los clientes.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxProducts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Límite de productos</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Ilimitado" {...field} />
                  </FormControl>
                  <FormDescription>
                    Número máximo de productos permitidos. Deje en blanco para ilimitado.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="planType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de plan</FormLabel>
                  <FormControl>
                    <Input placeholder="free, basic, premium" {...field} />
                  </FormControl>
                  <FormDescription>El tipo de plan de suscripción de la tienda.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar cambios
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
