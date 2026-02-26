"use client"

import { useStores } from "@/hooks/useStores"
import { PermissionGuard } from "@/components/PermissionGuard"

function couponsPermission(pathname: string | null): string {
  if (pathname?.endsWith("/new")) return "coupons:create"
  if (pathname?.includes("/edit")) return "coupons:update"
  return "coupons:list"
}

function isCouponsEditPage(pathname: string | null): boolean {
  return pathname?.includes("/edit") ?? false
}

export default function CouponsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { currentStoreId } = useStores()

  return (
    <PermissionGuard
      storeId={currentStoreId}
      permission={couponsPermission}
      headerTitle="Cupones"
      noStoreTitle="Selecciona una tienda"
      noStoreMessage="Para ver cupones, primero selecciona una tienda desde el menú lateral."
      noPermissionTitle="No tienes acceso a esta página"
      noPermissionMessage={(pathname) => {
        if (pathname?.endsWith("/new"))
          return "No tienes permiso para crear cupones. Si crees que deberías tener acceso, contacta al administrador de la tienda."
        if (isCouponsEditPage(pathname))
          return "No tienes permiso para editar cupones. Si crees que deberías tener acceso, contacta al administrador de la tienda."
        return "No tienes permiso para ver la sección de cupones. Si crees que deberías tener acceso, contacta al administrador de la tienda."
      }}
      backHref={(pathname) => {
        if (pathname?.endsWith("/new") || isCouponsEditPage(pathname)) return "/coupons"
        return "/"
      }}
      backLabel="Volver"
    >
      {children}
    </PermissionGuard>
  )
}
