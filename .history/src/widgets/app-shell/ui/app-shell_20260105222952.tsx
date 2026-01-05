'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/widgets/sidebar/ui/sidebar';

const SIDEBAR_STORAGE_KEY = 'sidebar-collapsed';

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
    setIsHydrated(true);
  }, [key]);

  const setValue = useCallback((value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

  return [storedValue, setValue];
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const [collapsed, setCollapsed] = useLocalStorage(SIDEBAR_STORAGE_KEY, false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (isLoginPage) {
    return <>{children}</>;
  }

  // Avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="flex min-h-screen">
        <main className="flex-1 p-4 pt-16 md:pt-4 sm:p-6 md:p-8 md:ml-64">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 rounded-xl bg-white/80 dark:bg-black/60 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 dark:text-gray-400">
          <line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - desktop */}
      <div className="hidden md:block">
        <Sidebar
          collapsed={collapsed}
          onToggle={handleToggle}
        />
      </div>

      {/* Sidebar - mobile */}
      <div
        className={`fixed inset-y-0 left-0 z-50 md:hidden transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <Sidebar
          collapsed={false}
          onToggle={() => { }}
          onClose={() => setMobileOpen(false)}
        />
      </div>

      {/* Main content */}
      <main
        className={`flex-1 p-4 pt-16 md:pt-4 sm:p-6 md:p-8 transition-all duration-300 ${collapsed ? 'md:ml-20' : 'md:ml-64'
          }`}
      >
        {children}
      </main>
    </div>
  );
}

