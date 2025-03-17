"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import type { Customer } from "@/types/customer"
import type { Order } from "@/types/order"
import type React from "react"
import { useMainStore } from "@/stores/mainStore"
import { useToast } from "@/hooks/use-toast"

interface CustomerTableProps {
  customers: Customer[]
}

export const CustomerTable: React.FC<CustomerTableProps> = ({ customers }) => {
  const { deleteCustomer, fetchOrders } = useMainStore()
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoadingOrders, setIsLoadingOrders] = useState(true)

  // Cargar pedidos cuando el componente se monte
  useEffect(() => {
    const loadOrders = async () => {
      setIsLoadingOrders(true)
      try {
        const allOrders = await fetchOrders()
        setOrders(allOrders)
      } catch (error) {
        console.error("Error al cargar pedidos:", error)
      } finally {
        setIsLoadingOrders(false)
      }
    }

    loadOrders()
  }, [fetchOrders])

  // Función para obtener el número de pedidos de un cliente específico
  const getCustomerOrderCount = (customerId: string) => {
    return orders.filter((order) => order.customerId === customerId).length
  }

  const handleDelete = async (customerId: string, customerName: string) => {
    // Mostrar diálogo de confirmación
    if (window.confirm(`¿Estás seguro de que deseas eliminar al cliente ${customerName}?`)) {
      try {
        // Llamar a la función de eliminación
        await deleteCustomer(customerId)

        // Mostrar notificación de éxito
        toast({
          title: "Cliente eliminado",
          description: `El cliente ${customerName} ha sido eliminado correctamente.`,
        })
      } catch (error) {
        console.error("Error al eliminar cliente:", error)

        // Mostrar notificación de error
        toast({
          title: "Error",
          description: "No se pudo eliminar el cliente. Por favor, inténtalo de nuevo.",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="pl-6 ">Nombre</TableHead>
          <TableHead className=" ">Email</TableHead>
          <TableHead className="text-right">Teléfono</TableHead>
          <TableHead className="text-right">Acepta Marketing</TableHead>
          <TableHead className="text-right">Pedidos</TableHead>
          <TableHead className="text-right text-transparent">.</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.map((customer) => {
          // Determinar el nombre a mostrar para el cliente
          const customerName =
            customer.firstName && customer.lastName
              ? `${customer.firstName} ${customer.lastName}`
              : customer.email || "Cliente"

          return (
            <TableRow key={customer.id} className="text-sm">
              <TableCell className="pl-6 font-medium  ">{customerName}</TableCell>
              <TableCell className=" ">{customer.email}</TableCell>
              <TableCell className="text-right">{customer.phone || "N/A"}</TableCell>
              <TableCell className="text-right">
                <Badge
                  className={
                    customer.acceptsMarketing ? "bg-green-300 text-emerald-900" : "bg-slate-200 text-slate-900"
                  }
                >
                  {customer.acceptsMarketing ? "Sí" : "No"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {isLoadingOrders ? (
                  <span className="text-muted-foreground">Cargando...</span>
                ) : (
                  getCustomerOrderCount(customer.id)
                )}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Abrir menú</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Link href={`/customers/${customer.id}/edit`} className="flex items-center">
                        <Pencil className="mr-2 h-4 w-4" />
                        <span>Editar</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600 cursor-pointer"
                      onClick={() => handleDelete(customer.id, customerName)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Eliminar</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

