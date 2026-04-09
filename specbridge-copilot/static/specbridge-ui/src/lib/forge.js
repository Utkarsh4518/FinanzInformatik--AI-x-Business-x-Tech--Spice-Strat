import { events, invoke, view } from "@forge/bridge";
import {
  assignLocalRecommendation,
  createLocalClarification,
  getLocalContext,
  getLocalWorkspace,
  publishLocalSummaryComment,
  refreshLocalWorkspace,
  resolveLocalClarification,
  seedLocalProfiles
} from "./mock-workspace";

const isLocalDemo =
  typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

export async function getForgeContext() {
  if (isLocalDemo) {
    return getLocalContext();
  }

  return view.getContext();
}

export async function loadIssueWorkspace() {
  if (isLocalDemo) {
    return getLocalWorkspace();
  }

  return invoke("getIssueWorkspace", {});
}

export async function refreshAnalysis() {
  if (isLocalDemo) {
    return refreshLocalWorkspace();
  }

  return invoke("refreshAnalysis", {});
}

export async function seedProfiles() {
  if (isLocalDemo) {
    return seedLocalProfiles();
  }

  return invoke("seedProfiles", {});
}

export async function acceptRecommendation(accountId) {
  if (isLocalDemo) {
    return assignLocalRecommendation(accountId);
  }

  return invoke("acceptRecommendation", { accountId });
}

export async function createClarification(payload) {
  if (isLocalDemo) {
    return createLocalClarification(payload);
  }

  return invoke("createClarification", payload);
}

export async function resolveClarification(payload) {
  if (isLocalDemo) {
    return resolveLocalClarification(payload);
  }

  return invoke("resolveClarification", payload);
}

export async function publishSummaryComment() {
  if (isLocalDemo) {
    return publishLocalSummaryComment();
  }

  return invoke("publishSummaryComment", {});
}

export function listenForRefresh(handler) {
  if (isLocalDemo) {
    const listener = () => handler();
    window.addEventListener("specbridge-local-refresh", listener);
    return () => window.removeEventListener("specbridge-local-refresh", listener);
  }

  let offIssue = null;
  let offLocal = null;

  events.on("specbridge.issue.refresh", handler).then((unsubscribe) => {
    offIssue = unsubscribe;
  });

  events.on("specbridge.local.refresh", handler).then((unsubscribe) => {
    offLocal = unsubscribe;
  });

  return () => {
    if (typeof offIssue === "function") {
      offIssue();
    }
    if (typeof offLocal === "function") {
      offLocal();
    }
  };
}

export async function emitLocalRefresh(payload = {}) {
  if (isLocalDemo) {
    window.dispatchEvent(new CustomEvent("specbridge-local-refresh", { detail: payload }));
    return;
  }

  return events.emit("specbridge.local.refresh", payload);
}

export async function startBackgroundCoordinator() {
  if (isLocalDemo) {
    return;
  }

  await events.on("JIRA_ISSUE_CHANGED", async (payload) => {
    await events.emit("specbridge.issue.refresh", {
      reason: "jira-issue-changed",
      payload
    });
  });
}
