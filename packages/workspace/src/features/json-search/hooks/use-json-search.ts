"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SEARCH_DEBOUNCE_MS } from "@json-explore/core/constants/search";
import { runJsonSearch } from "@json-explore/core/processing/search-engine";
import { createEmptySearchResponse } from "@json-explore/core/search/search-json";
import type { AppError } from "@json-explore/core/types/errors";
import type { JsonDocument } from "@json-explore/core/types/json";
import type {
  JsonSearchResponse,
  JsonSearchResult,
  SearchMode,
  SearchOptions,
} from "@json-explore/core/types/search";
import type { Result } from "@json-explore/core/types/result";

export type JsonSearchRunner = (
  document: JsonDocument,
  options: SearchOptions,
) => Promise<Result<JsonSearchResponse, AppError>>;

export interface UseJsonSearchOptions {
  document: JsonDocument | null;
  query: string;
  debounceMs?: number;
  searchFn?: JsonSearchRunner;
}

export interface JsonSearchState {
  query: string;
  mode: SearchMode;
  results: JsonSearchResult[];
  matchCount: number;
  truncated: boolean;
  selectedResultIndex: number;
  isSearching: boolean;
  error: AppError | null;
  committedQuery: string;
}

export function useJsonSearch({
  document,
  query,
  debounceMs = SEARCH_DEBOUNCE_MS,
  searchFn = runJsonSearch,
}: UseJsonSearchOptions) {
  const [mode, setMode] = useState<SearchMode>("all");
  const [results, setResults] = useState<JsonSearchResult[]>([]);
  const [matchCount, setMatchCount] = useState(0);
  const [truncated, setTruncated] = useState(false);
  const [selectedResultIndex, setSelectedResultIndex] = useState(-1);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [committedQuery, setCommittedQuery] = useState("");
  const [committedMode, setCommittedMode] = useState<SearchMode | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const generationRef = useRef(0);
  const searchFnRef = useRef(searchFn);

  useEffect(() => {
    searchFnRef.current = searchFn;
  }, [searchFn]);

  const trimmed = query.trim();
  const canSearch = Boolean(trimmed && document);

  useEffect(() => {
    if (!canSearch || !document) {
      generationRef.current += 1;
      return;
    }

    const generation = ++generationRef.current;
    const timer = window.setTimeout(() => {
      void (async () => {
        setSearching(true);
        const result = await searchFnRef.current(document, {
          query: trimmed,
          mode,
        });

        if (generation !== generationRef.current) {
          return;
        }

        if (!result.ok) {
          setResults([]);
          setMatchCount(0);
          setTruncated(false);
          setSelectedResultIndex(-1);
          setError(result.error);
          setCommittedQuery(trimmed);
          setCommittedMode(mode);
          setSearching(false);
          setAnnouncement("Unable to search this JSON.");
          return;
        }

        setResults(result.value.results);
        setMatchCount(result.value.matchCount);
        setTruncated(result.value.truncated);
        setSelectedResultIndex(result.value.results.length > 0 ? 0 : -1);
        setError(null);
        setCommittedQuery(result.value.query);
        setCommittedMode(mode);
        setSearching(false);

        if (result.value.matchCount === 0) {
          setAnnouncement("No matches found");
        } else if (result.value.truncated) {
          setAnnouncement(
            `${result.value.matchCount} matches found. Showing the first ${String(result.value.results.length)}.`,
          );
        } else {
          const noun = result.value.matchCount === 1 ? "match" : "matches";
          setAnnouncement(`${result.value.matchCount} ${noun} found`);
        }
      })();
    }, debounceMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [canSearch, debounceMs, document, mode, trimmed]);

  const resultsFresh =
    canSearch && committedQuery === trimmed && committedMode === mode;
  const visibleResults = resultsFresh ? results : [];
  const visibleMatchCount = resultsFresh ? matchCount : 0;
  const visibleTruncated = resultsFresh ? truncated : false;
  const isSearching = canSearch && (searching || !resultsFresh);
  const visibleError = resultsFresh ? error : null;
  const visibleCommitted = canSearch ? committedQuery : "";
  const visibleAnnouncement = resultsFresh ? announcement : "";
  const visibleSelectedIndex = resultsFresh ? selectedResultIndex : -1;

  const selectedResult =
    visibleSelectedIndex >= 0
      ? (visibleResults[visibleSelectedIndex] ?? null)
      : null;

  const selectResultIndex = useCallback(
    (index: number) => {
      if (visibleResults.length === 0) {
        setSelectedResultIndex(-1);
        return;
      }
      const next = Math.max(0, Math.min(visibleResults.length - 1, index));
      setSelectedResultIndex(next);
    },
    [visibleResults.length],
  );

  const selectNext = useCallback(() => {
    if (visibleResults.length === 0) {
      return;
    }
    setSelectedResultIndex((current) =>
      current < 0 ? 0 : (current + 1) % visibleResults.length,
    );
  }, [visibleResults.length]);

  const selectPrevious = useCallback(() => {
    if (visibleResults.length === 0) {
      return;
    }
    setSelectedResultIndex((current) => {
      if (current <= 0) {
        return visibleResults.length - 1;
      }
      return current - 1;
    });
  }, [visibleResults.length]);

  const emptyResponse = useMemo(
    () => createEmptySearchResponse(trimmed, mode),
    [mode, trimmed],
  );

  return {
    mode,
    setMode,
    results: visibleResults,
    matchCount: visibleMatchCount,
    truncated: visibleTruncated,
    selectedResultIndex: visibleSelectedIndex,
    selectedResult,
    isSearching,
    error: visibleError,
    committedQuery: visibleCommitted,
    announcement: visibleAnnouncement,
    emptyResponse,
    selectResultIndex,
    selectNext,
    selectPrevious,
    state: {
      query,
      mode,
      results: visibleResults,
      matchCount: visibleMatchCount,
      truncated: visibleTruncated,
      selectedResultIndex: visibleSelectedIndex,
      isSearching,
      error: visibleError,
      committedQuery: visibleCommitted,
    } satisfies JsonSearchState,
  };
}
