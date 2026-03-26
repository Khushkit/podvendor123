'use client';

import { useRouter } from 'next/navigation';
import { Bell, LogOut } from 'lucide-react';
import { clearSession, getVendor } from '@/lib/auth';

export default function TopBar() {
  const router = useRouter();
  const vendor = getVendor();

  const handleLogout = () => {
    clearSession();
    router.push('/login');
  };

  return (
    <header className="h-14 flex items-center justify-between px-6 bg-white border-b border-gray-100 shrink-0">
      <p className="text-sm font-semibold text-gray-900 truncate">
        {vendor?.name ?? 'Vendor Portal'}
      </p>
      <div className="flex items-center gap-2">
        {/* Notification bell — placeholder */}
        <button
          className="relative flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {/* Unread dot placeholder */}
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-600 hover:bg-red-50 hover:text-red-600 border border-gray-200 hover:border-red-200 transition"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </header>
  );
}
