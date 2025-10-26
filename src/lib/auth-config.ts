/**
 * Authentication configuration utilities
 * Provides information about which auth providers are available
 */

export interface AuthProvider {
  id: string;
  name: string;
  enabled: boolean;
}

/**
 * Check if Google OAuth is properly configured
 */
export function isGoogleAuthEnabled(): boolean {
  return !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_CLIENT_ID.trim() !== '' &&
    process.env.GOOGLE_CLIENT_SECRET.trim() !== ''
  );
}

/**
 * Check if GitHub OAuth is properly configured
 * @deprecated GitHub auth removed - beginners prefer Google/email
 */
export function isGitHubAuthEnabled(): boolean {
  return false;
}

/**
 * Get all available OAuth providers
 */
export function getAvailableOAuthProviders(): AuthProvider[] {
  return [
    {
      id: 'google',
      name: 'Google',
      enabled: isGoogleAuthEnabled(),
    },
  ].filter(provider => provider.enabled);
}

/**
 * Check if any OAuth providers are available
 */
export function hasOAuthProviders(): boolean {
  return getAvailableOAuthProviders().length > 0;
}