"use client"

import type React from "react"

import { useState } from "react"
import { useMainStore } from "@/stores/mainStore"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Plus, Pencil, Trash2, Loader2, UserPlus, Upload } from 'lucide-react'
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Image from "next/image"
import { CreateUserDto, UpdateUserDto, User } from "@/types/user"
import { AuthProvider, UserRole } from "@/types/common"

interface UserSettingsProps {
  users: User[]
  currentStore: any
}

export default function UserSettings({ users, currentStore }: UserSettingsProps) {
  const { createUser, updateUser, deleteUser } = useMainStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<Partial<CreateUserDto>>({
    firstName: "",
    lastName: "",
    email: "",
    role: UserRole.EDITOR,
    password: "",
    authProvider: AuthProvider.EMAIL,
    image: "",
    phone: "",
  })
  const { toast } = useToast()

  // Filtrar usuarios por término de búsqueda
  const filteredUsers = users.filter(
    (user) =>
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.role && user.role.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const handleOpenDialog = (user?: User) => {
    if (user) {
      console.log("DEBUG: Editando usuario:", user);
      setEditingUser(user)
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role as UserRole,
        image: user.image || "",
        phone: user.phone || "",
        // No incluimos password por seguridad
      })
    } else {
      console.log("DEBUG: Creando nuevo usuario");
      setEditingUser(null)
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        role: UserRole.EDITOR,
        password: "",
        authProvider: AuthProvider.EMAIL,
        image: "",
        phone: "",
      })
    }
    setIsDialogOpen(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    console.log(`DEBUG: Cambio en campo ${name}:`, value);
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSelectChange = (value: string) => {
    console.log("DEBUG: Cambio en rol:", value);
    setFormData({
      ...formData,
      role: value as UserRole,
    })
  }

  const handleImageUpload = async (file: File) => {
    setIsUploading(true)
    const formDataFile = new FormData()
    formDataFile.append("file", file)
    formDataFile.append("description", "Imagen de perfil del usuario")

    try {
      console.log("DEBUG: Subiendo imagen:", file.name);
      // Simulamos la carga de la imagen (en un entorno real, esto sería una llamada API)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // En un entorno real, aquí obtendrías la URL o nombre del archivo del servidor
      const imageUrl = URL.createObjectURL(file)
      console.log("DEBUG: Imagen subida, URL:", imageUrl);

      // Actualiza el estado del formulario con la nueva imagen
      setFormData({
        ...formData,
        image: imageUrl,
      })

      toast({
        title: "Éxito",
        description: "Imagen subida correctamente",
      })
    } catch (error) {
      console.error("ERROR al subir la imagen:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo subir la imagen",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
  
    try {
      if (editingUser) {
        console.log("DEBUG: Actualizando usuario con ID:", editingUser.id);
        const updateDto: UpdateUserDto = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          role: formData.role,
          image: formData.image,
          phone: formData.phone,
        }
        console.log("DEBUG: Payload para actualización:", JSON.stringify(updateDto, null, 2));
        await updateUser(editingUser.id, updateDto)
        console.log("DEBUG: Usuario actualizado correctamente");
        toast({
          title: "Usuario actualizado",
          description: "El usuario ha sido actualizado correctamente",
        })
      } else {
        console.log("DEBUG: Creando nuevo usuario");
        
        // Verificar que tenemos un store actual
        if (!currentStore || !currentStore.id) {
          throw new Error("No hay una tienda seleccionada. No se puede crear el usuario.");
        }
        
        const createDto: CreateUserDto = {
          firstName: formData.firstName || "",
          lastName: formData.lastName || "",
          email: formData.email || "",
          role: formData.role || UserRole.EDITOR,
          password: formData.password || "",
          authProvider: formData.authProvider || AuthProvider.EMAIL,
          image: formData.image,
          phone: formData.phone,
          storeId: currentStore.id, // Añadir el storeId del store actual
        }
        
        console.log("DEBUG: Payload para creación:", JSON.stringify(createDto, null, 2));
        console.log(`DEBUG: Enlazando usuario a la tienda: ${currentStore.id} (${currentStore.name})`);
        
        await createUser(createDto)
        console.log("DEBUG: Usuario creado correctamente");
        toast({
          title: "Usuario creado",
          description: "El usuario ha sido creado correctamente y asignado a esta tienda",
        })
      }
      setIsDialogOpen(false)
    } catch (error: any) {
      console.error("ERROR al guardar el usuario:", error);
      console.error("Mensaje de error:", error?.message);
      console.error("Respuesta del servidor:", error?.response?.data);
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "No se pudo guardar el usuario. Por favor, intente nuevamente.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este usuario?")) {
      setIsDeleting(true)
      try {
        console.log(`DEBUG: Eliminando usuario con ID: ${id}`);
        await deleteUser(id)
        console.log("DEBUG: Usuario eliminado correctamente");
        toast({
          title: "Usuario eliminado",
          description: "El usuario ha sido eliminado correctamente",
        })
      } catch (error: any) {
        console.error("ERROR al eliminar el usuario:", error);
        console.error("Mensaje de error:", error?.message);
        console.error("Respuesta del servidor:", error?.response?.data);
        toast({
          variant: "destructive",
          title: "Error",
          description: error?.message || "No se pudo eliminar el usuario. Por favor, intente nuevamente.",
        })
      } finally {
        setIsDeleting(false)
      }
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case UserRole.ADMIN:
        return <Badge className="bg-primary">Administrador</Badge>
      case UserRole.MANAGER:
        return <Badge className="bg-blue-500">Gerente</Badge>
      case UserRole.EDITOR:
        return <Badge className="bg-green-500">Editor</Badge>
      case UserRole.CUSTOMER_SERVICE:
        return <Badge className="bg-yellow-500">Atención al Cliente</Badge>
      default:
        return <Badge variant="secondary">{role}</Badge>
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <ScrollArea className="h-[calc(100vh-16rem)]">
      <div className="container-section">
        <div className="content-section box-container">
          <div className="box-section justify-between">
            <h3 className="text-lg font-medium">Usuarios</h3>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Agregar usuario
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingUser ? "Editar usuario" : "Agregar usuario"}</DialogTitle>
                  <DialogDescription>
                    {editingUser ? "Modifica los detalles del usuario" : "Agrega un nuevo usuario a tu tienda"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label>Imagen de perfil</Label>
                      <div className="flex items-center space-x-4">
                        <div className="w-24 h-24 relative overflow-hidden rounded-full border bg-muted">
                          <Image
                            src={formData.image || "/placeholder.svg?height=96&width=96&query=user+avatar"}
                            alt="Imagen de perfil"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <Input
                            type="file"
                            id="image-upload"
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                            accept="image/*"
                            disabled={isUploading}
                          />
                          <Label
                            htmlFor="image-upload"
                            className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2"
                          >
                            {isUploading ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Upload className="h-4 w-4 mr-2" />
                            )}
                            {formData.image ? "Cambiar imagen" : "Subir imagen"}
                          </Label>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Nombre</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        placeholder="Juan"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Apellido</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        placeholder="Pérez"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Correo electrónico</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="juan@ejemplo.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Rol</Label>
                      <Select value={formData.role} onValueChange={handleSelectChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un rol" />
                        </SelectTrigger>
                        <SelectContent>
                          {/* Solo permitimos seleccionar EDITOR y CUSTOMER_SERVICE */}
                          <SelectItem value={UserRole.EDITOR}>Editor</SelectItem>
                          <SelectItem value={UserRole.CUSTOMER_SERVICE}>Atención al Cliente</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Solo se pueden asignar roles de Editor o Atención al Cliente.
                      </p>
                    </div>
                    
                    {!editingUser && (
                      <div className="space-y-2">
                        <Label htmlFor="password">Contraseña</Label>
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={handleInputChange}
                          required={!editingUser}
                        />
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono (opcional)</Label>
                      <Input
                        id="phone"
                        name="phone"
                        placeholder="+51 999 888 777"
                        value={formData.phone}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        "Guardar"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="box-section justify-between">
            <div className="relative max-w-sm">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="flex items-center justify-center h-40 border rounded-md border-dashed">
              <p className="text-muted-foreground">No hay usuarios configurados</p>
            </div>
          ) : (
            <div className="box-section p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Correo electrónico</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Último acceso</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={user.image || "/placeholder.svg?height=40&width=40&query=user"} alt={user.firstName} />
                            <AvatarFallback>{getInitials(`${user.firstName} ${user.lastName}`)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {user.firstName} {user.lastName}
                            </p>
                            {user.id === currentStore?.ownerId && (
                              <p className="text-xs text-muted-foreground">Propietario</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        {user.lastLogin 
                          ? new Date(user.lastLogin).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'Nunca'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleOpenDialog(user)}
                            disabled={user.id === currentStore?.ownerId}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDelete(user.id)}
                            disabled={isDeleting || user.id === currentStore?.ownerId}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Eliminar</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="box-section border-none">
            <div className="space-y-2">
              <h4 className="font-medium">Permisos de usuarios</h4>
              <p className="text-sm text-muted-foreground">
                Los permisos determinan qué acciones pueden realizar los usuarios en tu tienda.
              </p>
              <div className="mt-4">
                <div className="space-y-4">
                  <div className="border rounded-md p-4">
                    <h5 className="font-medium mb-2">Editor</h5>
                    <p className="text-sm text-muted-foreground">
                      Puede crear y editar contenido, pero no puede modificar configuraciones críticas ni gestionar usuarios.
                    </p>
                  </div>
                  <div className="border rounded-md p-4">
                    <h5 className="font-medium mb-2">Atención al Cliente</h5>
                    <p className="text-sm text-muted-foreground">
                      Puede gestionar pedidos, responder consultas de clientes y actualizar el estado de los envíos.
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <Button variant="outline" disabled>
                    <Plus className="h-4 w-4 mr-2" />
                    Configurar permisos avanzados
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    La configuración avanzada de permisos estará disponible próximamente.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}