const api = require("@forge/api");
const { buildAdfDocument, extractTextFromAdf, normalizeWhitespace, tokenize, uniqueStrings } = require("./text");

function mapUser(user) {
  if (!user) {
    return null;
  }

  return {
    accountId: user.accountId,
    displayName: user.displayName || "Unknown user",
    avatarUrl: user.avatarUrls?.["24x24"] || user.avatarUrls?.["16x16"] || null,
    active: user.active !== false
  };
}

async function requestJiraJson(path, options = {}, actor = "app") {
  const headers = {
    Accept: "application/json",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {})
  };

  const requester = actor === "user" ? api.asUser() : api.asApp();
  const response = await requester.requestJira(path, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Jira API ${response.status}: ${errorText}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function buildSimilarityJql(issue) {
  const clauses = [`project = ${issue.project.key}`, `key != ${issue.issueKey}`];

  if (issue.labels.length) {
    const labels = issue.labels.map((label) => `"${label}"`).join(", ");
    clauses.push(`labels in (${labels})`);
  }

  if (issue.components.length) {
    const components = issue.components.map((component) => `"${component}"`).join(", ");
    clauses.push(`component in (${components})`);
  }

  const keywords = tokenize(`${issue.summary} ${issue.descriptionText}`).slice(0, 3);
  if (keywords.length) {
    const textTerms = keywords.map((keyword) => `text ~ "\\\"${keyword}\\\""`);
    clauses.push(`(${textTerms.join(" OR ")})`);
  }

  return `${clauses.join(" AND ")} ORDER BY updated DESC`;
}

async function fetchIssueSnapshot(issueKey) {
  const issuePath = api.route`/rest/api/3/issue/${issueKey}?fields=summary,description,labels,priority,status,components,assignee,reporter,updated,created,issuetype,project&expand=changelog`;
  const commentPath = api.route`/rest/api/3/issue/${issueKey}/comment?startAt=0&maxResults=100`;
  const transitionPath = api.route`/rest/api/3/issue/${issueKey}/transitions`;
  const assignablePath = api.route`/rest/api/3/user/assignable/search?issueKey=${issueKey}&query=&maxResults=25`;

  const [issueResponse, commentsResponse, transitionsResponse, assignableResponse] = await Promise.allSettled([
    requestJiraJson(issuePath),
    requestJiraJson(commentPath),
    requestJiraJson(transitionPath),
    requestJiraJson(assignablePath)
  ]);

  if (issueResponse.status !== "fulfilled") {
    throw issueResponse.reason;
  }

  const issue = issueResponse.value;
  const comments = commentsResponse.status === "fulfilled" ? commentsResponse.value?.comments || [] : [];
  const transitions = transitionsResponse.status === "fulfilled" ? transitionsResponse.value?.transitions || [] : [];
  const assignableUsers = assignableResponse.status === "fulfilled" ? assignableResponse.value || [] : [];

  return {
    issueKey: issue.key,
    issueId: issue.id,
    summary: normalizeWhitespace(issue.fields.summary),
    descriptionText: extractTextFromAdf(issue.fields.description),
    labels: uniqueStrings(issue.fields.labels || []),
    priority: issue.fields.priority?.name || "Unspecified",
    status: issue.fields.status?.name || "Unknown",
    statusCategory: issue.fields.status?.statusCategory?.name || "Unknown",
    components: uniqueStrings((issue.fields.components || []).map((component) => component.name)),
    assignee: mapUser(issue.fields.assignee),
    reporter: mapUser(issue.fields.reporter),
    issueType: issue.fields.issuetype?.name || "Task",
    project: {
      id: issue.fields.project?.id,
      key: issue.fields.project?.key || "",
      name: issue.fields.project?.name || ""
    },
    createdAt: issue.fields.created,
    updatedAt: issue.fields.updated,
    changelog: (issue.changelog?.histories || []).flatMap((history) =>
      (history.items || []).map((item) => ({
        id: history.id,
        author: mapUser(history.author),
        createdAt: history.created,
        field: item.field,
        fieldId: item.fieldId,
        from: item.from,
        fromString: item.fromString,
        to: item.to,
        toString: item.toString
      }))
    ),
    comments: comments.map((comment) => ({
      id: comment.id,
      author: mapUser(comment.author),
      bodyText: extractTextFromAdf(comment.body),
      createdAt: comment.created,
      updatedAt: comment.updated
    })),
    transitions: transitions.map((transition) => ({
      id: transition.id,
      name: transition.name,
      toStatus: transition.to?.name || transition.name
    })),
    assignableUsers: assignableUsers.map(mapUser).filter(Boolean)
  };
}

async function searchSimilarIssues(issue) {
  if (!issue.project.key) {
    return [];
  }

  const response = await requestJiraJson(api.route`/rest/api/3/search/jql`, {
    method: "POST",
    body: JSON.stringify({
      jql: buildSimilarityJql(issue),
      maxResults: 10,
      fields: ["summary", "labels", "components", "assignee", "status", "priority", "updated"]
    })
  });

  return (response.issues || []).map((candidate) => ({
    key: candidate.key,
    summary: normalizeWhitespace(candidate.fields.summary),
    labels: uniqueStrings(candidate.fields.labels || []),
    components: uniqueStrings((candidate.fields.components || []).map((component) => component.name)),
    assignee: mapUser(candidate.fields.assignee),
    status: candidate.fields.status?.name || "Unknown",
    priority: candidate.fields.priority?.name || "Unspecified",
    updatedAt: candidate.fields.updated
  }));
}

async function assignIssueAsUser(issueKey, accountId) {
  return requestJiraJson(
    api.route`/rest/api/3/issue/${issueKey}/assignee`,
    {
      method: "PUT",
      body: JSON.stringify({ accountId })
    },
    "user"
  );
}

async function addCommentAsApp(issueKey, text) {
  return requestJiraJson(api.route`/rest/api/3/issue/${issueKey}/comment`, {
    method: "POST",
    body: JSON.stringify({
      body: buildAdfDocument(text)
    })
  });
}

async function transitionIssueAsUser(issueKey, transitionId) {
  return requestJiraJson(
    api.route`/rest/api/3/issue/${issueKey}/transitions`,
    {
      method: "POST",
      body: JSON.stringify({
        transition: { id: transitionId }
      })
    },
    "user"
  );
}

module.exports = {
  addCommentAsApp,
  assignIssueAsUser,
  fetchIssueSnapshot,
  requestJiraJson,
  searchSimilarIssues,
  transitionIssueAsUser
};
