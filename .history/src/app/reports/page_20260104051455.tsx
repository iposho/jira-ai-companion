import { ReportCard } from '@/features/reports/ui/report-card';
import { REPORT_TYPES } from '@/features/reports/model/report-types';
import { DashboardHeader } from '@/widgets/dashboard/ui/dashboard-header';

export default function ReportsPage() {
    return (
        <div className="min-h-screen p-8 sm:p-20 font-[family-name:var(--font-geist-sans)] bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <DashboardHeader />

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Отчеты
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
