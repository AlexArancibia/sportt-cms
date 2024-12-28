'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Home, Package, ShoppingCart, Users, Settings, ChevronDown, LayoutGrid, LogOut, FolderKanban, Ticket, TestTube } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useAuthStore } from '@/stores/authStore';

export function Sidebar() {
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const pathname = usePathname();

  const toggleGroup = (group: string) => {
    setActiveGroup(activeGroup === group ? null : group);
  };

  return (
    <div className="w-72 min-h-screen bg-sidebar text-sidebar-foreground flex flex-col border-r border-border">
      <div className="p-4 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-semibold pl-2">Sportt Perú</span>
        </Link>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          <NavItem href="/" icon={<Home size={20} />} active={pathname === '/'}>
            Home
          </NavItem>
          <NavItem
            href="/products"
            icon={<Package size={20} />}
            active={pathname.startsWith('/products')}
          >
            Products
          </NavItem>
          <NavItem
            href="/categories"
            icon={<LayoutGrid size={20} />}
            active={pathname.startsWith('/categories')}
          >
            Categories
          </NavItem>
          <NavItem
            href="/collections"
            icon={<FolderKanban size={20} />}
            active={pathname.startsWith('/collections')}
          >
            Collections
          </NavItem>
          <NavGroupItem
            icon={<ShoppingCart size={20} />}
            text="Orders"
            active={activeGroup === 'orders'}
            onClick={() => toggleGroup('orders')}
          >
            <NavItem href="/orders" active={pathname === '/orders'} className="pl-4">
              All Orders
            </NavItem>
            <NavItem href="/orders/drafts" active={pathname === '/orders/drafts'} className="pl-4">
              Drafts
            </NavItem>
          </NavGroupItem>
          <NavItem
            href="/customers"
            icon={<Users size={20} />}
            active={pathname.startsWith('/customers')}
          >
            Customers
          </NavItem>
          <NavItem
            href="/coupons"
            icon={<Ticket size={20} />}
            active={pathname.startsWith('/coupons')}
          >
            Coupons
          </NavItem>

          <NavItem
            href="/test"
            icon={<TestTube size={20} />}
            active={pathname.startsWith('/test')}
          >
            Test
          </NavItem>
        </div>
      </ScrollArea>
      <div className="p-2 border-t border-sidebar-border space-y-1">
        <ThemeToggle />
        <NavItem
          href="/settings"
          icon={<Settings size={20} />}
          active={pathname.startsWith('/settings')}
        >
          Settings
        </NavItem>
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

function NavItem({
  href,
  icon,
  children,
  className,
  active,
}: {
  href: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  active?: boolean;
}) {
  return (
    <Link href={href}>
      <Button
        variant="ghost"
        className={cn(
          'w-full justify-start mb-1',
          active ? 'bg-accent text-accent-foreground' : '',
          className
        )}
      >
        {icon && <span className="mr-2">{icon}</span>}
        {children}
      </Button>
    </Link>
  );
}

function NavGroupItem({
  icon,
  text,
  children,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  text: string;
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <div>
      <Button
        variant="ghost"
        className={cn(
          'w-full justify-start',
          active ? '' : ''
        )}
        onClick={onClick}
      >
        <span className="mr-2">{icon}</span>
        {text}
        <ChevronDown
          className={cn('ml-auto h-4 w-4 transition-transform', active && 'transform rotate-180')}
        />
      </Button>
      {active && <div className="my-2 ml-6 pl-2 border-l border-border">{children}</div>}
    </div>
  );
}

