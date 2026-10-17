"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { JsonInputPanel } from "@json-explore/workspace/features/json-input";
import { JsonDetailsPanel } from "@json-explore/workspace/features/json-explorer/components/json-details-panel";
import { JsonExplorer } from "@json-explore/workspace/features/json-explorer/components/json-explorer";
import { JsonSourceChip } from "@json-explore/workspace/features/json-explorer/components/json-source-chip";
import { JsonWorkspaceToolbar } from "@json-explore/workspace/features/json-explorer/components/json-workspace-toolbar";
import {
  WorkspacePaneSwitcher,
  type WorkspaceMobilePane,
} from "@json-explore/workspace/features/json-explorer/components/workspace-pane-switcher";
import { useJsonExplorer } from "@json-explore/workspace/features/json-explorer/hooks/use-json-explorer";
import { useWorkspaceTool } from "@json-explore/workspace/features/json-explorer/hooks/use-workspace-tool";
import {
  JsonQueryBar,
  JsonQueryExamples,
  JsonQueryPanel,
  JsonQueryResults,
} from "@json-explore/workspace/features/json-query";
import { useJsonQuery } from "@json-explore/workspace/features/json-query/hooks/use-json-query";
import {
  JsonSearchBar,
  JsonSearchPanel,
} from "@json-explore/workspace/features/json-search";
import { useJsonSearch } from "@json-explore/workspace/features/json-search/hooks/use-json-search";
import {
  JsonStatisticsPanel,
  useJsonStatistics,
} from "@json-explore/workspace/features/json-statistics";
import {
  JsonToolsPanel,
  OutputStyleSelector,
  useJsonTools,
} from "@json-explore/workspace/features/json-tools";
import { Badge } from "@json-explore/ui/components/badge";
import { Button } from "@json-explore/ui/components/button";
import { EmptyState } from "@json-explore/ui/components/empty-state";
import { ErrorState } from "@json-explore/ui/components/error-state";
import { LoadingState } from "@json-explore/ui/components/loading-state";
import { Panel } from "@json-explore/ui/components/panel";
import {
  describeJsonError,
  jsonErrorTitle,
} from "@json-explore/core/json/error-copy";
import {
  compareJsonValues,
  describeJsonDiff,
  type JsonDiff,
} from "@json-explore/core/json/compare";
import { parseJson } from "@json-explore/core/json/parser";
import {
  CSV_DELIMITER_LABELS,
  CSV_DELIMITERS,
  jsonToCsv,
  type CsvDelimiter,
} from "@json-explore/core/json/csv";
import { jsonToYaml } from "@json-explore/core/json/yaml";
import {
  validateJsonSchema,
  type SchemaViolation,
} from "@json-explore/core/json/schema";
import {
  describeJsonRepair,
  describeUnfixedJson,
  repairJson,
} from "@json-explore/core/json/repair";
import { ErrorBoundary } from "@json-explore/workspace/components/common/error-boundary";
import { useJsonWorkspace } from "@json-explore/workspace/hooks/use-json-workspace";
import { SHORTCUTS } from "@json-explore/workspace/constants/shortcuts";
import {
  SAMPLE_WORKSPACE_JSON,
  WORKSPACE_PARSE_DEBOUNCE_MS,
  type OutputStyle,
} from "@json-explore/workspace/constants/workspace-tools";
import { useKeyboardShortcut } from "@json-explore/workspace/hooks/use-keyboard-shortcut";
import { JSON_ERROR_MESSAGES } from "@json-explore/core/constants/json-messages";
import { resolveJsonDownloadFilename } from "@json-explore/core/json/filename";
import { appendJsonPath } from "@json-explore/core/json/path";
import { copyTextToClipboard } from "@json-explore/core/utils/clipboard";
import { downloadTextFile } from "@json-explore/core/utils/download";
import { formatByteSize } from "@json-explore/core/statistics/format-bytes";
import {
  byteLengthOfString,
  getJsonDocumentScale,
  shouldOffloadToWorker,
} from "@json-explore/core/performance";
import { createWebHostProfile } from "@json-explore/workspace/host/profiles";
import type { HostProfile } from "@json-explore/workspace/host/types";
import { cn } from "@json-explore/ui/cn";
import type {
  JsonQueryResult,
  QueryMode,
} from "@json-explore/core/types/query";
import type { JsonSearchResult } from "@json-explore/core/types/search";

const COMPARE_BADGE: Record<
  JsonDiff["kind"],
  { tone: "success" | "danger" | "warning"; label: string }
> = {
  added: { tone: "success", label: "Added" },
  removed: { tone: "danger", label: "Removed" },
  changed: { tone: "warning", label: "Changed" },
};

function toCompareQueryResult(diff: JsonDiff): JsonQueryResult {
  return {
    nodeId: diff.path,
    path: diff.path,
    key: null,
    index: null,
    type: "string",
    primitiveValue: describeJsonDiff(diff),
  };
}

function toSchemaQueryResult(
  violation: SchemaViolation,
  index: number,
): JsonQueryResult {
  return {
    nodeId: `${violation.path}:${String(index)}`,
    path: violation.path,
    key: null,
    index: null,
    type: "string",
    primitiveValue: violation.message,
  };
}

/**
 * Primary workspace composition for /json (and future full hosts).
 * One shared document; the toolbar shows a single job at a time.
 */
