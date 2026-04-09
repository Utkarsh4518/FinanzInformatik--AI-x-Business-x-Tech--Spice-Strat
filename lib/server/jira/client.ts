type JiraCredentials = {
  baseUrl: string;
  user: string;
  apiToken: string;
  projectKey?: string;
};

export function getJiraCredentials(): JiraCredentials {
  const baseUrl = process.env.JIRA_BASE_URL?.trim().replace(/\/$/, "");
  const user =
    process.env.JIRA_EMAIL?.trim() || process.env.JIRA_USER?.trim() || "";
  const apiToken = process.env.JIRA_API_TOKEN?.trim() || "";
  const projectKey = process.env.JIRA_PROJECT_KEY?.trim();

  if (!baseUrl || !user || !apiToken) {
    throw new Error(
      "Jira credentials are not configured. Set JIRA_BASE_URL, JIRA_EMAIL or JIRA_USER, and JIRA_API_TOKEN."
    );
  }

  return { baseUrl, user, apiToken, projectKey };
}

export function buildJiraBrowseUrl(issueKey: string) {
  const { baseUrl } = getJiraCredentials();
  return `${baseUrl}/browse/${issueKey}`;
}

export async function jiraFetch<T>(pathname: string, init?: RequestInit): Promise<T> {
  const { baseUrl, user, apiToken } = getJiraCredentials();
  const authHeader = Buffer.from(`${user}:${apiToken}`).toString("base64");

  const response = await fetch(`${baseUrl}${pathname}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${authHeader}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Jira request failed with ${response.status}. ${errorText || "Check Jira configuration and permissions."}`
    );
  }

  return (await response.json()) as T;
}
