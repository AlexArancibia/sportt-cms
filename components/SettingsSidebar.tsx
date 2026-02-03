"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Store, CreditCard, Truck, Users, SmartphoneNfc, LogOut, ArrowLeft, Menu, X } from "lucide-react"
import { ThemeToggle } from "./ThemeToggle"
import { useAuthStore } from "@/stores/authStore"
import { getImageUrl } from "@/lib/imageUtils"

const settingsLinks = [
  { href: "/settings", icon: Store, label: "General" },
  { href: "/settings/currencies", icon: CreditCard, label: "Currencies" },
  { href: "/settings/shipping", icon: Truck, label: "Shipping" },
  { href: "/settings/payments", icon: SmartphoneNfc, label: "Payments" },
  { href: "/settings/users", icon: Users, label: "Users" },
]

export function SettingsSidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const logout = useAuthStore.getState().logout

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

  const sidebarContent = (
    <>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {settingsLinks.map(({ href, icon: Icon, label }) => (
            <NavItem key={href} href={href} icon={<Icon size={20} />} active={pathname === href}>
              {label}
            </NavItem>
          ))}
        </div>
      </ScrollArea>
      <div className="p-2 border-t border-sidebar-border space-y-1">
        <ThemeToggle />
        <Button
          variant="ghost"
          className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-100"
          onClick={logout}
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
          <Button variant="ghost" className="flex items-center gap-2" onClick={() => router.back()}>
            <ArrowLeft size={20} />
            <span className="font-semibold">Back</span>
          </Button>
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
          <div className="flex items-center justify-between">
            <Button variant="ghost" className="flex items-center gap-2" onClick={() => router.push("/")}>
              <ArrowLeft size={20} />
              <span className="font-semibold">Back</span>
            </Button>
             
          </div>
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

