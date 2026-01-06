import { getAllIssues, getIssueWorklogs } from '@/shared/api/jira';
import { JIRA_CONSTANTS } from '@/shared/config/jira-constants';
import { analyzeWithLLM, isGroqConfigured } from '@/shared/api/groq';
import { ReportFilters } from '../model/report-types';

/**
 * Generates weekly progress report
 */
export async function generateWeeklyReport(
    onProgress: (progress: number, message: string) => void,
    filters?: ReportFilters
): Promise<string> {
    const users = filters?.users || JIRA_CONSTANTS.ACTIVE_USERS;
    const projectKey = filters?.projectKey || JIRA_CONSTANTS.PROJECT_KEY;
    const jiraHost = process.env.JIRA_HOST?.replace(/\/$/, '');

    // Use filters dateFrom/dateTo if provided, otherwise use week ago
    let weekAgo: Date;
    let now: Date;
    
    if (filters?.dateFrom) {
        weekAgo = new Date(filters.dateFrom);
        weekAgo.setHours(0, 0, 0, 0);
        now = filters?.dateTo ? new Date(filters.dateTo) : new Date();
        now.setHours(23, 59, 59, 999);
    } else {
        // Default: week ago
        weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        weekAgo.setHours(0, 0, 0, 0);
        now = new Date();
        now.setHours(23, 59, 59, 999);
    }

    onProgress(10, 'Загрузка задач...');

    const jql = `project = ${projectKey} AND assignee IN ("${users.join('", "')}") AND updated >= -7d`;
    const tasks = await getAllIssues(jql);

    onProgress(30, 'Анализ статистики...');

    // Completed this week
    const completed = tasks.filter(t => {
        const status = (t.fields.status as { name?: string })?.name?.toLowerCase() || '';
        return ['done', 'closed', 'готово'].some(s => status.includes(s));
    });

    // Created this week
    const created = tasks.filter(t => {
        const createdDate = new Date(String(t.fields.created || ''));
        return createdDate >= weekAgo;
    });

    onProgress(50, 'Анализ worklogs...');

    // Time tracking
    let totalTime = 0;
    const userTime: Record<string, number> = {};

    for (const user of users) {
        userTime[user] = 0;
    }

    for (const task of tasks.slice(0, 100)) {
        const worklogs = await getIssueWorklogs(task.key || task.id);
        for (const w of worklogs) {
            const wDate = new Date(w.started);
            if (wDate >= weekAgo && wDate <= now) {
                totalTime += w.timeSpentSeconds;
                const email = w.author?.emailAddress;
                if (email && userTime[email] !== undefined) {
                    userTime[email] += w.timeSpentSeconds;
                }
            }
        }
    }

    // LLM analysis
    let llmAdvice = '';
    if (isGroqConfigured()) {
        onProgress(70, 'Анализ от LLM...');
        try {
            const prompt = `Проанализируй недельный прогресс команды.

**Проект:** ${projectKey}
**Период:** ${weekAgo.toLocaleDateString('ru-RU')} - ${now.toLocaleDateString('ru-RU')}

**Статистика:**
- Обновлено задач: ${tasks.length}
- Завершено: ${completed.length}
- Создано: ${created.length}
- Списано времени: ${formatTime(totalTime)}

**По участникам:**
${users.map(u => `- ${u}: ${formatTime(userTime[u])}`).join('\n')}

Дай краткую оценку прогресса и 3-5 рекомендаций на следующую неделю. На русском.`;
            llmAdvice = await analyzeWithLLM(prompt);
        } catch (e) {
            console.warn('LLM failed:', e);
        }
    }

    onProgress(90, 'Генерация отчета...');

    let md = `# Недельный отчет\n\n`;
    md += `**Проект:** ${projectKey}\n`;
    md += `**Период:** ${weekAgo.toLocaleDateString('ru-RU')} - ${now.toLocaleDateString('ru-RU')}\n\n`;

    md += `## 📊 Статистика\n\n`;
    md += `| Метрика | Значение |\n| :--- | :--- |\n`;
    md += `| Обновлено задач | ${tasks.length} |\n`;
    md += `| Завершено | ${completed.length} |\n`;
    md += `| Создано | ${created.length} |\n`;
    md += `| Списано времени | ${formatTime(totalTime)} |\n\n`;

    md += `## 👥 По участникам\n\n`;
    md += `| Участник | Время |\n| :--- | :--- |\n`;
    for (const [user, time] of Object.entries(userTime)) {
        md += `| ${user} | ${formatTime(time)} |\n`;
    }
    md += `\n`;

    if (completed.length > 0) {
        md += `## ✅ Завершенные задачи\n\n`;
        for (const t of completed.slice(0, 15)) {
            md += `- [${t.key}](${jiraHost}/browse/${t.key}) - ${t.fields.summary}\n`;
        }
        md += `\n`;
    }

    if (llmAdvice) {
        md += `## 💡 Анализ и рекомендации\n\n${llmAdvice}\n\n`;
    }

    md += `---\n*Отчет сгенерирован автоматически*\n`;

    onProgress(100, 'Готово');
    return md;
}

function formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}ч ${m}м` : `${m}м`;
}
