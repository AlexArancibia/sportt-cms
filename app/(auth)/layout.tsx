  
"use client"
import "../globals.css";
 import { Inter } from 'next/font/google';
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useAuthInitializer } from "@/hooks/useAuthInitializer";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useAuthStore } from "@/stores/authStore";
import { useState } from "react";
 

const inter = Inter({ subsets: ['latin'] });

 

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
 
              <div className="flex-1 bg-background">
              <ProtectedRoute>{children}</ProtectedRoute>
              </div>
 
        </ThemeProvider>
      </body>
    </html>
  );
}
