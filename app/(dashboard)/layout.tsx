"use client"
import "../globals.css";
 
import { DM_Sans } from 'next/font/google';
import { AppSidebar } from "@/components/sidebar";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useAuthInitializer } from "@/hooks/useAuthInitializer";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Toaster } from "@/components/ui/toaster";
import { useStoreInit } from "@/hooks/use-store-init";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
 
 

const inter = DM_Sans({ subsets: ['latin'] });

 

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  useAuthInitializer();
 
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          <SidebarProvider>
                    <AppSidebar />
                    <SidebarInset> 
            <div className="flex min-h-screen bg-gray-50">
             
              <div className="flex-1 bg-sidebar">
              <ProtectedRoute>
 
  
                {children}
                <Toaster />      
              </ProtectedRoute>

              
              </div>
            </div>
            </SidebarInset>
          </SidebarProvider>
 
        </ThemeProvider>
      </body>
    </html>
  );
}

// function StoreInitializer() {
//   useStoreInit()
//   return null
// }