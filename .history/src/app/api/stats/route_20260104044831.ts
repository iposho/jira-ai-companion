import { NextResponse } from 'next/server';
import { searchIssues } from '@/shared/api/jira';
import { jiraFields } from '@/shared/api/jira-fields';
import { JIRA_CONSTANTS, JQL_SNIPPETS } from '@/shared/config/jira-constants';

export async function GET() {
    try {
        await jiraFields.initialize();

        // 1. Active issues count
        const activeJql = `project = ${JIRA_CONSTANTS.PROJECT_KEY} AND ${JQL_SNIPPETS.ACTIVE_USERS_FILTER} AND ${JQL_SNIPPETS.STATUS_NOT_DONE}`;
        const searchResults = await searchIssues(activeJql, 0, 1000);
        const activeCount = searchResults.total; 
        
        const host = process.env.JIRA_HOST?.replace(/\/$/, '');
        const activeUrl = `${host}/issues/?jql=${encodeURIComponent(activeJql)}`;

        // 2. Unassigned issues for Frontend team
        const unassignedJql = `project = ${JIRA_CONSTANTS.PROJECT_KEY} AND ${JQL_SNIPPETS.IS_UNASSIGNED} AND ${JQL_SNIPPETS.IS_FRONTEND_TEAM}`;
        const unassignedResults = await searchIssues(unassignedJql, 0, 1000);
        const unassignedCount = unassignedResults.total;
        const unassignedUrl = `${host}/issues/?jql=${encodeURIComponent(unassignedJql)}`;

        return NextResponse.json({ 
            activeCount,
            activeUrl,
            unassignedCount,
            unassignedUrl
        });
    } catch (error) {
        console.error('Error fetching Jira stats:', error);
        return NextResponse.json({ error: 'Failed to fetch Jira stats' }, { status: 500 });
    }
}
