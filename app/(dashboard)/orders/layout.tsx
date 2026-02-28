"use client"

import { useStores } from "@/hooks/useStores"
import { PermissionGuard } from "@/components/PermissionGuard"

/** Match /edit as a path segment (e.g. /orders/123/edit), not as part of an id (e.g. /orders/edit-123). */
function isOrdersEditPath(pathname: string | null): boolean {
  return !!pathname?.match(/\/edit(\/|$)/)
}

function ordersPermission(pathname: string | null): string {
  if (pathname?.endsWith("/new")) return "orders:create"
  if (isOrdersEditPath(pathname)) return "orders:update"
  // /orders/[id] (detail view, no "edit" in path)
  if (pathname?.match(/^\/orders\/[^/]+$/)) return "orders:read"
  return "orders:list"
}

function isOrdersDetailPage(pathname: string | null): boolean {
  return !!pathname?.match(/^\/orders\/[^/]+$/)
}

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { currentStoreId } = useStores()

  return (
    <PermissionGuard
      storeId={currentStoreId}
      permission={ordersPermission}
      headerTitle="Pedidos"
      noStoreTitle="Selecciona una tienda"
      noStoreMessage="Para ver pedidos, primero selecciona una tienda desde el menú lateral."
      noPermissionTitle="No tienes acceso a esta página"
      noPermissionMessage={(pathname) => {
        if (pathname?.endsWith("/new"))
          return "No tienes permiso para crear pedidos. Si crees que deberías tener acceso, contacta al administrador de la tienda."
        if (isOrdersEditPath(pathname))
          return "No tienes permiso para editar pedidos. Si crees que deberías tener acceso, contacta al administrador de la tienda."
        if (isOrdersDetailPage(pathname))
          return "No tienes permiso para ver el detalle del pedido. Si crees que deberías tener acceso, contacta al administrador de la tienda."
        return "No tienes permiso para ver la sección de pedidos. Si crees que deberías tener acceso, contacta al administrador de la tienda."
      }}
      backHref={(pathname) => {
        if (pathname?.endsWith("/new") || isOrdersEditPath(pathname) || isOrdersDetailPage(pathname)) return "/orders"
        return "/"
      }}
      backLabel="Volver"
    >
      {children}
    </PermissionGuard>
  )
}
