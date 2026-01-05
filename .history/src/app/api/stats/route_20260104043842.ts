import { NextResponse } from 'next/server';
import { searchIssues } from '@/shared/api/jira';
import { isInProgress } from '@/shared/lib/jira-helpers';

export async function GET() {
    try {
        const jql = 'project = DEV AND assignee in ("p.kuzyakin@actum.cx", "r.khamukov@actum.cx")';
        const searchResults = await searchIssues(jql, 0, 100);

        const activeCount = searchResults.issues.filter((issue: any) => isInProgress(issue)).length;

        // Unassigned tasks for Frontend
        // We assume "Frontend" is stored in a field called "Team". If not, this might fail or return 0.
        // For JQL: team is often lowercase "team" or Requires ID. Using generic "Team" first.
        const unassignedJql = 'project = DEV AND assignee is EMPTY AND "Team" = "Frontend"'; 
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
