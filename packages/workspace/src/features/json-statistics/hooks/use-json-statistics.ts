"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { runJsonAnalyze } from "@json-explore/core/processing/statistics-engine";
import type { AppError } from "@json-explore/core/types/errors";
import type { JsonDocument } from "@json-explore/core/types/json";
import type { JsonStatistics } from "@json-explore/core/types/statistics";
import type { Result } from "@json-explore/core/types/result";

export type JsonStatisticsRunner = (
  document: JsonDocument,
) => Promise<Result<JsonStatistics, AppError>>;

export interface UseJsonStatisticsOptions {
  document: JsonDocument | null;
  analyzeFn?: JsonStatisticsRunner;
}

export function useJsonStatistics({
  document,
  analyzeFn = runJsonAnalyze,
}: UseJsonStatisticsOptions) {
  const [statistics, setStatistics] = useState<JsonStatistics | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(Boolean(document));
  const [error, setError] = useState<AppError | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [trackedDocument, setTrackedDocument] = useState(document);

  const generationRef = useRef(0);
  const analyzeFnRef = useRef(analyzeFn);
  const documentRef = useRef(document);

  if (document !== trackedDocument) {
    setTrackedDocument(document);
    setStatistics(null);
    setError(null);
    setIsAnalyzing(Boolean(document));
    setAnnouncement(document ? "Analyzing JSON…" : "");
  }

  useEffect(() => {
    analyzeFnRef.current = analyzeFn;
  }, [analyzeFn]);

  useEffect(() => {
    documentRef.current = document;
    generationRef.current += 1;
  }, [document]);

  const analyze = useCallback(async () => {
    const current = documentRef.current;
    if (!current) {
      setStatistics(null);
      setError(null);
      setIsAnalyzing(false);
      setAnnouncement("");
      return false;
    }

    const generation = ++generationRef.current;
    setIsAnalyzing(true);
    setError(null);
    setAnnouncement("Analyzing JSON…");

    const result = await analyzeFnRef.current(current);
    if (generation !== generationRef.current) {
      return false;
    }

    if (!result.ok) {
      setStatistics(null);
      setError(result.error);
      setIsAnalyzing(false);
      setAnnouncement(result.error.message);
      return false;
    }

    setStatistics(result.value);
    setError(null);
    setIsAnalyzing(false);
    setAnnouncement(
      `Analyzed ${result.value.totalNodes.toLocaleString()} nodes`,
    );
    return true;
  }, []);

  useEffect(() => {
    if (!document) {
      return;
    }
    void analyze();
  }, [analyze, document]);

  return {
    statistics,
    isAnalyzing,
    error,
    announcement,
    retry: analyze,
  };
}
