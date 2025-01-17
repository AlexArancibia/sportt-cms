import { create } from 'zustand'
import apiClient from '@/lib/axiosConfig'
import { Product, CreateProductDto, UpdateProductDto } from '@/types/product'
import { Category, CreateCategoryDto, UpdateCategoryDto } from '@/types/category'
import { Collection, CreateCollectionDto, UpdateCollectionDto } from '@/types/collection'
import { Order, CreateOrderDto, UpdateOrderDto } from '@/types/order'
import { Customer, CreateCustomerDto, UpdateCustomerDto } from '@/types/customer'
import { Coupon, CreateCouponDto, UpdateCouponDto } from '@/types/coupon'
import { ShippingMethod, CreateShippingMethodDto, UpdateShippingMethodDto } from '@/types/shippingMethod'
import { ShopSettings, CreateShopSettingsDto, UpdateShopSettingsDto } from '@/types/shopSettings'
import { Currency, CreateCurrencyDto, UpdateCurrencyDto } from '@/types/currency'
import { ExchangeRate, CreateExchangeRateDto, UpdateExchangeRateDto } from '@/types/exchangeRate'
import axios from 'axios'
import { CreateProductVariantDto, ProductVariant, UpdateProductVariantDto } from '@/types/productVariant'
import { Content, CreateContentDto, UpdateContentDto } from '@/types/content'
import { CreateUserDto, UpdateUserDto, User } from '@/types/user'
import { PaymentProvider, CreatePaymentProviderDto, UpdatePaymentProviderDto } from '@/types/paymentProvider'

