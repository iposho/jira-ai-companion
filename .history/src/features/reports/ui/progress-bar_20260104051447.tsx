'use client';

interface ProgressBarProps {
    progress: number;
    message: string;
}

export function ProgressBar({ progress, message }: ProgressBarProps) {
    return (
        <div className="w-full space-y-2">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>{message}</span>
                <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}
