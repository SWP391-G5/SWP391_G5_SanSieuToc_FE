/**
 * ============================================================
 * FILE: src/pages/Manager/ManagerMarketingImagesPage.jsx
 * ============================================================
 * WHAT IS THIS FILE?
 *   Backward-compatible ROUTE WRAPPER for the Manager-side
 *   "Marketing Images" entry that now points to the unified
 *   Banner/Ads module.
 *
 * RESPONSIBILITIES:
 *   - Keep the original route/component name stable
 *   - Delegate all rendering + logic to BannersAdsPage
 *
 * DATA FLOW:
 *   Route → [THIS FILE] → BannersAdsPage.jsx → managerApi.getBanners()
 *   → /api/manager/banners → MongoDB
 *
 * CHILD COMPONENTS USED:
 *   - src/pages/Manager/banners-ads/BannersAdsPage.jsx
 *
 * API CALLS (via):
 *   - (None directly in this wrapper)
 * ============================================================
 */

// ── Internal: Manager feature page ─────────────────────────
import BannersAdsPage from './banners-ads/BannersAdsPage'; // Orchestrator page for Banner/Ads management

export default function ManagerMarketingImagesPage() {
  // Delegate to the unified module (keeps this wrapper behavior-only).
  return <BannersAdsPage />;
}
