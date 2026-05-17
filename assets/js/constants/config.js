/**
 * Application configuration constants.
 * Contains API credentials, endpoint URLs, and pagination settings.
 *
 * @module constants/config
 */

/**
 * Castia Worker public API base URL.
 * @type {string}
 */
const CASTIA_WORKER_URL = "https://castia-worker.lektodesigns.workers.dev";

/**
 * Returns the deployed project root so shared assets work from nested routes.
 * @type {string}
 */
const SITE_BASE_PATH = (() => {
  try {
    const canonical = document.querySelector('link[rel="canonical"]')?.href;
    const path = new URL(canonical || location.href).pathname;
    const firstSegment = path.split("/").filter(Boolean)[0];
    return firstSegment ? `/${firstSegment}/` : "/";
  } catch (_e) {
    return "/";
  }
})();

function siteAssetPath(path) {
  return SITE_BASE_PATH + String(path || "").replace(/^\/+/, "");
}

/**
 * Number of items shown per page in the table/card views.
 * @type {number}
 */
const PAGE = 50;
