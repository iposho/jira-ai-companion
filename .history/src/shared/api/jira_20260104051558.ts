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
