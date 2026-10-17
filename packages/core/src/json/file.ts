/**
 * Client-side file reading for JSON uploads.
 * Files never leave the browser — no network uploads.
 */

import { ACCEPTED_JSON_EXTENSIONS, MAX_JSON_BYTE_LIMIT } from "@json-explore/core/constants/app";
import { JSON_ERROR_MESSAGES } from "@json-explore/core/constants/json-messages";
import { createAppError, type AppError } from "@json-explore/core/types/errors";

export interface ReadJsonFileSuccess {
  ok: true;
  fileName: string;
  sizeBytes: number;
  content: string;
}

export interface ReadJsonFileFailure {
  ok: false;
  error: AppError;
}

export type ReadJsonFileResult = ReadJsonFileSuccess | ReadJsonFileFailure;

const UTF8_BOM = [0xef, 0xbb, 0xbf] as const;
const UTF16LE_BOM = [0xff, 0xfe] as const;
const UTF16BE_BOM = [0xfe, 0xff] as const;

function hasPrefix(bytes: Uint8Array, prefix: readonly number[]): boolean {
  if (bytes.length < prefix.length) {
    return false;
  }
  return prefix.every((value, index) => bytes[index] === value);
}

function stripUtf8Bom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function decodeJsonFileBytes(bytes: Uint8Array): string {
  if (hasPrefix(bytes, UTF16LE_BOM)) {
    return new TextDecoder("utf-16le").decode(bytes);
  }
  if (hasPrefix(bytes, UTF16BE_BOM)) {
    return new TextDecoder("utf-16be").decode(bytes);
  }

  const utf8 = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  if (hasPrefix(bytes, UTF8_BOM)) {
    return stripUtf8Bom(utf8);
  }
  return stripUtf8Bom(utf8);
}

function hasAcceptedExtension(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return ACCEPTED_JSON_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function isAcceptedJsonFile(file: File): boolean {
  if (hasAcceptedExtension(file.name)) {
    return true;
  }

  return (
    file.type === "application/json" ||
    file.type === "text/json" ||
    file.type === "text/plain"
  );
}

export async function readJsonFile(file: File): Promise<ReadJsonFileResult> {
  if (!isAcceptedJsonFile(file)) {
    return {
      ok: false,
      error: createAppError(
        "UNSUPPORTED_FILE",
        JSON_ERROR_MESSAGES.unsupportedFile,
        file.name,
      ),
    };
  }

  if (file.size > MAX_JSON_BYTE_LIMIT) {
    return {
      ok: false,
      error: createAppError(
        "LARGE_FILE_LIMIT",
        JSON_ERROR_MESSAGES.largeFile,
        file.name,
      ),
    };
  }

  try {
    const buffer = await file.arrayBuffer();
    const content = decodeJsonFileBytes(new Uint8Array(buffer));
    return {
      ok: true,
      fileName: file.name,
      sizeBytes: file.size,
      content,
    };
  } catch {
    return {
      ok: false,
      error: createAppError(
        "FILE_READ_ERROR",
        JSON_ERROR_MESSAGES.fileRead,
        file.name,
      ),
    };
  }
}
