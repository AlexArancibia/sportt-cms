"use client"

import { useStores } from "@/hooks/useStores"
import { PermissionGuard } from "@/components/PermissionGuard"

function pageBuilderPermission(pathname: string | null): string {
  if (pathname?.includes("/hero-section")) return "pageBuilder:update"
  return "pageBuilder:read"
}

function isPageBuilderEditorRoute(pathname: string | null): boolean {
  return pathname?.includes("/hero-section") ?? false
}

export default function PageBuilderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { currentStoreId } = useStores()

  return (
    <PermissionGuard
      storeId={currentStoreId}
      permission={pageBuilderPermission}
      headerTitle="Page Builder"
      noStoreTitle="Selecciona una tienda"
      noStoreMessage="Para ver el Page Builder, primero selecciona una tienda desde el menú lateral."
      noPermissionTitle="No tienes acceso a esta página"
      noPermissionMessage={(pathname) => {
        if (isPageBuilderEditorRoute(pathname))
          return "No tienes permiso para editar componentes del Page Builder. Si crees que deberías tener acceso, contacta al administrador de la tienda."
        return "No tienes permiso para ver el Page Builder. Si crees que deberías tener acceso, contacta al administrador de la tienda."
      }}
      backHref={(pathname) => {
        if (isPageBuilderEditorRoute(pathname)) return "/page-builder"
        return "/"
      }}
      backLabel="Volver"
    >
      {children}
    </PermissionGuard>
  )
}
