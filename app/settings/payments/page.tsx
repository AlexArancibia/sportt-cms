"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Pencil, Trash2, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { useMainStore } from "@/stores/mainStore"
import type { CreatePaymentProviderDto, UpdatePaymentProviderDto } from "@/types/payments"
import { PaymentProviderType,   } from "@/types/payments"
import { formatCurrency } from "@/lib/utils"
import { HeaderBar } from "@/components/HeaderBar"
import { DynamicCredentialsForm } from "./_components/DynamicCredentialsForm"
import { PaymentStatus } from "@/types/common"
 

const PaymentProviderSkeleton = () => (
  <TableRow>
    <TableCell className="w-[20%]">
      <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
    </TableCell>
    <TableCell className="w-[15%]">
      <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
    </TableCell>
    <TableCell className="w-[30%]">
      <div className="h-4 w-full bg-muted rounded animate-pulse" />
    </TableCell>
    <TableCell className="w-[15%]">
      <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
    </TableCell>
    <TableCell className="w-[10%]">
      <div className="h-4 w-8 bg-muted rounded animate-pulse" />
    </TableCell>
    <TableCell className="w-[10%]">
      <div className="h-8 w-8 bg-muted rounded" />
    </TableCell>
  </TableRow>
)

export default function PaymentsPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("providers")
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateProviderModalOpen, setIsCreateProviderModalOpen] = useState(false)
  const [isEditProviderModalOpen, setIsEditProviderModalOpen] = useState(false)
  const [selectedProviders, setSelectedProviders] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const {
    paymentProviders = [],
    paymentTransactions = [],
    currencies,
    fetchPaymentProviders,
    fetchPaymentTransactions,
    createPaymentProvider,
    updatePaymentProvider,
    deletePaymentProvider,
  } = useMainStore()

  const [newProvider, setNewProvider] = useState<CreatePaymentProviderDto>({
    name: "",
    type: PaymentProviderType.STRIPE,
    description: "",
    isActive: true,
    credentials: {} as Record<string, string>,
    currencyId: currencies[0]?.id || "",
  })

  const [editingProvider, setEditingProvider] = useState<UpdatePaymentProviderDto | null>(null)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        await Promise.all([fetchPaymentProviders(), fetchPaymentTransactions()])
      } catch (error) {
        console.error("Error loading payment data:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load payment data",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [fetchPaymentProviders, fetchPaymentTransactions, toast])

  const handleCreateProvider = async () => {
    try {
      await createPaymentProvider(newProvider)
      setIsCreateProviderModalOpen(false)
      toast({
        title: "Success",
        description: "Payment provider created successfully",
      })
      await fetchPaymentProviders()
    } catch (error) {
      console.error("Error creating payment provider:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create payment provider",
      })
    }
  }

  const handleUpdateProvider = async () => {
    if (!editingProvider) return
    console.log("UPDATEEE",editingProvider)
    const { id, ...providerWithoutId } = editingProvider
    try {
      await updatePaymentProvider(id!, providerWithoutId)
      setIsEditProviderModalOpen(false)
      toast({
        title: "Success",
        description: "Payment provider updated successfully",
      })
      await fetchPaymentProviders()
    } catch (error) {
      console.error("Error updating payment provider:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update payment provider",
      })
    }
  }

  const handleDeleteProvider = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this payment provider?")) return

    try {
      await deletePaymentProvider(id)
      toast({
        title: "Success",
        description: "Payment provider deleted successfully",
      })
      await fetchPaymentProviders()
    } catch (error) {
      console.error("Error deleting payment provider:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete payment provider",
      })
    }
  }

  const filteredProviders = paymentProviders.filter(
    (provider) =>
      provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredTransactions = paymentTransactions.filter(
    (transaction) =>
      transaction.transactionId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.status.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const currentProviders = filteredProviders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const currentTransactions = filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  return (
    <>
      <HeaderBar title={activeTab === "providers" ? "Proveedores de Pago" : "Transacciones"} />
      <div className="container-section">
        <div className="content-section box-container">
          <div className="box-section justify-between items-center">
            <div className="flex space-x-2">
              <Button
                variant={activeTab === "providers" ? "default" : "outline"}
                onClick={() => setActiveTab("providers")}
              >
                Proveedores de Pago
              </Button>
              <Button
                variant={activeTab === "transactions" ? "default" : "outline"}
                onClick={() => setActiveTab("transactions")}
              >
                Transacciones
              </Button>
            </div>
            {activeTab === "providers" && (
              <Dialog open={isCreateProviderModalOpen} onOpenChange={setIsCreateProviderModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-tr from-emerald-700 to-emerald-500 dark:text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir Proveedor
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Añadir Proveedor de Pago</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nombre</Label>
                      <Input
                        id="name"
                        value={newProvider.name}
                        onChange={(e) => setNewProvider((prev) => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">Tipo</Label>
                      <Select
                        value={newProvider.type}
                        onValueChange={(value) =>
                          setNewProvider((prev) => ({ ...prev, type: value as PaymentProviderType, credentials: {} }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(PaymentProviderType).map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="credentials">Credenciales</Label>
                      <DynamicCredentialsForm
                        credentials={newProvider.credentials}
                        onChange={(newCredentials) =>
                          setNewProvider((prev) => ({ ...prev, credentials: newCredentials }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Descripción</Label>
                      <Textarea
                        id="description"
                        value={newProvider.description}
                        onChange={(e) => setNewProvider((prev) => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="currency">Moneda</Label>
                      <Select
                        value={newProvider.currencyId}
                        onValueChange={(value) => setNewProvider((prev) => ({ ...prev, currencyId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar moneda" />
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
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isActive"
                        checked={newProvider.isActive}
                        onCheckedChange={(checked) =>
                          setNewProvider((prev) => ({ ...prev, isActive: checked as boolean }))
                        }
                      />
                      <Label htmlFor="isActive">Activo</Label>
                    </div>
                    <Button onClick={handleCreateProvider}>Crear Proveedor</Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="box-section space-x-2">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder={`Buscar ${activeTab === "providers" ? "proveedores" : "transacciones"}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm bg-accent/40 focus:bg-white"
            />
          </div>

          <div className="box-section p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  {activeTab === "providers" ? (
                    <>
                      <TableHead className="pl-6 w-[250px]">Nombre</TableHead>
                      <TableHead className="w-[150px]">Tipo</TableHead>
                      <TableHead className="w-[200px]">Descripción</TableHead>
                      <TableHead className="w-[100px]">Moneda</TableHead>
                      <TableHead className="w-[100px]">Estado</TableHead>
                      <TableHead className="w-[100px]">Acciones</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead className="pl-6 w-[200px]">ID de Transacción</TableHead>
                      <TableHead className="w-[150px]">Monto</TableHead>
                      <TableHead className="w-[200px]">Proveedor</TableHead>
                      <TableHead className="w-[100px]">Estado</TableHead>
                      <TableHead className="w-[150px]">Fecha</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array(5)
                      .fill(0)
                      .map((_, index) => <PaymentProviderSkeleton key={index} />)
                  : activeTab === "providers"
                    ? currentProviders.map((provider) => (
                        <TableRow key={provider.id} className="text-sm">
                          <TableCell className="py-2 pl-6">
                            <div className="flex items-center">
                              <Checkbox
                                checked={selectedProviders.includes(provider.id)}
                                onCheckedChange={(checked) => {
                                  if (typeof checked === "boolean") {
                                    setSelectedProviders((prev) =>
                                      checked ? [...prev, provider.id] : prev.filter((id) => id !== provider.id),
                                    )
                                  }
                                }}
                                className="mr-2 shadow-none"
                              />
                              <span className="texto flex-grow truncate">{provider.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="texto py-2">{provider.type}</TableCell>
                          <TableCell className="texto py-2">{provider.description}</TableCell>
                          <TableCell className="texto py-2">{provider.currency.code}</TableCell>
                          <TableCell className="texto py-2">
                            <Badge variant={provider.isActive ? "success" : "secondary"}>
                              {provider.isActive ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="texto py-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="shadow-none">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingProvider({
                                      id: provider.id,
                                      name: provider.name,
                                      type: provider.type,
                                      description: provider.description || "",
                                      isActive: provider.isActive,
                                      credentials: provider.credentials,
                                      currencyId: provider.currency.id,
                                    })
                                    setIsEditProviderModalOpen(true)
                                  }}
                                >
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteProvider(provider.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    : currentTransactions.map((transaction) => (
                        <TableRow key={transaction.id} className="text-sm">
                          <TableCell className="py-2 pl-6">{transaction.transactionId}</TableCell>
                          <TableCell className="texto py-2">
                            {formatCurrency(transaction.amount, transaction.currency.code)}
                          </TableCell>
                          <TableCell className="texto py-2">{transaction.paymentProvider.name}</TableCell>
                          <TableCell className="texto py-2">
                            <Badge
                              variant={
                                transaction.status === PaymentStatus.COMPLETED
                                  ? "success"
                                  : transaction.status === PaymentStatus.FAILED
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {transaction.status === PaymentStatus.COMPLETED
                                ? "Completado"
                                : transaction.status === PaymentStatus.FAILED
                                  ? "Fallido"
                                  : "Pendiente"}
                            </Badge>
                          </TableCell>
                          <TableCell className="texto py-2">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
              </TableBody>
            </Table>
          </div>

          <div className="box-section border-none justify-between items-center">
            <div className="content-font">
              Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
              {Math.min(
                currentPage * itemsPerPage,
                activeTab === "providers" ? filteredProviders.length : filteredTransactions.length,
              )}{" "}
              de {activeTab === "providers" ? filteredProviders.length : filteredTransactions.length}{" "}
              {activeTab === "providers" ? "proveedores" : "transacciones"}
            </div>
            <div className="flex gap-2">
              <Button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} variant="outline">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => paginate(currentPage + 1)}
                disabled={
                  currentPage ===
                  Math.ceil(
                    (activeTab === "providers" ? filteredProviders.length : filteredTransactions.length) / itemsPerPage,
                  )
                }
                variant="outline"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isEditProviderModalOpen} onOpenChange={setIsEditProviderModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Proveedor de Pago</DialogTitle>
          </DialogHeader>
          {editingProvider && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="editName">Nombre</Label>
                <Input
                  id="editName"
                  value={editingProvider.name}
                  onChange={(e) => setEditingProvider((prev) => ({ ...prev!, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="editType">Tipo</Label>
                <Select
                  value={editingProvider.type}
                  onValueChange={(value) =>
                    setEditingProvider((prev) => ({ ...prev!, type: value as PaymentProviderType }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(PaymentProviderType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editCredentials">Credenciales</Label>
                <DynamicCredentialsForm
                  credentials={editingProvider.credentials}
                  onChange={(newCredentials) =>
                    setEditingProvider((prev) => ({ ...prev!, credentials: newCredentials }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="editDescription">Descripción</Label>
                <Textarea
                  id="editDescription"
                  value={editingProvider.description}
                  onChange={(e) => setEditingProvider((prev) => ({ ...prev!, description: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="editCurrency">Moneda</Label>
                <Select
                  value={editingProvider.currencyId}
                  onValueChange={(value) => setEditingProvider((prev) => ({ ...prev!, currencyId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar moneda" />
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
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="editIsActive"
                  checked={editingProvider.isActive}
                  onCheckedChange={(checked) =>
                    setEditingProvider((prev) => ({ ...prev!, isActive: checked as boolean }))
                  }
                />
                <Label htmlFor="editIsActive">Activo</Label>
              </div>
              <Button onClick={handleUpdateProvider}>Actualizar Proveedor</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

