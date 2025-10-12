import { create } from "zustand"
import apiClient from "@/lib/axiosConfig"
import type { Product, PaginatedProductsResponse, ProductSearchParams, ProductPaginationMeta } from "@/types/product"
import type { Category, CreateCategoryDto } from "@/types/category"
import type { Collection } from "@/types/collection"
import type { Order } from "@/types/order"
import type { Customer } from "@/types/customer"
import type { Coupon } from "@/types/coupon"
import type { City, Country, GeographicDataResponse, ShippingMethod, State } from "@/types/shippingMethod"
import type {
  ShopSettings,
  CreateShopSettingsDto,
  CreateStoreDto,
  UpdateStoreDto,
  UpdateShopSettingsDto,
  Store,
} from "@/types/store"
import type { Currency } from "@/types/currency"
import type { ExchangeRate } from "@/types/exchangeRate"
import type { ProductVariant } from "@/types/productVariant"
import type { Content } from "@/types/content"
import type { User } from "@/types/user"
import type { PaymentProvider, PaymentTransaction } from "@/types/payments"
import type { HeroSection } from "@/types/heroSection"
import type { CardSection } from "@/types/card"
import type { TeamMember, TeamSection } from "@/types/team"
import type { FrequentlyBoughtTogether } from "@/types/fbt"
import type { PaginatedResponse } from "@/types/common"

// Definir la interfaz MainStore
interface MainStore {
  endpoint: string
  categories: Category[]
  products: Product[]
  productVariants: ProductVariant[]
  collections: Collection[]
  orders: Order[]
  customers: Customer[]
  coupons: Coupon[]
  countries: Country[]
  states: State[]
  cities: City[]
  shippingMethods: ShippingMethod[]
  paymentProviders: PaymentProvider[]
  paymentTransactions: PaymentTransaction[]
  currencies: Currency[]
  exchangeRates: ExchangeRate[]
  contents: Content[]
  heroSections: HeroSection[]
  cardSections: CardSection[]
  teamSections: TeamSection[]
  teamMembers: TeamMember[]
  users: User[]
  shopSettings: ShopSettings[]
  loading: boolean
  error: string | null
  frequentlyBoughtTogether: FrequentlyBoughtTogether[]
  // Paginación de productos
  productsPagination: ProductPaginationMeta | null

  currentStore: string | null
  stores: Store[]
  setCurrentStore: (storeId: string) => void
  fetchStores: (owner?: string) => Promise<Store[]>
  getCurrentStore: () => Store | null
  createStore: (storeData: CreateStoreDto) => Promise<Store>
  updateStore: (id: string, storeData: UpdateStoreDto) => Promise<Store>
  deleteStore: (id: string) => Promise<void>

  setEndpoint: (endpoint: string) => void

  fetchCategories: () => Promise<Category[]>
  fetchCategoriesByStore: (storeId?: string) => Promise<Category[]>
  createCategory: (category: CreateCategoryDto) => Promise<Category>
  updateCategory: (id: string, category: any) => Promise<Category>
  deleteCategory: (id: string) => Promise<void>

  fetchProducts: () => Promise<Product[]>
  fetchProductsByStore: (storeId?: string, params?: ProductSearchParams) => Promise<PaginatedProductsResponse>
  fetchProductById: (storeId: string, productId: string) => Promise<Product>
  createProduct: (product: any) => Promise<Product>
  updateProduct: (id: string, product: any) => Promise<Product>
  deleteProduct: (id: string) => Promise<void>

  fetchProductVariants: () => Promise<ProductVariant[]>
  createProductVariant: (variant: any) => Promise<ProductVariant>
  updateProductVariant: (id: string, variant: any) => Promise<ProductVariant>
  deleteProductVariant: (id: string) => Promise<void>

  fetchCollections: () => Promise<Collection[]>
  fetchCollectionsByStore: (storeId?: string) => Promise<Collection[]>
  createCollection: (collection: any) => Promise<Collection>
  updateCollection: (id: string, collection: any) => Promise<Collection>
  deleteCollection: (id: string) => Promise<void>

  fetchHeroSections: () => Promise<HeroSection[]>
  fetchHeroSectionsByStore: (storeId?: string) => Promise<HeroSection[]>
  fetchHeroSection: (id: string) => Promise<HeroSection>
  createHeroSection: (data: any) => Promise<HeroSection>
  updateHeroSection: (id: string, data: any) => Promise<HeroSection>
  deleteHeroSection: (id: string) => Promise<void>

  fetchCardSections: () => Promise<CardSection[]>
  fetchCardSectionsByStore: (storeId?: string) => Promise<CardSection[]>
  fetchCardSection: (id: string) => Promise<CardSection>
  createCardSection: (data: any) => Promise<CardSection>
  updateCardSection: (id: string, data: any) => Promise<CardSection>
  deleteCardSection: (id: string) => Promise<void>

  fetchTeamSections: () => Promise<TeamSection[]>
  fetchTeamSectionsByStore: (storeId?: string) => Promise<TeamSection[]>
  fetchTeamSection: (id: string) => Promise<TeamSection>
  createTeamSection: (data: any) => Promise<TeamSection>
  updateTeamSection: (id: string, data: any) => Promise<TeamSection>
  deleteTeamSection: (id: string) => Promise<void>

  fetchTeamMembers: (teamSectionId: string) => Promise<TeamMember[]>
  fetchTeamMember: (id: string) => Promise<TeamMember>
  createTeamMember: (teamMember: any) => Promise<TeamMember>
  updateTeamMember: (id: string, teamMember: any) => Promise<TeamMember>
  deleteTeamMember: (id: string) => Promise<void>

  fetchOrdersByStore: (storeId?: string) => Promise<Order[]>
  createOrder: (data: any) => Promise<Order>
  updateOrder: (id: string, data: any) => Promise<Order>
  deleteOrder: (id: string) => Promise<void>
  createRefund: (data: any) => Promise<void>

  fetchCustomers: () => Promise<Customer[]>
  fetchCustomersByStore: (storeId?: string) => Promise<Customer[]>
  createCustomer: (customer: any) => Promise<Customer>
  updateCustomer: (id: string, customer: any) => Promise<Customer>
  deleteCustomer: (id: string) => Promise<void>

  fetchCoupons: () => Promise<Coupon[]>
  fetchCouponsByStore: (storeId?: string) => Promise<Coupon[]>
  createCoupon: (coupon: any) => Promise<Coupon>
  updateCoupon: (id: string, coupon: any) => Promise<Coupon>
  deleteCoupon: (id: string) => Promise<void>

  fetchShippingMethods: () => Promise<ShippingMethod[]>
  fetchShippingMethodsByStore: (storeId?: string) => Promise<ShippingMethod[]>
  createShippingMethod: (method: any) => Promise<ShippingMethod>
  updateShippingMethod: (id: string, method: any) => Promise<ShippingMethod>
  deleteShippingMethod: (id: string) => Promise<void>

  fetchCountries: () => Promise<Country[]>
  fetchStatesByCountry: (countryCode: string) => Promise<State[]>
  fetchCitiesByState: (stateId: string) => Promise<City[]>
  searchGeographicData: (searchTerm: string, type?: "country" | "state" | "city") => Promise<{
    countries: Country[]
    states: State[]
    cities: City[]
  }>


  fetchPaymentProviders: () => Promise<PaymentProvider[]>
  fetchPaymentTransactions: () => Promise<PaymentTransaction[]>
  createPaymentProvider: (data: any) => Promise<PaymentProvider>
  updatePaymentProvider: (id: string, data: any) => Promise<PaymentProvider>
  deletePaymentProvider: (id: string) => Promise<void>
  createPaymentTransaction: (data: any) => Promise<PaymentTransaction>
  updatePaymentTransaction: (id: string, data: any) => Promise<PaymentTransaction>

  fetchContents: () => Promise<Content[]>
  fetchContentsByStore: (storeId?: string) => Promise<Content[]>
  fetchContent: (id: string) => Promise<Content>
  createContent: (content: any) => Promise<Content>
  updateContent: (id: string, content: any) => Promise<Content>
  deleteContent: (id: string) => Promise<void>

  fetchUsers: (storeId?: string) => Promise<User[]>
  createUser: (user: any) => Promise<User>
  updateUser: (id: string, user: any) => Promise<User>
  deleteUser: (id: string) => Promise<void>

  fetchShopSettings: (storeId?: string) => Promise<ShopSettings[]>
  fetchShopSettingsByStore: (storeId?: string) => Promise<ShopSettings>
  saveShopSettings: (settings: any) => Promise<ShopSettings>
  createShopSettings: (settings: CreateShopSettingsDto) => Promise<ShopSettings>
  updateShopSettings: (id: string, settings: UpdateShopSettingsDto) => Promise<ShopSettings>
  addAcceptedCurrency: (shopId: string, currencyId: string) => Promise<ShopSettings>
  removeAcceptedCurrency: (shopId: string, currencyId: string) => Promise<ShopSettings>

  fetchCurrencies: () => Promise<Currency[]>
  createCurrency: (currency: any) => Promise<Currency>
  updateCurrency: (id: string, currency: any) => Promise<Currency>
  deleteCurrency: (id: string) => Promise<void>

