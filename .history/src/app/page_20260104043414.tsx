import { ThemeToggle } from "@/components/theme-toggle";

async function getStats() {
  try {
    const res = await fetch(process.env.URL ? `${process.env.URL}/api/stats` : 'http://localhost:3000/api/stats', {
      cache: 'no-store', // Disable cache for real-time data
    });
    if (!res.ok) return { count: 0, error: true };
    return res.json();
  } catch (e) {
    return { count: 0, error: true };
  }
}

export default async function Home() {
  const stats = await getStats();

  return (
    <div className="min-h-screen p-8 sm:p-20 font-[family-name:var(--font-geist-sans)] bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">
            Jira Assistant
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Обзор проекта DEV
          </p>
        </div>
        <ThemeToggle />
      </header>

      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Glassmorphic Tile */}
        <div className="relative overflow-hidden rounded-3xl p-8 
          bg-white/70 dark:bg-black/40 
          backdrop-blur-xl border border-white/20 dark:border-white/10
          shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)]
          transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]
        ">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10 opacity-50" />

          <div className="relative z-10 flex flex-col items-start h-full justify-between min-h-[160px]">
            <div className="flex items-center space-x-3 text-blue-600 dark:text-blue-400 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-activity"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
              <span className="font-medium text-sm uppercase tracking-wider opacity-80">Назначено мне</span>
            </div>

            <div className="mt-auto">
              <div className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                {stats.error ? "-" : stats.count}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">
                {pluralize(stats.count, ['Активная задача', 'Активные задачи', 'Активных задач'])}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
