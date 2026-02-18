"use client"

import { useState, useEffect, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useExchangeRates } from "@/hooks/useExchangeRates"
import { useExchangeRateMutations } from "@/hooks/settings/useExchangeRateMutations"
import { Loader2, TrendingUp } from "lucide-react"
import type { ExchangeRate } from "@/types/exchangeRate"

const DECIMALS = 4
const TOLERANCE = 1e-5

function roundTo4(value: number): number {
  return Math.round(value * 1e4) / 1e4
}

function formatRate(value: number | null): string {
  if (value == null || value <= 0 || !Number.isFinite(value)) return ""
  return roundTo4(value).toFixed(DECIMALS)
}

/** Solo dígitos y un punto; sin límite de decimales mientras escribe. */
function sanitizeDecimalInput(raw: string): string {
  return raw.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1")
}

/** Parsea, valida (>0) y redondea a 4 decimales; devuelve null si vacío o inválido. */
function parseAndRoundRate(raw: string): number | null {
  if (raw === "") return null
  const num = parseFloat(raw)
  if (!Number.isFinite(num) || num <= 0) return null
  return roundTo4(num)
}

function toRateNumber(rate: string | number): number {
  return typeof rate === "string" ? parseFloat(rate) : Number(rate)
}

/**
 * Devuelve la última tasa por moneda (por fecha), según dirección:
 * - fromBase: registros base→X → key = toCurrencyId (columna principal)
 * - toBase: registros X→base → key = fromCurrencyId (columna inversa desde API)
 */
function getLatestRatesMap(
  exchangeRates: ExchangeRate[],
  baseId: string,
  direction: "fromBase" | "toBase"
): Map<string, { rate: number; effectiveDate: string }> {
  const match = direction === "fromBase" ? (er: ExchangeRate) => er.fromCurrencyId === baseId : (er: ExchangeRate) => er.toCurrencyId === baseId
  const keyOf = direction === "fromBase" ? (er: ExchangeRate) => er.toCurrencyId : (er: ExchangeRate) => er.fromCurrencyId
  const sorted = exchangeRates
    .filter(match)
    .sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime())
  const map = new Map<string, { rate: number; effectiveDate: string }>()
  for (const er of sorted) {
    const key = keyOf(er)
    if (!map.has(key)) map.set(key, { rate: toRateNumber(er.rate), effectiveDate: er.effectiveDate })
  }
  return map
}

interface ExchangeRatesCardProps {
  storeId: string | null
  defaultCurrency: { id: string; code: string }
  acceptedCurrencies: Array<{ id: string; code: string }>
}

