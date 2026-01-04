import { NextResponse } from 'next/server';
import { jira } from '@/lib/jira';

export async function GET() {
    try {
        const jql = 'project = DEV AND assignee in ("p.kuzyakin@actum.cx", "r.khamukov@actum.cx")';
        const searchResults = await jira.issueSearch.searchForIssuesUsingJql({
            jql,
            maxResults: 0, // We only care about the total
            fields: [],
        });

        return NextResponse.json({ count: searchResults.total });
    } catch (error) {
        console.error('Error fetching Jira stats:', error);
        return NextResponse.json({ error: 'Failed to fetch Jira stats' }, { status: 500 });
    }
}
