"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { useStores } from "@/hooks/useStores"
import { useKardex } from "@/hooks/kardex/useKardex"
import { useCurrencies } from "@/hooks/useCurrencies"
import { useShopSettings } from "@/hooks/useShopSettings"
import { useCategories } from "@/hooks/useCategories"
import { useToast } from "@/hooks/use-toast"
import { HeaderBar } from "@/components/HeaderBar"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { KardexFilters } from "./_components/KardexFilters"
import { KardexGrid } from "./_components/KardexGrid"
import { KardexStats } from "./_components/KardexStats"
import type { KardexFilters as KardexFiltersType } from "@/types/kardex"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getErrorMessage } from "@/lib/errorHelpers"

export default function KardexPage() {
  const { currentStoreId } = useStores()
  const { toast } = useToast()
  const hasToastedError = useRef(false)

  const [filters, setFilters] = useState<KardexFiltersType>({
    page: 1,
    limit: 20,
    sortBy: "createdAt",
    sortOrder: "desc",
  })
  const [selectedCurrencyId, setSelectedCurrencyId] = useState<string | null>(null)

  const { data: kardexData, isLoading: kardexLoading, isError: kardexError, error: kardexErrorDetail } = useKardex(
    currentStoreId,
    filters,
    !!currentStoreId
  )
  const { data: currencies = [] } = useCurrencies()
  const { data: currentShopSettings } = useShopSettings(currentStoreId)
  const { data: categoriesData } = useCategories(
    currentStoreId,
    { page: 1, limit: 100, sortBy: "name", sortOrder: "asc" },
    !!currentStoreId
  )

  const kardex = kardexData?.data ?? []
  const kardexPagination = kardexData?.pagination ?? null

  const filterCategories = useMemo(() => {
    const fromApi = categoriesData?.data?.map((c) => c.name).sort() ?? []
    if (fromApi.length > 0) return fromApi
    const fromKardex = new Set<string>()
    kardex.forEach((item) => item.product.categories.forEach((c) => fromKardex.add(c)))
    return Array.from(fromKardex).sort()
  }, [categoriesData, kardex])

  const acceptedCurrencies = useMemo(() => {
    const shopCurrencies = currentShopSettings?.acceptedCurrencies?.filter((c) => c.isActive) ?? []
    return shopCurrencies.length > 0 ? shopCurrencies : currencies.filter((c) => c.isActive)
  }, [currentShopSettings, currencies])

  const defaultCurrencyId = useMemo(
    () =>
      currentShopSettings?.defaultCurrencyId ??
      acceptedCurrencies[0]?.id ??
      currencies.find((c) => c.isActive)?.id ??
      null,
    [currentShopSettings, acceptedCurrencies, currencies]
  )

  useEffect(() => {
    if (!defaultCurrencyId) return
    const isValid = selectedCurrencyId && acceptedCurrencies.some((c) => c.id === selectedCurrencyId)
    if (!selectedCurrencyId || !isValid) {
      setSelectedCurrencyId(defaultCurrencyId)
    }
  }, [defaultCurrencyId, selectedCurrencyId, acceptedCurrencies])

  useEffect(() => {
    if (!kardexError || !kardexErrorDetail || hasToastedError.current) return
    hasToastedError.current = true
    toast({
      variant: "destructive",
      title: "Error",
      description: getErrorMessage(kardexErrorDetail),
    })
  }, [kardexError, kardexErrorDetail, toast])

  useEffect(() => {
    if (!kardexError) hasToastedError.current = false
  }, [kardexError])

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }))
  }

  const handleFiltersChange = (newFilters: KardexFiltersType) => {
    setFilters(newFilters)
  }

  const handleExport = () => {
    toast({
      title: "Exportar",
      description: "Función de exportación próximamente disponible",
    })
  }

  if (!currentStoreId) {
    return (
      <div className="container mx-auto px-4 py-6">
        <HeaderBar title="Sistema de Kardex" />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-lg font-medium text-muted-foreground">No hay tienda seleccionada</p>
            <p className="text-sm text-muted-foreground mt-2">
              Por favor, seleccione una tienda desde el menú lateral
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <HeaderBar title="Sistema de Kardex" />
        <div className="flex items-center gap-3">
          {acceptedCurrencies.length > 0 && (
            <Select
              value={selectedCurrencyId ?? undefined}
              onValueChange={(value) => setSelectedCurrencyId(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Seleccionar moneda" />
              </SelectTrigger>
              <SelectContent>
                {acceptedCurrencies.map((currency) => (
                  <SelectItem key={currency.id} value={currency.id}>
                    {currency.name} ({currency.code}) {currency.symbol}
                    {currency.id === currentShopSettings?.defaultCurrencyId && " - Predeterminada"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      <KardexStats
        filters={filters}
        storeId={currentStoreId}
        selectedCurrencyId={selectedCurrencyId}
      />

      <KardexFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        categories={filterCategories}
        currencies={acceptedCurrencies.map((c) => ({
          id: c.id,
          code: c.code,
          name: c.name,
          symbol: c.symbol,
        }))}
      />

      <KardexGrid
        products={kardex}
        pagination={kardexPagination}
        loading={kardexLoading}
        onPageChange={handlePageChange}
        selectedCurrencyId={selectedCurrencyId}
        hasMovementTypeFilter={!!filters.movementType && filters.movementType.length > 0}
        hasDateFilter={!!filters.startDate || !!filters.endDate}
        hasCurrencyFilter={!!filters.currency && filters.currency.length > 0}
      />
    </div>
  )
}
