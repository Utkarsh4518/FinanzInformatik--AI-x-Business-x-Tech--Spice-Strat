const Resolver = require("@forge/resolver").default;
const {
  acceptRecommendation,
  createClarification,
  getGlanceStatus,
  getIssueWorkspace,
  processIssueEvent,
  processQueueEvent,
  publishSummaryComment,
  refreshAnalysis,
  resolveClarification,
  seedProfiles
} = require("./services/orchestrator/ticket-orchestrator");

const resolver = new Resolver();

resolver.define("getIssueWorkspace", getIssueWorkspace);
resolver.define("refreshAnalysis", refreshAnalysis);
resolver.define("seedProfiles", seedProfiles);
resolver.define("acceptRecommendation", acceptRecommendation);
resolver.define("createClarification", createClarification);
resolver.define("resolveClarification", resolveClarification);
resolver.define("publishSummaryComment", publishSummaryComment);

module.exports.resolverHandler = resolver.getDefinitions();
module.exports.glanceStatus = getGlanceStatus;
module.exports.issueEventTrigger = processIssueEvent;
module.exports.analysisConsumer = processQueueEvent;
