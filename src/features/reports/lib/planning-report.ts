import { getAllIssues } from '@/shared/api/jira';
import { JIRA_CONSTANTS } from '@/shared/config/jira-constants';
import { analyzeWithLLM, isGroqConfigured } from '@/shared/api/groq';
import { ReportFilters } from '../model/report-types';

/**
 * Generates planning report with status overview and dependencies
 */
export async function generatePlanningReport(
    onProgress: (progress: number, message: string) => void,
    filters?: ReportFilters
): Promise<string> {
    const users = filters?.users || JIRA_CONSTANTS.ACTIVE_USERS;
    const projectKey = filters?.projectKey || JIRA_CONSTANTS.PROJECT_KEY;
    const jiraHost = process.env.JIRA_HOST?.replace(/\/$/, '');

    onProgress(10, 'Загрузка задач...');

    // Get all active tasks for users
    const statusExclusionsFormatted = JIRA_CONSTANTS.STATUS_EXCLUSIONS.map(s => 
        s.includes(' ') || s.includes('-') ? `"${s}"` : s
    ).join(', ');
    const jql = `project = ${projectKey} AND assignee IN ("${users.join('", "')}") AND status NOT IN (${statusExclusionsFormatted})`;
    const tasks = await getAllIssues(jql);

    onProgress(30, 'Анализ статусов...');

    // Group by status
    const byStatus: Record<string, typeof tasks> = {};
    for (const task of tasks) {
        const status = (task.fields.status as { name?: string })?.name || 'Неизвестно';
        if (!byStatus[status]) byStatus[status] = [];
        byStatus[status].push(task);
    }

    onProgress(50, 'Анализ зависимостей...');

    // Find blocked tasks and dependencies
    const blockedTasks = tasks.filter(t => {
        const labels = (t.fields.labels as string[]) || [];
        return labels.some((l: string) => l.toLowerCase().includes('blocked'));
    });

    // Get LLM advice
    let llmAdvice = '';
    if (isGroqConfigured()) {
        onProgress(70, 'Получение советов от LLM...');
        try {
            const prompt = `Проанализируй состояние проекта и дай рекомендации по планированию.

**Проект:** ${projectKey}
**Всего активных задач:** ${tasks.length}
**Заблокированных:** ${blockedTasks.length}

**По статусам:**
${Object.entries(byStatus).map(([s, t]) => `- ${s}: ${t.length}`).join('\n')}

**Задачи:**
${tasks.slice(0, 20).map(t => `- ${t.key}: ${t.fields.summary} (${(t.fields.status as { name?: string })?.name})`).join('\n')}

Дай 3-5 практических рекомендаций по планированию. Кратко, на русском.`;
            llmAdvice = await analyzeWithLLM(prompt);
        } catch (error) {
            console.warn('LLM failed:', error);
        }
    }

    onProgress(90, 'Генерация отчета...');

    // Generate markdown
    const now = new Date().toLocaleString('ru-RU', { dateStyle: 'long', timeStyle: 'short' });
    let md = `# Отчет по планированию\n\n`;
    md += `**Проект:** ${projectKey}\n`;
    md += `**Сгенерировано:** ${now}\n\n`;

    md += `## 📊 Общая статистика\n\n`;
    md += `- **Всего активных задач:** ${tasks.length}\n`;
    md += `- **Заблокированных:** ${blockedTasks.length}\n\n`;

    md += `## 📈 По статусам\n\n`;
    md += `| Статус | Количество |\n| :--- | :--- |\n`;
    for (const [status, statusTasks] of Object.entries(byStatus).sort((a, b) => b[1].length - a[1].length)) {
        md += `| ${status} | ${statusTasks.length} |\n`;
    }
    md += `\n`;

    // Tasks by user
    md += `## 👥 По участникам\n\n`;
    for (const user of users) {
        const userTasks = tasks.filter(t => (t.fields.assignee as { emailAddress?: string })?.emailAddress === user);
        md += `### ${user}\n\n`;
        if (userTasks.length === 0) {
            md += `Нет активных задач.\n\n`;
        } else {
            md += `| Задача | Статус | Название |\n| :--- | :--- | :--- |\n`;
            for (const t of userTasks.slice(0, 15)) {
                const status = (t.fields.status as { name?: string })?.name || '-';
                md += `| [${t.key}](${jiraHost}/browse/${t.key}) | ${status} | ${t.fields.summary} |\n`;
            }
            md += `\n`;
        }
    }

    if (blockedTasks.length > 0) {
        md += `## ⚠️ Заблокированные задачи\n\n`;
        for (const t of blockedTasks) {
            md += `- [${t.key}](${jiraHost}/browse/${t.key}) - ${t.fields.summary}\n`;
        }
        md += `\n`;
    }

    if (llmAdvice) {
        md += `## 💡 Рекомендации\n\n${llmAdvice}\n\n`;
    }

    md += `---\n*Отчет сгенерирован автоматически*\n`;

    onProgress(100, 'Готово');
    return md;
}
