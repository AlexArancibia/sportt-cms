'use client'

import { useEffect, useState } from 'react';
import { useMainStore } from '@/stores/mainStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductStatus } from '@/types/common';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { categories, products, collections, orders, customers, fetchCategories, fetchProducts, fetchCollections, fetchOrders, fetchCustomers, loading: storeLoading, error } = useMainStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          fetchCategories(),
          fetchProducts(),
          fetchCollections(),
 
          fetchCustomers()
        ]);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fetchCategories, fetchProducts, fetchCollections, fetchOrders, fetchCustomers]);

    const totalCollections = collections.length;
  // const featuredCollections = collections.filter(collection => collection.isFeatured).length; // isFeatured no longer exists
  const totalOrders = orders.length;
  const recentOrders = orders.filter(order => new Date(order.createdAt) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length;
  const totalCustomers = customers.length;

  if (loading || storeLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
          </CardHeader>
 
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Collections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{totalCollections}</div>
            <p className="text-sm text-muted-foreground">Total collections</p>
            {/* <div className="text-2xl font-bold mb-2 mt-4">{featuredCollections}</div>
            <p className="text-sm text-muted-foreground">Featured collections</p> */} {/* Removed isFeatured */}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{totalOrders}</div>
            <p className="text-sm text-muted-foreground">Total orders</p>
            <div className="text-2xl font-bold mb-2 mt-4">{recentOrders}</div>
            <p className="text-sm text-muted-foreground">Recent orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{totalCustomers}</div>
            <p className="text-sm text-muted-foreground">Total customers</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}