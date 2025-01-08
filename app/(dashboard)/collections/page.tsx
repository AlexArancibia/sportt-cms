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
import { Pencil, Trash2, Search, Plus } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import Link from 'next/link'

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
    <div className="">
      <header className="border-b">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h1 className="text-lg font-semibold">Collections</h1>
          <Link href="/collections/new">
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" /> <p>New Collection</p>
            </Button>
          </Link>
        </div>
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search collections..."
              className="pl-8 w-full border-gray-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search collections"
            />
          </div>
          {selectedCollections.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected ({selectedCollections.length})
            </Button>
          )}
        </div>
      </header>
      <div className="w-full overflow-x-auto">
        <Table className="w-full border-collapse">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px] py-2 px-6 font-medium">
                <input
                  type="checkbox"
                  checked={selectedCollections.length === collections.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCollections(collections.map(c => c.id))
                    } else {
                      setSelectedCollections([])
                    }
                  }}
                  className="h-4 w-4"
                />
              </TableHead>
              <TableHead className="py-2 px-2 font-medium">Name</TableHead>
              <TableHead className="py-2 px-2 font-medium">Description</TableHead>
              <TableHead className="py-2 px-2 font-medium">Products</TableHead>
              <TableHead className="py-2 px-2 font-medium">Featured</TableHead>
              <TableHead className="py-2 px-2 font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
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
                <TableRow key={collection.id}>
                  <TableCell className="py-2 px-6">
                    <input
                      type="checkbox"
                      checked={selectedCollections.includes(collection.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCollections([...selectedCollections, collection.id])
                        } else {
                          setSelectedCollections(selectedCollections.filter(id => id !== collection.id))
                        }
                      }}
                      className="h-4 w-4"
                    />
                  </TableCell>
                  <TableCell className="py-2 px-2">{collection.title}</TableCell>
                  <TableCell className="py-2 px-2">{collection.description}</TableCell>
                  <TableCell className="py-2 px-2">{collection.products.length}</TableCell>
                   <TableCell className="py-2 px-2">
                    <div className="flex space-x-2">
                      <Link href={`/collections/${collection.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(collection.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

