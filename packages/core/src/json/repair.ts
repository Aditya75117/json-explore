import {
  DEFAULT_JSON_INDENTATION,
  type JsonIndentation,
} from "@json-explore/core/constants/json";
import {
  emptyJsonError,
  locationFromPosition,
} from "@json-explore/core/json/errors";
import { stringifyFormatted } from "@json-explore/core/json/formatter";
import { parseJson } from "@json-explore/core/json/parser";
import {
  createJsonParseError,
  type AppError,
  type JsonParseError,
} from "@json-explore/core/types/errors";
import type { JsonValue } from "@json-explore/core/types/json";
import type { Result } from "@json-explore/core/types/result";

export interface JsonRepair {
  json: string;
  fixes: readonly string[];
}

export type RepairJsonResult = Result<JsonRepair, JsonParseError>;

const TRAILING_COMMA = "trailing comma";
const SINGLE_QUOTES = "single quotes";
const UNQUOTED_KEY = "unquoted property name";
const MISSING_COMMA = "missing comma";

/**
 * Repair common JSON syntax issues and return valid JSON.
 * Unrecoverable input returns a user-facing error and does not echo the source.
 */
export function repairJson(
  input: string,
  indentation: JsonIndentation = DEFAULT_JSON_INDENTATION,
): RepairJsonResult {
  if (input.trim().length === 0) {
    return { ok: false, error: emptyJsonError() };
  }

  const existing = parseJson(input);
  if (existing.ok) {
    return {
      ok: true,
      value: {
        json: stringifyFormatted(existing.value, indentation),
        fixes: [],
      },
    };
  }

  try {
    const parser = new RepairParser(input);
    const value = parser.parse();
    if (parser.fixes.length === 0) {
      return { ok: false, error: existing.error };
    }
    const json = stringifyFormatted(value, indentation);
    const checked = parseJson(json);
    if (!checked.ok) {
      return checked;
    }
    return { ok: true, value: { json, fixes: parser.fixes } };
  } catch (caught) {
    if (isRepairFailure(caught)) {
      return { ok: false, error: caught };
    }
    return { ok: false, error: existing.error };
  }
}

export function describeUnfixedJson(error: JsonParseError): string {
  const reason = error.message.replace(/\.$/, "");
  const location = locationPhrase(error);
  const explanation = location ? `${reason}, ${location}.` : `${reason}.`;
  return `${explanation} Edit the source to fix this.`;
}

export function describeJsonRepair(
  fixes: readonly string[],
  error?: AppError | null,
): string {
  const phrase = sentence(fixes);
  const location =
    error?.code === "INVALID_JSON"
      ? locationPhrase(error as JsonParseError)
      : undefined;
  return location ? `${phrase}, ${location}.` : `${phrase}.`;
}

