"use client"
import "../../globals.css";
 
import { DM_Sans } from 'next/font/google';
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useAuthInitializer } from "@/hooks/useAuthInitializer";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Toaster } from "@/components/ui/toaster";
import { SettingsSidebar } from "@/components/SettingsSidebar";
 
 

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
 
            <div className="flex min-h-screen bg-gray-50">
              <SettingsSidebar />
              <div className="flex-1 bg-sidebar">
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
