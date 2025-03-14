"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useMainStore } from "@/stores/mainStore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import {
  Loader2,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import { HeaderBar } from "@/components/HeaderBar"
import { OrderFinancialStatus } from "@/types/common"
import { cn, formatCurrency } from "@/lib/utils"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import R2ImageUploader from "@/components/R2ImageUpload"
 
 
export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const {
    fetchOrders,
    fetchProducts,
    fetchCustomers,
    fetchShopSettings,
    fetchCurrencies,
    orders,
    products,
    customers,
    shopSettings,
    currencies,
  } = useMainStore()

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        await Promise.all([fetchOrders(), fetchProducts(), fetchCustomers(), fetchShopSettings(), fetchCurrencies()])
      } catch (error) {
        console.error("Error loading dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [fetchOrders, fetchProducts, fetchCustomers, fetchShopSettings, fetchCurrencies])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const defaultCurrency = shopSettings?.[0]?.defaultCurrencyId
    ? currencies.find((c) => c.id === shopSettings[0].defaultCurrencyId)
    : currencies[0] || null

  const totalSales = orders.reduce((sum, order) => sum + Number(order.totalPrice), 0)
  const averageOrderValue = orders.length > 0 ? totalSales / orders.length : 0
  const totalCustomers = customers.length
  const totalProducts = products.length

  // Calculate sales growth (last 30 days vs previous 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
  const last30DaysSales = orders
    .filter((order) => new Date(order.createdAt) >= thirtyDaysAgo)
    .reduce((sum, order) => sum + Number(order.totalPrice), 0)
  const previous30DaysSales = orders
    .filter((order) => new Date(order.createdAt) >= sixtyDaysAgo && new Date(order.createdAt) < thirtyDaysAgo)
    .reduce((sum, order) => sum + Number(order.totalPrice), 0)
  const salesGrowth =
    previous30DaysSales > 0 ? ((last30DaysSales - previous30DaysSales) / previous30DaysSales) * 100 : 100

  // Prepare data for sales chart (last 30 days)
  const salesData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dailySales = orders
      .filter((order) => new Date(order.createdAt).toDateString() === date.toDateString())
      .reduce((sum, order) => sum + Number(order.totalPrice), 0)
    return {
      date: date.toLocaleDateString(),
      sales: dailySales,
    }
  }).reverse()

  // Prepare data for order status chart
  const orderStatusData = orders.reduce(
    (acc, order) => {
      const status = order.financialStatus || OrderFinancialStatus.PENDING
      acc[status] = (acc[status] || 0) + 1
      return acc
    },
    {} as Record<OrderFinancialStatus, number>,
  )

  const orderStatusChartData = Object.entries(orderStatusData).map(([status, count]) => ({
    name: status,
    value: count,
  }))

  // Top 5 selling products
  const topProducts = products
    .map((product) => ({
      name: product.title,
      sales: orders.reduce(
        (sum, order) =>
          sum +
          order.lineItems
            .filter((item) => item.variantId && product.variants.some((v) => v.id === item.variantId))
            .reduce((itemSum, item) => itemSum + Number(item.price) * item.quantity, 0),
        0,
      ),
    }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5)

  // Product inventory status
  const productInventoryStatus = {
    inStock: products.filter((p) => p.variants.some((v) => v.inventoryQuantity > 0)).length,
    lowStock: products.filter((p) => p.variants.some((v) => v.inventoryQuantity > 0 && v.inventoryQuantity <= 5))
      .length,
    outOfStock: products.filter((p) => p.variants.every((v) => v.inventoryQuantity === 0)).length,
  }

  const inventoryStatusChartData = [
    { name: "En Stock", value: productInventoryStatus.inStock },
    { name: "Stock Bajo", value: productInventoryStatus.lowStock },
    { name: "Sin Stock", value: productInventoryStatus.outOfStock },
  ]

  // Customer acquisition data (mock data - replace with real data when available)
  const customerAcquisitionData = [
    { name: "Directo", value: 30 },
    { name: "Búsqueda Orgánica", value: 40 },
    { name: "Anuncios Pagados", value: 20 },
    { name: "Referidos", value: 10 },
  ]

  const COLORS = ["#E3F2FD", "#90CAF9", "#64B5F6", "#42A5F5", "#2196F3"]

  return (
    <>
      <HeaderBar title="Panel de Control" />
      <ScrollArea className="h-[calc(100vh-4rem)] px-4">
        {/* <R2ImageUploader /> */}
        <div className="max-w-[1400px] mx-auto py-6 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
          >
            <StatCard
              title="Ventas Totales (30d)"
              value={formatCurrency(last30DaysSales, defaultCurrency?.code)}
              icon={<DollarSign className="h-5 w-5" />}
              trend={salesGrowth}
            />
            <StatCard title="Pedidos" value={orders.length.toString()} icon={<ShoppingCart className="h-5 w-5" />} />
            <StatCard
              title="Valor Promedio de Pedido"
              value={formatCurrency(averageOrderValue, defaultCurrency?.code)}
              icon={<TrendingUp className="h-5 w-5" />}
            />
            <StatCard title="Clientes" value={totalCustomers.toString()} icon={<Users className="h-5 w-5" />} />
            <StatCard title="Productos" value={totalProducts.toString()} icon={<Package className="h-5 w-5" />} />
            <StatCard
              title="Tasa de Conversión"
              value={`${((orders.length / customers.length) * 100).toFixed(2)}%`}
              icon={<TrendingUp className="h-5 w-5" />}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-700">Tendencia de Ventas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesData}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2196F3" stopOpacity={0.6} />
                          <stop offset="95%" stopColor="#2196F3" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" />
                      <YAxis />
                      <CartesianGrid strokeDasharray="3 3" />
                      <Tooltip formatter={(value) => formatCurrency(Number(value), defaultCurrency?.code)} />
                      <Area type="monotone" dataKey="sales" stroke="#2196F3" fillOpacity={1} fill="url(#colorSales)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-700">Estado de Pedidos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={orderStatusChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          label
                        >
                          {orderStatusChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-700">Estado de Inventario</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={inventoryStatusChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          label
                        >
                          {inventoryStatusChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-700">Productos Más Vendidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topProducts}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value), defaultCurrency?.code)} />
                      <Bar dataKey="sales" fill="#42A5F5" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-700">Adquisición de Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={customerAcquisitionData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        label
                      >
                        {customerAcquisitionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-700">Pedidos Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nº de Pedido</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.slice(0, 5).map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.orderNumber}</TableCell>
                        <TableCell>
                          {order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : "N/A"}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(Number(order.totalPrice), order.currency?.code || defaultCurrency?.code)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getStatusVariant(order.financialStatus || OrderFinancialStatus.PENDING)}
                            className={cn(
                              order.financialStatus === OrderFinancialStatus.PAID && "bg-blue-100 text-blue-800",
                              order.financialStatus === OrderFinancialStatus.PENDING && "bg-yellow-100 text-yellow-800",
                              order.financialStatus === OrderFinancialStatus.REFUNDED && "bg-red-100 text-red-800",
                            )}
                          >
                            {translateStatus(order.financialStatus || OrderFinancialStatus.PENDING)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </ScrollArea>
    </>
  )
}

function StatCard({
  title,
  value,
  icon,
  trend,
}: { title: string; value: string; icon: React.ReactNode; trend?: number }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <CardTitle className="text-sm font-medium text-gray-700">{title}</CardTitle>
        <div className="text-blue-400">{icon}</div>
      </div>
      <div className="mt-2">
        <div className="text-2xl font-bold">{value}</div>
        {trend !== undefined && (
          <p className={`text-xs ${trend >= 0 ? "text-green-500" : "text-red-500"} flex items-center mt-1`}>
            {trend >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
            {Math.abs(trend).toFixed(2)}%
          </p>
        )}
      </div>
    </Card>
  )
}

function getStatusVariant(status: OrderFinancialStatus): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case OrderFinancialStatus.PAID:
      return "default"
    case OrderFinancialStatus.PENDING:
      return "secondary"
    case OrderFinancialStatus.REFUNDED:
      return "destructive"
    default:
      return "outline"
  }
}

function translateStatus(status: OrderFinancialStatus): string {
  switch (status) {
    case OrderFinancialStatus.PAID:
      return "Pagado"
    case OrderFinancialStatus.PENDING:
      return "Pendiente"
    case OrderFinancialStatus.REFUNDED:
      return "Reembolsado"
    default:
      return status
  }
}

