'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/shared/api/supabase-client';
import type { Report } from '@/shared/api/supabase';
import { MarkdownModal } from '@/shared/ui/markdown-modal';

type SortField = 'created_at' | 'type' | 'title';
type SortOrder = 'asc' | 'desc';

function SortIcon({ field, sortField, sortOrder }: { field: SortField; sortField: SortField; sortOrder: SortOrder }) {
  if (sortField !== field) return <span className="text-gray-300 ml-1">↕</span>;
  return <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
}

export function ReportsTable() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [currentReport, setCurrentReport] = useState<Report | null>(null);

  const fetchReports = useCallback(async () => {
    const supabase = createClient();
    setLoading(true);
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order(sortField, { ascending: sortOrder === 'asc' });

    if (!error && data) {
      setReports(data as Report[]);
    }
    setLoading(false);
  }, [sortField, sortOrder]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

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
    const supabase = createClient();
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
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from('reports')
      .download(report.storage_path);

    if (error || !data) {
      console.error('View error:', error);
      return;
    }

    const text = await data.text();
    setModalContent(text);
    setModalTitle(report.title);
    setModalOpen(true);
  }

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
    <>
      <MarkdownModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        content={modalContent}
        title={modalTitle}
      />

      {/* Mobile cards */}
      <div className="md:hidden space-y-4 p-4">
        {reports.map((report) => (
          <div
            key={report.id}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium">
                {getTypeLabel(report.type)}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(report.created_at)}
              </span>
            </div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
              {report.title}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => handleView(report)}
                className="flex-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Просмотр
              </button>
              <button
                onClick={() => handleDownload(report)}
                className="flex-1 px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Скачать
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th
                onClick={() => handleSort('type')}
                className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                Тип <SortIcon field="type" sortField={sortField} sortOrder={sortOrder} />
              </th>
              <th
                onClick={() => handleSort('title')}
                className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                Название <SortIcon field="title" sortField={sortField} sortOrder={sortOrder} />
              </th>
              <th
                onClick={() => handleSort('created_at')}
                className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                Дата <SortIcon field="created_at" sortField={sortField} sortOrder={sortOrder} />
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
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium">
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
    </>
  );
}
