"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  CreditCard,
  Edit,
  FileText,
  Package,
  ShoppingCart,
  Trash2,
  Truck,
  User,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { OrderFormState } from "./orderFormTypes"
import type { Currency } from "@/types/currency"
import type { ShopSettings } from "@/types/store"
import type { PaymentProvider } from "@/types/payments"

/** Minimal store shape for display (compatible with auth store and full Store type). */
export interface ViewOrderStore {
  id: string
  name: string
}
import { CustomerInfo } from "./CustomerInfo"
import { OrderDetails } from "./OrderDetails"
import { ShippingAndBilling } from "./ShippingAndBilling"
import { PaymentAndDiscounts } from "./PaymentAndDiscounts"
import { OrderStatus } from "./OrderStatus"
import { AdditionalInfo } from "./AdditionalInfo"

type StepId = "products" | "customer" | "shipping" | "payment"

interface StepItem {
  id: StepId
  label: string
  description: string
  icon: LucideIcon
}

const noopSetFormData = (_: React.SetStateAction<OrderFormState>) => {}
const noopSetBoolean = (_: boolean) => {}

export interface ViewOrderContentProps {
  formData: OrderFormState
  orderId: string
  currencies: Currency[]
  store: ViewOrderStore | null
  shopSettings: ShopSettings | null
  paymentProviders: PaymentProvider[]
  onGenerateInvoice: () => void
  onDeleteClick: () => void
  /** If false, Edit and Delete buttons are disabled. Default true. */
  canEdit?: boolean
  canDelete?: boolean
}

const STEP_BUTTON_BASE =
  "flex min-w-[180px] flex-1 items-center gap-3 border-transparent px-5 py-3 text-left transition-all"
const STEP_ICON_BASE = "flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium"
const SECTION_CARD_BASE = "rounded-lg border border-border/30 bg-card/80 p-5 shadow-sm transition"

