"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { formatDate } from "@/lib/utils"
import { Store } from "@/types/store"

interface StoreInfoProps {
  store: Store
}

export default function StoreInfo({ store }: StoreInfoProps) {
  if (!store) {
    return (
      <div className="flex items-center justify-center h-40 border rounded-md border-dashed">
        <p className="text-muted-foreground">No hay información de tienda disponible</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border rounded-md shadow-sm hover:shadow-md transition-all">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Nombre de la tienda</Label>
                <p className="text-lg font-medium">{store.name}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Slug</Label>
                <p className="text-sm">{store.slug}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Estado</Label>
                <div>
                  {store.isActive ? (
                    <Badge className="bg-green-500 hover:bg-green-600">Activa</Badge>
                  ) : (
                    <Badge variant="destructive">Inactiva</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border rounded-md shadow-sm hover:shadow-md transition-all">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Plan</Label>
                <p className="text-lg font-medium">{store.planType || "No especificado"}</p>
              </div>

              {store.planExpiryDate && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Fecha de expiración del plan</Label>
                  <p className="text-sm">{formatDate(new Date(store.planExpiryDate))}</p>
                </div>
              )}

              {store.maxProducts !== null && store.maxProducts !== undefined && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Límite de productos</Label>
                  <p className="text-sm">{store.maxProducts}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground">Fechas</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Creada: </span>
            {formatDate(new Date(store.createdAt))}
          </div>
          <div>
            <span className="text-muted-foreground">Última actualización: </span>
            {formatDate(new Date(store.updatedAt))}
          </div>
        </div>
      </div>
    </div>
  )
}
