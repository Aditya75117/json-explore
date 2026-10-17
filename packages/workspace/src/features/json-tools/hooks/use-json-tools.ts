"use client";

import { useCallback, useState } from "react";
import { TOOLS_MESSAGES } from "@json-explore/core/constants/tools";
import { jsonErrorTitle } from "@json-explore/core/json/error-copy";
import { resolveJsonDownloadFilename } from "@json-explore/core/json/filename";
import { serializeJsonValue } from "@json-explore/core/json/serialize";
import { validateJson } from "@json-explore/core/json/validate";
import { copyTextToClipboard } from "@json-explore/core/utils/clipboard";
import { downloadTextFile } from "@json-explore/core/utils/download";
import type { JsonIndentation } from "@json-explore/core/constants/json";
import type { JsonDocument, JsonValue } from "@json-explore/core/types/json";
import type { AppError } from "@json-explore/core/types/errors";

export type JsonToolsAction =
  | "format"
  | "minify"
  | "validate"
  | "copy"
  | "download"
  | null;

export interface UseJsonToolsOptions {
  rawJson: string;
  parsedJson: JsonValue | null;
  document: JsonDocument | null;
  outputJson: string;
  indentation: JsonIndentation;
  isValid: boolean;
  error: AppError | null;
  selectedNodeId: string | null;
  sourceFileName: string | null;
  isProcessing: boolean;
  applyParse: (rawJson: string) => Promise<boolean>;
  applyFormat: (
    rawJson: string,
    indentation: JsonIndentation,
  ) => Promise<boolean>;
  applyMinify: (rawJson: string) => Promise<boolean>;
  clearWorkspace: () => void;
  copyPath: (nodeId?: string) => Promise<boolean>;
  copyValue: (nodeId?: string) => Promise<boolean>;
}

function hasWorkspaceContent(
  rawJson: string,
  parsedJson: JsonValue | null,
): boolean {
  return Boolean(rawJson.trim()) || parsedJson !== null;
}

