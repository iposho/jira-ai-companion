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

interface SprintData {
    id: number;
    name: string;
    state: 'future' | 'active' | 'closed';
    velocity: number;
    issueCount: number;
    completedCount: number;
}

interface SprintsResponse {
    sprints: SprintData[];
    error?: string;
}

export function VelocityChart() {
    const [data, setData] = useState<SprintData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch('/api/sprints');
                if (!res.ok) throw new Error('Failed to fetch');
                const json: SprintsResponse = await res.json();
                if (json.error) throw new Error(json.error);

                // Reverse to show oldest first
                setData(json.sprints.reverse());
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
                    📊 Velocity
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
                    📊 Velocity
                </h3>
                <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                    <p>Нет данных о спринтах</p>
                </div>
            </div>
        );
    }

    const avgVelocity = data.length > 0
        ? Math.round(data.reduce((sum, s) => sum + s.velocity, 0) / data.length)
        : 0;

    // Truncate sprint names for chart
    const chartData = data.map((sprint) => ({
        ...sprint,
        shortName: sprint.name.length > 15 ? sprint.name.slice(0, 15) + '…' : sprint.name,
    }));

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    📊 Velocity
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                    Avg: <span className="font-medium text-blue-600 dark:text-blue-400">{avgVelocity} SP</span>
                </span>
            </div>

            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                        <XAxis
                            dataKey="shortName"
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
                                const sprint = payload[0].payload as SprintData;
                                return (
                                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                                        <p className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                                            {sprint.name}
                                        </p>
                                        <p className="text-blue-600 dark:text-blue-400 font-semibold">
                                            {sprint.velocity} Story Points
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {sprint.completedCount} / {sprint.issueCount} задач
                                        </p>
                                    </div>
                                );
                            }}
                        />
                        <Bar dataKey="velocity" radius={[4, 4, 0, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={index}
                                    fill={entry.state === 'active' ? '#3B82F6' : '#93C5FD'}
                                    className="transition-all duration-200 hover:opacity-80"
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
