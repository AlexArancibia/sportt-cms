"use client"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChevronLeft, ChevronRight } from "Lucide"
import type { PaginationMeta } from "@/types/pagination"

interface PaginationProps {
  pagination: PaginationMeta | null
  onPageChange: (page: number) => void
  onLimitChange?: (limit: number) => void
  className?: string
}

export function Pagination({ 
  pagination, 
  onPageChange, 
  onLimitChange,
  className = "" 
}: PaginationProps) {
  if (!pagination) return null

  const { page, limit, total, totalPages, hasNext, hasPrev } = pagination

  const startItem = (page - 1) * limit + 1
  const endItem = Math.min(page * limit, total)

  const handleLimitChange = (newLimit: string) => {
    if (onLimitChange) {
      onLimitChange(parseInt(newLimit))
    }
  }

  return (
    <div className={`flex items-center justify-between space-x-2 py-4 ${className}`}>
      <div className="flex items-center space-x-6 text-sm text-muted-foreground">
        <div>
          Mostrando {startItem} a {endItem} de {total} elementos
        </div>
        
        {onLimitChange && (
          <div className="flex items-center space-x-2">
            <label htmlFor="limit" className="text-sm font-medium">
              Mostrar:
            </label>
            <Select value={limit.toString()} onValueChange={handleLimitChange}>
              <SelectTrigger id="limit" className="h-9 w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm">por página</span>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            className="h-9 w-9 p-0"
            onClick={() => onPageChange(page - 1)}
            disabled={!hasPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          {/* Show page numbers */}
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (page <= 3) {
                pageNum = i + 1
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = page - 2 + i
              }

              return (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? "default" : "outline"}
                  className="h-9 w-9 p-0"
                  onClick={() => onPageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              )
            })}
          </div>

          {totalPages > 5 && (
            <>
              {page < totalPages - 2 && <span className="px-1">...</span>}
              <Button
                variant={totalPages === page ? "default" : "outline"}
                className="h-9 w-9 p-0"
                onClick={() => onPageChange(totalPages)}
              >
                {totalPages}
              </Button>
            </>
          )}
          
          <Button
            variant="outline"
            className="h-9 w-9 p-0"
            onClick={() => onPageChange(page + 1)}
            disabled={!hasNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

