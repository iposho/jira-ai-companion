import { Version3Client } from 'jira.js';

if (!process.env.JIRA_HOST || !process.env.JIRA_EMAIL || !process.env.JIRA_API_TOKEN) {
    throw new Error('Jira credentials are not properly configured in .env.local');
}

export const jira = new Version3Client({
    host: process.env.JIRA_HOST,
    authentication: {
        basic: {
            email: process.env.JIRA_EMAIL,
            apiToken: process.env.JIRA_API_TOKEN,
        },
    },
});
