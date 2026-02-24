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
  "settings",        // Configuraciones de la tienda
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
  "cancel",      // Cancelar (ej. pedidos)
  "archive",     // Archivar (sin borrar)
  "unarchive",   // Desarchivar
  "publish",     // Publicar / aplicar cambios (ej. Page Builder)
] as const

export type RbacAction = (typeof RBAC_ACTIONS)[number]

// Acciones permitidas por recurso según la funcionalidad actual del CMS.
// Esto es la "matriz" de permisos base sobre la que el owner podrá
// construir roles personalizados por tienda.
export const RBAC_RESOURCE_ACTIONS: Record<RbacResource, readonly RbacAction[]> = {
  dashboard: ["view"],

  products: ["list", "read", "create", "update", "delete", "archive", "unarchive"],

  categories: ["list", "read", "create", "update", "delete"],

  collections: ["list", "read", "create", "update", "delete"],

  orders: ["list", "read", "create", "update", "cancel"],

  cards: ["list", "read", "create", "update", "delete"],

  // Contenido de la sección "Equipo" que se muestra en el frontend.
  teamContent: ["list", "read", "create", "update", "delete"],

  coupons: ["list", "read", "create", "update", "delete"],

  contents: ["list", "read", "create", "update", "delete"],

  heroSections: ["list", "read", "create", "update", "delete"],

  fbt: ["list", "read", "create", "update", "delete"],

  // El módulo actual de kardex solo hace lecturas agregadas.
  kardex: ["list"],

  pageBuilder: ["read", "update", "publish"],

  settings: ["read", "update"],
} as const

// Un "permission key" simple que se puede usar tanto en frontend como en backend.
// Ejemplo: "products:create", "orders:cancel", "kardex:list".
export type RbacPermissionKey = `${RbacResource}:${RbacAction}`

