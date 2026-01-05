import { jira } from './jira';

export interface JiraField {
    id: string;
    name: string;
    custom: boolean;
    orderable: boolean;
    navigable: boolean;
    searchable: boolean;
    clauseNames: string[];
    schema?: {
        type: string;
        system?: string;
        custom?: string;
        customId?: number;
    };
}

export class JiraFields {
    private fieldsCache: Map<string, JiraField> = new Map();
    private nameToIdCache: Map<string, string> = new Map();
    private initialized = false;

    async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }

        try {
            const fields = await jira.issueFields.getFields() as JiraField[];

            for (const field of fields) {
                this.fieldsCache.set(field.id, field);
                this.nameToIdCache.set(field.name.toLowerCase(), field.id);
            }

            this.initialized = true;
        } catch (error) {
            console.error('Failed to load Jira fields', error);
        }
    }

    getFieldId(fieldName: string): string | undefined {
        return this.nameToIdCache.get(fieldName.toLowerCase());
    }

    getCustomFieldId(fieldName: string): string | undefined {
        const standardMappings: Record<string, string[]> = {
            'Story Points': ['Story Points', 'Story Point Estimate', 'Story Points Estimate'],
            Team: ['Team', 'Development Team', 'Team Name', 'Команда'],
            Release: ['Release', 'Fix Version', 'Target Release'],
            Environment: ['Environment', 'Deployment Environment', 'Target Environment'],
        };

        const possibleNames = standardMappings[fieldName] || [fieldName];

        for (const name of possibleNames) {
            const fieldId = this.getFieldId(name);
            if (fieldId) {
                return fieldId;
            }
        }

        return undefined;
    }
}

export const jiraFields = new JiraFields();
