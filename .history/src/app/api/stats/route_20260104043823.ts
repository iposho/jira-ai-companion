import { NextResponse } from 'next/server';
import { searchIssues } from '@/shared/api/jira';
import { isInProgress } from '@/shared/lib/jira-helpers';

export async function GET() {
    try {
        const jql = 'project = DEV AND assignee in ("p.kuzyakin@actum.cx")';
        const searchResults = await searchIssues(jql, 0, 100);

        const activeCount = searchResults.issues.filter((issue: any) => isInProgress(issue)).length;

        return NextResponse.json({ count: activeCount });
    } catch (error) {
        console.error('Error fetching Jira stats:', error);
        return NextResponse.json({ error: 'Failed to fetch Jira stats' }, { status: 500 });
    }
}
