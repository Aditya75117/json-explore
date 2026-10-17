"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { JSON_ERROR_MESSAGES } from "@json-explore/core/constants/json-messages";
import { stringifyFormatted } from "@json-explore/core/json/formatter";
import { stringifyMinified } from "@json-explore/core/json/minifier";
import { getJsonNode } from "@json-explore/core/json/document";
import { byteLengthOfString, shouldOffloadToWorker } from "@json-explore/core/performance";
import {
  abortInflightWorkerWork,
  runJsonFormat,
  runJsonMinify,
  runJsonParse,
  runJsonSerialize,
  type JsonEngineResult,
} from "@json-explore/core/processing/json-engine";
import { createAppError } from "@json-explore/core/types/errors";
import { terminateJsonWorkerClient } from "@json-explore/core/workers/json-worker-client";
import {
  INITIAL_WORKSPACE_STATE,
  type JsonWorkspaceState,
} from "@json-explore/core/types/workspace";
import type { JsonIndentation } from "@json-explore/core/constants/json";
import type { JsonValue } from "@json-explore/core/types/json";

/**
 * Feature-level workspace state hook.
 * Parsing stays in lib/; this hook only orchestrates UI state.
 */
export function useJsonWorkspace(
  initial: JsonWorkspaceState = INITIAL_WORKSPACE_STATE,
) {
  const [state, setState] = useState<JsonWorkspaceState>(initial);
  const generationRef = useRef(0);

  const setRawJson = useCallback((rawJson: string) => {
    const empty = !rawJson.trim();
    setState((prev) => ({
      ...prev,
      rawJson,
      isValid: false,
      error: null,
      status: "idle",
      ...(empty
        ? {
            parsedJson: null,
            document: null,
            outputJson: "",
            selectedNodeId: null,
          }
        : {}),
    }));
  }, []);

  const setSearchQuery = useCallback((searchQuery: string) => {
    setState((prev) => ({ ...prev, searchQuery }));
  }, []);

  const selectNode = useCallback((selectedNodeId: string | null) => {
    setState((prev) => ({ ...prev, selectedNodeId }));
  }, []);

  const setIndentation = useCallback((indentation: JsonIndentation) => {
    setState((prev) => ({ ...prev, indentation }));
  }, []);

  const clearWorkspace = useCallback(() => {
    generationRef.current += 1;
    terminateJsonWorkerClient();
    setState(INITIAL_WORKSPACE_STATE);
  }, []);

  const applySerializedValue = useCallback(
    (generation: number, value: JsonValue, output: string) => {
      if (generation !== generationRef.current) {
        return;
      }

      setState((prev) => ({
        ...prev,
        outputJson: output,
        parsedJson: value,
        isValid: true,
        error: null,
        status: "ready",
      }));
    },
    [],
  );

  const applyEngineResult = useCallback(
    (
      generation: number,
      rawJson: string,
      result: JsonEngineResult,
      replaceRawWithOutput: boolean,
    ) => {
      if (generation !== generationRef.current) {
        return;
      }

      if (!result.ok) {
        setState((prev) => ({
          ...prev,
          rawJson,
          parsedJson: null,
          document: null,
          outputJson: "",
          isValid: false,
          error: result.error,
          status: "error",
          selectedNodeId: null,
        }));
        return;
      }

      const nextRaw =
        replaceRawWithOutput && result.value.output !== undefined
          ? result.value.output
          : rawJson;

      setState((prev) => ({
        ...prev,
        rawJson: nextRaw,
        parsedJson: result.value.value,
        document: result.value.document,
        outputJson: result.value.output ?? nextRaw,
        isValid: true,
        error: null,
        status: "ready",
        selectedNodeId:
          prev.selectedNodeId &&
          getJsonNode(result.value.document, prev.selectedNodeId)
            ? prev.selectedNodeId
            : result.value.document.rootId,
      }));
    },
    [],
  );

  const applyParse = useCallback(
    async (rawJson: string) => {
      abortInflightWorkerWork();
      const generation = ++generationRef.current;
      setState((prev) => ({ ...prev, status: "parsing", error: null }));
      const result = await runJsonParse(rawJson);
      applyEngineResult(generation, rawJson, result, false);
      return result.ok;
    },
    [applyEngineResult],
  );

  const applyFormat = useCallback(
    async (rawJson: string, indentation: JsonIndentation) => {
      const current = { isValid: state.isValid, parsedJson: state.parsedJson };
      if (current.isValid && current.parsedJson !== null) {
        const generation = ++generationRef.current;
        setState((prev) => ({ ...prev, status: "parsing", error: null }));
        try {
          const size = byteLengthOfString(state.rawJson);
          if (shouldOffloadToWorker(size)) {
            const serialized = await runJsonSerialize(current.parsedJson, {
              style: "formatted",
              indentation,
              revision: state.document?.metadata.revision,
              sizeInBytes: size,
            });
            if (!serialized.ok) {
              throw new Error(serialized.error.message);
            }
            applySerializedValue(
              generation,
              current.parsedJson,
              serialized.value,
            );
            return true;
          }
          const output = stringifyFormatted(current.parsedJson, indentation);
          applySerializedValue(generation, current.parsedJson, output);
          return true;
        } catch {
          if (generation === generationRef.current) {
            setState((prev) => ({
              ...prev,
              status: "error",
              error: createAppError(
                "UNKNOWN",
                JSON_ERROR_MESSAGES.cannotFormat,
              ),
            }));
          }
          return false;
        }
      }

      const generation = ++generationRef.current;
      setState((prev) => ({ ...prev, status: "parsing", error: null }));
      const result = await runJsonFormat(rawJson, { indentation });
      applyEngineResult(generation, rawJson, result, false);
      return result.ok;
    },
    [
      applyEngineResult,
      applySerializedValue,
      state.document,
      state.isValid,
      state.parsedJson,
      state.rawJson,
    ],
  );

  const applyMinify = useCallback(
    async (rawJson: string) => {
      const current = { isValid: state.isValid, parsedJson: state.parsedJson };
      if (current.isValid && current.parsedJson !== null) {
        const generation = ++generationRef.current;
        setState((prev) => ({ ...prev, status: "parsing", error: null }));
        try {
          const size = byteLengthOfString(state.rawJson);
          if (shouldOffloadToWorker(size)) {
            const serialized = await runJsonSerialize(current.parsedJson, {
              style: "minified",
              revision: state.document?.metadata.revision,
              sizeInBytes: size,
            });
            if (!serialized.ok) {
              throw new Error(serialized.error.message);
            }
            applySerializedValue(
              generation,
              current.parsedJson,
              serialized.value,
            );
            return true;
          }
          const output = stringifyMinified(current.parsedJson);
          applySerializedValue(generation, current.parsedJson, output);
          return true;
        } catch {
          if (generation === generationRef.current) {
            setState((prev) => ({
              ...prev,
              status: "error",
              error: createAppError(
                "UNKNOWN",
                JSON_ERROR_MESSAGES.cannotMinify,
              ),
            }));
          }
          return false;
        }
      }

      const generation = ++generationRef.current;
      setState((prev) => ({ ...prev, status: "parsing", error: null }));
      const result = await runJsonMinify(rawJson);
      applyEngineResult(generation, rawJson, result, false);
      return result.ok;
    },
    [
      applyEngineResult,
      applySerializedValue,
      state.document,
      state.isValid,
      state.parsedJson,
      state.rawJson,
    ],
  );

  const loadContent = useCallback(
    async (content: string, fileName?: string) => {
      abortInflightWorkerWork();
      const generation = ++generationRef.current;
      setState((prev) => ({
        ...prev,
        rawJson: content,
        sourceFileName: fileName ?? null,
        status: "parsing",
        error: null,
      }));
      const result = await runJsonParse(content);
      applyEngineResult(generation, content, result, false);
      return result.ok;
    },
    [applyEngineResult],
  );

  return useMemo(
    () => ({
      state,
      setRawJson,
      setSearchQuery,
      selectNode,
      setIndentation,
      clearWorkspace,
      applyParse,
      applyFormat,
      applyMinify,
      loadContent,
    }),
    [
      state,
      setRawJson,
      setSearchQuery,
      selectNode,
      setIndentation,
      clearWorkspace,
      applyParse,
      applyFormat,
      applyMinify,
      loadContent,
    ],
  );
}
