"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, Pencil, Trash2, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { useMainStore } from "@/stores/mainStore"
import  {
  PaymentProvider,
  PaymentTransaction,
  CreatePaymentProviderDto,
  CreatePaymentTransactionDto,
  UpdatePaymentTransactionDto,
} from "@/types/payments"
import { PaymentProviderType } from "@/types/payments"
import { formatCurrency } from "@/lib/utils"

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
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("providers")
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateProviderModalOpen, setIsCreateProviderModalOpen] = useState(false)
  const [isCreateTransactionModalOpen, setIsCreateTransactionModalOpen] = useState(false)
  const [isEditTransactionModalOpen, setIsEditTransactionModalOpen] = useState(false)
  const [selectedProviders, setSelectedProviders] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const {
    paymentProviders = [],
    paymentTransactions = [],
    currencies,
    orders,
    fetchPaymentProviders,
    fetchPaymentTransactions,
    createPaymentProvider,
    updatePaymentProvider,
    deletePaymentProvider,
    createPaymentTransaction,
    updatePaymentTransaction,
    fetchOrders,
  } = useMainStore()

  const [newProvider, setNewProvider] = useState<CreatePaymentProviderDto>({
    name: "",
    type: PaymentProviderType.STRIPE,
    description: "",
    isActive: true,
    credentials: {},
    currencyId: currencies[0]?.id || "",
  })

  const [newTransaction, setNewTransaction] = useState<CreatePaymentTransactionDto>({
    orderId: "",
    paymentProviderId: "",
    amount: 0,
    currencyId: currencies[0]?.id || "",
    status: "pending",
    transactionId: "",
    paymentMethod: "",
    errorMessage: "",
    metadata: {},
  })

  const [editingTransaction, setEditingTransaction] = useState<UpdatePaymentTransactionDto>({
    status: "",
    transactionId: "",
    paymentMethod: "",
    errorMessage: "",
    metadata: {},
  })

  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        await Promise.all([fetchPaymentProviders(), fetchPaymentTransactions(), fetchOrders()])
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
  }, [fetchPaymentProviders, fetchPaymentTransactions, fetchOrders, toast])

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

  const handleCreateTransaction = async () => {
    try {
      await createPaymentTransaction(newTransaction)
      setIsCreateTransactionModalOpen(false)
      toast({
        title: "Success",
        description: "Payment transaction created successfully",
      })
      await fetchPaymentTransactions()
    } catch (error) {
      console.error("Error creating payment transaction:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create payment transaction",
      })
    }
  }

  const handleUpdateTransaction = async () => {
    if (!editingTransactionId) return

    try {
      await updatePaymentTransaction(editingTransactionId, editingTransaction)
      setIsEditTransactionModalOpen(false)
      setEditingTransactionId(null)
      toast({
        title: "Success",
        description: "Payment transaction updated successfully",
      })
      await fetchPaymentTransactions()
    } catch (error) {
      console.error("Error updating payment transaction:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update payment transaction",
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
    <div className="container mx-auto py-10">
      <Tabs defaultValue="providers" className="space-y-6" onValueChange={(value) => setActiveTab(value)}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="providers">Payment Providers</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>
          {activeTab === "providers" && (
            <Dialog open={isCreateProviderModalOpen} onOpenChange={setIsCreateProviderModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Provider
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Payment Provider</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={newProvider.name}
                      onChange={(e) => setNewProvider((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={newProvider.type}
                      onValueChange={(value) =>
                        setNewProvider((prev) => ({ ...prev, type: value as PaymentProviderType }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
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
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newProvider.description}
                      onChange={(e) => setNewProvider((prev) => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={newProvider.currencyId}
                      onValueChange={(value) => setNewProvider((prev) => ({ ...prev, currencyId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
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
                    <Label htmlFor="isActive">Active</Label>
                  </div>
                  <Button onClick={handleCreateProvider}>Create Provider</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
          {activeTab === "transactions" && (
            <Dialog open={isCreateTransactionModalOpen} onOpenChange={setIsCreateTransactionModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Transaction
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Payment Transaction</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="orderId">Order</Label>
                    <Select
                      value={newTransaction.orderId}
                      onValueChange={(value) => setNewTransaction((prev) => ({ ...prev, orderId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select order" />
                      </SelectTrigger>
                      <SelectContent>
                        {orders.map((order) => (
                          <SelectItem key={order.id} value={order.id}>
                            {order.orderNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="paymentProviderId">Payment Provider</Label>
                    <Select
                      value={newTransaction.paymentProviderId}
                      onValueChange={(value) => setNewTransaction((prev) => ({ ...prev, paymentProviderId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentProviders.map((provider) => (
                          <SelectItem key={provider.id} value={provider.id}>
                            {provider.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction((prev) => ({ ...prev, amount: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={newTransaction.currencyId}
                      onValueChange={(value) => setNewTransaction((prev) => ({ ...prev, currencyId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
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
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={newTransaction.status}
                      onValueChange={(value) => setNewTransaction((prev) => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="transactionId">Transaction ID</Label>
                    <Input
                      id="transactionId"
                      value={newTransaction.transactionId}
                      onChange={(e) => setNewTransaction((prev) => ({ ...prev, transactionId: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Input
                      id="paymentMethod"
                      value={newTransaction.paymentMethod}
                      onChange={(e) => setNewTransaction((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                    />
                  </div>
                  <Button onClick={handleCreateTransaction}>Create Transaction</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="flex items-center space-x-2 mb-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading
                    ? Array(5)
                        .fill(0)
                        .map((_, index) => <PaymentProviderSkeleton key={index} />)
                    : currentProviders.map((provider) => (
                        <TableRow key={provider.id}>
                          <TableCell>{provider.name}</TableCell>
                          <TableCell>{provider.type}</TableCell>
                          <TableCell>{provider.description}</TableCell>
                          <TableCell>{provider.currency.code}</TableCell>
                          <TableCell>
                            <Badge variant={provider.isActive ? "success" : "secondary"}>
                              {provider.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => router.push(`/settings/payments/${provider.id}/edit`)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteProvider(provider.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading
                    ? Array(5)
                        .fill(0)
                        .map((_, index) => <PaymentProviderSkeleton key={index} />)
                    : currentTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{transaction.transactionId}</TableCell>
                          <TableCell>{formatCurrency(transaction.amount, transaction.currency.code)}</TableCell>
                          <TableCell>{transaction.paymentProvider.name}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                transaction.status === "completed"
                                  ? "success"
                                  : transaction.status === "failed"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {transaction.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(transaction.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingTransactionId(transaction.id)
                                    setEditingTransaction({
                                      status: transaction.status,
                                      transactionId: transaction.transactionId,
                                      paymentMethod: transaction.paymentMethod,
                                      errorMessage: transaction.errorMessage,
                                      metadata: transaction.metadata,
                                    })
                                    setIsEditTransactionModalOpen(true)
                                  }}
                                >
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-muted-foreground">
          Showing{" "}
          {activeTab === "providers"
            ? `${(currentPage - 1) * itemsPerPage + 1} to ${Math.min(
                currentPage * itemsPerPage,
                filteredProviders.length,
              )} of ${filteredProviders.length}`
            : `${(currentPage - 1) * itemsPerPage + 1} to ${Math.min(
                currentPage * itemsPerPage,
                filteredTransactions.length,
              )} of ${filteredTransactions.length}`}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => paginate(currentPage + 1)}
            disabled={
              currentPage ===
              Math.ceil(
                (activeTab === "providers" ? filteredProviders.length : filteredTransactions.length) / itemsPerPage,
              )
            }
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={isEditTransactionModalOpen} onOpenChange={setIsEditTransactionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Payment Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editStatus">Status</Label>
              <Select
                value={editingTransaction.status}
                onValueChange={(value) => setEditingTransaction((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="editTransactionId">Transaction ID</Label>
              <Input
                id="editTransactionId"
                value={editingTransaction.transactionId}
                onChange={(e) => setEditingTransaction((prev) => ({ ...prev, transactionId: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="editPaymentMethod">Payment Method</Label>
              <Input
                id="editPaymentMethod"
                value={editingTransaction.paymentMethod}
                onChange={(e) => setEditingTransaction((prev) => ({ ...prev, paymentMethod: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="editErrorMessage">Error Message</Label>
              <Input
                id="editErrorMessage"
                value={editingTransaction.errorMessage}
                onChange={(e) => setEditingTransaction((prev) => ({ ...prev, errorMessage: e.target.value }))}
              />
            </div>
            <Button onClick={handleUpdateTransaction}>Update Transaction</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

