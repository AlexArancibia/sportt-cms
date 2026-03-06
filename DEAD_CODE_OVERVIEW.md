## Código muerto y rutas no utilizadas en ECOMMERCE

Este documento resume el código relacionado con:

- **Refunds**
- **Payment Transactions**

que, a fecha del análisis, no está realmente conectado a la UI o no tiene llamadas dentro de este repo.

### Metodología

- Búsqueda de símbolos con `Grep`/`rg` en todo `ECOMMERCE`.
- Para cada función o componente:
  - Localizar su **definición**.
  - Buscar todas sus **referencias** (imports, llamadas, JSX).
  - Si solo aparece declarada pero no referenciada, se marca como **código muerto**.
  - Si hay una cadena de llamadas pero el componente raíz **no se monta en ninguna página**, se marca como **flujo no conectado a la UI**.

---

## 1. Refunds

### 1.1. `createRefund` en `stores/mainStore.ts`

- **Ubicación**: `stores/mainStore.ts`
- **Definición**:

```1625:1633:c:\Users\User\Documents\ECOMMERCE\stores\mainStore.ts
createRefund: async (data: any) => {
  set({ loading: true, error: null })
  try {
    await apiClient.post("/refunds", data)
    set({ loading: false })
  } catch (error) {
    set({ error: "Failed to create refund", loading: false })
    throw error
  }
},
```

- **Búsqueda de usos**:
  - `Grep` de `createRefund(` en todo `ECOMMERCE` devuelve:
    - La firma y la implementación anteriores (en el store).
    - El `createRefund` del **hook** `useOrderMutations` (ver siguiente apartado).
  - No hay componentes ni páginas que llamen a `useMainStore().createRefund`.

- **Conclusión**:
  - `createRefund` del store es **código muerto** (no se usa en ningún flujo).

### 1.2. Flujo de refunds vía `useOrderMutations` + `RefundDialog`

- **Piezas implicadas**:
  - `hooks/orders/useOrderMutations.ts`

```23:25:c:\Users\User\Documents\ECOMMERCE\hooks\orders\useOrderMutations.ts
async function createRefundApi(data: CreateRefundDto): Promise<void> {
  await apiClient.post("/refunds", data)
}
...
72:80:c:\Users\User\Documents\ECOMMERCE\hooks\orders\useOrderMutations.ts
const createRefund = useMutation({
  mutationFn: createRefundApi,
  onSuccess: (_, variables) => {
    if (storeId) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.order.byId(storeId, variables.orderId) })
      invalidateOrders()
    }
  },
})
```

  - `app/(dashboard)/orders/_components/RefunDialog.tsx`

```24:27:c:\Users\User\Documents\ECOMMERCE\app\(dashboard)\orders\_components\RefunDialog.tsx
export function RefundDialog({ open, onOpenChange, order, onSuccess }: RefundDialogProps) {
  const { toast } = useToast()
  const { createRefund } = useOrderMutations(order.storeId ?? null)
```

- **Búsqueda de usos del componente**:

```text
Grep "RefundDialog" en todo ECOMMERCE → solo devuelve:
- la propia definición en `app/(dashboard)/orders/_components/RefunDialog.tsx`
```

No hay ningún `import { RefundDialog } ...` ni JSX `<RefundDialog ... />` en ninguna página.

- **Conclusión**:
  - A nivel de código:
    - `createRefundApi` y `createRefund` (hook) **sí tienen referencias internas** (desde `RefundDialog`).
  - A nivel de UI:
    - `RefundDialog` **no se monta en ninguna página**, por lo que el flujo “Issue Refund” no es alcanzable para el usuario.
  - En la práctica, el endpoint `POST /refunds` del backend **no se llama desde la UI actual**, salvo que montes manualmente `RefundDialog` en alguna pantalla.

---

## 2. Payment Transactions

Todo el soporte para `payment-transactions` en este repo vive en el `mainStore` y **no se usa desde la UI**.

### 2.1. `fetchPaymentTransactions`

- **Ubicación**: `stores/mainStore.ts`

