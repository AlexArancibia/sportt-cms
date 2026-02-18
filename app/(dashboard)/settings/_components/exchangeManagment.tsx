import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from '@/hooks/use-toast'
import { useCurrencies } from '@/hooks/useCurrencies'
import { useExchangeRates } from '@/hooks/useExchangeRates'
import { useExchangeRateMutations } from '@/hooks/settings/useExchangeRateMutations'
import { Currency } from '@/types/currency'
import { RefreshCw, Loader2 } from 'lucide-react'

interface ExchangeManagementProps {
  storeId: string | null
  defaultCurrency: Currency
}

function ExchangeManagement({ storeId, defaultCurrency }: ExchangeManagementProps) {
  const { data: currencies = [] } = useCurrencies()
  const { data: exchangeRates = [], refetch } = useExchangeRates({ storeId })
  const { createExchangeRate, updateExchangeRate } = useExchangeRateMutations(storeId)

  const [inputValues, setInputValues] = useState<Record<string, string>>({})
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})

  const handleExchangeRateChange = async (fromCurrencyId: string, toCurrencyId: string, rate: number) => {
    setLoadingStates(prev => ({ ...prev, [toCurrencyId]: true }))
    try {
      const existingRate = exchangeRates.find(
        er => er.fromCurrencyId === fromCurrencyId && er.toCurrencyId === toCurrencyId
      )

      if (existingRate) {
        await updateExchangeRate(existingRate.id, {
          rate,
          effectiveDate: new Date().toISOString(),
        })
      } else {
        await createExchangeRate({
          fromCurrencyId,
          toCurrencyId,
          rate,
          effectiveDate: new Date().toISOString(),
        })
      }

      toast({
        title: "Success",
        description: "Exchange rate updated successfully",
      })
    } catch (error) {
      console.error('Error updating exchange rate:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update exchange rate. Please try again.",
      })
    } finally {
      setLoadingStates(prev => ({ ...prev, [toCurrencyId]: false }))
    }
  }

  const handleInputChange = (currencyId: string, value: string) => {
    setInputValues(prev => ({ ...prev, [currencyId]: value }))
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className='pl-6'>Moneda</TableHead>
          <TableHead>Tasa de Cambio ({defaultCurrency.code})</TableHead>
          <TableHead>Ultimo Cambio</TableHead>
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
            const isLoading = loadingStates[currency.id] || false
            return (
              <TableRow key={currency.id}>
                <TableCell className='pl-6'>{currency.code}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={inputValues[currency.id] || exchangeRate?.rate || ''}
                    onChange={(e) => handleInputChange(currency.id, e.target.value)}
                    step="0.0001"
                    min="0.0001"
                    disabled={isLoading}
                    aria-label={`Exchange rate for ${currency.code}`}
                  />
                </TableCell>
                <TableCell>{exchangeRate ? new Date(exchangeRate.effectiveDate).toLocaleString() : 'N/A'}</TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const value = parseFloat(inputValues[currency.id] || String(exchangeRate?.rate || 1))
                      if (!isNaN(value) && value > 0) {
                        handleExchangeRateChange(defaultCurrency.id, currency.id, value)
                      }
                    }}
                    disabled={isLoading}
                    aria-label={`Update exchange rate for ${currency.code}`}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    {isLoading ? 'Updating...' : 'Update'}
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
      </TableBody>
    </Table>
  )
}

export default ExchangeManagement

