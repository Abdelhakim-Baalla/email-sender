// Promise-based delay utility allows configurable pacing between email sends.
export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
