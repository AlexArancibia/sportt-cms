'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ArrowDown, ArrowUp, RefreshCw, RotateCcw } from 'lucide-react'
import type { KardexMovement, MovementType } from '@/types/kardex'

interface MovementsTableProps {
  movements: KardexMovement[]
}

const movementTypeConfig: Record<MovementType, { label: string; icon: typeof ArrowDown; color: string }> = {
  COMPRA: { label: 'Compra', icon: ArrowDown, color: 'text-green-600' },
  VENTA: { label: 'Venta', icon: ArrowUp, color: 'text-red-600' },
  DEVOLUCION: { label: 'Devolución', icon: RotateCcw, color: 'text-blue-600' },
  AJUSTE: { label: 'Ajuste', icon: RefreshCw, color: 'text-yellow-600' },
}

export function MovementsTable({ movements }: MovementsTableProps) {
  if (movements.length === 0) {
    return (
      <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">
        No hay movimientos registrados para esta variante
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Entrada</TableHead>
            <TableHead className="text-right">Salida</TableHead>
            <TableHead className="text-right">Stock Final</TableHead>
            <TableHead className="text-right">Costo Unitario</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Referencia</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.map((movement, index) => {
            const config = movementTypeConfig[movement.type]
            const Icon = config.icon

            // Obtener unitCost y totalCost del movimiento o de values si está disponible
            // Para AJUSTE, values está vacío, así que estos serán undefined
            const unitCost = movement.unitCost ?? 
              (movement.values && movement.values.length > 0 ? movement.values[0]?.unitCost : undefined)
            const totalCost = movement.totalCost ?? 
              (movement.values && movement.values.length > 0 ? movement.values[0]?.totalCost : undefined)

            return (
              <TableRow key={index}>
                <TableCell className="font-medium text-foreground">
                  {new Date(movement.date).toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${config.color}`} />
                    <span className="text-sm text-foreground">{config.label}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium text-green-600">
                  {movement.in > 0 ? `+${movement.in}` : '-'}
                </TableCell>
                <TableCell className="text-right font-medium text-red-600">
                  {movement.out > 0 ? `-${movement.out}` : '-'}
                </TableCell>
                <TableCell className="text-right font-medium text-foreground">
                  {movement.finalStock}
                </TableCell>
                <TableCell className="text-right text-foreground">
                  {unitCost != null ? `$${unitCost.toFixed(2)}` : '-'}
                </TableCell>
                <TableCell className="text-right font-semibold text-foreground">
                  {totalCost != null ? `$${totalCost.toFixed(2)}` : '-'}
                </TableCell>
                <TableCell>
                  {movement.reference ? (
                    <Badge variant="outline">{movement.reference}</Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

