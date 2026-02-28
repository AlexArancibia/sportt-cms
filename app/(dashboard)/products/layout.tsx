"use client"

import { useStores } from "@/hooks/useStores"
import { PermissionGuard } from "@/components/PermissionGuard"

function productsPermission(pathname: string | null): string {
  if (pathname?.endsWith("/new")) return "products:create"
  if (pathname?.includes("/edit")) return "products:update"
  return "products:list"
}

function isProductsEditPage(pathname: string | null): boolean {
  return pathname?.includes("/edit") ?? false
}

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { currentStoreId } = useStores()

  return (
    <PermissionGuard
      storeId={currentStoreId}
      permission={productsPermission}
      headerTitle="Productos"
      noStoreTitle="Selecciona una tienda"
      noStoreMessage="Para ver productos, primero selecciona una tienda desde el menú lateral."
      noPermissionTitle="No tienes acceso a esta página"
      noPermissionMessage={(pathname) => {
        if (pathname?.endsWith("/new"))
          return "No tienes permiso para crear productos. Si crees que deberías tener acceso, contacta al administrador de la tienda."
        if (isProductsEditPage(pathname))
          return "No tienes permiso para editar productos. Si crees que deberías tener acceso, contacta al administrador de la tienda."
        return "No tienes permiso para ver la sección de productos. Si crees que deberías tener acceso, contacta al administrador de la tienda."
      }}
      backHref={(pathname) => {
        if (pathname?.endsWith("/new") || isProductsEditPage(pathname)) return "/products"
        return "/"
      }}
      backLabel="Volver"
    >
      {children}
    </PermissionGuard>
  )
}
