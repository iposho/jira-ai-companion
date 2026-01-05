import { Issue } from "jira.js/out/version3/models/issue";

export type JiraIssue = Issue;

/**
 * Получает имя статуса задачи
 */
export function getStatusName(issue: JiraIssue): string {
    const status = issue.fields.status;
    return typeof status === 'object' && status !== null && 'name' in status
        ? String(status.name)
        : '';
}

/**
 * Проверяет, завершена ли задача
 */
export function isDone(issue: JiraIssue): boolean {
    const name = getStatusName(issue).toLowerCase();
    return (
        name.includes('done') ||
        name.includes('closed') ||
        name.includes('resolved') ||
        name.includes('готово') ||
        name.includes('отменено')
    );
}

/**
 * Проверяет, находится ли задача в бэклоге
 */
export function isBacklog(issue: JiraIssue): boolean {
    const name = getStatusName(issue).toLowerCase();
    return (
        name.includes('backlog') ||
        name.includes('to do') ||
        name.includes('selected') ||
        name.includes('к выполнению')
    );
}

/**
 * Проверяет, находится ли задача в работе (не Done и не Backlog)
 */
export function isInProgress(issue: JiraIssue): boolean {
    return !isDone(issue) && !isBacklog(issue);
}
