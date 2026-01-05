import { ThemeToggle } from "@/features/theme/ui/theme-toggle";

export function DashboardHeader() {
    return (
        <header className="flex justify-between items-center mb-12">
            <div>
                <h1 className="text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">
                    Jira Assistant
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Обзор фронтовых задач в DEV
                </p>
            </div>
            <ThemeToggle />
        </header>
    );
}
