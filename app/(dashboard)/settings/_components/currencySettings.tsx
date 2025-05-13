"use client"

import { useState, useMemo } from "react"
import { useMainStore } from "@/stores/mainStore"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface CurrencySettingsProps {
  currencies: any[]
  shopSettings: any
}

export default function CurrencySettings({ currencies, shopSettings }: CurrencySettingsProps) {
  const { updateShopSettings, addAcceptedCurrency, removeAcceptedCurrency } = useMainStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  const isDefaultCurrency = (currencyId: string) => {
    return shopSettings && shopSettings.defaultCurrencyId === currencyId
  }

  const isAcceptedCurrency = (currencyId: string) => {
    if (!shopSettings || !shopSettings.acceptedCurrencies) return false
    return shopSettings.acceptedCurrencies.some((c: any) => c.id === currencyId)
  }

  // Ordenar monedas: primero la predeterminada, luego las aceptadas, después el resto
  const sortedCurrencies = useMemo(() => {
    if (!currencies || currencies.length === 0) return []

    return [...currencies].sort((a, b) => {
      // La moneda predeterminada va primero
      if (isDefaultCurrency(a.id)) return -1
      if (isDefaultCurrency(b.id)) return 1

      // Luego las monedas aceptadas
      const aAccepted = isAcceptedCurrency(a.id)
      const bAccepted = isAcceptedCurrency(b.id)

      if (aAccepted && !bAccepted) return -1
      if (!aAccepted && bAccepted) return 1

      // Finalmente por código
      return a.code.localeCompare(b.code)
    })
  }, [currencies, shopSettings])

  // Filtrar monedas por término de búsqueda
  const filteredCurrencies = useMemo(() => {
    return sortedCurrencies.filter(
      (currency) =>
        currency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        currency.code.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [sortedCurrencies, searchTerm])

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
    <ScrollArea className="h-[calc(100vh-16rem)]">
      <div className="container-section">
        <div className="content-section box-container">
          <div className="box-section justify-between">
            <h3 className="text-lg font-medium">Monedas</h3>
          </div>

          <div className="box-section justify-between">
            <div className="relative max-w-sm">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Buscar monedas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {filteredCurrencies.length === 0 ? (
            <div className="flex items-center justify-center h-40 border rounded-md border-dashed">
              <p className="text-muted-foreground">No hay monedas disponibles</p>
            </div>
          ) : (
            <div className="box-section p-0">
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
                  {filteredCurrencies.map((currency) => (
                    <TableRow key={currency.id} className={isDefaultCurrency(currency.id) ? "bg-muted/30" : ""}>
                      <TableCell className="font-medium">
                        {isDefaultCurrency(currency.id) && (
                          <Badge variant="outline" className="mr-2 bg-primary/10">
                            Default
                          </Badge>
                        )}
                        {currency.code}
                      </TableCell>
                      <TableCell>{currency.name}</TableCell>
                      <TableCell>{currency.symbol}</TableCell>
                      <TableCell>{currency.decimalPlaces}</TableCell>
                      <TableCell>
                        {currency.isActive ? (
                          <Badge className="bg-green-500 hover:bg-green-600">Activa</Badge>
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
                          <span className="text-xs text-muted-foreground ml-2">Debe ser aceptada primero</span>
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

          {shopSettings && !shopSettings.multiCurrencyEnabled && (
            <div className="box-section border-none">
              <p className="text-sm text-muted-foreground">
                Para aceptar múltiples monedas, habilita la opción "Múltiples monedas" en la configuración de la tienda.
              </p>
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  )
}
