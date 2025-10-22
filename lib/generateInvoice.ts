import { formatCurrency } from "@/lib/utils";
import pdfMake from "pdfmake/build/pdfmake";

export interface LineItem {
  title: string;
  price: number;
  quantity: number;
}

export interface CustomerInfo {
  name?: string;
  email?: string;
  phone?: string;
}

export interface Order {
  orderNumber: string;
  createdAt: string;
  subtotalPrice: number;
  totalDiscounts: number;
  totalTax: number;
  totalPrice: number;
  lineItems: LineItem[];
  customerInfo?: CustomerInfo;
}

export interface Currency {
  code: string;
  name: string;
}

// Carga la fuente Medium desde public/fonts
const loadRobotoMedium = async () => {
  const res = await fetch("/fonts/Roboto-Medium.base64.txt");
  const base64 = await res.text();

  // Inicializa vfs si no existe
  pdfMake.vfs = pdfMake.vfs || {};
  pdfMake.vfs["Roboto-Medium.ttf"] = base64;

  pdfMake.fonts = {
    Roboto: {
      normal: "Roboto-Medium.ttf",
      bold: "Roboto-Medium.ttf",       // usamos Medium para bold
      italics: "Roboto-Medium.ttf",    // usamos Medium para italics
      bolditalics: "Roboto-Medium.ttf" // usamos Medium para bolditalics
    }
  };
};

export const generateInvoicePDF = async (order: Order, currency?: Currency) => {
  if (!order) return;

  // Carga la fuente antes de crear el PDF
  await loadRobotoMedium();

  const docDefinition: any = {
    defaultStyle: { font: "Roboto" },
    content: [
      { text: "Factura Electrónica", style: "header" },
      { text: `Número de Pedido: ${order.orderNumber}`, margin: [0, 10, 0, 5] },
      { text: `Fecha: ${new Date(order.createdAt).toLocaleDateString()}`, margin: [0, 0, 0, 15] },

      { text: "Cliente:", style: "subheader" },
      {
        ul: [
          `Nombre: ${order.customerInfo?.name || "N/A"}`,
          `Email: ${order.customerInfo?.email || "N/A"}`,
          `Teléfono: ${order.customerInfo?.phone || "N/A"}`
        ],
        margin: [0, 0, 0, 15]
      },

      { text: "Productos", style: "subheader" },
      {
        table: {
          widths: ["*", "auto", "auto", "auto"],
          body: [
            ["Producto", "Precio", "Cantidad", "Total"],
            ...order.lineItems.map(item => [
              item.title,
              formatCurrency(item.price, currency?.code || "USD"),
              item.quantity,
              formatCurrency(item.price * item.quantity, currency?.code || "USD")
            ])
          ]
        },
        layout: "lightHorizontalLines",
        margin: [0, 0, 0, 15]
      },

      {
        table: {
          widths: ["*", "auto"],
          body: [
            ["Subtotal", formatCurrency(order.subtotalPrice, currency?.code || "USD")],
            ...(order.totalDiscounts > 0
              ? [["Descuentos", `-${formatCurrency(order.totalDiscounts, currency?.code || "USD")}`]]
              : []),
            ["Impuestos", formatCurrency(order.totalTax, currency?.code || "USD")],
            ["Total", formatCurrency(order.totalPrice, currency?.code || "USD")]
          ]
        },
        layout: "noBorders",
        margin: [0, 0, 0, 15]
      },

      { text: "¡Gracias por su compra!", style: "thanks" }
    ],
    styles: {
      header: { fontSize: 18, bold: true },
      subheader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] },
      thanks: { fontSize: 12, italics: true, alignment: "center", margin: [0, 20, 0, 0] }
    }
  };

  pdfMake.createPdf(docDefinition).download(`Factura-${order.orderNumber}.pdf`);
};
