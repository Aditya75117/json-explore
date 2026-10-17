"use client";

import { useEffect, useRef, useState } from "react";
import { BrandMark } from "@json-explore/ui/components/brand-mark";
import { Button } from "@json-explore/ui/components/button";
import { ErrorState } from "@json-explore/ui/components/error-state";
import { Input } from "@json-explore/ui/components/input";
import { Panel } from "@json-explore/ui/components/panel";
import { TabList } from "@json-explore/ui/components/tabs";
import { Textarea } from "@json-explore/ui/components/textarea";
import {
  DocumentScaleNotice,
  jsonEditorPreview,
  shouldUseCompactJsonEditor,
} from "@json-explore/workspace/components/common/document-scale-notice";
import { WORKSPACE_PARSE_DEBOUNCE_MS } from "@json-explore/workspace/constants/workspace-tools";
import { createExtensionPopupHostProfile } from "@json-explore/workspace/host/profiles";
import type { HostProfile } from "@json-explore/workspace/host/types";
import { useJsonWorkspace } from "@json-explore/workspace/hooks/use-json-workspace";
import { useJsonSearch } from "@json-explore/workspace/features/json-search/hooks/use-json-search";
import { useJsonTools } from "@json-explore/workspace/features/json-tools/hooks/use-json-tools";
import { JsonSearchResults } from "@json-explore/workspace/features/json-search/components/json-search-results";
import { SearchModeSelector } from "@json-explore/workspace/features/json-search/components/search-mode-selector";
import { jsonErrorTitle } from "@json-explore/core/json/error-copy";
import {
  byteLengthOfString,
  getJsonDocumentScale,
} from "@json-explore/core/performance";
import { cn } from "@json-explore/ui/cn";

type CompactTab = "edit" | "find";

/**
 * Compact JSON toolkit for Chrome popup (and other dense hosts).
 * Same workspace store / engines as the full shell — different composition.
 */
export function CompactToolkitShell({
  profile = createExtensionPopupHostProfile(),
  className,
}: {
  profile?: HostProfile;
  className?: string;
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
  } = useJsonWorkspace();

  const [tab, setTab] = useState<CompactTab>("edit");
  const [copied, setCopied] = useState(false);
  const parsedRawRef = useRef("");
  const isProcessing = state.status === "parsing";
  const rawBytes = byteLengthOfString(state.rawJson);
  const documentScale = getJsonDocumentScale(rawBytes);
  const explorerDocument =
    state.document && state.status !== "error" ? state.document : null;

  useEffect(() => {
    profile.adapters.persistSource?.(state.rawJson);
  }, [profile.adapters, state.rawJson]);

  useEffect(() => {
    const stored = profile.adapters.restoreSource?.();
    if (stored && !state.rawJson.trim()) {
      setRawJson(stored);
    }
    // Mount-only restore.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      void applyParse(raw).then(() => {
        parsedRawRef.current = raw;
      });
    }, WORKSPACE_PARSE_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [applyParse, state.rawJson]);

  const search = useJsonSearch({
    document: explorerDocument,
    query: state.searchQuery,
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
    copyPath: async () => false,
    copyValue: async () => false,
  });

  const compactEditor = shouldUseCompactJsonEditor(state.rawJson.length);
  const editorValue = compactEditor
    ? jsonEditorPreview(state.rawJson)
    : state.rawJson;

  const handleCopy = async () => {
    const text = state.outputJson || state.rawJson;
    if (!text.trim()) {
      return;
    }
    const ok = await profile.adapters.copyText(text);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleClear = () => {
    clearWorkspace();
    parsedRawRef.current = "";
    setSearchQuery("");
  };

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col gap-2 bg-background p-3 text-foreground",
        className,
      )}
    >
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BrandMark className="h-9" />
          <div>
            <p className="text-sm font-semibold tracking-tight">JSON Explore</p>
            <p className="text-xs text-muted">Format, minify, validate, find</p>
          </div>
        </div>
        <TabList
          label="Toolkit view"
          value={tab}
          onChange={(value) => setTab(value as CompactTab)}
          items={[
            { id: "edit", label: "Edit" },
            { id: "find", label: "Find" },
          ]}
        />
      </header>

      {tab === "edit" ? (
        <Panel
          className="flex min-h-0 flex-1 flex-col gap-2 p-2"
          aria-label="JSON editor"
        >
          <DocumentScaleNotice scale={documentScale} byteLength={rawBytes} />
          <Textarea
            aria-label="JSON input"
            value={editorValue}
            onChange={(event) => {
              if (compactEditor) {
                return;
              }
              setRawJson(event.target.value);
            }}
            readOnly={compactEditor}
            spellCheck={false}
            className="min-h-0 flex-1 resize-none font-mono text-xs"
          />
          {state.error ? (
            <ErrorState
              title={jsonErrorTitle(state.error)}
              error={state.error}
            />
          ) : null}
        </Panel>
      ) : (
        <Panel
          className="flex min-h-0 flex-1 flex-col gap-2 p-2"
          aria-label="Find values"
        >
          <div className="flex flex-col gap-2">
            <Input
              aria-label="Search JSON"
              placeholder="Find keys or values…"
              value={state.searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            <SearchModeSelector
              value={search.mode}
              onChange={search.setMode}
            />
          </div>
          <JsonSearchResults
            query={search.committedQuery}
            document={explorerDocument}
            results={search.results}
            matchCount={search.matchCount}
            truncated={search.truncated}
            selectedResultIndex={search.selectedResultIndex}
            isSearching={search.isSearching}
            error={search.error}
            onSelectIndex={search.selectResultIndex}
            onActivate={(result) => {
              selectNode(result.nodeId);
            }}
            className="min-h-0 flex-1"
          />
        </Panel>
      )}

      <div
        className="flex flex-wrap gap-1.5"
        role="toolbar"
        aria-label="JSON actions"
      >
        <Button
          size="sm"
          disabled={isProcessing || !state.rawJson.trim()}
          onClick={() => void tools.format()}
        >
          Format
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={isProcessing || !state.rawJson.trim()}
          onClick={() => void tools.minify()}
        >
          Minify
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={isProcessing || !state.rawJson.trim()}
          onClick={() => void tools.validate()}
        >
          Validate
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={!state.rawJson.trim() && !state.outputJson.trim()}
          onClick={() => void handleCopy()}
        >
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={!state.rawJson.trim() && !state.error}
          onClick={handleClear}
        >
          Clear
        </Button>
      </div>

      {tools.announcement ? (
        <p className="sr-only" aria-live="polite">
          {tools.announcement}
        </p>
      ) : null}
    </div>
  );
}
