"use client"

import { useStores } from "@/hooks/useStores"
import { PermissionGuard } from "@/components/PermissionGuard"

function cardsPermission(pathname: string | null): string {
  if (pathname?.endsWith("/new")) return "cards:create"
  if (pathname?.includes("/edit")) return "cards:update"
  return "cards:list"
}

function isCardsEditPage(pathname: string | null): boolean {
  return pathname?.includes("/edit") ?? false
}

export default function CardsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { currentStoreId } = useStores()

  return (
    <PermissionGuard
      storeId={currentStoreId}
      permission={cardsPermission}
      headerTitle="Tarjetas"
      noStoreTitle="Selecciona una tienda"
      noStoreMessage="Para ver secciones de tarjetas, primero selecciona una tienda desde el menú lateral."
      noPermissionTitle="No tienes acceso a esta página"
      noPermissionMessage={(pathname) => {
        if (pathname?.endsWith("/new"))
          return "No tienes permiso para crear secciones de tarjetas. Si crees que deberías tener acceso, contacta al administrador de la tienda."
        if (isCardsEditPage(pathname))
          return "No tienes permiso para editar secciones de tarjetas. Si crees que deberías tener acceso, contacta al administrador de la tienda."
        return "No tienes permiso para ver la sección de tarjetas. Si crees que deberías tener acceso, contacta al administrador de la tienda."
      }}
      backHref={(pathname) => {
        if (pathname?.endsWith("/new") || isCardsEditPage(pathname)) return "/cards"
        return "/"
      }}
      backLabel="Volver"
    >
      {children}
    </PermissionGuard>
  )
}
