import { NextRequest, NextResponse } from 'next/server';
import { getBurndownData, getSprints, getSprintIssues } from '@/shared/api/jira';

export const dynamic = 'force-dynamic';

interface BurndownPoint {
    date: string;
    remaining: number;
    ideal: number;
    day: number;
}

/**
 * GET /api/sprints/[id]/burndown
 * Returns burndown chart data for a specific sprint
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const sprintId = parseInt(id, 10);
    const boardId = parseInt(process.env.JIRA_BOARD_ID || '0', 10);

    if (!boardId) {
        return NextResponse.json(
            { error: 'JIRA_BOARD_ID not configured' },
            { status: 500 }
        );
    }

    if (!sprintId) {
        return NextResponse.json(
            { error: 'Invalid sprint ID' },
            { status: 400 }
        );
    }

    try {
        // Try to get burndown data from Jira API
        const burndownData = await getBurndownData(boardId, sprintId);

        if (burndownData) {
            // Transform Jira burndown data to chart format
            const startDate = new Date(burndownData.startTime);
            const endDate = new Date(burndownData.endTime);
            const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

            const points: BurndownPoint[] = [];
            let currentValue = burndownData.changes[0]?.value || 0;
            const initialValue = currentValue;

            for (let day = 0; day <= totalDays; day++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + day);

                // Find changes for this day
                const dayChanges = burndownData.changes.filter((change) => {
                    const changeDate = new Date(change.time);
                    return changeDate.toDateString() === currentDate.toDateString();
                });

                if (dayChanges.length > 0) {
                    currentValue = dayChanges[dayChanges.length - 1].value;
                }

                points.push({
                    date: currentDate.toISOString().split('T')[0],
                    remaining: currentValue,
                    ideal: Math.max(0, initialValue - (initialValue / totalDays) * day),
                    day,
                });
            }

            return NextResponse.json({ data: points, sprintId });
        }

        // Fallback: Calculate from issues
        const sprints = await getSprints(boardId);
        const sprint = sprints.find((s) => s.id === sprintId);

        if (!sprint) {
            return NextResponse.json(
                { error: 'Sprint not found' },
                { status: 404 }
            );
        }

        const issues = await getSprintIssues(sprintId);
        const totalPoints = issues.reduce((sum, issue) => {
            const points = (issue.fields as Record<string, unknown>).customfield_10016;
            return sum + (typeof points === 'number' ? points : 0);
        }, 0);

        const completedPoints = issues
            .filter((issue) => {
                const status = (issue.fields.status as { statusCategory?: { key?: string } })?.statusCategory?.key;
                return status === 'done';
            })
            .reduce((sum, issue) => {
                const points = (issue.fields as Record<string, unknown>).customfield_10016;
                return sum + (typeof points === 'number' ? points : 0);
            }, 0);

        // Simple burndown simulation
        const startDate = sprint.startDate ? new Date(sprint.startDate) : new Date();
        const endDate = sprint.endDate ? new Date(sprint.endDate) : new Date();
        const today = new Date();
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 14;
        const elapsedDays = Math.min(
            totalDays,
            Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        );

        const points: BurndownPoint[] = [];
        for (let day = 0; day <= totalDays; day++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + day);

            const remaining = day <= elapsedDays
                ? totalPoints - (completedPoints * day) / Math.max(1, elapsedDays)
                : totalPoints - completedPoints;

            points.push({
                date: currentDate.toISOString().split('T')[0],
                remaining: Math.max(0, remaining),
                ideal: Math.max(0, totalPoints - (totalPoints / totalDays) * day),
                day,
            });
        }

        return NextResponse.json({ data: points, sprintId });
    } catch (error) {
        console.error('Burndown API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch burndown data' },
            { status: 500 }
        );
    }
}
