/**
 * Application configuration constants.
 * Contains API credentials, endpoint URLs, and pagination settings.
 *
 * @module constants/config
 */

/**
 * Supabase project REST API base URL
 * @type {string}
 */
const SB_URL = "https://opxorasggouuzzsvzlvm.supabase.co";

/**
 * Supabase anonymous (publishable) API key.
 * This key is safe to expose in client-side code — it's scoped to
 * whatever Row Level Security policies are configured on the project.
 * @type {string}
 */
const SB_KEY = "sb_publishable_PjpxLcSpHeOt2MCgl3fUUw_RUFOAb5w";

/**
 * Number of items shown per page in the table/card views.
 * @type {number}
 */
const PAGE = 50;
