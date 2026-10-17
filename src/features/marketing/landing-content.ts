export interface LandingProblem {
  pain: string;
  fix: string;
}

export const LANDING_PROBLEMS: readonly LandingProblem[] = [
  {
    pain: "Scrolling thousands of lines for one key.",
    fix: "Search keys and values, with every occurrence listed by exact path.",
  },
  {
    pain: "Losing your place in nested arrays.",
    fix: "A tree with paths, node details, and jump-to-match.",
  },
  {
    pain: "Rewriting throwaway jq one-liners.",
    fix: "Simple paths and a JSONPath subset, such as users[].email and $..id.",
  },
  {
    pain: "Pasting sensitive payloads into online formatters.",
    fix: "Everything runs in your browser, including a Web Worker for large files.",
  },
];

export interface LandingStep {
  title: string;
  body: string;
}

export const LANDING_STEPS: readonly LandingStep[] = [
  {
    title: "Bring your JSON",
    body: "Paste, upload a file, or load the sample. Invalid JSON reports a line and column, and Repair fixes common syntax mistakes.",
  },
  {
    title: "Pick a tool",
    body: "One document is shared across every tool, so switching tools never loses your JSON.",
  },
  {
    title: "Inspect and take it with you",
    body: "Copy a value or path, download formatted output, or convert to CSV or YAML.",
  },
];
