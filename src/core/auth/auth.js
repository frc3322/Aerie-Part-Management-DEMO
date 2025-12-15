// Authentication Utility Functions
// Handles API key storage in cookies with 24-hour expiration

const API_KEY_COOKIE_NAME = "part_mgmt_api_key";
const COOKIE_EXPIRY_HOURS = 24;

/**
 * Set the API key in a cookie with 24-hour expiration
 * @param {string} apiKey - The API key to store
 */
export function setApiKeyCookie(apiKey) {
    const expiryDate = new Date();
    expiryDate.setTime(
        expiryDate.getTime() + COOKIE_EXPIRY_HOURS * 60 * 60 * 1000
    );

    const cookieValue = encodeURIComponent(apiKey);
    const expires = `expires=${expiryDate.toUTCString()}`;
    const path = "path=/";
    const secure = globalThis.location.protocol === "https:" ? "secure" : "";
    const sameSite = "samesite=strict";

    document.cookie = `${API_KEY_COOKIE_NAME}=${cookieValue}; ${expires}; ${path}; ${secure}; ${sameSite}`;
}

/**
 * Get the API key from cookies
 * @returns {string|null} The API key if found and not expired, null otherwise
 */
export function getApiKeyFromCookie() {
    const name = `${API_KEY_COOKIE_NAME}=`;
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookies = decodedCookie.split(";");

    for (let cookieString of cookies) {
        const cookie = cookieString.trim();
        if (cookie.startsWith(name)) {
            return cookie.substring(name.length);
        }
    }

    return null;
}

// Rate limiting for auth checks
let lastAuthCheckTime = 0;
const AUTH_CHECK_COOLDOWN = 2000; // 2 seconds

/**
 * Check authentication status with rate limiting (demo mode - always succeeds)
 * @param {string} apiKey - The API key to validate (ignored in demo mode)
 * @returns {Promise<boolean>} Always returns true in demo mode
 */
export async function checkAuthStatus(apiKey) {
    const now = Date.now();

    // Enforce 2-second cooldown between auth checks
    if (now - lastAuthCheckTime < AUTH_CHECK_COOLDOWN) {
        const remainingTime = AUTH_CHECK_COOLDOWN - (now - lastAuthCheckTime);
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
    }

    lastAuthCheckTime = Date.now();

    // Demo mode - always return successful authentication
    return true;
}
