"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, Pencil, Plus, Trash2, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox" // Import Checkbox
// import { Checkbox } from "@/components/ui/checkbox"
import type { ShippingMethod, CreateShippingMethodDto, UpdateShippingMethodDto } from "@/types/shippingMethod"
import { useMainStore } from "@/stores/mainStore"
import { useToast } from "@/hooks/use-toast"
import { HeaderBar } from "@/components/HeaderBar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { formatPrice } from "@/lib/utils"

const ShippingMethodSkeleton = () => (
  <TableRow>
    <TableCell className="w-[20%] py-2 px-2">
      <Skeleton className="h-4 w-full max-w-[200px]" />
    </TableCell>
    <TableCell className="w-[15%] py-2 px-2">
      <Skeleton className="h-4 w-12" />
    </TableCell>
    {/* Añadir skeletons para cada moneda */}
    <TableCell className="w-[15%] py-2 px-2">
      <Skeleton className="h-4 w-12" />
    </TableCell>
    <TableCell className="w-[15%] py-2 px-2">
      <Skeleton className="h-4 w-12" />
    </TableCell>
    <TableCell className="w-[20%] py-2 px-2">
      <Skeleton className="h-4 w-full" />
    </TableCell>
    <TableCell className="w-[10%] py-2 px-2">
      <Skeleton className="h-4 w-12" />
    </TableCell>
    <TableCell className="w-[5%] py-2 px-2">
      <Skeleton className="h-8 w-8" />
    </TableCell>
  </TableRow>
)

