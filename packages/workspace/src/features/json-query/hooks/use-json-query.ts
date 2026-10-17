"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { runJsonQuery } from "@json-explore/core/processing/query-engine";
import type { AppError } from "@json-explore/core/types/errors";
import type { JsonDocument } from "@json-explore/core/types/json";
import type {
  ExecuteQueryOptions,
  JsonQueryResponse,
  JsonQueryResult,
  QueryError,
  QueryMode,
} from "@json-explore/core/types/query";
import type { Result } from "@json-explore/core/types/result";

export type JsonQueryRunner = (
  document: JsonDocument,
  options: ExecuteQueryOptions,
) => Promise<Result<JsonQueryResponse, QueryError | AppError>>;

export interface UseJsonQueryOptions {
  document: JsonDocument | null;
  executeFn?: JsonQueryRunner;
}

export interface JsonQueryState {
  query: string;
  mode: QueryMode;
  results: JsonQueryResult[];
  matchCount: number;
  truncated: boolean;
  selectedResultIndex: number;
  isExecuting: boolean;
  error: QueryError | AppError | null;
  hasRun: boolean;
}

export function useJsonQuery({
  document,
  executeFn = runJsonQuery,
}: UseJsonQueryOptions) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<QueryMode>("jsonpath");
  const [results, setResults] = useState<JsonQueryResult[]>([]);
  const [matchCount, setMatchCount] = useState(0);
  const [truncated, setTruncated] = useState(false);
  const [selectedResultIndex, setSelectedResultIndex] = useState(-1);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<QueryError | AppError | null>(null);
  const [hasRun, setHasRun] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [committedQuery, setCommittedQuery] = useState("");

  const generationRef = useRef(0);
  const executeFnRef = useRef(executeFn);
  const documentRef = useRef(document);
  const [trackedDocument, setTrackedDocument] = useState(document);

  if (document !== trackedDocument) {
    setTrackedDocument(document);
    setResults([]);
    setMatchCount(0);
    setTruncated(false);
    setSelectedResultIndex(-1);
    setError(null);
    setHasRun(false);
    setIsExecuting(false);
    setAnnouncement("");
    setCommittedQuery("");
  }

  useEffect(() => {
    executeFnRef.current = executeFn;
  }, [executeFn]);

  useEffect(() => {
    documentRef.current = document;
    generationRef.current += 1;
  }, [document]);

  const clearResults = useCallback(() => {
    generationRef.current += 1;
    setResults([]);
    setMatchCount(0);
    setTruncated(false);
    setSelectedResultIndex(-1);
    setError(null);
    setHasRun(false);
    setIsExecuting(false);
    setAnnouncement("");
    setCommittedQuery("");
  }, []);

  const clear = useCallback(() => {
    setQuery("");
    clearResults();
  }, [clearResults]);

  const execute = useCallback(async (
    nextQuery = query,
    nextMode = mode,
  ) => {
    setQuery(nextQuery);
    setMode(nextMode);

    const currentDocument = documentRef.current;
    const trimmed = nextQuery.trim();
    if (!currentDocument || !trimmed) {
      return false;
    }

    const generation = ++generationRef.current;
    setIsExecuting(true);
    setError(null);
    setHasRun(true);

    const result = await executeFnRef.current(currentDocument, {
      query: trimmed,
      mode: nextMode,
    });

    if (generation !== generationRef.current) {
      return false;
    }

    if (!result.ok) {
      setResults([]);
      setMatchCount(0);
      setTruncated(false);
      setSelectedResultIndex(-1);
      setError(result.error);
      setCommittedQuery(trimmed);
      setIsExecuting(false);
      setAnnouncement(result.error.message);
      return false;
    }

    setResults(result.value.results);
    setMatchCount(result.value.matchCount);
    setTruncated(result.value.truncated);
    setSelectedResultIndex(result.value.results.length > 0 ? 0 : -1);
    setError(null);
    setCommittedQuery(result.value.query);
    setIsExecuting(false);

    if (result.value.matchCount === 0) {
      setAnnouncement("No results found");
    } else if (result.value.truncated) {
      setAnnouncement(
        `${result.value.matchCount} results found. Showing the first ${String(result.value.results.length)}.`,
      );
    } else {
      const noun = result.value.matchCount === 1 ? "result" : "results";
      setAnnouncement(`${result.value.matchCount} ${noun} found`);
    }
    return true;
  }, [mode, query]);

  const selectResultIndex = useCallback(
    (index: number) => {
      if (results.length === 0) {
        setSelectedResultIndex(-1);
        return;
      }
      setSelectedResultIndex(
        Math.max(0, Math.min(results.length - 1, index)),
      );
    },
    [results.length],
  );

  const selectNext = useCallback(() => {
    if (results.length === 0) {
      return;
    }
    setSelectedResultIndex((current) =>
      current < 0 ? 0 : (current + 1) % results.length,
    );
  }, [results.length]);

  const selectPrevious = useCallback(() => {
    if (results.length === 0) {
      return;
    }
    setSelectedResultIndex((current) =>
      current <= 0 ? results.length - 1 : current - 1,
    );
  }, [results.length]);

  const selectedResult =
    selectedResultIndex >= 0 ? (results[selectedResultIndex] ?? null) : null;

  return {
    query,
    setQuery,
    mode,
    setMode,
    results,
    matchCount,
    truncated,
    selectedResultIndex,
    selectedResult,
    isExecuting,
    error,
    hasRun,
    announcement,
    committedQuery,
    execute,
    clear,
    selectResultIndex,
    selectNext,
    selectPrevious,
    state: {
      query,
      mode,
      results,
      matchCount,
      truncated,
      selectedResultIndex,
      isExecuting,
      error,
      hasRun,
    } satisfies JsonQueryState,
  };
}
