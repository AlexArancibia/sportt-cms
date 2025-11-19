'use client'

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Card } from './ui/card'

interface StockChartProps {
  movements: any[]
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium mb-1">{payload[0].payload.date}</p>
        <p className="text-sm text-primary font-semibold">
          Stock: {payload[0].value} unidades
        </p>
        <p className="text-sm text-muted-foreground">
          Precio: ${payload[0].payload.unitCost?.toFixed(2) || '0.00'}
        </p>
      </div>
    )
  }
  return null
}

export function StockChart({ movements }: StockChartProps) {
  const chartData = movements.map((movement) => ({
    date: new Date(movement.date).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' }),
    stock: movement.finalStock,
    unitCost: movement.unitCost,
    fullDate: movement.date,
  }))

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
              dot={{ fill: 'hsl(var(--primary))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
