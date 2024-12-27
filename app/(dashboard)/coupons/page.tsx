'use client'

import { useState, useEffect } from 'react'
import { useMainStore } from '@/stores/mainStore'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Plus, Pencil, Trash2, Percent, Calendar } from 'lucide-react'
import { Coupon, CreateCouponDto, UpdateCouponDto } from '@/types/coupon'
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
import { Textarea } from "@/components/ui/textarea"
import { format } from 'date-fns'

export default function CouponsPage() {
  const { toast } = useToast()
  const { coupons, fetchCoupons, createCoupon, updateCoupon, deleteCoupon } = useMainStore()
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [formData, setFormData] = useState<CreateCouponDto>({
    code: '',
    description: '',
    discount: 0,
    startDate: '',
    endDate: '',
    isActive: true,
    conditions: '{}'
  })

  useEffect(() => {
    fetchCoupons().then(() => setLoading(false))
  }, [fetchCoupons])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const couponData = {
        ...formData,
        conditions: formData.conditions 
          ? JSON.parse(formData.conditions as string) 
          : {}
      }

      if (editingCoupon) {
        await updateCoupon(editingCoupon.id, couponData)
        toast({ title: "Success", description: "Coupon updated successfully" })
      } else {
        await createCoupon(couponData)
        toast({ title: "Success", description: "Coupon created successfully" })
      }
      setIsDialogOpen(false)
      setEditingCoupon(null)
      setFormData({ code: '', description: '', discount: 0, startDate: '', endDate: '', isActive: true, conditions: '{}' })
      fetchCoupons()
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save coupon" })
    }
  }

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    setFormData({
      code: coupon.code,
      description: coupon.description,
      discount: coupon.discount,
      startDate: format(new Date(coupon.startDate), 'yyyy-MM-dd'),
      endDate: coupon.endDate ? format(new Date(coupon.endDate), 'yyyy-MM-dd') : '',
      isActive: coupon.isActive,
      conditions: JSON.stringify(coupon.conditions || {})
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this coupon?")) {
      try {
        await deleteCoupon(id)
        toast({ title: "Success", description: "Coupon deleted successfully" })
        fetchCoupons()
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to delete coupon" })
      }
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateCoupon(id, { isActive: !currentStatus })
      toast({ title: "Success", description: "Coupon status updated successfully" })
      fetchCoupons()
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update coupon status" })
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Coupons</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingCoupon(null)
              setFormData({ code: '', description: '', discount: 0, startDate: '', endDate: '', isActive: true, conditions: '{}' })
            }}>
              <Plus className="h-4 w-4 mr-2" /> Add Coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingCoupon ? 'Edit' : 'Add'} Coupon</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="code">Code</Label>
                <Input id="code" name="code" value={formData.code} onChange={handleInputChange} required />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" value={formData.description} onChange={handleInputChange} required />
              </div>
              <div>
                <Label htmlFor="discount">Discount (%)</Label>
                <Input id="discount" name="discount" type="number" value={formData.discount} onChange={handleInputChange} required min="0" max="100" />
              </div>
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" name="startDate" type="date" value={formData.startDate} onChange={handleInputChange} required />
              </div>
              <div>
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Input id="endDate" name="endDate" type="date" value={formData.endDate} onChange={handleInputChange} />
              </div>
              <div>
                <Label htmlFor="conditions">Conditions (JSON)</Label>
                <Textarea
                  id="conditions"
                  name="conditions"
                  value={typeof formData.conditions === 'string' ? formData.conditions : JSON.stringify(formData.conditions, null, 2)}
                  onChange={handleInputChange}
                  placeholder="Enter conditions as JSON"
                  rows={4}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <Button type="submit">{editingCoupon ? 'Update' : 'Create'} Coupon</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Discount</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Conditions</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {coupons.map((coupon) => (
            <TableRow key={coupon.id}>
              <TableCell className="font-medium">{coupon.code}</TableCell>
              <TableCell>{coupon.description}</TableCell>
              <TableCell>
                <div className="flex items-center">
                  <Percent className="h-4 w-4 mr-1" />
                  {coupon.discount}%
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {format(new Date(coupon.startDate), 'dd/MM/yyyy')}
                </div>
              </TableCell>
              <TableCell>
                {coupon.endDate ? (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {format(new Date(coupon.endDate), 'dd/MM/yyyy')}
                  </div>
                ) : (
                  'No end date'
                )}
              </TableCell>
              <TableCell>
                {Object.keys(coupon.conditions).length > 0 ? 'Yes' : 'No'}
              </TableCell>
              <TableCell>
                <Switch
                  checked={coupon.isActive}
                  onCheckedChange={() => handleToggleActive(coupon.id, coupon.isActive)}
                />
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(coupon)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(coupon.id)}>
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

