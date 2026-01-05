import { NextResponse } from 'next/server';
import { searchIssues } from '@/shared/api/jira';
import { jiraFields } from '@/shared/api/jira-fields';

export async function GET() {
    try {
        await jiraFields.initialize();

        // 1. Active issues count
        const statusExclusions = '"Done", "Closed", "Resolved", "Готово", "Отменено", "Backlog", "To Do", "Selected", "К выполнению"';
        const activeJql = `project = DEV AND assignee in ("p.kuzyakin@actum.cx", "r.khamukov@actum.cx") AND status not in (${statusExclusions})`;
        const searchResults = await searchIssues(activeJql, 0, 100);
        // We can trust JQL now, or still filter if names aren't exact. Let's trust JQL for the link consistency.
        const activeCount = searchResults.total; 
        
        const host = process.env.JIRA_HOST?.replace(/\/$/, ''); // Remove trailing slash if present
        const activeUrl = `${host}/issues/?jql=${encodeURIComponent(activeJql)}`;

        // 2. Unassigned issues for Frontend team
        const teamFieldId = jiraFields.getCustomFieldId('Team');
        const teamClause = teamFieldId 
            ? `cf[${teamFieldId.replace('customfield_', '')}]` 
            : '"Team"';
            
        const unassignedJql = `project = DEV AND assignee is EMPTY AND ${teamClause} = "Frontend"`; 
        const unassignedResults = await searchIssues(unassignedJql, 0, 1);
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
