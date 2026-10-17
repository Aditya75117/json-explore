export interface LandingFaqItem {
  question: string;
  answer: string;
}

export const LANDING_FAQ: readonly LandingFaqItem[] = [
  {
    question: "What is JSON Explore?",
    answer:
      "JSON Explore is a browser-based JSON explorer. It helps you search keys and values, query nested structures, inspect every occurrence, and jump directly to the matching node — instead of scrolling through thousands of lines.",
  },
  {
    question: "Is JSON Explore free?",
    answer:
      "Yes. There are no accounts or paid plans. Open the workspace and start exploring.",
  },
  {
    question: "Does JSON Explore upload my JSON?",
    answer:
      "Core exploration — parse, search, query, format, validate, and statistics — runs in your browser, including a local Web Worker for large documents. Your JSON does not need to be uploaded to a backend for that workflow.",
  },
  {
    question: "Can I search deeply nested JSON?",
    answer:
      "Yes. Search walks the parsed document for keys, values, or both, including objects nested inside arrays. Results include the exact path so you can jump to the node.",
  },
  {
    question: "Can I find all occurrences of a JSON key?",
    answer:
      "Yes. Searching a key such as id lists every matching path — for example users[0].id and admin.id — with a count of occurrences.",
  },
  {
    question: "Can I query JSON?",
    answer:
      "Yes. You can run simple paths such as users[].profile.email and a JSONPath subset including $, wildcards, and recursive descent like $..id. Filters, slices, and script expressions are not supported.",
  },
  {
    question: "Can I format and minify JSON?",
    answer:
      "Yes. The Format tool pretty-prints or compacts JSON, and invalid JSON reports a location when the parser can derive one.",
  },
  {
    question: "Can I use JSON Explore with large JSON files?",
    answer:
      "Documents under about 1 MB feel near-instant. 1–10 MB use a Worker and stay interactive. 10–50 MB are usable with virtualization. 50–100 MB are best-effort. Files above 100 MB are rejected before parse.",
  },
];
