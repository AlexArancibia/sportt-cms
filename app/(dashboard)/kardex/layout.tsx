"use client"

import { useStores } from "@/hooks/useStores"
import { PermissionGuard } from "@/components/PermissionGuard"

function kardexPermission(_pathname: string | null): string {
  return "kardex:list"
}

export default function KardexLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { currentStoreId } = useStores()

  return (
    <PermissionGuard
      storeId={currentStoreId}
      permission={kardexPermission}
      headerTitle="Sistema de Kardex"
      noStoreTitle="Selecciona una tienda"
      noStoreMessage="Para ver el kardex, primero selecciona una tienda desde el menú lateral."
      noPermissionTitle="No tienes acceso a esta página"
      noPermissionMessage={() =>
        "No tienes permiso para ver el sistema de kardex. Si crees que deberías tener acceso, contacta al administrador de la tienda."
      }
      backHref={() => "/"}
      backLabel="Volver"
    >
      {children}
    </PermissionGuard>
  )
}
