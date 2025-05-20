"use client"

import { useEffect, useState } from "react"
import { useMainStore } from "@/stores/mainStore"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { HeaderBar } from "@/components/HeaderBar"
import StoreInfo from "./_components/StoreInfo"
import ShopSettingsForm from "./_components/shopSettings"
import CurrencySettings from "./_components/currencySettings"
import ShippingSettings from "./_components/ShippingSettings"
import PaymentSettings from "./_components/PaymentSettings"
import UserSettings from "./_components/UserSettings"

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
        // Cargar tiendas primero para asegurar que tenemos currentStore
 

        // Cargar monedas (no depende de storeId)
        await fetchCurrencies()
        await fetchShippingMethods()
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
  }, [fetchShopSettings,fetchPaymentProviders,fetchShippingMethods, fetchCurrencies, fetchStores, currentStore, getCurrentStore, toast])

  if (isLoading || loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Cargando configuración...</span>
      </div>
    )
  }

  return (
    <>
      <HeaderBar title="Configuración" />

      <div className="container-section">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full mb-6 bg-background border rounded-lg p-1.5   shadow-sm transition-all">
            <TabsTrigger
              value="store"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-md px-4 py-2 font-medium transition-all hover:bg-muted/50"
            >
              Tienda
            </TabsTrigger>
            <TabsTrigger
              value="shop"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-md px-4 py-2 font-medium transition-all hover:bg-muted/50"
            >
              Configuración
            </TabsTrigger>
            <TabsTrigger
              value="currencies"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-md px-4 py-2 font-medium transition-all hover:bg-muted/50"
            >
              Monedas
            </TabsTrigger>
            <TabsTrigger
              value="shipping"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-md px-4 py-2 font-medium transition-all hover:bg-muted/50"
            >
              Envíos
            </TabsTrigger>
            <TabsTrigger
              value="payments"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-md px-4 py-2 font-medium transition-all hover:bg-muted/50"
            >
              Pagos
            </TabsTrigger>

            {/* <TabsTrigger
              value="users"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-md px-4 py-2 font-medium transition-all hover:bg-muted/50"
            >
              Usuarios
            </TabsTrigger> */}
          </TabsList>

          <div className="mt-6">
            <TabsContent value="store">
              <Card className="border rounded-md shadow-sm">
                <CardHeader className="bg-muted/40 border-b">
                  <CardTitle>Información de la Tienda</CardTitle>
                  <CardDescription>Información general sobre tu tienda.</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <StoreInfo store={currentStoreData} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="shop">
              <Card className="border rounded-md shadow-sm">
                <CardHeader className="bg-muted/40 border-b">
                  <CardTitle>Configuración de la Tienda</CardTitle>
                  <CardDescription>
                    Configura los ajustes generales de tu tienda, como nombre, descripción y monedas aceptadas.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <ShopSettingsForm
                    shopSettings={shopSettings.length > 0 ? shopSettings[0] : null}
                    currencies={currencies}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="currencies">
              <Card className="border rounded-md shadow-sm">
                <CardHeader className="bg-muted/40 border-b">
                  <CardTitle>Configuración de Monedas</CardTitle>
                  <CardDescription>Administra las monedas disponibles y sus tasas de cambio.</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <CurrencySettings
                    currencies={currencies}
                    shopSettings={shopSettings.length > 0 ? shopSettings[0] : null}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="shipping">
              <Card className="border rounded-md shadow-sm">
                <CardHeader className="bg-muted/40 border-b">
                  <CardTitle>Configuración de Envíos</CardTitle>
                  <CardDescription>Configura los métodos de envío y sus costos.</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                <ShippingSettings
                    shippingMethods={shippingMethods}
                    shopSettings={shopSettings.length > 0 ? shopSettings[0] : null}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments">
              <Card className="border rounded-md shadow-sm">
                <CardHeader className="bg-muted/40 border-b">
                  <CardTitle>Configuración de Pagos</CardTitle>
                  <CardDescription>Configura los métodos de pago disponibles para tus clientes.</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                <PaymentSettings
                    paymentProviders={paymentProviders}
                    shopSettings={shopSettings.length > 0 ? shopSettings[0] : null}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* <TabsContent value="users">
              <Card className="border rounded-md shadow-sm">
                <CardHeader className="bg-muted/40 border-b">
                  <CardTitle>Configuración de Usuarios</CardTitle>
                  <CardDescription>Administra los usuarios y sus permisos en tu tienda.</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <UserSettings
                    users={users}
                    currentStore={currentStoreData}
                  />
                </CardContent>
              </Card>
            </TabsContent> */}
          </div>
        </Tabs>
      </div>
    </>
  )
}
