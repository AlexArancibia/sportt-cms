"use client"

import { useStores } from "@/hooks/useStores"
import { PermissionGuard } from "@/components/PermissionGuard"

function collectionsPermission(pathname: string | null): string {
  if (pathname?.endsWith("/new")) return "collections:create"
  if (pathname?.includes("/edit")) return "collections:update"
  return "collections:list"
}

function isCollectionsEditPage(pathname: string | null): boolean {
  return pathname?.includes("/edit") ?? false
}

export default function CollectionsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { currentStoreId } = useStores()

  return (
    <PermissionGuard
      storeId={currentStoreId}
      permission={collectionsPermission}
      headerTitle="Colecciones"
      noStoreTitle="Selecciona una tienda"
      noStoreMessage="Para ver colecciones, primero selecciona una tienda desde el menú lateral."
      noPermissionTitle="No tienes acceso a esta página"
      noPermissionMessage={(pathname) => {
        if (pathname?.endsWith("/new"))
          return "No tienes permiso para crear colecciones. Si crees que deberías tener acceso, contacta al administrador de la tienda."
        if (isCollectionsEditPage(pathname))
          return "No tienes permiso para editar colecciones. Si crees que deberías tener acceso, contacta al administrador de la tienda."
        return "No tienes permiso para ver la sección de colecciones. Si crees que deberías tener acceso, contacta al administrador de la tienda."
      }}
      backHref={(pathname) => {
        if (pathname?.endsWith("/new") || isCollectionsEditPage(pathname)) return "/collections"
        return "/"
      }}
      backLabel="Volver"
    >
      {children}
    </PermissionGuard>
  )
}
