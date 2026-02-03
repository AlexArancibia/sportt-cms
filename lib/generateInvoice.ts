import { formatCurrency } from "@/lib/utils"
import pdfMake from "pdfmake/build/pdfmake"

export interface LineItem {
  title: string
  price: number
  quantity: number
  totalDiscount?: number
}

export interface CustomerInfo {
  name?: string
  email?: string
  phone?: string
  company?: string
  taxId?: string
}

export interface AddressInfo {
  name?: string
  address1?: string
  address2?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  phone?: string
}

export interface Order {
  orderNumber: string
  createdAt: string
  subtotalPrice: number
  totalDiscounts: number
  totalTax: number
  totalPrice: number
  lineItems: LineItem[]
  customerInfo?: CustomerInfo
  shippingAddress?: AddressInfo
  billingAddress?: AddressInfo
}

export interface Currency {
  code: string
  name?: string
  symbol?: string
}

/** Store/shop data to personalize the invoice (e.g. ANJsports, anjsports.com). */
export interface InvoiceStoreInfo {
  name: string
  domain?: string
  email?: string | null
  phone?: string | null
  address1?: string | null
  address2?: string | null
  city?: string | null
  province?: string | null
  country?: string | null
  zip?: string | null
  /** Hex color for header/footer accent (e.g. #2563eb). */
  primaryColor?: string | null
}

const loadRobotoMedium = async () => {
  const res = await fetch("/fonts/Roboto-Medium.base64.txt")
  const base64 = await res.text()
  pdfMake.vfs = pdfMake.vfs || {}
  pdfMake.vfs["Roboto-Medium.ttf"] = base64
  pdfMake.fonts = {
    Roboto: {
      normal: "Roboto-Medium.ttf",
      bold: "Roboto-Medium.ttf",
      italics: "Roboto-Medium.ttf",
      bolditalics: "Roboto-Medium.ttf",
    },
  }
}

const DEFAULT_PRIMARY = "#2563eb"

/** Normalize store primary color to hex for pdfmake. */
function primaryHex(hex: string | null | undefined): string {
  if (!hex || typeof hex !== "string") return DEFAULT_PRIMARY
  const clean = hex.replace("#", "").trim()
  if (clean.length === 6 && /^[0-9A-Fa-f]+$/.test(clean)) return `#${clean}`
  return DEFAULT_PRIMARY
}

function formatAddress(addr: AddressInfo | undefined): string[] {
  if (!addr || typeof addr !== "object") return []
  const parts: string[] = []
  if (addr.name) parts.push(addr.name)
  if (addr.address1) parts.push(addr.address1)
  if (addr.address2) parts.push(addr.address2)
  const cityLine = [addr.city, addr.state].filter(Boolean).join(", ")
  if (cityLine) parts.push(cityLine)
  const postalCountry = [addr.postalCode, addr.country].filter(Boolean).join(" ")
  if (postalCountry) parts.push(postalCountry)
  if (addr.phone) parts.push(`Tel: ${addr.phone}`)
  return parts
}

