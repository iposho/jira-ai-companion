'use client';

import { useEffect, useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';

interface BurndownPoint {
    date: string;
    remaining: number;
    ideal: number;
    day: number;
}

interface SprintData {
    id: number;
    name: string;
    state: 'future' | 'active' | 'closed';
}

export function BurndownChart() {
    const [data, setData] = useState<BurndownPoint[]>([]);
    const [activeSprint, setActiveSprint] = useState<SprintData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                // First get active sprint
                const sprintsRes = await fetch('/api/sprints');
                if (!sprintsRes.ok) throw new Error('Failed to fetch sprints');
                const sprintsJson = await sprintsRes.json();
                if (sprintsJson.error) throw new Error(sprintsJson.error);

                const active = sprintsJson.sprints.find((s: SprintData) => s.state === 'active');
                if (!active) {
                    setError('Нет активного спринта');
                    setLoading(false);
                    return;
                }

                setActiveSprint(active);

                // Then get burndown data
                const burndownRes = await fetch(`/api/sprints/${active.id}/burndown`);
                if (!burndownRes.ok) throw new Error('Failed to fetch burndown');
                const burndownJson = await burndownRes.json();
                if (burndownJson.error) throw new Error(burndownJson.error);

                setData(burndownJson.data);
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
                    📉 Burndown
                </h3>
                <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    // Format dates for display
    const chartData = data.map((point) => ({
        ...point,
        displayDate: new Date(point.date).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
        }),
    }));

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    📉 Burndown
                </h3>
                {activeSprint && (
                    <span className="text-sm text-gray-500 dark:text-gray-400 max-w-[200px] truncate">
                        {activeSprint.name}
                    </span>
                )}
            </div>

            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                        <XAxis
                            dataKey="displayDate"
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
                            content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                const point = payload[0].payload as BurndownPoint & { displayDate: string };
                                return (
                                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                                        <p className="font-medium text-gray-900 dark:text-white text-sm mb-2">
                                            День {point.day + 1}
                                        </p>
                                        <p className="text-blue-600 dark:text-blue-400 text-sm">
                                            Осталось: <span className="font-semibold">{Math.round(point.remaining)} SP</span>
                                        </p>
                                        <p className="text-gray-400 text-sm">
                                            Идеал: <span className="font-semibold">{Math.round(point.ideal)} SP</span>
                                        </p>
                                    </div>
                                );
                            }}
                        />
                        <Legend
                            iconType="line"
                            wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="ideal"
                            name="Идеал"
                            stroke="#9CA3AF"
                            strokeDasharray="5 5"
                            strokeWidth={2}
                            dot={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="remaining"
                            name="Факт"
                            stroke="#3B82F6"
                            strokeWidth={2}
                            dot={{ fill: '#3B82F6', r: 4 }}
                            activeDot={{ r: 6, fill: '#2563EB' }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
