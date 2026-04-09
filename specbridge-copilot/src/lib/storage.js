const { kvs, WhereConditions } = require("@forge/kvs");
const { toIsoNow } = require("./text");

const PREFIX = "specbridge";

function developerProfileKey(accountId) {
  return `${PREFIX}#developer-profile#${accountId}`;
}

function ticketIntelligenceKey(issueKey) {
  return `${PREFIX}#ticket-intelligence#${issueKey}`;
}

function clarificationThreadKey(issueKey) {
  return `${PREFIX}#clarification-thread#${issueKey}`;
}

function lifecyclePrefix(issueKey) {
  return `${PREFIX}#lifecycle#${issueKey}#`;
}

async function listByPrefix(prefix) {
  const response = await kvs.query().where("key", WhereConditions.beginsWith(prefix)).getMany();
  return (response?.results || []).map((entry) => entry.value);
}

async function getDeveloperProfiles() {
  const profiles = await listByPrefix(`${PREFIX}#developer-profile#`);
  return profiles.sort((left, right) => (left.displayName || "").localeCompare(right.displayName || ""));
}

async function upsertDeveloperProfiles(profiles) {
  await Promise.all(
    profiles.map((profile) =>
      kvs.set(developerProfileKey(profile.accountId), {
        ...profile,
        lastUpdatedAt: profile.lastUpdatedAt || toIsoNow()
      })
    )
  );

  return getDeveloperProfiles();
}

async function getTicketIntelligence(issueKey) {
  return kvs.get(ticketIntelligenceKey(issueKey));
}

async function setTicketIntelligence(issueKey, intelligence) {
  await kvs.set(ticketIntelligenceKey(issueKey), intelligence);
  return intelligence;
}

async function getClarificationThread(issueKey) {
  return kvs.get(clarificationThreadKey(issueKey));
}

async function setClarificationThread(issueKey, thread) {
  await kvs.set(clarificationThreadKey(issueKey), thread);
  return thread;
}

async function listLifecycleEvents(issueKey) {
  const events = await listByPrefix(lifecyclePrefix(issueKey));
  return events.sort((left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime());
}

async function appendLifecycleEvents(issueKey, events) {
  const existing = await listLifecycleEvents(issueKey);
  const deduped = [];

  for (const event of events) {
    const duplicate = existing.find((candidate) => {
      const sameType = candidate.eventType === event.eventType;
      const sameNewValue = (candidate.newValue || "") === (event.newValue || "");
      const recent = Math.abs(new Date(candidate.timestamp).getTime() - new Date(event.timestamp).getTime()) < 5 * 60 * 1000;
      return sameType && sameNewValue && recent;
    });

    if (!duplicate) {
      deduped.push(event);
    }
  }

  await Promise.all(
    deduped.map((event) => kvs.set(`${lifecyclePrefix(issueKey)}${event.timestamp}#${event.eventType}`, event))
  );

  return listLifecycleEvents(issueKey);
}

module.exports = {
  appendLifecycleEvents,
  getClarificationThread,
  getDeveloperProfiles,
  getTicketIntelligence,
  listLifecycleEvents,
  setClarificationThread,
  setTicketIntelligence,
  upsertDeveloperProfiles
};