export default function ExchangeRatesCard({ storeId, defaultCurrency, acceptedCurrencies }: ExchangeRatesCardProps) {
  const { data: exchangeRates = [], refetch } = useExchangeRates({
    latestPerPair: true,
    storeId,
  })
  const { createExchangeRate } = useExchangeRateMutations(storeId)
  const { toast } = useToast()

  const baseId = defaultCurrency.id
  const latestByToId = useMemo(() => getLatestRatesMap(exchangeRates, baseId, "fromBase"), [exchangeRates, baseId])
  const latestInverseByFromId = useMemo(() => getLatestRatesMap(exchangeRates, baseId, "toBase"), [exchangeRates, baseId])

  // Tasa principal (base → destino) e inversa (destino → base). La inversa se guarda para que al editar esa columna no se pise el valor al recalcular.
  const [ratesByToId, setRatesByToId] = useState<Record<string, string>>({})
  const [inverseByToId, setInverseByToId] = useState<Record<string, string>>({})
  const [loadingByToId, setLoadingByToId] = useState<Record<string, boolean>>({})
  const [principalInputRaw, setPrincipalInputRaw] = useState<Record<string, string>>({})
  const [inverseInputRaw, setInverseInputRaw] = useState<Record<string, string>>({})

  const acceptedIdsKey = acceptedCurrencies.map((c) => c.id).sort().join(",")
  const latestRatesKey = useMemo(() => {
    const ids = acceptedIdsKey ? acceptedIdsKey.split(",") : []
    return ids
      .map((id) => {
        const p = latestByToId.get(id)
        const i = latestInverseByFromId.get(id)
        return `${id}:${p?.rate ?? ""}:${p?.effectiveDate ?? ""}:${i?.rate ?? ""}:${i?.effectiveDate ?? ""}`
      })
      .join("|")
  }, [latestByToId, latestInverseByFromId, acceptedIdsKey])

  useEffect(() => {
    const ids = acceptedIdsKey ? acceptedIdsKey.split(",").filter(Boolean) : []
    const next: Record<string, string> = {}
    const nextInverse: Record<string, string> = {}
    for (const id of ids) {
      const principal = latestByToId.get(id)
      const inverseFromApi = latestInverseByFromId.get(id)
      const useInverseFromApi = inverseFromApi != null && inverseFromApi.rate > 0

      next[id] = principal != null ? formatRate(principal.rate) : ""
      nextInverse[id] = useInverseFromApi ? formatRate(inverseFromApi.rate) : principal != null ? formatRate(1 / principal.rate) : ""
    }
    setRatesByToId(next)
    setInverseByToId(nextInverse)
    setPrincipalInputRaw({})
    setInverseInputRaw({})
  }, [latestRatesKey, acceptedIdsKey])

  const clearRaw = (prev: Record<string, string>, key: string) => {
    const next = { ...prev }
    delete next[key]
    return next
  }

  const handlePrincipalChange = (toCurrencyId: string, rawValue: string) => {
    setPrincipalInputRaw((prev) => ({ ...prev, [toCurrencyId]: sanitizeDecimalInput(rawValue) }))
  }

  const handlePrincipalBlur = (toCurrencyId: string) => {
    const raw = principalInputRaw[toCurrencyId]
    setPrincipalInputRaw((prev) => clearRaw(prev, toCurrencyId))
    if (raw === undefined) return
    const rate = parseAndRoundRate(raw)
    if (rate == null) return
    setRatesByToId((prev) => ({ ...prev, [toCurrencyId]: String(rate) }))
    setInverseByToId((prev) => ({ ...prev, [toCurrencyId]: formatRate(1 / rate) }))
  }

  const handleInverseChange = (toCurrencyId: string, rawValue: string) => {
    setInverseInputRaw((prev) => ({ ...prev, [toCurrencyId]: sanitizeDecimalInput(rawValue) }))
  }

  const handleInverseBlur = (toCurrencyId: string) => {
    const raw = inverseInputRaw[toCurrencyId]
    setInverseInputRaw((prev) => clearRaw(prev, toCurrencyId))
    if (raw === undefined) return
    const inverseRate = parseAndRoundRate(raw)
    if (inverseRate == null) return
    setInverseByToId((prev) => ({ ...prev, [toCurrencyId]: formatRate(inverseRate) }))
    setRatesByToId((prev) => ({ ...prev, [toCurrencyId]: String(roundTo4(1 / inverseRate)) }))
  }

  const hasChange = (toCurrencyId: string): boolean => {
    const stored = ratesByToId[toCurrencyId]
    if (stored === undefined || stored === "") return false
    const num = parseFloat(stored)
    if (isNaN(num) || num <= 0) return false
    const latest = latestByToId.get(toCurrencyId)
    if (!latest) return true
    return Math.abs(roundTo4(num) - roundTo4(latest.rate)) > TOLERANCE
  }

  const getPrincipalDisplay = (toCurrencyId: string): string => {
    const stored = ratesByToId[toCurrencyId]
    if (stored === undefined || stored === "") return ""
    const num = parseFloat(stored)
    if (isNaN(num) || num <= 0) return ""
    return formatRate(num)
  }

  const getInverseDisplay = (toCurrencyId: string): string => {
    const committed = inverseByToId[toCurrencyId]
    if (committed != null && committed !== "") return committed
    const stored = ratesByToId[toCurrencyId]
    if (stored == null || stored === "") return ""
    const num = parseFloat(stored)
    if (!Number.isFinite(num) || num <= 0) return ""
    return formatRate(1 / num)
  }

  const handleUpdateRate = async (toCurrencyId: string) => {
    const raw = ratesByToId[toCurrencyId] ?? ""
    const rate = roundTo4(parseFloat(raw))
    if (isNaN(rate) || rate <= 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "La tasa debe ser un número mayor que 0.",
      })
      return
    }

    setLoadingByToId((prev) => ({ ...prev, [toCurrencyId]: true }))
    const effectiveDate = new Date().toISOString()

    const invStr = inverseByToId[toCurrencyId]
    const invNum = invStr != null && invStr !== "" ? parseFloat(invStr) : NaN
    const inverseRate =
      Number.isFinite(invNum) && invNum > 0 ? roundTo4(invNum) : roundTo4(1 / rate)

    try {
      await createExchangeRate({
        fromCurrencyId: defaultCurrency.id,
        toCurrencyId,
        rate,
        effectiveDate,
      })
    } catch (err) {
      setLoadingByToId((prev) => ({ ...prev, [toCurrencyId]: false }))
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar la tasa de cambio. Intente de nuevo.",
      })
      return
    }

    try {
      await createExchangeRate({
        fromCurrencyId: toCurrencyId,
        toCurrencyId: defaultCurrency.id,
        rate: inverseRate,
        effectiveDate,
      })
    } catch (err) {
      setLoadingByToId((prev) => ({ ...prev, [toCurrencyId]: false }))
      toast({
        variant: "destructive",
        title: "Error",
        description:
          "Se guardó la tasa en un sentido; no se pudo guardar la inversa. Revise y vuelva a guardar si es necesario.",
      })
      await refetch()
      setRatesByToId((prev) => ({ ...prev, [toCurrencyId]: formatRate(rate) }))
      setInverseByToId((prev) => ({ ...prev, [toCurrencyId]: formatRate(inverseRate) }))
      return
    }

    setLoadingByToId((prev) => ({ ...prev, [toCurrencyId]: false }))
    toast({
      title: "Tasa actualizada",
      description: "La tasa de cambio se guardó correctamente.",
    })
    await refetch()
    setRatesByToId((prev) => ({ ...prev, [toCurrencyId]: formatRate(rate) }))
    setInverseByToId((prev) => ({ ...prev, [toCurrencyId]: formatRate(inverseRate) }))
  }

  if (acceptedCurrencies.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Tasas de cambio
        </CardTitle>
        <CardDescription>
          Tasa de la moneda principal ({defaultCurrency.code}) hacia cada moneda aceptada. Al actualizar se crea un
          nuevo registro con la fecha y hora actual. Editable desde cualquier columna de tasa; siempre 4 decimales.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Moneda base</TableHead>
                <TableHead>Moneda</TableHead>
                <TableHead>Tasa ({defaultCurrency.code} → destino)</TableHead>
                <TableHead>Tasa (destino → {defaultCurrency.code})</TableHead>
                <TableHead>Última actualización</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {acceptedCurrencies.map((currency) => {
                const latest = latestByToId.get(currency.id)
                const principalValue =
                  principalInputRaw[currency.id] !== undefined
                    ? principalInputRaw[currency.id]
                    : getPrincipalDisplay(currency.id) || (latest != null ? formatRate(latest.rate) : "")
                const inverseValue =
                  inverseInputRaw[currency.id] !== undefined
                    ? inverseInputRaw[currency.id]
                    : getInverseDisplay(currency.id)
                const isLoading = loadingByToId[currency.id] ?? false
                const canSave = hasChange(currency.id) && !isLoading

                return (
                  <TableRow key={currency.id}>
                    <TableCell className="pl-6 font-mono font-medium">{defaultCurrency.code}</TableCell>
                    <TableCell className="font-mono font-medium">{currency.code}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.0001"
                        min="0.0001"
                        value={principalValue}
                        onChange={(e) => handlePrincipalChange(currency.id, e.target.value)}
                        onBlur={() => handlePrincipalBlur(currency.id)}
                        disabled={isLoading}
                        aria-label={`Tasa ${defaultCurrency.code} a ${currency.code}`}
                        className="max-w-[140px]"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.0001"
                        min="0.0001"
                        value={inverseValue}
                        onChange={(e) => handleInverseChange(currency.id, e.target.value)}
                        onBlur={() => handleInverseBlur(currency.id)}
                        disabled={isLoading}
                        aria-label={`Tasa ${currency.code} a ${defaultCurrency.code}`}
                        className="max-w-[140px]"
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {latest?.effectiveDate
                        ? new Date(latest.effectiveDate).toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateRate(currency.id)}
                        disabled={!canSave}
                        aria-label={`Actualizar tasa para ${currency.code}`}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Actualizar tasa
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
