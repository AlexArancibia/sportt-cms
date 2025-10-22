"use client"

import React, { useState, useEffect } from "react"
import { useMainStore } from "@/stores/mainStore"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { City, Country, CreateShippingMethodDto, ShippingMethod, ShippingMethodPrice, State } from "@/types/shippingMethod"
import { ShopSettings } from "@/types/store"
import { Loader2, ChevronDown, ChevronUp, Plus, Trash2, Clock, Check, CheckCheck } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { JsonViewer } from "@/components/json-viewer"
import { DAYS_OF_WEEK } from "@/lib/constants"

interface ShippingMethodPriceForm extends Omit<ShippingMethodPrice, 'id' | 'shippingMethodId' | 'createdAt' | 'updatedAt' | 'shippingMethod' | 'currency'> {
  countryCodes: string[]
  stateCodes: string[]
  cityNames: string[]
}

interface ShippingMethodFormProps {
  shopSettings: ShopSettings
  initialData?: ShippingMethod
  onSubmit: (data: CreateShippingMethodDto) => Promise<void>
  isSubmitting: boolean
}

export function ShippingMethodForm({ shopSettings, initialData, onSubmit, isSubmitting }: ShippingMethodFormProps) {
  const { 
    fetchCountries, 
    fetchStatesByCountry, 
    fetchCitiesByState,
    states,
    cities
  } = useMainStore()
  
  const [expandedPriceIndex, setExpandedPriceIndex] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState("general")
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    estimatedDeliveryTime: initialData?.estimatedDeliveryTime || "",
    minDeliveryDays: initialData?.minDeliveryDays || 1,
    maxDeliveryDays: initialData?.maxDeliveryDays || 2,
    isActive: initialData?.isActive ?? true,
    availableDays: initialData?.availableDays || ["mon", "tue", "wed", "thu", "fri"],
    cutOffTime: initialData?.cutOffTime || "15:00",
    minWeight: initialData?.minWeight || 0,
    maxWeight: initialData?.maxWeight || 5,
    prices: initialData?.prices?.map(p => ({
      currencyId: p.currencyId,
      price: p.price || 0,
      countryCodes: p.countryCodes || [],
      stateCodes: p.stateCodes || [],
      cityNames: p.cityNames || [],
      isZoneActive: p.isZoneActive ?? true,
      freeShippingThreshold: p.freeShippingThreshold || null,
      freeShippingMessage: p.freeShippingMessage || "",
      zoneName: p.zoneName || "",
      zoneDescription: p.zoneDescription || ""
    })) || (shopSettings?.defaultCurrency ? [{
      currencyId: shopSettings.defaultCurrency.id,
      price: 0,
      countryCodes: [],
      stateCodes: [],
      cityNames: [],
      isZoneActive: true,
      freeShippingThreshold: null,
      freeShippingMessage: "",
      zoneName: "",
      zoneDescription: ""
    }] : [])
  })

  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [selectedState, setSelectedState] = useState<string | null>(null)
  const [selectedCities, setSelectedCities] = useState<string[]>([])
  const [availableCountries, setAvailableCountries] = useState<Country[]>([])
  const [citiesOpen, setCitiesOpen] = useState(false)
  const { toast } = useToast()

  const acceptedCurrencies = (shopSettings?.acceptedCurrencies || []).filter((currency: any) => currency?.id)

  useEffect(() => {
    const loadCountries = async () => {
      try {
        const countries = await fetchCountries()
        setAvailableCountries(countries)
        
        // Si estamos en modo edición y hay precios con países seleccionados
        if (initialData?.prices?.length && initialData.prices[0].countryCodes?.length) {
          const firstPrice = initialData.prices[0]
          const countryCode = firstPrice.countryCodes[0]
          setSelectedCountry(countryCode)
          
          // Cargar estados para el país seleccionado
          await fetchStatesByCountry(countryCode)
          
          // Si hay estados seleccionados en el precio
          if (firstPrice.stateCodes?.length) {
            const stateCode = firstPrice.stateCodes[0]
            const state = states.find(s => s.code === stateCode)
            if (state) {
              setSelectedState(state.id)
              
              // Cargar ciudades para el estado seleccionado
              await fetchCitiesByState(state.id)
              
              // Si hay ciudades seleccionadas en el precio
              if (firstPrice.cityNames?.length) {
                setSelectedCities(firstPrice.cityNames)
              }
            }
          }
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los países",
        })
      }
    }
    
    loadCountries()
  }, [fetchCountries, fetchStatesByCountry, fetchCitiesByState, initialData, states, toast])

  const handleCountrySelect = async (countryCode: string) => {
    setSelectedCountry(countryCode)
    setSelectedState(null)
    setSelectedCities([])
    
    try {
      await fetchStatesByCountry(countryCode)
      // Automatically add country to all prices when selected
      const newPrices = formData.prices.map(price => ({
        ...price,
        countryCodes: [countryCode]
      }))
      setFormData({ ...formData, prices: newPrices })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los estados",
      })
    }
  }

  const handleStateSelect = async (stateId: string) => {
    setSelectedState(stateId)
    setSelectedCities([])
    
    try {
      await fetchCitiesByState(stateId)
      // Automatically add state to all prices when selected
      const selectedStateObj = states.find(s => s.id === stateId)
      if (selectedStateObj) {
        const newPrices = formData.prices.map(price => ({
          ...price,
          stateCodes: [selectedStateObj.code]
        }))
        setFormData({ ...formData, prices: newPrices })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las ciudades",
      })
    }
  }

  const handleCityToggle = (cityName: string) => {
    const newSelectedCities = selectedCities.includes(cityName)
      ? selectedCities.filter(name => name !== cityName)
      : [...selectedCities, cityName]
    
    setSelectedCities(newSelectedCities)
    
    // Automatically add/remove cities to all prices
    const newPrices = formData.prices.map(price => ({
      ...price,
      cityNames: newSelectedCities
    }))
    setFormData({ ...formData, prices: newPrices })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const value = e.target.value ? Number(e.target.value) : 0
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePriceChange = (index: number, field: string, value: any) => {
    const newPrices = [...formData.prices]
    newPrices[index] = { 
      ...newPrices[index], 
      [field]: value === "" ? null : value 
    }
    setFormData(prev => ({
      ...prev,
      prices: newPrices,
    }))
  }

  const handleCurrencyChange = (index: number, currencyId: string) => {
    handlePriceChange(index, 'currencyId', currencyId)
  }

  const addPrice = () => {
    const usedCurrencyIds = formData.prices.map((p) => p.currencyId)
    const availableCurrency = acceptedCurrencies.find((c: any) => !usedCurrencyIds.includes(c.id))

    if (availableCurrency) {
      setFormData(prev => ({
        ...prev,
        prices: [...prev.prices, { 
          currencyId: availableCurrency.id, 
          price: 0,
          countryCodes: [],
          stateCodes: [],
          cityNames: [],
          isZoneActive: true,
          freeShippingThreshold: null,
          freeShippingMessage: "",
          zoneName: "",
          zoneDescription: ""
        }],
      }))
      setExpandedPriceIndex(formData.prices.length)
    } else {
      toast({
        variant: "destructive",
        title: "No hay monedas disponibles",
        description: "Ya has configurado precios para todas las monedas aceptadas",
      })
    }
  }

  const removePrice = (index: number) => {
    if (formData.prices.length > 1) {
      const newPrices = [...formData.prices]
      newPrices.splice(index, 1)
      setFormData(prev => ({
        ...prev,
        prices: newPrices,
      }))
      if (expandedPriceIndex === index) {
        setExpandedPriceIndex(null)
      } else if (expandedPriceIndex && expandedPriceIndex > index) {
        setExpandedPriceIndex(expandedPriceIndex - 1)
      }
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debe haber al menos un precio configurado",
      })
    }
  }

  const toggleExpandPrice = (index: number) => {
    setExpandedPriceIndex(expandedPriceIndex === index ? null : index)
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      isActive: checked,
    }))
  }

  const toggleAvailableDay = (day: string) => {
    setFormData(prev => {
      const newDays = prev.availableDays.includes(day)
        ? prev.availableDays.filter(d => d !== day)
        : [...prev.availableDays, day]
      return {
        ...prev,
        availableDays: newDays
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.prices.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debe añadir al menos un precio",
      })
      return
    }

    // Validación básica de precios
    const invalidPrices = formData.prices.filter(p => !p.currencyId || p.price < 0)
    if (invalidPrices.length > 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Todos los precios deben tener una moneda válida y un precio mayor o igual a 0",
      })
      return
    }

    const methodData: CreateShippingMethodDto = {
      storeId: shopSettings.storeId,
      name: formData.name,
      description: formData.description || undefined,
      estimatedDeliveryTime: formData.estimatedDeliveryTime || undefined,
      minDeliveryDays: formData.minDeliveryDays,
      maxDeliveryDays: formData.maxDeliveryDays,
      isActive: formData.isActive,
      availableDays: formData.availableDays,
      cutOffTime: formData.cutOffTime,
      minWeight: formData.minWeight,
      maxWeight: formData.maxWeight,
      prices: formData.prices.map(p => ({
        currencyId: p.currencyId,
        price: p.price,
        zoneName: p.zoneName || undefined,
        zoneDescription: p.zoneDescription || undefined,
        countryCodes: p.countryCodes,
        stateCodes: p.stateCodes,
        cityNames: p.cityNames,
        isZoneActive: p.isZoneActive,
        freeShippingThreshold: p.freeShippingThreshold || undefined,
        freeShippingMessage: p.freeShippingMessage || undefined,
      }))
    }

    await onSubmit(methodData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          {initialData ? "Editar método de envío" : "Nuevo método de envío"}
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label>Estado</Label>
            <Switch 
              checked={formData.isActive} 
              onCheckedChange={handleSwitchChange} 
            />
            <span className="text-sm">
              {formData.isActive ? "Activo" : "Inactivo"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <JsonViewer 
              jsonData={{ formData }} 
              jsonLabel="payload"
              triggerClassName="h-10 w-10"
            />
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Guardando...
                </>
              ) : initialData ? (
                "Actualizar método"
              ) : (
                "Crear método"
              )}
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="prices">Precios y Zonas</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 pt-4">
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nombre *</Label>
              <Input
                name="name"
                placeholder="Ej: Envío Express"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Descripción</Label>
              <Textarea
                name="description"
                placeholder="Ej: Entrega rápida en 24-48 horas"
                value={formData.description}
                onChange={handleInputChange}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Días mínimos *</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="1"
                  value={formData.minDeliveryDays}
                  onChange={(e) => handleNumberInputChange(e, "minDeliveryDays")}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Días máximos *</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="2"
                  value={formData.maxDeliveryDays}
                  onChange={(e) => handleNumberInputChange(e, "maxDeliveryDays")}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Tiempo estimado
              </Label>
              <Input
                name="estimatedDeliveryTime"
                placeholder="Ej: 1-2 días hábiles"
                value={formData.estimatedDeliveryTime}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Peso mínimo (kg) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0"
                  value={formData.minWeight}
                  onChange={(e) => handleNumberInputChange(e, "minWeight")}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Peso máximo (kg) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="5"
                  value={formData.maxWeight}
                  onChange={(e) => handleNumberInputChange(e, "maxWeight")}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Hora límite *</Label>
              <Input
                name="cutOffTime"
                type="time"
                value={formData.cutOffTime}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Días disponibles *</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map(day => (
                  <Button
                    key={day.value}
                    type="button"
                    variant={formData.availableDays.includes(day.value) ? "default" : "outline"}
                    size="sm"
                    className="gap-2"
                    onClick={() => toggleAvailableDay(day.value)}
                  >
                    {formData.availableDays.includes(day.value) ? (
                      <CheckCheck className="h-4 w-4" />
                    ) : (
                      <Check className="h-4 w-4 opacity-50" />
                    )}
                    {day.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="prices" className="space-y-4 pt-4">
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPrice}
              disabled={formData.prices.length >= acceptedCurrencies.length}
              className="gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              Añadir precio
            </Button>
          </div>

          {formData.prices.map((price, index) => (
            <div key={index} className="border rounded-md p-3 space-y-3">
              <div className="grid grid-cols-12 gap-3 items-center">
                <div className="col-span-7 space-y-1">
                  <Label>Moneda *</Label>
                  <Select
                    value={price.currencyId}
                    onValueChange={(value) => handleCurrencyChange(index, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona moneda" />
                    </SelectTrigger>
                    <SelectContent>
                      {acceptedCurrencies.map((currency: any) => (
                        <SelectItem
                          key={currency.id}
                          value={currency.id}
                          disabled={formData.prices.some((p, i) => i !== index && p.currencyId === currency.id)}
                        >
                          {currency.name} ({currency.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-4 space-y-1">
                  <Label>Precio *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={price.price}
                    onChange={(e) => handlePriceChange(index, 'price', Number(e.target.value) || 0)}
                    required
                  />
                </div>
                <div className="col-span-1 flex justify-center pt-6">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removePrice(index)}
                    disabled={formData.prices.length <= 1}
                    className="h-8 w-8 p-0 text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-sm w-full justify-start pl-0"
                onClick={() => toggleExpandPrice(index)}
              >
                {expandedPriceIndex === index ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Ocultar configuración avanzada
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Mostrar configuración avanzada
                  </>
                )}
              </Button>

              {expandedPriceIndex === index && (
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Nombre zona</Label>
                      <Input
                        placeholder="Ej: Lima Metropolitana"
                        value={price.zoneName}
                        onChange={(e) => handlePriceChange(index, 'zoneName', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Descripción zona</Label>
                      <Input
                        placeholder="Ej: Área metropolitana de Lima"
                        value={price.zoneDescription}
                        onChange={(e) => handlePriceChange(index, 'zoneDescription', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label>País</Label>
                      <Select
                        value={selectedCountry || ""}
                        onValueChange={handleCountrySelect}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un país" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCountries
                            .filter((country) => country.code === 'PE')
                            .map((country) => (
                            <SelectItem 
                              key={country.code} 
                              value={country.code}
                            >
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label>Estado/Región</Label>
                      <Select
                        value={selectedState || ""}
                        onValueChange={handleStateSelect}
                        disabled={!selectedCountry}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un estado" />
                        </SelectTrigger>
                        <SelectContent>
                          {states
                            .filter(state => state.countryCode === selectedCountry)
                            .map((state) => (
                              <SelectItem 
                                key={state.id} 
                                value={state.id}
                              >
                                {state.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label>Ciudades</Label>
                      <Popover open={citiesOpen} onOpenChange={setCitiesOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={citiesOpen}
                            className="w-full justify-between"
                            disabled={!selectedState}
                          >
                            {selectedCities.length > 0 
                              ? `${selectedCities.length} ciudades seleccionadas`
                              : "Seleccionar ciudades..."}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                          <Command>
                            <CommandInput placeholder="Buscar ciudades..." />
                            <CommandList>
                              <CommandEmpty>No se encontraron ciudades</CommandEmpty>
                              <CommandGroup>
                                {cities
                                  .filter(city => city.stateId === selectedState)
                                  .map((city) => (
                                    <CommandItem 
                                      key={city.id} 
                                      onSelect={() => handleCityToggle(city.name)}
                                    >
                                      <div className="flex items-center space-x-2">
                                        <Checkbox
                                          id={`city-${city.id}-${index}`}
                                          checked={selectedCities.includes(city.name)}
                                          onCheckedChange={() => handleCityToggle(city.name)}
                                        />
                                        <Label htmlFor={`city-${city.id}-${index}`} className="cursor-pointer">
                                          {city.name}
                                        </Label>
                                      </div>
                                    </CommandItem>
                                  ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label>Umbral envío gratis</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="100"
                      value={price.freeShippingThreshold || ''}
                      onChange={(e) => handlePriceChange(index, 'freeShippingThreshold', Number(e.target.value) || null)}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Mensaje envío gratis</Label>
                    <Input
                      placeholder="Ej: Envío gratis en compras mayores a $100"
                      value={price.freeShippingMessage}
                      onChange={(e) => handlePriceChange(index, 'freeShippingMessage', e.target.value)}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <Label>Zona activa</Label>
                    <Switch
                      checked={price.isZoneActive}
                      onCheckedChange={(checked) => handlePriceChange(index, 'isZoneActive', checked)}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </form>
  )
}