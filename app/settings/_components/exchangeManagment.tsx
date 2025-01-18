import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { useMainStore } from '@/stores/mainStore';
import { Currency } from '@/types/currency';
import { RefreshCw } from 'lucide-react';
import React from 'react'

interface ExchangeManagmentProps {
  defaultCurrency: Currency
}

function ExchangeManagment( {defaultCurrency} : ExchangeManagmentProps) {

  const { 
      currencies, 
      updateExchangeRate,
      createExchangeRate,
      fetchExchangeRates,
      exchangeRates,
 
      error: storeError 
    } = useMainStore()

    const handleExchangeRateChange = async (fromCurrencyId: string, toCurrencyId: string, rate: number) => {
      try {
        const existingRate = exchangeRates.find(
          er => er.fromCurrencyId === fromCurrencyId && er.toCurrencyId === toCurrencyId
        )

        console.log("GAAAAAAAA")
        console.log(existingRate)

  
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
  )
}

export default ExchangeManagment