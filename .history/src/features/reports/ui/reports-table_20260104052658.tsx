'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/shared/api/supabase-client';
import type { Report } from '@/shared/api/supabase';

type SortField = 'created_at' | 'type' | 'title';
type SortOrder = 'asc' | 'desc';

export function ReportsTable() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortField, setSortField] = useState<SortField>('created_at');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const supabase = createClient();

    useEffect(() => {
        async function fetchReports() {
            setLoading(true);
            const { data, error } = await supabase
                .from('reports')
                .select('*')
                .order(sortField, { ascending: sortOrder === 'asc' });

            if (!error && data) {
                setReports(data as Report[]);
            }
            setLoading(false);
        }

        fetchReports();
    }, [sortField, sortOrder]);

    function handleSort(field: SortField) {
        if (field === sortField) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
    }

    function getTypeLabel(type: string): string {
        const labels: Record<string, string> = {
            planning: 'Планирование',
            daily: 'Дейлик',
            weekly: 'Недельный',
            time: 'Время',
        };
        return labels[type] || type;
    }

    function formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    async function handleDownload(report: Report) {
        const { data, error } = await supabase.storage
            .from('reports')
            .download(report.storage_path);

        if (error || !data) {
            console.error('Download error:', error);
            return;
        }

        const text = await data.text();
        const blob = new Blob([text], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${report.type}-${report.created_at.split('T')[0]}.md`;
        a.click();
        URL.revokeObjectURL(url);
    }

    async function handleView(report: Report) {
        const { data, error } = await supabase.storage
            .from('reports')
            .download(report.storage_path);

        if (error || !data) {
            console.error('View error:', error);
            return;
        }

        const text = await data.text();
        // Open in new tab with markdown content
        const newWindow = window.open('', '_blank');
        if (newWindow) {
            newWindow.document.write(`
        <html>
          <head>
            <title>${report.title}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; max-width: 900px; margin: 0 auto; line-height: 1.6; }
              pre { background: #f5f5f5; padding: 16px; border-radius: 8px; overflow-x: auto; }
              code { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; }
              table { border-collapse: collapse; width: 100%; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background: #f5f5f5; }
            </style>
          </head>
          <body><pre>${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre></body>
        </html>
      `);
        }
    }

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <span className="text-gray-300">↕</span>;
        return <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-gray-500 dark:text-gray-400">Загрузка...</div>
            </div>
        );
    }

    if (reports.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="text-4xl mb-4">📭</div>
                <p className="text-gray-500 dark:text-gray-400">
                    Отчетов пока нет. Создайте первый отчет!
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th
                            onClick={() => handleSort('type')}
                            className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                        >
                            Тип <SortIcon field="type" />
                        </th>
                        <th
                            onClick={() => handleSort('title')}
                            className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                        >
                            Название <SortIcon field="title" />
                        </th>
                        <th
                            onClick={() => handleSort('created_at')}
                            className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                        >
                            Дата <SortIcon field="created_at" />
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">
                            Действия
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {reports.map((report) => (
                        <tr
                            key={report.id}
                            className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                        >
                            <td className="px-4 py-4">
                                <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium">
                                    {getTypeLabel(report.type)}
                                </span>
                            </td>
                            <td className="px-4 py-4 text-gray-900 dark:text-white">
                                {report.title}
                            </td>
                            <td className="px-4 py-4 text-gray-500 dark:text-gray-400 text-sm">
                                {formatDate(report.created_at)}
                            </td>
                            <td className="px-4 py-4 text-right space-x-2">
                                <button
                                    onClick={() => handleView(report)}
                                    className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                >
                                    Просмотр
                                </button>
                                <button
                                    onClick={() => handleDownload(report)}
                                    className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                >
                                    Скачать
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
