"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Home,
  Package,
  ShoppingCart,
  Settings,
  ChevronDown,
  LayoutGrid,
  LogOut,
  FolderKanban,
  Ticket,
  TestTube,
  Menu,
  X,
  CircleFadingPlus,
  SquarePlus,
  Store,
  CreditCard,
  UserRound,
  ChevronRight,
} from "lucide-react"
import { ThemeToggle } from "./ThemeToggle"
import { useAuthStore } from "@/stores/authStore"
import { getImageUrl } from "@/lib/imageUtils"
import { useMainStore } from "@/stores/mainStore"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function Sidebar() {
  const [activeGroup, setActiveGroup] = useState<string | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const pathname = usePathname()
  const { shopSettings, fetchShopSettings, currentStore, stores, setCurrentStore, fetchStores } = useMainStore()

  const toggleGroup = (group: string) => {
    setActiveGroup(activeGroup === group ? null : group)
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

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

  // Get current store name
  const getCurrentStoreName = () => {
    if (!stores || !currentStore) return "Seleccionar tienda"
    const store = stores.find((s) => s.id === currentStore)
    return store?.name || "Seleccionar tienda"
  }

  const StoreSelector = () => {
    if (!stores || stores.length === 0) {
      return (
        <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
          <Store size={16} />
          <span>No hay tiendas disponibles</span>
        </div>
      )
    }

    const currentStoreName = getCurrentStoreName()
    const logoUrl = shopSettings?.[0]?.logo ? getImageUrl(shopSettings[0].logo) : "/placeholder.svg"

    return (
      <Popover>
        <PopoverTrigger asChild>
          <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-accent/50 transition-colors rounded-lg mx-2">
            <div className="relative">
              <Avatar className="h-10 w-10 border border-border">
                <AvatarImage src={logoUrl || "/placeholder.svg"} alt="Logo" />
                <AvatarFallback>
                  <Store size={18} />
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {stores.length}
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{currentStoreName}</p>
              <p className="text-xs text-muted-foreground">Cambiar tienda</p>
            </div>
            <ChevronRight size={16} className="text-muted-foreground" />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="start">
          <div className="space-y-1">
            {stores.map((store) => (
              <Button
                key={store.id}
                variant={store.id === currentStore ? "secondary" : "ghost"}
                className="w-full justify-start text-sm h-9"
                onClick={() => handleStoreChange(store.id)}
              >
                {store.id === currentStore && <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>}
                {store.id !== currentStore && <div className="w-2 h-2 mr-2"></div>}
                {store.name}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  const sidebarContent = (
    <>
      <div className="flex flex-col h-full">
        <StoreSelector />
        <ScrollArea className="flex-1">
          <div className="p-2">
            <NavItem href="/" icon={<Home size={20} />} active={pathname === "/"}>
              Inicio
            </NavItem>
            <NavItem href="/products" icon={<Package size={20} />} active={pathname.startsWith("/products")}>
              Productos
            </NavItem>
            <NavItem href="/categories" icon={<LayoutGrid size={20} />} active={pathname.startsWith("/categories")}>
              Categorías
            </NavItem>
            <NavItem href="/collections" icon={<FolderKanban size={20} />} active={pathname.startsWith("/collections")}>
              Colecciones
            </NavItem>
            <NavGroupItem
              icon={<ShoppingCart size={20} />}
              text="Pedidos"
              active={activeGroup === "orders"}
              onClick={() => toggleGroup("orders")}
            >
              <NavItem href="/orders" active={pathname === "/orders"} className="pl-4">
                Todos
              </NavItem>
              <NavItem href="/orders/drafts" active={pathname === "/orders/drafts"} className="pl-4">
                Borradores
              </NavItem>
            </NavGroupItem>

            {/* Card Sections Group */}
            <NavGroupItem
              icon={<CreditCard size={20} />}
              text="Tarjetas"
              active={activeGroup === "cards"}
              onClick={() => toggleGroup("cards")}
            >
              <NavItem href="/card-sections" active={pathname === "/card-sections"} className="pl-4">
                Secciones
              </NavItem>
              <NavItem href="/card-sections/new" active={pathname === "/card-sections/new"} className="pl-4">
                Nueva Sección
              </NavItem>
            </NavGroupItem>

            {/* Team Sections Group */}
            <NavGroupItem
              icon={<UserRound size={20} />}
              text="Equipos"
              active={activeGroup === "teams"}
              onClick={() => toggleGroup("teams")}
            >
              <NavItem href="/team-sections" active={pathname === "/team-sections"} className="pl-4">
                Secciones
              </NavItem>
              <NavItem href="/team-sections/new" active={pathname === "/team-sections/new"} className="pl-4">
                Nueva Sección
              </NavItem>
            </NavGroupItem>

            <NavItem href="/coupons" icon={<Ticket size={20} />} active={pathname.startsWith("/coupons")}>
              Cupones
            </NavItem>
            <NavItem href="/contents" icon={<CircleFadingPlus size={20} />} active={pathname.startsWith("/contents")}>
              Contenido
            </NavItem>
            <NavItem
              href="/hero-sections"
              icon={<SquarePlus size={20} />}
              active={pathname.startsWith("/hero-section")}
            >
              Secciónes destacadas
            </NavItem>
            <NavItem href="/import" icon={<TestTube size={20} />} active={pathname.startsWith("/import")}>
              Importar
            </NavItem>
          </div>
        </ScrollArea>
        <div className="p-2 border-t border-sidebar-border space-y-1 mt-auto">
          <ThemeToggle />
          <NavItem href="/settings" icon={<Settings size={20} />} active={pathname.startsWith("/settings")}>
            Settings
          </NavItem>
          <Button
            variant="ghost"
            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20"
            onClick={() => useAuthStore.getState().logout()}
          >
            <LogOut size={20} className="mr-2" /> Logout
          </Button>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile hamburger menu */}
      <div className="md:hidden fixed top-0 left-0 z-40 w-full bg-sidebar text-sidebar-foreground p-4 border-b border-sidebar-border">
        <div className="flex justify-between items-center">
          <div className="flex h-[40px] items-center gap-2">
            {shopSettings?.[0]?.logo && shopSettings[0].logo !== "" && (
              <img
                src={getImageUrl(shopSettings[0].logo) || "/placeholder.svg"}
                alt="Logo"
                className="object-contain h-full"
              />
            )}
            <span className="font-medium truncate">{getCurrentStoreName()}</span>
          </div>
          <Button variant="ghost" onClick={toggleMobileMenu}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-0 z-30 transform transition-transform duration-300 ease-in-out md:hidden",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="w-64 h-full bg-sidebar text-sidebar-foreground flex flex-col border-r border-border pt-16">
          {sidebarContent}
        </div>
        <div className="flex-1 bg-black bg-opacity-50" onClick={toggleMobileMenu}></div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex w-60 min-h-screen bg-gray-100/80 dark:bg-zinc-900 text-sidebar-foreground flex-col border-r border-border">
        <div className="flex flex-col h-full pt-4">{sidebarContent}</div>
      </div>
    </>
  )
}

function NavItem({
  href,
  icon,
  children,
  className,
  active,
}: {
  href: string
  icon?: React.ReactNode
  children: React.ReactNode
  className?: string
  active?: boolean
}) {
  return (
    <Link href={href}>
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start text-accent-foreground/80 mb-1 hover:bg-background hover:shadow-sm lead font-medium",
          active ? "bg-background border border-border shadow-sm" : "",
          className,
        )}
      >
        {icon && <span className="mr-2">{icon}</span>}
        {children}
      </Button>
    </Link>
  )
}

function NavGroupItem({
  icon,
  text,
  children,
  active,
  onClick,
}: {
  icon: React.ReactNode
  text: string
  children: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <div>
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start hover:bg-background hover:shadow-sm text-accent-foreground/80",
          active ? "" : "",
        )}
        onClick={onClick}
      >
        <span className="mr-2">{icon}</span>
        {text}
        <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform", active && "transform rotate-180")} />
      </Button>
      {active && <div className="my-2 ml-6 pl-2 border-l border-border">{children}</div>}
    </div>
  )
}
