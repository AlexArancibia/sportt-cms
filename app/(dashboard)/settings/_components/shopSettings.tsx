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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageUploadZone } from "@/components/ui/image-upload-zone"
import {
  Loader2,
  Palette,
  MapPin,
  CreditCard,
  Truck,
  MessageCircle,
  Settings,
  Globe,
  BarChart3,
  Shield,
  ImageIcon,
  Mail,
  Phone,
  Sparkles,
  Building,
  Clock,
  Scale,
} from "lucide-react"
import type { ShopSettings, UpdateShopSettingsDto } from "@/types/store"
import type { Currency } from "@/types/currency"

// Esquema de validación simplificado
const formSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  domain: z.string().min(1, "El dominio es requerido"),
  email: z.string().optional(),
  description: z.string().optional(),
  shopOwner: z.string().optional(),
  logo: z.string().optional(),
  logo2: z.string().optional(),
  logo3: z.string().optional(),
  address1: z.string().optional(),
  address2: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  provinceCode: z.string().optional(),
  country: z.string().optional(),
  countryCode: z.string().optional(),
  zip: z.string().optional(),
  phone: z.string().optional(),
  defaultCurrencyId: z.string().min(1, "Debe seleccionar una moneda"),
  multiCurrencyEnabled: z.boolean().default(false),
  shippingZones: z.string().optional(),
  defaultShippingRate: z.string().optional(),
  freeShippingThreshold: z.string().optional(),
  taxesIncluded: z.boolean().default(false),
  taxValue: z.string().optional(),
  timezone: z.string().optional(),
  weightUnit: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  theme: z.string().optional(),
  facebookUrl: z.string().optional(),
  instagramUrl: z.string().optional(),
  twitterUrl: z.string().optional(),
  tiktokUrl: z.string().optional(),
  youtubeUrl: z.string().optional(),
  googleAnalyticsId: z.string().optional(),
  facebookPixelId: z.string().optional(),
  supportEmail: z.string().optional(),
  supportPhone: z.string().optional(),
  liveChatEnabled: z.boolean().default(false),
  status: z.string().optional(),
  maintenanceMode: z.boolean().default(false),
  multiLanguageEnabled: z.boolean().default(false),
  cookieConsentEnabled: z.boolean().default(false),
  gdprCompliant: z.boolean().default(false),
  ccpaCompliant: z.boolean().default(false),
  enableWishlist: z.boolean().default(false),
})

interface ShopSettingsFormProps {
  shopSettings: ShopSettings | null
  currencies: Currency[]
}

const timezones = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
]

const weightUnits = [
  { value: "kg", label: "Kilogramos (kg)" },
  { value: "lb", label: "Libras (lb)" },
  { value: "g", label: "Gramos (g)" },
  { value: "oz", label: "Onzas (oz)" },
]

const themes = [
  { value: "light", label: "Claro" },
  { value: "dark", label: "Oscuro" },
  { value: "auto", label: "Automático" },
]

const statusOptions = [
  { value: "active", label: "Activo" },
  { value: "inactive", label: "Inactivo" },
  { value: "draft", label: "Borrador" },
]

