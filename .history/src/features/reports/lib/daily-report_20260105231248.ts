import { getAllIssues, getIssueWorklogs, type JiraIssue } from '@/shared/api/jira';
import { JIRA_CONSTANTS } from '@/shared/config/jira-constants';
import { analyzeWithLLM, isGroqConfigured } from '@/shared/api/groq';
import { ReportFilters } from '../model/report-types';

interface DailyActivity {
    userEmail: string;
    userName: string;
    tasksUpdated: JiraIssue[];
    tasksCreated: JiraIssue[];
    worklogs: Array<{
        issueKey: string;
        issueSummary: string;
        timeSpent: number;
        comment?: string;
    }>;
    totalTimeSpent: number;
}

/**
 * Generates daily report for standup
 */
export async function generateDailyReport(
    onProgress: (progress: number, message: string) => void,
    filters?: ReportFilters
): Promise<string> {
    const users = filters?.users || JIRA_CONSTANTS.ACTIVE_USERS;
    const projectKey = filters?.projectKey || JIRA_CONSTANTS.PROJECT_KEY;
    const jiraHost = process.env.JIRA_HOST?.replace(/\/$/, '');

    // Yesterday's date range
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);

    const activities: DailyActivity[] = [];

    let progressStep = 0;
    const totalSteps = users.length + 2; // users + summary + llm

    for (const userEmail of users) {
        progressStep++;
        onProgress((progressStep / totalSteps) * 80, `Анализ ${userEmail}...`);

        const jql = `project = "${projectKey}" AND assignee = "${userEmail}"`;
        const tasks = await getAllIssues(jql);

        const userName = tasks.length > 0 && tasks[0].fields.assignee
            ? (tasks[0].fields.assignee as { displayName?: string }).displayName || userEmail
            : userEmail;

        // Tasks updated yesterday
        const tasksUpdated = tasks.filter((task) => {
            const updated = new Date(String(task.fields.updated || ''));
            return updated >= yesterday && updated <= yesterdayEnd;
        });

        // Tasks created yesterday
        const tasksCreated = tasks.filter((task) => {
            const created = new Date(String(task.fields.created || ''));
            return created >= yesterday && created <= yesterdayEnd;
        });

        // Worklogs
        const worklogs: DailyActivity['worklogs'] = [];
        let totalTimeSpent = 0;

        for (const task of tasks.slice(0, 50)) { // Limit to avoid too many API calls
            const taskWorklogs = await getIssueWorklogs(task.key || task.id);
            for (const worklog of taskWorklogs) {
                const worklogDate = new Date(String(worklog.started || ''));
                if (worklogDate >= yesterday && worklogDate <= yesterdayEnd) {
                    worklogs.push({
                        issueKey: task.key || task.id,
                        issueSummary: String(task.fields.summary || 'Без названия'),
                        timeSpent: worklog.timeSpentSeconds || 0,
                        comment: worklog.comment,
                    });
                    totalTimeSpent += worklog.timeSpentSeconds || 0;
                }
            }
        }

        activities.push({
            userEmail,
            userName,
            tasksUpdated,
            tasksCreated,
            worklogs,
            totalTimeSpent,
        });
    }

    // Generate LLM advice
    let llmAdvice = '';
    if (isGroqConfigured()) {
        onProgress(85, 'Получение советов от LLM...');
        try {
            const prompt = createDailyPrompt(activities, projectKey, yesterday);
            llmAdvice = await analyzeWithLLM(prompt);
        } catch (error) {
            console.warn('LLM advice failed:', error);
        }
    }

    onProgress(95, 'Генерация отчета...');

    // Generate markdown
    const report = generateMarkdownReport(activities, projectKey, jiraHost || '', yesterday, llmAdvice);

    onProgress(100, 'Готово');
    return report;
}

function createDailyPrompt(activities: DailyActivity[], projectKey: string, date: Date): string {
    return `Ты — опытный технический менеджер проектов. Проанализируй ежедневную активность команды и дай краткие практические советы для дейлика.

**Дата:** ${date.toLocaleDateString('ru-RU')}
**Проект:** ${projectKey}

**Активность команды за день:**

${activities.map((a, i) => `
${i + 1}. **${a.userName}**:
   - Обновлено задач: ${a.tasksUpdated.length}
   - Создано задач: ${a.tasksCreated.length}
   - Списанное время: ${formatTime(a.totalTimeSpent)}
   ${a.tasksUpdated.slice(0, 3).map(t => `   - ${t.key}: ${t.fields.summary}`).join('\n')}
`).join('\n')}

Дай краткие (3-5 пунктов) практические советы для дейлика. Ответ на русском, краткий.`;
}

function generateMarkdownReport(
    activities: DailyActivity[],
    projectKey: string,
    jiraHost: string,
    date: Date,
    llmAdvice: string
): string {
    const now = new Date().toLocaleString('ru-RU', { dateStyle: 'long', timeStyle: 'short' });

    let md = `# Ежедневный отчет для дейлика\n\n`;
    md += `**Дата:** ${date.toLocaleDateString('ru-RU')}\n`;
    md += `**Проект:** ${projectKey}\n`;
    md += `**Сгенерировано:** ${now}\n\n`;

    // Summary
    const totalUpdated = activities.reduce((s, a) => s + a.tasksUpdated.length, 0);
    const totalCreated = activities.reduce((s, a) => s + a.tasksCreated.length, 0);
    const totalTime = activities.reduce((s, a) => s + a.totalTimeSpent, 0);

    md += `## 📊 Сводка\n\n`;
    md += `- **Обновлено задач:** ${totalUpdated}\n`;
    md += `- **Создано задач:** ${totalCreated}\n`;
    md += `- **Всего списано времени:** ${formatTime(totalTime)}\n\n`;

    // Per-user
    md += `## 👥 Активность по участникам\n\n`;

    for (const a of activities) {
        md += `### ${a.userName}\n\n`;

        if (a.tasksUpdated.length > 0) {
            md += `**Обновленные задачи (${a.tasksUpdated.length}):**\n\n`;
            md += `| Задача | Статус | Название |\n| :--- | :--- | :--- |\n`;
            for (const t of a.tasksUpdated.slice(0, 10)) {
                const status = (t.fields.status as { name?: string })?.name || '-';
                md += `| [${t.key}](${jiraHost}/browse/${t.key}) | ${status} | ${t.fields.summary} |\n`;
            }
            md += `\n`;
        }

        if (a.worklogs.length > 0) {
            md += `**Списанное время: ${formatTime(a.totalTimeSpent)}**\n\n`;
            md += `| Задача | Время |\n| :--- | :--- |\n`;
            for (const w of a.worklogs.slice(0, 10)) {
                md += `| [${w.issueKey}](${jiraHost}/browse/${w.issueKey}) | ${formatTime(w.timeSpent)} |\n`;
            }
            md += `\n`;
        }
    }

    if (llmAdvice) {
        md += `## 💡 Советы для дейлика\n\n${llmAdvice}\n\n`;
    }

    md += `---\n*Отчет сгенерирован автоматически*\n`;
    return md;
}

function formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}ч ${m}м` : `${m}м`;
}
