/**
 * Clearing the server session.
 *
 * Tokens live in an HttpOnly cookie now, so signing out has to be a request:
 * browser JavaScript cannot delete the cookie itself.
 */

const API_BASE_URL = ((typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) || '').replace(/\/$/, '');

export async function endSession(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
  } catch {
    // Signing out locally must succeed even when the server is unreachable;
    // the cookie expires on its own and the UI is already clearing state.
  }
}
