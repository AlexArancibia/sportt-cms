"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { useVariantsMismatchedPrices, useAdjustPricesByExchangeRates } from "@/hooks/settings/useVariantsMismatchedPrices"
import { Loader2, RefreshCw, AlertTriangle } from "lucide-react"

const DEFAULT_LIMIT = 20

interface VariantsMismatchedPricesCardProps {
  storeId: string | null
  defaultCurrency: { id: string; code: string }
}

function formatPrice(value: number, symbol: string): string {
  return `${symbol} ${value.toFixed(2)}`
}

export default function VariantsMismatchedPricesCard({
  storeId,
  defaultCurrency,
}: VariantsMismatchedPricesCardProps) {
  const [page, setPage] = useState(1)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const { data, isLoading, isFetching } = useVariantsMismatchedPrices(
    storeId,
    page,
    DEFAULT_LIMIT,
    !!storeId
  )
  const showLoading = isLoading || isFetching
  const adjustPrices = useAdjustPricesByExchangeRates(storeId)
  const { toast } = useToast()

  const count = data?.count ?? 0
  const totalPages = data?.totalPages ?? 0
  const variants = data?.variants ?? []
  const hasMismatched = count >= 1

  const handleAdjustPrices = async () => {
    setConfirmOpen(false)
    try {
      await adjustPrices.mutateAsync(defaultCurrency.id)
      toast({
        title: "Precios actualizados",
        description: "Se han recalculado los precios según la tasa actual.",
      })
      setPage(1)
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron actualizar los precios. Intente de nuevo.",
      })
    }
  }

  if (!storeId) return null

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Precios según tasa actual
          </CardTitle>
          <CardDescription>
            Variantes con precios en otras monedas que no coinciden con la tasa actual (moneda principal:{" "}
            {defaultCurrency.code}). Si hay variantes desfasadas, puede actualizar todos los precios de una vez.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="default"
              size="sm"
              onClick={() => setConfirmOpen(true)}
              disabled={!hasMismatched || adjustPrices.isPending}
              aria-label="Actualizar todos los precios según tasa actual"
            >
              {adjustPrices.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Actualizando…
                </>
              ) : (
                "Actualizar todos los precios según tasa actual"
              )}
            </Button>
            {!hasMismatched && !showLoading && (
              <span className="text-sm text-muted-foreground">
                No hay variantes con precios desfasados.
              </span>
            )}
          </div>

          {showLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 rounded-md border border-dashed bg-muted/30 text-sm text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin shrink-0" />
              Cargando variantes…
            </div>
          ) : hasMismatched ? (
            <>
              <p className="text-sm text-muted-foreground">
                {count} {count === 1 ? "variante no cuadra" : "variantes no cuadran"} con la tasa actual.
              </p>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[140px]">Producto</TableHead>
                      <TableHead className="min-w-[120px]">Variante</TableHead>
                      <TableHead className="min-w-[100px]">SKU</TableHead>
                      <TableHead>Precios (actual / esperado)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {variants.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell className="font-medium">{v.product.title}</TableCell>
                        <TableCell>{v.title}</TableCell>
                        <TableCell className="text-muted-foreground font-mono text-sm">
                          {v.sku ?? "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                            {v.prices.map((p) => (
                              <span key={p.currencyId} className="whitespace-nowrap">
                                <span className="font-mono text-muted-foreground">{p.currencyCode}</span>:{" "}
                                {formatPrice(p.price, p.symbol)}
                                {p.expectedPrice !== p.price && (
                                  <span className="text-amber-600 dark:text-amber-400">
                                    {" "}→ {formatPrice(p.expectedPrice, p.symbol)}
                                  </span>
                                )}
                                {p.originalPrice != null && (
                                  <span className="text-muted-foreground ml-1">
                                    (orig. {formatPrice(p.originalPrice, p.symbol)}
                                    {p.expectedOriginalPrice != null && p.expectedOriginalPrice !== p.originalPrice && (
                                      <span className="text-amber-600 dark:text-amber-400">
                                        {" "}→ {formatPrice(p.expectedOriginalPrice, p.symbol)}
                                      </span>
                                    )}
                                    )
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-muted-foreground">
                    Página {data?.page ?? 1} de {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Actualización masiva de precios
            </AlertDialogTitle>
            <AlertDialogDescription>
              Se actualizarán los precios de todas las variantes en las monedas distintas a la principal (
              {defaultCurrency.code}). Los precios se recalcularán según la tasa de cambio actual. Esta acción no
              modifica los precios en la moneda principal. ¿Desea continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleAdjustPrices()
              }}
              className="bg-primary text-primary-foreground"
            >
              {adjustPrices.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Actualizando…
                </>
              ) : (
                "Actualizar precios"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
