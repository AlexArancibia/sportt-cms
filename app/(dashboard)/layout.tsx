"use client"
import "../globals.css";
 
import { DM_Sans } from 'next/font/google';
import { Sidebar } from "@/components/sidebar";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useAuthInitializer } from "@/hooks/useAuthInitializer";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuthStore } from "@/stores/authStore";
import { useState } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Toaster } from "@/components/ui/toaster";
 
 

const inter = DM_Sans({ subsets: ['latin'] });

 

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  useAuthInitializer();
  const loading = useAuthStore(state => state.loading)
  const [isTransitioning, setIsTransitioning] = useState(false);
 
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
 
            <div className="flex min-h-screen bg-gray-50">
              <Sidebar />
              <div className="flex-1 bg-background">
              <ProtectedRoute>
  
                {children}
                <Toaster />      
              </ProtectedRoute>
              </div>
            </div>
 
        </ThemeProvider>
      </body>
    </html>
  );
}
