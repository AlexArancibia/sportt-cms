'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShopSettings } from './_components/ShopSettings'
import { CurrencySettings } from './_components/currencySettings'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("shop")

  return (
    <div className="p-10 mx-auto">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="shop">Shop</TabsTrigger>
          <TabsTrigger value="currencies">Currencies</TabsTrigger>
        </TabsList>
        <TabsContent value="shop">
          <ShopSettings />
        </TabsContent>
        <TabsContent value="currencies">
          <CurrencySettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}