export default function ShippingMethodsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingShippingMethod, setEditingShippingMethod] = useState<ShippingMethod | null>(null)
  const [newShippingMethod, setNewShippingMethod] = useState<CreateShippingMethodDto>({
    name: "",
    description: "",
    prices: [],
    estimatedDeliveryTime: "",
    isActive: true,
  })
  // const [selectedShippingMethods, setSelectedShippingMethods] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const {
    shippingMethods,
    currencies,
    fetchShippingMethods,
    fetchCurrencies,
    createShippingMethod,
    updateShippingMethod,
    deleteShippingMethod,
  } = useMainStore()
  const [currentPage, setCurrentPage] = useState(1)
  const shippingMethodsPerPage = 10

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        await Promise.all([fetchShippingMethods(), fetchCurrencies()])

        setNewShippingMethod((prev) => ({
          ...prev,
          prices: currencies.map((currency) => ({
            currencyId: currency.id,
            price: 0,
          })),
        }))
      } catch (error) {
        console.error("Error al obtener datos:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los datos. Por favor, inténtelo de nuevo.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [fetchShippingMethods, fetchCurrencies, currencies, toast])

  const handleCreateShippingMethod = async () => {
    try {
      await createShippingMethod(newShippingMethod)
      setIsCreateModalOpen(false)
      setNewShippingMethod({
        name: "",
        description: "",
        prices: currencies.map((currency) => ({ currencyId: currency.id, price: 0 })),
        estimatedDeliveryTime: "",
        isActive: true,
      })
      await fetchShippingMethods()

      toast({
        title: "Éxito",
        description: "Método de envío creado correctamente",
      })
    } catch (err) {
      console.log(err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear el método de envío. Por favor, inténtelo de nuevo.",
      })
    }
  }

  const handleUpdateShippingMethod = async () => {
    if (!editingShippingMethod) return
    try {
      const updatedShippingMethod: UpdateShippingMethodDto = {
        name: newShippingMethod.name,
        description: newShippingMethod.description,
        prices: newShippingMethod.prices,
        estimatedDeliveryTime: newShippingMethod.estimatedDeliveryTime,
        isActive: newShippingMethod.isActive,
      }
      await updateShippingMethod(editingShippingMethod.id, updatedShippingMethod)
      setIsEditModalOpen(false)
      setEditingShippingMethod(null)
      setNewShippingMethod({
        name: "",
        description: "",
        prices: currencies.map((currency) => ({ currencyId: currency.id, price: 0 })),
        estimatedDeliveryTime: "",
        isActive: true,
      })
      await fetchShippingMethods()
      toast({
        title: "Éxito",
        description: "Método de envío actualizado correctamente",
      })
    } catch (err) {
      console.log(err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el método de envío. Por favor, inténtelo de nuevo.",
      })
    }
  }

  const handleDeleteShippingMethod = async (id: string) => {
    try {
      await deleteShippingMethod(id)
      await fetchShippingMethods()
      toast({
        title: "Éxito",
        description: "Método de envío eliminado correctamente",
      })
    } catch (err) {
      console.error(err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el método de envío. Por favor, inténtelo de nuevo.",
      })
    }
  }

  // const handleDeleteSelectedShippingMethods = async () => {
  //   try {
  //     await Promise.all(selectedShippingMethods.map((id) => handleDeleteShippingMethod(id)))
  //     setSelectedShippingMethods([])
  //     toast({
  //       title: "Éxito",
  //       description: "Métodos de envío seleccionados eliminados correctamente",
  //     })
  //   } catch (err) {
  //     console.error(err)
  //     toast({
  //       variant: "destructive",
  //       title: "Error",
  //       description: "No se pudieron eliminar algunos métodos de envío. Por favor, inténtelo de nuevo.",
  //     })
  //   }
  // }

  const filteredShippingMethods = useMemo(() => {
    const searchLower = searchQuery.toLowerCase()
    return shippingMethods.filter(
      (method) =>
        method.name.toLowerCase().includes(searchLower) || method.description?.toLowerCase().includes(searchLower),
    )
  }, [shippingMethods, searchQuery])

  const indexOfLastShippingMethod = currentPage * shippingMethodsPerPage
  const indexOfFirstShippingMethod = indexOfLastShippingMethod - shippingMethodsPerPage
  const currentShippingMethods = filteredShippingMethods.slice(indexOfFirstShippingMethod, indexOfLastShippingMethod)

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  const handlePriceChange = (currencyId: string, value: number) => {
    setNewShippingMethod((prev) => ({
      ...prev,
      prices: prev.prices.map((price) => (price.currencyId === currencyId ? { ...price, price: value } : price)),
    }))
  }

  return (
    <>
      <HeaderBar title="Métodos de Envío" />
      <div className="container-section">
        <div className="content-section box-container">
          <div className="box-section justify-between">
            <h3>Métodos de Envío</h3>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="create-button">
                  <Plus className="h-4 w-4 mr-2" /> Crear
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Método de Envío</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="newShippingMethodName">Nombre</Label>
                    <Input
                      id="newShippingMethodName"
                      value={newShippingMethod.name}
                      onChange={(e) => setNewShippingMethod((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="newShippingMethodDescription">Descripción</Label>
                    <Textarea
                      id="newShippingMethodDescription"
                      value={newShippingMethod.description}
                      onChange={(e) => setNewShippingMethod((prev) => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Precios</Label>
                    {newShippingMethod.prices.map((price) => (
                      <div key={price.currencyId} className="flex items-center space-x-2 mt-2">
                        <Label>{currencies.find((c) => c.id === price.currencyId)?.code}</Label>
                        <Input
                          type="number"
                          value={price.price}
                          onChange={(e) => handlePriceChange(price.currencyId, Number.parseFloat(e.target.value))}
                          placeholder="Precio"
                        />
                      </div>
                    ))}
                  </div>
                  <div>
                    <Label htmlFor="newShippingMethodEstimatedDeliveryTime">Tiempo Estimado de Entrega</Label>
                    <Input
                      id="newShippingMethodEstimatedDeliveryTime"
                      value={newShippingMethod.estimatedDeliveryTime}
                      onChange={(e) =>
                        setNewShippingMethod((prev) => ({ ...prev, estimatedDeliveryTime: e.target.value }))
                      }
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox // Checkbox is now used here
                      id="newShippingMethodIsActive"
                      checked={newShippingMethod.isActive}
                      onCheckedChange={(checked) =>
                        setNewShippingMethod((prev) => ({ ...prev, isActive: checked as boolean }))
                      }
                    />
                    <Label htmlFor="newShippingMethodIsActive">Activo</Label>
                  </div>
                  <Button onClick={handleCreateShippingMethod}>Crear</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="box-section space-x-2">
          <div className="relative min-w-[250px]">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
              placeholder="Buscar métodos de envío..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
              </div>
             
          </div>
          <div className="box-section p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6 w-[150px]">Nombre</TableHead>
                  {currencies.map((currency) => (
                    <TableHead key={currency.id} className="w-[100px]">
                      Precio ({currency.code})
                    </TableHead>
                  ))}
                  <TableHead className="w-[200px]">Tiempo Estimado de Entrega</TableHead>
                  <TableHead className="w-[100px]">Activo</TableHead>
                  <TableHead className="w-[50px]"> </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array(5)
                      .fill(0)
                      .map((_, index) => <ShippingMethodSkeleton key={index} />)
                  : currentShippingMethods.map((method) => (
                      <TableRow key={method.id} className="text-sm">
                        <TableCell className="py-2 pl-6">
                          <span className="texto flex-grow truncate">{method.name}</span>
                        </TableCell>
                        {currencies.map((currency) => {
                          const price = method.prices.find((p) => p.currencyId === currency.id)
                          return (
                            <TableCell key={currency.id} className="py-2 pl-6">
                              {price ? formatPrice(price.price, currency) : "-"}
                            </TableCell>
                          )
                        })}
                        <TableCell className="py-2 pl-6">{method.estimatedDeliveryTime}</TableCell>
                        <TableCell className="py-2 pl-6">{method.isActive ? "Sí" : "No"}</TableCell>
                        <TableCell className="py-2 pl-6">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="shadow-none">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingShippingMethod(method)
                                  setIsEditModalOpen(true)
                                  setNewShippingMethod({
                                    name: method.name,
                                    description: method.description || "",
                                    prices: method.prices.map((price) => ({
                                      currencyId: price.currencyId,
                                      price: price.price,
                                    })),
                                    estimatedDeliveryTime: method.estimatedDeliveryTime || "",
                                    isActive: method.isActive,
                                  })
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  if (window.confirm(`¿Está seguro de que desea eliminar ${method.name}?`)) {
                                    handleDeleteShippingMethod(method.id)
                                  }
                                }}
                                className="text-red-500"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>
          <div className="box-section border-none justify-between items-center ">
            <div className="content-font">
              Mostrando {indexOfFirstShippingMethod + 1} a{" "}
              {Math.min(indexOfLastShippingMethod, filteredShippingMethods.length)} de {filteredShippingMethods.length}{" "}
              métodos de envío
            </div>
            <div className="flex gap-2">
              <Button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} variant="outline">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => paginate(currentPage + 1)}
                disabled={indexOfLastShippingMethod >= filteredShippingMethods.length}
                variant="outline"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Método de Envío</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="editShippingMethodName">Nombre</Label>
                  <Input
                    id="editShippingMethodName"
                    value={newShippingMethod.name}
                    onChange={(e) => setNewShippingMethod((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="editShippingMethodDescription">Descripción</Label>
                  <Textarea
                    id="editShippingMethodDescription"
                    value={newShippingMethod.description}
                    onChange={(e) => setNewShippingMethod((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Precios</Label>
                  {newShippingMethod.prices.map((price) => (
                    <div key={price.currencyId} className="flex items-center space-x-2 mt-2">
                      <Label>{currencies.find((c) => c.id === price.currencyId)?.code}</Label>
                      <Input
                        type="number"
                        value={price.price}
                        onChange={(e) => handlePriceChange(price.currencyId, Number.parseFloat(e.target.value))}
                        placeholder="Precio"
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <Label htmlFor="editShippingMethodEstimatedDeliveryTime">Tiempo Estimado de Entrega</Label>
                  <Input
                    id="editShippingMethodEstimatedDeliveryTime"
                    value={newShippingMethod.estimatedDeliveryTime}
                    onChange={(e) =>
                      setNewShippingMethod((prev) => ({ ...prev, estimatedDeliveryTime: e.target.value }))
                    }
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox // Checkbox is now used here
                    id="editShippingMethodIsActive"
                    checked={newShippingMethod.isActive}
                    onCheckedChange={(checked) =>
                      setNewShippingMethod((prev) => ({ ...prev, isActive: checked as boolean }))
                    }
                  />
                  <Label htmlFor="editShippingMethodIsActive">Activo</Label>
                </div>
                <Button onClick={handleUpdateShippingMethod}>Actualizar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  )
}

