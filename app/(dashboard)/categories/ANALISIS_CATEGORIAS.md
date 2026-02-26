# Análisis: página de Categorías y RBAC

## Resumen

La página de categorías tiene **RBAC bien aplicado** en todas las acciones (crear, editar, eliminar, listar). Hay **lógica duplicada** con el layout que conviene eliminar para unificar el flujo de permisos.

---

## 1. Layout (`categories/layout.tsx`)

- Usa **PermissionGuard** con `categories:list`.
- Gestiona: sin tienda, loading, error de permisos, sin permiso → pantalla correspondiente.
- **Correcto**: una sola fuente de verdad para “¿puede ver la sección?”.

---

## 2. Permisos en la página

Se usan bien los cuatro permisos:

| Permiso              | Uso en la página |
|----------------------|-------------------|
| `categories:list`    | Layout + query `useCategories(..., canViewCategories)` (redundante con layout). |
| `categories:create`  | Botón “Crear”, contenido del modal crear, `handleCreateCategory`. |
| `categories:update`  | Opción “Editar” (tabla + móvil), contenido del modal editar, `handleUpdateCategory`. |
| `categories:delete`  | Opción “Eliminar”, eliminar seleccionados (desktop y móvil), modales de confirmación, `handleDeleteCategory` y `handleDeleteSelectedCategories`. |

---

## 3. Acciones y controles

### Crear

- **Header**: botón “Crear Categoría” (icono + texto): habilitado solo con `canCreateCategory`; si no, botón en gris y `disabled`.
- **Empty state (móvil y desktop)**: mismo patrón (botón crear habilitado o gris).
- **Modal crear**: si `!canCreateCategory`, se muestra `NoPermissionScreen` + botón “Cerrar” (sin enlace “Volver”).
- **Handler**: `handleCreateCategory` hace `if (!canCreateCategory) return`.
- **Conclusión**: bien implementado.

### Editar

- **Tabla (desktop)**: menú por fila; “Editar” con `disabled={!canUpdateCategory}` y estilos muted cuando no hay permiso.
- **Tarjetas (móvil)**: `CategoryCard` recibe `canEdit={canUpdateCategory}` y deshabilita/estiliza “Editar”.
- **Modal editar**: si `!canUpdateCategory`, se muestra `NoPermissionScreen` + “Cerrar”.
- **Handler**: `handleUpdateCategory` hace `if (!editingCategory || !canUpdateCategory) return`.
- **Conclusión**: bien implementado.

### Eliminar (uno y varios)

- **Tabla (desktop)**: “Eliminar” en el menú con `disabled={!canDeleteCategory}` y estilo muted/rojo según permiso.
- **Tarjetas (móvil)**: `CategoryCard` con `canDelete={canDeleteCategory}`.
- **Barra “Eliminar (N)” (desktop)**: botón habilitado o gris según `canDeleteCategory`.
- **Sticky móvil (seleccionados)**: botón “Eliminar” habilitado o gris según `canDeleteCategory`.
- **Modal eliminar (uno)**: si `!canDeleteCategory`, `NoPermissionScreen` + “Cerrar”.
- **Modal eliminar varios**: mismo patrón.
- **Handlers**: `handleDeleteCategory` y `handleDeleteSelectedCategories` comprueban `canDeleteCategory`.
- **Conclusión**: bien implementado.

---

## 4. Problemas detectados

### 4.1 Lógica duplicada con el layout (recomendado corregir)

La página sigue teniendo **cuatro early returns** que repiten lo que ya hace el layout:

1. `if (!currentStoreId)` → pantalla “Selecciona una tienda”.
2. `if (permissionsLoading)` → skeleton con HeaderBar.
3. `if (permissionsError)` → Card “No se pudieron cargar los permisos” + Reintentar.
4. `if (!canViewCategories)` → `NoPermissionScreen` “No tienes permiso para ver categorías”.

Con el **layout** usando `PermissionGuard`, cuando se llega a la página por navegación normal el usuario ya tiene tienda, permisos cargados, sin error y con `categories:list`. Por tanto estos bloques en la página son redundantes y duplican UI y criterio.

**Recomendación**: eliminar estos cuatro bloques de la página y dejar que el layout sea la única puerta de acceso (como en productos). Así se evita doble lógica y se pueden quitar imports que solo se usan ahí: `Store`, `RefreshCw`, `AlertTriangle`, `Card`, `CardContent`.

### 4.2 Query `useCategories`

- Hoy: `useCategories(..., !!currentStoreId && canViewCategories)`.
- Con el layout, `canViewCategories` es redundante: si estamos en la página, el layout ya validó `categories:list`.
- **Opcional**: simplificar a `useCategories(..., !!currentStoreId)`.

### 4.3 NoPermissionScreen en modales

- En los modales (crear / editar / eliminar / eliminar varios) se usa `backHref={undefined}` para no mostrar el enlace “Volver” y se añade un botón “Cerrar”.
- `NoPermissionScreen` admite `backHref` opcional y solo muestra el botón cuando `backHref` es truthy. Comportamiento correcto.

---

## 5. Comparación con productos

| Aspecto              | Productos                         | Categorías                         |
|----------------------|-----------------------------------|------------------------------------|
| Layout               | PermissionGuard por ruta (list/create/update) | PermissionGuard solo list          |
| Rutas protegidas     | /products, /products/new, /products/[id]/edit | Solo listado (todo en una página)  |
| Crear                | Botón gris + ruta bloqueada       | Botón gris + modal con NoPermission |
| Editar               | Menú gris + ruta bloqueada        | Menú gris + modal con NoPermission |
| Eliminar / Archivar  | Menú gris + bulk gris             | Menú gris + bulk gris               |
| Duplicado en página  | No (solo layout)                  | Sí (early returns en página)       |

Categorías no tiene rutas “crear” o “editar” propias (todo es modal), por eso no hace falta PermissionGuard por ruta; el layout con `categories:list` es suficiente y el resto se controla en la página con los flags de permiso.

---

## 6. Conclusión

- **RBAC**: implementación correcta y completa para list, create, update y delete en la página de categorías.
- **Mejora recomendada**: quitar de la página los early returns de “sin tienda”, “loading”, “error” y “sin permiso list”, y apoyarse solo en el layout con `PermissionGuard`, eliminando imports que queden sin uso.
