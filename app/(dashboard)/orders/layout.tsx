"use client"

import { useStores } from "@/hooks/useStores"
import { PermissionGuard } from "@/components/PermissionGuard"

function ordersPermission(pathname: string | null): string {
  if (pathname?.endsWith("/new")) return "orders:create"
  if (pathname?.includes("/edit")) return "orders:update"
  // /orders/[id] (detail view, no "edit" in path)
  if (pathname?.match(/^\/orders\/[^/]+$/)) return "orders:read"
  return "orders:list"
}

function isOrdersEditPage(pathname: string | null): boolean {
  return pathname?.includes("/edit") ?? false
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
        if (isOrdersEditPage(pathname))
          return "No tienes permiso para editar pedidos. Si crees que deberías tener acceso, contacta al administrador de la tienda."
        if (isOrdersDetailPage(pathname))
          return "No tienes permiso para ver el detalle del pedido. Si crees que deberías tener acceso, contacta al administrador de la tienda."
        return "No tienes permiso para ver la sección de pedidos. Si crees que deberías tener acceso, contacta al administrador de la tienda."
      }}
      backHref={(pathname) => {
        if (pathname?.endsWith("/new") || isOrdersEditPage(pathname) || isOrdersDetailPage(pathname)) return "/orders"
        return "/"
      }}
      backLabel="Volver"
    >
      {children}
    </PermissionGuard>
  )
}
