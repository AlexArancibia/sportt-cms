"use client"

import { useState, useEffect, useCallback } from "react"
import { useMainStore } from "@/stores/mainStore"
import { Loader2, Upload, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { getImageUrl } from "@/lib/imageUtils"
import apiClient from "@/lib/axiosConfig"
import type { ShopSettings, UpdateShopSettingsDto } from "@/types/shopSettings"
import type { Currency } from "@/types/currency"

export function ShopSettings() {
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()
  const {
    fetchShopSettings,
    saveShopSettings,
    fetchCurrencies,
    currencies,
    addAcceptedCurrency,
    removeAcceptedCurrency,
  } = useMainStore()

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        console.log("Fetching shop settings...")
        const fetchedSettings = await fetchShopSettings()
        console.log("Fetched shop settings:", fetchedSettings)
        setShopSettings(Array.isArray(fetchedSettings) ? fetchedSettings[0] || null : fetchedSettings)
        console.log("Fetching currencies...")
        await fetchCurrencies()
        console.log("Currencies fetched successfully")
      } catch (error) {
        console.error("Error loading data:", error)
        toast({
          title: "Error",
          description: "Failed to load shop settings",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [fetchShopSettings, fetchCurrencies, toast])

  const handleInputChange = useCallback(
    (key: keyof ShopSettings, value: string | number | boolean) => {
      if (!shopSettings) return
      setShopSettings((prev) => {
        if (!prev) return null
        return { ...prev, [key]: value }
      })
    },
    [shopSettings],
  )

  const handleSave = async () => {
    if (!shopSettings) return

    try {
      console.log("Saving shop settings:", shopSettings)
      const { id, createdAt, updatedAt, acceptedCurrencies, ...updateData } = shopSettings
      const updatedSettings = await saveShopSettings(updateData as UpdateShopSettingsDto)
      console.log("Shop settings saved successfully:", updatedSettings)
      setShopSettings(updatedSettings)
      toast({
        title: "Success",
        description: "Settings updated successfully",
      })
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      })
    }
  }

  const handleLogoUpload = useCallback(
    async (file: File) => {
      setIsUploading(true)
      const formData = new FormData()
      formData.append("file", file)
      formData.append("description", "Shop Logo")

      try {
        const response = await apiClient.post("/file/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
        handleInputChange("logo", response.data.filename)
        toast({
          title: "Success",
          description: "Logo uploaded successfully",
        })
      } catch (error) {
        console.error("Error uploading logo:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to upload logo",
        })
      } finally {
        setIsUploading(false)
      }
    },
    [toast, handleInputChange],
  )

  const handleAddAcceptedCurrency = async (currencyId: string) => {
    if (!shopSettings) return
    try {
      const updatedShop = await addAcceptedCurrency(shopSettings.id, currencyId)
      setShopSettings(updatedShop)
      toast({
        title: "Success",
        description: "Currency added successfully",
      })
    } catch (error) {
      console.error("Error adding currency:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add currency",
      })
    }
  }

  const handleRemoveAcceptedCurrency = async (currencyId: string) => {
    if (!shopSettings) return
    try {
      const updatedShop = await removeAcceptedCurrency(shopSettings.id, currencyId)
      setShopSettings(updatedShop)
      toast({
        title: "Success",
        description: "Currency removed successfully",
      })
    } catch (error) {
      console.error("Error removing currency:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove currency",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!shopSettings) {
    return <div className="text-center">No shop settings found.</div>
  }

  return (
    <div className="space-y-8 p-6">
      <h1 className="text-3xl font-bold mb-6">Shop Settings</h1>

      <Tabs defaultValue="general" className="w-full">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="currency">Currency</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="logo">Logo</Label>
                <div className="flex items-center space-x-4">
                  {shopSettings.logo && (
                    <Image
                      src={getImageUrl(shopSettings.logo) || "/placeholder.svg"}
                      alt="Shop Logo"
                      width={100}
                      height={100}
                      className="rounded-md"
                    />
                  )}
                  <div>
                    <Input
                      type="file"
                      id="logo-upload"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleLogoUpload(e.target.files[0])
                      }}
                      accept="image/*"
                      disabled={isUploading}
                    />
                    <Label
                      htmlFor="logo-upload"
                      className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                    >
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      {shopSettings.logo ? "Change Logo" : "Upload Logo"}
                    </Label>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Shop Name</Label>
                <Input
                  id="name"
                  value={shopSettings.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  value={shopSettings.domain}
                  onChange={(e) => handleInputChange("domain", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={shopSettings.email || ""}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={shopSettings.description || ""}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="currency">
          <Card>
            <CardHeader>
              <CardTitle>Currency Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="defaultCurrency">Default Currency</Label>
                <Select
                  value={shopSettings.defaultCurrencyId}
                  onValueChange={(value) => handleInputChange("defaultCurrencyId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select default currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency: Currency) => (
                      <SelectItem key={currency.id} value={currency.id}>
                        {currency.code} - {currency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Accepted Currencies</Label>
                <div className="flex flex-wrap gap-2">
                  {shopSettings.acceptedCurrencies.map((currency) => (
                    <div
                      key={currency.id}
                      className="flex items-center bg-secondary text-secondary-foreground rounded-full px-3 py-1"
                    >
                      <span>{currency.code}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2 h-auto p-0"
                        onClick={() => handleRemoveAcceptedCurrency(currency.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Select onValueChange={handleAddAcceptedCurrency}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Add currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies
                        .filter((c) => !shopSettings.acceptedCurrencies.some((ac) => ac.id === c.id))
                        .map((currency) => (
                          <SelectItem key={currency.id} value={currency.id}>
                            {currency.code} - {currency.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="taxesIncluded"
                  checked={shopSettings.taxesIncluded}
                  onCheckedChange={(checked) => handleInputChange("taxesIncluded", checked)}
                />
                <Label htmlFor="taxesIncluded">Taxes Included in Prices</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxValue">Tax Value (%)</Label>
                <Input
                  id="taxValue"
                  type="number"
                  value={shopSettings.taxValue || ""}
                  onChange={(e) => handleInputChange("taxValue", Number.parseFloat(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <Input
                  id="primaryColor"
                  type="color"
                  value={shopSettings.primaryColor || "#000000"}
                  onChange={(e) => handleInputChange("primaryColor", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryColor">Secondary Color</Label>
                <Input
                  id="secondaryColor"
                  type="color"
                  value={shopSettings.secondaryColor || "#ffffff"}
                  onChange={(e) => handleInputChange("secondaryColor", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle>Social Media Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="facebookUrl">Facebook URL</Label>
                <Input
                  id="facebookUrl"
                  value={shopSettings.facebookUrl || ""}
                  onChange={(e) => handleInputChange("facebookUrl", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagramUrl">Instagram URL</Label>
                <Input
                  id="instagramUrl"
                  value={shopSettings.instagramUrl || ""}
                  onChange={(e) => handleInputChange("instagramUrl", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twitterUrl">Twitter URL</Label>
                <Label htmlFor="twitterUrl">Twitter URL</Label>
                <Input
                  id="twitterUrl"
                  value={shopSettings.twitterUrl || ""}
                  onChange={(e) => handleInputChange("twitterUrl", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Save Settings</Button>
      </div>
    </div>
  )
}

