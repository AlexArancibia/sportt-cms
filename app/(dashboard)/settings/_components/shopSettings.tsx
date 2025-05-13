"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMainStore } from "@/stores/mainStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Loader2 } from "lucide-react"

// Esquema de validación para el formulario
const formSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  domain: z.string().min(3, "El dominio debe tener al menos 3 caracteres"),
  email: z.string().email("Correo electrónico inválido").optional().nullable(),
  description: z.string().optional().nullable(),
  shopOwner: z.string().optional().nullable(),
  logo: z.string().optional().nullable(),
  defaultCurrencyId: z.string().min(1, "Debe seleccionar una moneda predeterminada"),
  multiCurrencyEnabled: z.boolean().default(false),
  taxesIncluded: z.boolean().default(false),
  taxValue: z.coerce.number().min(0).max(100).optional().nullable(),
  primaryColor: z.string().optional().nullable(),
  secondaryColor: z.string().optional().nullable(),
  supportEmail: z.string().email("Correo electrónico inválido").optional().nullable(),
  supportPhone: z.string().optional().nullable(),
  liveChatEnabled: z.boolean().default(false),
  maintenanceMode: z.boolean().default(false),
})

interface ShopSettingsFormProps {
  shopSettings: any
  currencies: any[]
}

export default function ShopSettingsForm({ shopSettings, currencies }: ShopSettingsFormProps) {
  const { updateShopSettings, createShopSettings, currentStore } = useMainStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Inicializar el formulario con los valores existentes o valores predeterminados
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: shopSettings
      ? {
          name: shopSettings.name || "",
          domain: shopSettings.domain || "",
          email: shopSettings.email || "",
          description: shopSettings.description || "",
          shopOwner: shopSettings.shopOwner || "",
          logo: shopSettings.logo || "",
          defaultCurrencyId: shopSettings.defaultCurrencyId || "",
          multiCurrencyEnabled: shopSettings.multiCurrencyEnabled || false,
          taxesIncluded: shopSettings.taxesIncluded || false,
          taxValue: shopSettings.taxValue || null,
          primaryColor: shopSettings.primaryColor || "",
          secondaryColor: shopSettings.secondaryColor || "",
          supportEmail: shopSettings.supportEmail || "",
          supportPhone: shopSettings.supportPhone || "",
          liveChatEnabled: shopSettings.liveChatEnabled || false,
          maintenanceMode: shopSettings.maintenanceMode || false,
        }
      : {
          name: "",
          domain: "",
          email: "",
          description: "",
          shopOwner: "",
          logo: "",
          defaultCurrencyId: currencies.length > 0 ? currencies[0].id : "",
          multiCurrencyEnabled: false,
          taxesIncluded: false,
          taxValue: null,
          primaryColor: "",
          secondaryColor: "",
          supportEmail: "",
          supportPhone: "",
          liveChatEnabled: false,
          maintenanceMode: false,
        },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!currentStore) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No hay una tienda seleccionada",
      })
      return
    }

    setIsSubmitting(true)
    try {
      if (shopSettings) {
        // Actualizar configuración existente
        await updateShopSettings(shopSettings.id, values)
        toast({
          title: "Configuración actualizada",
          description: "La configuración de la tienda ha sido actualizada correctamente",
        })
      } else {
        // Crear nueva configuración
        const newSettings = {
          ...values,
          storeId: currentStore,
        }
        await createShopSettings(newSettings)
        toast({
          title: "Configuración creada",
          description: "La configuración de la tienda ha sido creada correctamente",
        })
      }
    } catch (error) {
      console.error("Error al guardar la configuración:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar la configuración. Por favor, intente nuevamente.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Información básica */}
          <div className="space-y-6">
            <div className="border-b pb-2">
              <h3 className="text-lg font-medium">Información básica</h3>
              <p className="text-sm text-muted-foreground">Configura la información principal de tu tienda.</p>
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la tienda</FormLabel>
                  <FormControl>
                    <Input placeholder="Mi Tienda" {...field} className="focus-visible:ring-primary" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="domain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dominio</FormLabel>
                  <FormControl>
                    <Input placeholder="mitienda.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo electrónico</FormLabel>
                  <FormControl>
                    <Input placeholder="contacto@mitienda.com" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descripción de tu tienda"
                      className="resize-none"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Configuración de moneda y impuestos */}
          <div className="space-y-6">
            <div className="border-b pb-2">
              <h3 className="text-lg font-medium">Moneda e impuestos</h3>
              <p className="text-sm text-muted-foreground">Configura la moneda predeterminada y los impuestos.</p>
            </div>

            <FormField
              control={form.control}
              name="defaultCurrencyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Moneda predeterminada</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una moneda" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.id} value={currency.id}>
                          {currency.name} ({currency.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="multiCurrencyEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Múltiples monedas</FormLabel>
                    <FormDescription>Permitir a los clientes comprar en diferentes monedas</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="taxesIncluded"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Impuestos incluidos</FormLabel>
                    <FormDescription>Los precios incluyen impuestos</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="taxValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor del impuesto (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      value={field.value === null ? "" : field.value}
                      onChange={(e) => {
                        const value = e.target.value === "" ? null : Number.parseFloat(e.target.value)
                        field.onChange(value)
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Configuración de apariencia */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Apariencia</h3>
            <p className="text-sm text-muted-foreground">Personaliza la apariencia de tu tienda.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="primaryColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color primario</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input placeholder="#000000" {...field} value={field.value || ""} />
                    </FormControl>
                    <Input
                      type="color"
                      className="w-12 p-1 h-10"
                      value={field.value || "#000000"}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="secondaryColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color secundario</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input placeholder="#ffffff" {...field} value={field.value || ""} />
                    </FormControl>
                    <Input
                      type="color"
                      className="w-12 p-1 h-10"
                      value={field.value || "#ffffff"}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Configuración de soporte */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Soporte y mantenimiento</h3>
            <p className="text-sm text-muted-foreground">
              Configura las opciones de soporte y mantenimiento de tu tienda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="supportEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo de soporte</FormLabel>
                  <FormControl>
                    <Input placeholder="soporte@mitienda.com" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="supportPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono de soporte</FormLabel>
                  <FormControl>
                    <Input placeholder="+1234567890" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="liveChatEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Chat en vivo</FormLabel>
                    <FormDescription>Habilitar chat en vivo para soporte</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maintenanceMode"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Modo mantenimiento</FormLabel>
                    <FormDescription>Activar modo de mantenimiento</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto bg-primary hover:bg-primary/90">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            "Guardar configuración"
          )}
        </Button>
      </form>
    </Form>
  )
}
