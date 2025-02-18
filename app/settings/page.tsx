'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShopSettings } from './_components/ShopSettings'
import { CurrencySettings } from './_components/currencySettings'
import { HeaderBar } from '@/components/HeaderBar'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function SettingsPage() {
 

  return (
    <>
    <HeaderBar title="Configuraciones de la Tienda" />
    <ScrollArea className="h-[calc(100vh-3.7em)]">
    <ShopSettings />
   

    </ScrollArea>
 
 
 
          
    </>
  )
}

