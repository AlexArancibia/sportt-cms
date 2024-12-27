'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShippingSettings } from './_components/ShippingSettings'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("shipping")

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
          {/* Add more tabs here as needed */}
        </TabsList>
        <TabsContent value="shipping">
          <ShippingSettings />
        </TabsContent>
        {/* Add more tab contents here as needed */}
      </Tabs>
    </div>
  )
}

