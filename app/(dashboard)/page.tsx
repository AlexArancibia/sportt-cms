"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Store, ArrowRight, Settings, Users, ShoppingBag, BarChart3, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion } from "framer-motion"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { useMainStore } from "@/stores/mainStore"
import { HeaderBar } from "@/components/HeaderBar"
import { useAuthStore } from "@/stores/authStore"

// Definir interfaces
interface StoreType {
  id: string
  name: string
  status?: string
  createdAt: string | Date
  productsCount?: number
  customersCount?: number
  ordersCount?: number
  domain?: string
}

interface StoreCardProps {
  store: StoreType
  index: number
  onSelect: () => void
}

export default function DashboardPage() {
  const router = useRouter()
  const { fetchStores, setCurrentStore, stores, loading, error } = useMainStore()
  const [isInitialized, setIsInitialized] = useState(false)
  const [storeInit, setStoreInit] = useState(true)
  const { user } = useAuthStore()

  useEffect(() => {
    const loadStores = async () => {
      try {
        console.log("Loading stores in dashboard...")
        await fetchStores(user?.id)
        setIsInitialized(true)
      } catch (err) {
        console.error("Error loading stores:", err)
        setIsInitialized(true)
      }
    }

    if (user && storeInit) {
      loadStores()
    }
  }, [user, fetchStores, storeInit])

  const handleSelectStore = (storeId: string) => {
    console.log("Selecting store:", storeId)
    setCurrentStore(storeId)
    router.push(`/store/${storeId}/dashboard`)
  }

  const handleRefresh = () => {
    fetchStores()
  }

  if (!storeInit || !isInitialized) {
    return <LoadingSkeleton />
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <HeaderBar title="Mis Tiendas" />
      <ScrollArea className="h-[calc(100vh-4rem)]">
        <div className="container mx-auto py-8 px-4">
          {error && (
            <div className="mb-6 p-4 bg-destructive/20 border border-destructive/50 rounded-md text-destructive-foreground">
              <p>Error: {error}</p>
              <Button
                variant="outline"
                className="mt-2 border-destructive/50 hover:bg-destructive/20"
                onClick={() => fetchStores()}
              >
                Reintentar
              </Button>
            </div>
          )}

          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-medium text-foreground">Bienvenido a tu Panel de Control</h1>
              <p className="text-muted-foreground mt-1">Selecciona una tienda para administrarla</p>
            </div>
            <Button
              variant="outline"
              onClick={handleRefresh}
              className="border-border text-muted-foreground hover:bg-accent/50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>

          {loading ? (
            <LoadingSkeleton />
          ) : stores.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stores.map((store, index) => (
                <StoreCard key={store.id} store={store} index={index} onSelect={() => handleSelectStore(store.id)} />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

// Actualizar el componente StoreCard para usar clases de Tailwind
function StoreCard({ store, index, onSelect }: StoreCardProps) {
  const animationDelay = index * 0.1

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: animationDelay }}
    >
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-md border-border/50 bg-card">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg font-medium text-card-foreground">{store.name}</CardTitle>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
              {store.status || "Activa"}
            </Badge>
          </div>
          <CardDescription className="text-muted-foreground text-xs">
            Creada {formatDistanceToNow(new Date(store.createdAt), { addSuffix: true, locale: es })}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center">
              <ShoppingBag className="h-3 w-3 mr-1 text-muted-foreground" />
              <span className="text-muted-foreground">{store.productsCount || 0} Productos</span>
            </div>
            <div className="flex items-center">
              <Users className="h-3 w-3 mr-1 text-muted-foreground" />
              <span className="text-muted-foreground">{store.customersCount || 0} Clientes</span>
            </div>
            <div className="flex items-center">
              <BarChart3 className="h-3 w-3 mr-1 text-muted-foreground" />
              <span className="text-muted-foreground">{store.ordersCount || 0} Pedidos</span>
            </div>
            <div className="flex items-center">
              <Settings className="h-3 w-3 mr-1 text-muted-foreground" />
              <span className="text-muted-foreground">{store.domain || "Sin dominio"}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-2">
          <Button
            onClick={onSelect}
            variant="ghost"
            className="w-full justify-between text-primary hover:bg-primary/10"
          >
            Administrar tienda
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

// Actualizar el componente EmptyState para usar clases de Tailwind
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center p-8 rounded-lg text-center border border-dashed border-border bg-accent/50"
    >
      <Store className="h-12 w-12 mb-4 opacity-70 text-primary" />
      <h3 className="text-xl font-medium mb-2 text-foreground">No tienes tiendas disponibles</h3>
      <p className="mb-6 max-w-md text-muted-foreground">
        No se encontraron tiendas asociadas a tu cuenta. Contacta con el administrador si crees que esto es un error.
      </p>
    </motion.div>
  )
}

// Actualizar el componente LoadingSkeleton para usar clases de Tailwind
function LoadingSkeleton() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <Skeleton className="h-8 w-64 bg-border" />
          <Skeleton className="h-4 w-80 mt-2 bg-border" />
        </div>
        <Skeleton className="h-10 w-32 bg-border" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg overflow-hidden border border-border/50 bg-card">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <Skeleton className="h-6 w-32 bg-border" />
                <Skeleton className="h-5 w-16 bg-border" />
              </div>
              <Skeleton className="h-4 w-24 mb-4 bg-border" />
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Skeleton className="h-4 w-full bg-border" />
                <Skeleton className="h-4 w-full bg-border" />
                <Skeleton className="h-4 w-full bg-border" />
                <Skeleton className="h-4 w-full bg-border" />
              </div>
              <Skeleton className="h-9 w-full mt-2 bg-border" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
