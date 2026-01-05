'use client';

import { useEffect, useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';

interface StatusData {
    status: string;
    count: number;
    color: string;
}

interface KanbanStatsResponse {
    statusDistribution: StatusData[];
    wipCount: number;
    avgLeadTime: number;
    error?: string;
}

export function StatusDistributionChart() {
    const [data, setData] = useState<StatusData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [wipCount, setWipCount] = useState(0);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch('/api/kanban-stats');
                if (!res.ok) throw new Error('Failed to fetch');
                const json: KanbanStatsResponse = await res.json();
                if (json.error) throw new Error(json.error);

                setData(json.statusDistribution);
                setWipCount(json.wipCount);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load');
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
                    <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    📊 Задачи по статусам
                </h3>
                <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    📊 Задачи по статусам
                </h3>
                <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                    <p>Нет данных о задачах</p>
                </div>
            </div>
        );
    }

    const total = data.reduce((sum, s) => sum + s.count, 0);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    📊 Задачи по статусам
                </h3>
                <div className="flex gap-4 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                        Всего: <span className="font-medium text-gray-900 dark:text-white">{total}</span>
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                        WIP: <span className="font-medium text-blue-600 dark:text-blue-400">{wipCount}</span>
                    </span>
                </div>
            </div>

            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" horizontal={false} />
                        <XAxis
                            type="number"
                            tick={{ fontSize: 12 }}
                            className="text-gray-600 dark:text-gray-400"
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            type="category"
                            dataKey="status"
                            tick={{ fontSize: 12 }}
                            className="text-gray-600 dark:text-gray-400"
                            tickLine={false}
                            axisLine={false}
                            width={90}
                        />
                        <Tooltip
                            content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                const item = payload[0].payload as StatusData;
                                return (
                                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                                            {item.status}
                                        </p>
                                        <p className="text-blue-600 dark:text-blue-400 font-semibold">
                                            {item.count} задач ({Math.round((item.count / total) * 100)}%)
                                        </p>
                                    </div>
                                );
                            }}
                        />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={index} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
