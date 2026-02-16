"use client"

import type * as React from "react"
import { useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  Home,
  Package,
  Settings,
  LayoutGrid,
  LogOut,
  Ticket,
  Store,
  CreditCard,
  ChevronDown,
  ShoppingBag,
  Tags,
  Users,
  FileText,
  Layers,
  PackageOpen,
  User,
  ClipboardList,
} from "lucide-react"
import { useAuthStore } from "@/stores/authStore"
import { getImageUrl } from "@/lib/imageUtils"
import { useShopSettings } from "@/hooks/useShopSettings"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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
  const pathname = usePathname()
  const { user, stores: authStores, currentStoreId, setCurrentStore } = useAuthStore()
  const { data: currentShopSettings } = useShopSettings(currentStoreId)

  const stores = authStores
  const currentStore = currentStoreId
  const shopSettings = currentShopSettings ? [currentShopSettings] : []

  const handleStoreChange = (storeId: string) => {
    setCurrentStore(storeId)
  }

  const logoUrl = shopSettings?.[0]?.logo ? getImageUrl(shopSettings[0].logo) : "/vercel.svg"

  return (
    <Sidebar collapsible="icon" {...props} className="border-r border-sidebar-border">
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
        <NavFooter />
      </SidebarFooter>
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
              <AvatarImage src={logoUrl || "/vercel.svg"} alt="Logo" />
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
    <SidebarGroup className="border-0">
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

          {/* Products with submenu for Combos */}
          <NavSubmenu
            pathname={pathname}
            basePath="/products"
            icon={<Package size={20} />}
            title="Productos"
            items={[
              { path: "/products", label: "Todos los productos" },
              { path: "/fbt", label: "Combos" },
            ]}
          />

          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith("/categories")} tooltip="Categorías">
              <Link href="/categories">
                <Tags size={20} />
                <span>Categorías</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith("/collections")} tooltip="Colecciones">
              <Link href="/collections">
                <Layers size={20} />
                <span>Colecciones</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <NavSubmenu
            pathname={pathname}
            basePath="/orders"
            icon={<ShoppingBag size={20} />}
            title="Pedidos"
            items={[
              { path: "/orders", label: "Todos los pedidos" },
              { path: "/pos", label: "POS" },
            ]}
          />

          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith("/cards")} tooltip="Tarjetas">
              <Link href="/cards">
                <CreditCard size={20} />
                <span>Tarjetas</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith("/teams")} tooltip="Equipo">
              <Link href="/teams">
                <Users size={20} />
                <span>Equipo</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

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
                <FileText size={20} />
                <span>Contenido</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith("/kardex")} tooltip="Kardex">
              <Link href="/kardex">
                <ClipboardList size={20} />
                <span>Kardex</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith("/hero-section")} tooltip="Secciones destacadas">
              <Link href="/hero-sections">
                <LayoutGrid size={20} />
                <span>Secciones destacadas</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <NavSubmenu
            pathname={pathname}
            basePath="/page-builder"
            icon={<Layers size={20} />}
            title="Page Builder"
            items={[{ path: "/page-builder/hero-section", label: "Hero Section" }]}
          />
          {/* Configuraciones como item del sidebar */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith("/settings")} tooltip="Configuraciones">
              <Link href="/settings">
                <Settings size={20} />
                <span>Configuraciones</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

// Componente para el footer de navegación
function NavFooter() {
  const { state } = useSidebar()
  const { user } = useAuthStore()
  const isCollapsed = state === "collapsed"

  return (
    <div className="space-y-4">
      {/* Popover con información del usuario, theme toggle, configuración y cerrar sesión */}
      <div className="px-2">
        <Popover>
          <PopoverTrigger asChild>
            <div className="flex items-center gap-3 p-2 cursor-pointer hover:bg-accent/50 transition-colors rounded-md">
              <Avatar className="h-8 w-8 border border-border">
                <AvatarFallback>
                  <User size={16} />
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium truncate">{user ? `${user.firstName} ${user.lastName}` : "Usuario"}</p>
                  <p className="text-xs text-muted-foreground">{user?.email || "usuario@ejemplo.com"}</p>
                </div>
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64 p-3">
            <div className="space-y-3">
                             {/* Información del usuario */}
               <div className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
                 <Avatar className="h-10 w-10 border border-border">
                   <AvatarFallback>
                     <User size={20} />
                   </AvatarFallback>
                 </Avatar>
                 <div className="flex-1 overflow-hidden">
                   <p className="text-sm font-medium truncate">{user ? `${user.firstName} ${user.lastName}` : "Usuario"}</p>
                   <p className="text-xs text-muted-foreground truncate">{user?.email || "usuario@ejemplo.com"}</p>
                 </div>
               </div>

              {/* Theme Toggle */}
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-accent/50 transition-colors">
                <span className="text-sm">Tema</span>
                <ThemeToggle />
              </div>

              {/* Cerrar sesión */}
              <button
                onClick={() => useAuthStore.getState().logout()}
                className="flex items-center gap-2 p-2 rounded-md hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors text-sm text-red-600 dark:text-red-400 w-full"
              >
                <LogOut size={16} />
                <span>Cerrar sesión</span>
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Footer de contacto y sugerencias*/}
      <div className="px-2 pb-2">
        <div className="rounded-md bg-gradient-to-br from-background to-sidebar p-2 space-y-2 border border-sidebar-border/20">
          <div className="text-center">
            <h4 className="text-xs font-medium text-foreground mb-1">¿Alguna Sugerencia?</h4>
            <p className="text-xs text-muted-foreground mb-2">Contacta por WhatsApp</p>
          </div>
          
          <a
            href="https://wa.me/51991285679?text=Hola,%20tengo%20una%20sugerencia%20para%20mejorar%20el%20sistema%20de%20gestión:"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground text-xs font-medium py-1.5 px-2 rounded transition-all duration-200 shadow-sm"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.86 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
            </svg>
            WhatsApp
          </a>
 
        </div>
      </div>
    </div>
  )
}

// Actualizar NavSubmenu para usar el degradado integrado en el componente base
function NavSubmenu({ pathname, basePath, icon, title, items }: NavSubmenuProps) {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const isActive = pathname.startsWith(basePath)

  return (
    <Collapsible defaultOpen={isActive} className="w-full">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={title} isActive={isActive}>
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