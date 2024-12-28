import { create } from 'zustand'
import apiClient from '@/lib/axiosConfig'
import { Product, CreateProductDto, UpdateProductDto } from '@/types/product'
import { Category, CreateCategoryDto, UpdateCategoryDto } from '@/types/category'
import { Collection, CreateCollectionDto, UpdateCollectionDto } from '@/types/collection'
import { Order, CreateOrderDto, UpdateOrderDto } from '@/types/order'
import { Customer, CreateCustomerDto, UpdateCustomerDto } from '@/types/customer'
import { Coupon, CreateCouponDto, UpdateCouponDto } from '@/types/coupon'
import { ShippingMethod, CreateShippingMethodDto, UpdateShippingMethodDto } from '@/types/shippingMethod'
import axios from 'axios'

interface MainStore {
  categories: Category[]
  products: Product[]
  collections: Collection[]
  orders: Order[]
  customers: Customer[]
  coupons: Coupon[]
  shippingMethods: ShippingMethod[]
  loading: boolean
  error: string | null
  lastFetch: {
    categories: number | null
    products: number | null
    collections: number | null
    orders: number | null
    customers: number | null
    coupons: number | null
    shippingMethods: number | null
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
  createCoupon: (coupon: CreateCouponDto) => Promise<Coupon>
  updateCoupon: (id: string, coupon: UpdateCouponDto) => Promise<Coupon>
  deleteCoupon: (id: string) => Promise<void>

  // Shipping Method actions
  fetchShippingMethods: () => Promise<ShippingMethod[]>
  createShippingMethod: (method: CreateShippingMethodDto) => Promise<ShippingMethod>
  updateShippingMethod: (id: string, method: UpdateShippingMethodDto) => Promise<ShippingMethod>
  deleteShippingMethod: (id: string) => Promise<void>

  // Utility functions
  refreshData: () => Promise<void>
  getCategoryById: (id: string) => Category | undefined
  getProductById: (id: string) => Product | undefined
  getCollectionById: (id: string) => Collection | undefined
  getOrderById: (id: string) => Order | undefined
  getCustomerById: (id: string) => Customer | undefined
  getCouponById: (id: string) => Coupon | undefined
  getShippingMethodById: (id: string) => ShippingMethod | undefined
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export const useMainStore = create<MainStore>((set, get) => ({
  categories: [],
  products: [],
  collections: [],
  orders: [],
  customers: [],
  coupons: [],
  shippingMethods: [],
  loading: false,
  error: null,
  lastFetch: {
    categories: null,
    products: null,
    collections: null,
    orders: null,
    customers: null,
    coupons: null,
    shippingMethods: null
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

  createCategory: async (category) => {
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

  updateCategory: async (id, category) => {
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

  createProduct: async (product) => {
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

  updateProduct: async (id, product) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.put<Product>(`/products/${id}`, product);
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

  deleteProduct: async (id:string) => {
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
        phone: customer.phone === null  ? null : Number(customer.phone)
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
        phone: customer.phone === null  ? null : Number(customer.phone)
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
      const response = await apiClient.get<ShippingMethod[]>('/shippingmethod');
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
      const response = await apiClient.post<ShippingMethod>('/shippingmethod', method);
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
      const response = await apiClient.patch<ShippingMethod>(`/shippingmethod/${id}`, method);
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
      await apiClient.delete(`/shippingmethod/${id}`);
      set(state => ({
        shippingMethods: state.shippingMethods.filter(m => m.id !== id),
        loading: false
      }));
    } catch (error) {
      set({ error: 'Failed to delete shipping method', loading: false });
      throw error;
    }
  },

  // Utility functions
  refreshData: async () => {
    set({ loading: true, error: null });
    try {
      const [categoriesResponse, productsResponse, collectionsResponse, ordersResponse, customersResponse, couponsResponse, shippingMethodsResponse] = await Promise.all([
        apiClient.get<Category[]>('/categories'),
        apiClient.get<Product[]>('/products'),
        apiClient.get<Collection[]>('/collections'),
        apiClient.get<Order[]>('/orders'),
        apiClient.get<Customer[]>('/customers'),
        apiClient.get<Coupon[]>('/coupons'),
        apiClient.get<ShippingMethod[]>('/shippingmethod'),
      ]);
      const now = Date.now();
      set({
        categories: categoriesResponse.data,
        products: productsResponse.data,
        collections: collectionsResponse.data,
        orders: ordersResponse.data,
        customers: customersResponse.data,
        coupons: couponsResponse.data,
        shippingMethods: shippingMethodsResponse.data,
        loading: false,
        lastFetch: {
          categories: now,
          products: now,
          collections: now,
          orders: now,
          customers: now,
          coupons: now,
          shippingMethods: now,
        }
      });
    } catch (error) {
      set({ error: 'Failed to refresh data', loading: false });
      throw error;
    }
  },

  getCategoryById: (id) => {
    return get().categories.find(category => category.id === id);
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

  getShippingMethodById: (id) => {
    return get().shippingMethods.find( shippingMethod => shippingMethod.id === id);
  }
}));