export default function ShopSettingsForm({ shopSettings, currencies }: ShopSettingsFormProps) {
  const { updateShopSettings, createShopSettings, currentStore } = useMainStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: shopSettings?.name || "",
      domain: shopSettings?.domain || "",
      email: shopSettings?.email || "",
      description: shopSettings?.description || "",
      shopOwner: shopSettings?.shopOwner || "",
      logo: shopSettings?.logo || "",
      logo2: shopSettings?.logo2 || "",
      logo3: shopSettings?.logo3 || "",
      defaultCurrencyId: shopSettings?.defaultCurrencyId || (currencies.length > 0 ? currencies[0].id : ""),
      multiCurrencyEnabled: shopSettings?.multiCurrencyEnabled || false,
      taxesIncluded: shopSettings?.taxesIncluded || false,
      taxValue: shopSettings?.taxValue?.toString() || "",
      primaryColor: shopSettings?.primaryColor || "",
      secondaryColor: shopSettings?.secondaryColor || "",
      supportEmail: shopSettings?.supportEmail || "",
      supportPhone: shopSettings?.supportPhone || "",
      liveChatEnabled: shopSettings?.liveChatEnabled || false,
      maintenanceMode: shopSettings?.maintenanceMode || false,
      address1: shopSettings?.address1 || "",
      address2: shopSettings?.address2 || "",
      city: shopSettings?.city || "",
      province: shopSettings?.province || "",
      provinceCode: shopSettings?.provinceCode || "",
      country: shopSettings?.country || "",
      countryCode: shopSettings?.countryCode || "",
      zip: shopSettings?.zip || "",
      phone: shopSettings?.phone || "",
      status: shopSettings?.status || "active",
      multiLanguageEnabled: shopSettings?.multiLanguageEnabled || false,
      shippingZones: shopSettings?.shippingZones || "",
      defaultShippingRate: shopSettings?.defaultShippingRate?.toString() || "",
      freeShippingThreshold: shopSettings?.freeShippingThreshold?.toString() || "",
      timezone: shopSettings?.timezone || "",
      weightUnit: shopSettings?.weightUnit || "",
      theme: shopSettings?.theme || "",
      facebookUrl: shopSettings?.facebookUrl || "",
      instagramUrl: shopSettings?.instagramUrl || "",
      twitterUrl: shopSettings?.twitterUrl || "",
      tiktokUrl: shopSettings?.tiktokUrl || "",
      youtubeUrl: shopSettings?.youtubeUrl || "",
      googleAnalyticsId: shopSettings?.googleAnalyticsId || "",
      facebookPixelId: shopSettings?.facebookPixelId || "",
      cookieConsentEnabled: shopSettings?.cookieConsentEnabled || false,
      gdprCompliant: shopSettings?.gdprCompliant || false,
      ccpaCompliant: shopSettings?.ccpaCompliant || false,
      enableWishlist: shopSettings?.enableWishlist || false,
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
      // Convertir valores vacíos a null y números
      const processedValues = {
        ...values,
        email: values.email || null,
        description: values.description || null,
        shopOwner: values.shopOwner || null,
        logo: values.logo || null,
        logo2: values.logo2 || null,
        logo3: values.logo3 || null,
        address1: values.address1 || null,
        address2: values.address2 || null,
        city: values.city || null,
        province: values.province || null,
        provinceCode: values.provinceCode || null,
        country: values.country || null,
        countryCode: values.countryCode || null,
        zip: values.zip || null,
        phone: values.phone || null,
        shippingZones: values.shippingZones || null,
        defaultShippingRate: values.defaultShippingRate ? Number(values.defaultShippingRate) : null,
        freeShippingThreshold: values.freeShippingThreshold ? Number(values.freeShippingThreshold) : null,
        taxValue: values.taxValue ? Number(values.taxValue) : null,
        timezone: values.timezone || null,
        weightUnit: values.weightUnit || null,
        primaryColor: values.primaryColor || null,
        secondaryColor: values.secondaryColor || null,
        theme: values.theme || null,
        facebookUrl: values.facebookUrl || null,
        instagramUrl: values.instagramUrl || null,
        twitterUrl: values.twitterUrl || null,
        tiktokUrl: values.tiktokUrl || null,
        youtubeUrl: values.youtubeUrl || null,
        googleAnalyticsId: values.googleAnalyticsId || null,
        facebookPixelId: values.facebookPixelId || null,
        supportEmail: values.supportEmail || null,
        supportPhone: values.supportPhone || null,
        status: values.status || "active",
      }

      if (shopSettings) {
        await updateShopSettings(shopSettings.id, processedValues as UpdateShopSettingsDto)
        toast({
          title: "Configuración actualizada",
          description: "Los cambios se han guardado correctamente",
        })
      } else {
        const newSettings = {
          ...processedValues,
          storeId: currentStore,
        }
        await createShopSettings(newSettings)
        toast({
          title: "Configuración creada",
          description: "Tu tienda ha sido configurada exitosamente",
        })
      }
    } catch (error) {
      console.error("Error al guardar la configuración:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar la configuración. Intenta nuevamente.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handlers para los logos
  const handleLogoUpload = (logoField: "logo" | "logo2" | "logo3") => (fileUrl: string) => {
    form.setValue(logoField, fileUrl)
    toast({
      title: "Logo subido",
      description: "El logo se ha subido correctamente",
    })
  }

  const handleLogoRemove = (logoField: "logo" | "logo2" | "logo3") => () => {
    form.setValue(logoField, "")
  }

  const handleLogoError = (error: string) => {
    toast({
      variant: "destructive",
      title: "Error al subir logo",
      description: error,
    })
  }

  return (
    <div className="w-full p-2 md:p-2 space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Grid principal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Información básica */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 bg-blue-500 dark:bg-blue-600 rounded-lg">
                    <Building className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-blue-700 dark:text-blue-300">Información Básica</span>
                </CardTitle>
                <CardDescription>Los datos fundamentales de tu tienda</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre de la tienda *</FormLabel>
                        <FormControl>
                          <Input placeholder="Mi Tienda Increíble" {...field} />
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
                        <FormLabel>Dominio *</FormLabel>
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
                        <FormLabel className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                          Email
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="contacto@mitienda.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="shopOwner"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Propietario</FormLabel>
                        <FormControl>
                          <Input placeholder="Juan Pérez" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe tu tienda, productos y lo que la hace especial..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona el estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {statusOptions.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Logos */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 bg-purple-500 dark:bg-purple-600 rounded-lg">
                    <ImageIcon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-purple-700 dark:text-purple-300">Logos</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="logo"
                
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo Principal</FormLabel>
                      <FormControl>
                        <ImageUploadZone
                          currentImage={field.value}
                          onImageUploaded={handleLogoUpload("logo")}
                          onRemoveImage={handleLogoRemove("logo")}
                          onError={handleLogoError}
                          placeholder="Sube tu logo principal"
                          variant="card"
                          maxFileSize={5}
                          
                          className="h-24 "
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="logo2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo Secundario</FormLabel>
                      <FormControl>
                        <ImageUploadZone
                          currentImage={field.value}
                          onImageUploaded={handleLogoUpload("logo2")}
                          onRemoveImage={handleLogoRemove("logo2")}
                          onError={handleLogoError}
                          placeholder="Logo alternativo"
                          variant="compact"
                          maxFileSize={5}
                          className="h-24 "
                  
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="logo3"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo Adicional</FormLabel>
                      <FormControl>
                        <ImageUploadZone
                          currentImage={field.value}
                          onImageUploaded={handleLogoUpload("logo3")}
                          onRemoveImage={handleLogoRemove("logo3")}
                          onError={handleLogoError}
                          placeholder="Logo extra"
                          variant="compact"
                          maxFileSize={5}
                        className="h-24 "
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Segunda fila */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ubicación */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 bg-green-500 dark:bg-green-600 rounded-lg">
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-green-700 dark:text-green-300">Ubicación</span>
                </CardTitle>
                <CardDescription>Dirección física y contacto</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="address1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dirección 1</FormLabel>
                        <FormControl>
                          <Input placeholder="Calle Principal 123" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dirección 2</FormLabel>
                        <FormControl>
                          <Input placeholder="Apt, suite, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ciudad</FormLabel>
                        <FormControl>
                          <Input placeholder="Madrid" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="province"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Provincia</FormLabel>
                        <FormControl>
                          <Input placeholder="Madrid" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>País</FormLabel>
                        <FormControl>
                          <Input placeholder="España" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="zip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código postal</FormLabel>
                        <FormControl>
                          <Input placeholder="28001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-green-500 dark:text-green-400" />
                        Teléfono
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="+34 123 456 789" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Comercio */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 bg-orange-500 dark:bg-orange-600 rounded-lg">
                    <CreditCard className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-orange-700 dark:text-orange-300">Comercio</span>
                </CardTitle>
                <CardDescription>Monedas, impuestos y ventas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="defaultCurrencyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Moneda predeterminada *</FormLabel>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="taxValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Impuesto (%)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="21" min="0" max="100" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center justify-center">
                    <FormField
                      control={form.control}
                      name="taxesIncluded"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel>Impuestos incluidos</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="multiCurrencyEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-lg border p-3">
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-medium">Múltiples monedas</FormLabel>
                          <FormDescription className="text-xs">Permitir diferentes monedas</FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="enableWishlist"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-lg border p-3">
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-medium">Lista de deseos</FormLabel>
                          <FormDescription className="text-xs">Permitir guardar productos</FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tercera fila */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Apariencia */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 bg-pink-500 dark:bg-pink-600 rounded-lg">
                    <Palette className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-pink-700 dark:text-pink-300">Apariencia</span>
                </CardTitle>
                <CardDescription>Colores y tema visual</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="primaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color primario</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="#6366f1" {...field} />
                        </FormControl>
                        <Input
                          type="color"
                          className="w-12 p-1 h-10"
                          value={field.value || "#6366f1"}
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
                          <Input placeholder="#f1f5f9" {...field} />
                        </FormControl>
                        <Input
                          type="color"
                          className="w-12 p-1 h-10"
                          value={field.value || "#f1f5f9"}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="theme"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tema</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona tema" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {themes.map((theme) => (
                            <SelectItem key={theme.value} value={theme.value}>
                              {theme.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Envío */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 bg-cyan-500 dark:bg-cyan-600 rounded-lg">
                    <Truck className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-cyan-700 dark:text-cyan-300">Envío</span>
                </CardTitle>
                <CardDescription>Configuración de entregas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="shippingZones"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zonas de envío</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="España, Francia, Portugal..."
                          className="resize-none"
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="defaultShippingRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tarifa estándar</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="5.99" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="freeShippingThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Envío gratuito desde</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="50.00" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Configuración */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 bg-violet-500 dark:bg-violet-600 rounded-lg">
                    <Settings className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-violet-700 dark:text-violet-300">Configuración</span>
                </CardTitle>
                <CardDescription>Ajustes generales</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-violet-500 dark:text-violet-400" />
                        Zona horaria
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona zona" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {timezones.map((timezone) => (
                            <SelectItem key={timezone.value} value={timezone.value}>
                              {timezone.label}
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
                  name="weightUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Scale className="w-4 h-4 text-violet-500 dark:text-violet-400" />
                        Unidad de peso
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona unidad" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {weightUnits.map((unit) => (
                            <SelectItem key={unit.value} value={unit.value}>
                              {unit.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="maintenanceMode"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel>Modo mantenimiento</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="multiLanguageEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel>Múltiples idiomas</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cuarta fila */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Redes sociales */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 bg-indigo-500 dark:bg-indigo-600 rounded-lg">
                    <Globe className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-indigo-700 dark:text-indigo-300">Redes Sociales</span>
                </CardTitle>
                <CardDescription>Enlaces a tus perfiles sociales</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="facebookUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Facebook</FormLabel>
                        <FormControl>
                          <Input placeholder="https://facebook.com/mitienda" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="instagramUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instagram</FormLabel>
                        <FormControl>
                          <Input placeholder="https://instagram.com/mitienda" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="twitterUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Twitter/X</FormLabel>
                        <FormControl>
                          <Input placeholder="https://twitter.com/mitienda" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tiktokUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>TikTok</FormLabel>
                        <FormControl>
                          <Input placeholder="https://tiktok.com/@mitienda" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="youtubeUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>YouTube</FormLabel>
                      <FormControl>
                        <Input placeholder="https://youtube.com/c/mitienda" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Soporte y analítica */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 bg-emerald-500 dark:bg-emerald-600 rounded-lg">
                    <MessageCircle className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-emerald-700 dark:text-emerald-300">Soporte & Analítica</span>
                </CardTitle>
                <CardDescription>Atención al cliente y seguimiento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="supportEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                          Email soporte
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="soporte@mitienda.com" {...field} />
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
                        <FormLabel className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                          Teléfono soporte
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="+34 900 123 456" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="googleAnalyticsId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                          Google Analytics
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="GA-XXXXXXXXX-X" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="facebookPixelId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Facebook Pixel</FormLabel>
                        <FormControl>
                          <Input placeholder="123456789012345" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="liveChatEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-lg border p-3">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm font-medium">Chat en vivo</FormLabel>
                        <FormDescription className="text-xs">Habilitar soporte inmediato</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Cumplimiento legal */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="p-2 bg-slate-500 dark:bg-slate-600 rounded-lg">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="text-slate-700 dark:text-slate-300">Cumplimiento Legal</span>
              </CardTitle>
              <CardDescription>Configuración de privacidad y cumplimiento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="cookieConsentEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-lg border p-3">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm font-medium">Cookies</FormLabel>
                        <FormDescription className="text-xs">Banner de consentimiento</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gdprCompliant"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-lg border p-3">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm font-medium">GDPR</FormLabel>
                        <FormDescription className="text-xs">Cumplimiento europeo</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ccpaCompliant"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-lg border p-3">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm font-medium">CCPA</FormLabel>
                        <FormDescription className="text-xs">Privacidad California</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Botón de envío */}
          <div className="flex items-center justify-center pt-6">
            <Button type="submit" disabled={isSubmitting} size="lg" className="min-w-[200px] h-12">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Guardar Configuración
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
