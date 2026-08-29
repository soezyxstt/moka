// lib/auth.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers'; // Specific for App Router Server Components/Route Handlers

/**
 * Checks if the authentication cookie is present and valid for App Router.
 * This is meant to be called within a server environment (Route Handlers, Server Components, Server Actions).
 *
 * @returns boolean indicating if access is granted.
 */
export async function checkProtectedPageAccess(): Promise<boolean> {
  const cookieName = process.env.PASSWORD_COOKIE_NAME || 'hasPageAccess';
  const cookieStore = await cookies(); // Access cookies directly in server environment
  return cookieStore.get(cookieName)?.value === 'true';
}

/**
 * Higher-order function to protect App Router Route Handlers.
 * It ensures the page access cookie is present before allowing the handler to execute.
 *
 * @param handler The original async Route Handler function (e.g., GET, POST, PUT, DELETE).
 * @returns A new async function that wraps the original handler with an access check.
 */
export function protectedRouteHandler<
  T extends (...args: unknown[]) => Promise<NextResponse | Response>
>(handler: T): T {
  const wrapper = async (...args: unknown[]) => {
    // In App Router Route Handlers, the first argument is typically NextRequest
    // and subsequent arguments are for dynamic routes (params).
    // const req = args[0] as NextRequest;

    if (!checkProtectedPageAccess()) {
      // Call the access check
      console.warn(
        'Access Denied: Attempted to access protected route without valid cookie.'
      );
      return new NextResponse(
        JSON.stringify({ message: 'Access Denied: Protected Action' }),
        {
          status: 403, // Forbidden
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // If access is granted, execute the original handler
    return await handler(...args);
  };
  return wrapper as T; // Cast back to original type
}

// Optional: A helper for protecting Server Actions (if you use them)
export function protectedServerAction<
  T extends (...args: unknown[]) => Promise<unknown>
>(action: T): T {
  const wrapper = async (...args: unknown[]) => {
    if (!checkProtectedPageAccess()) {
      console.warn(
        'Access Denied: Attempted to call protected server action without valid cookie.'
      );
      // For server actions, you can throw an error or return a specific error object
      throw new Error('Access Denied: Protected Server Action');
    }
    return await action(...args);
  };
  return wrapper as T;
}
