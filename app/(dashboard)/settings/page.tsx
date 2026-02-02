"use client"

import { useState } from "react"
import { useStores } from "@/hooks/useStores"
import { useCurrencies } from "@/hooks/useCurrencies"
import { useShopSettings } from "@/hooks/useShopSettings"
import { useShippingMethods } from "@/hooks/useShippingMethods"
import { usePaymentProviders } from "@/hooks/usePaymentProviders"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Store as StoreIcon, Settings, DollarSign, Truck, CreditCard } from "lucide-react"
import { HeaderBar } from "@/components/HeaderBar"
import StoreInfo from "./_components/StoreInfo"
import ShopSettingsForm from "./_components/shopSettings"
import CurrencySettings from "./_components/currencySettings"
import PaymentSettings from "./_components/PaymentSettings"
import ShippingSettings from "./_components/ShippingSettings"
import type { Store } from "@/types/store"

const TAB_ITEMS = [
  { value: "store", label: "Tienda", icon: StoreIcon, title: "Información de la Tienda", description: "Información general sobre tu tienda." },
  { value: "shop", label: "Configuración", icon: Settings, title: "Configuración de la Tienda", description: "Configura los ajustes generales de tu tienda, como nombre, descripción y monedas aceptadas." },
  { value: "currencies", label: "Monedas", icon: DollarSign, title: "Configuración de Monedas", description: "Administra las monedas disponibles y sus tasas de cambio." },
  { value: "shipping", label: "Envíos", icon: Truck, title: "Configuración de Envíos", description: "Configura los métodos de envío y sus costos." },
  { value: "payments", label: "Pagos", icon: CreditCard, title: "Configuración de Pagos", description: "Configura los métodos de pago disponibles para tus clientes." },
] as const

export default function SettingsPage() {
  const { currentStoreId, currentStore } = useStores()
  const [activeTab, setActiveTab] = useState("store")

  const { data: currencies = [], isLoading: isLoadingCurrencies } = useCurrencies()
  const { data: shopSettingsData, isLoading: isLoadingShopSettings } = useShopSettings(currentStoreId)
  const { data: shippingMethods = [], isLoading: isLoadingShipping } = useShippingMethods(
    currentStoreId,
    !!currentStoreId
  )
  const { data: paymentProviders = [], isLoading: isLoadingPayments } = usePaymentProviders(
    currentStoreId,
    !!currentStoreId
  )

  const currentShopSettings = shopSettingsData ?? null
  const currentStoreData = (currentStore ?? null) as Store | null

  const isLoading =
    isLoadingCurrencies ||
    isLoadingShopSettings ||
    (!!currentStoreId && (isLoadingShipping || isLoadingPayments))

  if (!currentStoreId) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <p className="text-sm text-muted-foreground">Selecciona una tienda para ver la configuración.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
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
          <div className="mb-6">
            <TabsList className="inline-flex h-auto items-center justify-start bg-transparent p-0 gap-0 border-b border-border">
              {TAB_ITEMS.map((item) => {
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

          <div className="text-left">
            <TabsContent value="store" className="mt-0">
              <Card className="border border-border shadow-sm">
                <CardHeader className="border-b border-border bg-muted/30 px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center">
                      <StoreIcon className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-medium text-foreground">Información de la Tienda</CardTitle>
                      <CardDescription className="text-sm text-muted-foreground mt-0.5">
                        Información general sobre tu tienda.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-5">
                  <StoreInfo store={currentStoreData} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="shop" className="mt-0">
              <Card className="border border-border shadow-sm">
                <CardHeader className="border-b border-border bg-muted/30 px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center">
                      <Settings className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-medium text-foreground">Configuración de la Tienda</CardTitle>
                      <CardDescription className="text-sm text-muted-foreground mt-0.5">
                        Configura los ajustes generales de tu tienda.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-5">
                  <ShopSettingsForm
                    shopSettings={currentShopSettings}
                    currencies={currencies}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="currencies" className="mt-0">
              <Card className="border border-border shadow-sm">
                <CardHeader className="border-b border-border bg-muted/30 px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-medium text-foreground">Configuración de Monedas</CardTitle>
                      <CardDescription className="text-sm text-muted-foreground mt-0.5">
                        Administra las monedas disponibles y sus tasas de cambio.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-5">
                  <CurrencySettings
                    currencies={currencies}
                    shopSettings={currentShopSettings}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="shipping" className="mt-0">
              <Card className="border border-border shadow-sm">
                <CardHeader className="border-b border-border bg-muted/30 px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center">
                      <Truck className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-medium text-foreground">Configuración de Envíos</CardTitle>
                      <CardDescription className="text-sm text-muted-foreground mt-0.5">
                        Configura los métodos de envío y sus costos.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-5">
                  <ShippingSettings
                    shippingMethods={shippingMethods}
                    shopSettings={currentShopSettings}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="payments" className="mt-0">
              <Card className="border border-border shadow-sm">
                <CardHeader className="border-b border-border bg-muted/30 px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center">
                      <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-medium text-foreground">Configuración de Pagos</CardTitle>
                      <CardDescription className="text-sm text-muted-foreground mt-0.5">
                        Configura los métodos de pago disponibles para tus clientes.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-5">
                  <PaymentSettings
                    paymentProviders={paymentProviders}
                    shopSettings={currentShopSettings}
                    currencies={currencies}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
