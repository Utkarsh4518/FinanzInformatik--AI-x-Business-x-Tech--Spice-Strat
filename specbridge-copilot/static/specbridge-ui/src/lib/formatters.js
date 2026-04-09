export function formatDateTime(value) {
  if (!value) {
    return "n/a";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function formatConfidence(value) {
  if (!value) {
    return "Low";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function riskTone(stabilityScore) {
  if (stabilityScore >= 80) {
    return "good";
  }
  if (stabilityScore >= 65) {
    return "warn";
  }
  return "risk";
}

export function pendingLabel(side) {
  if (side === "developer") {
    return "Waiting on developer";
  }
  if (side === "requester") {
    return "Waiting on requester";
  }
  return "No pending side";
}
