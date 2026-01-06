export const JIRA_CONSTANTS = {
    PROJECT_KEY: 'DEV',
    TEAM_FIELD_ID: 'customfield_10001', // ID кастомного поля Team
    FRONTEND_TEAM_ID: 'c6bf7c58-d853-474d-bbe6-ebe40bf41eb4', // UUID Frontend команды
    ACTIVE_USERS: [
        'p.kuzyakin@actum.cx',
        'r.khamukov@actum.cx'
    ],
    STATUS_EXCLUSIONS: [
        'Done',
        'Closed',
        'Resolved',
        'Готово',
        'Отменено',
        'Backlog',
        'To Do',
        'К выполнению'
    ],
    REVIEW_STATUSES: [
        'Review',
        'Проверка',
        'Code Review',
        'In Review',
        'На ревью',
        'Ревью'
    ]
};

// Форматирование значений для NOT IN: без кавычек, кроме значений с пробелами
function formatStatusForNotIn(statuses: string[]): string {
    return statuses.map(s => {
        // Значения с пробелами или специальными символами - в кавычках
        if (s.includes(' ') || s.includes('-')) {
            return `"${s}"`;
        }
        return s;
    }).join(', ');
}

export const JQL_SNIPPETS = {
    ACTIVE_USERS_FILTER: `assignee IN ("${JIRA_CONSTANTS.ACTIVE_USERS.join('", "')}")`,
    STATUS_NOT_DONE: `status NOT IN (${formatStatusForNotIn(JIRA_CONSTANTS.STATUS_EXCLUSIONS)})`,
    IS_UNASSIGNED: 'assignee IS empty',
    IS_FRONTEND_TEAM: '"cf[10001]" = c6bf7c58-d853-474d-bbe6-ebe40bf41eb4',
    IS_IN_REVIEW: `status IN ("${JIRA_CONSTANTS.REVIEW_STATUSES.join('", "')}")`
};
