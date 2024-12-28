'use client'

import { useEffect, useState } from 'react'
import { useMainStore } from '@/stores/mainStore'
import { Customer } from '@/types/customer'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Pencil, Trash2, Search, Plus } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { CustomerModal } from './_components/CustomerModal'
import { Skeleton } from "@/components/ui/skeleton"

export default function CustomersPage() {
  const { customers, fetchCustomers, deleteCustomer, loading } = useMainStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const { toast } = useToast()

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await deleteCustomer(id)
        toast({
          title: "Success",
          description: "Customer deleted successfully",
        })
      } catch (error) {
        console.log(error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete customer",
        })
      }
    }
  }

  const handleDeleteSelected = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedCustomers.length} selected customers?`)) {
      try {
        await Promise.all(selectedCustomers.map(id => deleteCustomer(id)))
        setSelectedCustomers([])
        toast({
          title: "Success",
          description: "Selected customers deleted successfully",
        })
      } catch (error) {
        console.log(error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete selected customers",
        })
      }
    }
  }

  const filteredCustomers = customers.filter(customer =>
    customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const CustomerSkeleton = () => (
    <TableRow>
      <TableCell className="w-[40px]"><Skeleton className="h-4 w-4" /></TableCell>
      <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
      <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
      <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
      <TableCell><Skeleton className="h-8 w-[80px]" /></TableCell>
    </TableRow>
  )

  return (
    <div className="">
      <header className="border-b">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h1 className="text-lg font-semibold">Customers</h1>
          <CustomerModal onSuccess={fetchCustomers}>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" /> <p>New Customer</p>
            </Button>
          </CustomerModal>
        </div>
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search customers..."
              className="pl-8 w-full border-gray-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search customers"
            />
          </div>
          {selectedCustomers.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected ({selectedCustomers.length})
            </Button>
          )}
        </div>
      </header>
      <div className="w-full overflow-x-auto">
        <Table className="w-full border-collapse">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px] py-2 px-6 font-medium">
                <input
                  type="checkbox"
                  checked={selectedCustomers.length === customers.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCustomers(customers.map(c => c.id))
                    } else {
                      setSelectedCustomers([])
                    }
                  }}
                  className="h-4 w-4"
                />
              </TableHead>
              <TableHead className="py-2 px-2 font-medium">Name</TableHead>
              <TableHead className="py-2 px-2 font-medium">Email</TableHead>
              <TableHead className="py-2 px-2 font-medium">Phone</TableHead>
              <TableHead className="py-2 px-2 font-medium">Address</TableHead>
              <TableHead className="py-2 px-2 font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <>
                <CustomerSkeleton />
                <CustomerSkeleton />
                <CustomerSkeleton />
                <CustomerSkeleton />
                <CustomerSkeleton />
              </>
            ) : filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  <p>No customers found</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer: Customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="py-2 px-6">
                    <input
                      type="checkbox"
                      checked={selectedCustomers.includes(customer.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCustomers([...selectedCustomers, customer.id])
                        } else {
                          setSelectedCustomers(selectedCustomers.filter(id => id !== customer.id))
                        }
                      }}
                      className="h-4 w-4"
                    />
                  </TableCell>
                  <TableCell className="py-2 px-2">{`${customer.firstName} ${customer.lastName}`}</TableCell>
                  <TableCell className="py-2 px-2">{customer.email}</TableCell>
                  <TableCell className="py-2 px-2">{customer.phone}</TableCell>
                  <TableCell className="py-2 px-2">{customer.address}</TableCell>
                  <TableCell className="py-2 px-2">
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(customer.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

