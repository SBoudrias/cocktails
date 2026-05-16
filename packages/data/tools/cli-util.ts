/**
 * Shared CLI utilities for tools
 */

export const logger = {
  /**
   * Log a section header
   */
  header(message: string): void {
    console.log(`╭ ${message}`);
  },

  /**
   * Log a section item
   */
  item(message: string): void {
    console.log(`├ ${message}`);
  },

  /**
   * Log a section footer
   */
  footer(message = 'Done!'): void {
    console.log(`╰ ${message}\n`);
  },

  /**
   * Log an error message
   */
  error(message: string): void {
    console.error(`├ ❌ ${message}`);
  },

  /**
   * Log a change message
   */
  change(message: string): void {
    console.log(`├ 🔄 ${message}`);
  },

  /**
   * Log a success message
   */
  success(message: string): void {
    console.log(`✅ ${message}`);
  },

  /**
   * Log a warning message (visible but does not fail the check)
   */
  warn(message: string): void {
    console.warn(`├ ⚠️  ${message}`);
  },

  /**
   * Log a failure message
   */
  failure(message: string): void {
    console.log(`❌ ${message}`);
  },
};
