import { StatTile } from "@/widgets/dashboard/ui/stat-tile";
import { StatusDistributionChart } from "@/widgets/dashboard/ui/status-distribution-chart";
import { ThroughputChart } from "@/widgets/dashboard/ui/throughput-chart";

export const dynamic = 'force-dynamic';

async function getStats() {
  try {
    // В серверных компонентах Next.js для внутренних запросов используем localhost
    // с портом из переменной окружения PORT
    const port = process.env.PORT || '3000';
    const baseUrl = `http://localhost:${port}`;
    
    const res = await fetch(`${baseUrl}/api/stats`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) {
      console.error(`Failed to fetch stats: ${res.status} ${res.statusText}`);
      return { count: 0, error: true };
    }
    return res.json();
  } catch (error) {
    console.error('Error fetching stats:', error);
    return { count: 0, error: true };
  }
}

export default async function Home() {
  const stats = await getStats();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Дашборд
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Статистика по задачам Frontend команды
        </p>
      </div>

      {/* Stats tiles */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatTile
          count={stats.activeCount || 0}
          error={stats.error}
          label={['Активная задача', 'Активные задачи', 'Активных задач']}
          href={stats.activeUrl}
        />
        <StatTile
          count={stats.unassignedCount || 0}
          error={stats.error}
          label={['Неназначенная задача', 'Неназначенные задачи', 'Неназначенных задач']}
          href={stats.unassignedUrl}
        />
        <StatTile
          count={stats.reviewCount || 0}
          error={stats.error}
          label={['На ревью', 'На ревью', 'На ревью']}
          href={stats.reviewUrl}
        />
      </section>

      {/* Kanban charts */}
      <section className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatusDistributionChart />
        <ThroughputChart />
      </section>
    </div>
  );
}

