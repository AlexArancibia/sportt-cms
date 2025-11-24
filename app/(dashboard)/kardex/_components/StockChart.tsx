'use client'

import { useMemo } from 'react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Card } from '@/components/ui/card'
import type { KardexMovement } from '@/types/kardex'

interface StockChartProps {
  movements: KardexMovement[]
  initialStock: number
  selectedCurrencyId?: string | null
}

interface ChartDataPoint {
  date: string
  stock: number
  unitCost?: number
  currencySymbol: string
  fullDate: string
  isInitial: boolean
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ value: number; payload: ChartDataPoint }>
  selectedCurrencyId?: string | null
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (!active || !payload?.[0]) return null

  const data = payload[0].payload
  const { date, stock, unitCost, currencySymbol, isInitial } = data

  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
      <p className="text-sm font-medium mb-1">{isInitial ? '-' : date}</p>
      {isInitial && <p className="text-xs text-muted-foreground mb-1 italic">Stock Inicial</p>}
      <p className="text-sm text-primary font-semibold">Stock: {stock} unidades</p>
      <p className="text-sm text-muted-foreground">
        Precio: {isInitial || unitCost == null ? '-' : `${currencySymbol}${unitCost.toFixed(2)}`}
      </p>
    </div>
  )
}

export function StockChart({ movements, initialStock, selectedCurrencyId }: StockChartProps) {
  // Calcular datos del gráfico con useMemo para optimizar rendimiento
  const chartData = useMemo(() => {
    // Si no hay datos, retornar array vacío
    if (movements.length === 0 && initialStock === 0) return []

    // Calcular fecha inicial (primer movimiento - 1 día)
    const getInitialDate = () => {
      if (movements.length === 0) return new Date()
      
      const sortedDates = movements.map(m => new Date(m.date).getTime()).sort((a, b) => a - b)
      const initialDate = new Date(sortedDates[0])
      initialDate.setDate(initialDate.getDate() - 1)
      return initialDate
    }

    const initialDate = getInitialDate()
    const initialPoint: ChartDataPoint = {
      date: initialDate.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' }),
      stock: initialStock,
      currencySymbol: '$',
      fullDate: initialDate.toISOString(),
      isInitial: true,
    }

    // Procesar movimientos
    const movementsData: ChartDataPoint[] = movements.map((movement) => {
      // Buscar valor en la moneda seleccionada
      let unitCost: number | undefined
      let currencySymbol = '$'

      if (movement.values?.length) {
        const currencyValue = selectedCurrencyId
          ? movement.values.find(v => v.currency.id === selectedCurrencyId)
          : movement.values.find(v => v.exchangeRate === 1.0) || movement.values[0]

        if (currencyValue) {
          unitCost = currencyValue.unitCost
          currencySymbol = currencyValue.currency.symbol
        }
      } else if (movement.unitCost != null) {
        unitCost = movement.unitCost
      }

      return {
        date: new Date(movement.date).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' }),
        stock: movement.finalStock,
        unitCost,
        currencySymbol,
        fullDate: typeof movement.date === 'string' ? movement.date : movement.date.toISOString(),
        isInitial: false,
      }
    })

    // Combinar y ordenar por fecha
    return [initialPoint, ...movementsData].sort((a, b) => 
      new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime()
    )
  }, [movements, initialStock, selectedCurrencyId])

  // Renderizar punto personalizado con key única
  const renderDot = ({ cx, cy, payload, index }: any) => {
    const isInitial = payload.isInitial
    const key = `dot-${payload.fullDate || payload.date}-${index}`
    const color = isInitial ? 'hsl(var(--muted-foreground))' : 'hsl(var(--primary))'

    return (
      <circle
        key={key}
        cx={cx}
        cy={cy}
        r={4}
        fill={color}
        stroke={color}
        strokeWidth={2}
      />
    )
  }

  // Si no hay datos, mostrar mensaje
  if (chartData.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          No hay datos suficientes para mostrar la gráfica
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Evolución del Stock</h3>
          <p className="text-sm text-muted-foreground">Stock en el tiempo (hover para ver precio unitario)</p>
        </div>
        
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              label={{ value: 'Unidades', angle: -90, position: 'insideLeft', style: { fill: 'hsl(var(--muted-foreground))' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="stock"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={renderDot}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}


