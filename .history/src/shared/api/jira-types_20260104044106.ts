export type IssueLinkType = 'blocks' | 'relates' | 'duplicates' | 'is blocked by';

export interface JiraComment {
    id: string;
    self: string;
    author: {
        accountId: string;
        displayName: string;
        active: boolean;
    };
    body: string | Record<string, unknown>; // String or ADF
    created: string;
    updated: string;
}

export interface JiraIssue {
    id: string;
    key: string;
    self: string;
    fields: {
        summary: string;
        description?: string;
        issuetype: {
            id: string;
            name: string;
            subtask: boolean;
        };
        status: {
            id: string;
            name: string;
            statusCategory?: {
                id: number;
                key: string;
                name: string;
            };
        };
        project: {
            id: string;
            key: string;
            name: string;
        };
        assignee?: {
            accountId: string;
            displayName: string;
        };
        reporter: {
            accountId: string;
            displayName: string;
        };
        comment?: {
            comments: JiraComment[];
            maxResults: number;
            total: number;
            startAt: number;
        };
        created: string;
        updated: string;
        duedate?: string;
        [key: string]: unknown; // For custom fields
    };
}

export interface JiraEpic extends JiraIssue {
    fields: JiraIssue['fields'] & {
        customfield_10011?: string; // Epic Name (may vary)
    };
}
