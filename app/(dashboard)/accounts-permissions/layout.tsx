"use client"

import { useStores } from "@/hooks/useStores"
import { PermissionGuard } from "@/components/PermissionGuard"

function accountsPermission(_pathname: string | null): string {
  return "accounts:list"
}

export default function AccountsPermissionsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { currentStoreId } = useStores()

  return (
    <PermissionGuard
      storeId={currentStoreId}
      permission={accountsPermission}
      headerTitle="Cuentas y permisos"
      noStoreTitle="Selecciona una tienda"
      noStoreMessage="Para ver cuentas y permisos, primero selecciona una tienda desde el menú lateral."
      noPermissionTitle="No tienes acceso a esta página"
      noPermissionMessage={() =>
        "No tienes permiso para ver cuentas y permisos. Si crees que deberías tener acceso, contacta al administrador de la tienda."
      }
      backHref={() => "/"}
      backLabel="Volver"
    >
      {children}
    </PermissionGuard>
  )
}