export const generateInvoicePDF = async (
  order: Order,
  currency?: Currency,
  storeInfo?: InvoiceStoreInfo | null
) => {
  if (!order) return

  await loadRobotoMedium()

  const code = currency?.code || "USD"
  const primaryColor = primaryHex(storeInfo?.primaryColor)

  const storeName = storeInfo?.name || "Tienda"
  const domain = storeInfo?.domain ? (storeInfo.domain.startsWith("http") ? storeInfo.domain : `https://${storeInfo.domain}`) : ""
  const storeAddressLines = [
    ...[storeInfo?.address1, storeInfo?.address2].filter(Boolean),
    [storeInfo?.city, storeInfo?.province].filter(Boolean).join(", "),
    [storeInfo?.zip, storeInfo?.country].filter(Boolean).join(" "),
  ].filter(Boolean) as string[]
  if (storeInfo?.phone) storeAddressLines.push(`Tel: ${storeInfo.phone}`)
  if (storeInfo?.email) storeAddressLines.push(storeInfo.email)

  const customerLines: string[] = []
  if (order.customerInfo?.name) customerLines.push(order.customerInfo.name)
  if (order.customerInfo?.company) customerLines.push(order.customerInfo.company)
  if (order.customerInfo?.email) customerLines.push(order.customerInfo.email)
  if (order.customerInfo?.phone) customerLines.push(order.customerInfo.phone)
  if (order.customerInfo?.taxId) customerLines.push(`RUC/DNI: ${order.customerInfo.taxId}`)
  // Solo mostrar dirección de envío si es una dirección real del cliente (tiene calle/ciudad/país), no datos del emisor
  const hasRealShippingAddress =
    order.shippingAddress &&
    (order.shippingAddress.address1 || order.shippingAddress.city || order.shippingAddress.country)
  const shippingLines = hasRealShippingAddress ? formatAddress(order.shippingAddress) : []
  if (shippingLines.length > 0) {
    customerLines.push("", "Dirección de envío:", ...shippingLines)
  } else if (order.shippingAddress && typeof order.shippingAddress === "object" && Object.keys(order.shippingAddress).length > 0) {
    customerLines.push("", "Dirección de envío: No especificada")
  }

  const emissionDate = new Date(order.createdAt)
  const dateStr = emissionDate.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const tableHeaderStyle = {
    fillColor: primaryColor as string,
    color: "white",
    bold: true,
    fontSize: 9,
  }

  const tableBodyRows: (string | number)[][] = order.lineItems.map((item) => {
    const lineTotal = item.price * item.quantity - (item.totalDiscount ?? 0)
    return [
      item.title,
      formatCurrency(item.price, code),
      item.quantity,
      item.totalDiscount && item.totalDiscount > 0
        ? `-${formatCurrency(item.totalDiscount, code)}`
        : "—",
      formatCurrency(lineTotal, code),
    ]
  })

  const content: any[] = [
    // ----- Header con nombre de tienda y dominio -----
    {
      columns: [
        {
          text: storeName,
          style: "storeName",
          width: "*",
        },
        domain
          ? {
              text: domain,
              style: "domain",
              alignment: "right",
              width: "auto",
            }
          : { text: "" },
      ],
      margin: [0, 0, 0, 8],
    },
    {
      canvas: [
        {
          type: "line",
          x1: 0,
          y1: 0,
          x2: 515,
          y2: 0,
          lineWidth: 2,
          lineColor: primaryColor as string,
        },
      ],
      margin: [0, 0, 0, 12],
    },

    // ----- Tipo de documento y número -----
    {
      columns: [
        { text: "BOLETA / FACTURA ELECTRÓNICA", style: "docTitle" },
        {
          stack: [
            { text: `Pedido #${order.orderNumber}`, style: "orderNumber" },
            { text: `Fecha: ${dateStr}`, style: "orderDate" },
          ],
          alignment: "right",
        },
      ],
      margin: [0, 0, 0, 16],
    },

    // ----- Emisor y Cliente en dos columnas -----
    {
      columns: [
        {
          width: "*",
          stack: [
            { text: "EMISOR", style: "sectionLabel" },
            { text: storeName, bold: true, margin: [0, 2, 0, 4] },
            ...storeAddressLines.map((line) => ({ text: line, fontSize: 9, margin: [0, 0, 0, 1] })),
          ],
        },
        {
          width: "*",
          stack: [
            { text: "CLIENTE", style: "sectionLabel" },
            ...(customerLines.length > 0
              ? customerLines.map((line) =>
                  line === ""
                    ? { text: " ", fontSize: 9, margin: [0, 2, 0, 0] }
                    : line === "Dirección de envío:"
                      ? { text: line, fontSize: 8, bold: true, margin: [0, 4, 0, 2] }
                      : { text: line, fontSize: 9, margin: [0, 0, 0, 1] }
                )
              : [{ text: "—", fontSize: 9 }]),
          ],
        },
      ],
      margin: [0, 0, 0, 16],
    },

    // ----- Tabla de productos -----
    { text: "DETALLE DE PRODUCTOS", style: "sectionLabel", margin: [0, 0, 0, 8] },
    {
      table: {
        widths: ["*", 55, 40, 55, 60],
        body: [
          [
            { text: "Descripción", ...tableHeaderStyle },
            { text: "P. unit.", ...tableHeaderStyle },
            { text: "Cant.", ...tableHeaderStyle },
            { text: "Desc.", ...tableHeaderStyle },
            { text: "Total", ...tableHeaderStyle },
          ],
          ...tableBodyRows,
        ],
      },
      layout: { hLineWidth: () => 0.3, vLineWidth: () => 0.3 },
      margin: [0, 0, 0, 16],
    },

    // ----- Totales -----
    {
      columns: [
        { text: "" },
        {
          width: 180,
          stack: [
            {
              columns: [
                { text: "Subtotal", width: "*" },
                { text: formatCurrency(order.subtotalPrice, code), alignment: "right", width: 70 },
              ],
              margin: [0, 0, 0, 4],
            },
            ...(order.totalDiscounts > 0
              ? [
                  {
                    columns: [
                      { text: "Descuentos", width: "*" },
                      {
                        text: `-${formatCurrency(order.totalDiscounts, code)}`,
                        alignment: "right",
                        width: 70,
                      },
                    ],
                    margin: [0, 0, 0, 4],
                  },
                ]
              : []),
            {
              columns: [
                { text: "Impuestos", width: "*" },
                { text: formatCurrency(order.totalTax, code), alignment: "right", width: 70 },
              ],
              margin: [0, 0, 0, 4],
            },
            {
              canvas: [
                {
                  type: "line",
                  x1: 0,
                  y1: 0,
                  x2: 180,
                  y2: 0,
                  lineWidth: 0.5,
                  lineColor: "#666",
                },
              ],
              margin: [0, 4, 0, 4],
            },
            {
              columns: [
                { text: "TOTAL", bold: true, fontSize: 11, width: "*" },
                {
                  text: formatCurrency(order.totalPrice, code),
                  bold: true,
                  fontSize: 11,
                  alignment: "right",
                  width: 70,
                },
              ],
            },
          ],
        },
      ],
      margin: [0, 0, 0, 24],
    },

    // ----- Pie -----
    {
      canvas: [
        {
          type: "line",
          x1: 0,
          y1: 0,
          x2: 515,
          y2: 0,
          lineWidth: 1,
          lineColor: primaryColor as string,
        },
      ],
      margin: [0, 0, 0, 10],
    },
    {
      text: "Gracias por su compra",
      alignment: "center",
      fontSize: 11,
      bold: true,
      margin: [0, 0, 0, 4],
    },
    ...(domain
      ? [
          {
            text: storeInfo?.domain || domain.replace(/^https?:\/\//, ""),
            alignment: "center",
            fontSize: 9,
            color: "#666",
            margin: [0, 0, 0, 0],
          },
        ]
      : []),
  ]

  const docDefinition: any = {
    defaultStyle: { font: "Roboto", fontSize: 10 },
    pageSize: "A4",
    pageMargins: [40, 40, 40, 50],
    content,
    styles: {
      storeName: { fontSize: 16, bold: true },
      domain: { fontSize: 9, color: "#666" },
      docTitle: { fontSize: 12, bold: true },
      orderNumber: { fontSize: 11, bold: true },
      orderDate: { fontSize: 9, color: "#444" },
      sectionLabel: { fontSize: 9, bold: true, color: "#333" },
    },
  }

  pdfMake.createPdf(docDefinition).download(`Factura-${order.orderNumber}-${storeName.replace(/\s+/g, "")}.pdf`)
}
