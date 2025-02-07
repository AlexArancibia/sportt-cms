import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import type { Customer } from "@/types/customer"
import type React from "react"

interface CustomerTableProps {
  customers: Customer[]
}

export const CustomerTable: React.FC<CustomerTableProps> = ({ customers }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="pl-6 ">Name</TableHead>
          <TableHead className=" ">Email</TableHead>
          <TableHead className="text-right">Phone</TableHead>
          <TableHead className="text-right">Accepts Marketing</TableHead>
          <TableHead className="text-right">Orders</TableHead>
          <TableHead className="text-right text-transparent">.</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.map((customer) => (
          <TableRow key={customer.id} className="text-sm">
            <TableCell className="pl-6 font-medium  ">
              {customer.firstName && customer.lastName ? `${customer.firstName} ${customer.lastName}` : customer.email}
            </TableCell>
            <TableCell className=" ">{customer.email}</TableCell>
            <TableCell className="text-right">{customer.phone || "N/A"}</TableCell>
            <TableCell className="text-right">
              <Badge className={customer.acceptsMarketing ? "bg-green-300 text-emerald-900" : "bg-slate-200 text-slate-900"}>
                {customer.acceptsMarketing ? "Yes" : "No"}
              </Badge>
            </TableCell>
            <TableCell className="text-right">{customer.orders?.length || 0}</TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Link href={`/customers/${customer.id}/edit`} className="flex items-center">
                      <Pencil className="mr-2 h-4 w-4" />
                      <span>Edit</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

