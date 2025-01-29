"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useMainStore } from "@/stores/mainStore"
import type { UpdatePaymentProviderDto } from "@/types/payments"
import { PaymentProviderType } from "@/types/payments"

export default function EditPaymentProviderPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const { paymentProviders, currencies, fetchPaymentProviders, updatePaymentProvider } = useMainStore()

  const [isLoading, setIsLoading] = useState(true)
  const [provider, setProvider] = useState<UpdatePaymentProviderDto>({
    name: "",
    type: PaymentProviderType.STRIPE,
    description: "",
    isActive: true,
    credentials: {},
    currencyId: "",
  })

  useEffect(() => {
    const loadProvider = async () => {
      setIsLoading(true)
      try {
        const providers = await fetchPaymentProviders()
        const currentProvider = providers.find((p) => p.id === resolvedParams.id)
        if (currentProvider) {
          setProvider({
            name: currentProvider.name,
            type: currentProvider.type,
            description: currentProvider.description,
            isActive: currentProvider.isActive,
            credentials: currentProvider.credentials,
            currencyId: currentProvider.currencyId,
          })
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Payment provider not found",
          })
          router.push("/settings/payments")
        }
      } catch (error) {
        console.error("Error loading payment provider:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load payment provider",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadProvider()
  }, [fetchPaymentProviders, resolvedParams.id, router, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updatePaymentProvider(resolvedParams.id, provider)
      toast({
        title: "Success",
        description: "Payment provider updated successfully",
      })
      router.push("/settings/payments")
    } catch (error) {
      console.error("Error updating payment provider:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update payment provider",
      })
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Edit Payment Provider</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={provider.name}
                onChange={(e) => setProvider((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Select
                value={provider.type}
                onValueChange={(value) => setProvider((prev) => ({ ...prev, type: value as PaymentProviderType }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(PaymentProviderType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={provider.description}
                onChange={(e) => setProvider((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={provider.currencyId}
                onValueChange={(value) => setProvider((prev) => ({ ...prev, currencyId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.id} value={currency.id}>
                      {currency.code} - {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={provider.isActive}
                onCheckedChange={(checked) => setProvider((prev) => ({ ...prev, isActive: checked as boolean }))}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
            <div className="flex justify-end space-x-4">
              <Button variant="outline" type="button" onClick={() => router.push("/settings/payments")}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

