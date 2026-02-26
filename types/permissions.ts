// Canonical RBAC resources and actions for the CMS dashboard.
// This file is intentionally frontend-only for now, but the same shape
// can be mirrored in the backend to ensure consistency.

// High‑level "areas" of the dashboard that appear in the sidebar.
export const RBAC_RESOURCES = [
  "dashboard",       // Inicio / estadísticas generales
  "products",        // Productos
  "categories",      // Categorías
  "collections",     // Colecciones
  "orders",          // Pedidos (incluye POS a nivel permisos)
  "cards",           // Tarjetas (card sections)
  "teamContent",     // Sección de equipo (contenido, no usuarios CMS)
  "coupons",         // Cupones
  "contents",        // Contenido (posts/páginas)
  "heroSections",    // Hero sections
  "fbt",             // Combos / Frequently Bought Together
  "kardex",          // Sistema de kardex (solo lectura)
  "pageBuilder",     // Page Builder
  "accounts",        // Cuentas y permisos (usuarios, roles por tienda)
  "storeSettings",   // Settings > Tienda
  "shopSettings",    // Settings > Configuración
  "currencySettings",// Settings > Monedas
  "shippingSettings",// Settings > Envíos
  "paymentSettings", // Settings > Pagos
] as const

export type RbacResource = (typeof RBAC_RESOURCES)[number]

// Acciones genéricas que podemos reutilizar por recurso.
export const RBAC_ACTIONS = [
  "view",        // Vistas agregadas / dashboards (ej. dashboard)
  "list",        // Listar items (tablas con filtros)
  "read",        // Ver detalle de un item concreto
  "create",      // Crear nuevo item
  "update",      // Editar item existente
  "delete",      // Eliminar / archivar definitivamente
  "recalculate", // Acciones de mantenimiento/rebuild (ej. kardex)
  "archive",     // Archivar y desarchivar (status)
] as const

export type RbacAction = (typeof RBAC_ACTIONS)[number]

// Etiquetas para acciones en selectores.
export const RBAC_ACTION_LABELS: Record<RbacAction, string> = {
  view: "Ver vista",
  list: "Listar",
  read: "Ver detalle",
  create: "Crear",
  update: "Editar",
  delete: "Eliminar",
  recalculate: "Recalcular",
  archive: "Archivar / Desarchivar",
}

// Acciones permitidas por recurso según la funcionalidad actual del CMS.
// Esto es la "matriz" de permisos base sobre la que el owner podrá
// construir roles personalizados por tienda.
export const RBAC_RESOURCE_ACTIONS: Record<RbacResource, readonly RbacAction[]> = {
  dashboard: ["view"],

  products: ["list", "read", "create", "update", "delete", "archive"],

  categories: ["list", "read", "create", "update", "delete"],

  collections: ["list", "read", "create", "update", "delete"],

  orders: ["list", "read", "create", "update", "delete"],

  cards: ["list", "read", "create", "update", "delete"],

  // Contenido de la sección "Equipo" que se muestra en el frontend.
  teamContent: ["list", "read", "create", "update", "delete"],

  coupons: ["list", "read", "create", "update", "delete"],

  contents: ["list", "read", "create", "update", "delete"],

  heroSections: ["list", "read", "create", "update", "delete"],

  fbt: ["list", "read", "create", "update", "delete"],

  // El módulo actual de kardex solo hace lecturas agregadas.
  kardex: ["list", "recalculate"],

  pageBuilder: ["read", "update"],

  accounts: ["list", "read", "create", "update", "delete"],

  storeSettings: ["read", "update"],
  shopSettings: ["read", "update"],
  currencySettings: ["list", "read", "create", "update", "delete"],
  shippingSettings: ["list", "read", "create", "update", "delete"],
  paymentSettings: ["list", "read", "create", "update", "delete"],
} as const

// Etiquetas para mostrar en selectores de permisos.
export const RBAC_RESOURCE_LABELS: Record<RbacResource, string> = {
  dashboard: "Inicio / Dashboard",
  products: "Productos",
  categories: "Categorías",
  collections: "Colecciones",
  orders: "Pedidos",
  cards: "Tarjetas",
  teamContent: "Sección equipo",
  coupons: "Cupones",
  contents: "Contenido",
  heroSections: "Hero sections",
  fbt: "Combos (FBT)",
  kardex: "Kardex",
  pageBuilder: "Page Builder",
  accounts: "Cuentas y permisos",
  storeSettings: "Tienda",
  shopSettings: "Configuración",
  currencySettings: "Monedas",
  shippingSettings: "Envíos",
  paymentSettings: "Pagos",
}

// Un "permission key" simple que se puede usar tanto en frontend como en backend.
// Ejemplo: "products:create", "orders:cancel", "kardex:list".
export type RbacPermissionKey = `${RbacResource}:${RbacAction}`

