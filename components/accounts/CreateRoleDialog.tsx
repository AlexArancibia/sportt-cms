"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useCreateStoreRole } from "@/hooks/accounts/useCreateStoreRole"
import { useUpdateStoreRole } from "@/hooks/accounts/useUpdateStoreRole"
import { useStoreRoleById, type StoreRoleWithPermissions } from "@/hooks/accounts/useStoreRoleById"
import {
  RBAC_RESOURCES,
  RBAC_RESOURCE_ACTIONS,
  RBAC_RESOURCE_LABELS,
  RBAC_ACTION_LABELS,
} from "@/types/permissions"
import type { RbacResource, RbacAction } from "@/types/permissions"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Plus, Trash2, ChevronRight } from "lucide-react"

/** Acciones mínimas que siempre van incluidas y no se pueden desmarcar. */
const REQUIRED_ACTIONS: RbacAction[] = ["list", "read", "view"]

interface PermissionRow {
  resource: RbacResource | ""
  actions: string[]
}

const defaultPermissionRow = (): PermissionRow => ({
  resource: "",
  actions: [],
})

/** Para un recurso, devuelve las acciones que deben estar siempre (list/read si existen). */
function requiredForResource(resource: RbacResource): string[] {
  const allowed = RBAC_RESOURCE_ACTIONS[resource]
  return REQUIRED_ACTIONS.filter((a) => allowed.includes(a))
}

/** Asegura que list y read siempre estén en actions para ese recurso. */
function ensureRequiredActions(resource: RbacResource | "", actions: string[]): string[] {
  if (!resource) return actions
  const required = requiredForResource(resource)
  const set = new Set(actions)
  required.forEach((a) => set.add(a))
  return Array.from(set)
}

/** Primera fila al crear un rol nuevo: Inicio (dashboard) ya seleccionado. */
function defaultPermissionsForNewRole(): PermissionRow[] {
  return [
    {
      resource: "dashboard",
      actions: ensureRequiredActions("dashboard", [
        ...RBAC_RESOURCE_ACTIONS["dashboard"],
      ]),
    },
  ]
}

interface CreateRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  storeId: string | null
  /** Si se pasa, el diálogo abre en modo edición. */
  editRole?: StoreRoleWithPermissions | null
  /** Si se pasa, el diálogo abre creando un rol nuevo copiando permisos de este rol. */
  copyRole?: StoreRoleWithPermissions | null
}

export type { StoreRoleWithPermissions } from "@/hooks/accounts/useStoreRoleById"

