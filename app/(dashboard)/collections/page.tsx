'use client'

import { useEffect, useState } from 'react'
import { useMainStore } from '@/stores/mainStore'
import { Collection } from '@/types/collection'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Pencil, Trash2, Search, Plus, MoreHorizontal } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import Link from 'next/link'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { HeaderBar } from '@/components/HeaderBar'

export default function CollectionsPage() {
  const { collections, fetchCollections, deleteCollection, loading, error } = useMainStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCollections, setSelectedCollections] = useState<string[]>([])
  const { toast } = useToast()

  useEffect(() => {
    fetchCollections()
  }, [fetchCollections])

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this collection?')) {
      try {
        await deleteCollection(id)
        toast({
          title: "Success",
          description: "Collection deleted successfully",
        })
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete collection",
        })
      }
    }
  }

  const handleDeleteSelected = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedCollections.length} selected collections?`)) {
      try {
        await Promise.all(selectedCollections.map(id => deleteCollection(id)))
        setSelectedCollections([])
        toast({
          title: "Success",
          description: "Selected collections deleted successfully",
        })
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete selected collections",
        })
      }
    }
  }

  const filteredCollections = collections.filter(collection =>
    collection.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    collection.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const CollectionSkeleton = () => (
    <TableRow>
      <TableCell className="w-[40px]"><Skeleton className="h-4 w-4" /></TableCell>
      <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
      <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
      <TableCell><Skeleton className="h-8 w-[80px]" /></TableCell>
    </TableRow>
  )

  return (
    <>
      <HeaderBar title='Colecciones' />
      <div className="container-section">
        <div className="content-section box-container">
          <div className="box-section justify-between">
            <h3>Colecciones</h3>
            <Link href="/collections/new">
              <Button className='bg-gradient-to-tr from-emerald-700 to-emerald-500 dark:text-white'>
                <Plus className="h-4 w-4 mr-2" /> Crear
              </Button>
            </Link>
          </div>
          <div className="box-section space-x-2">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search collections..."
              className="max-w-sm bg-accent/40 focus:bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search collections"
            />
          </div>
          <div className='box-section border-0 p-0'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='pl-6 w-[350px]'>Nombre</TableHead>
                  <TableHead className='w-[200px]'>Descripción</TableHead>
                  <TableHead className='w-[200px]'>Productos</TableHead>
                  <TableHead  className='w-[100px]' >Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading || !collections ? (
                  <>
                    <CollectionSkeleton />
                    <CollectionSkeleton />
                    <CollectionSkeleton />
                    <CollectionSkeleton />
                    <CollectionSkeleton />
                  </>
                ) : filteredCollections.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      <p>No collections found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCollections.map((collection: Collection) => (
                    <TableRow key={collection.id} className='content-font'>
                      <TableCell className="  py-2 px- pl-6">{collection.title}</TableCell>
                      <TableCell className="py-2 px-2">{collection.description}</TableCell>
                      <TableCell className="py-2 px-2">{collection.products.length}</TableCell>
                       <TableCell className="py-2 px-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="shadow-none">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/collections/${collection.id}/edit`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(collection.id)} className="text-red-500">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </>
  )
}
