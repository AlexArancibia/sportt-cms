import type { Category } from "@/types/category"

export async function handleCategories(
  categoryPath: string,
  existingCategories: Category[],
  createCategory: (category: Partial<Category>) => Promise<Category>,
): Promise<string[]> {
  const categoryNames = categoryPath
    .split(" > ")
    .map((name) => name.trim())
    .filter(Boolean)
  const categoryIds: string[] = []
  let parentId: string | null = null

  for (const categoryName of categoryNames) {
    let category = existingCategories.find((c) => c.name === categoryName && c.parentId === parentId)

    if (!category) {
      // Create new category
      category = await createCategory({
        name: categoryName,
        parentId: parentId,
      })
      existingCategories.push(category)
    }

    categoryIds.push(category.id)
    parentId = category.id
  }

  // If there's only one category and it doesn't exist, create it as a root category
  if (categoryIds.length === 0 && categoryNames.length === 1) {
    const rootCategory = await createCategory({
      name: categoryNames[0],
      parentId: null,
    })
    existingCategories.push(rootCategory)
    categoryIds.push(rootCategory.id)
  }

  return categoryIds
}

export function buildCategoryHierarchy(categories: Category[]): Category[] {
  const categoryMap = new Map<string, Category>()
  const rootCategories: Category[] = []

  // First pass: create a map of all categories
  categories.forEach((category) => {
    categoryMap.set(category.id, { ...category, children: [] })
  })

  // Second pass: build the hierarchy
  categories.forEach((category) => {
    const categoryWithChildren = categoryMap.get(category.id)!
    if (category.parentId) {
      const parent = categoryMap.get(category.parentId)
      if (parent) {
        parent.children = parent.children || []
        parent.children.push(categoryWithChildren)
      }
    } else {
      rootCategories.push(categoryWithChildren)
    }
  })

  return rootCategories
}