interface MainStore {
  categories: Category[]
  products: Product[]
  productVariants: ProductVariant[]
  collections: Collection[]
  orders: Order[]
  customers: Customer[]
  coupons: Coupon[]
  shippingMethods: ShippingMethod[]
  paymentProviders: PaymentProvider[]
  currencies: Currency[]
  exchangeRates: ExchangeRate[]
  contents: Content[]
  users: User[]
  shopSettings: ShopSettings[]
  loading: boolean
  error: string | null
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
    users: number | null
    shopSettings: number | null
    currencies: number | null
    exchangeRates: number | null
  }

  // Category actions
  fetchCategories: () => Promise<Category[]>
  createCategory: (category: CreateCategoryDto) => Promise<Category>
  updateCategory: (id: string, category: UpdateCategoryDto) => Promise<Category>
  deleteCategory: (id: string) => Promise<void>

  // Product actions
  fetchProducts: () => Promise<Product[]>
  createProduct: (product: CreateProductDto) => Promise<Product>
  updateProduct: (id: string, product: UpdateProductDto) => Promise<Product>
  deleteProduct: (id: string) => Promise<void>

  // ProductVariant actions
  fetchProductVariants: () => Promise<ProductVariant[]>
  createProductVariant: (variant: CreateProductVariantDto) => Promise<ProductVariant>
  updateProductVariant: (id: string, variant: UpdateProductVariantDto) => Promise<ProductVariant>
  deleteProductVariant: (id: string) => Promise<void>

  // Collection actions
  fetchCollections: () => Promise<Collection[]>
  createCollection: (collection: CreateCollectionDto) => Promise<Collection>
  updateCollection: (id: string, collection: UpdateCollectionDto) => Promise<Collection>
  deleteCollection: (id: string) => Promise<void>

  // Order actions
  fetchOrders: () => Promise<Order[]>
  createOrder: (order: CreateOrderDto) => Promise<Order>
  updateOrder: (id: string, order: UpdateOrderDto) => Promise<Order>
  deleteOrder: (id: string) => Promise<void>

  // Customer actions
  fetchCustomers: () => Promise<Customer[]>
  createCustomer: (customer: CreateCustomerDto) => Promise<Customer>
  updateCustomer: (id: string, customer: UpdateCustomerDto) => Promise<Customer>
  deleteCustomer: (id: string) => Promise<void>

  // Coupon actions
  fetchCoupons: () => Promise<Coupon[]>
  createCoupon: (coupon: Omit<Coupon, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Coupon>
  updateCoupon: (id: string, coupon: Partial<Coupon>) => Promise<Coupon>
  deleteCoupon: (id: string) => Promise<void>

  // Shipping Method actions
  fetchShippingMethods: () => Promise<ShippingMethod[]>
  createShippingMethod: (method: CreateShippingMethodDto) => Promise<ShippingMethod>
  updateShippingMethod: (id: string, method: UpdateShippingMethodDto) => Promise<ShippingMethod>
  deleteShippingMethod: (id: string) => Promise<void>

  // PaymentProvider actions
  fetchPaymentProviders: () => Promise<PaymentProvider[]>
  createPaymentProvider: (provider: CreatePaymentProviderDto) => Promise<PaymentProvider>
  updatePaymentProvider: (id: string, provider: UpdatePaymentProviderDto) => Promise<PaymentProvider>
  deletePaymentProvider: (id: string) => Promise<void>

  // Content actions
  fetchContents: () => Promise<Content[]>
  createContent: (content: CreateContentDto) => Promise<Content>
  updateContent: (id: string, content: UpdateContentDto) => Promise<Content>
  deleteContent: (id: string) => Promise<void>

  // User actions
  fetchUsers: () => Promise<User[]>
  createUser: (user: CreateUserDto) => Promise<User>
  updateUser: (id: string, user: UpdateUserDto) => Promise<User>
  deleteUser: (id: string) => Promise<void>

  // Shop actions
  fetchShopSettings: () => Promise<ShopSettings[]>
  saveShopSettings: (settings: CreateShopSettingsDto | UpdateShopSettingsDto) => Promise<ShopSettings>
  addAcceptedCurrency: (shopId: string, currencyId: string) => Promise<ShopSettings>
  removeAcceptedCurrency: (shopId: string, currencyId: string) => Promise<ShopSettings>
  // Currency actions
  fetchCurrencies: () => Promise<Currency[]>
  createCurrency: (currency: CreateCurrencyDto) => Promise<Currency>
  updateCurrency: (id: string, currency: UpdateCurrencyDto) => Promise<Currency>
  deleteCurrency: (id: string) => Promise<void>

  // Exchange Rate actions
  fetchExchangeRates: () => Promise<ExchangeRate[]>
  createExchangeRate: (exchangeRate: CreateExchangeRateDto) => Promise<ExchangeRate>
  updateExchangeRate: (id: string, exchangeRate: UpdateExchangeRateDto) => Promise<ExchangeRate>
  deleteExchangeRate: (id: string) => Promise<void>
  


  // Utility functions
  refreshData: () => Promise<void>
  getCategoryById: (id: string) => Category | undefined
  getProductById: (id: string) => Product | undefined
  getCollectionById: (id: string) => Collection | undefined
  getOrderById: (id: string) => Order | undefined
  getCustomerById: (id: string) => Customer | undefined
  getCouponById: (id: string) => Coupon | undefined
  getCurrencyById: (id: string) => Currency | undefined
  getExchangeRateById: (id: string) => ExchangeRate | undefined
 
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export const useMainStore = create<MainStore>((set, get) => ({
  categories: [],
  products: [],
  productVariants: [],
  collections: [],
  orders: [],
  customers: [],
  coupons: [],
  shippingMethods: [],
  paymentProviders: [],
  contents: [],
  users: [],
  shopSettings: [],
  currencies: [],
  exchangeRates:[],
  loading: false,
  error: null,
  lastFetch: {
    categories: null,
    products: null,
    productVariants: null,
    collections: null,
    orders: null,
    customers: null,
    coupons: null,
    shippingMethods: null,
    paymentProviders: null,
    contents: null,
    users: null,
    shopSettings: null,
    currencies: null,
    exchangeRates: null
  },

  // Category actions
  fetchCategories: async () => {
    const { categories, lastFetch } = get();
    const now = Date.now();

    if (categories.length > 0 && lastFetch.categories && now - lastFetch.categories < CACHE_DURATION) {
      return categories;
    }

    set({ loading: true, error: null });
    try {
      const response = await apiClient.get<Category[]>('/categories');
      set({ categories: response.data, loading: false, lastFetch: { ...get().lastFetch, categories: now } });
      return response.data;
    } catch (error) {
      set({ error: 'Failed to fetch categories', loading: false });
      throw error;
    }
  },

  createCategory: async (category: CreateCategoryDto) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post<Category>('/categories', category);
      set(state => ({
        categories: [...state.categories, response.data],
        loading: false
      }));
      return response.data;
    } catch (error) {
      set({ error: 'Failed to create category', loading: false });
      throw error;
    }
  },

  updateCategory: async (id: string, category: UpdateCategoryDto) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.put<Category>(`/categories/${id}`, category);
      set(state => ({
        categories: state.categories.map(c => c.id === id ? { ...c, ...response.data } : c),
        loading: false
      }));
      return response.data;
    } catch (error) {
      set({ error: 'Failed to update category', loading: false });
      throw error;
    }
  },

  deleteCategory: async (id) => {
    set({ loading: true, error: null });
    try {
      await apiClient.delete(`/categories/${id}`);
      set(state => ({
        categories: state.categories.filter(c => c.id !== id),
        loading: false
      }));
    } catch (error) {
      set({ error: 'Failed to delete category', loading: false });
      throw error;
    }
  },

  // Product actions
  fetchProducts: async () => {
    const { products, lastFetch } = get();
    const now = Date.now();

    if (products.length > 0 && lastFetch.products && now - lastFetch.products < CACHE_DURATION) {
      return products;
    }

    set({ loading: true, error: null });
    try {
      const response = await apiClient.get<Product[]>('/products');
      set({ products: response.data, loading: false, lastFetch: { ...get().lastFetch, products: now } });
      return response.data;
    } catch (error) {
      set({ error: 'Failed to fetch products', loading: false });
      throw error;
    }
  },

  createProduct: async (product: CreateProductDto) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post<Product>('/products', product);
      set(state => ({
        products: [...state.products, response.data],
        loading: false
      }));
      return response.data;
    } catch (error) {
      set({ error: 'Failed to create product', loading: false });
      throw error;
    }
  },

  updateProduct: async (id: string, product: UpdateProductDto) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.patch<Product>(`/products/${id}`, product);
      set(state => ({
        products: state.products.map(p => p.id === id ? { ...p, ...response.data } : p),
        loading: false
      }));
      return response.data;
    } catch (error) {
      set({ error: 'Failed to update product', loading: false });
      throw error;
    }
  },

  deleteProduct: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await apiClient.delete(`/products/${id}`);
      set(state => ({
        products: state.products.filter(p => p.id !== id),
        loading: false
      }));
    } catch (error) {
      console.error('Error in deleteProduct:', error);
      set({ error: 'Failed to delete product', loading: false });
      throw error;
    }
  },

  // ProductVariant actions
  fetchProductVariants: async () => {
    const { productVariants, lastFetch } = get();
    const now = Date.now();

    if (productVariants.length > 0 && lastFetch.productVariants && now - lastFetch.productVariants < CACHE_DURATION) {
      return productVariants;
    }

    set({ loading: true, error: null });
    try {
      const response = await apiClient.get<ProductVariant[]>('/product-variants');
      set({ productVariants: response.data, loading: false, lastFetch: { ...get().lastFetch, productVariants: now } });
      return response.data;
    } catch (error) {
      set({ error: 'Failed to fetch product variants', loading: false });
      throw error;
    }
  },

  createProductVariant: async (variant: CreateProductVariantDto) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post<ProductVariant>('/product-variants', variant);
      set(state => ({
        productVariants: [...state.productVariants, response.data],
        loading: false
      }));
      return response.data;
    } catch (error) {
      set({ error: 'Failed to create product variant', loading: false });
      throw error;
    }
  },

  updateProductVariant: async (id: string, variant: UpdateProductVariantDto) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.put<ProductVariant>(`/product-variants/${id}`, variant);
      set(state => ({
        productVariants: state.productVariants.map(v => v.id === id ? { ...v, ...response.data } : v),
        loading: false
      }));
      return response.data;
    } catch (error) {
      set({ error: 'Failed to update product variant', loading: false });
      throw error;
    }
  },

  deleteProductVariant: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await apiClient.delete(`/product-variants/${id}`);
      set(state => ({
        productVariants: state.productVariants.filter(v => v.id !== id),
        loading: false
      }));
    } catch (error) {
      set({ error: 'Failed to delete product variant', loading: false });
      throw error;
    }
  },

  // Collection actions
  fetchCollections: async () => {
    const { collections, lastFetch } = get();
    const now = Date.now();

    if (collections.length > 0 && lastFetch.collections && now - lastFetch.collections < CACHE_DURATION) {
      return collections;
    }

    set({ loading: true, error: null });
    try {
      const response = await apiClient.get<Collection[]>('/collections');
      set({ collections: response.data, loading: false, lastFetch: { ...get().lastFetch, collections: now } });
      return response.data;
    } catch (error) {
      set({ error: 'Failed to fetch collections', loading: false });
      throw error;
    }
  },

  createCollection: async (collection: CreateCollectionDto) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post<Collection>('/collections', collection);
      set(state => ({
        collections: [...state.collections, response.data],
        loading: false
      }));
      return response.data;
    } catch (error) {
      console.error('Error in createCollection:', error);
      if (axios.isAxiosError(error)) {
        console.error('Error details:', error.response?.data);
      }
      set({ error: 'Failed to create collection', loading: false });
      throw error;
    }
  },

  updateCollection: async (id, collection) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.put<Collection>(`/collections/${id}`, collection);
      set(state => ({
        collections: state.collections.map(c => c.id === id ? { ...c, ...response.data } : c),
        loading: false
      }));
      return response.data;
    } catch (error) {
      console.error('Error in updateCollection:', error);
      if (axios.isAxiosError(error)) {
        console.error('Error details:', error.response?.data);
      }
      set({ error: 'Failed to update collection', loading: false });
      throw error;
    }
  },

  deleteCollection: async (id) => {
    set({ loading: true, error: null });
    try {
      await apiClient.delete(`/collections/${id}`);
      set(state => ({
        collections: state.collections.filter(c => c.id !== id),
        loading: false
      }));
    } catch (error) {
      set({ error: 'Failed to delete collection', loading: false });
      throw error;
    }
  },

  // Order actions
  fetchOrders: async () => {
    const { orders, lastFetch } = get();
    const now = Date.now();

    if (orders.length > 0 && lastFetch.orders && now - lastFetch.orders < CACHE_DURATION) {
      return orders;
    }

    set({ loading: true, error: null });
    try {
      const response = await apiClient.get<Order[]>('/orders');
      set({ orders: response.data, loading: false, lastFetch: { ...get().lastFetch, orders: now } });
      return response.data;
    } catch (error) {
      set({ error: 'Failed to fetch orders', loading: false });
      throw error;
    }
  },

  createOrder: async (order) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post<Order>('/orders', order);
      set(state => ({
        orders: [...state.orders, response.data],
        loading: false
      }));
      return response.data;
    } catch (error) {
      set({ error: 'Failed to create order', loading: false });
      throw error;
    }
  },

  updateOrder: async (id, order) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.put<Order>(`/orders/${id}`, order);
      set(state => ({
        orders: state.orders.map(o => o.id === id ? { ...o, ...response.data } : o),
        loading: false
      }));
      return response.data;
    } catch (error) {
      set({ error: 'Failed to update order', loading: false });
      throw error;
    }
  },

  deleteOrder: async (id) => {
    set({ loading: true, error: null });
    try {
      await apiClient.delete(`/orders/${id}`);
      set(state => ({
        orders: state.orders.filter(o => o.id !== id),
        loading: false
      }));
    } catch (error) {
      set({ error: 'Failed to delete order', loading: false });
      throw error;
    }
  },

  // Customer actions
  fetchCustomers: async () => {
    console.log('Iniciando fetchCustomers');
    const { customers, lastFetch } = get();
    const now = Date.now();
    console.log('Último fetch:', lastFetch.customers, 'Ahora:', now);

    if (customers.length > 0 && lastFetch.customers && now - lastFetch.customers < CACHE_DURATION) {
      console.log('Usando datos en caché');
      return customers;
    }

    console.log('Haciendo nueva petición a la API');
    set({ loading: true, error: null });
    try {
      console.log('URL de la petición:', `${apiClient.defaults.baseURL}/customers`);
      const response = await apiClient.get<Customer[]>('/customers');
      console.log('Respuesta recibida:', response.data);
      set({ customers: response.data, loading: false, lastFetch: { ...get().lastFetch, customers: now } });
      return response.data;
    } catch (error) {
      console.error('Error en fetchCustomers:', error);
      set({ error: 'Failed to fetch customers', loading: false });
      throw error;
    }
  },

  createCustomer: async (customer: CreateCustomerDto) => {
    set({ loading: true, error: null });
    try {
      const customerData = {
        ...customer,
        phone: customer.phone === '' ? null : customer.phone
      };
      const response = await apiClient.post<Customer>('/customers', customerData);
      set(state => ({
        customers: [...state.customers, response.data],
        loading: false
      }));
      return response.data;
    } catch (error) {
      set({ error: 'Failed to create customer', loading: false });
      throw error;
    }
  },

  updateCustomer: async (id: string, customer: UpdateCustomerDto) => {
    set({ loading: true, error: null });
    try {
      const customerData = {
        ...customer,
        phone: customer.phone === '' ? null : customer.phone
      };
      // Si no se proporciona una nueva contraseña, no la incluimos en la actualización
      if (!customerData.password) {
        delete customerData.password;
      }
      const response = await apiClient.put<Customer>(`/customers/${id}`, customerData);
      set(state => ({
        customers: state.customers.map(c => c.id === id ? { ...c, ...response.data } : c),
        loading: false
      }));
      return response.data;
    } catch (error) {
      set({ error: 'Failed to update customer', loading: false });
      throw error;
    }
  },

  deleteCustomer: async (id) => {
    set({ loading: true, error: null });
    try {
      await apiClient.delete(`/customers/${id}`);
      set(state => ({
        customers: state.customers.filter(c => c.id !== id),
        loading: false
      }));
    } catch (error) {
      set({ error: 'Failed to delete customer', loading: false });
      throw error;
    }
  },

  // Coupon actions
  fetchCoupons: async () => {
    const { coupons, lastFetch } = get();
    const now = Date.now();

    if (coupons.length > 0 && lastFetch.coupons && now - lastFetch.coupons < CACHE_DURATION) {
      return coupons;
    }

    set({ loading: true, error: null });
    try {
      const response = await apiClient.get<Coupon[]>('/coupons');
      set({ coupons: response.data, loading: false, lastFetch: { ...get().lastFetch, coupons: now } });
      return response.data;
    } catch (error) {
      set({ error: 'Failed to fetch coupons', loading: false });
      throw error;
    }
  },

  createCoupon: async (coupon) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post<Coupon>('/coupons', coupon);
      set(state => ({
        coupons: [...state.coupons, response.data],
        loading: false
      }));
      return response.data;
    } catch (error) {
      set({ error: 'Failed to create coupon', loading: false });
      throw error;
    }
  },

  updateCoupon: async (id, coupon) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.put<Coupon>(`/coupons/${id}`, coupon);
      set(state => ({
        coupons: state.coupons.map(c => c.id === id ? { ...c, ...response.data } : c),
        loading: false
      }));
      return response.data;
    } catch (error) {
      set({ error: 'Failed to update coupon', loading: false });
      throw error;
    }
  },

  deleteCoupon: async (id) => {
    set({ loading: true, error: null });
    try {
      await apiClient.delete(`/coupons/${id}`);
      set(state => ({
        coupons: state.coupons.filter(c => c.id !== id),
        loading: false
      }));
    } catch (error) {
      set({ error: 'Failed to delete coupon', loading: false });
      throw error;
    }
  },

  // Shipping Method actions
  fetchShippingMethods: async () => {
    const { shippingMethods, lastFetch } = get();
    const now = Date.now();

    if (shippingMethods.length > 0 && lastFetch.shippingMethods && now - lastFetch.shippingMethods < CACHE_DURATION) {
      return shippingMethods;
    }

    set({ loading: true, error: null });
    try {
      const response = await apiClient.get<ShippingMethod[]>('/shipping-methods');
      set({ shippingMethods: response.data, loading: false, lastFetch: { ...get().lastFetch, shippingMethods: now } });
      return response.data;
    } catch (error) {
      set({ error: 'Failed to fetch shipping methods', loading: false });
      throw error;
    }
  },

  createShippingMethod: async (method) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post<ShippingMethod>('/shipping-methods', method);
      set(state => ({
        shippingMethods: [...state.shippingMethods, response.data],
        loading: false
      }));
      return response.data;
    } catch (error) {
      set({ error: 'Failed to create shipping method', loading: false });
      throw error;
    }
  },

  updateShippingMethod: async (id, method) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.put<ShippingMethod>(`/shipping-methods/${id}`, method);
      set(state => ({
        shippingMethods: state.shippingMethods.map(m => m.id === id ? { ...m, ...response.data } : m),
        loading: false
      }));
      return response.data;
    } catch (error) {
      set({ error: 'Failed to update shipping method', loading: false });
      throw error;
    }
  },

  deleteShippingMethod: async (id) => {
    set({ loading: true, error: null });
    try {
      await apiClient.delete(`/shipping-methods/${id}`);
      set(state => ({
        shippingMethods: state.shippingMethods.filter(m => m.id !== id),
        loading: false
      }));
    } catch (error) {
      set({ error: 'Failed to delete shipping method', loading: false });
      throw error;
    }
  },

  // PaymentProvider actions
  fetchPaymentProviders: async () => {
    const { paymentProviders, lastFetch } = get();
    const now = Date.now();

    if (paymentProviders.length > 0 && lastFetch.paymentProviders && now - lastFetch.paymentProviders < CACHE_DURATION) {
      return paymentProviders;
    }

    set({ loading: true, error: null });
    try {
      const response = await apiClient.get<PaymentProvider[]>('/payment-providers');
      set({ paymentProviders: response.data, loading: false, lastFetch: { ...get().lastFetch, paymentProviders: now } });
      return response.data;
    } catch (error) {
      set({ error: 'Failed to fetch payment providers', loading: false });
      throw error;
    }
  },

  createPaymentProvider: async (provider: CreatePaymentProviderDto) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post<PaymentProvider>('/payment-providers', provider);
      set(state => ({
        paymentProviders: [...state.paymentProviders, response.data],
        loading: false
      }));
      return response.data;
    } catch (error) {
      set({ error: 'Failed to create payment provider', loading: false });
      throw error;
    }
  },

  updatePaymentProvider: async (id: string, provider: UpdatePaymentProviderDto) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.put<PaymentProvider>(`/payment-providers/${id}`, provider);
      set(state => ({
        paymentProviders: state.paymentProviders.map(p => p.id === id ? { ...p, ...response.data } : p),
        loading: false
      }));
      return response.data;
    } catch (error) {
      set({ error: 'Failed to update payment provider', loading: false });
      throw error;
    }
  },

  deletePaymentProvider: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await apiClient.delete(`/payment-providers/${id}`);
      set(state => ({
        paymentProviders: state.paymentProviders.filter(p => p.id !== id),
        loading: false
      }));
    } catch (error) {
      set({ error: 'Failed to delete payment provider', loading: false });
      throw error;
    }
  },

  // Content actions
  fetchContents: async () => {
    const { contents, lastFetch } = get();
    const now = Date.now();

    if (contents.length > 0 && lastFetch.contents && now - lastFetch.contents < CACHE_DURATION) {
      return contents;
    }

    set({ loading: true, error: null });
    try {
      const response = await apiClient.get<Content[]>('/contents');
      set({ contents: response.data, loading: false, lastFetch: { ...get().lastFetch, contents: now } });
      return response.data;
    } catch (error) {
      set({ error: 'Failed to fetch contents', loading: false });
      throw error;
    }
  },

  createContent: async (content: CreateContentDto) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post<Content>('/contents', content);
      set(state => ({
        contents: [...state.contents, response.data],
        loading: false
      }));
      return response.data;
    } catch (error) {
      set({ error: 'Failed to create content', loading: false });
      throw error;
    }
  },

  updateContent: async (id: string, content: UpdateContentDto) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.put<Content>(`/contents/${id}`, content);
      set(state => ({
        contents: state.contents.map(c => c.id === id ? { ...c, ...response.data } : c),
        loading: false
      }));
      return response.data;
    } catch (error) {
      set({ error: 'Failed to update content', loading: false });
      throw error;
    }
  },

  deleteContent: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await apiClient.delete(`/contents/${id}`);
      set(state => ({
        contents: state.contents.filter(c => c.id !== id),
        loading: false
      }));
    } catch (error) {
      set({ error: 'Failed to delete content', loading: false });
      throw error;
    }
  },

  // User actions
  fetchUsers: async () => {
    const { users, lastFetch } = get();
    const now = Date.now();

    if (users.length > 0 && lastFetch.users && now - lastFetch.users < CACHE_DURATION) {
      return users;
    }

    set({ loading: true, error: null });
    try {
      const response = await apiClient.get<User[]>('/users');
      set({ users: response.data, loading: false, lastFetch: { ...get().lastFetch, users: now } });
      return response.data;
    } catch (error) {
      set({ error: 'Failed to fetch users', loading: false });
      throw error;
    }
  },

  createUser: async (user: CreateUserDto) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post<User>('/users', user);
      set(state => ({
        users: [...state.users, response.data],
        loading: false
      }));
      return response.data;
    } catch (error) {
      set({ error: 'Failed to create user', loading: false });
      throw error;
    }
  },

  updateUser: async (id: string, user: UpdateUserDto) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.put<User>(`/users/${id}`, user);
      set(state => ({
        users: state.users.map(u => u.id === id ? { ...u, ...response.data } : u),
        loading: false
      }));
      return response.data;
    } catch (error) {
      set({ error: 'Failed to update user', loading: false });
      throw error;
    }
  },

  deleteUser: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await apiClient.delete(`/users/${id}`);
      set(state => ({
        users: state.users.filter(u => u.id !== id),
        loading: false
      }));
    } catch (error) {
      set({ error: 'Failed to delete user', loading: false });
      throw error;
    }
  },

  fetchShopSettings: async () => {
    const { shopSettings, lastFetch } = get();
    const now = Date.now();
  
    // Comprueba si los datos ya están en la caché y son válidos
    if (shopSettings && lastFetch.shopSettings && now - lastFetch.shopSettings < CACHE_DURATION) {
      return shopSettings;
    }
  
    set({ loading: true, error: null });
  
    try {
      const response = await apiClient.get<ShopSettings[]>('/shop');
      set({
        shopSettings: response.data,
        loading: false,
        lastFetch: { ...lastFetch, shopSettings: now },
      });
      
      return response.data;
    } catch (error) {
      set({ error: 'Failed to fetch shop settings', loading: false });
      throw error;
    }
  },
  

  saveShopSettings: async (settings: CreateShopSettingsDto | UpdateShopSettingsDto) => {
    set({ loading: true, error: null });
    try {
      let response;
      if (get().shopSettings) {
        // If shop settings exist, update them
        response = await apiClient.patch<ShopSettings>(`/shop/${get().shopSettings[0]!.id}`, settings);
      } else {
        // If no shop settings exist, create new ones
        response = await apiClient.post<ShopSettings>('/shop', settings);
      }
      set(state => ({
        shopSettings: [...state.shopSettings, response.data],
        loading: false
      }));
      return response.data;
 
    } catch (error) {
      set({ error: 'Failed to save shop settings', loading: false });
      throw error;
    }
  },

  addAcceptedCurrency: async (shopId: string, currencyId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post<ShopSettings>(`/shop/${shopId}/currencies/${currencyId}`);
      set(state => ({
        shopSettings: state.shopSettings?.map(s => 
          s.id === shopId ? response.data : s
        ) || null,
        loading: false
      }));
      return response.data;
    } catch (error) {
      set({ error: 'Failed to add accepted currency', loading: false });
      throw error;
    }
  },

  removeAcceptedCurrency: async (shopId: string, currencyId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.delete<ShopSettings>(`/shop/${shopId}/currencies/${currencyId}`);
      set(state => ({
        shopSettings: state.shopSettings?.map(s => 
          s.id === shopId ? response.data : s
        ) || null,
        loading: false
      }));
      return response.data;
    } catch (error) {
      set({ error: 'Failed to remove accepted currency', loading: false });
      throw error;
    }
  },

  // Currency actions
  fetchCurrencies: async () => {
    const { currencies, lastFetch } = get();
    const now = Date.now();

    if (currencies.length > 0 && lastFetch.currencies && now - lastFetch.currencies < CACHE_DURATION) {
      return currencies;
    }

    set({ loading: true, error: null });
    try {
      const response = await apiClient.get<Currency[]>('/currencies');
      set({ currencies: response.data, loading: false, lastFetch: { ...get().lastFetch, currencies: now } });
      return response.data;
    } catch (error) {
      set({ error: 'Failed to fetch currencies', loading: false });
      throw error;
    }
  },

  createCurrency: async (currency: CreateCurrencyDto) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post<Currency>('/currencies', currency);
      set(state => ({
        currencies: [...state.currencies, response.data],
        loading: false
      }));
      return response.data;
    } catch (error) {
      set({ error: 'Failed to create currency', loading: false });
      throw error;
    }
  },

  updateCurrency: async (id: string, currency: UpdateCurrencyDto) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.patch<Currency>(`/currencies/${id}`, currency);
      set(state => ({
        currencies: state.currencies.map(c => c.id === id ? { ...c, ...response.data } : c),
        loading: false
      }));

      // Actualizar la moneda en shopSettings si es necesario
      const shopSettings = get().shopSettings;
      if (shopSettings && shopSettings.length > 0) {
        const updatedShopSettings = shopSettings.map(s => ({
          ...s,
          acceptedCurrencies: s.acceptedCurrencies.map(ac => 
            ac.id === id ? { ...ac, ...response.data } : ac
          )
        }));
        set({ shopSettings: updatedShopSettings });
      }

      return response.data;
    } catch (error) {
      set({ error: 'Failed to update currency', loading: false });
      throw error;
    }
  },

  deleteCurrency: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const shopSettings = get().shopSettings;
      if (shopSettings && shopSettings.length > 0 && shopSettings[0].defaultCurrencyId === id) {
        throw new Error("Cannot delete the default currency.");
      }

      await apiClient.delete(`/currencies/${id}`);

      set(state => ({
        currencies: state.currencies.filter(c => c.id !== id),
        loading: false
      }));

      // Actualizar shopSettings si es necesario
      if (shopSettings && shopSettings.length > 0) {
        const updatedShopSettings = shopSettings.map(s => ({
          ...s,
          acceptedCurrencies: s.acceptedCurrencies.filter(ac => ac.id !== id)
        }));
        set({ shopSettings: updatedShopSettings });
      }
    } catch (error) {
      set({ error: 'Failed to delete currency', loading: false });
      throw error;
    }
  },


  // Exchange Rate actions
  fetchExchangeRates: async () => {
    const { exchangeRates, lastFetch } = get();
    const now = Date.now();

    if (exchangeRates.length > 0 && lastFetch.exchangeRates && now - lastFetch.exchangeRates < CACHE_DURATION) {
      return exchangeRates;
    }

    set({ loading: true, error: null });
    try {
      const response = await apiClient.get<ExchangeRate[]>('/exchange-rates');
      set({ exchangeRates: response.data, loading: false, lastFetch: { ...get().lastFetch, exchangeRates: now } });
      return response.data;
    } catch (error) {
      set({ error: 'Failed to fetch exchange rates', loading: false });
      throw error;
    }
  },

  createExchangeRate: async (exchangeRate: CreateExchangeRateDto) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post<ExchangeRate>('/exchange-rates', exchangeRate);
      set(state => ({
        exchangeRates: [...state.exchangeRates, response.data],
        loading: false
      }));
      return response.data;
    } catch (error) {
      set({ error: 'Failed to create exchange rate', loading: false });
      throw error;
    }
  },

  updateExchangeRate: async (id: string, exchangeRate: UpdateExchangeRateDto) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.put<ExchangeRate>(`/exchange-rates/${id}`, exchangeRate);
      set(state => ({
        exchangeRates: state.exchangeRates.map(er => er.id === id ? { ...er, ...response.data } : er),
        loading: false
      }));
      return response.data;
    } catch (error) {
      set({ error: 'Failed to update exchange rate', loading: false });
      throw error;
    }
  },

  deleteExchangeRate: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await apiClient.delete(`/exchange-rates/${id}`);
      set(state => ({
        exchangeRates: state.exchangeRates.filter(er => er.id !== id),
        loading: false
      }));
    } catch (error) {
      set({ error: 'Failed to delete exchange rate', loading: false });
      throw error;
    }
  },

  // Utility functions
  refreshData: async () => {
    set({ loading: true, error: null });
    try {
      const [
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
        exchangeRatesResponse
      ] = await Promise.all([
        apiClient.get<Category[]>('/categories'),
        apiClient.get<Product[]>('/products'),
        apiClient.get<ProductVariant[]>('/product-variants'),
        apiClient.get<Collection[]>('/collections'),
        apiClient.get<Order[]>('/orders'),
        apiClient.get<Customer[]>('/customers'),
        apiClient.get<Coupon[]>('/coupons'),
        apiClient.get<ShippingMethod[]>('/shipping-methods'),
        apiClient.get<PaymentProvider[]>('/payment-providers'),
        apiClient.get<Content[]>('/contents'),
        apiClient.get<User[]>('/users'),
        apiClient.get<ShopSettings[]>('/shop'),
        apiClient.get<Currency[]>('/currencies'),
        apiClient.get<ExchangeRate[]>('/exchange-rates')
      ]);
      const now = Date.now();
      set({
        categories: categoriesResponse.data,
        products: productsResponse.data,
        productVariants: productVariantsResponse.data,
        collections: collectionsResponse.data,
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
        lastFetch: {
          categories: now,
          products: now,
          productVariants: now,
          collections: now,
          orders: now,
          customers: now,
          coupons: now,
          shippingMethods: now,
          paymentProviders: now,
          contents: now,
          users: now,
          shopSettings: now,
          currencies: now,
          exchangeRates: now,
        }
      });
    } catch (error) {
      set({ error: 'Failed to refresh data', loading: false });
      throw error;
    }
  },

  getCategoryById: (id) => {
    const category = get().categories.find(category => category.id === id);
    if (category) {
      return {
        ...category,
        parent: category.parentId ? get().categories.find(c => c.id === category.parentId) : undefined,
        children: get().categories.filter(c => c.parentId === category.id)
      };
    }
    return undefined;
  },

  getProductById: (id) => {
    return get().products.find(product => product.id === id);
  },

  getCollectionById: (id) => {
    return get().collections.find(collection => collection.id === id);
  },

  getOrderById: (id) => {
    return get().orders.find(order => order.id === id);
  },

  getCustomerById: (id) => {
    return get().customers.find(customer => customer.id === id);
  },

  getCouponById: (id) => {
    return get().coupons.find(coupon => coupon.id === id);
  },
  getCurrencyById: (id) => {
    return get().currencies.find(currency => currency.id === id);
  },

  getExchangeRateById: (id) => {
    return get().exchangeRates.find(exchangeRate => exchangeRate.id === id);
  }
}));

