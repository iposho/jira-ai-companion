import { ReportsTable } from '@/features/reports/ui/reports-table';

export default function ReportsHistoryPage() {
    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    История отчетов
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Просмотр и скачивание сгенерированных отчетов
                </p>
            </div>

            <div className="bg-white/70 dark:bg-black/40 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] overflow-hidden">
                <ReportsTable />
            </div>
        </div>
    );
}
