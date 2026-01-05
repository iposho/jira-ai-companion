export interface ReportType {
    id: 'planning' | 'daily' | 'weekly' | 'time';
    title: string;
    description: string;
    icon: string;
}

export const REPORT_TYPES: ReportType[] = [
    {
        id: 'planning',
        title: 'Планирование',
        description: 'Полный отчет по статусам и зависимостям фронтенда',
        icon: '📋',
    },
    {
        id: 'daily',
        title: 'Дейлик отчет',
        description: 'Краткая сводка: что сделано вчера и планы на сегодня',
        icon: '📆',
    },
    {
        id: 'weekly',
        title: 'Недельный отчет',
        description: 'Подробная статистика и прогресс за неделю',
        icon: '📊',
    },
    {
        id: 'time',
        title: 'Отчет о времени',
        description: 'Списанное время за произвольный период',
        icon: '⏱️',
    },
];

export interface ReportProgress {
    stage: string;
    progress: number; // 0-100
    message: string;
}

export interface GeneratedReport {
    id: string;
    type: ReportType['id'];
    title: string;
    content: string;
    storagePath: string;
    createdAt: string;
}
