'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/features/theme/ui/theme-toggle';

const navItems = [
    { href: '/', label: 'Дашборд', icon: '📊' },
    { href: '/reports', label: 'Генерация', icon: '📝' },
    { href: '/reports/history', label: 'История', icon: '📋' },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-white/70 dark:bg-black/40 backdrop-blur-xl border-r border-white/20 dark:border-white/10 p-6 flex flex-col z-50">
            <div className="mb-8">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    Jira AI
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Companion
                </p>
            </div>

            <nav className="flex-1 space-y-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/' && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
                                }`}
                        >
                            <span className="text-lg">{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Тема</span>
                    <ThemeToggle />
                </div>
            </div>
        </aside>
    );
}
