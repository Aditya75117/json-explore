/**
 * Search engine boundary.
 *
 * React-free and worker-compatible. UI must call `searchJson` / `runJsonSearch`
 * — never traverse JSON inside components.
 */

export {
  createEmptySearchResponse,
  searchJson,
} from "@json-explore/core/search/search-json";
export {
  keyMatches,
  matchesSearchText,
  normalizeSearchText,
  valueMatches,
  valueSearchHaystack,
} from "@json-explore/core/search/match";
export {
  splitSearchHighlight,
  type SearchHighlightSegment,
} from "@json-explore/core/search/highlight";
export type {
  JsonSearchResponse,
  JsonSearchResult,
  SearchMatchType,
  SearchMode,
  SearchOptions,
} from "@json-explore/core/types/search";