export function CreateRoleDialog({
  open,
  onOpenChange,
  storeId,
  editRole,
  copyRole,
}: CreateRoleDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [permissions, setPermissions] = useState<PermissionRow[]>(() =>
    defaultPermissionsForNewRole()
  )
  const createMutation = useCreateStoreRole(storeId)
  const updateMutation = useUpdateStoreRole(storeId)
  const sourceRole = editRole ?? copyRole ?? null
  const {
    data: roleDetail,
    isLoading: roleLoading,
    isError: roleError,
  } = useStoreRoleById(
    storeId,
    sourceRole?.id ?? null,
    open && !!sourceRole?.id
  )
  const { toast } = useToast()
  const isEdit = Boolean(editRole?.id)
  const isPending = createMutation.isPending || updateMutation.isPending
  /** En edición: no mostrar el formulario hasta haber rellenado desde roleDetail (evita ver "Seleccionar recurso" un frame). */
  const [editFormSynced, setEditFormSynced] = useState(false)

  useEffect(() => {
    if (!open) return

    // Editar rol existente
    if (editRole?.id && roleDetail) {
      setName(roleDetail.name)
      setDescription(roleDetail.description ?? "")
      setPermissions(
        roleDetail.permissions?.length
          ? roleDetail.permissions.map((p) => ({
              resource: p.resource as RbacResource,
              actions: ensureRequiredActions(
                p.resource as RbacResource,
                (p.actions as string[]) ?? []
              ),
            }))
          : [defaultPermissionRow()]
      )
      setEditFormSynced(true)
      return
    }

    // Copiar rol (crear uno nuevo a partir de otro)
    if (!editRole?.id && copyRole?.id && roleDetail) {
      setName(`${roleDetail.name} copia`)
      setDescription(roleDetail.description ?? "")
      setPermissions(
        roleDetail.permissions?.length
          ? roleDetail.permissions.map((p) => ({
              resource: p.resource as RbacResource,
              actions: ensureRequiredActions(
                p.resource as RbacResource,
                (p.actions as string[]) ?? []
              ),
            }))
          : [defaultPermissionRow()]
      )
      setEditFormSynced(true)
      return
    }

    // Crear rol desde cero
    if (!editRole && !copyRole) {
      setName("")
      setDescription("")
      setPermissions(defaultPermissionsForNewRole())
      setEditFormSynced(true)
    }
  }, [open, editRole?.id, copyRole?.id, roleDetail])

  const addPermissionRow = () => {
    setPermissions((p) => [...p, defaultPermissionRow()])
  }

  const removePermissionRow = (index: number) => {
    setPermissions((p) => p.filter((_, i) => i !== index))
  }

  const setPermissionResource = (index: number, resource: RbacResource | "") => {
    setPermissions((p) => {
      const next = [...p]
      const baseActions =
        resource === "" ? [] : [...RBAC_RESOURCE_ACTIONS[resource]]
      next[index] = {
        resource,
        actions: ensureRequiredActions(resource, baseActions),
      }
      return next
    })
  }

  const setPermissionActions = (index: number, actions: string[]) => {
    setPermissions((p) => {
      const next = [...p]
      const row = next[index]
      const merged = ensureRequiredActions(row.resource, actions)
      next[index] = { ...row, actions: merged }
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const nameTrim = name.trim()
    if (!nameTrim) {
      toast({ title: "El nombre del rol es obligatorio", variant: "destructive" })
      return
    }
    const validPermissions = permissions
      .filter((p) => p.resource && p.actions.length > 0)
      .reduce((acc, p) => {
        const existing = acc.find((x) => x.resource === p.resource)
        if (existing) {
          existing.actions = Array.from(
            new Set([...existing.actions, ...p.actions])
          )
        } else {
          acc.push({ ...p })
        }
        return acc
      }, [] as PermissionRow[])
    const payload = {
      name: nameTrim,
      description: description.trim() || undefined,
      permissions:
        validPermissions.length > 0
          ? validPermissions.map((p) => ({
              resource: p.resource as string,
              actions: p.actions,
            }))
          : undefined,
    }
    try {
      if (isEdit && editRole?.id) {
        await updateMutation.mutateAsync({ roleId: editRole.id, ...payload })
        onOpenChange(false)
        toast({ title: "Rol actualizado correctamente" })
      } else {
        await createMutation.mutateAsync(payload)
        setName("")
        setDescription("")
        setPermissions(defaultPermissionsForNewRole())
        onOpenChange(false)
        toast({ title: "Rol creado correctamente" })
      }
    } catch {
      // Error shown via mutation.error
    }
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      if (!isEdit) {
        setName("")
        setDescription("")
        setPermissions(defaultPermissionsForNewRole())
      }
      setEditFormSynced(false)
      createMutation.reset()
      updateMutation.reset()
    }
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl w-full">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar rol" : "Crear rol"}</DialogTitle>
        </DialogHeader>
        {isEdit && (!roleDetail || !editFormSynced) ? (
          roleError ? (
            <div className="flex flex-col items-center justify-center gap-3 py-8">
              <p className="text-sm text-destructive text-center">
                No se pudo cargar el rol. Intenta de nuevo.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cerrar
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role-name">Nombre</Label>
              <Input
                id="role-name"
                placeholder="Ej. Vendedor, Soporte"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-desc">Descripción (opcional)</Label>
              <Input
                id="role-desc"
                placeholder="Breve descripción del rol"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                disabled={isPending}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Permisos (opcional)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPermissionRow}
                  disabled={isPending}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar permiso
                </Button>
              </div>
              <div className="space-y-3 rounded-md border p-3 max-h-[420px] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {permissions.map((row, index) => (
                    <div
                      key={index}
                      className="flex flex-wrap items-end gap-2 sm:gap-3"
                    >
                    <div className="flex-1 min-w-[140px] space-y-1">
                      <span className="text-xs text-muted-foreground">
                        Recurso
                      </span>
                      <Select
                        value={row.resource || "_"}
                        onValueChange={(v) =>
                          setPermissionResource(
                            index,
                            v === "_" ? "" : (v as RbacResource)
                          )
                        }
                        disabled={isPending}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Seleccionar recurso" />
                        </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_">Seleccionar recurso</SelectItem>
                            {RBAC_RESOURCES.map((res) => {
                              const usedResources = permissions
                                .map((p, i) => (i === index ? null : p.resource))
                                .filter(
                                  (r): r is RbacResource | "" => Boolean(r)
                                )

                              const isUsed = usedResources.includes(res)

                              return (
                                <SelectItem
                                  key={res}
                                  value={res}
                                  disabled={isUsed}
                                >
                                  {RBAC_RESOURCE_LABELS[res]}
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-[2] min-w-[200px] space-y-2">
                      <span className="text-xs text-muted-foreground">
                        Acciones
                      </span>
                      {row.resource ? (
                        <Collapsible defaultOpen={false} className="rounded-md border bg-muted/30">
                          <CollapsibleTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="group w-full justify-between px-3 h-9 font-normal text-sm"
                            >
                              <span>
                                {row.actions.length} seleccionada
                                {row.actions.length !== 1 ? "s" : ""}
                              </span>
                              <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="flex flex-wrap gap-x-4 gap-y-2 p-3 pt-0">
                              {RBAC_RESOURCE_ACTIONS[row.resource].map((action) => {
                                const isRequired = REQUIRED_ACTIONS.includes(action as RbacAction)
                                return (
                                  <label
                                    key={action}
                                    className={`flex items-center gap-2 text-sm ${!isRequired ? "cursor-pointer" : "cursor-default opacity-90"}`}
                                  >
                                    <Checkbox
                                      checked={row.actions.includes(action)}
                                      onCheckedChange={(checked) => {
                                        if (isRequired && !checked) return
                                        const next = checked
                                          ? [...row.actions, action]
                                          : row.actions.filter((a) => a !== action)
                                        setPermissionActions(index, ensureRequiredActions(row.resource, next))
                                      }}
                                      disabled={isPending || isRequired}
                                    />
                                    <span>{RBAC_ACTION_LABELS[action as RbacAction]}</span>
                                  </label>
                                )
                              })}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ) : (
                        <p className="text-xs text-muted-foreground py-2">
                          Elige un recurso para ver las acciones
                        </p>
                      )}
                    </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removePermissionRow(index)}
                        disabled={isPending || permissions.length <= 1}
                        aria-label="Quitar permiso"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {(createMutation.isError || updateMutation.isError) && (
              <p className="text-sm text-destructive">
                {(createMutation.error as Error)?.message ??
                  (updateMutation.error as Error)?.message ??
                  (isEdit ? "Error al actualizar el rol." : "Error al crear el rol.")}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={!name.trim() || isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEdit ? "Guardando…" : "Creando…"}
                  </>
                ) : isEdit ? (
                  "Guardar cambios"
                ) : (
                  "Crear rol"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
