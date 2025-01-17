'use client';

import { useState, useEffect } from 'react';
import { useMainStore } from '@/stores/mainStore';
import { Loader2, Edit, Save, X, Plus } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ShopSettings as ShopSettingsType, UpdateShopSettingsDto } from '@/types/shopSettings';
import { Currency } from '@/types/currency';
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export function ShopSettings() {
  const [shopSettings, setShopSettings] = useState<ShopSettingsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editMode, setEditMode] = useState({
    shopInfo: false,
    defaultCurrency: false,
    acceptedCurrencies: false,
  });
  const [isAddCurrencyDialogOpen, setIsAddCurrencyDialogOpen] = useState(false);
  const { toast } = useToast();
  const { 
    fetchShopSettings, 
    saveShopSettings, 
    fetchCurrencies, 
    addAcceptedCurrency, 
    removeAcceptedCurrency, 
    currencies,
    exchangeRates,
    deleteExchangeRate,
    fetchExchangeRates
  } = useMainStore();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const fetchedSettings = await fetchShopSettings();
        setShopSettings(fetchedSettings[0] || null);
        await fetchCurrencies();
        await fetchExchangeRates();
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load shop settings",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [fetchShopSettings, fetchCurrencies, fetchExchangeRates, toast]);

  const handleEdit = (section: keyof typeof editMode) => {
    setEditMode(prev => ({ ...prev, [section]: true }));
  };

  const handleCancel = (section: keyof typeof editMode) => {
    setEditMode(prev => ({ ...prev, [section]: false }));
  };

  const handleSave = async (section: keyof typeof editMode) => {
    if (!shopSettings) return;

    try {
      const { id, createdAt, updatedAt, acceptedCurrencies, ...updateData } = shopSettings;
      
      if (section === 'defaultCurrency') {
        const oldDefaultCurrencyId = shopSettings.defaultCurrencyId;
        const newDefaultCurrencyId = updateData.defaultCurrencyId;

        if (oldDefaultCurrencyId !== newDefaultCurrencyId) {
          // Delete existing exchange rates
          for (const rate of exchangeRates) {
            if (rate.fromCurrencyId === oldDefaultCurrencyId || rate.toCurrencyId === oldDefaultCurrencyId) {
              await deleteExchangeRate(rate.id);
            }
          }
        }
      }

      await saveShopSettings(updateData as UpdateShopSettingsDto);
      const updatedSettings = await fetchShopSettings();
      setShopSettings(updatedSettings[0] || null); 
      setEditMode(prev => ({ ...prev, [section]: false }));
      toast({
        title: "Success",
        description: "Settings updated successfully",
      });

      // Refresh exchange rates after updating
      await fetchExchangeRates();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (key: keyof ShopSettingsType, value: string | number | boolean) => {
    if (!shopSettings) return;
    setShopSettings(prev => {
      if (!prev) return null;
      if (key === 'taxesIncluded' || key === 'taxShipping') {
        return { ...prev, [key]: Boolean(value) };
      }
      if (key === 'defaultCurrencyId') {
        return { ...prev, [key]: String(value) };
      }
      return { ...prev, [key]: value };
    });
  };

  const handleAddAcceptedCurrency = async (currencyId: string) => {
    if (!shopSettings) return;

    try {
      await addAcceptedCurrency(shopSettings.id, currencyId);
      const updatedSettings = await fetchShopSettings();
      setShopSettings(updatedSettings[0] || null); 
      setIsAddCurrencyDialogOpen(false);
      toast({
        title: "Success",
        description: "Currency added successfully",
      });
    } catch (error) {
      console.error('Error adding accepted currency:', error);
      toast({
        title: "Error",
        description: "Failed to add currency",
        variant: "destructive",
      });
    }
  };

  const handleRemoveAcceptedCurrency = async (currencyId: string) => {
    if (!shopSettings) return;

    try {
      await removeAcceptedCurrency(shopSettings.id, currencyId);
      const updatedSettings = await fetchShopSettings();
      setShopSettings(updatedSettings[0] || null); 
      toast({
        title: "Success",
        description: "Currency removed successfully",
      });
    } catch (error) {
      console.error('Error removing accepted currency:', error);
      toast({
        title: "Error",
        description: "Failed to remove currency",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!shopSettings) {
    return <div className="text-center">No shop settings found.</div>;
  }

  return (
    <div className="space-y-8 p-6">
      <h1 className="text-3xl font-bold mb-6">Shop Settings</h1>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-2xl">Shop Information</CardTitle>
          {!editMode.shopInfo ? (
            <Button variant="outline" size="sm" onClick={() => handleEdit('shopInfo')}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          ) : (
            <div className="space-x-2">
              <Button variant="default" size="sm" onClick={() => handleSave('shopInfo')}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleCancel('shopInfo')}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              {(Object.keys(shopSettings) as Array<keyof ShopSettingsType>).map((key) => {
                if (typeof shopSettings[key] !== 'object' && !['id', 'createdAt', 'updatedAt', 'defaultCurrencyId', 'acceptedCurrencies'].includes(key)) {
                  return (
                    <TableRow key={key}>
                      <TableCell className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</TableCell>
                      <TableCell>
                        {editMode.shopInfo ? (
                          <Input
                            value={shopSettings[key] as string || ''}
                            onChange={(e) => handleInputChange(key, e.target.value)}
                            className="max-w-sm"
                          />
                        ) : (
                          <span className="text-gray-600">{String(shopSettings[key] || '')}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                }
                return null;
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-2xl">Default Currency</CardTitle>
          {!editMode.defaultCurrency ? (
            <Button variant="outline" size="sm" onClick={() => handleEdit('defaultCurrency')}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          ) : (
            <div className="space-x-2">
              <Button variant="default" size="sm" onClick={() => handleSave('defaultCurrency')}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleCancel('defaultCurrency')}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="max-w-sm">
            <Select
              value={shopSettings?.defaultCurrencyId || ''}
              onValueChange={(value) => handleInputChange('defaultCurrencyId', value)}
              disabled={!editMode.defaultCurrency}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select default currency">
                  {currencies.find(c => c.id === shopSettings?.defaultCurrencyId)?.name || 'Select default currency'}
                </SelectValue>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-2xl">Accepted Currencies</CardTitle>
          <Dialog open={isAddCurrencyDialogOpen} onOpenChange={setIsAddCurrencyDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Currency
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Accepted Currency</DialogTitle>
              </DialogHeader>
              <Select onValueChange={handleAddAcceptedCurrency}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a currency to add" />
                </SelectTrigger>
                <SelectContent>
                  {currencies
                    .filter(currency => !shopSettings.acceptedCurrencies.some(ac => ac.id === currency.id))
                    .map((currency) => (
                      <SelectItem key={currency.id} value={currency.id}>
                        {currency.code} - {currency.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shopSettings.acceptedCurrencies
                .sort((a, b) => a.id === shopSettings.defaultCurrencyId ? -1 : b.id === shopSettings.defaultCurrencyId ? 1 : 0)
                .map((currency) => (
                  <TableRow key={currency.id}>
                    <TableCell>{currency.code}</TableCell>
                    <TableCell>{currency.name}</TableCell>
                    <TableCell>
                      <Button
                        variant={currency.id === shopSettings.defaultCurrencyId ? "secondary" : "destructive"}
                        size="sm"
                        onClick={() => handleRemoveAcceptedCurrency(currency.id)}
                        disabled={currency.id === shopSettings.defaultCurrencyId}
                      >
                        {currency.id === shopSettings.defaultCurrencyId ? 'Default' : 'Remove'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

