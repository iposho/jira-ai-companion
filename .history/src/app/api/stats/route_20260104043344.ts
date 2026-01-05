import { NextResponse } from 'next/server';
import { searchIssues } from '@/lib/jira';

export async function GET() {
    try {
        const jql = 'project = DEV AND assignee in ("p.kuzyakin@actum.cx")';
        const searchResults = await searchIssues(jql, 0, 200);

        return NextResponse.json({ count: searchResults.total });
    } catch (error) {
        console.error('Error fetching Jira stats:', error);
        return NextResponse.json({ error: 'Failed to fetch Jira stats' }, { status: 500 });
    }
}