function sentence(fixes: readonly string[]): string {
  const items = [...new Set(fixes)];
  const body =
    items.length <= 1
      ? (items[0] ?? "This JSON has a syntax error")
      : items.length === 2
        ? `${items[0]} and ${items[1]}`
        : `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
  return body.charAt(0).toUpperCase() + body.slice(1);
}

function locationPhrase(error: JsonParseError): string | undefined {
  if (error.line !== undefined && error.column !== undefined) {
    return `near line ${error.line}, column ${error.column}`;
  }
  if (error.line !== undefined) {
    return `near line ${error.line}`;
  }
  return undefined;
}

function isRepairFailure(value: unknown): value is JsonParseError {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    value.code === "INVALID_JSON" &&
    "message" in value &&
    typeof value.message === "string"
  );
}

class RepairParser {
  private index = 0;
  private readonly noted = new Set<string>();

  constructor(private readonly source: string) {}

  get fixes(): string[] {
    return [...this.noted];
  }

  parse(): JsonValue {
    const value = this.parseValue();
    this.skipWhitespace();
    if (this.index < this.source.length) {
      throw this.fail("There is extra text after the JSON value");
    }
    return value;
  }

  private parseValue(): JsonValue {
    this.skipWhitespace();
    const char = this.peek();
    if (char === undefined) {
      throw this.fail("The JSON ended before it was complete");
    }
    if (char === "{") {
      return this.parseObject();
    }
    if (char === "[") {
      return this.parseArray();
    }
    if (char === '"') {
      return this.parseString('"');
    }
    if (char === "'") {
      this.note(SINGLE_QUOTES);
      return this.parseString("'");
    }
    if (char === "-" || isDigit(char)) {
      return this.parseNumber();
    }
    if (char === "t" || char === "f" || char === "n") {
      return this.parseLiteral();
    }
    throw this.fail("This value is not valid JSON");
  }

  private parseObject(): Record<string, JsonValue> {
    this.consume("{");
    const result: Record<string, JsonValue> = {};
    this.skipWhitespace();
    if (this.eat("}")) {
      return result;
    }

    while (this.index < this.source.length) {
      const key = this.parseKey();
      this.skipWhitespace();
      if (!this.eat(":")) {
        throw this.fail("A colon is missing after a property name");
      }
      result[key] = this.parseValue();
      this.skipWhitespace();
      if (this.eat(",")) {
        this.skipWhitespace();
        if (this.eat("}")) {
          this.note(TRAILING_COMMA);
          return result;
        }
        continue;
      }
      if (this.eat("}")) {
        return result;
      }
      if (this.startsKey()) {
        this.note(MISSING_COMMA);
        continue;
      }
      throw this.fail("A comma is missing between properties");
    }

    throw this.fail("The JSON ended before it was complete");
  }

  private parseArray(): JsonValue[] {
    this.consume("[");
    const result: JsonValue[] = [];
    this.skipWhitespace();
    if (this.eat("]")) {
      return result;
    }

    while (this.index < this.source.length) {
      result.push(this.parseValue());
      this.skipWhitespace();
      if (this.eat(",")) {
        this.skipWhitespace();
        if (this.eat("]")) {
          this.note(TRAILING_COMMA);
          return result;
        }
        continue;
      }
      if (this.eat("]")) {
        return result;
      }
      if (this.startsValue()) {
        this.note(MISSING_COMMA);
        continue;
      }
      throw this.fail("A comma is missing between array items");
    }

    throw this.fail("The JSON ended before it was complete");
  }

  private parseKey(): string {
    this.skipWhitespace();
    const char = this.peek();
    if (char === '"') {
      return this.parseString('"');
    }
    if (char === "'") {
      this.note(SINGLE_QUOTES);
      return this.parseString("'");
    }
    if (char !== undefined && isIdentStart(char)) {
      this.note(UNQUOTED_KEY);
      return this.parseIdentifier();
    }
    throw this.fail("A property name is missing or is not in double quotes");
  }

  private parseIdentifier(): string {
    const start = this.index;
    this.index += 1;
    while (this.index < this.source.length) {
      const char = this.source[this.index];
      if (char === undefined || !isIdentPart(char)) {
        break;
      }
      this.index += 1;
    }
    return this.source.slice(start, this.index);
  }

  private parseString(quote: '"' | "'"): string {
    this.consume(quote);
    let value = "";
    while (this.index < this.source.length) {
      const char = this.source[this.index];
      if (char === undefined) {
        break;
      }
      if (char === quote) {
        this.index += 1;
        return value;
      }
      if (char === "\n" || char === "\r") {
        throw this.fail("A string is missing its closing quote");
      }
      if (char === "\\") {
        value += this.parseEscape(quote);
        continue;
      }
      value += char;
      this.index += 1;
    }
    throw this.fail("A string is missing its closing quote");
  }

  private parseEscape(quote: '"' | "'"): string {
    this.consume("\\");
    const char = this.peek();
    if (char === undefined) {
      throw this.fail("A string is missing its closing quote");
    }
    const simple: Record<string, string> = {
      '"': '"',
      "'": "'",
      "\\": "\\",
      "/": "/",
      b: "\b",
      f: "\f",
      n: "\n",
      r: "\r",
      t: "\t",
    };
    if (char === "'" && quote === '"') {
      throw this.fail("A string contains an escape JSON does not allow");
    }
    const mapped = simple[char];
    if (mapped !== undefined) {
      this.index += 1;
      return mapped;
    }
    if (char === "u") {
      const hex = this.source.slice(this.index + 1, this.index + 5);
      if (!/^[0-9a-fA-F]{4}$/.test(hex)) {
        throw this.fail("A string contains an invalid Unicode escape");
      }
      this.index += 5;
      return String.fromCharCode(Number.parseInt(hex, 16));
    }
    throw this.fail("A string contains an escape JSON does not allow");
  }

  private parseNumber(): number {
    const match = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(
      this.source.slice(this.index),
    );
    const text = match?.[0];
    if (!text || text === "-") {
      throw this.fail("This number is not valid JSON");
    }
    this.index += text.length;
    return JSON.parse(text) as number;
  }

  private parseLiteral(): boolean | null {
    if (this.consumeWord("true")) {
      return true;
    }
    if (this.consumeWord("false")) {
      return false;
    }
    if (this.consumeWord("null")) {
      return null;
    }
    throw this.fail("This value is not valid JSON");
  }

  private consumeWord(word: string): boolean {
    if (!this.source.startsWith(word, this.index)) {
      return false;
    }
    const next = this.source[this.index + word.length];
    if (next !== undefined && isIdentPart(next)) {
      return false;
    }
    this.index += word.length;
    return true;
  }

  private startsKey(): boolean {
    const char = this.peek();
    return (
      char === '"' || char === "'" || (char !== undefined && isIdentStart(char))
    );
  }

  private startsValue(): boolean {
    const char = this.peek();
    return (
      char === '"' ||
      char === "'" ||
      char === "{" ||
      char === "[" ||
      char === "-" ||
      char === "t" ||
      char === "f" ||
      char === "n" ||
      (char !== undefined && isDigit(char))
    );
  }

  private skipWhitespace(): void {
    while (this.index < this.source.length) {
      const char = this.source[this.index];
      if (char !== " " && char !== "\n" && char !== "\r" && char !== "\t") {
        break;
      }
      this.index += 1;
    }
  }

  private peek(): string | undefined {
    return this.source[this.index];
  }

  private eat(char: string): boolean {
    if (this.peek() !== char) {
      return false;
    }
    this.index += 1;
    return true;
  }

  private consume(char: string): void {
    if (!this.eat(char)) {
      throw this.fail("This JSON has a syntax error");
    }
  }

  private note(fix: string): void {
    this.noted.add(fix);
  }

  private fail(message: string): JsonParseError {
    const position = Math.min(this.index, this.source.length);
    const location = locationFromPosition(this.source, position);
    return createJsonParseError({
      message,
      ...(location
        ? {
            line: location.line,
            column: location.column,
            position,
            details: `Near line ${location.line}, column ${location.column}.`,
          }
        : {}),
    });
  }
}

function isDigit(char: string): boolean {
  return char >= "0" && char <= "9";
}

function isIdentStart(char: string): boolean {
  return /[A-Za-z_$]/.test(char);
}

function isIdentPart(char: string): boolean {
  return /[A-Za-z0-9_$]/.test(char);
}
