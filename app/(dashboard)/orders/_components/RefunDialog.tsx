"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useOrderMutations } from "@/hooks/useOrderMutations"
import { formatCurrency } from "@/lib/utils"
import { getApiErrorMessage } from "@/lib/errorHelpers"
import type { Order, OrderItem } from "@/types/order"
import type { CreateRefundDto } from "@/types/order"

interface RefundDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order
  onSuccess: () => void
}

export function RefundDialog({ open, onOpenChange, order, onSuccess }: RefundDialogProps) {
  const { toast } = useToast()
  const { createRefund } = useOrderMutations(order.storeId ?? null)
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({})
  const [note, setNote] = useState("")
  const [restock, setRestock] = useState(true)

  useEffect(() => {
    if (open) {
      // Reset state when dialog opens
      setSelectedItems({})
      setNote("")
      setRestock(true)
    }
  }, [open])

  const getRefundableQty = (item: OrderItem) =>
    item.quantity - (item.refundLineItems?.reduce((sum, r) => sum + r.quantity, 0) || 0)

  const handleQuantityChange = (item: OrderItem, quantity: number) => {
    const maxQuantity = getRefundableQty(item)
    const validQuantity = Math.min(Math.max(0, quantity), maxQuantity)

    setSelectedItems((prev) => ({
      ...prev,
      [item.id]: validQuantity,
    }))
  }

  const calculateRefundAmount = () => {
    return Object.entries(selectedItems).reduce((total, [itemId, quantity]) => {
      const item = order.lineItems.find((i) => i.id === itemId)
      if (!item) return total
      return total + item.price * quantity
    }, 0)
  }

  const handleSubmit = async () => {
    const refundAmount = calculateRefundAmount()
    if (refundAmount <= 0) {
      toast({
        title: "Error",
        description: "Please select items to refund",
        variant: "destructive",
      })
      return
    }

    const refundData: CreateRefundDto = {
      orderId: order.id,
      amount: refundAmount,
      note,
      restock,
      lineItems: Object.entries(selectedItems)
        .filter(([_, quantity]) => quantity > 0)
        .map(([itemId, quantity]) => {
          const item = order.lineItems.find((i) => i.id === itemId)
          if (!item) throw new Error("Item not found")
          return {
            orderItemId: itemId,
            quantity,
            amount: item.price * quantity,
            restocked: restock,
          }
        }),
    }

    try {
      await createRefund.mutateAsync(refundData)
      toast({
        title: "Success",
        description: "Refund issued successfully",
      })
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: getApiErrorMessage(error, "Failed to issue refund. Please try again."),
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Issue Refund</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <Label>Select Items to Refund</Label>
            <div className="mt-2 space-y-4 max-h-64 overflow-y-auto">
              {order.lineItems.map((item) => {
                const maxQuantity = getRefundableQty(item)
                if (maxQuantity <= 0) return null

                return (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(item.price, order.currency.code)} × {maxQuantity} available
                      </p>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      max={maxQuantity}
                      value={selectedItems[item.id] || 0}
                      onChange={(e) => handleQuantityChange(item, Number.parseInt(e.target.value, 10))}
                      className="w-20"
                    />
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <Label htmlFor="note">Note</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note about this refund..."
              className="mt-2"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="restock" checked={restock} onCheckedChange={(checked) => setRestock(!!checked)} />
            <Label htmlFor="restock">Restock items</Label>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Refund Amount</p>
              <p className="text-lg">{formatCurrency(calculateRefundAmount(), order.currency.code)}</p>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={createRefund.isPending || calculateRefundAmount() <= 0}
            >
              {createRefund.isPending ? "Processing..." : "Issue Refund"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

