import { Version3Client } from 'jira.js';
import axios from 'axios';

if (!process.env.JIRA_HOST || !process.env.JIRA_EMAIL || !process.env.JIRA_API_TOKEN) {
  throw new Error('Jira credentials are not properly configured in .env');
}

const HOST = process.env.JIRA_HOST;
const EMAIL = process.env.JIRA_EMAIL;
const TOKEN = process.env.JIRA_API_TOKEN;

export const jira = new Version3Client({
  host: HOST,
  authentication: {
    basic: {
      email: EMAIL,
      apiToken: TOKEN,
    },
  },
});

const axiosClient = axios.create({
  baseURL: HOST,
  headers: {
    'Authorization': `Basic ${Buffer.from(`${EMAIL}:${TOKEN}`).toString('base64')}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Custom implementation based on user request using /rest/api/3/search/jql
import { JiraIssue } from './jira-types';

// Re-export types for convenience
export type { JiraIssue } from './jira-types';

// ... (existing imports and client setup)

// Custom implementation based on user request using /rest/api/3/search/jql
export async function searchIssues(jql: string, startAt = 0, maxResults = 50): Promise<{
  issues: JiraIssue[];
  total: number;
  startAt: number;
  maxResults: number;
}> {
  const requestBody: Record<string, unknown> = {
    jql,
    fields: ['*all'],
  };

  if (startAt > 0) requestBody.startAt = startAt;
  if (maxResults !== 50) requestBody.maxResults = maxResults;

  try {
    const { data } = await axiosClient.post('/rest/api/3/search/jql', requestBody);

    // API v3 can return values instead of issues
    const issues = (data.issues || data.values || []) as JiraIssue[];
    const total = data.total !== undefined ? data.total : issues.length;

    return {
      issues,
      total,
      startAt: data.startAt || startAt,
      maxResults: data.maxResults || maxResults,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Jira API Error:', error.response?.status, error.response?.data);
    }
    throw error;
  }
}

/**
 * Get all issues using pagination
 */
export async function getAllIssues(jql: string): Promise<JiraIssue[]> {
  const allIssues: JiraIssue[] = [];
  let startAt = 0;
  const maxResults = 100;

  while (true) {
    const result = await searchIssues(jql, startAt, maxResults);
    allIssues.push(...result.issues);

    if (allIssues.length >= result.total) {
      break;
    }
    startAt += maxResults;
  }

  return allIssues;
}

export interface Worklog {
  id: string;
  author: {
    accountId?: string;
    emailAddress?: string;
    displayName?: string;
  };
  started: string;
  timeSpentSeconds: number;
  comment?: string;
}

/**
 * Get worklogs for a specific issue
 */
export async function getIssueWorklogs(issueKey: string): Promise<Worklog[]> {
  try {
    const { data } = await axiosClient.get(`/rest/api/3/issue/${issueKey}/worklog`);
    return data.worklogs || [];
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Jira Worklog API Error:', error.response?.status, error.response?.data);
    }
    return []; // Return empty array on error
  }
}

// ============ AGILE API ============

export interface Board {
  id: number;
  name: string;
  type: 'scrum' | 'kanban' | 'simple';
  location?: {
    projectId?: number;
    projectKey?: string;
    projectName?: string;
  };
}

export interface Sprint {
  id: number;
  name: string;
  state: 'future' | 'active' | 'closed';
  startDate?: string;
  endDate?: string;
  completeDate?: string;
  goal?: string;
}

export interface SprintReport {
  sprint: Sprint;
  completedIssues: JiraIssue[];
  incompletedIssues: JiraIssue[];
  puntedIssues: JiraIssue[];
}

/**
 * Get all boards (optionally filtered by project)
 */
export async function getBoards(projectKeyOrId?: string): Promise<Board[]> {
  try {
    const params = new URLSearchParams();
    params.set('maxResults', '50');
    if (projectKeyOrId) {
      params.set('projectKeyOrId', projectKeyOrId);
    }

    const { data } = await axiosClient.get(`/rest/agile/1.0/board?${params.toString()}`);
    return data.values || [];
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Jira Boards API Error:', error.response?.status, error.response?.data);
    }
    return [];
  }
}

/**
 * Find a Scrum board for the project
 */
export async function findScrumBoard(projectKey: string): Promise<Board | null> {
  const boards = await getBoards(projectKey);
  return boards.find((b) => b.type === 'scrum') || null;
}

/**
 * Get all sprints for a board
 */
export async function getSprints(boardId: number, state?: 'future' | 'active' | 'closed'): Promise<Sprint[]> {
  try {
    const params = new URLSearchParams();
    if (state) params.set('state', state);
    params.set('maxResults', '50');

    const { data } = await axiosClient.get(`/rest/agile/1.0/board/${boardId}/sprint?${params.toString()}`);
    return data.values || [];
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Jira Agile API Error:', error.response?.status, error.response?.data);
    }
    return [];
  }
}

/**
 * Get issues for a specific sprint
 */
export async function getSprintIssues(sprintId: number): Promise<JiraIssue[]> {
  try {
    const { data } = await axiosClient.get(`/rest/agile/1.0/sprint/${sprintId}/issue`, {
      params: { maxResults: 200, fields: 'summary,status,assignee,issuetype,customfield_10016' },
    });
    return data.issues || [];
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Jira Sprint Issues API Error:', error.response?.status, error.response?.data);
    }
    return [];
  }
}

/**
 * Get sprint report (velocity data)
 */
export async function getSprintReport(boardId: number, sprintId: number): Promise<SprintReport | null> {
  try {
    const { data } = await axiosClient.get(`/rest/greenhopper/1.0/rapid/charts/sprintreport`, {
      params: { rapidViewId: boardId, sprintId },
    });

    const sprint: Sprint = {
      id: data.sprint.id,
      name: data.sprint.name,
      state: data.sprint.state?.toLowerCase() || 'closed',
      startDate: data.sprint.startDate,
      endDate: data.sprint.endDate,
      completeDate: data.sprint.completeDate,
    };

    return {
      sprint,
      completedIssues: data.contents?.completedIssues || [],
      incompletedIssues: data.contents?.issuesNotCompletedInCurrentSprint || [],
      puntedIssues: data.contents?.puntedIssues || [],
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Jira Sprint Report API Error:', error.response?.status, error.response?.data);
    }
    return null;
  }
}

/**
 * Get burndown chart data for a sprint
 */
export async function getBurndownData(boardId: number, sprintId: number): Promise<{
  startTime: number;
  endTime: number;
  changes: Array<{ time: number; value: number }>;
} | null> {
  try {
    const { data } = await axiosClient.get(`/rest/greenhopper/1.0/rapid/charts/scopechangeburndownchart`, {
      params: { rapidViewId: boardId, sprintId },
    });

    return {
      startTime: data.startTime,
      endTime: data.endTime,
      changes: data.changes || [],
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Jira Burndown API Error:', error.response?.status, error.response?.data);
    }
    return null;
  }
}

