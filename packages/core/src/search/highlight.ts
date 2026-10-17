export interface SearchHighlightSegment {
  text: string;
  match: boolean;
}

/**
 * Split `text` so the UI can wrap matches in `<mark>` without HTML injection.
 */
export function splitSearchHighlight(
  text: string,
  query: string,
  caseSensitive = false,
): SearchHighlightSegment[] {
  if (!query) {
    return [{ text, match: false }];
  }

  const source = caseSensitive ? text : text.toLowerCase();
  const needle = caseSensitive ? query : query.toLowerCase();
  if (needle.length === 0) {
    return [{ text, match: false }];
  }

  const segments: SearchHighlightSegment[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const index = source.indexOf(needle, cursor);
    if (index === -1) {
      segments.push({ text: text.slice(cursor), match: false });
      break;
    }
    if (index > cursor) {
      segments.push({ text: text.slice(cursor, index), match: false });
    }
    segments.push({
      text: text.slice(index, index + needle.length),
      match: true,
    });
    cursor = index + needle.length;
  }

  return segments.length > 0 ? segments : [{ text, match: false }];
}