export function JsonWorkspaceShell({
  initialOutputStyle = "pretty",
  profile = createWebHostProfile(),
}: {
  initialOutputStyle?: OutputStyle;
  profile?: HostProfile;
} = {}) {
  const {
    state,
    setRawJson,
    setSearchQuery,
    selectNode,
    clearWorkspace,
    applyParse,
    applyFormat,
    applyMinify,
    loadContent,
  } = useJsonWorkspace();

  const isProcessing = state.status === "parsing";
  const rawBytes = byteLengthOfString(state.rawJson);
  const documentScale = getJsonDocumentScale(rawBytes);
  const isLargeDocument = shouldOffloadToWorker(rawBytes);
  const processingLabel = isProcessing
    ? rawBytes > 0
      ? `Parsing ${formatByteSize(rawBytes)} JSON…`
      : "Processing JSON…"
    : undefined;
  const explorerDocument =
    state.document && state.status !== "error" ? state.document : null;
  const hasDocument = Boolean(explorerDocument);

  const { tool, setTool, definition } = useWorkspaceTool();
  const [searchFocusNonce, setSearchFocusNonce] = useState(0);
  const [mobilePane, setMobilePane] = useState<WorkspaceMobilePane>("source");
  const [outputStyle, setOutputStyle] =
    useState<OutputStyle>(initialOutputStyle);
  const [compareRaw, setCompareRaw] = useState("");
  const [schemaRaw, setSchemaRaw] = useState("");
  const [csvDelimiter, setCsvDelimiter] = useState<CsvDelimiter>(",");
  const restoredRef = useRef(false);
  const parsedRawRef = useRef("");
  const validatedSourceRef = useRef<string | null>(null);
  const formattedSourceRef = useRef<string | null>(null);
  const minifiedSourceRef = useRef<string | null>(null);

  const openExploreSearch = () => {
    setTool("explore");
    setSearchFocusNonce((nonce) => nonce + 1);
  };

  useEffect(() => {
    profile.adapters.persistSource?.(state.rawJson);
  }, [profile.adapters, state.rawJson]);

  useEffect(() => {
    if (restoredRef.current) {
      return;
    }
    restoredRef.current = true;
    if (state.rawJson.trim()) {
      return;
    }
    const stored = profile.adapters.restoreSource?.() ?? null;
    if (!stored) {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("tool");
    void loadContent(stored).then((ok) => {
      if (ok) {
        parsedRawRef.current = stored;
        if (!fromUrl) {
          setTool("explore");
        }
        setMobilePane(fromUrl && fromUrl !== "explore" ? "tool" : "tree");
      }
    });
    // Restore once on mount via host adapter.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only restore
  }, []);

  useEffect(() => {
    const raw = state.rawJson;
    if (!raw.trim()) {
      parsedRawRef.current = "";
      return;
    }
    if (raw === parsedRawRef.current) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (raw === parsedRawRef.current) {
        return;
      }
      void applyParse(raw).then(() => {
        parsedRawRef.current = raw;
      });
    }, WORKSPACE_PARSE_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [applyParse, state.rawJson]);

  const explorer = useJsonExplorer({
    document: explorerDocument,
    selectedNodeId: state.selectedNodeId,
    onSelectNode: selectNode,
    indentation: state.indentation,
  });

  const search = useJsonSearch({
    document: explorerDocument,
    query: state.searchQuery,
  });

  const query = useJsonQuery({
    document: explorerDocument,
  });

  const statistics = useJsonStatistics({
    document: explorerDocument,
  });

  const tools = useJsonTools({
    rawJson: state.rawJson,
    parsedJson: state.parsedJson,
    document: explorerDocument,
    outputJson: state.outputJson,
    indentation: state.indentation,
    isValid: state.isValid,
    error: state.error,
    selectedNodeId: state.selectedNodeId,
    sourceFileName: state.sourceFileName,
    isProcessing,
    applyParse,
    applyFormat,
    applyMinify,
    clearWorkspace,
    copyPath: explorer.copyPath,
    copyValue: explorer.copyValue,
  });
  const validateSource = tools.validate;

  useEffect(() => {
    if (tool !== "validate") {
      validatedSourceRef.current = null;
      return;
    }
    if (validatedSourceRef.current === state.rawJson) {
      return;
    }
    validatedSourceRef.current = state.rawJson;
    void validateSource();
  }, [tool, state.rawJson, validateSource]);

  const formatSource = tools.format;

  useEffect(() => {
    if (tool !== "format" || outputStyle !== "pretty") {
      formattedSourceRef.current = null;
      return;
    }
    if (formattedSourceRef.current === state.rawJson) {
      return;
    }
    if (state.status === "parsing") {
      return;
    }
    if (state.rawJson.trim() && !state.isValid && state.status !== "error") {
      return;
    }
    formattedSourceRef.current = state.rawJson;
    void formatSource();
  }, [
    formatSource,
    outputStyle,
    state.isValid,
    state.rawJson,
    state.status,
    tool,
  ]);

  const minifySource = tools.minify;

  useEffect(() => {
    if (tool !== "format" || outputStyle !== "compact") {
      minifiedSourceRef.current = null;
      return;
    }
    if (minifiedSourceRef.current === state.rawJson) {
      return;
    }
    if (state.status === "parsing") {
      return;
    }
    if (state.rawJson.trim() && !state.isValid && state.status !== "error") {
      return;
    }
    minifiedSourceRef.current = state.rawJson;
    void minifySource();
  }, [
    minifySource,
    outputStyle,
    state.isValid,
    state.rawJson,
    state.status,
    tool,
  ]);

  const focusExplorerTree = () => {
    document
      .querySelector<HTMLElement>('[role="tree"][aria-label="JSON tree"]')
      ?.focus();
  };

  const revealSearchResult = (result: JsonSearchResult) => {
    explorer.revealNode(result.nodeId);
    setMobilePane("tree");
    queueMicrotask(focusExplorerTree);
  };

  const revealSearchIndex = (index: number) => {
    search.selectResultIndex(index);
    const result = search.results[index];
    if (result) {
      explorer.revealNode(result.nodeId);
    }
  };

  const goNextMatch = () => {
    if (search.results.length === 0) {
      return;
    }
    const next =
      search.selectedResultIndex < 0
        ? 0
        : (search.selectedResultIndex + 1) % search.results.length;
    revealSearchIndex(next);
  };

  const goPreviousMatch = () => {
    if (search.results.length === 0) {
      return;
    }
    const previous =
      search.selectedResultIndex <= 0
        ? search.results.length - 1
        : search.selectedResultIndex - 1;
    revealSearchIndex(previous);
  };

  const clearSearch = () => {
    setSearchQuery("");
    explorer.highlightNode(null);
  };

  const runQuery = (expression?: string, mode?: QueryMode) => {
    setTool("query");
    void query.execute(expression, mode);
  };

  useKeyboardShortcut(SHORTCUTS.escape, () => {
    if (tools.confirmClear) {
      tools.cancelClear();
      return;
    }
    if (state.searchQuery) {
      clearSearch();
      return;
    }
    if (query.query) {
      query.clear();
      return;
    }
    if (state.selectedNodeId) {
      selectNode(null);
    }
  });

  useKeyboardShortcut(SHORTCUTS.format, () => {
    setTool("format");
    setOutputStyle("pretty");
    void tools.format();
  });

  useKeyboardShortcut(SHORTCUTS.minify, () => {
    setTool("format");
    setOutputStyle("compact");
    void tools.minify();
  });

  useKeyboardShortcut(SHORTCUTS.search, () => {
    openExploreSearch();
  });

  useKeyboardShortcut(SHORTCUTS.focusQuery, () => {
    setTool("query");
  });

  useKeyboardShortcut(SHORTCUTS.statistics, () => {
    setTool("statistics");
  });

  useKeyboardShortcut(SHORTCUTS.runQuery, () => {
    if (!explorerDocument || !query.query.trim()) {
      return;
    }
    runQuery();
  });

  const hasSource = Boolean(state.rawJson.trim());
  const repairAttempt = useMemo(() => {
    if (
      tool !== "validate" ||
      !hasSource ||
      state.status !== "error" ||
      state.error?.code !== "INVALID_JSON" ||
      shouldOffloadToWorker(rawBytes)
    ) {
      return null;
    }
    return repairJson(state.rawJson, state.indentation);
  }, [
    hasSource,
    rawBytes,
    state.error,
    state.indentation,
    state.rawJson,
    state.status,
    tool,
  ]);
  const jsonRepair =
    repairAttempt?.ok && repairAttempt.value.fixes.length > 0
      ? repairAttempt.value
      : null;
  const repairTab = useMemo(() => {
    if (tool !== "repair" || !hasSource) {
      return null;
    }
    if (shouldOffloadToWorker(rawBytes)) {
      return "large" as const;
    }
    return repairJson(state.rawJson, state.indentation);
  }, [hasSource, rawBytes, state.indentation, state.rawJson, tool]);
  const comparisonParse = useMemo(() => {
    if (tool !== "compare" || !compareRaw.trim()) {
      return null;
    }
    return parseJson(compareRaw);
  }, [compareRaw, tool]);
  const compareView = useMemo(() => {
    if (tool !== "compare") {
      return null;
    }
    const hasPrimary = Boolean(state.rawJson.trim());
    const hasComparison = Boolean(compareRaw.trim());
    if (!hasPrimary || !hasComparison) {
      return { status: "empty" as const };
    }
    if (
      shouldOffloadToWorker(rawBytes) ||
      shouldOffloadToWorker(byteLengthOfString(compareRaw))
    ) {
      return { status: "large" as const };
    }
    if (state.status === "parsing" || state.status === "idle") {
      return { status: "pending" as const };
    }
    if (state.status === "error" && state.error) {
      return { status: "invalid" as const, error: state.error };
    }
    if (!state.isValid || state.parsedJson == null || !comparisonParse?.ok) {
      if (comparisonParse && !comparisonParse.ok) {
        return { status: "invalid" as const, error: comparisonParse.error };
      }
      return { status: "pending" as const };
    }
    const compared = compareJsonValues(state.parsedJson, comparisonParse.value);
    return {
      status: "ready" as const,
      diffs: compared.diffs,
      truncated: compared.truncated,
    };
  }, [
    compareRaw,
    comparisonParse,
    rawBytes,
    state.error,
    state.isValid,
    state.parsedJson,
    state.rawJson,
    state.status,
    tool,
  ]);
  const csvView = useMemo(() => {
    if (tool !== "csv") {
      return null;
    }
    if (!state.rawJson.trim()) {
      return { status: "empty" as const };
    }
    if (shouldOffloadToWorker(rawBytes)) {
      return { status: "large" as const };
    }
    if (state.status === "parsing" || state.status === "idle") {
      return { status: "pending" as const };
    }
    if (state.status === "error" && state.error) {
      return { status: "invalid" as const, error: state.error };
    }
    if (!state.isValid || state.parsedJson == null) {
      return { status: "pending" as const };
    }
    const converted = jsonToCsv(state.parsedJson, { delimiter: csvDelimiter });
    if (!converted.ok) {
      return { status: "rejected" as const, error: converted.error };
    }
    return { status: "ready" as const, csv: converted.value };
  }, [
    csvDelimiter,
    rawBytes,
    state.error,
    state.isValid,
    state.parsedJson,
    state.rawJson,
    state.status,
    tool,
  ]);
  const yamlView = useMemo(() => {
    if (tool !== "yaml") {
      return null;
    }
    if (!state.rawJson.trim()) {
      return { status: "empty" as const };
    }
    if (shouldOffloadToWorker(rawBytes)) {
      return { status: "large" as const };
    }
    if (state.status === "parsing" || state.status === "idle") {
      return { status: "pending" as const };
    }
    if (state.status === "error" && state.error) {
      return { status: "invalid" as const, error: state.error };
    }
    if (!state.isValid || state.parsedJson == null) {
      return { status: "pending" as const };
    }
    return { status: "ready" as const, yaml: jsonToYaml(state.parsedJson) };
  }, [
    rawBytes,
    state.error,
    state.isValid,
    state.parsedJson,
    state.rawJson,
    state.status,
    tool,
  ]);
  const schemaParse = useMemo(() => {
    if (tool !== "schema" || !schemaRaw.trim()) {
      return null;
    }
    return parseJson(schemaRaw);
  }, [schemaRaw, tool]);
  const schemaView = useMemo(() => {
    if (tool !== "schema") {
      return null;
    }
    const hasInstance = Boolean(state.rawJson.trim());
    const hasSchema = Boolean(schemaRaw.trim());
    if (!hasInstance || !hasSchema) {
      return { status: "empty" as const };
    }
    if (
      shouldOffloadToWorker(rawBytes) ||
      shouldOffloadToWorker(byteLengthOfString(schemaRaw))
    ) {
      return { status: "large" as const };
    }
    if (state.status === "parsing" || state.status === "idle") {
      return { status: "pending" as const };
    }
    if (state.status === "error" && state.error) {
      return { status: "invalid" as const, error: state.error };
    }
    if (!state.isValid || state.parsedJson == null) {
      return { status: "pending" as const };
    }
    if (schemaParse && !schemaParse.ok) {
      return { status: "invalid" as const, error: schemaParse.error };
    }
    if (!schemaParse?.ok) {
      return { status: "pending" as const };
    }
    const report = validateJsonSchema(state.parsedJson, schemaParse.value);
    if (!report.ok) {
      return { status: "rejected" as const, error: report.error };
    }
    return {
      status: "ready" as const,
      violations: report.value.violations,
      total: report.value.total,
      truncated: report.value.truncated,
    };
  }, [
    rawBytes,
    schemaParse,
    schemaRaw,
    state.error,
    state.isValid,
    state.parsedJson,
    state.rawJson,
    state.status,
    tool,
  ]);
  const validationMessage =
    state.error == null
      ? undefined
      : jsonRepair
        ? describeJsonRepair(jsonRepair.fixes, state.error)
        : repairAttempt && !repairAttempt.ok
          ? describeUnfixedJson(repairAttempt.error)
          : describeJsonError(state.error);
  const validationPending =
    hasSource &&
    (tools.activeAction === "validate" ||
      (!state.isValid && state.status !== "error"));
  const showSearchCount = state.searchQuery.trim() ? search.matchCount : null;
  const showQueryCount = query.hasRun ? query.matchCount : null;
  const sourceChip = (
    <JsonSourceChip
      hasValue={Boolean(state.rawJson.trim())}
      isValid={state.isValid}
      isProcessing={isProcessing}
      hasError={state.status === "error"}
      byteLength={rawBytes}
    />
  );
  const clearAction = tools.confirmClear ? (
    <div className="flex items-center gap-1">
      <Button
        size="sm"
        variant="danger"
        onClick={() => {
          setCompareRaw("");
          setSchemaRaw("");
          tools.confirmClearWorkspace();
        }}
      >
        Confirm clear
      </Button>
      <Button size="sm" variant="ghost" onClick={tools.cancelClear}>
        Cancel
      </Button>
    </div>
  ) : (
    <Button
      size="sm"
      variant="ghost"
      onClick={tools.requestClear}
      disabled={!tools.hasJson || isProcessing}
    >
      Clear
    </Button>
  );

  const showExploreDetails = tool === "explore" && hasDocument;
  const threePaneLayout = showExploreDetails;
  const hasSearchQuery = Boolean(state.searchQuery.trim());

  const applyFormatStyle = (style: OutputStyle) => {
    setOutputStyle(style);
    if (style === "pretty") {
      void tools.format();
      return;
    }
    void tools.minify();
  };
  const resolvedMobilePane =
    tool === "explore" && !hasDocument && mobilePane === "tool"
      ? "source"
      : tool === "explore" || mobilePane !== "tree"
        ? mobilePane
        : "tool";
  const hideSourcePane =
    resolvedMobilePane !== "source" ? "max-lg:hidden" : undefined;
  const hideTreePane =
    resolvedMobilePane !== "tree" ? "max-lg:hidden" : undefined;
  const hideToolPane =
    resolvedMobilePane !== "tool" ? "max-lg:hidden" : undefined;
  const mobilePanes =
    tool === "explore"
      ? hasDocument
        ? [
            { id: "source" as const, label: "Source" },
            { id: "tree" as const, label: "Tree" },
            { id: "tool" as const, label: "Details" },
          ]
        : [
            { id: "source" as const, label: "Source" },
            { id: "tree" as const, label: "Tree" },
          ]
      : [
          { id: "source" as const, label: "Source" },
          { id: "tool" as const, label: definition.label },
        ];

  const revealLoadedDocument = (nextTool = tool) => {
    setMobilePane(nextTool === "explore" ? "tree" : "tool");
  };

  const loadSample = () => {
    void loadContent(SAMPLE_WORKSPACE_JSON).then((ok) => {
      if (ok) {
        parsedRawRef.current = SAMPLE_WORKSPACE_JSON;
        setTool("explore");
        setMobilePane("tree");
      }
    });
  };

  const commandBar =
    tool === "explore" && hasDocument ? (
      <JsonSearchBar
        value={state.searchQuery}
        focusNonce={searchFocusNonce}
        onShortcutFocus={openExploreSearch}
        onChange={(next) => {
          if (!next) {
            clearSearch();
            return;
          }
          setSearchQuery(next);
        }}
        mode={search.mode}
        onModeChange={search.setMode}
        matchCount={showSearchCount}
        truncated={search.truncated}
        isSearching={search.isSearching}
        disabled={!explorerDocument || isProcessing}
        onSubmit={() => {
          if (search.selectedResult) {
            revealSearchResult(search.selectedResult);
          }
        }}
        onNavigateNext={goNextMatch}
        onNavigatePrevious={goPreviousMatch}
      />
    ) : tool === "query" ? (
      <JsonQueryBar
        value={query.query}
        autoFocus
        invalid={Boolean(query.error)}
        onShortcutFocus={() => setTool("query")}
        onChange={(next) => {
          if (!next) {
            query.clear();
            return;
          }
          query.setQuery(next);
        }}
        mode={query.mode}
        onModeChange={query.setMode}
        onRun={runQuery}
        matchCount={showQueryCount}
        truncated={query.truncated}
        isExecuting={query.isExecuting}
        disabled={!explorerDocument || isProcessing}
      />
    ) : tool === "format" ? (
      <OutputStyleSelector
        value={outputStyle}
        disabled={isProcessing || tools.busy}
        onChange={applyFormatStyle}
      />
    ) : tool === "csv" ? (
      <OutputStyleSelector
        label="CSV delimiter"
        options={CSV_DELIMITERS}
        labels={CSV_DELIMITER_LABELS}
        value={csvDelimiter}
        disabled={isProcessing}
        onChange={setCsvDelimiter}
      />
    ) : undefined;

  const loadSampleAction = (
    <Button
      size="md"
      variant="primary"
      onClick={loadSample}
      disabled={isProcessing}
    >
      Load sample
    </Button>
  );

  return (
    <ErrorBoundary>
      <div className="flex h-full min-h-0 flex-1 flex-col gap-3 p-3">
        <h1 className="sr-only">{definition.label}</h1>
        <p className="sr-only" aria-live="polite">
          Paste or drop JSON in Source. It loads automatically and is shared
          across every tab.
        </p>
        <div className="shrink-0">
          <JsonWorkspaceToolbar
            activeTool={tool}
            onSelect={setTool}
            command={commandBar}
            status={sourceChip}
          />
        </div>
        {tool === "query" ? (
          <JsonQueryExamples
            variant="inline"
            disabled={isProcessing || query.isExecuting}
            onPick={(expression, mode) => {
              query.setQuery(expression);
              query.setMode(mode);
              runQuery(expression, mode);
            }}
          />
        ) : null}
        <WorkspacePaneSwitcher
          panes={mobilePanes}
          value={resolvedMobilePane}
          onChange={setMobilePane}
        />

        <div
          className={cn(
            "grid min-h-0 flex-1 grid-cols-1 items-stretch gap-3",
            threePaneLayout ? "lg:grid-cols-3" : "lg:grid-cols-2",
          )}
        >
          <JsonInputPanel
            value={state.rawJson}
            onChange={setRawJson}
            onLoadContent={(content, fileName) => {
              void loadContent(content, fileName).then((ok) => {
                if (ok) {
                  parsedRawRef.current = content;
                  revealLoadedDocument();
                }
              });
            }}
            onLoadSample={loadSample}
            extraActions={clearAction}
            isValid={state.isValid}
            isProcessing={isProcessing}
            error={state.error}
            byteLength={rawBytes}
            documentScale={documentScale}
            nodeCount={state.document?.metadata.nodeCount}
            processingLabel={processingLabel ?? "Processing JSON"}
            className={cn("h-full min-h-0 overflow-hidden", hideSourcePane)}
          />

          {tool === "explore" ? (
            <div
              className={cn(
                "flex h-full min-h-0 flex-col gap-3 overflow-hidden",
                hideTreePane,
              )}
            >
              {hasSearchQuery ? (
                <JsonSearchPanel
                  query={state.searchQuery}
                  document={explorerDocument}
                  results={search.results}
                  matchCount={search.matchCount}
                  truncated={search.truncated}
                  selectedResultIndex={search.selectedResultIndex}
                  isSearching={search.isSearching}
                  error={search.error}
                  announcement={search.announcement}
                  onSelectIndex={search.selectResultIndex}
                  onActivate={(result) => {
                    const index = search.results.findIndex(
                      (item) => item.nodeId === result.nodeId,
                    );
                    if (index >= 0) {
                      search.selectResultIndex(index);
                    }
                    revealSearchResult(result);
                  }}
                  onSelectNext={goNextMatch}
                  onSelectPrevious={goPreviousMatch}
                  onCopyPath={(nodeId) => {
                    void explorer.copyPath(nodeId);
                  }}
                  onCopyValue={(nodeId) => {
                    void explorer.copyValue(nodeId);
                  }}
                  className="max-h-[min(16rem,45%)] min-h-32 shrink-0 overflow-hidden"
                />
              ) : null}
              <JsonExplorer
                document={explorerDocument}
                selectedNodeId={state.selectedNodeId}
                explorer={explorer}
                isProcessing={isProcessing}
                isLargeDocument={isLargeDocument}
                processingLabel={processingLabel}
                error={state.status === "error" ? state.error : null}
                emptyAction={hasDocument ? undefined : loadSampleAction}
                className="h-full min-h-0 flex-1 overflow-hidden"
              />
            </div>
          ) : null}

          {tool !== "explore" || hasDocument ? (
            <div
              id="workspace-tool-panel"
              role="tabpanel"
              aria-label={definition.label}
              className={cn(
                "flex h-full min-h-0 flex-col overflow-hidden",
                hideToolPane,
              )}
            >
              {tool === "explore" ? (
                <JsonDetailsPanel
                  document={explorerDocument}
                  selectedNodeId={state.selectedNodeId}
                  indentation={state.indentation}
                  onCopyPath={() => {
                    void explorer.copyPath();
                  }}
                  onCopyValue={() => {
                    void explorer.copyValue();
                  }}
                  copyFeedback={explorer.copyFeedback}
                  className="h-full min-h-0 overflow-hidden"
                />
              ) : null}

              {tool === "query" ? (
                <JsonQueryPanel
                  document={explorerDocument}
                  results={query.results}
                  matchCount={query.matchCount}
                  truncated={query.truncated}
                  isExecuting={query.isExecuting}
                  hasRun={query.hasRun}
                  error={query.error}
                  announcement={query.announcement}
                  className="min-h-0 flex-1 overflow-hidden"
                />
              ) : null}

              {tool === "statistics" ? (
                <JsonStatisticsPanel
                  document={explorerDocument}
                  jsonError={state.status === "error" ? state.error : null}
                  statistics={statistics.statistics}
                  isAnalyzing={statistics.isAnalyzing}
                  error={statistics.error}
                  announcement={statistics.announcement}
                  onRetry={() => {
                    void statistics.retry();
                  }}
                  onSearchKey={(key) => {
                    search.setMode("key");
                    setSearchQuery(key);
                    setTool("explore");
                    setMobilePane("tree");
                  }}
                  onSearchValue={(value) => {
                    search.setMode("value");
                    setSearchQuery(value);
                    setTool("explore");
                    setMobilePane("tree");
                  }}
                  onRevealNode={(nodeId) => {
                    explorer.revealNode(nodeId);
                    setTool("explore");
                    setMobilePane("tree");
                  }}
                  onQueryKey={(key) => {
                    setTool("query");
                    setMobilePane("tool");
                    void query.execute(
                      appendJsonPath("$", { type: "key", key }),
                      "jsonpath",
                    );
                  }}
                  className="min-h-0 flex-1 overflow-hidden"
                />
              ) : null}

              {tool === "validate" ? (
                <Panel
                  title="Validate"
                  description={definition.description}
                  actions={
                    <JsonSourceChip
                      hasValue={hasSource}
                      isValid={state.isValid}
                      isProcessing={
                        isProcessing || tools.activeAction === "validate"
                      }
                      hasError={state.status === "error"}
                      byteLength={rawBytes}
                    />
                  }
                  className="min-h-0 flex-1 overflow-hidden"
                  bodyClassName="overflow-hidden"
                >
                  <div className="min-h-0 flex-1" aria-live="polite">
                    {validationPending ? (
                      <LoadingState
                        label="Validating JSON…"
                        className="min-h-0"
                      />
                    ) : !hasSource ? (
                      <EmptyState
                        title="No JSON to validate"
                        description="Paste or drop JSON in Source to check whether it parses."
                        className="min-h-0"
                      />
                    ) : state.status === "error" && state.error ? (
                      <ErrorState
                        title={jsonErrorTitle(state.error)}
                        message={validationMessage}
                        className="min-h-0"
                        action={
                          jsonRepair ? (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => {
                                setRawJson(jsonRepair.json);
                              }}
                            >
                              Fix JSON
                            </Button>
                          ) : undefined
                        }
                      />
                    ) : state.isValid ? (
                      <EmptyState
                        title="Valid JSON"
                        description="This document parses successfully."
                        className="min-h-0"
                      />
                    ) : (
                      <LoadingState
                        label="Validating JSON…"
                        className="min-h-0"
                      />
                    )}
                  </div>
                </Panel>
              ) : null}

              {tool === "repair" ? (
                repairTab &&
                repairTab !== "large" &&
                repairTab.ok &&
                repairTab.value.fixes.length > 0 ? (
                  <JsonToolsPanel
                    style="pretty"
                    outputJson={repairTab.value.json}
                    isValid={false}
                    document={null}
                    tools={tools}
                    actionsEnabled
                    className="min-h-0 flex-1"
                    copy={{
                      title: "Repaired JSON",
                      description:
                        "Original stays in Source. Repaired JSON writes here.",
                      empty: "Paste JSON in Source to repair it.",
                      outputLabel: "Repaired JSON",
                    }}
                    leading={
                      <div className="flex flex-wrap gap-1">
                        {repairTab.value.fixes.map((fix) => (
                          <Badge key={fix} tone="success">
                            {fix.charAt(0).toUpperCase() + fix.slice(1)}
                          </Badge>
                        ))}
                      </div>
                    }
                    onCopy={() => copyTextToClipboard(repairTab.value.json)}
                    onDownload={() =>
                      downloadTextFile(
                        repairTab.value.json,
                        resolveJsonDownloadFilename(
                          state.sourceFileName,
                        ).replace(/\.json$/i, ".repaired.json"),
                      )
                    }
                  />
                ) : (
                  <Panel
                    title="Repair"
                    description={definition.description}
                    className="min-h-0 flex-1 overflow-hidden"
                    bodyClassName="overflow-hidden"
                  >
                    {!hasSource ? (
                      <EmptyState
                        title="No JSON to repair"
                        description="Paste or drop JSON in Source. The original stays there."
                        className="min-h-0"
                      />
                    ) : repairTab === "large" ? (
                      <ErrorState
                        title="Repair unavailable"
                        message={JSON_ERROR_MESSAGES.largeFile}
                        className="min-h-0"
                      />
                    ) : repairTab && !repairTab.ok ? (
                      <ErrorState
                        title={jsonErrorTitle(repairTab.error)}
                        message={describeUnfixedJson(repairTab.error)}
                        className="min-h-0"
                      />
                    ) : (
                      <EmptyState
                        title="Nothing to repair"
                        description="This JSON already parses."
                        className="min-h-0"
                      />
                    )}
                  </Panel>
                )
              ) : null}

              {tool === "compare" ? (
                <div className="flex min-h-0 flex-1 flex-col gap-3">
                  <JsonInputPanel
                    title="Compare with"
                    inputLabel="Comparison JSON"
                    panelLabel="Comparison"
                    value={compareRaw}
                    onChange={setCompareRaw}
                    onLoadContent={(content) => {
                      setCompareRaw(content);
                    }}
                    isValid={comparisonParse?.ok === true}
                    error={
                      comparisonParse && !comparisonParse.ok
                        ? comparisonParse.error
                        : null
                    }
                    byteLength={
                      compareRaw ? byteLengthOfString(compareRaw) : undefined
                    }
                    documentScale={getJsonDocumentScale(
                      byteLengthOfString(compareRaw),
                    )}
                    className="min-h-0 flex-1 overflow-hidden"
                  />
                  <Panel
                    title="Differences"
                    description={definition.description}
                    className="min-h-0 flex-1 overflow-hidden"
                    bodyClassName="overflow-hidden"
                  >
                    {compareView?.status === "empty" ? (
                      <EmptyState
                        title="Nothing to compare"
                        description={
                          state.rawJson.trim() || compareRaw.trim()
                            ? "Paste the other JSON document to compare."
                            : "Paste JSON in Source and in Compare with."
                        }
                        className="min-h-0"
                      />
                    ) : compareView?.status === "large" ? (
                      <ErrorState
                        title="Compare unavailable"
                        message={JSON_ERROR_MESSAGES.largeFile}
                        className="min-h-0"
                      />
                    ) : compareView?.status === "invalid" ? (
                      <ErrorState
                        title={jsonErrorTitle(compareView.error)}
                        message={describeJsonError(compareView.error)}
                        className="min-h-0"
                      />
                    ) : compareView?.status === "ready" ? (
                      <JsonQueryResults
                        document={state.document}
                        results={compareView.diffs.map(toCompareQueryResult)}
                        matchCount={compareView.diffs.length}
                        truncated={compareView.truncated}
                        isExecuting={false}
                        hasRun
                        error={null}
                        showPaths
                        valuesLabel="JSON differences"
                        badges={compareView.diffs.map((diff) => (
                          <Badge
                            key={diff.path}
                            tone={COMPARE_BADGE[diff.kind].tone}
                          >
                            {COMPARE_BADGE[diff.kind].label}
                          </Badge>
                        ))}
                        emptyCopy={{
                          noResults: {
                            title: "Documents match",
                            description:
                              "No paths were added, removed, or changed.",
                          },
                        }}
                        className="h-full min-h-0"
                      />
                    ) : (
                      <LoadingState
                        label="Comparing JSON…"
                        className="min-h-0"
                      />
                    )}
                  </Panel>
                </div>
              ) : null}

              {tool === "csv" ? (
                csvView?.status === "ready" ? (
                  <JsonToolsPanel
                    style="pretty"
                    outputJson={csvView.csv}
                    isValid={false}
                    document={null}
                    tools={tools}
                    actionsEnabled
                    className="min-h-0 flex-1"
                    copy={{
                      title: "CSV",
                      description: "Source stays JSON. CSV writes here.",
                      empty: "Paste an array of flat objects in Source.",
                      outputLabel: "CSV",
                    }}
                    leading={
                      <p className="text-muted text-xs">
                        The first row is the header, taken from the object keys.
                      </p>
                    }
                    onCopy={() => copyTextToClipboard(csvView.csv)}
                    onDownload={() =>
                      downloadTextFile(
                        csvView.csv,
                        resolveJsonDownloadFilename(
                          state.sourceFileName,
                        ).replace(/\.json$/i, ".csv"),
                      )
                    }
                  />
                ) : (
                  <Panel
                    title="CSV"
                    description={definition.description}
                    className="min-h-0 flex-1 overflow-hidden"
                    bodyClassName="overflow-hidden"
                  >
                    {csvView?.status === "empty" ? (
                      <EmptyState
                        title="No JSON to convert"
                        description="Paste an array of flat objects in Source."
                        className="min-h-0"
                      />
                    ) : csvView?.status === "large" ? (
                      <ErrorState
                        title="CSV unavailable"
                        message={JSON_ERROR_MESSAGES.largeFile}
                        className="min-h-0"
                      />
                    ) : csvView?.status === "invalid" ? (
                      <ErrorState
                        title={jsonErrorTitle(csvView.error)}
                        message={describeJsonError(csvView.error)}
                        className="min-h-0"
                      />
                    ) : csvView?.status === "rejected" ? (
                      <ErrorState
                        title="Cannot convert to CSV"
                        message={csvView.error.message}
                        className="min-h-0"
                      />
                    ) : (
                      <LoadingState
                        label="Converting JSON…"
                        className="min-h-0"
                      />
                    )}
                  </Panel>
                )
              ) : null}

              {tool === "yaml" ? (
                yamlView?.status === "ready" ? (
                  <JsonToolsPanel
                    style="pretty"
                    outputJson={yamlView.yaml}
                    isValid={false}
                    document={null}
                    tools={tools}
                    actionsEnabled
                    className="min-h-0 flex-1"
                    copy={{
                      title: "YAML",
                      description: "Source stays JSON. YAML writes here.",
                      empty: "Paste JSON in Source.",
                      outputLabel: "YAML",
                    }}
                    leading={
                      <p className="text-muted text-xs">
                        Generated from the parsed JSON. Tags and aliases are not
                        emitted.
                      </p>
                    }
                    onCopy={() => copyTextToClipboard(yamlView.yaml)}
                    onDownload={() =>
                      downloadTextFile(
                        yamlView.yaml,
                        resolveJsonDownloadFilename(
                          state.sourceFileName,
                        ).replace(/\.json$/i, ".yaml"),
                      )
                    }
                  />
                ) : (
                  <Panel
                    title="YAML"
                    description={definition.description}
                    className="min-h-0 flex-1 overflow-hidden"
                    bodyClassName="overflow-hidden"
                  >
                    {yamlView?.status === "empty" ? (
                      <EmptyState
                        title="No JSON to convert"
                        description="Paste JSON in Source to convert it to YAML."
                        className="min-h-0"
                      />
                    ) : yamlView?.status === "large" ? (
                      <ErrorState
                        title="YAML unavailable"
                        message={JSON_ERROR_MESSAGES.largeFile}
                        className="min-h-0"
                      />
                    ) : yamlView?.status === "invalid" ? (
                      <ErrorState
                        title={jsonErrorTitle(yamlView.error)}
                        message={describeJsonError(yamlView.error)}
                        className="min-h-0"
                      />
                    ) : (
                      <LoadingState
                        label="Converting JSON…"
                        className="min-h-0"
                      />
                    )}
                  </Panel>
                )
              ) : null}

              {tool === "schema" ? (
                <div className="flex min-h-0 flex-1 flex-col gap-3">
                  <JsonInputPanel
                    title="JSON Schema"
                    inputLabel="JSON Schema"
                    panelLabel="JSON Schema"
                    value={schemaRaw}
                    onChange={setSchemaRaw}
                    onLoadContent={(content) => {
                      setSchemaRaw(content);
                    }}
                    isValid={schemaParse?.ok === true}
                    error={
                      schemaParse && !schemaParse.ok ? schemaParse.error : null
                    }
                    byteLength={
                      schemaRaw ? byteLengthOfString(schemaRaw) : undefined
                    }
                    documentScale={getJsonDocumentScale(
                      byteLengthOfString(schemaRaw),
                    )}
                    className="min-h-0 flex-1 overflow-hidden"
                  />
                  <Panel
                    title="Schema"
                    description={definition.description}
                    actions={
                      <JsonSourceChip
                        hasValue={Boolean(
                          state.rawJson.trim() && schemaRaw.trim(),
                        )}
                        isValid={
                          schemaView?.status === "ready" &&
                          schemaView.violations.length === 0
                        }
                        isProcessing={schemaView?.status === "pending"}
                        hasError={
                          schemaView?.status === "invalid" ||
                          schemaView?.status === "rejected" ||
                          schemaView?.status === "large" ||
                          (schemaView?.status === "ready" &&
                            schemaView.violations.length > 0)
                        }
                        byteLength={rawBytes}
                      />
                    }
                    className="min-h-0 flex-1 overflow-hidden"
                    bodyClassName="overflow-hidden"
                  >
                    {schemaView?.status === "empty" ? (
                      <EmptyState
                        title="Nothing to validate"
                        description={
                          state.rawJson.trim() || schemaRaw.trim()
                            ? "Paste both the JSON document and a JSON Schema."
                            : "Paste JSON in Source and a draft 2020-12 schema here."
                        }
                        className="min-h-0"
                      />
                    ) : schemaView?.status === "large" ? (
                      <ErrorState
                        title="Schema unavailable"
                        message={JSON_ERROR_MESSAGES.largeFile}
                        className="min-h-0"
                      />
                    ) : schemaView?.status === "invalid" ? (
                      <ErrorState
                        title={jsonErrorTitle(schemaView.error)}
                        message={describeJsonError(schemaView.error)}
                        className="min-h-0"
                      />
                    ) : schemaView?.status === "rejected" ? (
                      <ErrorState
                        title="Invalid schema"
                        message={schemaView.error.message}
                        className="min-h-0"
                      />
                    ) : schemaView?.status === "ready" ? (
                      <JsonQueryResults
                        document={state.document}
                        results={schemaView.violations.map(toSchemaQueryResult)}
                        matchCount={schemaView.total}
                        truncated={schemaView.truncated}
                        isExecuting={false}
                        hasRun
                        error={null}
                        showPaths
                        valuesLabel="Schema violations"
                        badges={schemaView.violations.map(
                          (violation, index) => (
                            <Badge
                              key={`${violation.path}:${String(index)}`}
                              tone="danger"
                            >
                              {violation.keyword}
                            </Badge>
                          ),
                        )}
                        emptyCopy={{
                          noResults: {
                            title: "Schema valid",
                            description: "This document matches the schema.",
                          },
                        }}
                        className="h-full min-h-0"
                      />
                    ) : (
                      <LoadingState
                        label="Checking schema…"
                        className="min-h-0"
                      />
                    )}
                  </Panel>
                </div>
              ) : null}

              {tool === "format" ? (
                <JsonToolsPanel
                  style={outputStyle}
                  outputJson={state.outputJson}
                  disabled={!state.rawJson.trim() && !state.isValid}
                  isValid={state.isValid}
                  document={state.document}
                  tools={tools}
                  className="min-h-0 flex-1"
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </ErrorBoundary>
  );
}
