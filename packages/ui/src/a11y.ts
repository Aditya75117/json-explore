export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    "a[href]",
    "button:not([disabled])",
    "textarea:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
  ].join(",");

  return [...container.querySelectorAll<HTMLElement>(selector)].filter(
    (element) => !element.hasAttribute("disabled") && !element.hidden,
  );
}
