import { create } from "zustand"
import apiClient from "@/lib/axiosConfig"
import type { Product } from "@/types/product"
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
import { FrequentlyBoughtTogether } from "@/types/fbt"
import type { ProductSearchParams, PaginatedResponse } from "@/types/pagination"
// Agregar la importación del tipo FrequentlyBoughtTogether

// Definir duración del caché (5 minutos)
const CACHE_DURATION = 5 * 60 * 1000

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
  // Agregar la propiedad frequentlyBoughtTogether al interface MainStore
  frequentlyBoughtTogether: FrequentlyBoughtTogether[]
  lastFetch: {
    categories: number | null
    products: number | null
    productVariants: number | null
    collections: number | null
    orders: number | null
    customers: number | null
    coupons: number | null
    shippingMethods: number | null
    paymentProviders: number | null
    contents: number | null
    heroSections: number | null
    cardSections: number | null
    teamMembers: number | null
    users: number | null
    shopSettings: number | null
    currencies: number | null
    exchangeRates: number | null
    countries: number | null
    states: Record<string, number>; // Cache por país {countryCode: timestamp}
    cities: Record<string, number>; // Cache por estado {stateId: timestamp}
    // Agregar la propiedad frequentlyBoughtTogether al interface MainStore
    frequentlyBoughtTogether: number | null
  }

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
  fetchProductsByStore: (storeId?: string) => Promise<Product[]>
  fetchProductsPaginated: (storeId: string, params?: ProductSearchParams) => Promise<any>
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
  // Agregar la propiedad frequentlyBoughtTogether al estado inicial
  frequentlyBoughtTogether: [],
  lastFetch: {
    categories: null,
    products: null,
    productVariants: null,
    collections: null,
    orders: null,
    customers: null,
    heroSections: null,
    cardSections: null,
    teamMembers: null,
    coupons: null,
    countries: null,
    states: {},
    cities: {},
    shippingMethods: null,
    paymentProviders: null,
    contents: null,
    users: null,
    shopSettings: null,
    currencies: null,
    exchangeRates: null,
    // Agregar la propiedad frequentlyBoughtTogether al estado inicial
    frequentlyBoughtTogether: null,
  },
  currentStore: null,
  stores: [],

  setEndpoint: (endpoint) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("endpoint", endpoint)
    }
    set({ endpoint })
  },

  // Método fetchCategories mejorado con caché
  fetchCategories: async () => {
    const { categories, lastFetch } = get()
    const now = Date.now()

    // Verificar si hay datos en caché y si el caché aún es válido
    if (categories.length > 0 && lastFetch.categories && now - lastFetch.categories < CACHE_DURATION) {
      return categories
    }

    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<Category[]>(`/categories/${get().currentStore}`)
      set({
        categories: response.data,
        loading: false,
        lastFetch: { ...get().lastFetch, categories: now },
      })
      return response.data
    } catch (error) {
      set({ error: "Failed to fetch categories", loading: false })
      throw error
    }
  },

  // Método fetchCategoriesByStore mejorado con caché
  fetchCategoriesByStore: async (storeId?: string) => {
    const { categories, lastFetch, currentStore } = get()
    const now = Date.now()
    const targetStoreId = storeId || currentStore

    if (!targetStoreId) {
      throw new Error("No store ID provided and no current store selected")
    }

    // Verificar si hay categorías en caché para esta tienda y si el caché aún es válido
    // Filtrar por storeId para asegurar que solo se usen datos del store correcto
    const cachedCategories = categories.filter(category => category.storeId === targetStoreId)
    if (
      cachedCategories.length > 0 &&
      lastFetch.categories &&
      now - lastFetch.categories < CACHE_DURATION
    ) {
      return cachedCategories
    }

    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<Category[]>(`/categories/${targetStoreId}`)
      
      // Filtrar las categorías por storeId como medida de seguridad
      const filteredCategories = response.data.filter(category => category.storeId === targetStoreId)
      
      set({
        categories: filteredCategories,
        loading: false,
        lastFetch: { ...get().lastFetch, categories: now },
      })
      return filteredCategories
    } catch (error) {
      set({ error: "Failed to fetch categories by store", loading: false })
      throw error
    }
  },

  createCategory: async (category: any) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.post<Category>(`/categories/${get().currentStore}`, category)
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
      const response = await apiClient.put<Category>(`/categories/${get().currentStore}/${id}`, category)
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
      await apiClient.delete(`/categories/${get().currentStore}/${id}`)
      set((state) => ({
        categories: state.categories.filter((c) => c.id !== id),
        loading: false,
      }))
    } catch (error) {
      set({ error: "Failed to delete category", loading: false })
      throw error
    }
  },

  // Método fetchProducts mejorado con caché
  fetchProducts: async () => {
    const { products, lastFetch } = get()
    const now = Date.now()

    // Verificar si hay datos en caché y si el caché aún es válido
    if (products.length > 0 && lastFetch.products && now - lastFetch.products < CACHE_DURATION) {
      return products
    }

    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<Product[]>(`/products/store/${get().currentStore}`)
      set({
        products: response.data,
        loading: false,
        lastFetch: { ...get().lastFetch, products: now },
      })
      return response.data
    } catch (error) {
      set({ error: "Failed to fetch products", loading: false })
      throw error
    }
  },

  // Método fetchProductsByStore mejorado con caché
  fetchProductsByStore: async (storeId?: string) => {
    const { products, lastFetch, currentStore } = get()
    const now = Date.now()
    const targetStoreId = storeId || currentStore

    if (!targetStoreId) {
      throw new Error("No store ID provided and no current store selected")
    }

    // Verificar si hay productos en caché para esta tienda y si el caché aún es válido
    // Filtrar por storeId para asegurar que solo se usen datos del store correcto
    const cachedProducts = products.filter(product => product.storeId === targetStoreId)
    if (
      cachedProducts.length > 0 &&
      lastFetch.products &&
      now - lastFetch.products < CACHE_DURATION
    ) {
      return cachedProducts
    }

    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<Product[]>(`/products/store/${targetStoreId}`)
      
      // Filtrar los productos por storeId como medida de seguridad
      const filteredProducts = response.data.filter(product => product.storeId === targetStoreId)
      
      set({
        products: filteredProducts,
        loading: false,
        lastFetch: { ...get().lastFetch, products: now },
      })
      return filteredProducts
    } catch (error) {
      set({ error: "Failed to fetch products by store", loading: false })
      throw error
    }
  },

  // Función para obtener productos paginados con filtros
  fetchProductsPaginated: async (storeId: string, params?: ProductSearchParams) => {
    const searchParams = new URLSearchParams()
    
    // Parámetros de paginación
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy)
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder)
    
    // Filtros específicos de productos
    if (params?.query) searchParams.set('query', params.query)
    if (params?.vendor) searchParams.set('vendor', params.vendor)
    if (params?.categoryIds) {
      params.categoryIds.forEach(id => searchParams.append('categoryIds', id))
    }
    if (params?.collectionIds) {
      params.collectionIds.forEach(id => searchParams.append('collectionIds', id))
    }
    if (params?.status) {
      params.status.forEach(status => searchParams.append('status', status))
    }

    const url = `/products/store/${storeId}?${searchParams.toString()}`
    
    console.log('🔗 Full API URL being called:', url);
    console.log('📝 Search params sent:', Object.fromEntries(searchParams.entries()));
    
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<any>(url)
      
      console.log('📦 Raw API Response:', {
        status: response.status,
        responseData: response.data,
        responseKeys: Object.keys(response.data || {}),
        metaKeys: Object.keys(response.data?.meta || {}),
        paginationKeys: Object.keys(response.data?.pagination || {})
      });
      
      // El backend DEBERÍA devolver la estructura estándar según la documentación
      const currentPage = response.data.pagination?.page || response.data.meta?.currentPage || response.data.page || 1;
      const totalPages = response.data.pagination?.totalPages || response.data.meta?.totalPages || response.data.totalPages || 0;
      
      console.log('📄 Pagination calculation: New Structure', {
        currentPage,
        totalPages,
        requestedLimit: params?.limit,
        hasPaginationObject: !!response.data.pagination,
        hasMetaObject: !!response.data.meta,
        paginationData: response.data.pagination,
        metaData: response.data.meta
      });

      // Según la documentación del backend, la estructura correcta es:
      const backendPagination = response.data.pagination;
      const backendData = response.data.data;
      
      // Si el backend tiene el formato correcto según la documentación
      if (backendPagination && backendData) {
        console.log('✅ Backend format detected - using standard pagination structure');
        return {
          data: backendData,
          pagination: {
            page: backendPagination.page,
            limit: backendPagination.limit,
            total: backendPagination.total,
            totalPages: backendPagination.totalPages,
            hasNext: backendPagination.hasNext,
            hasPrev: backendPagination.hasPrev,
          }
        };
      }
      
      // Fallback para formatos antiguos (legacy)
      console.log('⚠️ Legacy format detected - using fallback pagination');
      return {
        data: response.data.data || response.data.items || [],
        pagination: {
          page: currentPage,
          // IMPORTANTE: Usar el límite que solicitamos, no el que devuelve el servidor
          limit: params?.limit || response.data.meta?.itemsPerPage || response.data.limit || 20,
          total: response.data.meta?.totalItems || response.data.total || 0,
          totalPages: totalPages,
          hasNext: currentPage < totalPages,
          hasPrev: currentPage > 1,
        }
      }
    } catch (error) {
      set({ error: "Failed to fetch products", loading: false })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  createProduct: async (product: any) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.post<Product>(`/products/${get().currentStore}`, product)
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
      const response = await apiClient.put<Product>(`/products/${get().currentStore}/${id}`, product)
      set((state) => ({
        products: state.products.map((p) => (p.id === id ? { ...p, ...response.data } : p)),
        loading: false,
      }))
      return response.data
    } catch (error) {
      set({ error: "Failed to update product", loading: false })
      throw error
    }
  },

  deleteProduct: async (id: string) => {
    set({ loading: true, error: null })
    try {
      await apiClient.delete(`/products/${get().currentStore}/${id}`)
      set((state) => ({
        products: state.products.filter((p) => p.id !== id),
        loading: false,
      }))
    } catch (error) {
      set({ error: "Failed to delete product", loading: false })
      throw error
    }
  },

  // Método fetchProductVariants mejorado con caché
  fetchProductVariants: async () => {
    const { productVariants, lastFetch } = get()
    const now = Date.now()

    // Verificar si hay datos en caché y si el caché aún es válido
    if (productVariants.length > 0 && lastFetch.productVariants && now - lastFetch.productVariants < CACHE_DURATION) {
      return productVariants
    }

    set({ loading: true, error: null })
    try {
      // Note: Product variants in backend are nested under products:
      // - GET /products/{storeId}/{productId}/variants/{variantId} - get specific variant
      // - POST /products/{storeId}/{productId}/variants - create variant for product
      // - PUT /products/{storeId}/variants/{variantId} - update variant
      // - DELETE /products/{storeId}/variants/{variantId} - delete variant
      
      // There's no direct endpoint to get ALL variants, they need to be fetched per product
      console.warn('fetchProductVariants: No direct endpoint exists in backend. Variants are nested under products.')
      set({
        productVariants: [],
        loading: false,
        lastFetch: { ...get().lastFetch, productVariants: now },
      })
      return []
    } catch (error) {
      set({ error: "Failed to fetch product variants", loading: false })
      throw error
    }
  },

  createProductVariant: async (variant: any) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.post<ProductVariant>(`/products/${get().currentStore}/${variant.productId}/variants`, variant)
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
      const response = await apiClient.put<ProductVariant>(`/products/${get().currentStore}/variants/${id}`, variant)
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
      await apiClient.delete(`/products/store/${get().currentStore}/variants/${id}`)
      set((state) => ({
        productVariants: state.productVariants.filter((v) => v.id !== id),
        loading: false,
      }))
    } catch (error) {
      set({ error: "Failed to delete product variant", loading: false })
      throw error
    }
  },

  // Método fetchCollections mejorado con caché
  fetchCollections: async () => {
    const { collections, lastFetch } = get()
    const now = Date.now()

    // Verificar si hay datos en caché y si el caché aún es válido
    if (collections.length > 0 && lastFetch.collections && now - lastFetch.collections < CACHE_DURATION) {
      return collections
    }

    set({ loading: true, error: null })
    try {
        const response = await apiClient.get<Collection[]>(`/collections/${get().currentStore}`)
      set({
        collections: response.data,
        loading: false,
        lastFetch: { ...get().lastFetch, collections: now },
      })
      return response.data
    } catch (error) {
      set({ error: "Failed to fetch collections", loading: false })
      throw error
    }
  },

  // Método fetchCollectionsByStore mejorado con caché
  fetchCollectionsByStore: async (storeId?: string) => {
    const { collections, lastFetch, currentStore } = get()
    const now = Date.now()
    const targetStoreId = storeId || currentStore

    if (!targetStoreId) {
      throw new Error("No store ID provided and no current store selected")
    }

    // Verificar si hay colecciones en caché para esta tienda y si el caché aún es válido
    // Filtrar por storeId para asegurar que solo se usen datos del store correcto
    const cachedCollections = collections.filter(collection => collection.storeId === targetStoreId)
    if (
      cachedCollections.length > 0 &&
      lastFetch.collections &&
      now - lastFetch.collections < CACHE_DURATION
    ) {
      return cachedCollections
    }

    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<Collection[]>(`/collections/${targetStoreId}`)
      
      // Filtrar las colecciones por storeId como medida de seguridad
      const filteredCollections = response.data.filter(collection => collection.storeId === targetStoreId)
      
      set({
        collections: filteredCollections,
        loading: false,
        lastFetch: { ...get().lastFetch, collections: now },
      })
      return filteredCollections
    } catch (error) {
      set({ error: "Failed to fetch collections by store", loading: false })
      throw error
    }
  },

  createCollection: async (collection: any) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.post<Collection>(`/collections/${get().currentStore}`, collection)
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
      const response = await apiClient.patch<Collection>(`/collections/${get().currentStore}/${id}`, collection)
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
      await apiClient.delete(`/collections/${get().currentStore}/${id}`)
      set((state) => ({
        collections: state.collections.filter((c) => c.id !== id),
        loading: false,
      }))
    } catch (error) {
      set({ error: "Failed to delete collection", loading: false })
      throw error
    }
  },

  // Método fetchHeroSections mejorado con caché
  fetchHeroSections: async () => {
    const { heroSections, lastFetch } = get()
    const now = Date.now()

    // Verificar si hay datos en caché y si el caché aún es válido
    if (heroSections.length > 0 && lastFetch.heroSections && now - lastFetch.heroSections < CACHE_DURATION) {
      return heroSections
    }

    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<HeroSection[]>(`/hero-sections/${get().currentStore}`)
      set({
        heroSections: response.data,
        loading: false,
        lastFetch: { ...get().lastFetch, heroSections: now },
      })
      return response.data
    } catch (error) {
      set({ error: "Failed to fetch hero sections", loading: false })
      throw error
    }
  },

  // Método fetchHeroSectionsByStore mejorado con caché
  fetchHeroSectionsByStore: async (storeId?: string) => {
    const { heroSections, lastFetch, currentStore } = get()
    const now = Date.now()
    const targetStoreId = storeId || currentStore

    if (!targetStoreId) {
      throw new Error("No store ID provided and no current store selected")
    }

    // Verificar si hay secciones de héroe en caché para esta tienda y si el caché aún es válido
    // Filtrar por storeId para asegurar que solo se usen datos del store correcto
    const cachedHeroSections = heroSections.filter(heroSection => heroSection.storeId === targetStoreId)
    if (
      cachedHeroSections.length > 0 &&
      lastFetch.heroSections &&
      now - lastFetch.heroSections < CACHE_DURATION
    ) {
      return cachedHeroSections
    }

    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<HeroSection[]>(`/hero-sections/${targetStoreId}`)
      
      // Filtrar las secciones de héroe por storeId como medida de seguridad
      const filteredHeroSections = response.data.filter(heroSection => heroSection.storeId === targetStoreId)
      
      set({
        heroSections: filteredHeroSections,
        loading: false,
        lastFetch: { ...get().lastFetch, heroSections: now },
      })
      return filteredHeroSections
    } catch (error) {
      set({ error: "Failed to fetch hero sections by store", loading: false })
      throw error
    }
  },

  fetchHeroSection: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<HeroSection>(`/hero-sections/${get().currentStore}/${id}`)
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
      const response = await apiClient.post<HeroSection>(`/hero-sections/${get().currentStore}`, data)
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
      const response = await apiClient.put<HeroSection>(`/hero-sections/${get().currentStore}/${id}`, data)
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
      await apiClient.delete(`/hero-sections/${get().currentStore}/${id}`)
      set((state) => ({
        heroSections: state.heroSections.filter((h) => h.id !== id),
        loading: false,
      }))
    } catch (error) {
      set({ error: "Failed to delete hero section", loading: false })
      throw error
    }
  },

  // Método fetchCardSections mejorado con caché
  fetchCardSections: async () => {
    const { cardSections, lastFetch } = get()
    const now = Date.now()

    // Verificar si hay datos en caché y si el caché aún es válido
    if (cardSections.length > 0 && lastFetch.cardSections && now - lastFetch.cardSections < CACHE_DURATION) {
      return cardSections
    }

    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<CardSection[]>(`/card-section/${get().currentStore}`)
      set({
        cardSections: response.data,
        loading: false,
        lastFetch: { ...get().lastFetch, cardSections: now },
      })
      return response.data
    } catch (error) {
      set({ error: "Failed to fetch card sections", loading: false })
      throw error
    }
  },

  // Método fetchCardSectionsByStore mejorado con caché
  fetchCardSectionsByStore: async (storeId?: string) => {
    const { cardSections, lastFetch, currentStore } = get()
    const now = Date.now()
    const targetStoreId = storeId || currentStore

    if (!targetStoreId) {
      throw new Error("No store ID provided and no current store selected")
    }

    // Verificar si hay secciones de tarjetas en caché para esta tienda y si el caché aún es válido
    // Filtrar por storeId para asegurar que solo se usen datos del store correcto
    const cachedCardSections = cardSections.filter(cardSection => cardSection.storeId === targetStoreId)
    if (
      cachedCardSections.length > 0 &&
      lastFetch.cardSections &&
      now - lastFetch.cardSections < CACHE_DURATION
    ) {
      return cachedCardSections
    }

    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<CardSection[]>(`/card-section/${targetStoreId}`)
      
      // Filtrar las secciones de tarjetas por storeId como medida de seguridad
      const filteredCardSections = response.data.filter(cardSection => cardSection.storeId === targetStoreId)
      
      set({
        cardSections: filteredCardSections,
        loading: false,
        lastFetch: { ...get().lastFetch, cardSections: now },
      })
      return filteredCardSections
    } catch (error) {
      set({ error: "Failed to fetch card sections by store", loading: false })
      throw error
    }
  },

  fetchCardSection: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<CardSection>(`/card-section/${get().currentStore}/${id}`)
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
      const response = await apiClient.post<CardSection>(`/card-section/${get().currentStore}`, data)
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
      const response = await apiClient.patch<CardSection>(`/card-section/${get().currentStore}/${id}`, data)
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
      await apiClient.delete(`/card-section/${get().currentStore}/${id}`)
      set((state) => ({
        cardSections: state.cardSections.filter((c) => c.id !== id),
        loading: false,
      }))
    } catch (error) {
      set({ error: "Failed to delete card section", loading: false })
      throw error
    }
  },

  // Método fetchTeamSections mejorado con caché
  fetchTeamSections: async () => {
    const { teamSections, lastFetch } = get()
    const now = Date.now()

    // Verificar si hay datos en caché y si el caché aún es válido
    if (teamSections.length > 0 && lastFetch.teamMembers && now - lastFetch.teamMembers < CACHE_DURATION) {
      return teamSections
    }

    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<TeamSection[]>("/team-sections")
      set({
        teamSections: response.data,
        loading: false,
        lastFetch: { ...get().lastFetch, teamMembers: now },
      })
      return response.data
    } catch (error) {
      set({ error: "Failed to fetch team sections", loading: false })
      throw error
    }
  },

  // Método fetchTeamSectionsByStore mejorado con caché
  fetchTeamSectionsByStore: async (storeId?: string) => {
    const { teamSections, lastFetch, currentStore } = get()
    const now = Date.now()
    const targetStoreId = storeId || currentStore

    if (!targetStoreId) {
      throw new Error("No store ID provided and no current store selected")
    }

    // Verificar si hay secciones de equipo en caché para esta tienda y si el caché aún es válido
    // Filtrar por storeId para asegurar que solo se usen datos del store correcto
    const cachedTeamSections = teamSections.filter(teamSection => teamSection.storeId === targetStoreId)
    if (
      cachedTeamSections.length > 0 &&
      lastFetch.teamMembers &&
      now - lastFetch.teamMembers < CACHE_DURATION
    ) {
      return cachedTeamSections
    }

    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<TeamSection[]>(`/team-sections/store/${targetStoreId}`)
      
      // Filtrar las secciones de equipo por storeId como medida de seguridad
      const filteredTeamSections = response.data.filter(teamSection => teamSection.storeId === targetStoreId)
      
      set({
        teamSections: filteredTeamSections,
        loading: false,
        lastFetch: { ...get().lastFetch, teamMembers: now },
      })
      return filteredTeamSections
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

  // Método fetchTeamMembers mejorado con caché
  fetchTeamMembers: async (teamSectionId: string) => {
    const { teamMembers, lastFetch } = get()
    const now = Date.now()

    // Verificar si hay datos en caché para esta sección de equipo y si el caché aún es válido
    if (
      teamMembers.length > 0 &&
      teamMembers[0]?.teamSectionId === teamSectionId &&
      lastFetch.teamMembers &&
      now - lastFetch.teamMembers < CACHE_DURATION
    ) {
      return teamMembers
    }

    set({ loading: true, error: null })
    try {
      // Note: Team members are nested under team-sections in backend
      // GET /team-sections/{teamSectionId} includes members in the response

      // First, get all team sections for the store
      const teamSectionsResponse = await apiClient.get(`/team-sections/store/${teamSectionId}`)
      const teamSections = teamSectionsResponse.data || []
      
      // Extract all members from all team sections
      const allMembers = teamSections.flatMap((section: any) => section.members || [])
      
      set({
        teamMembers: allMembers,
        loading: false,
        lastFetch: { ...get().lastFetch, teamMembers: now },
      })
      return allMembers
    } catch (error) {
      set({ error: "Failed to fetch team members", loading: false })
      throw error
    }
  },

  fetchTeamMember: async (id: string) => {
    set({ loading: true, error: null })
    try {
      // Note: Team members are nested under team-sections in backend
      console.warn('findTeamMember: Team members are nested under team-sections in backend.')
      throw new Error('Individual team member lookup not supported - use team-sections endpoint')
    } catch (error) {
      set({ error: "Failed to fetch team member", loading: false })
      throw error
    }
  },

  createTeamMember: async (teamMember: any) => {
    set({ loading: true, error: null })
    try {
      // Note: Team members are nested under team-sections in backend
      console.warn('createTeamMember: Team members are nested under team-sections in backend.')
      throw new Error('Individual team member creation not supported - update team-section with members array')
    } catch (error) {
      set({ error: "Failed to create team member", loading: false })
      throw error
    }
  },

  updateTeamMember: async (id: string, teamMember: any) => {
    set({ loading: true, error: null })
    try {
      // Note: Team members are nested under team-sections in backend
      console.warn('updateTeamMember: Team members are nested under team-sections in backend.')
      throw new Error('Individual team member update not supported - update team-section with members array')
    } catch (error) {
      set({ error: "Failed to update team member", loading: false })
      throw error
    }
  },

  deleteTeamMember: async (id: string) => {
    set({ loading: true, error: null })
    try {
      // Note: Team members are nested under team-sections in backend
      console.warn('deleteTeamMember: Team members are nested under team-sections in backend.')
      throw new Error('Individual team member deletion not supported - update team-section with members array')
    } catch (error) {
      set({ error: "Failed to delete team member", loading: false })
      throw error
    }
  },

  // Método fetchOrders mejorado con caché
  fetchOrders: async () => {
    const { orders, lastFetch } = get()
    const now = Date.now()

    // Verificar si hay datos en caché y si el caché aún es válido
    if (orders.length > 0 && lastFetch.orders && now - lastFetch.orders < CACHE_DURATION) {
      return orders
    }

    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<Order[]>(`/orders/${get().currentStore}`)
      set({
        orders: response.data,
        loading: false,
        lastFetch: { ...get().lastFetch, orders: now },
      })
      return response.data
    } catch (error) {
      set({ error: "Failed to fetch orders", loading: false })
      throw error
    }
  },

  // Método fetchOrdersByStore mejorado con caché
  fetchOrdersByStore: async (storeId?: string) => {
    const { orders, lastFetch, currentStore } = get()
    const now = Date.now()
    const targetStoreId = storeId || currentStore

    if (!targetStoreId) {
      throw new Error("No store ID provided and no current store selected")
    }

    // Verificar si hay órdenes en caché para esta tienda y si el caché aún es válido
    // Filtrar por storeId para asegurar que solo se usen datos del store correcto
    const cachedOrders = orders.filter(order => order.storeId === targetStoreId)
    if (
      cachedOrders.length > 0 &&
      lastFetch.orders &&
      now - lastFetch.orders < CACHE_DURATION
    ) {
      return cachedOrders
    }

    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<Order[]>(`/orders/${targetStoreId}`)
      
      // Filtrar las órdenes por storeId como medida de seguridad
      const filteredOrders = response.data.filter(order => order.storeId === targetStoreId)
      
      set({
        orders: filteredOrders,
        loading: false,
        lastFetch: { ...get().lastFetch, orders: now },
      })
      return filteredOrders
    } catch (error) {
      set({ error: "Failed to fetch orders by store", loading: false })
      throw error
    }
  },

  createOrder: async (data: any) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.post<Order>(`/orders/${get().currentStore}`, data)
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
      const response = await apiClient.put<Order>(`/orders/${get().currentStore}/${id}`, data)
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
      await apiClient.delete(`/orders/${get().currentStore}/${id}`)
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

  // Método fetchCustomers mejorado con caché
  fetchCustomers: async () => {
    const { customers, lastFetch } = get()
    const now = Date.now()

    // Verificar si hay datos en caché y si el caché aún es válido
    if (customers.length > 0 && lastFetch.customers && now - lastFetch.customers < CACHE_DURATION) {
      return customers
    }

    set({ loading: true, error: null })
    try {
      // Note: No independent customers endpoint in backend
      // Customers are managed as part of orders (customerInfo field)
      console.warn('fetchCustomers: No independent customers endpoint exists in backend.')
      set({
        customers: [],
        loading: false,
        lastFetch: { ...get().lastFetch, customers: now },
      })
      return []
    } catch (error) {
      set({ error: "Failed to fetch customers", loading: false })
      throw error
    }
  },

  // Método fetchCustomersByStore mejorado con caché
  fetchCustomersByStore: async (storeId?: string) => {
    const { customers, lastFetch, currentStore } = get()
    const now = Date.now()
    const targetStoreId = storeId || currentStore

    if (!targetStoreId) {
      throw new Error("No store ID provided and no current store selected")
    }

    // Verificar si hay clientes en caché para esta tienda y si el caché aún es válido
    set({ loading: true, error: null })
    try {
      // Note: No customers endpoint exists in backend - customers are managed through orders
      console.warn('fetchCustomersByStore: No customers endpoint exists in backend.')
      set({
        customers: [],
        loading: false,
        lastFetch: { ...get().lastFetch, customers: now },
      })
      return []
    } catch (error) {
      set({ error: "Failed to fetch customers by store", loading: false })
      throw error
    }
  },

  createCustomer: async (customer: any) => {
    set({ loading: true, error: null })
    try {
      // Note: No independent customers endpoint in backend
      console.warn('createCustomer: No independent customers endpoint exists in backend.')
      throw new Error('Customer creation not supported - customers are managed through orders')
    } catch (error) {
      set({ error: "Failed to create customer", loading: false })
      throw error
    }
  },

  updateCustomer: async (id: string, customer: any) => {
    set({ loading: true, error: null })
    try {
      // Note: No independent customers endpoint in backend
      console.warn('updateCustomer: No independent customers endpoint exists in backend.')
      throw new Error('Customer update not supported - customers are managed through orders')
    } catch (error) {
      set({ error: "Failed to update customer", loading: false })
      throw error
    }
  },

  deleteCustomer: async (id: string) => {
    set({ loading: true, error: null })
    try {
      // Note: No independent customers endpoint in backend
      console.warn('deleteCustomer: No independent customers endpoint exists in backend.')
      throw new Error('Customer deletion not supported - customers are managed through orders')
    } catch (error) {
      set({ error: "Failed to delete customer", loading: false })
      throw error
    }
  },

  // Método fetchCoupons mejorado con caché
  fetchCoupons: async () => {
    const { coupons, lastFetch } = get()
    const now = Date.now()

    // Verificar si hay datos en caché y si el caché aún es válido
    if (coupons.length > 0 && lastFetch.coupons && now - lastFetch.coupons < CACHE_DURATION) {
      return coupons
    }

    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<Coupon[]>(`/coupons/${get().currentStore}`)
      set({
        coupons: response.data,
        loading: false,
        lastFetch: { ...get().lastFetch, coupons: now },
      })
      return response.data
    } catch (error) {
      set({ error: "Failed to fetch coupons", loading: false })
      throw error
    }
  },

  // Método fetchCouponsByStore mejorado con caché
  fetchCouponsByStore: async (storeId?: string) => {
    const { coupons, lastFetch, currentStore } = get()
    const now = Date.now()
    const targetStoreId = storeId || currentStore
    
    if (!targetStoreId) {
      throw new Error("No store ID provided and no current store selected")
    }

    // Verificar si hay cupones en caché para esta tienda y si el caché aún es válido
    // Filtrar por storeId para asegurar que solo se usen datos del store correcto
    const cachedCoupons = coupons.filter(coupon => coupon.storeId === targetStoreId)
    if (
      cachedCoupons.length > 0 &&
      lastFetch.coupons &&
      now - lastFetch.coupons < CACHE_DURATION
    ) {
      return cachedCoupons
    }

    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<Coupon[]>(`/coupons/${targetStoreId}`)
      
      // Filtrar los cupones por storeId como medida de seguridad
      const filteredCoupons = response.data.filter(coupon => coupon.storeId === targetStoreId)
      
      set({
        coupons: filteredCoupons,
        loading: false,
        lastFetch: { ...get().lastFetch, coupons: now },
      })
      return filteredCoupons
    } catch (error) {
      set({ error: "Failed to fetch coupons by store", loading: false })
      throw error
    }
  },

  createCoupon: async (coupon: any) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.post<Coupon>(`/coupons/${get().currentStore}`, coupon)
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
      const response = await apiClient.put<Coupon>(`/coupons/${get().currentStore}/${id}`, coupon)
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
      await apiClient.delete(`/coupons/${get().currentStore}/${id}`)
      set((state) => ({
        coupons: state.coupons.filter((c) => c.id !== id),
        loading: false,
      }))
    } catch (error) {
      set({ error: "Failed to delete coupon", loading: false })
      throw error
    }
  },

  // Método fetchShippingMethods mejorado con caché
  fetchShippingMethods: async () => {
    const { shippingMethods, lastFetch } = get()
    const now = Date.now()

    // Verificar si hay datos en caché y si el caché aún es válido
    if (shippingMethods.length > 0 && lastFetch.shippingMethods && now - lastFetch.shippingMethods < CACHE_DURATION) {
      return shippingMethods
    }

    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<ShippingMethod[]>(`/shipping-methods/${get().currentStore}`)
      set({
        shippingMethods: response.data,
        loading: false,
        lastFetch: { ...get().lastFetch, shippingMethods: now },
      })
      return response.data
    } catch (error) {
      set({ error: "Failed to fetch shipping methods", loading: false })
      throw error
    }
  },

  // Método fetchShippingMethodsByStore mejorado con caché
  fetchShippingMethodsByStore: async (storeId?: string) => {
    const { shippingMethods, lastFetch, currentStore } = get()
    const now = Date.now()
    const targetStoreId = storeId || currentStore

    if (!targetStoreId) {
      throw new Error("No store ID provided and no current store selected")
    }

    // Verificar si hay métodos de envío en caché para esta tienda y si el caché aún es válido
    // Filtrar por storeId para asegurar que solo se usen datos del store correcto
    const cachedShippingMethods = shippingMethods.filter(shippingMethod => shippingMethod.storeId === targetStoreId)
    if (
      cachedShippingMethods.length > 0 &&
      lastFetch.shippingMethods &&
      now - lastFetch.shippingMethods < CACHE_DURATION
    ) {
      return cachedShippingMethods
    }

    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<ShippingMethod[]>(`/shipping-methods/${targetStoreId}`)
      
      // Filtrar los métodos de envío por storeId como medida de seguridad
      const filteredShippingMethods = response.data.filter(shippingMethod => shippingMethod.storeId === targetStoreId)
      
      set({
        shippingMethods: filteredShippingMethods,
        loading: false,
        lastFetch: { ...get().lastFetch, shippingMethods: now },
      })
      return filteredShippingMethods
    } catch (error) {
      set({ error: "Failed to fetch shipping methods by store", loading: false })
      throw error
    }
  },

  createShippingMethod: async (method: any) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.post<ShippingMethod>(`/shipping-methods/${get().currentStore}`, method)
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
      const response = await apiClient.patch<ShippingMethod>(`/shipping-methods/${get().currentStore}/${id}`, method)
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
      await apiClient.delete(`/shipping-methods/${get().currentStore}/${id}`)
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
    const { countries, lastFetch } = get();
    const now = Date.now();
    const CACHE_DURATION = 1000 * 60 * 30; // 30 minutos

    console.log(`[fetchCountries] Inicio - countries en cache: ${countries.length}, lastFetch: ${lastFetch.countries ? new Date(lastFetch.countries).toISOString() : 'nunca'}`);

    if (countries.length > 0 && lastFetch.countries && now - lastFetch.countries < CACHE_DURATION) {
      console.log('[fetchCountries] Retornando datos de caché');
      return countries;
    }

    console.log('[fetchCountries] Haciendo request a la API');
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get<GeographicDataResponse>("/shipping-methods/geographic-data");
      
      console.log('[fetchCountries] Respuesta recibida:', { status: response.status, dataType: response.data.type });

      if (response.data.type !== 'countries') {
        console.error('[fetchCountries] Tipo de respuesta inválido:', response.data.type);
        throw new Error("Invalid response type - expected countries");
      }

      const countryData = response.data.data as Country[];
      console.log('[fetchCountries] Datos recibidos:', { count: countryData.length });
      
      set({
        countries: countryData,
        loading: false,
        lastFetch: { ...get().lastFetch, countries: now },
      });
      return countryData;
    } catch (error) {
      console.error('[fetchCountries] Error:', error);
      set({ error: "Failed to fetch countries", loading: false });
      throw error;
    }
  },

  fetchStatesByCountry: async (countryCode: string) => {
    const { states, lastFetch } = get();
    const now = Date.now();
    const CACHE_DURATION = 1000 * 60 * 30; // 30 minutos

    console.log(`[fetchStatesByCountry] Inicio - countryCode: ${countryCode}, estados en cache: ${states.filter(s => s.countryCode === countryCode).length}, lastFetch: ${lastFetch.states[countryCode] ? new Date(lastFetch.states[countryCode]).toISOString() : 'nunca'}`);

    // Verificar caché
    if (lastFetch.states[countryCode] && now - lastFetch.states[countryCode] < CACHE_DURATION) {
      const cachedStates = states.filter(s => s.countryCode === countryCode);
      console.log('[fetchStatesByCountry] Retornando datos de caché:', { count: cachedStates.length });
      return cachedStates;
    }

    console.log('[fetchStatesByCountry] Haciendo request a la API');
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get<GeographicDataResponse>(
        `/shipping-methods/geographic-data?countryCode=${countryCode}`
      );
      
      console.log('[fetchStatesByCountry] Respuesta recibida:', { status: response.status, dataType: response.data.type });

      if (response.data.type !== 'states') {
        console.error('[fetchStatesByCountry] Tipo de respuesta inválido:', response.data.type);
        throw new Error("Invalid response type - expected states");
      }

      const stateData = response.data.data as State[];
      console.log('[fetchStatesByCountry] Datos recibidos:', stateData);
      
      // Filtrar estados existentes de este país y agregar los nuevos
      const updatedStates = [
        ...states.filter(s => s.countryCode !== countryCode),
        ...stateData
      ];

      console.log('[fetchStatesByCountry] Estados actualizados:', { total: updatedStates.length, nuevos: stateData.length });

      set({
        states: updatedStates,
        loading: false,
        lastFetch: { 
          ...get().lastFetch, 
          states: { 
            ...get().lastFetch.states, 
            [countryCode]: now 
          } 
        },
      });
      return stateData;
    } catch (error) {
      console.error('[fetchStatesByCountry] Error:', error);
      set({ error: `Failed to fetch states for country ${countryCode}`, loading: false });
      throw error;
    }
  },

  fetchCitiesByState: async (stateId: string) => {
    const { cities, lastFetch } = get();
    const now = Date.now();
    const CACHE_DURATION = 1000 * 60 * 30; // 30 minutos

    console.log(`[fetchCitiesByState] Inicio - stateId: ${stateId}, ciudades en cache: ${cities.filter(c => c.stateId === stateId).length}, lastFetch: ${lastFetch.cities[stateId] ? new Date(lastFetch.cities[stateId]).toISOString() : 'nunca'}`);

    // Verificar caché
    if (lastFetch.cities[stateId] && now - lastFetch.cities[stateId] < CACHE_DURATION) {
      const cachedCities = cities.filter(c => c.stateId === stateId);
      console.log('[fetchCitiesByState] Retornando datos de caché:', { count: cachedCities.length });
      return cachedCities;
    }

    console.log('[fetchCitiesByState] Haciendo request a la API');
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get<GeographicDataResponse>(
        `/shipping-methods/geographic-data?stateId=${stateId}`
      );
      
      console.log('[fetchCitiesByState] Respuesta recibida:', { status: response.status, dataType: response.data.type });

      if (response.data.type !== 'cities') {
        console.error('[fetchCitiesByState] Tipo de respuesta inválido:', response.data.type);
        throw new Error("Invalid response type - expected cities");
      }

      const cityData = response.data.data as City[];
      console.log('[fetchCitiesByState] Datos recibidos:',cityData);
      
      // Filtrar ciudades existentes de este estado y agregar las nuevas
      const updatedCities = [
        ...cities.filter(c => c.stateId !== stateId),
        ...cityData
      ];

      console.log('[fetchCitiesByState] Ciudades actualizadas:', { total: updatedCities.length, nuevas: cityData.length });

      set({
        cities: updatedCities,
        loading: false,
        lastFetch: { 
          ...get().lastFetch, 
          cities: { 
            ...get().lastFetch.cities, 
            [stateId]: now 
          } 
        },
      });
      return cityData;
    } catch (error) {
      console.error('[fetchCitiesByState] Error:', error);
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

  // Método fetchPaymentProviders mejorado con caché
  fetchPaymentProviders: async () => {
    const { paymentProviders, lastFetch } = get()
    const now = Date.now()

    // Verificar si hay datos en caché y si el caché aún es válido
    if (
      paymentProviders.length > 0 &&
      lastFetch.paymentProviders &&
      now - lastFetch.paymentProviders < CACHE_DURATION
    ) {
      return paymentProviders
    }

    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<PaymentProvider[]>("/payment-providers")
      set({
        paymentProviders: response.data,
        loading: false,
        lastFetch: { ...get().lastFetch, paymentProviders: now },
      })
      return response.data
    } catch (error) {
      set({ error: "Failed to fetch payment providers", loading: false })
      throw error
    }
  },

  // Método fetchPaymentTransactions mejorado con caché
  fetchPaymentTransactions: async () => {
    const { paymentTransactions, lastFetch } = get()
    const now = Date.now()

    // No hay un campo específico para lastFetch.paymentTransactions, así que usamos paymentProviders como referencia
    if (
      paymentTransactions.length > 0 &&
      lastFetch.paymentProviders &&
      now - lastFetch.paymentProviders < CACHE_DURATION
    ) {
      return paymentTransactions
    }

    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<PaymentTransaction[]>("/payment-transactions")
      set({
        paymentTransactions: response.data,
        loading: false,
        lastFetch: { ...get().lastFetch, paymentProviders: now }, // Actualizamos usando el mismo campo
      })
      return response.data
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

  // Método fetchContents mejorado con caché
  fetchContents: async () => {
    const { contents, lastFetch } = get()
    const now = Date.now()

    // Verificar si hay datos en caché y si el caché aún es válido
    if (contents.length > 0 && lastFetch.contents && now - lastFetch.contents < CACHE_DURATION) {
      return contents
    }

    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<Content[]>(`/contents/${get().currentStore}`)
      set({
        contents: response.data,
        loading: false,
        lastFetch: { ...get().lastFetch, contents: now },
      })
      return response.data
    } catch (error) {
      set({ error: "Failed to fetch contents", loading: false })
      throw error
    }
  },

  fetchContentsByStore: async (storeId?: string) => {
    const { contents, lastFetch } = get()
    const now = Date.now()
    const targetStoreId = storeId || get().currentStore

    if (!targetStoreId) {
      throw new Error("No store ID provided and no current store selected")
    }

    // Verificar si hay contenidos en caché para esta tienda y si el caché aún es válido
    // Filtrar por storeId para asegurar que solo se usen datos del store correcto
    const cachedContents = contents.filter(content => content.storeId === targetStoreId)
    if (
      cachedContents.length > 0 &&
      lastFetch.contents &&
      now - lastFetch.contents < CACHE_DURATION
    ) {
      return cachedContents
    }

    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<Content[]>(`/contents/${targetStoreId}`)
      
      // Filtrar los contenidos por storeId como medida de seguridad
      const filteredContents = response.data.filter(content => content.storeId === targetStoreId)
      
      set({
        contents: filteredContents,
        loading: false,
        lastFetch: { ...get().lastFetch, contents: now },
      })
      return filteredContents
    } catch (error) {
      set({ error: "Failed to fetch contents by store", loading: false })
      throw error
    }
  },

  fetchContent: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<Content>(`/contents/${get().currentStore}/${id}`)
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
      const response = await apiClient.post<Content>(`/contents/${get().currentStore}`, content)
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
      const response = await apiClient.put<Content>(`/contents/${get().currentStore}/${id}`, content)
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
      await apiClient.delete(`/contents/${get().currentStore}/${id}`)
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
      const response = await apiClient.get<Store[]>(`/stores/owner/${owner}`)
      console.log("[fetchStores] Response:", response.data)

      // No need to filter as the endpoint now returns only stores for the specified owner
      set({ stores: response.data, loading: false })
      return response.data
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

  // Currency actions
  fetchCurrencies: async () => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<Currency[]>(`/currencies`)
      set({ currencies: response.data, loading: false })
      return response.data
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

  // Exchange Rate actions
  fetchExchangeRates: async () => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<ExchangeRate[]>("/exchange-rates")
      set({ exchangeRates: response.data, loading: false })
      return response.data
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

  // Implementar los métodos para FBT
  fetchFrequentlyBoughtTogether: async () => {
    const { frequentlyBoughtTogether, lastFetch } = get()
    const now = Date.now()

    // Verificar si hay datos en caché y si el caché aún es válido
    if (
      frequentlyBoughtTogether.length > 0 &&
      lastFetch.frequentlyBoughtTogether &&
      now - lastFetch.frequentlyBoughtTogether < CACHE_DURATION
    ) {
      return frequentlyBoughtTogether
    }

    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<FrequentlyBoughtTogether[]>(`/fbt/${get().currentStore}`)
      set({
        frequentlyBoughtTogether: response.data,
        loading: false,
        lastFetch: { ...get().lastFetch, frequentlyBoughtTogether: now },
      })
      return response.data
    } catch (error) {
      set({ error: "Failed to fetch frequently bought together items", loading: false })
      throw error
    }
  },

  fetchFrequentlyBoughtTogetherByStore: async (storeId?: string) => {
    const { frequentlyBoughtTogether, lastFetch, currentStore } = get()
    const now = Date.now()
    const targetStoreId = storeId || currentStore

    if (!targetStoreId) {
      throw new Error("No store ID provided and no current store selected")
    }

    // Verificar si hay datos en caché para esta tienda y si el caché aún es válido
    // Filtrar por storeId para asegurar que solo se usen datos del store correcto
    const cachedFBT = frequentlyBoughtTogether.filter(fbt => fbt.storeId === targetStoreId)
    if (
      cachedFBT.length > 0 &&
      lastFetch.frequentlyBoughtTogether &&
      now - lastFetch.frequentlyBoughtTogether < CACHE_DURATION
    ) {
      return cachedFBT
    }

    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<FrequentlyBoughtTogether[]>(
        `/fbt/${targetStoreId}`,
      )
      
      // Filtrar los elementos FBT por storeId como medida de seguridad
      const filteredFBT = response.data.filter(fbt => fbt.storeId === targetStoreId)
      
      set({
        frequentlyBoughtTogether: filteredFBT,
        loading: false,
        lastFetch: { ...get().lastFetch, frequentlyBoughtTogether: now },
      })
      return filteredFBT
    } catch (error) {
      set({ error: "Failed to fetch frequently bought together items by store", loading: false })
      throw error
    }
  },

  fetchFrequentlyBoughtTogetherById: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<FrequentlyBoughtTogether>(`/fbt/${get().currentStore}/${id}`)
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
      const response = await apiClient.post<FrequentlyBoughtTogether>(`/fbt/${get().currentStore}`, data)
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
      const response = await apiClient.patch<FrequentlyBoughtTogether>(`/fbt/${get().currentStore}/${id}`, data)
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
      await apiClient.delete(`/fbt/${get().currentStore}/${id}`)
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
        // productVariantsResponse, // Removed - no direct endpoint
        collectionsResponse,
        ordersResponse,
        // customersResponse, // Removed - no direct endpoint
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
        fbtResponse,
      ] = await Promise.all([
        apiClient.get("/stores"),
        apiClient.get(`/categories/${get().currentStore}`),
        apiClient.get(`/products/store/${get().currentStore}`),
        // apiClient.get("/product-variants"), // No existe - variants están anidados bajo products
        apiClient.get(`/collections/${get().currentStore}`),
        apiClient.get(`/orders/${get().currentStore}`),
        // apiClient.get("/customers"), // No existe - customers están incluidos en orders
        apiClient.get(`/coupons/${get().currentStore}`),
        apiClient.get(`/shipping-methods/${get().currentStore}`),
        apiClient.get("/payment-providers"),
        apiClient.get(`/contents/${get().currentStore}`),
        apiClient.get("/auth"),
        apiClient.get("/shop-settings"),
        apiClient.get("/currencies"),
        apiClient.get("/exchange-rates"),
        apiClient.get(`/hero-sections/${get().currentStore}`),
        apiClient.get(`/card-section/${get().currentStore}`),
        apiClient.get("/team-sections"),
        apiClient.get(`/fbt/${get().currentStore}`),
      ])

      const now = Date.now()
      set({
        stores: storesResponse.data,
        categories: categoriesResponse.data,
        products: productsResponse.data,
        // productVariants: [], // No direct endpoint - variants are nested under products
        collections: collectionsResponse.data,
        heroSections: heroSectionsResponse.data,
        cardSections: cardSectionsResponse?.data,
        teamSections: teamSectionsResponse?.data,
        frequentlyBoughtTogether: fbtResponse.data,
        orders: ordersResponse.data,
        // customers: [], // No direct endpoint - customers are managed through orders
        coupons: couponsResponse.data,
        shippingMethods: shippingMethodsResponse.data,
        paymentProviders: paymentProvidersResponse.data,
        contents: contentsResponse.data,
        users: usersResponse.data,
        shopSettings: shopSettingsResponse.data,
        currencies: currenciesResponse.data,
        exchangeRates: exchangeRatesResponse.data,
        loading: false,
        lastFetch: {
          categories: now,
          products: now,
          productVariants: now,
          collections: now,
          orders: now,
          customers: now,
          countries:now,
          states:{},
          cities:{},
          coupons: now,
          heroSections: now,
          cardSections: now,
          teamMembers: now,
          shippingMethods: now,
          paymentProviders: now,
          contents: now,
          users: now,
          shopSettings: now,
          currencies: now,
          exchangeRates: now,
          frequentlyBoughtTogether: now
        },
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
      lastFetch: {
        categories: null,
        products: null,
        productVariants: null,
        collections: null,
        orders: null,
        customers: null,
        heroSections: null,
        cardSections: null,
        teamMembers: null,
        coupons: null,
        countries: null,
        states: {},
        cities: {},
        shippingMethods: null,
        paymentProviders: null,
        contents: null,
        users: null,
        shopSettings: null,
        currencies: null,
        exchangeRates: null,
        frequentlyBoughtTogether: null,
      },
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
