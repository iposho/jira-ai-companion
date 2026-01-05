import { NextResponse } from 'next/server';
import { getAllIssues } from '@/shared/api/jira';
import { JIRA_CONSTANTS } from '@/shared/config/jira-constants';

export const dynamic = 'force-dynamic';

interface StatusCount {
    status: string;
    count: number;
    color: string;
}

interface WeeklyThroughput {
    week: string;
    completed: number;
    created: number;
}

/**
 * GET /api/kanban-stats
 * Returns Kanban metrics: status distribution, weekly throughput
 */
export async function GET() {
    const projectKey = JIRA_CONSTANTS.PROJECT_KEY;
    const users = JIRA_CONSTANTS.ACTIVE_USERS;

    try {
        // Get all active issues for the team
        const jql = `project = "${projectKey}" AND assignee in ("${users.join('", "')}") AND updated >= -90d ORDER BY updated DESC`;
        const issues = await getAllIssues(jql);

        // === Status Distribution ===
        const statusMap = new Map<string, number>();
        const statusColors: Record<string, string> = {
            'To Do': '#9CA3AF',
            'In Progress': '#3B82F6',
            'In Review': '#8B5CF6',
            'Done': '#10B981',
            'Blocked': '#EF4444',
        };

        for (const issue of issues) {
            const status = (issue.fields.status as { name?: string })?.name || 'Unknown';
            statusMap.set(status, (statusMap.get(status) || 0) + 1);
        }

        const statusDistribution: StatusCount[] = Array.from(statusMap.entries())
            .map(([status, count]) => ({
                status,
                count,
                color: statusColors[status] || '#6B7280',
            }))
            .sort((a, b) => b.count - a.count);

        // === Weekly Throughput (last 8 weeks) ===
        const weeks: WeeklyThroughput[] = [];
        const now = new Date();

        for (let i = 7; i >= 0; i--) {
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - (i * 7) - now.getDay());
            weekStart.setHours(0, 0, 0, 0);

            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);

            const completed = issues.filter((issue) => {
                const resolutionDate = issue.fields.resolutiondate;
                if (!resolutionDate) return false;
                const resolved = new Date(String(resolutionDate));
                return resolved >= weekStart && resolved <= weekEnd;
            }).length;

            const created = issues.filter((issue) => {
                const createdDate = new Date(String(issue.fields.created || ''));
                return createdDate >= weekStart && createdDate <= weekEnd;
            }).length;

            weeks.push({
                week: weekStart.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
                completed,
                created,
            });
        }

        // === Lead Time (average days to completion) ===
        const completedIssues = issues.filter((issue) => {
            const statusCategory = (issue.fields.status as { statusCategory?: { key?: string } })?.statusCategory?.key;
            return statusCategory === 'done' && issue.fields.resolutiondate;
        });

        let avgLeadTime = 0;
        if (completedIssues.length > 0) {
            const totalLeadTime = completedIssues.reduce((sum, issue) => {
                const created = new Date(String(issue.fields.created || ''));
                const resolved = new Date(String(issue.fields.resolutiondate || ''));
                const days = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
                return sum + days;
            }, 0);
            avgLeadTime = Math.round(totalLeadTime / completedIssues.length);
        }

        // === WIP (Work in Progress) ===
        const wipCount = issues.filter((issue) => {
            const statusCategory = (issue.fields.status as { statusCategory?: { key?: string } })?.statusCategory?.key;
            return statusCategory === 'indeterminate'; // In Progress category
        }).length;

        return NextResponse.json({
            statusDistribution,
            weeklyThroughput: weeks,
            avgLeadTime,
            wipCount,
            totalIssues: issues.length,
            projectKey,
        });
    } catch (error) {
        console.error('Kanban stats API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch kanban stats', details: error instanceof Error ? error.message : 'Unknown' },
            { status: 500 }
        );
    }
}
