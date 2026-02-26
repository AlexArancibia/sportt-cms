"use client"

import { useStores } from "@/hooks/useStores"
import { PermissionGuard } from "@/components/PermissionGuard"

function contentsPermission(pathname: string | null): string {
  if (pathname?.endsWith("/new")) return "contents:create"
  if (pathname?.includes("/edit")) return "contents:update"
  return "contents:list"
}

function isContentsEditPage(pathname: string | null): boolean {
  return pathname?.includes("/edit") ?? false
}

export default function ContentsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { currentStoreId } = useStores()

  return (
    <PermissionGuard
      storeId={currentStoreId}
      permission={contentsPermission}
      headerTitle="Contenidos"
      noStoreTitle="Selecciona una tienda"
      noStoreMessage="Para ver contenidos, primero selecciona una tienda desde el menú lateral."
      noPermissionTitle="No tienes acceso a esta página"
      noPermissionMessage={(pathname) => {
        if (pathname?.endsWith("/new"))
          return "No tienes permiso para crear contenidos. Si crees que deberías tener acceso, contacta al administrador de la tienda."
        if (isContentsEditPage(pathname))
          return "No tienes permiso para editar contenidos. Si crees que deberías tener acceso, contacta al administrador de la tienda."
        return "No tienes permiso para ver la sección de contenidos. Si crees que deberías tener acceso, contacta al administrador de la tienda."
      }}
      backHref={(pathname) => {
        if (pathname?.endsWith("/new") || isContentsEditPage(pathname)) return "/contents"
        return "/"
      }}
      backLabel="Volver"
    >
      {children}
    </PermissionGuard>
  )
}
