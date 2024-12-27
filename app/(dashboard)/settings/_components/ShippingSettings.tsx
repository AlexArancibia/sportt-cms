'use client'

import { useState, useEffect } from 'react'
import { useMainStore } from '@/stores/mainStore'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Plus, Pencil, Trash2, DollarSign, Clock } from 'lucide-react'
import { ShippingMethod, CreateShippingMethodDto, UpdateShippingMethodDto } from '@/types/shippingMethod'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"

export function ShippingSettings() {
  const { toast } = useToast()
  const { shippingMethods, fetchShippingMethods, createShippingMethod, updateShippingMethod, deleteShippingMethod } = useMainStore()
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(null)
  const [formData, setFormData] = useState<CreateShippingMethodDto>({
    name: '',
    description: '',
    price: 0,
    estimatedDeliveryTime: '',
    isActive: true
  })

  useEffect(() => {
    fetchShippingMethods().then(() => setLoading(false))
  }, [fetchShippingMethods])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingMethod) {
        await updateShippingMethod(editingMethod.id, formData)
        toast({ title: "Success", description: "Shipping method updated successfully" })
      } else {
        await createShippingMethod(formData)
        toast({ title: "Success", description: "Shipping method created successfully" })
      }
      setIsDialogOpen(false)
      setEditingMethod(null)
      setFormData({ name: '', description: '', price: 0, estimatedDeliveryTime: '', isActive: true })
      fetchShippingMethods()
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save shipping method" })
    }
  }

  const handleEdit = (method: ShippingMethod) => {
    setEditingMethod(method)
    setFormData({
      name: method.name,
      description: method.description,
      price: method.price,
      estimatedDeliveryTime: method.estimatedDeliveryTime,
      isActive: method.isActive
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this shipping method?")) {
      try {
        await deleteShippingMethod(id)
        toast({ title: "Success", description: "Shipping method deleted successfully" })
        fetchShippingMethods()
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to delete shipping method" })
      }
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateShippingMethod(id, { isActive: !currentStatus })
      toast({ title: "Success", description: "Shipping method status updated successfully" })
      fetchShippingMethods()
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update shipping method status" })
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Shipping Methods</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingMethod(null)
              setFormData({ name: '', description: '', price: 0, estimatedDeliveryTime: '', isActive: true })
            }}>
              <Plus className="h-4 w-4 mr-2" /> Add Shipping Method
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingMethod ? 'Edit' : 'Add'} Shipping Method</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" value={formData.description} onChange={handleInputChange} required />
              </div>
              <div>
                <Label htmlFor="price">Price</Label>
                <Input id="price" name="price" type="number" value={formData.price} onChange={handleInputChange} required />
              </div>
              <div>
                <Label htmlFor="estimatedDeliveryTime">Estimated Delivery Time</Label>
                <Input id="estimatedDeliveryTime" name="estimatedDeliveryTime" value={formData.estimatedDeliveryTime} onChange={handleInputChange} required />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <Button type="submit">{editingMethod ? 'Update' : 'Create'} Shipping Method</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Estimated Delivery</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shippingMethods.map((method) => (
            <TableRow key={method.id}>
              <TableCell>{method.name}</TableCell>
              <TableCell>{method.description}</TableCell>
              <TableCell>
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  {method.price}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {method.estimatedDeliveryTime}
                </div>
              </TableCell>
              <TableCell>
                <Switch
                  checked={method.isActive}
                  onCheckedChange={() => handleToggleActive(method.id, method.isActive)}
                />
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(method)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(method.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