export function ViewOrderContent({
  formData,
  orderId,
  currencies,
  store,
  shopSettings,
  paymentProviders,
  onGenerateInvoice,
  onDeleteClick,
  canEdit = true,
  canDelete = true,
}: ViewOrderContentProps) {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<StepId>("products")

  const currencySymbol = formData.currencyId
    ? currencies.find((c) => c.id === formData.currencyId)?.symbol ?? ""
    : ""
  const totalDiscountSummary = Math.round((Number(formData.totalDiscounts) || 0) * 100) / 100
  const shopSettingsList = shopSettings ? [shopSettings] : []

  const stepItems: StepItem[] = [
    {
      id: "products",
      label: "1. Productos",
      description: `${formData.lineItems.length} productos`,
      icon: ShoppingCart,
    },
    {
      id: "customer",
      label: "2. Cliente",
      description: formData.customerInfo?.name || "Sin cliente",
      icon: User,
    },
    {
      id: "shipping",
      label: "3. Envío",
      description: formData.shippingAddress?.address1 ? "Dirección completa" : "Sin dirección",
      icon: Truck,
    },
    {
      id: "payment",
      label: "4. Pago",
      description: formData.paymentProviderId ? "Método seleccionado" : "Sin método de pago",
      icon: CreditCard,
    },
  ]

  const getStepButtonClass = (isActive: boolean): string =>
    isActive
      ? `${STEP_BUTTON_BASE} border border-primary/20 bg-primary/5 text-primary`
      : `${STEP_BUTTON_BASE} bg-card text-muted-foreground hover:bg-card/80 hover:text-foreground`

  const getStepIconClass = (isActive: boolean): string =>
    isActive
      ? `${STEP_ICON_BASE} bg-primary/10 text-primary`
      : `${STEP_ICON_BASE} bg-muted/60 text-muted-foreground`

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/orders")}
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              aria-label="Volver"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight">Ver Pedido</h1>
              <Badge variant="outline">ID: {orderId.substring(0, 8)}</Badge>
              {store && (
                <Badge variant="secondary" className="ml-1">
                  Tienda: {store.name}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {canDelete ? (
              <Button
                variant="outline"
                onClick={onDeleteClick}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
            ) : (
              <Button variant="outline" disabled className="opacity-60 cursor-not-allowed text-red-500">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
            )}
            <Button variant="outline" onClick={onGenerateInvoice}>
              <FileText className="mr-2 h-4 w-4" />
              Crear Factura Electrónica
            </Button>
            {canEdit ? (
              <Button variant="default" onClick={() => router.push(`/orders/${orderId}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            ) : (
              <Button variant="default" disabled className="opacity-60 cursor-not-allowed">
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        {/* Pestañas (igual que Edit) */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex min-w-max items-stretch overflow-hidden rounded-lg border border-border/40 bg-background/70 shadow-sm">
            {stepItems.map(({ id, label, description, icon: Icon }) => {
              const isActive = activeSection === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveSection(id)}
                  className={getStepButtonClass(isActive)}
                >
                  <div className={getStepIconClass(isActive)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">{label}</div>
                    <div className="text-xs text-muted-foreground">{description}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            {activeSection === "products" && (
              <section className={SECTION_CARD_BASE}>
                <OrderDetails
                  formData={formData}
                  setFormData={noopSetFormData}
                  products={[]}
                  currencies={currencies}
                  coupons={[]}
                  shippingMethods={[]}
                  shopSettings={shopSettingsList}
                  setIsProductDialogOpen={noopSetBoolean}
                  setIsPOSDialogOpen={noopSetBoolean}
                  readOnly
                />
              </section>
            )}

            {activeSection === "customer" && (
              <section className={SECTION_CARD_BASE}>
                <CustomerInfo formData={formData} setFormData={noopSetFormData} readOnly />
              </section>
            )}

            {activeSection === "shipping" && (
              <section className={SECTION_CARD_BASE}>
                <ShippingAndBilling formData={formData} setFormData={noopSetFormData} readOnly />
              </section>
            )}

            {activeSection === "payment" && (
              <div className="space-y-6">
                <section className={SECTION_CARD_BASE}>
                  <PaymentAndDiscounts
                    formData={formData}
                    setFormData={noopSetFormData}
                    paymentProviders={paymentProviders}
                    readOnly
                  />
                </section>
                <section className={SECTION_CARD_BASE}>
                  <OrderStatus formData={formData} setFormData={noopSetFormData} readOnly />
                </section>
                {((formData.customerNotes || "").trim() ||
                  (formData.internalNotes || "").trim() ||
                  (formData.source || "").trim()) && (
                  <section className={SECTION_CARD_BASE}>
                    <AdditionalInfo formData={formData} setFormData={noopSetFormData} readOnly />
                  </section>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <aside className="rounded-lg border border-border/30 bg-card/80 p-5 shadow-sm">
              <h2 className="mb-4 flex items-center text-base font-semibold tracking-tight text-muted-foreground">
                <Package className="mr-2 h-4 w-4 text-primary" />
                Resumen del Pedido
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-md bg-muted/20 px-3 py-2">
                  <span className="text-sm text-muted-foreground">Número de Orden</span>
                  <span className="text-sm font-medium">{formData.orderNumber}</span>
                </div>

                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm text-muted-foreground">Productos</span>
                  <span className="text-sm font-medium">{formData.lineItems.length}</span>
                </div>

                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm text-muted-foreground">Subtotal</span>
                  <span className="text-sm font-medium">
                    {currencySymbol}
                    {Number(formData.subtotalPrice || 0).toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm text-muted-foreground">Total descuentos</span>
                  <span className="text-sm font-medium text-destructive">
                    -{currencySymbol}
                    {totalDiscountSummary.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm text-muted-foreground">Impuestos</span>
                  <span className="text-sm font-medium">
                    {currencySymbol}
                    {Number(formData.totalTax || 0).toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-md bg-primary/5 px-3 py-3 text-sm">
                  <span className="font-semibold text-primary">Total</span>
                  <span className="font-semibold text-primary">
                    {currencySymbol}
                    {Number(formData.totalPrice || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mt-6 border-t border-border/30 pt-4">
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">Información del Cliente</h3>
                {formData.customerInfo?.name ? (
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{formData.customerInfo.name}</p>
                    <p>{formData.customerInfo.email}</p>
                    {formData.customerInfo.phone && <p>{formData.customerInfo.phone}</p>}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No hay información del cliente</p>
                )}
              </div>

              <div className="mt-5 border-t border-border/30 pt-4">
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">Dirección de Envío</h3>
                {formData.shippingAddress?.address1 ? (
                  <div className="space-y-1 text-sm">
                    <p>{formData.shippingAddress.name}</p>
                    <p>{formData.shippingAddress.address1}</p>
                    {formData.shippingAddress.address2 && <p>{formData.shippingAddress.address2}</p>}
                    <p>
                      {formData.shippingAddress.city}
                      {formData.shippingAddress.state && `, ${formData.shippingAddress.state}`}
                      {formData.shippingAddress.postalCode && ` ${formData.shippingAddress.postalCode}`}
                    </p>
                    <p>{formData.shippingAddress.country}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No hay dirección de envío</p>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  )
}
