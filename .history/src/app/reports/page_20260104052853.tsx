import { ReportCard } from '@/features/reports/ui/report-card';
import { REPORT_TYPES } from '@/features/reports/model/report-types';

export default function ReportsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Генерация отчетов
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Выберите тип отчета для генерации
        </p>
      </div>

      <main className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {REPORT_TYPES.map((report) => (
          <ReportCard key={report.id} report={report} />
        ))}
      </main>
    </div>
  );
}
