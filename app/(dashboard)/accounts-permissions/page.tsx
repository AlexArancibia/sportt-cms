"use client"

import { useState } from "react"
import { useStores } from "@/hooks/useStores"
import { useStoreAccounts } from "@/hooks/accounts/useStoreAccounts"
import { useUpdateStoreAccount } from "@/hooks/accounts/useUpdateStoreAccount"
import type { StoreAccount } from "@/hooks/accounts/useStoreAccounts"
import { HeaderBar } from "@/components/HeaderBar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { AddUserDialog } from "@/components/accounts/AddUserDialog"
import { CreateRoleDialog, type StoreRoleWithPermissions } from "@/components/accounts/CreateRoleDialog"
import { useStoreRoles } from "@/hooks/accounts/useStoreRoles"
import { useDeleteStoreRole } from "@/hooks/accounts/useDeleteStoreRole"
import { Loader2, UserCog, UserPlus, Pencil, Shield, ShieldPlus, Trash2, Copy } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { useStorePermissions, hasPermission } from "@/hooks/auth/useStorePermissions"
import type { StoreRole } from "@/hooks/accounts/useStoreRoles"

export default function AccountsPermissionsPage() {
  const { currentStoreId } = useStores()
  const { data: storePermissions } = useStorePermissions(currentStoreId)
  const canCreateAccount = hasPermission(storePermissions, "accounts:create")
  const canUpdateAccount = hasPermission(storePermissions, "accounts:update")
  const canDeleteAccount = hasPermission(storePermissions, "accounts:delete")
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [createRoleOpen, setCreateRoleOpen] = useState(false)
  const [editRole, setEditRole] = useState<StoreRoleWithPermissions | null>(null)
  const [copyRole, setCopyRole] = useState<StoreRoleWithPermissions | null>(null)
  const [editAccount, setEditAccount] = useState<StoreAccount | null>(null)
  const [roleToDelete, setRoleToDelete] = useState<StoreRole | null>(null)
  const { data: accounts = [], isLoading, isError, error } = useStoreAccounts(currentStoreId ?? null)
  const { data: roles = [], isLoading: rolesLoading } = useStoreRoles(currentStoreId ?? null)
  const updateAccount = useUpdateStoreAccount(currentStoreId ?? null)
  const deleteRole = useDeleteStoreRole(currentStoreId ?? null)
  const { toast } = useToast()

  if (!currentStoreId) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <UserCog className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Selecciona una tienda para ver las cuentas y permisos.
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Cargando cuentas...</span>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-destructive">
            No se pudieron cargar las cuentas. {(error as Error)?.message}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-1.5em)] bg-background rounded-xl text-foreground">
      <HeaderBar title="Cuentas y permisos" />

      <div className="container-section">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <p className="text-muted-foreground">
            Cuentas con acceso a esta tienda. Más opciones (roles, invitaciones) se irán agregando.
          </p>
          <Button size="sm" onClick={() => setAddUserOpen(true)} disabled={!canCreateAccount}>
            <UserPlus className="h-4 w-4 mr-2" />
            Agregar usuario
          </Button>
        </div>
        <AddUserDialog
          open={addUserOpen}
          onOpenChange={(open) => {
            setAddUserOpen(open)
            if (!open) setEditAccount(null)
          }}
          storeId={currentStoreId ?? null}
          editAccount={editAccount}
        />
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha de unión</TableHead>
                <TableHead className="w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No hay cuentas en esta tienda.
                  </TableCell>
                </TableRow>
              ) : (
                accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>
                      {[account.user.firstName, account.user.lastName].filter(Boolean).join(" ") || "—"}
                    </TableCell>
                    <TableCell>{account.user.email ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {account.isOwner && (
                          <Badge variant="default" className="text-xs">
                            Owner
                          </Badge>
                        )}
                        {account.roles.map((r) => (
                          <Badge key={r.id} variant="secondary" className="text-xs">
                            {r.name}
                          </Badge>
                        ))}
                        {!account.isOwner && account.roles.length === 0 && (
                          <span className="text-muted-foreground text-sm">Sin roles</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={account.isActive}
                        onCheckedChange={(checked) => {
                          const next = checked === true
                          if (next !== account.isActive) {
                            updateAccount.mutate({
                              storeUserId: account.id,
                              payload: { isActive: next },
                            })
                          }
                        }}
                        disabled={account.isOwner || updateAccount.isPending || !canUpdateAccount}
                        aria-label={account.isActive ? "Desactivar cuenta" : "Activar cuenta"}
                      />
                      <span className="ml-2 text-sm text-muted-foreground">
                        {account.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {account.joinedAt
                        ? new Date(account.joinedAt).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditAccount(account)
                          setAddUserOpen(true)
                        }}
                        disabled={!canUpdateAccount}
                        aria-label="Editar cuenta"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-1">
                <Shield className="h-5 w-5 text-muted-foreground" />
                Roles de la tienda
              </h2>
              <p className="text-muted-foreground text-sm">
                Roles disponibles para asignar a las cuentas. Los roles de sistema vienen predefinidos.
              </p>
            </div>
            <Button size="sm" onClick={() => { setEditRole(null); setCopyRole(null); setCreateRoleOpen(true) }} disabled={!canCreateAccount}>
              <ShieldPlus className="h-4 w-4 mr-2" />
              Crear rol
            </Button>
          </div>
          <CreateRoleDialog
            open={createRoleOpen}
            onOpenChange={(open) => {
              setCreateRoleOpen(open)
              if (!open) {
                setEditRole(null)
                setCopyRole(null)
              }
            }}
            storeId={currentStoreId ?? null}
            editRole={editRole}
            copyRole={copyRole}
          />
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="w-[120px]">Tipo</TableHead>
                  <TableHead className="w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rolesLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      <Loader2 className="h-5 w-5 animate-spin inline-block mr-2" />
                      Cargando roles…
                    </TableCell>
                  </TableRow>
                ) : roles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No hay roles en esta tienda.
                    </TableCell>
                  </TableRow>
                ) : (
                  (() => {
                    const assignedRoleIds = new Set(
                      accounts.flatMap((a) => a.roles.map((r) => r.id))
                    )
                    return roles.map((role: StoreRole) => {
                      const isAssigned = assignedRoleIds.has(role.id)
                      return (
                        <TableRow key={role.id}>
                          <TableCell className="font-medium">{role.name}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {role.description ?? "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={role.isSystem ? "secondary" : "outline"} className="text-xs">
                              {role.isSystem ? "Sistema" : "Personalizado"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  setCopyRole({
                                    id: role.id,
                                    name: role.name,
                                    description: role.description,
                                    isSystem: role.isSystem,
                                    permissions: [],
                                  })
                                  setEditRole(null)
                                  setCreateRoleOpen(true)
                                }}
                                disabled={!canCreateAccount}
                                aria-label="Copiar rol"
                                title="Copiar este rol para crear otro"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              {!role.isSystem && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => {
                                      setEditRole({
                                        id: role.id,
                                        name: role.name,
                                        description: role.description,
                                        isSystem: role.isSystem,
                                        permissions: [],
                                      })
                                      setCopyRole(null)
                                      setCreateRoleOpen(true)
                                    }}
                                    disabled={!canUpdateAccount}
                                    aria-label="Editar rol"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 disabled:opacity-50"
                                    onClick={() => setRoleToDelete(role)}
                                    disabled={deleteRole.isPending || isAssigned || !canDeleteAccount}
                                    aria-label={isAssigned ? "No se puede eliminar: rol asignado a usuarios" : "Eliminar rol"}
                                    title={isAssigned ? "Quita este rol de las cuentas que lo usan para poder eliminarlo" : undefined}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  })()
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <AlertDialog open={!!roleToDelete} onOpenChange={(open) => !open && setRoleToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar rol</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Estás seguro de que quieres eliminar el rol &quot;{roleToDelete?.name}&quot;? Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteRole.isPending}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault()
                  if (roleToDelete) {
                    deleteRole.mutate(roleToDelete.id, {
                      onSuccess: () => {
                        setRoleToDelete(null)
                        toast({ title: "Rol eliminado" })
                      },
                      onError: (err) => {
                        const raw =
                          (err as any)?.response?.data?.message ?? "No se pudo eliminar el rol."
                        const msg = Array.isArray(raw) ? raw.join(" ") : raw
                        toast({ title: msg, variant: "destructive" })
                      },
                    })
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteRole.isPending}
              >
                {deleteRole.isPending ? "Eliminando…" : "Eliminar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
