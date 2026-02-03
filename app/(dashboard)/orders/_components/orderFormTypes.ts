import type { CreateOrderDto, CreateOrderItemDto, UpdateOrderDto, UpdateOrderItemDto } from "@/types/order"

export type OrderFormLineItem = CreateOrderItemDto & Partial<UpdateOrderItemDto>

export type OrderFormState = (CreateOrderDto & Partial<UpdateOrderDto>) & {
  manualDiscountTotal: number
  couponDiscountTotal: number
  lineItems: OrderFormLineItem[]
  useCustomCreatedAt?: boolean
}

