'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Package, BookOpen, LogOut } from 'lucide-react';
import { clearSession } from '@/lib/auth';
import { getVendor } from '@/lib/auth';

const NAV = [
  { href: '/dashboard', label: 'Overview',  icon: LayoutDashboard },
  { href: '/job',      label: 'Jobs',      icon: Package },
  { href: '/catalog',   label: 'Catalog',   icon: BookOpen },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const vendor   = getVendor();

  const handleLogout = () => {
    clearSession();
    router.push('/login');
  };

  return (
    <aside className="w-56 min-h-screen bg-white border-r border-gray-100 flex flex-col">
      {/* Brand */}
      <div className="h-14 flex items-center px-5 border-b border-gray-100">
        <span className="text-sm font-semibold text-gray-900 truncate">
          {vendor?.name ?? 'Vendor Portal'}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                active
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}