"use client"

import { useStores } from "@/hooks/useStores"
import { PermissionGuard } from "@/components/PermissionGuard"

function heroSectionsPermission(pathname: string | null): string {
  if (pathname?.endsWith("/new")) return "heroSections:create"
  if (pathname?.includes("/edit")) return "heroSections:update"
  return "heroSections:list"
}

function isHeroSectionsEditPage(pathname: string | null): boolean {
  return pathname?.includes("/edit") ?? false
}

export default function HeroSectionsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { currentStoreId } = useStores()

  return (
    <PermissionGuard
      storeId={currentStoreId}
      permission={heroSectionsPermission}
      headerTitle="Secciones Hero"
      noStoreTitle="Selecciona una tienda"
      noStoreMessage="Para ver secciones hero, primero selecciona una tienda desde el menú lateral."
      noPermissionTitle="No tienes acceso a esta página"
      noPermissionMessage={(pathname) => {
        if (pathname?.endsWith("/new"))
          return "No tienes permiso para crear secciones hero. Si crees que deberías tener acceso, contacta al administrador de la tienda."
        if (isHeroSectionsEditPage(pathname))
          return "No tienes permiso para editar secciones hero. Si crees que deberías tener acceso, contacta al administrador de la tienda."
        return "No tienes permiso para ver la sección de hero. Si crees que deberías tener acceso, contacta al administrador de la tienda."
      }}
      backHref={(pathname) => {
        if (pathname?.endsWith("/new") || isHeroSectionsEditPage(pathname)) return "/hero-sections"
        return "/"
      }}
      backLabel="Volver"
    >
      {children}
    </PermissionGuard>
  )
}
