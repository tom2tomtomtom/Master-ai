/**
 * TypeScript type extensions for NextAuth
 * Extends the default session and JWT types with custom properties
 */

import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  /**
   * Extended session user interface
   * Includes all custom properties added in auth callbacks
   */
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      role: string;
      subscriptionTier: string;
      subscriptionStatus: string;
    };
  }

  /**
   * Extended user interface
   */
  interface User {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
    role?: string;
    subscriptionTier?: string;
    subscriptionStatus?: string;
  }
}

declare module 'next-auth/jwt' {
  /**
   * Extended JWT interface
   */
  interface JWT {
    id?: string;
    role?: string;
    subscriptionTier?: string;
    subscriptionStatus?: string;
  }
}
