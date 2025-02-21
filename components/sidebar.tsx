"use client"

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
  Users,
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
} from "lucide-react"
import { ThemeToggle } from "./ThemeToggle"
import { useAuthStore } from "@/stores/authStore"
import { useMainStore } from "@/stores/mainStore"
import { getImageUrl } from "@/lib/imageUtils"

export function Sidebar() {
  const [activeGroup, setActiveGroup] = useState<string | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const {shopSettings, fetchShopSettings } = useMainStore()

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


  useEffect(() => {
      fetchData()
    }, [])
  
    const fetchData = async () => {
      try {
        await Promise.all([
          fetchShopSettings(),

        ])
      } catch (error) {
        console.error("Error fetching data:", error)

      } 
    }

  const sidebarContent = (
    <>
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
          <NavItem href="/customers" icon={<Users size={20} />} active={pathname.startsWith("/customers")}>
            Clientes
          </NavItem>
          <NavItem href="/coupons" icon={<Ticket size={20} />} active={pathname.startsWith("/coupons")}>
            Cupones
          </NavItem>
          <NavItem href="/contents" icon={<CircleFadingPlus size={20} />} active={pathname.startsWith("/contents")}>
            Contenido
          </NavItem>
          <NavItem href="/import" icon={<TestTube size={20} />} active={pathname.startsWith("/import")}>
            Importar
          </NavItem>
        </div>
      </ScrollArea>
      <div className="p-2 border-t border-sidebar-border space-y-1">
        <ThemeToggle />
        <NavItem href="/settings" icon={<Settings size={20} />} active={pathname.startsWith("/settings")}>
          Settings
        </NavItem>
        <Button
          variant="ghost"
          className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-100"
          onClick={() => useAuthStore.getState().logout()}
        >
          <LogOut size={20} className="mr-2" /> Logout
        </Button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile hamburger menu */}
      <div className="md:hidden fixed top-0 left-0 z-40 w-full bg-sidebar text-sidebar-foreground p-4 border-b border-sidebar-border">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex h-[40px] items-center gap-2">
          {shopSettings?.[0]?.logo && shopSettings[0].logo !== "" && (
  <img src={getImageUrl(shopSettings[0].logo)} alt="Logo" className="object-contain h-full" />
)}
            
          </Link>
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
        <div className="p-4 border-b border-sidebar-border">
          <Link href="/" className="flex h-[40px] items-center gap-2">
          
          {shopSettings?.[0]?.logo && shopSettings[0].logo !== "" && (
  <img src={getImageUrl(shopSettings[0].logo)} alt="Logo" className="object-contain h-full" />
)}
          </Link>
        </div>
        {sidebarContent}
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

