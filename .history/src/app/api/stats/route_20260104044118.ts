import { NextResponse } from 'next/server';
import { searchIssues } from '@/shared/api/jira';
import { isInProgress } from '@/shared/lib/jira-helpers';
import { jiraFields } from '@/shared/api/jira-fields';

import { JiraIssue } from '@/shared/api/jira-types';

export async function GET() {
    try {
        await jiraFields.initialize();

        // 1. Active issues count
        const jql = 'project = DEV AND assignee in ("p.kuzyakin@actum.cx", "r.khamukov@actum.cx")';
        const searchResults = await searchIssues(jql, 0, 100);
        const activeCount = searchResults.issues.filter((issue: JiraIssue) => isInProgress(issue)).length;

        // 2. Unassigned issues for Frontend team
        // Resolve "Team" field ID. If not found, fallback to "Team" name which might work if it's standard or aliased.
        const teamFieldId = jiraFields.getCustomFieldId('Team');
        const teamClause = teamFieldId 
            ? `cf[${teamFieldId.replace('customfield_', '')}]` 
            : '"Team"';
            
        const unassignedJql = `project = DEV AND assignee is EMPTY AND ${teamClause} = "Frontend"`; 
        
        const unassignedResults = await searchIssues(unassignedJql, 0, 1);
        const unassignedCount = unassignedResults.total;

        return NextResponse.json({ 
            activeCount,
            unassignedCount
        });
    } catch (error) {
        console.error('Error fetching Jira stats:', error);
        return NextResponse.json({ error: 'Failed to fetch Jira stats' }, { status: 500 });
    }
}
