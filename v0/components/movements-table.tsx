'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import { Badge } from './ui/badge'
import { ArrowDown, ArrowUp, RefreshCw, RotateCcw } from 'lucide-react'

interface MovementsTableProps {
  movements: any[]
}

const movementTypeConfig = {
  COMPRA: { label: 'Compra', icon: ArrowDown, color: 'text-success' },
  VENTA: { label: 'Venta', icon: ArrowUp, color: 'text-destructive' },
  DEVOLUCION: { label: 'Devolución', icon: RotateCcw, color: 'text-chart-2' },
  AJUSTE: { label: 'Ajuste', icon: RefreshCw, color: 'text-warning' },
}

export function MovementsTable({ movements }: MovementsTableProps) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Cantidad</TableHead>
            <TableHead className="text-right">Costo Unitario</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Referencia</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.map((movement) => {
            const config = movementTypeConfig[movement.type as keyof typeof movementTypeConfig]
            const Icon = config.icon
            const total = movement.quantity * movement.unitCost

            return (
              <TableRow key={movement.id}>
                <TableCell className="font-medium">
                  {new Date(movement.date).toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${config.color}`} />
                    <span className="text-sm">{config.label}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {movement.quantity}
                </TableCell>
                <TableCell className="text-right">
                  ${movement.unitCost.toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  ${total.toFixed(2)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{movement.reference}</Badge>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
