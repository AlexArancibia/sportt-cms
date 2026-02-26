"use client"

import { useStores } from "@/hooks/useStores"
import { PermissionGuard } from "@/components/PermissionGuard"

function fbtPermission(pathname: string | null): string {
  if (pathname?.endsWith("/new")) return "fbt:create"
  if (pathname?.includes("/edit")) return "fbt:update"
  return "fbt:list"
}

function isFbtEditPage(pathname: string | null): boolean {
  return pathname?.includes("/edit") ?? false
}

export default function FbtLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { currentStoreId } = useStores()

  return (
    <PermissionGuard
      storeId={currentStoreId}
      permission={fbtPermission}
      headerTitle="Combos (FBT)"
      noStoreTitle="Selecciona una tienda"
      noStoreMessage="Para ver combos, primero selecciona una tienda desde el menú lateral."
      noPermissionTitle="No tienes acceso a esta página"
      noPermissionMessage={(pathname) => {
        if (pathname?.endsWith("/new"))
          return "No tienes permiso para crear combos. Si crees que deberías tener acceso, contacta al administrador de la tienda."
        if (isFbtEditPage(pathname))
          return "No tienes permiso para editar combos. Si crees que deberías tener acceso, contacta al administrador de la tienda."
        return "No tienes permiso para ver la sección de combos. Si crees que deberías tener acceso, contacta al administrador de la tienda."
      }}
      backHref={(pathname) => {
        if (pathname?.endsWith("/new") || isFbtEditPage(pathname)) return "/fbt"
        return "/"
      }}
      backLabel="Volver"
    >
      {children}
    </PermissionGuard>
  )
}
