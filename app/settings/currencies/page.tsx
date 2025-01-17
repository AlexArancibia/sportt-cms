'use client'

import React from 'react';
import { useState, useEffect } from 'react'
import { useMainStore } from '@/stores/mainStore'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Plus, Pencil, Trash2, RefreshCw } from 'lucide-react'
import { Currency, CreateCurrencyDto, UpdateCurrencyDto } from '@/types/currency'
import { ExchangeRate, CreateExchangeRateDto, UpdateExchangeRateDto } from '@/types/exchangeRate'
import { CurrencyPosition } from '@/types/common'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { HeaderBar } from '@/components/HeaderBar'

export default function CurrenciesSettingsPage() {
  const { 
    currencies, 
    fetchCurrencies, 
    createCurrency, 
    updateCurrency, 
    deleteCurrency,
    exchangeRates,
    fetchExchangeRates,
    createExchangeRate,
    updateExchangeRate,
    deleteExchangeRate,
    shopSettings,
    fetchShopSettings,
    error: storeError 
  } = useMainStore()
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null)
  const [formData, setFormData] = useState<CreateCurrencyDto>({
    code: '',
    name: '',
    symbol: '',
    decimalPlaces: 2,
    symbolPosition: CurrencyPosition.BEFORE,
    isActive: true
  })
  const { toast } = useToast()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)
      try {
        await Promise.all([
          fetchCurrencies(),
          fetchExchangeRates(),
          fetchShopSettings()
        ])
      } catch (error) {
        console.error('Error fetching data:', error)
        setError("Failed to load data. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [fetchCurrencies, fetchExchangeRates, fetchShopSettings])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, isActive: checked }))
  }

  const handleSelectChange = (value: CurrencyPosition) => {
    setFormData(prev => ({ ...prev, symbolPosition: value }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (editingCurrency) {
        await updateCurrency(editingCurrency.id, formData as UpdateCurrencyDto)
        toast({
          title: "Success",
          description: "Currency updated successfully",
        })
      } else {
        await createCurrency(formData)
        toast({
          title: "Success",
          description: "Currency created successfully",
        })
      }
      setIsDialogOpen(false)
      setEditingCurrency(null)
      setFormData({
        code: '',
        name: '',
        symbol: '',
        decimalPlaces: 2,
        symbolPosition: CurrencyPosition.BEFORE,
        isActive: true
      })
      await fetchCurrencies()
    } catch (error) {
      console.error('Error saving currency:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save currency. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this currency?")) {
      setLoading(true);
      try {
        await deleteCurrency(id);
        toast({
          title: "Success",
          description: "Currency deleted successfully",
        });
        await fetchCurrencies();
      } catch (error) {
        console.error('Error deleting currency:', error);
        if (error instanceof Error && error.message === "Cannot delete the default currency.") {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Cannot delete the default currency.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to delete currency. Please try again.",
          });
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = (currency: Currency) => {
    setEditingCurrency(currency)
    setFormData({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      decimalPlaces: currency.decimalPlaces,
      symbolPosition: currency.symbolPosition,
      isActive: currency.isActive
    })
    setIsDialogOpen(true)
  }

  const handleExchangeRateChange = async (fromCurrencyId: string, toCurrencyId: string, rate: number) => {
    try {
      const existingRate = exchangeRates.find(
        er => er.fromCurrencyId === fromCurrencyId && er.toCurrencyId === toCurrencyId
      )

      if (existingRate) {
        await updateExchangeRate(existingRate.id, { 
          rate, 
          effectiveDate: new Date().toISOString() 
        })
      } else {
        await createExchangeRate({
          fromCurrencyId,
          toCurrencyId,
          rate,
          effectiveDate: new Date().toISOString()
        })
      }

      toast({
        title: "Success",
        description: "Exchange rate updated successfully",
      })

      await fetchExchangeRates()
    } catch (error) {
      console.error('Error updating exchange rate:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update exchange rate. Please try again.",
      })
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  if (error || storeError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error || storeError}</AlertDescription>
      </Alert>
    )
  }

  if (currencies.length === 0) {
    return (
      <Alert>
        <AlertTitle>No currencies found</AlertTitle>
        <AlertDescription>Please add a currency to get started.</AlertDescription>
      </Alert>
    )
  }

  const defaultCurrency = shopSettings?.[0]?.defaultCurrencyId
    ? currencies.find(c => c.id === shopSettings[0].defaultCurrencyId)
    : currencies[0] || null

  return ( 
    <>
    <HeaderBar title='Monedas' />
    <div className='container-section'>
      <div className='content-section box-container' >
        <div className='box-section justify-between items-start'>
          <h3>Monedas</h3>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingCurrency(null)
                  setFormData({
                    code: '',
                    name: '',
                    symbol: '',
                    decimalPlaces: 2,
                    symbolPosition: CurrencyPosition.BEFORE,
                    isActive: true
                  })
                }}
                className='bg-gradient-to-tr from-emerald-700 to-emerald-500 dark:text-white'>
                  <Plus className="h-4 w-4 mr-2" /> Add Currency
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingCurrency ? 'Edit' : 'Add'} Currency</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="code">Code</Label>
                    <Input id="code" name="code" value={formData.code} onChange={handleInputChange} required />
                  </div>
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                  </div>
                  <div>
                    <Label htmlFor="symbol">Symbol</Label>
                    <Input id="symbol" name="symbol" value={formData.symbol} onChange={handleInputChange} required />
                  </div>
                  <div>
                    <Label htmlFor="decimalPlaces">Decimal Places</Label>
                    <Input id="decimalPlaces" name="decimalPlaces" type="number" value={formData.decimalPlaces} onChange={handleInputChange} required />
                  </div>
                  <div>
                    <Label htmlFor="symbolPosition">Symbol Position</Label>
                    <Select onValueChange={(value) => handleSelectChange(value as CurrencyPosition)} value={formData.symbolPosition}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select symbol position" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={CurrencyPosition.BEFORE}>Before</SelectItem>
                        <SelectItem value={CurrencyPosition.AFTER}>After</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={handleSwitchChange}
                    />
                    <Label htmlFor="isActive">Active</Label>
                  </div>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Currency'
                    )}
                  </Button>
                </form>
              </DialogContent>
          </Dialog>        
        </div>
        <div className='box-section px-0 border-0'>

        <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='pl-6'>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Decimal Places</TableHead>
                <TableHead>Symbol Position</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currencies.map((currency) => (
                <TableRow key={currency.id}>
                  <TableCell className='pl-6'>{currency.code}</TableCell>
                  <TableCell>{currency.name}</TableCell>
                  <TableCell>{currency.symbol}</TableCell>
                  <TableCell>{currency.decimalPlaces}</TableCell>
                  <TableCell>{currency.symbolPosition}</TableCell>
                  <TableCell>{currency.isActive ? 'Yes' : 'No'}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(currency)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(currency.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

        </div>
      </div>
    </div>


    <div className='container-section pt-0'>
      <div className='content-section box-container' >
        <div className='box-section justify-between items-start'>
          <h3>Tasas de Cambio</h3>
 
        </div>
        <div className='box-section px-0 border-0'>
 
 
      {defaultCurrency ? (
        <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='pl-6'>Currency</TableHead>
            <TableHead>Exchange Rate (1 {defaultCurrency.code} =)</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currencies
            .filter(currency => currency.id !== defaultCurrency.id)
            .map((currency) => {
              const exchangeRate = exchangeRates.find(
                er => er.fromCurrencyId === defaultCurrency.id && er.toCurrencyId === currency.id
              )
              return (
                <TableRow key={currency.id}>
                  <TableCell className='pl-6'>{currency.code}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={exchangeRate?.rate || ''}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value) && value > 0) {
                          handleExchangeRateChange(defaultCurrency.id, currency.id, value);
                        }
                      }}
                      step="0.0001"
                      min="0.0001"
                    />
                  </TableCell>
                  <TableCell>{exchangeRate ? new Date(exchangeRate.effectiveDate).toLocaleString() : 'N/A'}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExchangeRateChange(defaultCurrency.id, currency.id, exchangeRate?.rate || 1)}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" /> Update
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
        </TableBody>
      </Table>
      ) : (
        <Alert>
          <AlertTitle>No default currency</AlertTitle>
          <AlertDescription>Please set a default currency in your shop settings.</AlertDescription>
        </Alert>
      )}

    </div>
      </div>
    </div>




    
    </>
  )
}

