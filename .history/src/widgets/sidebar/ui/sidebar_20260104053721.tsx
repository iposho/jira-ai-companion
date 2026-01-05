'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/features/theme/ui/theme-toggle';

const navItems = [
  { href: '/', label: 'Дашборд', icon: '📊' },
  { href: '/reports', label: 'Генерация', icon: '📝' },
  { href: '/history', label: 'История', icon: '📋' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onClose?: () => void;
}

export function Sidebar({ collapsed, onToggle, onClose }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href) && (pathname === href || pathname.startsWith(href + '/'));
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white/80 dark:bg-black/60 backdrop-blur-xl border-r border-white/20 dark:border-white/10 p-4 flex flex-col z-50 transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className={`flex items-center mb-6 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Jira companion
            </h1>
          </div>
        )}
        <button
          onClick={onToggle}
          className="hidden md:flex p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
          title={collapsed ? 'Развернуть' : 'Свернуть'}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
          >
            <path d="m11 17-5-5 5-5" />
            <path d="m18 17-5-5 5-5" />
          </svg>
        </button>
        {/* Mobile close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                active
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
              } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <span className="text-lg">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={`pt-4 border-t border-gray-200 dark:border-gray-700 ${collapsed ? 'flex justify-center' : ''}`}>
        {!collapsed ? (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">Тема</span>
            <ThemeToggle />
          </div>
        ) : (
          <ThemeToggle />
        )}
      </div>
    </aside>
  );
}
