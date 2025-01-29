"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Search, Pencil, Plus, Trash2, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { User, CreateUserDto, UpdateUserDto } from "@/types/user"
import { useMainStore } from "@/stores/mainStore"
import { useToast } from "@/hooks/use-toast"
import { HeaderBar } from "@/components/HeaderBar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { UserRole } from "@/types/common"
const UserSkeleton = () => (
  <TableRow>
    <TableCell className="w-[20%] py-2 px-2">
      <Skeleton className="h-4 w-full max-w-[150px]" />
    </TableCell>
    <TableCell className="w-[20%] py-2 px-2">
      <Skeleton className="h-4 w-full max-w-[150px]" />
    </TableCell>
    <TableCell className="w-[30%] py-2 px-2">
      <Skeleton className="h-4 w-full max-w-[200px]" />
    </TableCell>
    <TableCell className="w-[20%] py-2 px-2">
      <Skeleton className="h-4 w-12" />
    </TableCell>
    <TableCell className="w-[10%] py-2 px-2">
      <Skeleton className="h-8 w-8" />
    </TableCell>
  </TableRow>
)

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [newUser, setNewUser] = useState<CreateUserDto>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "ADMIN" as UserRole,
  })
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const { fetchUsers, createUser, updateUser, deleteUser } = useMainStore()
  const [currentPage, setCurrentPage] = useState(1)
  const usersPerPage = 10

  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true)
      try {
        const fetchedUsers = await fetchUsers()
        setUsers(fetchedUsers)
      } catch (error) {
        console.error("Error fetching users:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch users. Please try again.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadUsers()
  }, [fetchUsers, toast])

  const handleCreateUser = async () => {
    try {
      await createUser(newUser)
      setIsCreateModalOpen(false)
      setNewUser({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        role: "ADMIN" as UserRole,
      })
      const updatedUsers = await fetchUsers()
      setUsers(updatedUsers)
      toast({
        title: "Success",
        description: "User created successfully",
      })
    } catch (err) {
      console.log(err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create user. Please try again.",
      })
    }
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return
    try {
      const updatedUser: UpdateUserDto = {
        email: newUser.email || editingUser.email,
        firstName: newUser.firstName || editingUser.firstName,
        lastName: newUser.lastName || editingUser.lastName,
        role: newUser.role || editingUser.role,
      }
      if (newUser.password) {
        updatedUser.password = newUser.password
      }
      await updateUser(editingUser.id, updatedUser)
      setIsEditModalOpen(false)
      setEditingUser(null)
      setNewUser({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        role: "USER" as UserRole,
      })
      const updatedUsers = await fetchUsers()
      setUsers(updatedUsers)
      toast({
        title: "Success",
        description: "User updated successfully",
      })
    } catch (err) {
      console.log(err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update user. Please try again.",
      })
    }
  }

  const handleDeleteUser = async (id: string) => {
    try {
      await deleteUser(id)
      const updatedUsers = await fetchUsers()
      setUsers(updatedUsers)
      toast({
        title: "Success",
        description: "User deleted successfully",
      })
    } catch (err) {
      console.error(err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete user. Please try again.",
      })
    }
  }

  const handleDeleteSelectedUsers = async () => {
    try {
      await Promise.all(selectedUsers.map((id) => handleDeleteUser(id)))
      setSelectedUsers([])
      toast({
        title: "Success",
        description: "Selected users deleted successfully",
      })
    } catch (err) {
      console.error(err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete some users. Please try again.",
      })
    }
  }

  const filteredUsers = useMemo(() => {
    const searchLower = searchQuery.toLowerCase()
    return users.filter(
      (user) =>
        user.email.toLowerCase().includes(searchLower) ||
        user.firstName.toLowerCase().includes(searchLower) ||
        user.lastName.toLowerCase().includes(searchLower),
    )
  }, [users, searchQuery])

  const indexOfLastUser = currentPage * usersPerPage
  const indexOfFirstUser = indexOfLastUser - usersPerPage
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser)

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  return (
    <>
      <HeaderBar title="Users" />
      <div className="container-section">
        <div className="content-section box-container">
          <div className="box-section justify-between">
            <h3>Users</h3>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-tr from-emerald-700 to-emerald-500 dark:text-white">
                  <Plus className="h-4 w-4 mr-2" /> Create
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="newUserEmail">Email</Label>
                    <Input
                      id="newUserEmail"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="newUserPassword">Password</Label>
                    <Input
                      id="newUserPassword"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="newUserFirstName">First Name</Label>
                    <Input
                      id="newUserFirstName"
                      value={newUser.firstName}
                      onChange={(e) => setNewUser((prev) => ({ ...prev, firstName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="newUserLastName">Last Name</Label>
                    <Input
                      id="newUserLastName"
                      value={newUser.lastName}
                      onChange={(e) => setNewUser((prev) => ({ ...prev, lastName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="newUserRole">Role</Label>
                    <Select
                      value={newUser.role}
                      onValueChange={(value) => setNewUser((prev) => ({ ...prev, role: value as UserRole }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="EDITOR">Editor</SelectItem>
                        <SelectItem value="ADMIN">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreateUser}>Create</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="box-section space-x-2">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm bg-accent/40 focus:bg-white"
            />
          </div>
          <div className="box-section p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6 w-[200px]">Name</TableHead>
                  <TableHead className="w-[250px]">Email</TableHead>
                  <TableHead className="w-[100px]">Role</TableHead>
                  <TableHead className="w-[150px]">Created At</TableHead>
                  <TableHead> </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array(5)
                      .fill(0)
                      .map((_, index) => <UserSkeleton key={index} />)
                  : currentUsers.map((user) => (
                      <TableRow key={user.id} className="text-sm">
                        <TableCell className="py-2 pl-6">
                          <div className="flex items-center">
                            <Checkbox
                              checked={selectedUsers.includes(user.id)}
                              onCheckedChange={(checked) => {
                                if (typeof checked === "boolean") {
                                  setSelectedUsers((prev) =>
                                    checked ? [...prev, user.id] : prev.filter((id) => id !== user.id),
                                  )
                                }
                              }}
                              className="mr-2 shadow-none"
                            />
                            <span className="texto flex-grow truncate">
                              {user.firstName} {user.lastName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="texto py-2 pl-6">{user.email}</TableCell>
                        <TableCell className="texto py-2 pl-6">{user.role}</TableCell>
                        <TableCell className="texto py-2 pl-6">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="texto py-2 pl-6">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="shadow-none">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingUser(user)
                                  setIsEditModalOpen(true)
                                  setNewUser({
                                    email: user.email,
                                    password: "",
                                    firstName: user.firstName,
                                    lastName: user.lastName,
                                    role: user.role,
                                  })
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to delete ${user.email}?`)) {
                                    handleDeleteUser(user.id)
                                  }
                                }}
                                className="text-red-500"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
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
              Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of{" "}
              {filteredUsers.length} users
            </div>
            <div className="flex gap-2">
              <Button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} variant="outline">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => paginate(currentPage + 1)}
                disabled={indexOfLastUser >= filteredUsers.length}
                variant="outline"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="editUserEmail">Email</Label>
                  <Input
                    id="editUserEmail"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="editUserPassword">Password (leave blank to keep unchanged)</Label>
                  <Input
                    id="editUserPassword"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="editUserFirstName">First Name</Label>
                  <Input
                    id="editUserFirstName"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser((prev) => ({ ...prev, firstName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="editUserLastName">Last Name</Label>
                  <Input
                    id="editUserLastName"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser((prev) => ({ ...prev, lastName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="editUserRole">Role</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value) => setNewUser((prev) => ({ ...prev, role: value as UserRole }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">User</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleUpdateUser}>Update</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  )
}

