"use client";

import {
  forwardRef,
  useCallback,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  DocumentScaleNotice,
  jsonEditorPreview,
  shouldUseCompactJsonEditor,
} from "@json-explore/workspace/components/common/document-scale-notice";
import { Button } from "@json-explore/ui/components/button";
import { Panel } from "@json-explore/ui/components/panel";
import { ErrorState } from "@json-explore/ui/components/error-state";
import { JsonSourceEditor } from "@json-explore/workspace/features/json-input/components/json-source-editor";
import type { JsonDocumentScale } from "@json-explore/core/constants/performance";
import { jsonErrorTitle } from "@json-explore/core/json/error-copy";
import { positionFromLocation } from "@json-explore/core/json/errors";
import { readJsonFile } from "@json-explore/core/json/file";
import type { AppError, JsonParseError } from "@json-explore/core/types/errors";
import { cn } from "@json-explore/ui/cn";

export interface JsonInputPanelProps {
  value: string;
  onChange: (value: string) => void;
  onLoadContent: (content: string, fileName?: string) => void;
  isValid: boolean;
  isProcessing?: boolean;
  error: AppError | null;
  byteLength?: number;
  documentScale?: JsonDocumentScale;
  nodeCount?: number;
  processingLabel?: string;
  onLoadSample?: () => void;
  extraActions?: ReactNode;
  title?: string;
  inputLabel?: string;
  panelLabel?: string;
  className?: string;
}

export interface JsonInputPanelHandle {
  focus: () => void;
}

export const JsonInputPanel = forwardRef<
  JsonInputPanelHandle,
  JsonInputPanelProps
>(function JsonInputPanel(
  {
    value,
    onChange,
    onLoadContent,
    isValid,
    isProcessing = false,
    error,
    byteLength,
    documentScale = "small",
    nodeCount,
    processingLabel = "Processing JSON",
    onLoadSample,
    extraActions,
    title,
    inputLabel = "JSON input",
    panelLabel = "Source",
    className,
  },
  ref,
) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputId = useId();
  const errorId = useId();
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState<AppError | null>(null);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      const file = files?.[0];
      if (!file) {
        return;
      }

      const result = await readJsonFile(file);
      if (!result.ok) {
        setFileError(result.error);
        return;
      }

      setFileError(null);
      onLoadContent(result.content, result.fileName);
    },
    [onLoadContent],
  );

  useImperativeHandle(ref, () => ({
    focus: () => {
      textareaRef.current?.focus();
    },
  }));

  const displayError = fileError ?? error;
  const hasValue = Boolean(value.trim());
  const compactEditor = shouldUseCompactJsonEditor(value.length);

  const goToError = () => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }
    textarea.focus();
    if (compactEditor || displayError?.code !== "INVALID_JSON") {
      return;
    }
    const parseError = displayError as JsonParseError;
    const offset =
      parseError.position ??
      (parseError.line !== undefined
        ? positionFromLocation(value, parseError.line, parseError.column)
        : undefined);
    if (offset === undefined) {
      return;
    }
    const caret = Math.min(offset, value.length);
    textarea.setSelectionRange(caret, caret);

    const lineHeight = Number.parseFloat(getComputedStyle(textarea).lineHeight);
    if (Number.isFinite(lineHeight)) {
      const line = value.slice(0, caret).split(/\r\n|\r|\n/).length;
      textarea.scrollTop = Math.max(
        0,
        (line - 1) * lineHeight - textarea.clientHeight / 2,
      );
    }
  };

  return (
    <Panel
      title={title}
      className={cn("min-h-0 flex-1", className)}
      bodyClassName="overflow-hidden"
      aria-label={panelLabel}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {onLoadSample ? (
            <Button
              size="sm"
              variant={hasValue ? "ghost" : "primary"}
              className={cn(!hasValue && "lg:hidden")}
              onClick={onLoadSample}
              disabled={isProcessing}
            >
              Load sample
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
          >
            Upload file
          </Button>
          {extraActions}
        </div>
      }
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json,text/plain"
        className="hidden"
        onChange={(event) => {
          void handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <div
        className={cn(
          "flex h-full min-h-0 flex-1 flex-col gap-2 p-3",
          dragActive && "bg-primary/5",
        )}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragActive(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          void handleFiles(event.dataTransfer.files);
        }}
      >
        <label htmlFor={inputId} className="sr-only">
          {inputLabel}
        </label>
        {byteLength !== undefined && hasValue ? (
          <DocumentScaleNotice
            byteLength={byteLength}
            scale={documentScale}
            nodeCount={nodeCount}
          />
        ) : null}
        {compactEditor ? (
          <div className="flex min-h-0 flex-1 flex-col gap-2">
            <p className="text-muted shrink-0 text-xs">
              Full source is kept in memory but not mounted in the editor so the
              UI stays responsive. Upload a replacement or clear the workspace
              to start over.
            </p>
            <div className="relative min-h-0 flex-1">
              <JsonSourceEditor
                ref={textareaRef}
                id={inputId}
                value={jsonEditorPreview(value)}
                readOnly
                aria-label="Large JSON preview"
                aria-invalid={displayError ? true : undefined}
                aria-describedby={displayError ? errorId : undefined}
                spellCheck={false}
                className={cn(
                  "absolute inset-0 h-full resize-none",
                  dragActive && "border-dashed",
                )}
              />
            </div>
          </div>
        ) : (
          <div className="relative min-h-0 flex-1">
            <JsonSourceEditor
              ref={textareaRef}
              id={inputId}
              value={value}
              onChange={(event) => {
                setFileError(null);
                onChange(event.target.value);
              }}
              placeholder="Paste JSON or drop a JSON file here"
              aria-invalid={displayError ? true : undefined}
              aria-describedby={displayError ? errorId : undefined}
              spellCheck={false}
              className={cn(
                "absolute inset-0 h-full resize-none",
                dragActive && "border-dashed",
              )}
            />
          </div>
        )}
        <p className="sr-only" aria-live="polite">
          {isProcessing
            ? processingLabel
            : isValid
              ? "Valid JSON"
              : displayError
                ? [
                    jsonErrorTitle(displayError),
                    displayError.details &&
                    displayError.details !== displayError.message
                      ? displayError.details
                      : displayError.message !== jsonErrorTitle(displayError)
                        ? displayError.message
                        : null,
                  ]
                    .filter(Boolean)
                    .join(". ")
                : hasValue
                  ? "JSON has not been processed yet"
                  : "No JSON provided"}
        </p>
        {displayError ? (
          <div id={errorId}>
            <ErrorState
              title={jsonErrorTitle(displayError)}
              error={displayError}
              className="min-h-0 py-4"
              action={
                <Button size="sm" variant="secondary" onClick={goToError}>
                  Go to input
                </Button>
              }
            />
          </div>
        ) : null}
      </div>
    </Panel>
  );
});
