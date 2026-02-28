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
import { Checkbox } from "@/components/ui/checkbox"
import { useStoreRoles } from "@/hooks/accounts/useStoreRoles"
import { useCreateStoreAccount } from "@/hooks/accounts/useCreateStoreAccount"
import { useUpdateStoreAccount } from "@/hooks/accounts/useUpdateStoreAccount"
import type { StoreAccount } from "@/hooks/accounts/useStoreAccounts"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface AddUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  storeId: string | null
  /** Si se pasa, el diálogo abre en modo edición (solo roles). */
  editAccount?: StoreAccount | null
}

const defaultForm = {
  email: "",
  firstName: "",
  lastName: "",
  password: "",
  phone: "",
  roleIds: [] as string[],
}

export function AddUserDialog({ open, onOpenChange, storeId, editAccount }: AddUserDialogProps) {
  const [form, setForm] = useState(defaultForm)
  const isEdit = !!editAccount
  const { data: roles = [], isLoading: rolesLoading } = useStoreRoles(storeId)
  const createMutation = useCreateStoreAccount(storeId)
  const updateMutation = useUpdateStoreAccount(storeId)
  const { toast } = useToast()

  useEffect(() => {
    if (open && editAccount) {
      setForm({
        email: editAccount.user.email ?? "",
        firstName: editAccount.user.firstName ?? "",
        lastName: editAccount.user.lastName ?? "",
        password: "",
        phone: "",
        roleIds: editAccount.roles.map((r) => r.id),
      })
    } else if (open && !editAccount) {
      setForm(defaultForm)
    }
  }, [open, editAccount])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isEdit) {
      if (form.roleIds.length === 0) {
        toast({ title: "Asigna al menos un rol", variant: "destructive" })
        return
      }
      try {
        await updateMutation.mutateAsync({
          storeUserId: editAccount!.id,
          payload: { roleIds: form.roleIds },
        })
        onOpenChange(false)
        toast({ title: "Cuenta actualizada" })
      } catch {
        // Error shown via updateMutation.error
      }
      return
    }
    if (!form.email.trim() || !form.firstName.trim() || !form.lastName.trim() || !form.password) {
      toast({ title: "Completa los campos obligatorios", variant: "destructive" })
      return
    }
    if (form.roleIds.length === 0) {
      toast({ title: "Asigna al menos un rol", variant: "destructive" })
      return
    }
    if (form.password.length < 6) {
      toast({ title: "La contraseña debe tener al menos 6 caracteres", variant: "destructive" })
      return
    }
    try {
      await createMutation.mutateAsync({
        email: form.email.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        password: form.password,
        phone: form.phone.trim() || undefined,
        roleIds: form.roleIds,
      })
      setForm(defaultForm)
      onOpenChange(false)
      toast({ title: "Usuario agregado correctamente" })
    } catch {
      // Error shown via createMutation.error
    }
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setForm(defaultForm)
      createMutation.reset()
      updateMutation.reset()
    }
    onOpenChange(next)
  }

  const toggleRole = (roleId: string, checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      roleIds: checked ? [...prev.roleIds, roleId] : prev.roleIds.filter((id) => id !== roleId),
    }))
  }

  const pending = createMutation.isPending || updateMutation.isPending
  const isFormValid = isEdit
    ? !rolesLoading && roles.length > 0 && form.roleIds.length >= 1
    : form.firstName.trim() !== "" &&
      form.lastName.trim() !== "" &&
      form.email.trim() !== "" &&
      form.password.length >= 6 &&
      !rolesLoading &&
      roles.length > 0 &&
      form.roleIds.length >= 1

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar cuenta" : "Agregar usuario (empleado)"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isEdit ? (
            <div className="space-y-2 rounded-md border p-3 text-sm">
              <p>
                <span className="text-muted-foreground">Nombre:</span>{" "}
                {[form.firstName, form.lastName].filter(Boolean).join(" ") || "—"}
              </p>
              <p>
                <span className="text-muted-foreground">Email:</span> {form.email || "—"}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="first-name">Nombre</Label>
                  <Input
                    id="first-name"
                    placeholder="Juan"
                    value={form.firstName}
                    onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                    required
                    disabled={pending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name">Apellido</Label>
                  <Input
                    id="last-name"
                    placeholder="Pérez"
                    value={form.lastName}
                    onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                    required
                    disabled={pending}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@ejemplo.com"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  required
                  disabled={pending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  required
                  minLength={6}
                  disabled={pending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono (opcional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+54 11 1234-5678"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  disabled={pending}
                />
              </div>
            </>
          )}
          {rolesLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando roles…
            </div>
          ) : roles.length > 0 ? (
            <div className="space-y-2">
              <Label>Roles (al menos uno)</Label>
              <div className="flex flex-col gap-2 rounded-md border p-3">
                {roles.map((role) => (
                  <label
                    key={role.id}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={form.roleIds.includes(role.id)}
                      onCheckedChange={(checked) => toggleRole(role.id, checked === true)}
                      disabled={pending}
                    />
                    <span>{role.name}</span>
                    {role.description && (
                      <span className="text-muted-foreground">— {role.description}</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No hay roles en esta tienda.</p>
          )}
          {(createMutation.isError || updateMutation.isError) && (
            <p className="text-sm text-destructive">
              {((createMutation.error ?? updateMutation.error) as Error)?.message ??
                "Error al guardar."}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!isFormValid || pending}>
              {pending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEdit ? "Guardando…" : "Creando…"}
                </>
              ) : isEdit ? (
                "Guardar cambios"
              ) : (
                "Crear usuario"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