export function useJsonTools({
  rawJson,
  parsedJson,
  document,
  outputJson,
  indentation,
  isValid,
  error,
  selectedNodeId,
  sourceFileName,
  isProcessing,
  applyParse,
  applyFormat,
  applyMinify,
  clearWorkspace,
  copyPath,
  copyValue,
}: UseJsonToolsOptions) {
  const [announcement, setAnnouncement] = useState("");
  const [activeAction, setActiveAction] = useState<JsonToolsAction>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const busy = isProcessing || activeAction !== null;
  const hasJson = hasWorkspaceContent(rawJson, parsedJson);
  const hasDocument = Boolean(document && isValid);
  const hasSelection = Boolean(hasDocument && selectedNodeId);

  const format = useCallback(async () => {
    if (!rawJson.trim() && parsedJson === null) {
      setAnnouncement(TOOLS_MESSAGES.noJson);
      return false;
    }
    setActiveAction("format");
    const ok = await applyFormat(rawJson, indentation);
    setActiveAction(null);
    setAnnouncement(ok ? TOOLS_MESSAGES.formatted : TOOLS_MESSAGES.cannotFormat);
    return ok;
  }, [applyFormat, indentation, parsedJson, rawJson]);

  const minify = useCallback(async () => {
    if (!rawJson.trim() && parsedJson === null) {
      setAnnouncement(TOOLS_MESSAGES.noJson);
      return false;
    }
    setActiveAction("minify");
    const ok = await applyMinify(rawJson);
    setActiveAction(null);
    setAnnouncement(ok ? TOOLS_MESSAGES.minified : TOOLS_MESSAGES.cannotMinify);
    return ok;
  }, [applyMinify, parsedJson, rawJson]);

  const validate = useCallback(async () => {
    if (!rawJson.trim() && !isValid) {
      setAnnouncement(TOOLS_MESSAGES.noJson);
      return false;
    }
    if (isValid) {
      setAnnouncement(TOOLS_MESSAGES.valid);
      return true;
    }
    const local = validateJson(rawJson);
    if (!local.ok) {
      setActiveAction("validate");
      await applyParse(rawJson);
      setActiveAction(null);
      setAnnouncement(
        [jsonErrorTitle(local.error), local.error.details]
          .filter(Boolean)
          .join(". "),
      );
      return false;
    }
    setActiveAction("validate");
    const ok = await applyParse(rawJson);
    setActiveAction(null);
    setAnnouncement(ok ? TOOLS_MESSAGES.valid : TOOLS_MESSAGES.invalid);
    return ok;
  }, [applyParse, isValid, rawJson]);

  const copySerialized = useCallback(
    async (style: "formatted" | "minified") => {
      if (!isValid || parsedJson === null) {
        setAnnouncement(
          error ? TOOLS_MESSAGES.cannotFormat : TOOLS_MESSAGES.noJson,
        );
        return false;
      }
      setActiveAction("copy");
      const text = serializeJsonValue(parsedJson, style, indentation);
      const ok = await copyTextToClipboard(text);
      setActiveAction(null);
      setAnnouncement(ok ? TOOLS_MESSAGES.copiedJson : TOOLS_MESSAGES.copyFailed);
      return ok;
    },
    [error, indentation, isValid, parsedJson],
  );

  const copySelectedPath = useCallback(async () => {
    if (!hasSelection) {
      setAnnouncement(TOOLS_MESSAGES.noSelection);
      return false;
    }
    const ok = await copyPath(selectedNodeId ?? undefined);
    setAnnouncement(ok ? TOOLS_MESSAGES.copiedPath : TOOLS_MESSAGES.copyFailed);
    return ok;
  }, [copyPath, hasSelection, selectedNodeId]);

  const copySelectedValue = useCallback(async () => {
    if (!hasSelection) {
      setAnnouncement(TOOLS_MESSAGES.noSelection);
      return false;
    }
    const ok = await copyValue(selectedNodeId ?? undefined);
    setAnnouncement(ok ? TOOLS_MESSAGES.copiedValue : TOOLS_MESSAGES.copyFailed);
    return ok;
  }, [copyValue, hasSelection, selectedNodeId]);

  const downloadSerialized = useCallback(
    (variant: "current" | "formatted" | "minified") => {
      if (!isValid || parsedJson === null) {
        setAnnouncement(
          error ? TOOLS_MESSAGES.cannotFormat : TOOLS_MESSAGES.noJson,
        );
        return false;
      }

      setAnnouncement(TOOLS_MESSAGES.preparingDownload);
      const content =
        variant === "current"
          ? outputJson || serializeJsonValue(parsedJson, "formatted", indentation)
          : serializeJsonValue(
              parsedJson,
              variant === "minified" ? "minified" : "formatted",
              indentation,
            );
      const filename = resolveJsonDownloadFilename(sourceFileName, variant);
      const ok = downloadTextFile(content, filename);
      setAnnouncement(
        ok ? TOOLS_MESSAGES.downloaded : TOOLS_MESSAGES.downloadFailed,
      );
      return ok;
    },
    [error, indentation, isValid, outputJson, parsedJson, sourceFileName],
  );

  const requestClear = useCallback(() => {
    if (!hasJson) {
      return;
    }
    setConfirmClear(true);
  }, [hasJson]);

  const cancelClear = useCallback(() => {
    setConfirmClear(false);
  }, []);

  const confirmClearWorkspace = useCallback(() => {
    clearWorkspace();
    setConfirmClear(false);
    setAnnouncement(TOOLS_MESSAGES.cleared);
  }, [clearWorkspace]);

  return {
    announcement,
    activeAction,
    busy,
    hasJson,
    hasDocument,
    hasSelection,
    confirmClear,
    format,
    minify,
    validate,
    copyFormatted: () => copySerialized("formatted"),
    copyMinified: () => copySerialized("minified"),
    copySelectedPath,
    copySelectedValue,
    downloadFormatted: () => downloadSerialized("formatted"),
    downloadMinified: () => downloadSerialized("minified"),
    requestClear,
    cancelClear,
    confirmClearWorkspace,
  };
}
