/**
 * Prisma Query Sanitizer
 *
 * Provides utilities for sanitizing query arguments and SQL queries
 * to remove sensitive data before logging. This prevents passwords,
 * tokens, and other sensitive information from appearing in logs.
 */

/**
 * List of field names considered sensitive and should be redacted
 */
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'key',
  'creditCard',
  'ssn',
  'socialSecurity',
  'stripeCustomerId',
  'stripeSubscriptionId'
];

/**
 * Sanitize query arguments to remove sensitive data from logs
 *
 * Recursively searches through query arguments and replaces any
 * values for sensitive field names with '[REDACTED]'.
 *
 * @param args - Query arguments to sanitize
 * @returns Sanitized copy of arguments with sensitive data removed
 *
 * @example
 * ```ts
 * const args = { where: { email: 'user@example.com' }, data: { password: 'secret123' } };
 * const sanitized = sanitizeArgs(args);
 * // sanitized.data.password === '[REDACTED]'
 * ```
 */
export function sanitizeArgs(args: any): any {
  if (!args || typeof args !== 'object') return args;

  const sanitized = JSON.parse(JSON.stringify(args));

  const sanitizeObject = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;

    Object.keys(obj).forEach(key => {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field.toLowerCase()))) {
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object') {
        obj[key] = sanitizeObject(obj[key]);
      }
    });

    return obj;
  };

  return sanitizeObject(sanitized);
}

/**
 * Sanitize SQL query string to remove sensitive data
 *
 * Uses regex patterns to find and redact sensitive values in SQL
 * queries before they are logged.
 *
 * @param query - SQL query string to sanitize
 * @returns Sanitized query with sensitive values replaced
 *
 * @example
 * ```ts
 * const query = "UPDATE users SET password = 'secret123' WHERE id = 1";
 * const sanitized = sanitizeQuery(query);
 * // sanitized === "UPDATE users SET password = '[REDACTED]' WHERE id = 1"
 * ```
 */
export function sanitizeQuery(query: string): string {
  // Basic sanitization of SQL queries for logging
  // Remove potential sensitive data patterns
  return query
    .replace(/password\s*=\s*'[^']*'/gi, "password = '[REDACTED]'")
    .replace(/password\s*=\s*"[^"]*"/gi, 'password = "[REDACTED]"')
    .replace(/token\s*=\s*'[^']*'/gi, "token = '[REDACTED]'")
    .replace(/token\s*=\s*"[^"]*"/gi, 'token = "[REDACTED]"')
    .replace(/secret\s*=\s*'[^']*'/gi, "secret = '[REDACTED]'")
    .replace(/secret\s*=\s*"[^"]*"/gi, 'secret = "[REDACTED]"');
}
