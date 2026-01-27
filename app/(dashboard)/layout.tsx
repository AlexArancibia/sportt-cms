"use client"
import "../globals.css";
 
import { AppSidebar } from "@/components/sidebar";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ReactQueryProvider } from "@/contexts/ReactQueryProvider";
import { useAuthInitializer } from "@/hooks/useAuthInitializer";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Toaster } from "@/components/ui/toaster";
import { useStoreInit } from "@/hooks/use-store-init";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
 
// Avenir font configuration
const avenir = {
  className: 'font-avenir'
};

 

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  useAuthInitializer();
 
  return (
    <html lang="en">
      <body className={avenir.className}>
        <ThemeProvider>
          <ReactQueryProvider>
            <SidebarProvider>
                    <AppSidebar />
                    <SidebarInset> 
            <div className="flex min-h-screen bg-sidebar">
             
              <div className="flex-1 bg-sidebar">
              <ProtectedRoute>
 
                <div className="bg-sidebar p-0 md:p-3 pl-0">
                {children}
                </div>
                <Toaster />      
              </ProtectedRoute>

              
              </div>
            </div>
            </SidebarInset>
            </SidebarProvider>
          </ReactQueryProvider>
 
        </ThemeProvider>
      </body>
    </html>
  );
}

// function StoreInitializer() {
//   useStoreInit()
//   return null
// }