  fetchExchangeRates: () => Promise<ExchangeRate[]>
  createExchangeRate: (exchangeRate: any) => Promise<ExchangeRate>
  updateExchangeRate: (id: string, exchangeRate: any) => Promise<ExchangeRate>
  deleteExchangeRate: (id: string) => Promise<void>

  // Agregar los métodos para FBT
  fetchFrequentlyBoughtTogether: () => Promise<FrequentlyBoughtTogether[]>
  fetchFrequentlyBoughtTogetherByStore: (storeId?: string) => Promise<FrequentlyBoughtTogether[]>
  fetchFrequentlyBoughtTogetherById: (id: string) => Promise<FrequentlyBoughtTogether>
  createFrequentlyBoughtTogether: (data: any) => Promise<FrequentlyBoughtTogether>
  updateFrequentlyBoughtTogether: (id: string, data: any) => Promise<FrequentlyBoughtTogether>
  deleteFrequentlyBoughtTogether: (id: string) => Promise<void>

  refreshData: () => Promise<void>
  clearStoreData: () => void
  getCategoryById: (id: string) => Category | undefined
  getProductById: (id: string) => Product | undefined
  getCollectionById: (id: string) => Collection | undefined
  getOrderById: (id: string) => Order | undefined
  getCustomerById: (id: string) => Customer | undefined
  getCouponById: (id: string) => Coupon | undefined
  getCurrencyById: (id: string) => Currency | undefined
  getExchangeRateById: (id: string) => ExchangeRate | undefined
  getStoreById: (id: string) => Store | undefined
}

