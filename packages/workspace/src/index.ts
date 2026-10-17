/**
 * @json-explore/workspace — host-agnostic product UI.
 * Hosts (Next, extension popup/side panel) compose shells + host profiles.
 */

export { JsonWorkspaceShell } from "@json-explore/workspace/features/json-explorer/components/json-workspace-shell";
export { CompactToolkitShell } from "@json-explore/workspace/shells/compact-toolkit-shell";
export { useJsonWorkspace } from "@json-explore/workspace/hooks/use-json-workspace";
export * from "@json-explore/workspace/host";
export * from "@json-explore/workspace/constants/workspace-tools";
