'use client';

import { useState } from 'react';
import { ReportFilters } from '../model/report-types';
import { JIRA_CONSTANTS } from '@/shared/config/jira-constants';

interface ReportFiltersModalProps {
    isOpen: boolean;
    reportTitle: string;
    reportType?: 'daily' | 'weekly' | 'time' | 'planning';
    onClose: () => void;
    onConfirm: (filters: ReportFilters) => void;
}

function getDefaultDates(reportType?: 'daily' | 'weekly' | 'time' | 'planning') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (reportType === 'daily') {
        // Вчерашний день
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return {
            dateFrom: yesterday.toISOString().split('T')[0],
            dateTo: yesterday.toISOString().split('T')[0],
        };
    } else if (reportType === 'weekly' || reportType === 'time') {
        // Неделя назад от текущей даты (первая дата - неделя назад)
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return {
            dateFrom: weekAgo.toISOString().split('T')[0],
            dateTo: today.toISOString().split('T')[0],
        };
    } else {
        // По умолчанию - последние 30 дней
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        return {
            dateTo: today.toISOString().split('T')[0],
            dateFrom: thirtyDaysAgo.toISOString().split('T')[0],
        };
    }
}

export function ReportFiltersModal({
    isOpen,
    reportTitle,
    reportType,
    onClose,
    onConfirm,
}: ReportFiltersModalProps) {
    // Инициализируем состояние с дефолтными значениями для текущего типа отчета
    const defaultDates = getDefaultDates(reportType);
    const [dateFrom, setDateFrom] = useState(defaultDates.dateFrom);
    const [dateTo, setDateTo] = useState(defaultDates.dateTo);
    const [selectedUsers, setSelectedUsers] = useState<string[]>(JIRA_CONSTANTS.ACTIVE_USERS);
    const [projectKey, setProjectKey] = useState<'DEV' | 'PRODUCT'>('DEV');

    const handleUserToggle = (user: string) => {
        setSelectedUsers((prev) =>
            prev.includes(user)
                ? prev.filter((u) => u !== user)
                : [...prev, user]
        );
    };

    const handleConfirm = () => {
        onConfirm({
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
            users: selectedUsers.length > 0 ? selectedUsers : undefined,
            projectKey: projectKey || undefined,
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-md mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Параметры отчёта
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {reportTitle}
                    </p>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
                    {/* Date Range */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            📅 Диапазон дат
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                    От
                                </label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                    До
                                </label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Users */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            👥 Участники
                        </label>
                        <div className="space-y-2">
                            {JIRA_CONSTANTS.ACTIVE_USERS.map((user) => (
                                <label
                                    key={user}
                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.includes(user)}
                                        onChange={() => handleUserToggle(user)}
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                        {user}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Project Key */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            📁 Проект
                        </label>
                        <select
                            value={projectKey}
                            onChange={(e) => setProjectKey(e.target.value as 'DEV' | 'PRODUCT')}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="DEV">DEV</option>
                            <option value="PRODUCT">PRODUCT</option>
                        </select>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end bg-gray-50 dark:bg-gray-800/50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        Отмена
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition-all shadow-sm"
                    >
                        Сгенерировать
                    </button>
                </div>
            </div>
        </div>
    );
}
