"use client"

import { ProductsTable } from "@/components/ProductsTable"
import { useMainStore } from "@/stores/mainStore"
import { HeaderBar } from "@/components/HeaderBar"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function ProductsPageNew() {
  const { currentStore, shopSettings } = useMainStore()

  if (!currentStore) {
    return (
      <div className="h-[calc(100vh-1.5em)] bg-background rounded-xl text-foreground">
        <HeaderBar title="Productos" jsonData={{}} />
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <h2 className="text-lg font-medium">No hay tienda seleccionada</h2>
          <p className="text-muted-foreground text-center">
            Por favor selecciona una tienda para ver sus productos.
          </p>
        </div>
      </div>
    )}
  }

  return (
    <div className="h-[calc(100vh-1.5em)] bg-background rounded-xl text-foreground">
      <HeaderBar 
        title="Productos" 
        jsonData={{ currentStore, shopSettings }} 
      />

      <div className="p-6">
        {/* Header con botón de crear */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Productos</h1>
            <p className="text-muted-foreground">
              Gestiona todos los productos de tu tienda con paginación avanzada
            </p>
          </div>
          <Link href="/products/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Crear Producto
            </Button>
          </Link>
        </div>

        {/* Tabla de productos con paginación */}
        <ProductsTable storeId={currentStore} />
      </div>
    </div>
  )
}
