/**
 * Statistics API response types (shared by React Query hooks and legacy statistics store).
 */

export interface CurrencyInfo {
  id: string
  code: string
  name: string
  symbol: string
}

export interface OverviewStats {
  currency?: CurrencyInfo
  totalOrders: number
  totalRevenue: string | number
  averageOrderValue: string | number
  totalProducts: number
  activeProducts: number
  lowStockProducts: number
  totalCustomers: number
  completedOrders: number
  fulfillmentRate: number
  comparison?: {
    totalOrders: { current: number; previous: number; growth: number }
    totalRevenue: { current: number; previous: number; growth: number }
    totalCustomers: { current: number; previous: number; growth: number }
    averageOrderValue: { current: number; previous: number; growth: number }
  }
  comparisonType?: string
}

export interface SalesStats {
  currency?: CurrencyInfo
  ordersByStatus: Array<{
    status: string
    count: number
    totalAmount: string | number
  }>
  revenueBreakdown: {
    subtotal: string | number
    tax: string | number
    discount: string | number
    total: string | number
  }
  salesByPaymentMethod: Array<{
    paymentProviderId: string
    providerName: string
    orderCount: number
    totalRevenue: string | number
  }>
  salesByCategory: Array<{
    categoryId: string
    categoryName: string
    revenue: number
    unitsSold: number
  }>
  refundStats: {
    totalRefunds: number
    totalRefundAmount: number
    refundRate: number
  }
}

export interface ProductStats {
  currency?: CurrencyInfo
  productsByStatus: Array<{ status: string; count: number }>
  topSellingProducts: Array<{
    variantId: string
    productId: string
    productTitle: string
    productSlug: string
    variantTitle: string
    sku: string
    imageUrl: string
    quantitySold: number
    revenue: string | number
  }>
  lowStockProducts: Array<{
    variantId: string
    productId: string
    productTitle: string
    variantTitle: string
    sku: string
    currentStock: number
    status: string
  }>
  inventoryValue: {
    totalValue: number
    totalUnits: number
    averageUnitValue: number
  }
  productsByCategory: Array<{
    categoryId: string
    categoryName: string
    productCount: number
  }>
}

export interface CustomerStats {
  currency?: CurrencyInfo
  totalCustomers: number
  newCustomers: number
  returningCustomers: number
  averageCustomerValue: number
  customerRetentionRate: number
  topCustomers: Array<{
    email: string
    orderCount: number
    totalSpent: number
    lastOrder: string
  }>
}

export interface InventoryStats {
  currency?: CurrencyInfo
  totalVariants: number
  inStockVariants: number
  outOfStockVariants: number
  lowStockCount: number
  inventoryValue: {
    totalValue: number
    totalUnits: number
    averageUnitValue: number
  }
  lowStockVariants: Array<{
    variantId: string
    productId: string
    productTitle: string
    variantTitle: string
    sku: string
    currentStock: number
    status: string
  }>
  topInventoryProducts?: Array<{
    variantId: string
    productId: string
    productTitle: string
    variantTitle: string
    sku: string
    quantity: number
    unitPrice: number
    totalValue: number
  }>
}

export interface TrendDataPoint {
  period: string
  revenue: number
  orderCount: number
  paidCount: number
  averageOrderValue: number
}

export interface TrendsStats {
  currency?: CurrencyInfo
  period: string
  startDate: string
  endDate: string
  data: TrendDataPoint[]
}

export interface ComparePeriodData {
  orders: number
  revenue: number
  averageOrderValue: number
  customers: number
}

export interface CompareStats {
  currency?: CurrencyInfo
  period1: ComparePeriodData
  period2: ComparePeriodData
  growth: {
    orders: number
    revenue: number
    averageOrderValue: number
    customers: number
  }
}

export interface ConversionStats {
  currency?: CurrencyInfo
  paymentConversion: { total: number; paid: number; rate: number }
  fulfillmentConversion: { total: number; fulfilled: number; rate: number }
  cancellationRate: { total: number; cancelled: number; rate: number }
  refundRate: { total: number; refunded: number; rate: number }
  productPerformance: {
    totalProducts: number
    productsWithSales: number
    conversionRate: number
  }
}

export interface ProfitableProduct {
  productId: string
  productTitle: string
  totalRevenue: number
  totalUnitsSold: number
  averagePrice: number
  cost: number
  profit: number
  margin: number
}

export interface HourlySalesData {
  hour: number
  hourLabel?: string
  orderCount: number
  revenue: number
  averageOrderValue: number
}

export interface WeeklyPerformanceData {
  day: number
  dayName: string
  orderCount: number
  revenue: number
  averageOrderValue: number
}

export interface ArrayResponseWithCurrency<T> {
  currency: CurrencyInfo
  data: T[]
}

export interface ProfitableProductsResponse {
  currency: CurrencyInfo
  products: ProfitableProduct[]
}

export type WeeklyPerformanceResponse = ArrayResponseWithCurrency<WeeklyPerformanceData>
export type HourlySalesResponse = ArrayResponseWithCurrency<HourlySalesData>