// Agregar la propiedad frequentlyBoughtTogether al estado inicial
export const useMainStore = create<MainStore>((set, get) => ({
  endpoint: "",
  categories: [],
  products: [],
  productVariants: [],
  collections: [],
  orders: [],
  customers: [],
  heroSections: [],
  cardSections: [],
  teamSections: [],
  teamMembers: [],
  coupons: [],
  countries: [],
  states: [],
  cities: [],
  shippingMethods: [],
  contents: [],
  users: [],
  shopSettings: [],
  currencies: [],
  exchangeRates: [],
  paymentProviders: [],
  paymentTransactions: [],
  loading: false,
  error: null,
  frequentlyBoughtTogether: [],
  productsPagination: null,
  currentStore: typeof window !== "undefined" ? localStorage.getItem("currentStoreId") : null,
  stores: [],

  setEndpoint: (endpoint) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("endpoint", endpoint)
    }
    set({ endpoint })
  },

  // Método fetchCategories - siempre datos frescos
  fetchCategories: async () => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<Category[]>("/categories")
      set({
        categories: response.data,
        loading: false,
      })
      return response.data
    } catch (error) {
      set({ error: "Failed to fetch categories", loading: false })
      throw error
    }
  },

  // Método fetchCategoriesByStore - siempre datos frescos
  fetchCategoriesByStore: async (storeId?: string) => {
    const { currentStore } = get()
    const targetStoreId = storeId || currentStore

    if (!targetStoreId) {
      throw new Error("No store ID provided and no current store selected")
    }

    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<PaginatedResponse<Category>>(`/categories/${targetStoreId}`)
      const categoriesData = response.data.data || []
      
      set({
        categories: categoriesData,
        loading: false,
      })
      return categoriesData
    } catch (error) {
      set({ error: "Failed to fetch categories by store", loading: false })
      throw error
    }
  },

  createCategory: async (category: any) => {
    set({ loading: true, error: null })
    try {
      const storeId = category.storeId || get().currentStore
      if (!storeId) throw new Error("No store ID provided")
      
      const response = await apiClient.post<Category>(`/categories/${storeId}`, category)
      set((state) => ({
        categories: [...state.categories, response.data],
        loading: false,
      }))
      return response.data
    } catch (error) {
      set({ error: "Failed to create category", loading: false })
      throw error
    }
  },

  updateCategory: async (id: string, category: any) => {
    set({ loading: true, error: null })
    try {
      const storeId = category.storeId || get().currentStore
      if (!storeId) throw new Error("No store ID provided")
      
      const response = await apiClient.put<Category>(`/categories/${storeId}/${id}`, category)
      set((state) => ({
        categories: state.categories.map((c) => (c.id === id ? { ...c, ...response.data } : c)),
        loading: false,
      }))
      return response.data
    } catch (error) {
      set({ error: "Failed to update category", loading: false })
      throw error
    }
  },

  deleteCategory: async (id) => {
    set({ loading: true, error: null })
    try {
      const category = get().categories.find(c => c.id === id)
      const storeId = category?.storeId || get().currentStore
      if (!storeId) throw new Error("No store ID provided")
      
      await apiClient.delete(`/categories/${storeId}/${id}`)
      set((state) => ({
        categories: state.categories.filter((c) => c.id !== id),
        loading: false,
      }))
    } catch (error) {
      set({ error: "Failed to delete category", loading: false })
      throw error
    }
  },

  // Método fetchProducts - siempre datos frescos
  fetchProducts: async () => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<Product[]>("/products")
      set({
        products: response.data,
        loading: false,
      })
      return response.data
    } catch (error) {
      set({ error: "Failed to fetch products", loading: false })
      throw error
    }
  },

  // Método fetchProductsByStore con paginación del servidor
  // Retorna PaginatedProductsResponse según la guía API
  fetchProductsByStore: async (storeId?: string, params?: ProductSearchParams): Promise<PaginatedProductsResponse> => {
    const { currentStore } = get()
    const targetStoreId = storeId || currentStore

    if (!targetStoreId) {
      throw new Error("No store ID provided and no current store selected")
    }

    set({ loading: true, error: null })
    try {
      // Construir query params
      const queryParams = new URLSearchParams()
      queryParams.append('page', String(params?.page || 1))
      queryParams.append('limit', String(params?.limit || 20))
      queryParams.append('sortBy', params?.sortBy || 'createdAt')
      queryParams.append('sortOrder', params?.sortOrder || 'desc')
      
      if (params?.query) queryParams.append('query', params.query)
      if (params?.vendor) queryParams.append('vendor', params.vendor)
      if (params?.minPrice !== undefined) queryParams.append('minPrice', String(params.minPrice))
      if (params?.maxPrice !== undefined) queryParams.append('maxPrice', String(params.maxPrice))
      if (params?.currencyId) queryParams.append('currencyId', params.currencyId)
      
      // Arrays
      params?.status?.forEach(s => queryParams.append('status', s))
      params?.categorySlugs?.forEach(slug => queryParams.append('categorySlugs', slug))
      params?.collectionIds?.forEach(id => queryParams.append('collectionIds', id))
      
      const url = `/products/store/${targetStoreId}?${queryParams.toString()}`
      const response = await apiClient.get<PaginatedProductsResponse>(url)
      
      // Validar respuesta
      if (!response.data?.data || !response.data?.pagination) {
        throw new Error('Invalid API response structure')
      }
      
      set({
        products: response.data.data,
        productsPagination: response.data.pagination,
        loading: false,
      })
      
      return response.data
    } catch (error) {
      console.error("[fetchProductsByStore] Error:", error)
      set({ error: "Failed to fetch products by store", loading: false })
      throw error
    }
  },

  // Método fetchProductById - obtiene un producto específico por ID
  fetchProductById: async (storeId: string, productId: string): Promise<Product> => {
    if (!storeId) {
      throw new Error("Store ID is required")
    }
    if (!productId) {
      throw new Error("Product ID is required")
    }

    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<Product>(`/products/${storeId}/${productId}`)
      set({ loading: false })
      return response.data
    } catch (error) {
      console.error("[fetchProductById] Error:", error)
      set({ error: "Failed to fetch product", loading: false })
      throw error
    }
  },

  createProduct: async (product: any) => {
    set({ loading: true, error: null })
    try {
      const storeId = product.storeId || get().currentStore
      if (!storeId) throw new Error("No store ID provided")
      
      const response = await apiClient.post<Product>(`/products/${storeId}`, product)
      set((state) => ({
        products: [...state.products, response.data],
        loading: false,
      }))
      return response.data
    } catch (error) {
      set({ error: "Failed to create product", loading: false })
      throw error
    }
  },

  updateProduct: async (id: string, product: any) => {
    set({ loading: true, error: null })
    try {
      const storeId = product.storeId || get().currentStore
      if (!storeId) throw new Error("No store ID provided")
      
      // Clean up the payload - remove fields that shouldn't be updated
      const {
        id: _id,
        storeId: _storeId,
        createdAt,
        updatedAt,
        categories,
        collections,
        variants: rawVariants,
        ...cleanProduct
      } = product

      // Clean up variants - remove unnecessary fields but keep all variant properties
      const cleanVariants = rawVariants?.map((variant: any) => {
        const {
          id: variantId,
          productId,
          createdAt: vCreatedAt,
          updatedAt: vUpdatedAt,
          product: vProduct,
          orderItems,
          prices: rawPrices,
          ...cleanVariantData
        } = variant

        // Clean up prices - keep only currencyId and price, filter out invalid prices
        const cleanPrices = rawPrices
          ?.filter((price: any) => price.currencyId && (price.price >= 0))
          .map((price: any) => ({
            currencyId: price.currencyId,
            price: Number(price.price),
            ...(price.originalPrice && price.originalPrice > 0 ? { originalPrice: Number(price.originalPrice) } : {}),
          }))

        // Ensure SKU is either undefined or a non-empty string
        const sku = cleanVariantData.sku?.trim() || undefined

        // Ensure imageUrls is an array
        const imageUrls = Array.isArray(cleanVariantData.imageUrls) ? cleanVariantData.imageUrls : []

        // Explicitly preserve boolean fields to avoid losing false values
        const result: any = {
          title: cleanVariantData.title,
          sku,
          isActive: cleanVariantData.isActive !== undefined ? Boolean(cleanVariantData.isActive) : true,
          inventoryQuantity: cleanVariantData.inventoryQuantity || 0,
          weightValue: cleanVariantData.weightValue || '0',
          position: cleanVariantData.position !== undefined ? cleanVariantData.position : 0,
          imageUrls,
          attributes: cleanVariantData.attributes || {},
        }

        // Add prices if available
        if (cleanPrices && cleanPrices.length > 0) {
          result.prices = cleanPrices
        }

        return result
      })

      // Remove fields that should not be updated
      const {
        viewCount,  // This is managed by the backend
        ...updateableFields
      } = cleanProduct

      // Remove null values - DTOs don't accept null, only undefined or the actual value
      const removeNullValues = (obj: any): any => {
        if (obj === null || obj === undefined) return undefined
        if (Array.isArray(obj)) return obj.map(removeNullValues).filter(item => item !== undefined)
        if (typeof obj === 'object') {
          return Object.entries(obj).reduce((acc, [key, value]) => {
            const cleanedValue = removeNullValues(value)
            if (cleanedValue !== undefined && cleanedValue !== null) {
              acc[key] = cleanedValue
            }
            return acc
          }, {} as any)
        }
        return obj
      }

      const cleanedFields = removeNullValues(updateableFields)
      const cleanedVariants = cleanVariants ? removeNullValues(cleanVariants) : undefined

      // Normalize slug if present - remove multiple consecutive hyphens
      if (cleanedFields.slug) {
        cleanedFields.slug = cleanedFields.slug
          .toLowerCase()
          .replace(/--+/g, '-')  // Replace multiple hyphens with single hyphen
          .replace(/^-+/, '')     // Remove leading hyphens
          .replace(/-+$/, '')     // Remove trailing hyphens
      }

      const updatePayload = {
        ...cleanedFields,
        ...(cleanedVariants && cleanedVariants.length > 0 ? { variants: cleanedVariants } : {}),
      }
      
      const response = await apiClient.patch<Product>(`/products/${storeId}/${id}`, updatePayload)
      set((state) => ({
        products: state.products.map((p) => (p.id === id ? { ...p, ...response.data } : p)),
        loading: false,
      }))
      return response.data
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Failed to update product"
      set({ error: errorMessage, loading: false })
      throw error
    }
  },

  deleteProduct: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const product = get().products.find(p => p.id === id)
      const storeId = product?.storeId || get().currentStore
      if (!storeId) throw new Error("No store ID provided")
      
      await apiClient.delete(`/products/${storeId}/${id}`)
      set((state) => ({
        products: state.products.filter((p) => p.id !== id),
        loading: false,
      }))
    } catch (error) {
      set({ error: "Failed to delete product", loading: false })
      throw error
    }
  },

  // Método fetchProductVariants - siempre datos frescos
  fetchProductVariants: async () => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<ProductVariant[]>("/product-variants")
      set({
        productVariants: response.data,
        loading: false,
      })
      return response.data
    } catch (error) {
      set({ error: "Failed to fetch product variants", loading: false })
      throw error
    }
  },

  createProductVariant: async (variant: any) => {
    set({ loading: true, error: null })
    try {
      const storeId = variant.storeId || get().currentStore
      const productId = variant.productId
      if (!storeId) throw new Error("No store ID provided")
      if (!productId) throw new Error("No product ID provided")
      
      const response = await apiClient.post<ProductVariant>(`/products/${storeId}/${productId}/variants`, variant)
      set((state) => ({
        productVariants: [...state.productVariants, response.data],
        loading: false,
      }))
      return response.data
    } catch (error) {
      set({ error: "Failed to create product variant", loading: false })
      throw error
    }
  },

  updateProductVariant: async (id: string, variant: any) => {
    set({ loading: true, error: null })
    try {
      const storeId = variant.storeId || get().currentStore
      if (!storeId) throw new Error("No store ID provided")
      
      const response = await apiClient.patch<ProductVariant>(`/products/${storeId}/variants/${id}`, variant)
      set((state) => ({
        productVariants: state.productVariants.map((v) => (v.id === id ? { ...v, ...response.data } : v)),
        loading: false,
      }))
      return response.data
    } catch (error) {
      set({ error: "Failed to update product variant", loading: false })
      throw error
    }
  },

  deleteProductVariant: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const storeId = get().currentStore
      if (!storeId) throw new Error("No store ID provided")
      
      await apiClient.delete(`/products/${storeId}/variants/${id}`)
      set((state) => ({
        productVariants: state.productVariants.filter((v) => v.id !== id),
        loading: false,
      }))
    } catch (error) {
      set({ error: "Failed to delete product variant", loading: false })
      throw error
    }
  },

  // Método fetchCollections - siempre datos frescos
  fetchCollections: async () => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<Collection[]>("/collections")
      set({
        collections: response.data,
        loading: false,
      })
      return response.data
    } catch (error) {
      set({ error: "Failed to fetch collections", loading: false })
      throw error
    }
  },

  // Método fetchCollectionsByStore - siempre datos frescos
  fetchCollectionsByStore: async (storeId?: string) => {
    const { currentStore } = get()
    const targetStoreId = storeId || currentStore

    if (!targetStoreId) {
      throw new Error("No store ID provided and no current store selected")
    }

    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<PaginatedResponse<Collection>>(`/collections/${targetStoreId}`)
      const collectionsData = response.data.data || []
      
      set({
        collections: collectionsData,
        loading: false,
      })
      return collectionsData
    } catch (error) {
      set({ error: "Failed to fetch collections by store", loading: false })
      throw error
    }
  },

  createCollection: async (collection: any) => {
    set({ loading: true, error: null })
    try {
      const storeId = collection.storeId || get().currentStore
      if (!storeId) throw new Error("No store ID provided")
      
      const response = await apiClient.post<Collection>(`/collections/${storeId}`, collection)
      set((state) => ({
        collections: [...state.collections, response.data],
        loading: false,
      }))
      return response.data
    } catch (error) {
      set({ error: "Failed to create collection", loading: false })
      throw error
    }
  },

  updateCollection: async (id, collection) => {
    set({ loading: true, error: null })
    try {
      const storeId = collection.storeId || get().currentStore
      if (!storeId) throw new Error("No store ID provided")
      
      const response = await apiClient.patch<Collection>(`/collections/${storeId}/${id}`, collection)
      set((state) => ({
        collections: state.collections.map((c) => (c.id === id ? { ...c, ...response.data } : c)),
        loading: false,
      }))
      return response.data
    } catch (error) {
      set({ error: "Failed to update collection", loading: false })
      throw error
    }
  },

  deleteCollection: async (id) => {
    set({ loading: true, error: null })
    try {
      const collection = get().collections.find(c => c.id === id)
      const storeId = collection?.storeId || get().currentStore
      if (!storeId) throw new Error("No store ID provided")
      
      await apiClient.delete(`/collections/${storeId}/${id}`)
      set((state) => ({
        collections: state.collections.filter((c) => c.id !== id),
        loading: false,
      }))
    } catch (error) {
      set({ error: "Failed to delete collection", loading: false })
      throw error
    }
  },

  // Método fetchHeroSections - siempre datos frescos
  fetchHeroSections: async () => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<HeroSection[]>("/hero-sections")
      set({
        heroSections: response.data,
        loading: false,
      })
      return response.data
    } catch (error) {
      set({ error: "Failed to fetch hero sections", loading: false })
      throw error
    }
  },

  // Método fetchHeroSectionsByStore - siempre datos frescos
  fetchHeroSectionsByStore: async (storeId?: string) => {
    const { currentStore } = get()
    const targetStoreId = storeId || currentStore

    if (!targetStoreId) {
      throw new Error("No store ID provided and no current store selected")
    }

    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<PaginatedResponse<HeroSection>>(`/hero-sections/${targetStoreId}`)
      const heroSectionsData = response.data.data || []
      
      set({
        heroSections: heroSectionsData,
        loading: false,
      })
      return heroSectionsData
    } catch (error) {
      set({ error: "Failed to fetch hero sections by store", loading: false })
      throw error
    }
  },

  fetchHeroSection: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const storeId = get().currentStore
      if (!storeId) throw new Error("No store ID provided")
      
      const response = await apiClient.get<HeroSection>(`/hero-sections/${storeId}/${id}`)
      set({ loading: false })
      return response.data
    } catch (error) {
      set({ error: "Failed to fetch hero section", loading: false })
      throw error
    }
  },

  createHeroSection: async (data: any) => {
    set({ loading: true, error: null })
    try {
      const storeId = data.storeId || get().currentStore
      if (!storeId) throw new Error("No store ID provided")
      
      const response = await apiClient.post<HeroSection>(`/hero-sections/${storeId}`, data)
      set((state) => ({
        heroSections: [...state.heroSections, response.data],
        loading: false,
      }))
      return response.data
    } catch (error) {
      set({ error: "Failed to create hero section", loading: false })
      throw error
    }
  },

  updateHeroSection: async (id: string, data: any) => {
    set({ loading: true, error: null })
    try {
      const storeId = data.storeId || get().currentStore
      if (!storeId) throw new Error("No store ID provided")
      
      const response = await apiClient.put<HeroSection>(`/hero-sections/${storeId}/${id}`, data)
      set((state) => ({
        heroSections: state.heroSections.map((h) => (h.id === id ? { ...h, ...response.data } : h)),
        loading: false,
      }))
      return response.data
    } catch (error) {
      set({ error: "Failed to update hero section", loading: false })
      throw error
    }
  },

  deleteHeroSection: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const heroSection = get().heroSections.find(h => h.id === id)
      const storeId = heroSection?.storeId || get().currentStore
      if (!storeId) throw new Error("No store ID provided")
      
      await apiClient.delete(`/hero-sections/${storeId}/${id}`)
      set((state) => ({
        heroSections: state.heroSections.filter((h) => h.id !== id),
        loading: false,
      }))
    } catch (error) {
      set({ error: "Failed to delete hero section", loading: false })
      throw error
    }
  },

  // Método fetchCardSections - siempre datos frescos
  fetchCardSections: async () => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<CardSection[]>("/card-section")
      set({
        cardSections: response.data,
        loading: false,
      })
      return response.data
    } catch (error) {
      set({ error: "Failed to fetch card sections", loading: false })
      throw error
    }
  },

  // Método fetchCardSectionsByStore - siempre datos frescos
  fetchCardSectionsByStore: async (storeId?: string) => {
    const { currentStore } = get()
    const targetStoreId = storeId || currentStore

    if (!targetStoreId) {
      throw new Error("No store ID provided and no current store selected")
    }

    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<CardSection[]>(`/card-section/${targetStoreId}`)
      
      set({
        cardSections: response.data,
        loading: false,
      })
      return response.data
    } catch (error) {
      set({ error: "Failed to fetch card sections by store", loading: false })
      throw error
    }
  },

  fetchCardSection: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const storeId = get().currentStore
      if (!storeId) throw new Error("No store ID provided")
      
      const response = await apiClient.get<CardSection>(`/card-section/${storeId}/${id}`)
      set({ loading: false })
      return response.data
    } catch (error) {
      set({ error: "Failed to fetch card section", loading: false })
      throw error
    }
  },

  createCardSection: async (data: any) => {
    set({ loading: true, error: null })
    try {
      const storeId = data.storeId || get().currentStore
      if (!storeId) throw new Error("No store ID provided")
      
      const response = await apiClient.post<CardSection>(`/card-section/${storeId}`, data)
      set((state) => ({
        cardSections: [...state.cardSections, response.data],
        loading: false,
      }))
      return response.data
    } catch (error) {
      set({ error: "Failed to create card section", loading: false })
      throw error
    }
  },

  updateCardSection: async (id: string, data: any) => {
    set({ loading: true, error: null })
    try {
      const storeId = data.storeId || get().currentStore
      if (!storeId) throw new Error("No store ID provided")
      
      const response = await apiClient.patch<CardSection>(`/card-section/${storeId}/${id}`, data)
      set((state) => ({
        cardSections: state.cardSections.map((c) => (c.id === id ? { ...c, ...response.data } : c)),
        loading: false,
      }))
      return response.data
    } catch (error) {
      set({ error: "Failed to update card section", loading: false })
      throw error
    }
  },

  deleteCardSection: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const cardSection = get().cardSections.find(c => c.id === id)
      const storeId = cardSection?.storeId || get().currentStore
      if (!storeId) throw new Error("No store ID provided")
      
      await apiClient.delete(`/card-section/${storeId}/${id}`)
      set((state) => ({
        cardSections: state.cardSections.filter((c) => c.id !== id),
        loading: false,
      }))
    } catch (error) {
      set({ error: "Failed to delete card section", loading: false })
      throw error
    }
  },

  // Método fetchTeamSections - siempre datos frescos
  fetchTeamSections: async () => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<TeamSection[]>("/team-sections")
      set({
        teamSections: response.data,
        loading: false,
      })
      return response.data
    } catch (error) {
      set({ error: "Failed to fetch team sections", loading: false })
      throw error
    }
  },

  // Método fetchTeamSectionsByStore - siempre datos frescos
  fetchTeamSectionsByStore: async (storeId?: string) => {
    const { currentStore } = get()
    const targetStoreId = storeId || currentStore

    if (!targetStoreId) {
      throw new Error("No store ID provided and no current store selected")
    }

    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<TeamSection[]>(`/team-sections/store/${targetStoreId}`)
      
      set({
        teamSections: response.data,
        loading: false,
      })
      return response.data
    } catch (error) {
      set({ error: "Failed to fetch team sections by store", loading: false })
      throw error
    }
  },

  fetchTeamSection: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<TeamSection>(`/team-sections/${id}`)
      set({ loading: false })
      return response.data
    } catch (error) {
      set({ error: "Failed to fetch team section", loading: false })
      throw error
    }
  },

  createTeamSection: async (data: any) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.post<TeamSection>("/team-sections", data)
      set((state) => ({
        teamSections: [...state.teamSections, response.data],
        loading: false,
      }))
      return response.data
    } catch (error) {
      set({ error: "Failed to create team section", loading: false })
      throw error
    }
  },

  updateTeamSection: async (id: string, data: any) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.patch<TeamSection>(`/team-sections/${id}`, data)
      set((state) => ({
        teamSections: state.teamSections.map((t) => (t.id === id ? { ...t, ...response.data } : t)),
        loading: false,
      }))
      return response.data
    } catch (error) {
      set({ error: "Failed to update team section", loading: false })
      throw error
    }
  },

  deleteTeamSection: async (id: string) => {
    set({ loading: true, error: null })
    try {
      await apiClient.delete(`/team-sections/${id}`)
      set((state) => ({
        teamSections: state.teamSections.filter((t) => t.id !== id),
        loading: false,
      }))
    } catch (error) {
      set({ error: "Failed to delete team section", loading: false })
      throw error
    }
  },

  // Método fetchTeamMembers - siempre datos frescos
  fetchTeamMembers: async (teamSectionId: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<TeamMember[]>(`/team-members?teamSectionId=${teamSectionId}`)
      set({
        teamMembers: response.data,
        loading: false,
      })
      return response.data
    } catch (error) {
      set({ error: "Failed to fetch team members", loading: false })
      throw error
    }
  },

  fetchTeamMember: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<TeamMember>(`/team-members/${id}`)
      set({ loading: false })
      return response.data
    } catch (error) {
      set({ error: "Failed to fetch team member", loading: false })
      throw error
    }
  },

  createTeamMember: async (teamMember: any) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.post<TeamMember>("/team-members", teamMember)
      set((state) => ({
        teamMembers: [...state.teamMembers, response.data],
        loading: false,
      }))
      return response.data
    } catch (error) {
      set({ error: "Failed to create team member", loading: false })
      throw error
    }
  },

  updateTeamMember: async (id: string, teamMember: any) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.patch<TeamMember>(`/team-members/${id}`, teamMember)
      set((state) => ({
        teamMembers: state.teamMembers.map((m) => (m.id === id ? { ...m, ...response.data } : m)),
        loading: false,
      }))
      return response.data
    } catch (error) {
      set({ error: "Failed to update team member", loading: false })
      throw error
    }
  },

  deleteTeamMember: async (id: string) => {
    set({ loading: true, error: null })
    try {
      await apiClient.delete(`/team-members/${id}`)
      set((state) => ({
        teamMembers: state.teamMembers.filter((m) => m.id !== id),
        loading: false,
      }))
    } catch (error) {
      set({ error: "Failed to delete team member", loading: false })
      throw error
    }
  },

  // Método fetchOrders - siempre datos frescos
  fetchOrders: async () => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<Order[]>("/orders")
      set({
        orders: response.data,
        loading: false,
      })
      return response.data
    } catch (error) {
      set({ error: "Failed to fetch orders", loading: false })
      throw error
    }
  },

  // Método fetchOrdersByStore - siempre datos frescos
  fetchOrdersByStore: async (storeId?: string) => {
    const { currentStore } = get()
    const targetStoreId = storeId || currentStore

    if (!targetStoreId) {
      throw new Error("No store ID provided and no current store selected")
    }

    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<PaginatedResponse<Order>>(`/orders/${targetStoreId}`)
      const ordersData = response.data.data || []
      
      set({
        orders: ordersData,
        loading: false,
      })
      return ordersData
    } catch (error) {
      set({ error: "Failed to fetch orders by store", loading: false })
      throw error
    }
  },

  createOrder: async (data: any) => {
    set({ loading: true, error: null })
    try {
      const storeId = data.storeId || get().currentStore
      if (!storeId) throw new Error("No store ID provided")
      
      const response = await apiClient.post<Order>(`/orders/${storeId}`, data)
      set((state) => ({
        orders: [...state.orders, response.data],
        loading: false,
      }))
      return response.data
    } catch (error) {
      set({ error: "Failed to create order", loading: false })
      throw error
    }
  },

  updateOrder: async (id: string, data: any) => {
    set({ loading: true, error: null })
    try {
      const storeId = data.storeId || get().currentStore
      if (!storeId) throw new Error("No store ID provided")
      
      const response = await apiClient.put<Order>(`/orders/${storeId}/${id}`, data)
      set((state) => ({
        orders: state.orders.map((order) => (order.id === id ? { ...order, ...response.data } : order)),
        loading: false,
      }))
      return response.data
    } catch (error) {
      set({ error: "Failed to update order", loading: false })
      throw error
    }
  },

  deleteOrder: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const order = get().orders.find(o => o.id === id)
      const storeId = order?.storeId || get().currentStore
      if (!storeId) throw new Error("No store ID provided")
      
      await apiClient.delete(`/orders/${storeId}/${id}`)
      set((state) => ({
        orders: state.orders.filter((order) => order.id !== id),
        loading: false,
      }))
    } catch (error) {
      set({ error: "Failed to delete order", loading: false })
      throw error
    }
  },

  createRefund: async (data: any) => {
    set({ loading: true, error: null })
    try {
      await apiClient.post("/refunds", data)
      set({ loading: false })
    } catch (error) {
      set({ error: "Failed to create refund", loading: false })
      throw error
    }
  },

  // Método fetchCustomers - siempre datos frescos
  fetchCustomers: async () => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<Customer[]>("/customers")
      set({
        customers: response.data,
        loading: false,
      })
      return response.data
    } catch (error) {
      set({ error: "Failed to fetch customers", loading: false })
      throw error
    }
  },

  // Método fetchCustomersByStore - siempre datos frescos
  fetchCustomersByStore: async (storeId?: string) => {
    const { currentStore } = get()
    const targetStoreId = storeId || currentStore

    if (!targetStoreId) {
      throw new Error("No store ID provided and no current store selected")
    }

    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<Customer[]>(`/customers?storeId=${targetStoreId}`)
      set({
        customers: response.data,
        loading: false,
      })
      return response.data
    } catch (error) {
      set({ error: "Failed to fetch customers by store", loading: false })
      throw error
    }
  },

  createCustomer: async (customer: any) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.post<Customer>("/customers", customer)
      set((state) => ({
        customers: [...state.customers, response.data],
        loading: false,
      }))
      return response.data
    } catch (error) {
      set({ error: "Failed to create customer", loading: false })
      throw error
    }
  },

  updateCustomer: async (id: string, customer: any) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.put<Customer>(`/customers/${id}`, customer)
      set((state) => ({
        customers: state.customers.map((c) => (c.id === id ? { ...c, ...response.data } : c)),
        loading: false,
      }))
      return response.data
    } catch (error) {
      set({ error: "Failed to update customer", loading: false })
      throw error
    }
  },

  deleteCustomer: async (id: string) => {
    set({ loading: true, error: null })
    try {
      await apiClient.delete(`/customers/${id}`)
      set((state) => ({
        customers: state.customers.filter((c) => c.id !== id),
        loading: false,
      }))
    } catch (error) {
      set({ error: "Failed to delete customer", loading: false })
      throw error
    }
  },

  // Método fetchCoupons - siempre datos frescos
  fetchCoupons: async () => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<Coupon[]>("/coupons")
      set({
        coupons: response.data,
        loading: false,
      })
      return response.data
    } catch (error) {
      set({ error: "Failed to fetch coupons", loading: false })
      throw error
    }
  },

  // Método fetchCouponsByStore - siempre datos frescos
  fetchCouponsByStore: async (storeId?: string) => {
    const { currentStore } = get()
    const targetStoreId = storeId || currentStore
    
    if (!targetStoreId) {
      throw new Error("No store ID provided and no current store selected")
    }

    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<PaginatedResponse<Coupon>>(`/coupons/${targetStoreId}`)
      const couponsData = response.data.data || []
      
      set({
        coupons: couponsData,
        loading: false,
      })
      return couponsData
    } catch (error) {
      set({ error: "Failed to fetch coupons by store", loading: false })
      throw error
    }
  },

  createCoupon: async (coupon: any) => {
    set({ loading: true, error: null })
    try {
      const storeId = coupon.storeId || get().currentStore
      if (!storeId) throw new Error("No store ID provided")
      
      const response = await apiClient.post<Coupon>(`/coupons/${storeId}`, coupon)
      set((state) => ({
        coupons: [...state.coupons, response.data],
        loading: false,
      }))
      return response.data
    } catch (error) {
      set({ error: "Failed to create coupon", loading: false })
      throw error
    }
  },

  updateCoupon: async (id: string, coupon: any) => {
    set({ loading: true, error: null })
    try {
      const storeId = coupon.storeId || get().currentStore
      if (!storeId) throw new Error("No store ID provided")
      
      const response = await apiClient.put<Coupon>(`/coupons/${storeId}/${id}`, coupon)
      set((state) => ({
        coupons: state.coupons.map((c) => (c.id === id ? { ...c, ...response.data } : c)),
        loading: false,
      }))
      return response.data
    } catch (error) {
      set({ error: "Failed to update coupon", loading: false })
      throw error
    }
  },

  deleteCoupon: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const coupon = get().coupons.find(c => c.id === id)
      const storeId = coupon?.storeId || get().currentStore
      if (!storeId) throw new Error("No store ID provided")
      
      await apiClient.delete(`/coupons/${storeId}/${id}`)
      set((state) => ({
        coupons: state.coupons.filter((c) => c.id !== id),
        loading: false,
      }))
    } catch (error) {
      set({ error: "Failed to delete coupon", loading: false })
      throw error
    }
  },

  // Método fetchShippingMethods - siempre datos frescos
  fetchShippingMethods: async () => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<ShippingMethod[]>("/shipping-methods")
      set({
        shippingMethods: response.data,
        loading: false,
      })
      return response.data
    } catch (error) {
      set({ error: "Failed to fetch shipping methods", loading: false })
      throw error
    }
  },

  // Método fetchShippingMethodsByStore - siempre datos frescos
  fetchShippingMethodsByStore: async (storeId?: string) => {
    const { currentStore } = get()
    const targetStoreId = storeId || currentStore

    if (!targetStoreId) {
      throw new Error("No store ID provided and no current store selected")
    }

    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<PaginatedResponse<ShippingMethod>>(`/shipping-methods/${targetStoreId}`)
      const shippingMethodsData = response.data.data || []
      
      set({
        shippingMethods: shippingMethodsData,
        loading: false,
      })
      return shippingMethodsData
    } catch (error) {
      set({ error: "Failed to fetch shipping methods by store", loading: false })
      throw error
    }
  },

  createShippingMethod: async (method: any) => {
    set({ loading: true, error: null })
    try {
      const storeId = method.storeId || get().currentStore
      if (!storeId) throw new Error("No store ID provided")
      
      const response = await apiClient.post<ShippingMethod>(`/shipping-methods/${storeId}`, method)
      set((state) => ({
        shippingMethods: [...state.shippingMethods, response.data],
        loading: false,
      }))
      return response.data
    } catch (error) {
      set({ error: "Failed to create shipping method", loading: false })
      throw error
    }
  },

  updateShippingMethod: async (id: string, method: any) => {
    set({ loading: true, error: null })
    try {
      const storeId = method.storeId || get().currentStore
      if (!storeId) throw new Error("No store ID provided")
      
      const response = await apiClient.patch<ShippingMethod>(`/shipping-methods/${storeId}/${id}`, method)
      set((state) => ({
        shippingMethods: state.shippingMethods.map((m) => (m.id === id ? { ...m, ...response.data } : m)),
        loading: false,
      }))
      return response.data
    } catch (error) {
      set({ error: "Failed to update shipping method", loading: false })
      throw error
    }
  },

  deleteShippingMethod: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const shippingMethod = get().shippingMethods.find(m => m.id === id)
      const storeId = shippingMethod?.storeId || get().currentStore
      if (!storeId) throw new Error("No store ID provided")
      
      await apiClient.delete(`/shipping-methods/${storeId}/${id}`)
      set((state) => ({
        shippingMethods: state.shippingMethods.filter((m) => m.id !== id),
        loading: false,
      }))
    } catch (error) {
      set({ error: "Failed to delete shipping method", loading: false })
      throw error
    }
  },

