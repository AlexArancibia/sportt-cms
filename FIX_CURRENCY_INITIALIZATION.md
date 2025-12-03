# 🔧 Fix: Inicialización del Currency en Kardex

## 📋 Problema Original

Cuando entrabas a `/kardex`, a veces el `currency` no se inicializaba correctamente. Podía quedar en `null` en lugar de usar el valor por defecto de shop settings.

## 🎯 Solución Implementada

Hemos optimizado y simplificado la lógica de inicialización del currency para que **siempre** tenga un valor válido y no nulo, usando el currency por defecto de shop settings como prioridad.

---

## 📚 Explicación Paso a Paso (con manzanitas 🍎)

### **Paso 1: Cargar los Datos Necesarios**

```typescript
// Este useEffect carga shopSettings y currencies cuando cambia la tienda
useEffect(() => {
  const loadStoreData = async () => {
    if (currentStore) {
      await Promise.all([
        fetchShopSettings(currentStore),
        fetchCurrencies(),
      ])
    }
  }
  loadStoreData()
}, [currentStore, fetchShopSettings, fetchCurrencies])
```

**¿Qué hace?**
- Cuando cambias de tienda o entras por primera vez, carga:
  - Las configuraciones de la tienda (shopSettings)
  - Todas las monedas disponibles (currencies)

---

### **Paso 2: Obtener la Configuración de la Tienda Actual**

```typescript
const currentShopSettings = useMemo(() => 
  shopSettings.find(s => s.storeId === currentStore),
  [shopSettings, currentStore]
)
```

**¿Qué hace?**
- Busca en el array de `shopSettings` la configuración que corresponde a la tienda actual
- Usa `useMemo` para evitar recalcular si no cambian los datos
- **Resultado**: Tiene acceso a `defaultCurrencyId` y `acceptedCurrencies`

---

### **Paso 3: Determinar las Monedas Aceptadas**

```typescript
const acceptedCurrencies = useMemo(() => {
  const shopCurrencies = currentShopSettings?.acceptedCurrencies?.filter(c => c.isActive) || []
  return shopCurrencies.length > 0 
    ? shopCurrencies 
    : currencies.filter(c => c.isActive)
}, [currentShopSettings, currencies])
```

**¿Qué hace?**
- **Si la tienda tiene monedas aceptadas configuradas**: usa esas (solo las activas)
- **Si NO tiene monedas aceptadas**: usa todas las monedas activas del sistema
- **Resultado**: Siempre tiene al menos una moneda disponible

---

### **Paso 4: Calcular el Currency por Defecto (LA CLAVE 🔑)**

```typescript
const defaultCurrencyId = useMemo(() => 
  currentShopSettings?.defaultCurrencyId ||           // Prioridad 1: El de shop settings
  acceptedCurrencies[0]?.id ||                        // Prioridad 2: Primera aceptada
  currencies.find(c => c.isActive)?.id ||             // Prioridad 3: Primera activa
  null,                                                // Último recurso (caso extremo)
  [currentShopSettings, acceptedCurrencies, currencies]
)
```

**¿Qué hace?**
Usa el operador `||` (OR lógico) para establecer una **cadena de prioridades**:

1. **🥇 Primera opción**: `currentShopSettings?.defaultCurrencyId`
   - Si la tienda tiene un currency por defecto configurado, lo usa
   - **Esta es la opción que queremos siempre que sea posible**

2. **🥈 Segunda opción**: `acceptedCurrencies[0]?.id`
   - Si no hay default configurado, usa la primera moneda aceptada

3. **🥉 Tercera opción**: `currencies.find(c => c.isActive)?.id`
   - Si no hay monedas aceptadas, usa la primera moneda activa del sistema

4. **❌ Último recurso**: `null`
   - Solo si no hay ninguna moneda disponible (caso extremo)

**Resultado**: Siempre tiene un currency válido (o `null` solo en caso extremo)

---

### **Paso 5: Estado del Currency Seleccionado**

```typescript
const [selectedCurrencyId, setSelectedCurrencyId] = useState<string | null>(null)
```

**¿Qué hace?**
- Crea un estado para guardar qué currency está seleccionado
- Inicialmente es `null` (se llenará automáticamente en el siguiente paso)

---

### **Paso 6: Inicialización Automática (EL CORAZÓN ❤️)**

```typescript
useEffect(() => {
  if (!defaultCurrencyId) return  // Si no hay default, no hacer nada
  
  // Si no hay selección o la selección actual no es válida, usar el default
  const isValid = selectedCurrencyId && acceptedCurrencies.some(c => c.id === selectedCurrencyId)
  if (!selectedCurrencyId || !isValid) {
    setSelectedCurrencyId(defaultCurrencyId)
  }
}, [defaultCurrencyId, selectedCurrencyId, acceptedCurrencies])
```

**¿Qué hace?**
Este `useEffect` se ejecuta cuando:
- Se carga `defaultCurrencyId` por primera vez
- Cambia `defaultCurrencyId` (ej: cambias de tienda)
- Cambia `selectedCurrencyId` (ej: el usuario selecciona otra moneda)
- Cambian `acceptedCurrencies`

