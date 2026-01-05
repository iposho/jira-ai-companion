import { NextResponse } from 'next/server';
import { getSprints, getSprintIssues, findScrumBoard, getBoards, type Sprint, type Board } from '@/shared/api/jira';
import { JIRA_CONSTANTS } from '@/shared/config/jira-constants';

export const dynamic = 'force-dynamic';

interface SprintWithVelocity extends Sprint {
  velocity: number;
  issueCount: number;
  completedCount: number;
}

/**
 * GET /api/sprints
 * Returns last N closed sprints with velocity data
 */
export async function GET() {
  let boardId = parseInt(process.env.JIRA_BOARD_ID || '0', 10);
  const projectKey = JIRA_CONSTANTS.PROJECT_KEY;
  let boardInfo: Board | null = null;

  try {
    // If no board ID or board doesn't support sprints, try to find a Scrum board
    if (!boardId) {
      const scrumBoard = await findScrumBoard(projectKey);
      if (scrumBoard) {
        boardId = scrumBoard.id;
        boardInfo = scrumBoard;
        console.log('Auto-detected Scrum board:', scrumBoard.name, 'ID:', scrumBoard.id);
      }
    }

    // Still no board? List all available boards
    if (!boardId) {
      const allBoards = await getBoards(projectKey);
      return NextResponse.json({
        error: 'No Scrum board found',
        message: 'Не найдена Scrum-доска для проекта ' + projectKey,
        availableBoards: allBoards.map((b) => ({
          id: b.id,
          name: b.name,
          type: b.type,
        })),
      }, { status: 404 });
    }

    // Get closed sprints (last 10)
    const closedSprints = await getSprints(boardId, 'closed');
    const activeSprints = await getSprints(boardId, 'active');

    // Check if this board supports sprints
    if (closedSprints.length === 0 && activeSprints.length === 0) {
      // Maybe it's a Kanban board, try to find Scrum board
      const scrumBoard = await findScrumBoard(projectKey);
      if (scrumBoard && scrumBoard.id !== boardId) {
        return NextResponse.json({
          error: 'Wrong board type',
          message: 'Доска ' + boardId + ' не поддерживает спринты',
          suggestedBoard: {
            id: scrumBoard.id,
            name: scrumBoard.name,
            type: scrumBoard.type,
          },
          hint: 'Добавьте JIRA_BOARD_ID=' + scrumBoard.id + ' в .env',
        }, { status: 400 });
      }

      return NextResponse.json({
        sprints: [],
        boardId,
        projectKey,
        message: 'Нет данных о спринтах',
      });
    }

    // Sort by end date descending and take last 10
    const sortedSprints = closedSprints
      .sort((a, b) => {
        const dateA = a.completeDate || a.endDate || '';
        const dateB = b.completeDate || b.endDate || '';
        return dateB.localeCompare(dateA);
      })
      .slice(0, 10);

    // Add active sprint if exists
    const allSprints = [...activeSprints, ...sortedSprints];

    // Calculate velocity for each sprint
    const sprintsWithVelocity: SprintWithVelocity[] = await Promise.all(
      allSprints.map(async (sprint) => {
        const issues = await getSprintIssues(sprint.id);

        // Count completed issues (Done status)
        const completedIssues = issues.filter((issue) => {
          const status = (issue.fields.status as { name?: string; statusCategory?: { key?: string } })?.statusCategory?.key;
          return status === 'done';
        });

        // Calculate story points (customfield_10016 is common for story points)
        const velocity = completedIssues.reduce((sum, issue) => {
          const points = (issue.fields as Record<string, unknown>).customfield_10016;
          return sum + (typeof points === 'number' ? points : 0);
        }, 0);

        return {
          ...sprint,
          velocity,
          issueCount: issues.length,
          completedCount: completedIssues.length,
        };
      })
    );

    return NextResponse.json({
      sprints: sprintsWithVelocity,
      boardId,
      boardInfo,
      projectKey,
    });
  } catch (error) {
    console.error('Sprints API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sprints', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
