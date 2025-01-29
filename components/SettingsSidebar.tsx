'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Store, CreditCard, Truck, Users, ShieldCheck, Globe, Palette, Bell, Settings, LogOut, ArrowLeft, HandCoins, SmartphoneNfc } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useAuthStore } from '@/stores/authStore';

const settingsLinks = [
  { href: "/settings", icon: Store, label: "General" },
  { href: "/settings/currencies", icon: CreditCard, label: "Currencies" },
  { href: "/settings/shipping", icon: Truck, label: "Shipping" },
  { href: "/settings/payments", icon: SmartphoneNfc, label: "Payments" },
  { href: "/settings/users", icon: Users, label: "Users" },
  { href: "/settings/notifications", icon: Bell, label: "Notifications" },
];

export function SettingsSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="w-72 min-h-screen bg-sidebar text-sidebar-foreground flex flex-col border-r border-border">
      <div className="p-4 border-b border-sidebar-border">
        <Button
          variant="ghost"
          className="flex items-center gap-2"
          onClick={() => router.back()}
        >
          <ArrowLeft size={20} />
          <span className="font-semibold">Back</span>
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {settingsLinks.map((link) => (
            <Button
              key={link.href}
              asChild
              variant="ghost"
              className={cn(
                "w-full justify-start mb-1",
                pathname === link.href && "bg-accent text-accent-foreground"
              )}
            >
              <Link href={link.href}>
                <link.icon className="mr-2 h-5 w-5" />
                {link.label}
              </Link>
            </Button>
          ))}
        </div>
      </ScrollArea>
      <div className="p-2 border-t border-sidebar-border space-y-1">
        <ThemeToggle />
        <Button
          variant="ghost"
          className="w-full justify-start"
          asChild
        >
          <Link href="/settings">
            <Settings size={20} className="mr-2" /> Settings
          </Link>
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-100"
          onClick={() => useAuthStore.getState().logout()}
        >
          <LogOut size={20} className="mr-2" /> Logout
        </Button>
      </div>
    </div>
  );
}

