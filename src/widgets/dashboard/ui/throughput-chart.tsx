'use client';

import { useEffect, useState } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';

interface WeeklyData {
    week: string;
    completed: number;
    created: number;
}

interface KanbanStatsResponse {
    weeklyThroughput: WeeklyData[];
    avgLeadTime: number;
    error?: string;
}

export function ThroughputChart() {
    const [data, setData] = useState<WeeklyData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [avgLeadTime, setAvgLeadTime] = useState(0);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch('/api/kanban-stats');
                if (!res.ok) throw new Error('Failed to fetch');
                const json: KanbanStatsResponse = await res.json();
                if (json.error) throw new Error(json.error);

                setData(json.weeklyThroughput);
                setAvgLeadTime(json.avgLeadTime);
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
                    📈 Throughput
                </h3>
                <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    const totalCompleted = data.reduce((sum, w) => sum + w.completed, 0);
    const avgPerWeek = data.length > 0 ? Math.round(totalCompleted / data.length) : 0;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    📈 Throughput
                </h3>
                <div className="flex gap-4 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                        Avg: <span className="font-medium text-green-600 dark:text-green-400">{avgPerWeek}/нед</span>
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                        Lead Time: <span className="font-medium text-blue-600 dark:text-blue-400">{avgLeadTime}д</span>
                    </span>
                </div>
            </div>

            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                        <XAxis
                            dataKey="week"
                            tick={{ fontSize: 11 }}
                            className="text-gray-600 dark:text-gray-400"
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 12 }}
                            className="text-gray-600 dark:text-gray-400"
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            content={({ active, payload, label }) => {
                                if (!active || !payload?.length) return null;
                                return (
                                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                                        <p className="font-medium text-gray-900 dark:text-white text-sm mb-2">
                                            Неделя {label}
                                        </p>
                                        <p className="text-green-600 dark:text-green-400 text-sm">
                                            Завершено: <span className="font-semibold">{payload[0]?.value}</span>
                                        </p>
                                        <p className="text-blue-600 dark:text-blue-400 text-sm">
                                            Создано: <span className="font-semibold">{payload[1]?.value}</span>
                                        </p>
                                    </div>
                                );
                            }}
                        />
                        <Legend
                            iconType="circle"
                            wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="completed"
                            name="Завершено"
                            stroke="#10B981"
                            fill="url(#colorCompleted)"
                            strokeWidth={2}
                        />
                        <Area
                            type="monotone"
                            dataKey="created"
                            name="Создано"
                            stroke="#3B82F6"
                            fill="url(#colorCreated)"
                            strokeWidth={2}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
