'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/widgets/sidebar/ui/sidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLoginPage = pathname === '/login';

    if (isLoginPage) {
        return <>{children}</>;
    }

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-64 p-8 sm:p-12">
                {children}
            </main>
        </div>
    );
}
