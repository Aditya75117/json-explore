import { PERFORMANCE_LIMITS } from "@json-explore/core/constants/performance";
import type { QueryMode } from "@json-explore/core/types/query";

export const MAX_QUERY_RESULTS = 10_000;
export const QUERY_WORKER_NODE_THRESHOLD =
  PERFORMANCE_LIMITS.workerNodeThreshold;

export const QUERY_MODES: readonly QueryMode[] = ["path", "jsonpath"];

export const QUERY_MODE_LABELS: Record<QueryMode, string> = {
  path: "Path",
  jsonpath: "JSONPath",
};

export const QUERY_EXAMPLES = [
  { mode: "path" as const, expression: "users" },
  { mode: "path" as const, expression: "users[0]" },
  { mode: "path" as const, expression: "users[].profile.email" },
  { mode: "jsonpath" as const, expression: "$.users" },
  { mode: "jsonpath" as const, expression: "$.users[*].id" },
  { mode: "jsonpath" as const, expression: "$.users[*].profile.email" },
  { mode: "jsonpath" as const, expression: "$..id" },
  { mode: "jsonpath" as const, expression: '$["user.profile"]["first-name"]' },
] as const;
