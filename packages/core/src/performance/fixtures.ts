import { buildJsonDocument } from "@json-explore/core/json/document";
import { byteLengthOfString } from "@json-explore/core/performance/bytes";
import type { JsonDocument, JsonValue } from "@json-explore/core/types/json";

export interface PerformanceFixture {
  value: JsonValue;
  json: string;
  document: JsonDocument;
  byteLength: number;
}

export interface PerformanceFixtureOptions {
  records: number;
  /** Extra nested objects per record for depth / key diversity. */
  nestDepth?: number;
}

function nestedProfile(depth: number, seed: number): JsonValue {
  if (depth <= 0) {
    return {
      city: seed % 7 === 0 ? "Delhi" : "Austin",
      zip: 10000 + (seed % 900),
    };
  }

  return {
    level: depth,
    next: nestedProfile(depth - 1, seed),
  };
}

/**
 * Realistic-ish document: repeated keys, mixed primitives, nested objects.
 * Generated at runtime — fixtures are not checked into git as megabyte files.
 */
export function createPerformanceFixture(
  options: PerformanceFixtureOptions,
): PerformanceFixture {
  const nestDepth = options.nestDepth ?? 2;
  const statuses = ["active", "pending", "completed"] as const;

  const value: JsonValue = {
    generatedAt: "2026-01-01T00:00:00.000Z",
    metadata: {
      source: "json-explore-fixture",
      records: options.records,
    },
    users: Array.from({ length: options.records }, (_, index) => ({
      id: index,
      name: `user-${String(index)}`,
      email: `user-${String(index)}@example.com`,
      status: statuses[index % statuses.length] ?? "active",
      active: index % 4 !== 0,
      score: index % 11 === 0 ? null : index * 1.5,
      tags: ["alpha", "beta", String(index % 9)],
      profile: nestedProfile(nestDepth, index),
    })),
  };

  const json = JSON.stringify(value);
  const byteLength = byteLengthOfString(json);
  const document = buildJsonDocument(value, { sizeInBytes: byteLength });

  return { value, json, document, byteLength };
}

export function fixtureForTargetBytes(
  targetBytes: number,
  nestDepth = 1,
): PerformanceFixture {
  const sample = createPerformanceFixture({ records: 20, nestDepth });
  const perRecord = Math.max(120, Math.floor(sample.byteLength / 20));
  const records = Math.max(20, Math.ceil(targetBytes / perRecord));
  return createPerformanceFixture({ records, nestDepth });
}