```1969:1980:c:\Users\User\Documents\ECOMMERCE\stores\mainStore.ts
// Método fetchPaymentTransactions - siempre datos frescos
fetchPaymentTransactions: async () => {
  set({ loading: true, error: null })
  try {
    const response = await apiClient.get<PaymentTransaction[]>("/payment-transactions")
    const { data: transactionsData } = extractPaginatedData<PaymentTransaction[]>(response)
    
    set({
      paymentTransactions: transactionsData,
      loading: false,
    })
    return transactionsData
  } catch (error) {
    set({ error: "Failed to fetch payment transactions", loading: false })
    throw error
  }
},
```

- **Búsqueda de usos**:
  - `Grep` de `fetchPaymentTransactions(` en todo `ECOMMERCE` → **no devuelve llamadas**, solo la firma y la implementación.

### 2.2. `createPaymentTransaction` y `updatePaymentTransaction`

- **Ubicación**: `stores/mainStore.ts`

```2038:2047:c:\Users\User\Documents\ECOMMERCE\stores\mainStore.ts
createPaymentTransaction: async (data: any) => {
  set({ loading: true, error: null })
  try {
    const response = await apiClient.post<PaymentTransaction>("/payment-transactions", data)
    const newPaymentTransaction = extractApiData(response)
    set((state) => ({
      paymentTransactions: [...state.paymentTransactions, newPaymentTransaction],
      loading: false,
    }))
    return newPaymentTransaction
  } catch (error) {
    set({ error: "Failed to create payment transaction", loading: false })
    throw error
  }
},
```

```2054:2064:c:\Users\User\Documents\ECOMMERCE\stores\mainStore.ts
updatePaymentTransaction: async (id: string, data: any) => {
  set({ loading: true, error: null })
  try {
    const response = await apiClient.put<PaymentTransaction>(`/payment-transactions/${id}`, data)
    const updatedPaymentTransaction = extractApiData(response)
    set((state) => ({
      paymentTransactions: state.paymentTransactions.map((transaction) =>
        transaction.id === id ? { ...transaction, ...updatedPaymentTransaction } : transaction,
      ),
      loading: false,
    }))
    return updatedPaymentTransaction
  } catch (error) {
    set({ error: "Failed to update payment transaction", loading: false })
    throw error
  }
},
```

- **Búsqueda de usos**:
  - `Grep` de `createPaymentTransaction(` y `updatePaymentTransaction(` en todo el repo → solo devuelve:
    - La firma en la interfaz de `MainStore`.
    - La implementación en `stores/mainStore.ts`.
  - No hay componentes, hooks ni páginas que los invoquen.

- **Conclusión**:
  - `fetchPaymentTransactions`, `createPaymentTransaction` y `updatePaymentTransaction` son **código muerto** en este repo.
  - Los endpoints de backend `/payment-transactions` no se están utilizando desde `ECOMMERCE`.

---

## 3. Resumen por endpoint backend

### Refunds (`/refunds`)

- `POST /refunds`:
  - Encapsulado en:
    - `hooks/orders/useOrderMutations.ts` → `createRefundApi`.
    - `RefundDialog` (componente de UI).
  - Pero `RefundDialog` no se monta en ninguna página.
  - **Efecto práctico**: el endpoint **no se llama** en los flujos normales de la UI.

### Payment Transactions (`/payment-transactions`)

- `GET /payment-transactions`
- `POST /payment-transactions`
- `PUT /payment-transactions/:id`

Todos están “preparados” en el `mainStore`, pero **ninguno se usa desde la UI**:

- No hay listados de transacciones de pago.
- No hay pantallas que creen o editen `paymentTransaction` desde el dashboard.

---

## 4. Recomendaciones

- **Refunds**
  - Decidir si quieres un flujo de reembolso en el dashboard:
    - Si la respuesta es sí, conecta `RefundDialog` en la pantalla de órdenes y revisa que la UX encaje.
    - Si no, considera eliminar:
      - `RefundDialog`.
      - `createRefundApi` y el `createRefund` del hook.
      - `createRefund` del `mainStore`.

- **Payment Transactions**
  - Si no se va a mostrar ni gestionar explícitamente en el panel (`/payment-transactions`), se pueden eliminar:
    - `fetchPaymentTransactions`, `createPaymentTransaction`, `updatePaymentTransaction` del store.
    - El campo `paymentTransactions` del estado si no se usa en ningún otro sitio.

Dejar este código “dormido” no rompe nada, pero **complica el mantenimiento** y puede confundir al analizar qué rutas del backend están realmente en uso.

