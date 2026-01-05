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
