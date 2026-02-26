"use client"

import { useStores } from "@/hooks/useStores"
import { PermissionGuard } from "@/components/PermissionGuard"

export default function PosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { currentStoreId } = useStores()

  return (
    <PermissionGuard
      storeId={currentStoreId}
      permission="orders:create"
      headerTitle="POS"
      noStoreTitle="Selecciona una tienda"
      noStoreMessage="Para usar el POS, primero selecciona una tienda desde el menú lateral."
      noPermissionTitle="No tienes acceso al POS"
      noPermissionMessage="No tienes permiso para usar el punto de venta. Si crees que deberías tener acceso, contacta al administrador de la tienda."
      backHref="/orders"
      backLabel="Volver"
    >
      {children}
    </PermissionGuard>
  )
}
