import { getAllIssues, getIssueWorklogs } from '@/shared/api/jira';
import { JIRA_CONSTANTS } from '@/shared/config/jira-constants';

/**
 * Generates time tracking report for a period
 */
export async function generateTimeReport(
    onProgress: (progress: number, message: string) => void,
    dateFrom?: Date,
    dateTo?: Date
): Promise<string> {
    const users = JIRA_CONSTANTS.ACTIVE_USERS;
    const projectKey = JIRA_CONSTANTS.PROJECT_KEY;
    const jiraHost = process.env.JIRA_HOST?.replace(/\/$/, '');

    // Default to last 30 days
    const from = dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = dateTo || new Date();

    onProgress(10, 'Загрузка задач...');

    const jql = `project = ${projectKey} AND assignee in ("${users.join('", "')}") AND worklogDate >= "${from.toISOString().split('T')[0]}"`;

    let tasks;
    try {
        tasks = await getAllIssues(jql);
    } catch {
        // Fallback if worklogDate doesn't work
        const fallbackJql = `project = ${projectKey} AND assignee in ("${users.join('", "')}")`;
        tasks = await getAllIssues(fallbackJql);
    }

    onProgress(30, 'Анализ worklogs...');

    interface WorklogEntry {
        issueKey: string;
        summary: string;
        user: string;
        date: string;
        timeSpent: number;
        comment?: string;
    }

    const allWorklogs: WorklogEntry[] = [];
    const userTotals: Record<string, number> = {};
    const dailyTotals: Record<string, number> = {};

    for (const user of users) {
        userTotals[user] = 0;
    }

    const totalTasks = tasks.length;
    let processed = 0;

    for (const task of tasks) {
        processed++;
        if (processed % 10 === 0) {
            onProgress(30 + (processed / totalTasks) * 50, `Обработка ${processed}/${totalTasks}...`);
        }

        const worklogs = await getIssueWorklogs(task.key || task.id);

        for (const w of worklogs) {
            const wDate = new Date(w.started);
            if (wDate >= from && wDate <= to) {
                const dateStr = wDate.toISOString().split('T')[0];
                const email = w.author?.emailAddress || 'unknown';

                allWorklogs.push({
                    issueKey: task.key || task.id,
                    summary: String(task.fields.summary || ''),
                    user: email,
                    date: dateStr,
                    timeSpent: w.timeSpentSeconds,
                    comment: w.comment,
                });

                if (userTotals[email] !== undefined) {
                    userTotals[email] += w.timeSpentSeconds;
                }

                dailyTotals[dateStr] = (dailyTotals[dateStr] || 0) + w.timeSpentSeconds;
            }
        }
    }

    onProgress(85, 'Генерация отчета...');

    const totalTime = Object.values(userTotals).reduce((a, b) => a + b, 0);

    let md = `# Отчет о времени\n\n`;
    md += `**Проект:** ${projectKey}\n`;
    md += `**Период:** ${from.toLocaleDateString('ru-RU')} - ${to.toLocaleDateString('ru-RU')}\n`;
    md += `**Всего списано:** ${formatTime(totalTime)}\n\n`;

    md += `## 👥 По участникам\n\n`;
    md += `| Участник | Время | % |\n| :--- | :--- | :--- |\n`;
    for (const [user, time] of Object.entries(userTotals).sort((a, b) => b[1] - a[1])) {
        const pct = totalTime > 0 ? Math.round((time / totalTime) * 100) : 0;
        md += `| ${user} | ${formatTime(time)} | ${pct}% |\n`;
    }
    md += `\n`;

    md += `## 📆 По дням\n\n`;
    md += `| Дата | Время |\n| :--- | :--- |\n`;
    const sortedDays = Object.entries(dailyTotals).sort((a, b) => b[0].localeCompare(a[0]));
    for (const [date, time] of sortedDays.slice(0, 14)) {
        md += `| ${date} | ${formatTime(time)} |\n`;
    }
    md += `\n`;

    md += `## 📝 Детализация\n\n`;
    md += `| Дата | Задача | Участник | Время |\n| :--- | :--- | :--- | :--- |\n`;
    const sortedLogs = allWorklogs.sort((a, b) => b.date.localeCompare(a.date));
    for (const w of sortedLogs.slice(0, 50)) {
        md += `| ${w.date} | [${w.issueKey}](${jiraHost}/browse/${w.issueKey}) | ${w.user} | ${formatTime(w.timeSpent)} |\n`;
    }
    md += `\n`;

    md += `---\n*Отчет сгенерирован автоматически*\n`;

    onProgress(100, 'Готово');
    return md;
}

function formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}ч ${m}м` : `${m}м`;
}