fetchCountries: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get<GeographicDataResponse>("/shipping-methods/geographic-data");
      
      if (response.data.type !== 'countries') {
        throw new Error("Invalid response type - expected countries");
      }

      const countryData = response.data.data as Country[];
      set({
        countries: countryData,
        loading: false,
      });
      return countryData;
    } catch (error) {
      set({ error: "Failed to fetch countries", loading: false });
      throw error;
    }
  },

  fetchStatesByCountry: async (countryCode: string) => {
    const { states } = get();

    set({ loading: true, error: null });
    try {
      const response = await apiClient.get<GeographicDataResponse>(
        `/shipping-methods/geographic-data?countryCode=${countryCode}`
      );

      if (response.data.type !== 'states') {
        throw new Error("Invalid response type - expected states");
      }

      const stateData = response.data.data as State[];
      
      const updatedStates = [
        ...states.filter(s => s.countryCode !== countryCode),
        ...stateData
      ];

      set({
        states: updatedStates,
        loading: false,
      });
      return stateData;
    } catch (error) {
      set({ error: `Failed to fetch states for country ${countryCode}`, loading: false });
      throw error;
    }
  },

  fetchCitiesByState: async (stateId: string) => {
    const { cities } = get();

    set({ loading: true, error: null });
    try {
      const response = await apiClient.get<GeographicDataResponse>(
        `/shipping-methods/geographic-data?stateId=${stateId}`
      );

      if (response.data.type !== 'cities') {
        throw new Error("Invalid response type - expected cities");
      }

      const cityData = response.data.data as City[];
      
      const updatedCities = [
        ...cities.filter(c => c.stateId !== stateId),
        ...cityData
      ];

      set({
        cities: updatedCities,
        loading: false,
      });
      return cityData;
    } catch (error) {
      set({ error: `Failed to fetch cities for state ${stateId}`, loading: false });
      throw error;
    }
  },
  searchGeographicData: async (searchTerm: string, type?: "country" | "state" | "city") => {
    if (!searchTerm || searchTerm.length < 2) {
      return { countries: [], states: [], cities: [] }
    }

    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<{
        countries: Country[]
        states: State[]
        cities: City[]
      }>(`/shipping-methods/geographic-data/search?q=${encodeURIComponent(searchTerm)}${type ? `&type=${type}` : ''}`)
      
      set({ loading: false })
      return response.data
    } catch (error) {
      set({ error: "Failed to search geographic data", loading: false })
      throw error
    }
  },

  // Método fetchPaymentProviders - siempre datos frescos
  fetchPaymentProviders: async () => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<PaymentProvider[]>("/payment-providers")
      set({
        paymentProviders: response.data,
        loading: false,
      })
      return response.data
    } catch (error) {
      set({ error: "Failed to fetch payment providers", loading: false })
      throw error
    }
  },

  // Método fetchPaymentTransactions - siempre datos frescos
  fetchPaymentTransactions: async () => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<PaginatedResponse<PaymentTransaction>>("/payment-transactions")
      const transactionsData = response.data.data || []
      
      set({
        paymentTransactions: transactionsData,
        loading: false,
      })
      return transactionsData
    } catch (error) {
      set({ error: "Failed to fetch payment transactions", loading: false })
      throw error
    }
  },

  createPaymentProvider: async (data: any) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.post<PaymentProvider>("/payment-providers", data)
      set((state) => ({
        paymentProviders: [...state.paymentProviders, response.data],
        loading: false,
      }))
      return response.data
    } catch (error) {
      set({ error: "Failed to create payment provider", loading: false })
      throw error
    }
  },

  updatePaymentProvider: async (id: string, data: any) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.put<PaymentProvider>(`/payment-providers/${id}`, data)
      set((state) => ({
        paymentProviders: state.paymentProviders.map((provider) =>
          provider.id === id ? { ...provider, ...response.data } : provider,
        ),
        loading: false,
      }))
      return response.data
    } catch (error) {
      set({ error: "Failed to update payment provider", loading: false })
      throw error
    }
  },

  deletePaymentProvider: async (id: string) => {
    set({ loading: true, error: null })
    try {
      await apiClient.delete(`/payment-providers/${id}`)
      set((state) => ({
        paymentProviders: state.paymentProviders.filter((provider) => provider.id !== id),
        loading: false,
      }))
    } catch (error) {
      set({ error: "Failed to delete payment provider", loading: false })
      throw error
    }
  },

  createPaymentTransaction: async (data: any) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.post<PaymentTransaction>("/payment-transactions", data)
      set((state) => ({
        paymentTransactions: [...state.paymentTransactions, response.data],
        loading: false,
      }))
      return response.data
    } catch (error) {
      set({ error: "Failed to create payment transaction", loading: false })
      throw error
    }
  },

  updatePaymentTransaction: async (id: string, data: any) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.put<PaymentTransaction>(`/payment-transactions/${id}`, data)
      set((state) => ({
        paymentTransactions: state.paymentTransactions.map((transaction) =>
          transaction.id === id ? { ...transaction, ...response.data } : transaction,
        ),
        loading: false,
      }))
      return response.data
    } catch (error) {
      set({ error: "Failed to update payment transaction", loading: false })
      throw error
    }
  },

  // Método fetchContents - siempre datos frescos
  fetchContents: async () => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<Content[]>("/contents")
      set({
        contents: response.data,
        loading: false,
      })
      return response.data
    } catch (error) {
      set({ error: "Failed to fetch contents", loading: false })
      throw error
    }
  },

  fetchContentsByStore: async (storeId?: string) => {
    set({ loading: true, error: null })
    try {
      const targetStoreId = storeId || get().currentStore
      if (!targetStoreId) throw new Error("No store ID provided and no current store selected")

      const response = await apiClient.get<PaginatedResponse<Content>>(`/contents/${targetStoreId}`)
      
      // Extraer los datos de la respuesta paginada
      const contentsData = response.data.data || []
      
      set({ loading: false })
      return contentsData
    } catch (error) {
      set({ error: "Failed to fetch contents by store", loading: false })
      throw error
    }
  },

  fetchContent: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const storeId = get().currentStore
      if (!storeId) throw new Error("No store ID provided")
      
      const response = await apiClient.get<Content>(`/contents/${storeId}/${id}`)
      set({ loading: false })
      return response.data
    } catch (error) {
      set({ error: "Failed to fetch content", loading: false })
      throw error
    }
  },

  createContent: async (content: any) => {
    set({ loading: true, error: null })
    try {
      const storeId = content.storeId || get().currentStore
      if (!storeId) throw new Error("No store ID provided")
      
      const response = await apiClient.post<Content>(`/contents/${storeId}`, content)
      set((state) => ({
        contents: [...state.contents, response.data],
        loading: false,
      }))
      return response.data
    } catch (error) {
      set({ error: "Failed to create content", loading: false })
      throw error
    }
  },

  updateContent: async (id: string, content: any) => {
    set({ loading: true, error: null })
    try {
      const storeId = content.storeId || get().currentStore
      if (!storeId) throw new Error("No store ID provided")
      
      const response = await apiClient.put<Content>(`/contents/${storeId}/${id}`, content)
      set((state) => ({
        contents: state.contents.map((c) => (c.id === id ? { ...c, ...response.data } : c)),
        loading: false,
      }))
      return response.data
    } catch (error) {
      set({ error: "Failed to update content", loading: false })
      throw error
    }
  },

  deleteContent: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const content = get().contents.find(c => c.id === id)
      const storeId = content?.storeId || get().currentStore
      if (!storeId) throw new Error("No store ID provided")
      
      await apiClient.delete(`/contents/${storeId}/${id}`)
      set((state) => ({
        contents: state.contents.filter((c) => c.id !== id),
        loading: false,
      }))
    } catch (error) {
      set({ error: "Failed to delete content", loading: false })
      throw error
    }
  },

  // User actions
  fetchUsers: async (storeId?: string) => {
    set({ loading: true, error: null })
    try {
      // Si se proporciona storeId, obtener usuarios de esa tienda específica
      // Si no, obtener todos los usuarios
      const endpoint = storeId ? `/auth/store/${storeId}` : "/auth"
      console.log(`DEBUG: Fetching users from endpoint: ${endpoint}`)

      const response = await apiClient.get<User[]>(endpoint)
      set({ users: response.data, loading: false })
      return response.data
    } catch (error) {
      console.error("ERROR fetching users:", error)
      set({ error: "Failed to fetch users", loading: false })
      throw error
    }
  },

  createUser: async (user: any) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.post<User>("/auth/register", user)
      set((state) => ({
        users: [...state.users, response.data],
        loading: false,
      }))
      return response.data
    } catch (error) {
      set({ error: "Failed to create user", loading: false })
      throw error
    }
  },

  updateUser: async (id: string, user: any) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.patch<User>(`/auth/${id}`, user)
      set((state) => ({
        users: state.users.map((u) => (u.id === id ? { ...u, ...response.data } : u)),
        loading: false,
      }))
      return response.data
    } catch (error) {
      set({ error: "Failed to update user", loading: false })
      throw error
    }
  },

  deleteUser: async (id: string) => {
    set({ loading: true, error: null })
    try {
      await apiClient.delete(`/auth/${id}`)
      set((state) => ({
        users: state.users.filter((u) => u.id !== id),
        loading: false,
      }))
    } catch (error) {
      set({ error: "Failed to delete user", loading: false })
      throw error
    }
  },

  // Métodos para Store
  setCurrentStore: (storeId) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("currentStoreId", storeId)
    }
    
    // Limpiar el estado cuando se cambia de store para evitar mostrar datos del store anterior
    get().clearStoreData()
    
    set({ currentStore: storeId })
  },

  fetchStores: async (owner) => {
    console.log("[fetchStores] called with owner:", owner)
    set({ loading: true, error: null })

    try {
      console.log("[fetchStores] Fetching stores from API...")
      const response = await apiClient.get<PaginatedResponse<Store>>(`/stores/owner/${owner}`)
      console.log("[fetchStores] Response:", response.data)

      // Extraer los datos de la respuesta paginada
      const storesData = response.data.data || []

      // No need to filter as the endpoint now returns only stores for the specified owner
      set({ stores: storesData, loading: false })
      return storesData
    } catch (error) {
      console.error("[fetchStores] Error occurred:", error)
      set({ error: "Failed to fetch stores", loading: false })
      throw error
    }
  },

  getCurrentStore: () => {
    const { currentStore, stores } = get()
    if (!currentStore || !stores.length) return null
    return stores.find((store) => store.id === currentStore) || null
  },

  getStoreById: (id: string) => {
    return get().stores.find((store) => store.id === id)
  },

  createStore: async (storeData: CreateStoreDto) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.post<Store>("/stores", storeData)
      set((state) => ({
        stores: [...state.stores, response.data],
        loading: false,
      }))
      return response.data
    } catch (error) {
      set({ error: "Failed to create store", loading: false })
      throw error
    }
  },

  updateStore: async (id: string, storeData: UpdateStoreDto) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.patch<Store>(`/stores/${id}`, storeData)
      set((state) => ({
        stores: state.stores.map((s) => (s.id === id ? { ...s, ...response.data } : s)),
        loading: false,
      }))
      return response.data
    } catch (error) {
      set({ error: "Failed to update store", loading: false })
      throw error
    }
  },

  deleteStore: async (id: string) => {
    set({ loading: true, error: null })
    try {
      await apiClient.delete(`/stores/${id}`)
      set((state) => ({
        stores: state.stores.filter((s) => s.id !== id),
        loading: false,
      }))
    } catch (error) {
      set({ error: "Failed to delete store", loading: false })
      throw error
    }
  },

  // Métodos para ShopSettings - ACTUALIZADO PARA USAR LOS ENDPOINTS CORRECTOS
  fetchShopSettings: async (storeId?: string) => {
    console.log("fetchShopSettings called with storeId:", storeId)
    console.log("Current store:", get().currentStore)

    set({ loading: true, error: null })

    try {
      const { currentStore } = get()
      const targetStoreId = storeId || currentStore

      // Si no hay tienda seleccionada, no intentamos obtener configuraciones
      if (!targetStoreId) {
        console.log("No store selected, skipping fetchShopSettings")
        set({ loading: false })
        return []
      }

      console.log("Fetching shop settings for storeId:", targetStoreId)
      const url = `/shop-settings/store/${targetStoreId}`
      console.log("Request URL:", url)

      const response = await apiClient.get<ShopSettings[]>(url)
      console.log("Shop settings response:", response.data)

      set({
        shopSettings: Array.isArray(response.data) ? response.data : [response.data],
        loading: false,
      })

      return Array.isArray(response.data) ? response.data : [response.data]
    } catch (error) {
      console.error("Error in fetchShopSettings:", error)
      set({ error: "Failed to fetch shop settings", loading: false })
      return []
    }
  },

  fetchShopSettingsByStore: async (storeId?: string) => {
    set({ loading: true, error: null })
    try {
      const targetStoreId = storeId || get().currentStore
      if (!targetStoreId) throw new Error("No store ID provided and no current store selected")

      const response = await apiClient.get<ShopSettings>(`/shop-settings/store/${targetStoreId}`)
      
      // Verificar que la configuración pertenece al store correcto
      if (response.data.storeId !== targetStoreId) {
        throw new Error("Shop settings do not belong to the specified store")
      }
      
      set({ loading: false })
      return response.data
    } catch (error) {
      set({ error: "Failed to fetch shop settings by store", loading: false })
      throw error
    }
  },

  saveShopSettings: async (settings: any) => {
    set({ loading: true, error: null })
    try {
      // Verificar si ya existen configuraciones para esta tienda
      const { currentStore, shopSettings } = get()
      const storeSettings = shopSettings.find((s) => s.storeId === currentStore)

      let response
      if (storeSettings) {
        // Si ya existen, actualizar
        response = await apiClient.put<ShopSettings>(`/shop-settings/store/${currentStore}`, settings)
      } else {
        // Si no existen, crear
        const newSettings = {
          ...settings,
          storeId: currentStore,
        }
        response = await apiClient.post<ShopSettings>("/shop-settings", newSettings)
      }

      // Actualizar el estado
      set((state) => ({
        shopSettings: storeSettings
          ? state.shopSettings.map((s) => (s.id === storeSettings.id ? response.data : s))
          : [...state.shopSettings, response.data],
        loading: false,
      }))

      return response.data
    } catch (error) {
      set({ error: "Failed to save shop settings", loading: false })
      throw error
    }
  },

  createShopSettings: async (settings: CreateShopSettingsDto) => {
    console.log("🚀 Starting createShopSettings with data:", settings)
    set({ loading: true, error: null })
    try {
      console.log("📤 Sending request to create shop settings:", settings)
      const response = await apiClient.post<ShopSettings>("/shop-settings", settings)
      console.log("✅ Shop settings created successfully:", response.data)
      console.log("📊 Response status:", response.status)

      set((state) => {
        console.log("🔄 Updating state with new shop settings")
        return {
          shopSettings: [...state.shopSettings, response.data],
          loading: false,
        }
      })
      return response.data
    } catch (error: unknown) {
      console.error("❌ Error creating shop settings:", error)

      // Manejo seguro del error
      if (error && typeof error === "object") {
        if ("response" in error && error.response && typeof error.response === "object") {
          console.error("📝 Error details:", (error.response as any).data)
        }
        if ("message" in error) {
          console.error("📝 Error message:", error.message)
        }
      }

      console.error("🔍 Request that caused the error:", settings)
      set({ error: "Failed to create shop settings", loading: false })
      throw error
    }
  },

  updateShopSettings: async (id: string, settings: UpdateShopSettingsDto) => {
    console.log("🚀 Starting updateShopSettings for ID:", id)
    console.log("📋 Update data:", settings)
    set({ loading: true, error: null })
    try {
      // Usar el endpoint correcto según el controlador
      const storeId = get().shopSettings.find((s) => s.id === id)?.storeId
      console.log("🔍 Found storeId for shop settings:", storeId)

      if (!storeId) {
        console.error("❌ Store ID not found for shop settings with ID:", id)
        throw new Error("Store ID not found for shop settings")
      }

      console.log("📤 Sending update request to endpoint:", `/shop-settings/store/${storeId}`)
      const response = await apiClient.patch<ShopSettings>(`/shop-settings/store/${storeId}`, settings)
      console.log("✅ Shop settings updated successfully:", response.data)
      console.log("📊 Response status:", response.status)

      set((state) => {
        console.log("🔄 Updating state with modified shop settings")
        return {
          shopSettings: state.shopSettings.map((s) => (s.id === id ? { ...s, ...response.data } : s)),
          loading: false,
        }
      })
      return response.data
    } catch (error: unknown) {
      console.error("❌ Error updating shop settings:", error)

      // Manejo seguro del error
      if (error && typeof error === "object") {
        if ("response" in error && error.response && typeof error.response === "object") {
          console.error("📝 Error details:", (error.response as any).data)
        }
        if ("message" in error) {
          console.error("📝 Error message:", error.message)
        }
      }

      console.error("🔍 Request that caused the error:", { id, settings })
      set({ error: "Failed to update shop settings", loading: false })
      throw error
    }
  },

  addAcceptedCurrency: async (shopId: string, currencyId: string) => {
    set({ loading: true, error: null })
    try {
      const storeId = get().shopSettings.find((s) => s.id === shopId)?.storeId

      if (!storeId) {
        throw new Error("Store ID not found for shop settings")
      }

      const response = await apiClient.post<ShopSettings>(`/shop-settings/store/${storeId}/currencies/${currencyId}`)

      set((state) => ({
        shopSettings: state.shopSettings.map((s) => (s.id === shopId ? response.data : s)),
        loading: false,
      }))
      return response.data
    } catch (error) {
      set({ error: "Failed to add accepted currency", loading: false })
      throw error
    }
  },

  removeAcceptedCurrency: async (shopId: string, currencyId: string) => {
    set({ loading: true, error: null })
    try {
      const storeId = get().shopSettings.find((s) => s.id === shopId)?.storeId

      if (!storeId) {
        throw new Error("Store ID not found for shop settings")
      }

      const response = await apiClient.delete<ShopSettings>(`/shop-settings/store/${storeId}/currencies/${currencyId}`)

      set((state) => ({
        shopSettings: state.shopSettings.map((s) => (s.id === shopId ? response.data : s)),
        loading: false,
      }))
      return response.data
    } catch (error) {
      set({ error: "Failed to remove accepted currency", loading: false })
      throw error
    }
  },

  // Currency actions con paginación
  fetchCurrencies: async () => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<PaginatedResponse<Currency>>(`/currencies`)
      
      // Extraer los datos de la respuesta paginada
      const currenciesData = response.data.data || []
      
      set({ currencies: currenciesData, loading: false })
      return currenciesData
    } catch (error) {
      set({ error: "Failed to fetch currencies", loading: false })
      throw error
    }
  },

  createCurrency: async (currency: any) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.post<Currency>("/currencies", currency)
      set((state) => ({
        currencies: [...state.currencies, response.data],
        loading: false,
      }))
      return response.data
    } catch (error) {
      set({ error: "Failed to create currency", loading: false })
      throw error
    }
  },

  updateCurrency: async (id: string, currency: any) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.put<Currency>(`/currencies/${id}`, currency)
      set((state) => ({
        currencies: state.currencies.map((c) => (c.id === id ? { ...c, ...response.data } : c)),
        loading: false,
      }))
      return response.data
    } catch (error) {
      set({ error: "Failed to update currency", loading: false })
      throw error
    }
  },

  deleteCurrency: async (id: string) => {
    set({ loading: true, error: null })
    try {
      await apiClient.delete(`/currencies/${id}`)
      set((state) => ({
        currencies: state.currencies.filter((c) => c.id !== id),
        loading: false,
      }))
    } catch (error) {
      set({ error: "Failed to delete currency", loading: false })
      throw error
    }
  },

  // Exchange Rate actions con paginación
  fetchExchangeRates: async () => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<PaginatedResponse<ExchangeRate>>("/exchange-rates")
      
      // Extraer los datos de la respuesta paginada
      const exchangeRatesData = response.data.data || []
      
      set({ exchangeRates: exchangeRatesData, loading: false })
      return exchangeRatesData
    } catch (error) {
      set({ error: "Failed to fetch exchange rates", loading: false })
      throw error
    }
  },

  createExchangeRate: async (exchangeRate: any) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.post<ExchangeRate>("/exchange-rates", exchangeRate)
      set((state) => ({
        exchangeRates: [...state.exchangeRates, response.data],
        loading: false,
      }))
      return response.data
    } catch (error) {
      set({ error: "Failed to create exchange rate", loading: false })
      throw error
    }
  },

  updateExchangeRate: async (id: string, exchangeRate: any) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.put<ExchangeRate>(`/exchange-rates/${id}`, exchangeRate)
      set((state) => ({
        exchangeRates: state.exchangeRates.map((er) => (er.id === id ? { ...er, ...response.data } : er)),
        loading: false,
      }))
      return response.data
    } catch (error) {
      set({ error: "Failed to update exchange rate", loading: false })
      throw error
    }
  },

  deleteExchangeRate: async (id: string) => {
    set({ loading: true, error: null })
    try {
      await apiClient.delete(`/exchange-rates/${id}`)
      set((state) => ({
        exchangeRates: state.exchangeRates.filter((er) => er.id !== id),
        loading: false,
      }))
    } catch (error) {
      set({ error: "Failed to delete exchange rate", loading: false })
      throw error
    }
  },

  // Método fetchFrequentlyBoughtTogether - siempre datos frescos
  fetchFrequentlyBoughtTogether: async () => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<FrequentlyBoughtTogether[]>("/frequently-bought-together")
      set({
        frequentlyBoughtTogether: response.data,
        loading: false,
      })
      return response.data
    } catch (error) {
      set({ error: "Failed to fetch frequently bought together items", loading: false })
      throw error
    }
  },

  fetchFrequentlyBoughtTogetherByStore: async (storeId?: string) => {
    const { currentStore } = get()
    const targetStoreId = storeId || currentStore

    if (!targetStoreId) {
      throw new Error("No store ID provided and no current store selected")
    }

    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<PaginatedResponse<FrequentlyBoughtTogether>>(
        `/fbt/${targetStoreId}`,
      )
      const fbtData = response.data.data || []
      
      set({
        frequentlyBoughtTogether: fbtData,
        loading: false,
      })
      return fbtData
    } catch (error) {
      set({ error: "Failed to fetch frequently bought together items by store", loading: false })
      throw error
    }
  },

  fetchFrequentlyBoughtTogetherById: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const storeId = get().currentStore
      if (!storeId) throw new Error("No store ID provided")
      
      const response = await apiClient.get<FrequentlyBoughtTogether>(`/fbt/${storeId}/${id}`)
      set({ loading: false })
      return response.data
    } catch (error) {
      set({ error: "Failed to fetch frequently bought together item", loading: false })
      throw error
    }
  },

  createFrequentlyBoughtTogether: async (data: any) => {
    set({ loading: true, error: null })
    try {
      const storeId = data.storeId || get().currentStore
      if (!storeId) throw new Error("No store ID provided")
      
      const response = await apiClient.post<FrequentlyBoughtTogether>(`/fbt/${storeId}`, data)
      set((state) => ({
        frequentlyBoughtTogether: [...state.frequentlyBoughtTogether, response.data],
        loading: false,
      }))
      return response.data
    } catch (error) {
      set({ error: "Failed to create frequently bought together item", loading: false })
      throw error
    }
  },

  updateFrequentlyBoughtTogether: async (id: string, data: any) => {
    set({ loading: true, error: null })
    try {
      const storeId = data.storeId || get().currentStore
      if (!storeId) throw new Error("No store ID provided")
      
      const response = await apiClient.patch<FrequentlyBoughtTogether>(`/fbt/${storeId}/${id}`, data)
      set((state) => ({
        frequentlyBoughtTogether: state.frequentlyBoughtTogether.map((item) =>
          item.id === id ? { ...item, ...response.data } : item,
        ),
        loading: false,
      }))
      return response.data
    } catch (error) {
      set({ error: "Failed to update frequently bought together item", loading: false })
      throw error
    }
  },

  deleteFrequentlyBoughtTogether: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const fbt = get().frequentlyBoughtTogether.find(f => f.id === id)
      const storeId = fbt?.storeId || get().currentStore
      if (!storeId) throw new Error("No store ID provided")
      
      await apiClient.delete(`/fbt/${storeId}/${id}`)
      set((state) => ({
        frequentlyBoughtTogether: state.frequentlyBoughtTogether.filter((item) => item.id !== id),
        loading: false,
      }))
    } catch (error) {
      set({ error: "Failed to delete frequently bought together item", loading: false })
      throw error
    }
  },

  // Utility functions
  refreshData: async () => {
    set({ loading: true, error: null })
    try {
      const [
        storesResponse,
        categoriesResponse,
        productsResponse,
        productVariantsResponse,
        collectionsResponse,
        ordersResponse,
        customersResponse,
        couponsResponse,
        shippingMethodsResponse,
        paymentProvidersResponse,
        contentsResponse,
        usersResponse,
        shopSettingsResponse,
        currenciesResponse,
        exchangeRatesResponse,
        heroSectionsResponse,
        cardSectionsResponse,
        teamSectionsResponse,
      ] = await Promise.all([
        apiClient.get("/stores"),
        apiClient.get("/categories"),
        apiClient.get("/products"),
        apiClient.get("/product-variants"),
        apiClient.get("/collections"),
        apiClient.get("/order"),
        apiClient.get("/customers"),
        apiClient.get("/coupon"),
        apiClient.get("/shipping-methods"),
        apiClient.get("/payment-providers"),
        apiClient.get("/content"),
        apiClient.get("/auth"),
        apiClient.get("/shop"),
        apiClient.get("/currencies"),
        apiClient.get("/exchange-rates"),
        apiClient.get("/hero-section"),
        apiClient.get("/card-section"),
        apiClient.get("/team-sections"),
      ])

      set({
        stores: storesResponse.data,
        categories: categoriesResponse.data,
        products: productsResponse.data,
        productVariants: productVariantsResponse.data,
        collections: collectionsResponse.data,
        heroSections: heroSectionsResponse.data,
        cardSections: cardSectionsResponse.data,
        teamSections: teamSectionsResponse.data,
        orders: ordersResponse.data,
        customers: customersResponse.data,
        coupons: couponsResponse.data,
        shippingMethods: shippingMethodsResponse.data,
        paymentProviders: paymentProvidersResponse.data,
        contents: contentsResponse.data,
        users: usersResponse.data,
        shopSettings: shopSettingsResponse.data,
        currencies: currenciesResponse.data,
        exchangeRates: exchangeRatesResponse.data,
        loading: false,
      })

      // Si no hay tienda seleccionada y hay tiendas disponibles, seleccionar la primera
      const { currentStore } = get()
      if (!currentStore && storesResponse.data.length > 0) {
        get().setCurrentStore(storesResponse.data[0].id)
      }
    } catch (error) {
      set({ error: "Failed to refresh data", loading: false })
      throw error
    }
  },

  clearStoreData: () => {
    set({
      categories: [],
      products: [],
      productVariants: [],
      collections: [],
      orders: [],
      customers: [],
      heroSections: [],
      cardSections: [],
      teamSections: [],
      teamMembers: [],
      coupons: [],
      shippingMethods: [],
      contents: [],
      shopSettings: [],
      frequentlyBoughtTogether: [],
      productsPagination: null,
    })
  },

  getCategoryById: (id) => {
    const category = get().categories.find((category) => category.id === id)
    if (category) {
      return {
        ...category,
        parent: category.parentId ? get().categories.find((c) => c.id === category.parentId) : undefined,
        children: get().categories.filter((c) => c.parentId === category.id),
      }
    }
    return undefined
  },

  getProductById: (id) => {
    return get().products.find((product) => product.id === id)
  },

  getCollectionById: (id) => {
    return get().collections.find((collection) => collection.id === id)
  },

  getOrderById: (id) => {
    return get().orders.find((order) => order.id === id)
  },

  getCustomerById: (id) => {
    return get().customers.find((customer) => customer.id === id)
  },

  getCouponById: (id) => {
    return get().coupons.find((coupon) => coupon.id === id)
  },

  getCurrencyById: (id) => {
    return get().currencies.find((currency) => currency.id === id)
  },

  getExchangeRateById: (id) => {
    return get().exchangeRates.find((exchangeRate) => exchangeRate.id === id)
  },
}))
