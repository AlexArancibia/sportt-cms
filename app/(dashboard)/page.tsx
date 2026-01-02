"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion } from "framer-motion"
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Store,
  Calendar,
  CreditCard,
  BarChart3,
  Clock,
  Percent,
  Coins,
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts"
import { format, subDays, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { useMainStore } from "@/stores/mainStore"
import { useStatisticsStore, type CurrencyInfo } from "@/stores/statisticsStore"
import { HeaderBar } from "@/components/HeaderBar"
import { useAuthStore } from "@/stores/authStore"
import { JsonViewer } from "@/components/json-viewer"

// Color palette for charts
const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

// Format currency using CurrencyInfo from API responses
const formatCurrency = (value: number, currency?: CurrencyInfo) => {
  const formattedValue = new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
  
  return currency?.symbol ? `${currency.symbol}${formattedValue}` : formattedValue
}

// Format percentage
const formatPercent = (value: number) => {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`
}

export default function DashboardPage() {
  const { currentStore, currencies, fetchCurrencies, shopSettings, fetchShopSettings } = useMainStore()
  const { stores } = useAuthStore()
  const {
    overview,
    sales,
    products,
    customers,
    inventory,
    trends,
    weeklyPerformance,
    loading,
    error,
    fetchAllStatistics,
    fetchWeeklyPerformance,
    clearStatistics,
  } = useStatisticsStore()

  const [dateFrom, setDateFrom] = useState(() => format(subDays(new Date(), 30), "yyyy-MM-dd"))
  const [dateTo, setDateTo] = useState(() => format(new Date(), "yyyy-MM-dd"))
  const [selectedCurrencyId, setSelectedCurrencyId] = useState<string | undefined>(undefined)
  const [initialized, setInitialized] = useState(false)

  // Load currencies and shop settings on mount or when store changes
  useEffect(() => {
    const loadStoreData = async () => {
      if (currentStore) {
        await Promise.all([
          fetchShopSettings(currentStore),
          fetchCurrencies(),
        ])
      } else {
        fetchCurrencies()
      }
    }
    loadStoreData()
  }, [currentStore, fetchShopSettings, fetchCurrencies])

  // Get current shop settings
  const currentShopSettings = useMemo(() => {
    return shopSettings.find(s => s.storeId === currentStore)
  }, [shopSettings, currentStore])

  // Get active currencies for the selector (use accepted currencies from shop, fallback to all active)
  const activeCurrencies = useMemo(() => {
    const shopCurrencies = currentShopSettings?.acceptedCurrencies?.filter(c => c.isActive) || []
    return shopCurrencies.length > 0 
      ? shopCurrencies 
      : currencies.filter(c => c.isActive)
  }, [currentShopSettings, currencies])

  // Get current store name
  const currentStoreName = useMemo(() => {
    if (!currentStore || !stores.length) return null
    const store = stores.find((s) => s.id === currentStore)
    return store?.name || "Tienda"
  }, [currentStore, stores])

  // Get currency from statistics (all responses should have the same currency)
  const currentCurrency = useMemo(() => {
    return overview?.currency || sales?.currency || products?.currency || customers?.currency || trends?.currency
  }, [overview?.currency, sales?.currency, products?.currency, customers?.currency, trends?.currency])

  // Helper: Build filter parameters
  const getFilterParams = () => ({
    startDate: dateFrom ? new Date(dateFrom) : undefined,
    endDate: dateTo ? new Date(dateTo) : undefined,
    currencyId: selectedCurrencyId && selectedCurrencyId !== "all" ? selectedCurrencyId : undefined,
  })

  // Helper: Fetch statistics with current filters
  const fetchStatistics = () => {
    if (!currentStore) return
    const { startDate, endDate, currencyId } = getFilterParams()
    fetchAllStatistics(currentStore, startDate, endDate, currencyId)
    fetchWeeklyPerformance(currentStore, startDate, endDate, currencyId)
  }

  // Fetch statistics when store or filters change
  useEffect(() => {
    if (currentStore) {
      const { startDate, endDate, currencyId } = getFilterParams()
      Promise.all([
        fetchAllStatistics(currentStore, startDate, endDate, currencyId),
        fetchWeeklyPerformance(currentStore, startDate, endDate, currencyId),
      ]).then(() => setInitialized(true)).catch(() => setInitialized(true))
    } else {
      clearStatistics()
      setInitialized(true)
    }
  }, [currentStore, dateFrom, dateTo, selectedCurrencyId, fetchAllStatistics, fetchWeeklyPerformance, clearStatistics])

  // Handle filter apply and refresh (same logic)
  const handleFilterApply = fetchStatistics
  const handleRefresh = fetchStatistics

  // Clear filters
  const handleClearFilters = () => {
    setDateFrom(format(subDays(new Date(), 30), "yyyy-MM-dd"))
    setDateTo(format(new Date(), "yyyy-MM-dd"))
    setSelectedCurrencyId(undefined)
  }

  // Build API URLs and data for JsonViewer
  const apiDebugData = useMemo(() => {
    if (!currentStore) return null

    const baseURL = process.env.NEXT_PUBLIC_BACKEND_ENDPOINT || ""
    const { startDate, endDate, currencyId } = getFilterParams()
    const startDateStr = startDate ? format(startDate, "yyyy-MM-dd") : undefined
    const endDateStr = endDate ? format(endDate, "yyyy-MM-dd") : undefined

    const buildQueryString = (start?: string, end?: string, currency?: string) => {
      const params = new URLSearchParams()
      if (start) params.append("startDate", start)
      if (end) params.append("endDate", end)
      if (currency) params.append("currencyId", currency)
      return params.toString() ? `?${params.toString()}` : ""
    }

    const queryString = buildQueryString(startDateStr, endDateStr, currencyId)
    const trendsQuery = buildQueryString(startDateStr, endDateStr, currencyId)
    const trendsQueryString = trendsQuery ? `${trendsQuery}${trendsQuery.includes('?') ? '&' : '?'}groupBy=day` : '?groupBy=day'

    return {
      requests: {
        overview: {
          method: "GET",
          url: `${baseURL}/statistics/${currentStore}/overview${queryString}`,
          response: overview,
        },
        sales: {
          method: "GET",
          url: `${baseURL}/statistics/${currentStore}/sales${queryString}`,
          response: sales,
        },
        products: {
          method: "GET",
          url: `${baseURL}/statistics/${currentStore}/products${queryString}`,
          response: products,
        },
        customers: {
          method: "GET",
          url: `${baseURL}/statistics/${currentStore}/customers${queryString}`,
          response: customers,
        },
        inventory: {
          method: "GET",
          url: `${baseURL}/statistics/${currentStore}/inventory`,
          response: inventory,
        },
        trends: {
          method: "GET",
          url: `${baseURL}/statistics/${currentStore}/trends${trendsQueryString}`,
          response: trends,
        },
        weeklyPerformance: {
          method: "GET",
          url: `${baseURL}/statistics/${currentStore}/weekly${queryString}`,
          response: weeklyPerformance,
        },
      },
      storeId: currentStore,
      dateRange: {
        from: dateFrom,
        to: dateTo,
      },
      currencyId: currencyId || "Todas",
      loading,
      error,
    }
  }, [currentStore, dateFrom, dateTo, selectedCurrencyId, overview, sales, products, customers, inventory, trends, weeklyPerformance, loading, error])

  // Show message when no store is selected
  if (!currentStore) {
    return (
      <div className="h-[calc(100vh-1.5em)] bg-background rounded-xl text-foreground">
        <HeaderBar title="Dashboard" />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center p-12 rounded-xl text-center border border-dashed border-border bg-muted/20 max-w-lg"
          >
            <Store className="h-16 w-16 mb-6 text-primary/60" />
            <h2 className="text-xl font-medium mb-3 text-foreground">
              Selecciona una tienda
            </h2>
            <p className="text-muted-foreground text-sm max-w-sm">
              Para ver las estadísticas del dashboard, primero selecciona una tienda desde el menú lateral.
            </p>
          </motion.div>
        </div>
      </div>
    )
  }

  // Loading state
  if (!initialized || (loading && !overview)) {
    return (
      <div className="h-[calc(100vh-1.5em)] bg-background rounded-xl text-foreground">
        <HeaderBar title={`Dashboard - ${currentStoreName || "Cargando..."}`} jsonData={apiDebugData} jsonLabel="API Debug Info" />
        <ScrollArea className="h-[calc(100vh-5.5rem)]">
          <div className="container-section">
            <div className="content-section space-y-6">
              <LoadingSkeleton />
            </div>
          </div>
        </ScrollArea>
      </div>
    )
  }

  // Error state
  if (error && !overview) {
    return (
      <div className="h-[calc(100vh-1.5em)] bg-background rounded-xl text-foreground">
        <HeaderBar title={`Dashboard - ${currentStoreName}`} jsonData={apiDebugData} jsonLabel="API Debug Info" />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center p-12 rounded-xl text-center border border-destructive/30 bg-destructive/5 max-w-lg"
          >
            <AlertTriangle className="h-16 w-16 mb-6 text-destructive/60" />
            <h2 className="text-xl font-medium mb-3 text-foreground">
              Error al cargar estadísticas
            </h2>
            <p className="text-muted-foreground text-sm max-w-sm mb-6">{error}</p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-1.5em)] bg-background rounded-xl text-foreground">
      <HeaderBar title={`Dashboard - ${currentStoreName}`} jsonData={apiDebugData} jsonLabel="API Debug Info" />
      <ScrollArea className="h-[calc(100vh-5.5rem)]">
        <div className="container-section">
          <div className="content-section space-y-6">
            {/* Date Filters */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="box-container"
            >
              <div className="box-section flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Filtrar por fecha:</span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground">Desde</label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-auto h-9 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground">Hasta</label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-auto h-9 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-muted-foreground" />
                    <label className="text-xs text-muted-foreground">Moneda</label>
                    <Select
                      value={selectedCurrencyId || "all"}
                      onValueChange={(value) => setSelectedCurrencyId(value === "all" ? undefined : value)}
                    >
                      <SelectTrigger className="w-[180px] h-9 text-sm">
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {activeCurrencies.map((currency) => (
                          <SelectItem key={currency.id} value={currency.id}>
                            {currency.code.toUpperCase()} - {currency.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleFilterApply} size="sm" className="h-9">
                    Aplicar
                  </Button>
                  <Button onClick={handleClearFilters} variant="outline" size="sm" className="h-9">
                    Limpiar
                  </Button>
                  <Button
                    onClick={handleRefresh}
                    variant="ghost"
                    size="sm"
                    className="h-9"
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* KPIs Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                title="Ingresos Totales"
                value={formatCurrency(Number(overview?.totalRevenue || 0), currentCurrency)}
                subtitle={`Promedio: ${formatCurrency(Number(overview?.averageOrderValue || 0), currentCurrency)}`}
                icon={DollarSign}
                trend={sales?.refundStats?.refundRate ? -sales.refundStats.refundRate : 0}
                color="primary"
                index={0}
              />
              <KPICard
                title="Órdenes"
                value={overview?.totalOrders?.toString() || "0"}
                subtitle={`Completadas: ${overview?.completedOrders || 0} | Total: ${overview?.totalOrders || 0}`}
                icon={ShoppingCart}
                trend={0}
                color="chart-2"
                index={1}
              />
              <KPICard
                title="Clientes"
                value={overview?.totalCustomers?.toString() || "0"}
                subtitle={`Nuevos: ${customers?.newCustomers || 0} | Recurrentes: ${customers?.returningCustomers || 0}`}
                icon={Users}
                trend={customers?.customerRetentionRate || 0}
                color="chart-3"
                index={2}
              />
              <KPICard
                title="Productos"
                value={overview?.totalProducts?.toString() || "0"}
                subtitle={`Activos: ${overview?.activeProducts || 0} | Bajo stock: ${overview?.lowStockProducts || 0}`}
                icon={Package}
                trend={0}
                color="chart-4"
                index={3}
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Sales Trend Chart */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-2"
              >
                <Card className="h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base font-medium">Tendencia de Ventas</CardTitle>
                        <CardDescription>Ingresos de los últimos 30 días</CardDescription>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {trends?.period || "día"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[280px]">
                      {trends?.data && trends.data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={trends.data}>
                            <defs>
                              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <XAxis
                              dataKey="period"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                              tickFormatter={(value) => {
                                try {
                                  return format(parseISO(value), "dd MMM", { locale: es })
                                } catch {
                                  return value
                                }
                              }}
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                            />
                            <Tooltip
                              content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
                                      <p className="text-xs text-muted-foreground mb-1">
                                        {(() => {
                                          try {
                                            return format(parseISO(label), "dd MMMM yyyy", { locale: es })
                                          } catch {
                                            return label
                                          }
                                        })()}
                                      </p>
                                      <p className="text-sm font-semibold">
                                        {formatCurrency(Number(payload[0].payload.revenue || 0), currentCurrency)}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {payload[0].payload.orderCount} órdenes
                                      </p>
                                    </div>
                                  )
                                }
                                return null
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="revenue"
                              stroke="hsl(var(--primary))"
                              strokeWidth={2}
                              fill="url(#colorRevenue)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          No hay datos de tendencias disponibles
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Payment Methods Pie Chart */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">Métodos de Pago</CardTitle>
                    <CardDescription>Distribución por método</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[280px]">
                      {sales?.salesByPaymentMethod && sales.salesByPaymentMethod.length > 0 ? (
                        <div className="space-y-4 h-full flex flex-col">
                          {(() => {
                            // Calcular total para porcentajes
                            const total = sales.salesByPaymentMethod.reduce(
                              (sum, item) => sum + Number(item.totalRevenue || 0),
                              0
                            )
                            
                            return sales.salesByPaymentMethod
                              .sort((a, b) => Number(b.totalRevenue || 0) - Number(a.totalRevenue || 0))
                              .map((item, index) => {
                                const revenue = Number(item.totalRevenue || 0)
                                const percentage = total > 0 ? (revenue / total) * 100 : 0
                                
                                return (
                                  <div key={item.paymentProviderId || index} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                      <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <div
                                          className="w-3 h-3 rounded-full flex-shrink-0"
                                          style={{
                                            backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                                          }}
                                        />
                                        <span className="font-medium truncate">{item.providerName}</span>
                                      </div>
                                      <div className="flex items-center gap-3 ml-2">
                                        <span className="text-muted-foreground text-xs">
                                          {percentage.toFixed(1)}%
                                        </span>
                                        <span className="font-semibold min-w-[80px] text-right">
                                          {formatCurrency(revenue, currentCurrency)}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                                      <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                          width: `${percentage}%`,
                                          backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                                        }}
                                      />
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                      <span>{item.orderCount} {item.orderCount === 1 ? 'orden' : 'órdenes'}</span>
                                      <span>
                                        Promedio: {formatCurrency(item.orderCount > 0 ? revenue / item.orderCount : 0, currentCurrency)}
                                      </span>
                                    </div>
                                  </div>
                                )
                              })
                          })()}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                          No hay datos de métodos de pago
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Weekly Performance & Conversion Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Weekly Performance */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-base font-medium">Rendimiento Semanal</CardTitle>
                    </div>
                    <CardDescription>Ventas por día de la semana</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[220px]">
                      {weeklyPerformance && weeklyPerformance.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={weeklyPerformance}>
                            <XAxis
                              dataKey="dayName"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                            />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload
                                  return (
                                    <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
                                      <p className="text-sm font-medium">{data.dayName}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {formatCurrency(Number(data.revenue || 0), currentCurrency)}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {data.orderCount} órdenes
                                      </p>
                                    </div>
                                  )
                                }
                                return null
                              }}
                            />
                            <Bar
                              dataKey="revenue"
                              fill="hsl(var(--chart-2))"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                          No hay datos de rendimiento semanal
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Sales Summary */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-base font-medium">Resumen de Ventas</CardTitle>
                    </div>
                    <CardDescription>Desglose financiero</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <SummaryRow
                        label="Ingresos Brutos"
                        value={formatCurrency(Number(sales?.revenueBreakdown?.total || 0), currentCurrency)}
                        icon={DollarSign}
                      />
                      <SummaryRow
                        label="Impuestos Cobrados"
                        value={formatCurrency(Number(sales?.revenueBreakdown?.tax || 0), currentCurrency)}
                        icon={Percent}
                        variant="muted"
                      />
                      <SummaryRow
                        label="Descuentos Aplicados"
                        value={`-${formatCurrency(Number(sales?.revenueBreakdown?.discount || 0), currentCurrency)}`}
                        icon={TrendingDown}
                        variant="destructive"
                      />
                      <SummaryRow
                        label="Reembolsos"
                        value={`-${formatCurrency(sales?.refundStats?.totalRefundAmount || 0, currentCurrency)}`}
                        icon={ArrowDownRight}
                        variant="destructive"
                      />
                      <div className="border-t border-border pt-3 mt-3">
                        <SummaryRow
                          label="Valor Promedio de Orden"
                          value={formatCurrency(Number(overview?.averageOrderValue || 0), currentCurrency)}
                          icon={BarChart3}
                          variant="primary"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Products & Inventory Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Top Products */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base font-medium">Productos Más Vendidos</CardTitle>
                        <CardDescription>Top 5 por cantidad vendida</CardDescription>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Top 5
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {products?.topSellingProducts && products.topSellingProducts.length > 0 ? (
                      <div className="space-y-3">
                        {products.topSellingProducts.slice(0, 5).map((product, index) => (
                          <div
                            key={product.variantId}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-medium">
                                {index + 1}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate max-w-[180px]">
                                  {product.productTitle}
                                </p>
                                <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                                  {product.variantTitle}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">{product.quantitySold} vendidos</p>
                              <p className="text-xs text-muted-foreground">
                                {formatCurrency(Number(product.revenue || 0), currentCurrency)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                        No hay datos de productos vendidos
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Inventory Stats */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base font-medium">Estado del Inventario</CardTitle>
                        <CardDescription>Resumen de stock</CardDescription>
                      </div>
                      {inventory?.lowStockCount && inventory.lowStockCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {inventory.lowStockCount} bajo stock
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Inventory KPIs */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-muted/30">
                          <p className="text-xs text-muted-foreground">Total Variantes</p>
                          <p className="text-xl font-semibold">{inventory?.totalVariants || 0}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-chart-2/10">
                          <p className="text-xs text-muted-foreground">En Stock</p>
                          <p className="text-xl font-semibold text-chart-2">
                            {inventory?.inStockVariants || 0}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-destructive/10">
                          <p className="text-xs text-muted-foreground">Sin Stock</p>
                          <p className="text-xl font-semibold text-destructive">
                            {inventory?.outOfStockVariants || 0}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-chart-3/10">
                          <p className="text-xs text-muted-foreground">Valor Inventario</p>
                          <p className="text-lg font-semibold text-chart-3">
                            {formatCurrency(inventory?.inventoryValue?.totalValue || 0, currentCurrency)}
                          </p>
                        </div>
                      </div>

                      {/* Low Stock Products */}
                      {inventory?.lowStockVariants && inventory.lowStockVariants.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-medium mb-2 text-destructive flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Productos con Stock Bajo
                          </p>
                          <div className="space-y-2 max-h-[140px] overflow-y-auto">
                            {inventory.lowStockVariants.slice(0, 4).map((product) => (
                              <div
                                key={product.variantId}
                                className="flex items-center justify-between p-2 rounded-md bg-destructive/5 border border-destructive/20"
                              >
                                <div className="min-w-0">
                                  <p className="text-xs font-medium truncate max-w-[160px]">
                                    {product.productTitle}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {product.variantTitle}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs font-medium text-destructive">
                                    {product.currentStock} unidades
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Customer Stats Row */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-base font-medium">Estadísticas de Clientes</CardTitle>
                  </div>
                  <CardDescription>Métricas de clientes y retención</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-muted/30 text-center">
                      <p className="text-2xl font-bold">{customers?.totalCustomers || 0}</p>
                      <p className="text-xs text-muted-foreground mt-1">Clientes Únicos</p>
                    </div>
                    <div className="p-4 rounded-lg bg-chart-2/10 text-center">
                      <p className="text-2xl font-bold text-chart-2">
                        {customers?.newCustomers || 0}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Nuevos</p>
                    </div>
                    <div className="p-4 rounded-lg bg-chart-4/10 text-center">
                      <p className="text-2xl font-bold text-chart-4">
                        {customers?.returningCustomers || 0}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Recurrentes</p>
                    </div>
                    <div className="p-4 rounded-lg bg-primary/10 text-center">
                      <p className="text-2xl font-bold text-primary">
                        {(customers?.customerRetentionRate || 0).toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Tasa de Retención</p>
                    </div>
                  </div>

                  {/* Customer Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted/30">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {formatCurrency(Number(overview?.averageOrderValue || 0), currentCurrency)}
                        </p>
                        <p className="text-xs text-muted-foreground">Valor Promedio de Orden</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted/30">
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {customers?.totalCustomers && customers.totalCustomers > 0
                            ? (overview?.totalOrders || 0) / customers.totalCustomers
                            : 0}
                        </p>
                        <p className="text-xs text-muted-foreground">Órdenes por Cliente</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted/30">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {formatCurrency(Number(customers?.averageCustomerValue || 0), currentCurrency)}
                        </p>
                        <p className="text-xs text-muted-foreground">Valor Promedio del Cliente</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

// KPI Card Component
interface KPICardProps {
  title: string
  value: string
  subtitle: string
  icon: React.ElementType
  trend: number
  color: string
  index: number
}

function KPICard({ title, value, subtitle, icon: Icon, trend, color, index }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold tracking-tight">{value}</p>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
            <div className={`p-3 rounded-xl bg-${color}/10`}>
              <Icon className={`h-5 w-5 text-${color}`} style={{ color: `hsl(var(--${color}))` }} />
            </div>
          </div>
          {trend !== 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className={`flex items-center gap-1 text-xs ${trend > 0 ? "text-chart-2" : "text-destructive"}`}>
                {trend > 0 ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                <span className="font-medium">{formatPercent(Math.abs(trend))}</span>
                <span className="text-muted-foreground">vs período anterior</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Summary Row Component
interface SummaryRowProps {
  label: string
  value: string
  icon: React.ElementType
  variant?: "default" | "muted" | "destructive" | "primary"
}

function SummaryRow({ label, value, icon: Icon, variant = "default" }: SummaryRowProps) {
  const variantClasses = {
    default: "text-foreground",
    muted: "text-muted-foreground",
    destructive: "text-destructive",
    primary: "text-primary",
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className={`text-sm font-medium ${variantClasses[variant]}`}>{value}</span>
    </div>
  )
}

// Loading Skeleton Component
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Filter skeleton */}
      <div className="box-container">
        <div className="box-section">
          <Skeleton className="h-9 w-full max-w-md" />
        </div>
      </div>

      {/* KPI skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <Skeleton className="h-[280px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-[280px] w-full" />
          </CardContent>
        </Card>
      </div>

      {/* More skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-[220px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-[220px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