**Lógica:**
1. **Si no hay `defaultCurrencyId`**: No hace nada (espera a que se carguen los datos)
2. **Si `selectedCurrencyId` es `null`**: Lo establece al `defaultCurrencyId`
3. **Si la selección actual NO es válida** (no está en las monedas aceptadas): Lo actualiza al `defaultCurrencyId`

**Resultado**: El currency **siempre** se inicializa correctamente cuando los datos están disponibles

---

## 🎨 Optimizaciones Realizadas

### **Antes (Código Original)**
```typescript
// ❌ Código más largo y con múltiples condiciones anidadas
useEffect(() => {
  if (currentShopSettings?.defaultCurrencyId && !selectedCurrencyId) {
    setSelectedCurrencyId(currentShopSettings.defaultCurrencyId)
  } else if (acceptedCurrencies.length > 0 && !selectedCurrencyId) {
    setSelectedCurrencyId(acceptedCurrencies[0].id)
  }
}, [currentShopSettings, acceptedCurrencies, selectedCurrencyId])
```

**Problemas:**
- Dependía de que `selectedCurrencyId` fuera `null` para inicializar
- No validaba si la selección actual era válida
- Podía no ejecutarse si había condiciones de carrera

### **Después (Código Optimizado)**
```typescript
// ✅ Código más limpio, con prioridades claras y validación
const defaultCurrencyId = useMemo(() => 
  currentShopSettings?.defaultCurrencyId ||
  acceptedCurrencies[0]?.id ||
  currencies.find(c => c.isActive)?.id ||
  null,
  [currentShopSettings, acceptedCurrencies, currencies]
)

useEffect(() => {
  if (!defaultCurrencyId) return
  const isValid = selectedCurrencyId && acceptedCurrencies.some(c => c.id === selectedCurrencyId)
  if (!selectedCurrencyId || !isValid) {
    setSelectedCurrencyId(defaultCurrencyId)
  }
}, [defaultCurrencyId, selectedCurrencyId, acceptedCurrencies])
```

**Ventajas:**
- ✅ **Más legible**: Prioridades claras con operador `||`
- ✅ **Más eficiente**: `useMemo` evita recálculos innecesarios
- ✅ **Más robusto**: Valida que la selección sea válida
- ✅ **Más confiable**: Siempre se inicializa cuando los datos están disponibles

---

## 🔄 Flujo Completo de Inicialización

```
1. Usuario entra a /kardex
   ↓
2. Se carga currentStore
   ↓
3. useEffect carga shopSettings y currencies (Paso 1)
   ↓
4. currentShopSettings se calcula (Paso 2)
   ↓
5. acceptedCurrencies se calcula (Paso 3)
   ↓
6. defaultCurrencyId se calcula con prioridades (Paso 4)
   ↓
7. useEffect detecta que defaultCurrencyId está disponible (Paso 6)
   ↓
8. Establece selectedCurrencyId = defaultCurrencyId
   ↓
9. ✅ Currency inicializado correctamente!
```

---

## 🧪 Casos de Uso

### **Caso 1: Tienda con Currency por Defecto Configurado**
- Shop Settings tiene `defaultCurrencyId = "USD"`
- **Resultado**: `selectedCurrencyId = "USD"` ✅

### **Caso 2: Tienda sin Currency por Defecto, pero con Monedas Aceptadas**
- Shop Settings no tiene `defaultCurrencyId`
- Tiene `acceptedCurrencies = ["MXN", "USD"]`
- **Resultado**: `selectedCurrencyId = "MXN"` (primera aceptada) ✅

### **Caso 3: Tienda sin Configuración de Monedas**
- Shop Settings no tiene monedas aceptadas
- Hay monedas activas en el sistema: `["USD", "EUR"]`
- **Resultado**: `selectedCurrencyId = "USD"` (primera activa) ✅

### **Caso 4: Usuario Cambia Manualmente el Currency**
- Usuario selecciona "EUR" en el dropdown
- `selectedCurrencyId = "EUR"`
- Si "EUR" está en `acceptedCurrencies`: Se mantiene ✅
- Si "EUR" NO está en `acceptedCurrencies`: Se resetea al default ✅

---

## 📊 Resumen

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Inicialización** | ❌ A veces fallaba | ✅ Siempre funciona |
| **Valor por defecto** | ⚠️ No siempre usaba shop settings | ✅ Prioriza shop settings |
| **Validación** | ❌ No validaba selección | ✅ Valida que sea válida |
| **Código** | ⚠️ Más largo y complejo | ✅ Más limpio y legible |
| **Rendimiento** | ⚠️ Recalculaba innecesariamente | ✅ Optimizado con useMemo |

---

## ✅ Conclusión

Ahora el currency **siempre** se inicializa correctamente:
1. **Prioriza** el currency por defecto de shop settings
2. **Tiene fallbacks** si no hay configuración
3. **Valida** que la selección sea válida
4. **Se actualiza** automáticamente cuando cambian los datos

**El problema está resuelto! 🎉**



