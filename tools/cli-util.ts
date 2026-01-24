/**
 * Shared CLI utilities for tools
 */

/**
 * Log a section header
 */
export function logHeader(message: string): void {
  console.log(`╭ ${message}`);
}

/**
 * Log a section item
 */
export function logItem(message: string): void {
  console.log(`├ ${message}`);
}

/**
 * Log a section footer
 */
export function logFooter(message = 'Done!'): void {
  console.log(`╰ ${message}\n`);
}

/**
 * Log an error message
 */
export function logError(message: string): void {
  console.error(`├ ❌ ${message}`);
}

/**
 * Log a change message
 */
export function logChange(message: string): void {
  console.log(`├ 🔄 ${message}`);
}

/**
 * Log a success message
 */
export function logSuccess(message: string): void {
  console.log(`✅ ${message}`);
}
