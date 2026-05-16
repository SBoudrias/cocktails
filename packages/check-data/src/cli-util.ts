/**
 * Shared CLI utilities for tools
 */

function withContinuation(prefix: string, ...messages: string[]): string {
  const lines = messages.flatMap((m) => m.split('\n'));
  return lines.map((line, i) => (i === 0 ? `${prefix}${line}` : `│ ${line}`)).join('\n');
}

export const logger = {
  header(message: string): void {
    console.log(`╭ ${message}`);
  },

  item(...messages: string[]): void {
    console.log(withContinuation('├ ', ...messages));
  },

  footer(message = 'Done!'): void {
    console.log(`╰ ${message}\n`);
  },

  error(...messages: string[]): void {
    console.error(withContinuation('├ ❌ ', ...messages));
  },

  change(...messages: string[]): void {
    console.log(withContinuation('├ 🔄 ', ...messages));
  },

  success(message: string): void {
    console.log(`✅ ${message}`);
  },

  warn(...messages: string[]): void {
    console.warn(withContinuation('├ ⚠️  ', ...messages));
  },

  failure(message: string): void {
    console.log(`❌ ${message}`);
  },
};
