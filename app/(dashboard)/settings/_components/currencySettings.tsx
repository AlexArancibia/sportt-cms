"use client"

import { useState } from "react"
import { useMainStore } from "@/stores/mainStore"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Coins, DollarSign } from "lucide-react"

interface Currency {
  id: string
  code: string
  name: string
  symbol: string
  decimalPlaces: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

interface CurrencySettingsProps {
  currencies: Currency[]
  shopSettings: any
}

export default function CurrencySettings({ currencies, shopSettings }: CurrencySettingsProps) {
  const { updateShopSettings, addAcceptedCurrency, removeAcceptedCurrency } = useMainStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const isDefaultCurrency = (currencyId: string) => {
    return shopSettings && shopSettings.defaultCurrencyId === currencyId
  }

  const isAcceptedCurrency = (currencyId: string) => {
    if (!shopSettings || !shopSettings.acceptedCurrencies) return false
    return shopSettings.acceptedCurrencies.some((c: any) => c.id === currencyId)
  }

  const handleToggleAcceptedCurrency = async (currencyId: string, isAccepted: boolean) => {
    if (!shopSettings) return

    try {
      if (isAccepted) {
        await removeAcceptedCurrency(shopSettings.id, currencyId)
      } else {
        await addAcceptedCurrency(shopSettings.id, currencyId)
      }
      toast({
        title: isAccepted ? "Moneda removida" : "Moneda aceptada",
        description: isAccepted
          ? "La moneda ha sido removida de las monedas aceptadas"
          : "La moneda ha sido añadida a las monedas aceptadas",
      })
    } catch (error) {
      console.error("Error al actualizar monedas aceptadas:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar las monedas aceptadas. Por favor, intente nuevamente.",
      })
    }
  }

  const handleSetDefaultCurrency = async (currencyId: string) => {
    if (!shopSettings || !isAcceptedCurrency(currencyId)) return

    setIsSubmitting(true)
    try {
      await updateShopSettings(shopSettings.id, {
        defaultCurrencyId: currencyId,
      })
      toast({
        title: "Moneda predeterminada actualizada",
        description: "La moneda predeterminada ha sido actualizada correctamente",
      })
    } catch (error) {
      console.error("Error al actualizar moneda predeterminada:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar la moneda predeterminada. Por favor, intente nuevamente.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Coins className="h-6 w-6 text-primary" />
            Configuración de Monedas
          </h2>
          <p className="text-muted-foreground">Gestiona las monedas disponibles en tu tienda</p>
        </div>
      </div>

      {/* Lista de monedas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Monedas Disponibles
          </CardTitle>
          <CardDescription>
            {currencies.length} {currencies.length === 1 ? "moneda" : "monedas"} disponibles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currencies.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-muted rounded-lg">
              <Coins className="h-10 w-10 text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground font-medium">No hay monedas disponibles</p>
              <p className="text-sm text-muted-foreground">Las monedas se configuran a nivel del sistema</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Símbolo</TableHead>
                    <TableHead>Decimales</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Predeterminada</TableHead>
                    <TableHead>Aceptada</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currencies.map((currency) => (
                    <TableRow
                      key={currency.id}
                      className={`hover:bg-muted/50 ${isDefaultCurrency(currency.id) ? "bg-primary/5" : ""}`}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {isDefaultCurrency(currency.id) && (
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                              Predeterminada
                            </Badge>
                          )}
                          <span className="font-mono">{currency.code}</span>
                        </div>
                      </TableCell>
                      <TableCell>{currency.name}</TableCell>
                      <TableCell>
                        <span className="font-mono text-lg">{currency.symbol}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{currency.decimalPlaces}</Badge>
                      </TableCell>
                      <TableCell>
                        {currency.isActive ? (
                          <Badge className="bg-emerald-500 hover:bg-emerald-600">Activa</Badge>
                        ) : (
                          <Badge variant="secondary">Inactiva</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <RadioGroup
                          value={isDefaultCurrency(currency.id) ? currency.id : ""}
                          onValueChange={(value) => handleSetDefaultCurrency(value)}
                          disabled={isSubmitting || !currency.isActive || !isAcceptedCurrency(currency.id)}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value={currency.id} id={`default-${currency.id}`} />
                            <Label htmlFor={`default-${currency.id}`} className="sr-only">
                              Predeterminada
                            </Label>
                          </div>
                        </RadioGroup>
                        {!isAcceptedCurrency(currency.id) && !isDefaultCurrency(currency.id) && (
                          <p className="text-xs text-muted-foreground mt-1">Debe ser aceptada primero</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={isAcceptedCurrency(currency.id) || isDefaultCurrency(currency.id)}
                          onCheckedChange={(checked) =>
                            handleToggleAcceptedCurrency(currency.id, isAcceptedCurrency(currency.id))
                          }
                          disabled={
                            !shopSettings ||
                            !shopSettings.multiCurrencyEnabled ||
                            isDefaultCurrency(currency.id) ||
                            !currency.isActive
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información adicional */}
      {shopSettings && !shopSettings.multiCurrencyEnabled && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Coins className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800 dark:text-amber-200">Múltiples monedas deshabilitadas</h4>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Para aceptar múltiples monedas, habilita la opción "Múltiples monedas" en la configuración de la
                  tienda.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
