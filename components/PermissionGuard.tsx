"use client"

import { usePathname } from "next/navigation"
import { useStorePermissions, hasPermission } from "@/hooks/auth/useStorePermissions"
import { NoPermissionScreen } from "@/components/NoPermissionScreen"
import { PermissionsErrorCard } from "@/components/PermissionsErrorCard"
import { HeaderBar } from "@/components/HeaderBar"
import { Store, Loader2 } from "lucide-react"

type StringOrFromPath = string | ((pathname: string | null) => string)

export interface PermissionGuardProps {
  storeId: string | null
  /** Required permission (e.g. "products:list") or function that returns it from pathname (e.g. for /products/new → "products:create") */
  permission: string | ((pathname: string | null) => string)
  headerTitle: string
  noStoreTitle?: string
  noStoreMessage?: string
  noPermissionTitle?: StringOrFromPath
  noPermissionMessage?: StringOrFromPath
  backHref?: StringOrFromPath
  backLabel?: string
  children: React.ReactNode
}

function resolve(value: StringOrFromPath | undefined, pathname: string | null, fallback: string): string {
  if (value == null) return fallback
  return typeof value === "function" ? value(pathname) : value
}

const DEFAULT_NO_STORE_TITLE = "Selecciona una tienda"
const DEFAULT_NO_STORE_MESSAGE = "Para continuar, selecciona una tienda desde el menú lateral."
const DEFAULT_NO_PERMISSION_TITLE = "No tienes permiso para ver esta página"
const DEFAULT_NO_PERMISSION_MESSAGE =
  "No tienes permiso para ver esta página. Si crees que deberías tener acceso, contacta al administrador de la tienda."
const DEFAULT_BACK_LABEL = "Volver"

export function PermissionGuard({
  storeId,
  permission,
  headerTitle,
  noStoreTitle = DEFAULT_NO_STORE_TITLE,
  noStoreMessage = DEFAULT_NO_STORE_MESSAGE,
  noPermissionTitle = DEFAULT_NO_PERMISSION_TITLE,
  noPermissionMessage = DEFAULT_NO_PERMISSION_MESSAGE,
  backHref = "/",
  backLabel = DEFAULT_BACK_LABEL,
  children,
}: PermissionGuardProps) {
  const pathname = usePathname()
  const requiredPermission =
    typeof permission === "function" ? permission(pathname) : permission

  const {
    data: storePermissions,
    isLoading: permissionsLoading,
    isFetching: permissionsFetching,
    isError: permissionsError,
    refetch: refetchPermissions,
  } = useStorePermissions(storeId)

  const allowed = hasPermission(storePermissions, requiredPermission)

  if (!storeId) {
    return (
      <div className="h-[calc(100vh-1.5em)] bg-background rounded-xl text-foreground">
        <HeaderBar title={headerTitle} />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)]">
          <div className="flex flex-col items-center justify-center p-12 rounded-xl text-center border border-dashed border-border bg-muted/20 max-w-lg">
            <Store className="h-16 w-16 mb-6 text-primary/60" />
            <h2 className="text-xl font-medium mb-3 text-foreground">{noStoreTitle}</h2>
            <p className="text-muted-foreground text-sm max-w-sm">{noStoreMessage}</p>
          </div>
        </div>
      </div>
    )
  }

  if (permissionsLoading) {
    return (
      <div className="h-[calc(100vh-1.5em)] bg-background rounded-xl text-foreground">
        <HeaderBar title={headerTitle} />
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (permissionsError) {
    return (
      <div className="h-[calc(100vh-1.5em)] bg-background rounded-xl text-foreground">
        <HeaderBar title={headerTitle} />
        <PermissionsErrorCard
          onRetry={() => refetchPermissions()}
          isRetrying={permissionsFetching}
        />
      </div>
    )
  }

  if (!allowed) {
    return (
      <div className="h-[calc(100vh-1.5em)] bg-background rounded-xl text-foreground">
        <HeaderBar title={headerTitle} />
        <NoPermissionScreen
          title={resolve(noPermissionTitle, pathname, DEFAULT_NO_PERMISSION_TITLE)}
          message={resolve(noPermissionMessage, pathname, DEFAULT_NO_PERMISSION_MESSAGE)}
          backHref={resolve(backHref, pathname, "/")}
          backLabel={backLabel}
        />
      </div>
    )
  }

  return <>{children}</>
}
