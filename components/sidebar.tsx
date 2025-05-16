"use client"

import type * as React from "react"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  Home,
  Package,
  ShoppingCart,
  Settings,
  LayoutGrid,
  LogOut,
  FolderKanban,
  Ticket,
  TestTube,
  CircleFadingPlus,
  SquarePlus,
  Store,
  CreditCard,
  UserRound,
  ChevronDown,
  Sun,
  Moon,
} from "lucide-react"

import { useTheme } from "@/contexts/ThemeContext"
import { useAuthStore } from "@/stores/authStore"
import { getImageUrl } from "@/lib/imageUtils"
import { useMainStore } from "@/stores/mainStore"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { ThemeToggle } from "./ThemeToggle"

// Tipos
interface StoreType {
  id: string
  name: string
}

interface ShopSettings {
  logo?: string
}

interface StoreSelectorProps {
  stores: StoreType[] | undefined
  currentStore: string | null
  handleStoreChange: (storeId: string) => void
  logoUrl: string
}

interface NavSubmenuProps {
  pathname: string
  basePath: string
  icon: React.ReactNode
  title: string
  items: Array<{
    path: string
    label: string
  }>
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [isInitialized, setIsInitialized] = useState(false)
  const pathname = usePathname()
  const { shopSettings, fetchShopSettings, currentStore, stores, setCurrentStore, fetchStores } = useMainStore()

  // Inicialización: cargar tiendas y configurar tienda actual
  useEffect(() => {
    const initializeStores = async () => {
      try {
        console.log("Inicializando tiendas...")
        const fetchedStores = await fetchStores()

        // Recuperar tienda actual de localStorage
        const savedStoreId = localStorage.getItem("currentStore")
        console.log("Tienda guardada en localStorage:", savedStoreId)

        if (savedStoreId && fetchedStores.some((store) => store.id === savedStoreId)) {
          console.log("Estableciendo tienda guardada:", savedStoreId)
          setCurrentStore(savedStoreId)
        } else if (fetchedStores.length > 0 && !currentStore) {
          console.log("Estableciendo primera tienda como predeterminada:", fetchedStores[0].id)
          setCurrentStore(fetchedStores[0].id)
          localStorage.setItem("currentStore", fetchedStores[0].id)
        }

        setIsInitialized(true)
      } catch (error) {
        console.error("Error inicializando tiendas:", error)
        setIsInitialized(true)
      }
    }

    if (!isInitialized) {
      initializeStores()
    }
  }, [fetchStores, setCurrentStore, currentStore, isInitialized])

  // Cargar configuración de tienda cuando cambie la tienda actual
  useEffect(() => {
    const loadShopSettings = async () => {
      if (currentStore) {
        console.log("Cargando configuración para tienda:", currentStore)
        try {
          await fetchShopSettings(currentStore)
        } catch (error) {
          console.error("Error cargando configuración de tienda:", error)
        }
      }
    }

    if (isInitialized && currentStore) {
      loadShopSettings()
    }
  }, [currentStore, fetchShopSettings, isInitialized])

  const handleStoreChange = (storeId: string) => {
    console.log("Cambiando a tienda:", storeId)
    setCurrentStore(storeId)
    localStorage.setItem("currentStore", storeId)
  }

