/**
 * Firebase Auth error code to user-friendly message mapping.
 * Covers all common authentication error codes.
 */

const AUTH_ERROR_MESSAGES = {
  // Sign-in errors
  'auth/user-not-found': 'No account found with this email address.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/invalid-credential': 'Invalid email or password. Please try again.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/user-disabled': 'This account has been disabled. Please contact support.',

  // Sign-up errors
  'auth/email-already-in-use': 'An account with this email already exists. Try signing in instead.',
  'auth/weak-password': 'Password is too weak. Please use at least 6 characters.',
  'auth/operation-not-allowed':
    'This sign-in method is not enabled. Please try a different method.',

  // Rate limiting
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',

  // Google popup errors
  'auth/popup-closed-by-user': 'Sign-in was cancelled. Please try again when ready.',
  'auth/popup-blocked':
    'Sign-in popup was blocked by your browser. Please allow popups and try again.',
  'auth/cancelled-popup-request': 'Sign-in was cancelled.',
  'auth/account-exists-with-different-credential':
    'An account already exists with the same email but a different sign-in method.',

  // Re-authentication
  'auth/requires-recent-login': 'For security, please sign in again before performing this action.',

  // Network errors
  'auth/network-request-failed':
    'Network error. Please check your internet connection and try again.',

  // Password reset
  'auth/expired-action-code': 'This link has expired. Please request a new one.',
  'auth/invalid-action-code': 'This link is invalid. It may have already been used.',

  // General
  'auth/internal-error': 'An unexpected error occurred. Please try again.',
  'auth/timeout': 'The request timed out. Please try again.',
};

/**
 * Extract Firebase error code from an error object.
 * Firebase errors typically have a `code` property like "auth/user-not-found".
 */
function getFirebaseErrorCode(error) {
  if (error?.code) return error.code;

  // Some Firebase errors embed the code in the message
  const match = error?.message?.match(/\(([^)]+)\)/);
  if (match) return match[1];

  return null;
}

/**
 * Convert a Firebase Auth error to a user-friendly message.
 * Falls back to a generic message if the error code is unrecognized.
 *
 * @param {Error} error - The error thrown by a Firebase Auth operation
 * @param {string} [fallback] - Optional custom fallback message
 * @returns {string} A user-friendly error message
 */
export function getAuthErrorMessage(error, fallback) {
  const code = getFirebaseErrorCode(error);

  if (code && AUTH_ERROR_MESSAGES[code]) {
    return AUTH_ERROR_MESSAGES[code];
  }

  return fallback || 'Something went wrong. Please try again.';
}

/**
 * Check if an error is a "requires recent login" error.
 * Useful for triggering re-authentication flows.
 */
export function isReauthRequired(error) {
  return getFirebaseErrorCode(error) === 'auth/requires-recent-login';
}

export default getAuthErrorMessage;
