"use client"

import { useEffect, useState } from "react"
import { useMainStore } from "@/stores/mainStore"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Store, Settings, DollarSign, Truck, CreditCard } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { HeaderBar } from "@/components/HeaderBar"
import StoreInfo from "./_components/StoreInfo"
import ShopSettingsForm from "./_components/shopSettings"
import CurrencySettings from "./_components/currencySettings"
import PaymentSettings from "./_components/PaymentSettings"
import   ShippingSettings   from "./_components/ShippingSettings"

export default function SettingsPage() {
  const {
    loading,
    currentStore,
    fetchShopSettings,
    fetchCurrencies,
    fetchStores,
    fetchShippingMethods,
    fetchUsers,
    fetchPaymentProviders,
    stores,
    currencies,
    shopSettings,
    shippingMethods,
    users,
    paymentProviders,
    getCurrentStore,
  } = useMainStore()

  const [activeTab, setActiveTab] = useState("store")
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const [currentStoreData, setCurrentStoreData] = useState<any>(null)

  // Cargar todos los datos necesarios al iniciar
  useEffect(() => {
    const loadAllData = async () => {
      setIsLoading(true)
      try {
        // Cargar monedas (no depende de storeId)
        await fetchCurrencies()
        if (currentStore) {
          await fetchShippingMethodsByStore(currentStore)
        }
        await fetchPaymentProviders()
        await fetchUsers(currentStore || undefined)

        // Obtener la tienda actual
        const store = getCurrentStore()
        setCurrentStoreData(store)

        // Si hay una tienda seleccionada, cargar sus configuraciones
        if (currentStore) {
          await fetchShopSettings(currentStore)
        }
      } catch (error) {
        console.error("Error cargando datos:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los datos. Por favor, intente nuevamente.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadAllData()
  }, [
    fetchShopSettings,
    fetchPaymentProviders,
    fetchShippingMethods,
    fetchCurrencies,
    fetchStores,
    currentStore,
    getCurrentStore,
    toast,
  ])

  const tabItems = [
    {
      value: "store",
      label: "Tienda",
      icon: Store,
      title: "Información de la Tienda",
      description: "Información general sobre tu tienda.",
    },
    {
      value: "shop",
      label: "Configuración",
      icon: Settings,
      title: "Configuración de la Tienda",
      description: "Configura los ajustes generales de tu tienda, como nombre, descripción y monedas aceptadas.",
    },
    {
      value: "currencies",
      label: "Monedas",
      icon: DollarSign,
      title: "Configuración de Monedas",
      description: "Administra las monedas disponibles y sus tasas de cambio.",
    },
    {
      value: "shipping",
      label: "Envíos",
      icon: Truck,
      title: "Configuración de Envíos",
      description: "Configura los métodos de envío y sus costos.",
    },
    {
      value: "payments",
      label: "Pagos",
      icon: CreditCard,
      title: "Configuración de Pagos",
      description: "Configura los métodos de pago disponibles para tus clientes.",
    },
  ]

  if (isLoading || loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Cargando configuración...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-1.5em)] bg-background rounded-xl text-foreground">
      <HeaderBar title="Configuración" />

      <div className="container-section">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Tabs with Better Size */}
          <div className="mb-6">
            <TabsList className="inline-flex h-auto items-center justify-start bg-transparent p-0 gap-0 border-b border-border">
              {tabItems.map((item) => {
                const Icon = item.icon
                return (
                  <TabsTrigger
                    key={item.value}
                    value={item.value}
                    className="inline-flex items-center justify-center whitespace-nowrap px-4 py-3 text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 gap-2.5 text-muted-foreground hover:text-foreground border-b-2 border-transparent data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-300 data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-300 rounded-none"
                  >
                    <Icon className="h-4 w-4 transition-colors duration-200" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </div>

          {/* Tab Content */}
          <div className="text-left">
            {tabItems.map((item) => (
              <TabsContent key={item.value} value={item.value} className="mt-0">
                <Card className="border border-border shadow-sm">
                  <CardHeader className="border-b border-border bg-muted/30 px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/50">
                        <item.icon className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-medium text-foreground">{item.title}</CardTitle>
                        <CardDescription className="text-sm text-muted-foreground mt-0.5">
                          {item.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5">
                    {item.value === "store" && <StoreInfo store={currentStoreData} />}
                    {item.value === "shop" && (
                      <ShopSettingsForm
                        shopSettings={shopSettings.length > 0 ? shopSettings[0] : null}
                        currencies={currencies}
                      />
                    )}
                    {item.value === "currencies" && (
                      <CurrencySettings
                        currencies={currencies}
                        shopSettings={shopSettings.length > 0 ? shopSettings[0] : null}
                      />
                    )}
                    {item.value === "shipping" && (
                      <ShippingSettings
                        shippingMethods={shippingMethods}
                        shopSettings={shopSettings.length > 0 ? shopSettings[0] : null}
                      />
                    )}
                    {item.value === "payments" && (
                      <PaymentSettings
                        paymentProviders={paymentProviders}
                        shopSettings={shopSettings.length > 0 ? shopSettings[0] : null}
                      />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>
    </div>
  )
}
