import { Category } from '@/types/category'
import { Product } from '@/types/product'
import apiClient from '@/lib/axiosConfig'

export async function deleteCategoryWithDependencies(categoryId: string) {
  try {
    // Fetch the category to check for subcategories
    const categoryResponse = await apiClient.get<Category>(`/categories/${categoryId}`)
    const category = categoryResponse.data

    // Update subcategories if any
    if (category.children && category.children.length > 0) {
      await Promise.all(category.children.map(async (childId) => {
        await apiClient.put(`/categories/${childId}`, { parentId: null })
      }))
    }

    // Fetch products associated with this category
    const productsResponse = await apiClient.get<Product[]>(`/products?categoryId=${categoryId}`)
    const products = productsResponse.data

    // Update products to remove category association
    await Promise.all(products.map(async (product) => {
      await apiClient.put(`/products/${product.id}`, { categoryId: null })
    }))

    // Finally, delete the category
    await apiClient.delete(`/categories/${categoryId}`)

    return { success: true, message: 'Category and its dependencies updated successfully' }
  } catch (error) {
    console.error('Error in deleteCategoryWithDependencies:', error)
    return { success: false, message: 'Failed to delete category and update dependencies' }
  }
}

