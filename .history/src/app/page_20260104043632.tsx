import { DashboardHeader } from "@/widgets/dashboard/ui/dashboard-header";
import { StatTile } from "@/widgets/dashboard/ui/stat-tile";

async function getStats() {
  try {
    const baseUrl = process.env.URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/stats`, {
      cache: 'no-store',
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
      <DashboardHeader />

      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatTile 
          count={stats.count || 0} 
          error={stats.error}
          label={['Активная задача', 'Активные задачи', 'Активных задач']}
        />
      </main>
    </div>
  );
}
