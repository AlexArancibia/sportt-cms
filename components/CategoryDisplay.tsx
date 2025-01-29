import type React from "react"
import { Badge } from "@/components/ui/badge"
import type { Category } from "@/types/category"

interface CategoryDisplayProps {
  categoryIds: string[]
  categories: Category[]
}

export const CategoryDisplay: React.FC<CategoryDisplayProps> = ({ categoryIds, categories }) => {
  const getCategoryPath = (categoryId: string): string[] => {
    const category = categories.find((c) => c.id === categoryId)
    if (!category) return []
    if (!category.parentId) return [category.name]
    return [...getCategoryPath(category.parentId), category.name]
  }

  return (
    <div className="flex flex-wrap gap-1">
      {categoryIds.map((id) => {
        const path = getCategoryPath(id)
        return (
          <Badge key={id} variant="outline">
            {path.join(" > ")}
          </Badge>
        )
      })}
    </div>
  )
}

