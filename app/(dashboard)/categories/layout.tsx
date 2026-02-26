"use client"

import { useStores } from "@/hooks/useStores"
import { PermissionGuard } from "@/components/PermissionGuard"

export default function CategoriesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { currentStoreId } = useStores()

  return (
    <PermissionGuard
      storeId={currentStoreId}
      permission="categories:list"
      headerTitle="Categorias"
      noStoreTitle="Selecciona una tienda"
      noStoreMessage="Para ver las categorías, primero selecciona una tienda desde el menú lateral."
      noPermissionTitle="No tienes acceso a esta página"
      noPermissionMessage="No tienes permiso para ver categorías. Si crees que deberías tener acceso, contacta al administrador de la tienda."
      backHref="/"
      backLabel="Volver"
    >
      {children}
    </PermissionGuard>
  )
}
