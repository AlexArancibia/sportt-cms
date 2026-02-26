"use client"

import { useStores } from "@/hooks/useStores"
import { PermissionGuard } from "@/components/PermissionGuard"

function teamsPermission(pathname: string | null): string {
  if (pathname?.endsWith("/new")) return "teamContent:create"
  if (pathname?.includes("/edit")) return "teamContent:update"
  return "teamContent:list"
}

function isTeamsEditPage(pathname: string | null): boolean {
  return pathname?.includes("/edit") ?? false
}

export default function TeamsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { currentStoreId } = useStores()

  return (
    <PermissionGuard
      storeId={currentStoreId}
      permission={teamsPermission}
      headerTitle="Equipos"
      noStoreTitle="Selecciona una tienda"
      noStoreMessage="Para ver equipos, primero selecciona una tienda desde el menú lateral."
      noPermissionTitle="No tienes acceso a esta página"
      noPermissionMessage={(pathname) => {
        if (pathname?.endsWith("/new"))
          return "No tienes permiso para crear equipos. Si crees que deberías tener acceso, contacta al administrador de la tienda."
        if (isTeamsEditPage(pathname))
          return "No tienes permiso para editar equipos. Si crees que deberías tener acceso, contacta al administrador de la tienda."
        return "No tienes permiso para ver la sección de equipos. Si crees que deberías tener acceso, contacta al administrador de la tienda."
      }}
      backHref={(pathname) => {
        if (pathname?.endsWith("/new") || isTeamsEditPage(pathname)) return "/teams"
        return "/"
      }}
      backLabel="Volver"
    >
      {children}
    </PermissionGuard>
  )
}