  const logoUrl = shopSettings?.[0]?.logo ? getImageUrl(shopSettings[0].logo) : "/placeholder.svg"

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <StoreSelector
          stores={stores}
          currentStore={currentStore}
          handleStoreChange={handleStoreChange}
          logoUrl={logoUrl}
        />
      </SidebarHeader>
      <SidebarContent>
        <NavMain pathname={pathname} />
      </SidebarContent>
      <SidebarFooter>
        <NavFooter pathname={pathname} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

// Componente para el selector de tienda
function StoreSelector({ stores, currentStore, handleStoreChange, logoUrl }: StoreSelectorProps) {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  if (!stores || stores.length === 0) {
    return (
      <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
        <Store size={16} />
        <span>No hay tiendas disponibles</span>
      </div>
    )
  }

  const currentStoreName = stores.find((s) => s.id === currentStore)?.name || "Seleccionar tienda"
  const storeCount = stores.length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div
          className={`flex items-center gap-3 p-1 pt-3 cursor-pointer hover:bg-accent/50 transition-colors rounded-md ${isCollapsed ? "justify-center" : ""}`}
        >
          <div className="relative">
            <Avatar className="h-9 w-9 border border-border">
              <AvatarImage src={logoUrl || "/placeholder.svg"} alt="Logo" />
              <AvatarFallback>
                <Store size={16} />
              </AvatarFallback>
            </Avatar>
            {storeCount > 1 && (
              <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {storeCount}
              </div>
            )}
          </div>
          {!isCollapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{currentStoreName}</p>
              <p className="text-xs text-muted-foreground">Cambiar tienda</p>
            </div>
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 p-2">
        <div className="space-y-1">
          {stores.map((store) => (
            <DropdownMenuItem
              key={store.id}
              onClick={() => handleStoreChange(store.id)}
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${store.id === currentStore ? "bg-card font-medium" : ""}`}
            >
              {store.id === currentStore ? (
                <div className="w-2 h-2 bg-primary rounded-full"></div>
              ) : (
                <div className="w-2 h-2 opacity-0"></div>
              )}
              <span>{store.name}</span>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Componente para la navegación principal
function NavMain({ pathname }: { pathname: string }) {
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/"} tooltip="Inicio">
              <Link href="/">
                <Home size={20} />
                <span>Inicio</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith("/products")} tooltip="Productos">
              <Link href="/products">
                <Package size={20} />
                <span>Productos</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith("/categories")} tooltip="Categorías">
              <Link href="/categories">
                <LayoutGrid size={20} />
                <span>Categorías</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith("/collections")} tooltip="Colecciones">
              <Link href="/collections">
                <FolderKanban size={20} />
                <span>Colecciones</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith("/orders")} tooltip="Pedidos">
              <Link href="/orders">
                <FolderKanban size={20} />
                <span>Pedidos</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith("/cards")} tooltip="Tarjetas">
              <Link href="/cards">
                <FolderKanban size={20} />
                <span>Tarjetas</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith("/teams")} tooltip="Equipo">
              <Link href="/teams">
                <FolderKanban size={20} />
                <span>Equipo</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

   
          {/* <NavSubmenu
            pathname={pathname}
            basePath="/teams"
            icon={<UserRound size={20} />}
            title="Equipos"
            items={[
              { path: "/teams", label: "Secciones" },
              { path: "/teams/new", label: "Nueva Sección" },
            ]}
          /> */}

          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith("/coupons")} tooltip="Cupones">
              <Link href="/coupons">
                <Ticket size={20} />
                <span>Cupones</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith("/contents")} tooltip="Contenido">
              <Link href="/contents">
                <CircleFadingPlus size={20} />
                <span>Contenido</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith("/hero-section")} tooltip="Secciones destacadas">
              <Link href="/hero-sections">
                <SquarePlus size={20} />
                <span>Secciones destacadas</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith("/import")} tooltip="Importar">
              <Link href="/import">
                <TestTube size={20} />
                <span>Importar</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

// Componente para el footer de navegación
function NavFooter({ pathname }: { pathname: string }) {
 
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <SidebarMenu>
      <ThemeToggle />
 
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname.startsWith("/settings")} tooltip="Configuración">
          <Link href="/settings">
            <Settings size={20} />
            <span>Configuración</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={() => useAuthStore.getState().logout()}
          className="text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20"
          tooltip="Cerrar sesión"
        >
          <LogOut size={20} />
          <span>Cerrar sesión</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

// Actualizar NavSubmenu para usar bg-card en elementos activos
function NavSubmenu({ pathname, basePath, icon, title, items }: NavSubmenuProps) {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const isActive = pathname.startsWith(basePath)

  return (
    <Collapsible defaultOpen={isActive} className="w-full">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={title} className={isActive ? "bg-card" : ""}>
            {icon}
            <span>{title}</span>
            <ChevronDown className="ml-auto h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
      </SidebarMenuItem>
      <CollapsibleContent className={isCollapsed ? "hidden" : ""}>
        <SidebarMenu className="ml-6 mt-1 border-l w-auto border-sidebar-border pl-2">
          {items.map((item) => (
            <SidebarMenuItem key={item.path}>
              <SidebarMenuButton asChild isActive={pathname === item.path}>
                <Link href={item.path}>
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </CollapsibleContent>
    </Collapsible>
  )
}
