'use client';

import { useState } from 'react';
import { ReportType } from '../model/report-types';
import { ProgressBar } from './progress-bar';

interface ReportCardProps {
    report: ReportType;
}

export function ReportCard({ report }: ReportCardProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [generatedPath, setGeneratedPath] = useState<string | null>(null);

    async function handleGenerate() {
        setIsGenerating(true);
        setProgress(0);
        setMessage('Инициализация...');
        setError(null);
        setGeneratedPath(null);

        try {
            const response = await fetch(`/api/reports/${report.id}`, {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error('Failed to generate report');
            }

            // Read streaming response
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const text = decoder.decode(value);
                    const lines = text.split('\n').filter(Boolean);

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = JSON.parse(line.slice(6));
                            if (data.progress !== undefined) {
                                setProgress(data.progress);
                            }
                            if (data.message) {
                                setMessage(data.message);
                            }
                            if (data.storagePath) {
                                setGeneratedPath(data.storagePath);
                            }
                            if (data.error) {
                                throw new Error(data.error);
                            }
                        }
                    }
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsGenerating(false);
        }
    }

    return (
        <div className="relative overflow-hidden rounded-3xl p-6 bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10 opacity-50" />

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{report.icon}</span>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {report.title}
                    </h3>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {report.description}
                </p>

                {isGenerating ? (
                    <ProgressBar progress={progress} message={message} />
                ) : error ? (
                    <div className="text-sm text-red-500 mb-4">{error}</div>
                ) : generatedPath ? (
                    <div className="text-sm text-green-600 dark:text-green-400 mb-4">
                        ✓ Отчет сгенерирован
                    </div>
                ) : null}

                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full mt-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2.5 text-white text-sm font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                    {isGenerating ? 'Генерация...' : 'Сгенерировать'}
                </button>
            </div>
        </div>
    );
}
