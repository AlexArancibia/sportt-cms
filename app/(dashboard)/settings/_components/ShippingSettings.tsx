"use client"

import React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, Pencil, Trash2, Loader2, Truck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useMainStore } from "@/stores/mainStore"
import { ShippingMethod } from "@/types/shippingMethod"
import { ShopSettings } from "@/types/store"
import { Currency } from "@/types/currency"

interface ShippingSettingsProps {
  shippingMethods: ShippingMethod[]
  shopSettings: ShopSettings | null
}

export default function ShippingSettings({ shippingMethods, shopSettings }: ShippingSettingsProps) {
  const { deleteShippingMethod } = useMainStore()
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const { toast } = useToast()

  const getMainPrice = (method: ShippingMethod): string => {
    if (!method.prices || method.prices.length === 0) return "No definido"
    const price = method.prices[0]
    const currency = shopSettings?.acceptedCurrencies?.find((c: Currency) => c.id === price.currencyId)
    
    if (!currency) return `${Number(price.price).toFixed(2)}`
    
    return currency.symbolPosition === 'BEFORE' 
      ? `${currency.symbol} ${Number(price.price).toFixed(currency.decimalPlaces)}`
      : `${Number(price.price).toFixed(currency.decimalPlaces)} ${currency.symbol}`
  }

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este método de envío? Esta acción no se puede deshacer.")) {
      setDeletingId(id)
      try {
        await deleteShippingMethod(id)
        toast({
          title: "✅ Método eliminado",
          description: "El método de envío ha sido eliminado correctamente",
        })
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "❌ Error",
          description: "No se pudo eliminar el método de envío. Por favor, intente nuevamente.",
        })
      } finally {
        setDeletingId(null)
      }
    }
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className=" ">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <CardTitle className="text-xl font-semibold">Métodos de envío</CardTitle>
            <p className="text-sm text-muted-foreground">
              Configura los métodos de envío disponibles en tu tienda
            </p>
          </div>
          <Link href="/shipping-methods/new">
            <Button className="gap-2" size="sm">
              <Plus className="h-4 w-4" />
              Nuevo método
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {shippingMethods.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 border rounded-lg bg-muted/20">
            <div className="p-4 rounded-full bg-muted/50 mb-4">
              <Truck className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-1">No hay métodos de envío</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Añade métodos de envío para que tus clientes puedan recibir sus pedidos
            </p>
            <Link href="/shipping-methods/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Crear primer método
              </Button>
            </Link>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[200px]">Nombre</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Monedas</TableHead>
                  <TableHead>Tiempo de entrega</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shippingMethods.map((method) => (
                  <TableRow key={method.id} className="hover:bg-muted/10">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {method.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {getMainPrice(method)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {method.prices?.map((price) => {
                          const currency = shopSettings?.acceptedCurrencies?.find(
                            (c: Currency) => c.id === price.currencyId
                          )
                          return (
                            <Badge 
                              key={price.currencyId} 
                              variant="outline" 
                              className="text-xs"
                            >
                              {currency?.code || price.currencyId}
                            </Badge>
                          )
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      {method.minDeliveryDays && method.maxDeliveryDays ? (
                        <div className="flex items-center gap-1">
                          <span>{method.minDeliveryDays}-{method.maxDeliveryDays} días</span>
                        </div>
                      ) : (
                        <span>{method.estimatedDeliveryTime || "-"}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={method.isActive ? "default" : "secondary"}
                        className={method.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                      >
                        {method.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Link href={`/shipping-methods/edit/${method.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-muted"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(method.id)}
                          disabled={deletingId === method.id}
                          className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                        >
                          {deletingId === method.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}