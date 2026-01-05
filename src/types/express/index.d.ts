/**
 * Centralized Express type declarations
 * This file extends Express Request and other interfaces
 */

import { IVendor } from '@/modules/vendor/schema';

declare global {
  namespace Express {
    /**
     * User interface - populated by authentication middleware
     */
    interface User {
      id: string;
      email: string;
      name?: string;
      role: 'user' | 'admin' | 'vendor';
      iat?: number;
      exp?: number;
      vendor?: IVendor;
    }

    /**
     * Extended Request interface with custom properties
     */
    interface Request {
      /**
       * User object populated by auth middleware
       */
      user?: User;

      /**
       * Cart identifier for both authenticated and guest users
       * Set by cart session middleware
       */
      cartIdentifier?: {
        userId?: string;
        sessionId?: string;
      };

      /**
       * Add other custom request properties here as needed
       */
      // requestId?: string;
      // startTime?: number;
      // clientIp?: string;
    }

    /**
     * You can extend Response interface if needed
     */
    // interface Response {
    //   // Custom response methods or properties
    // }
  }
}

// This export is required to make this a module
// Without it, TypeScript won't treat this as an ambient declaration
export {};
