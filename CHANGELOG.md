# Changelog

## TPB_v2 - 2026-03-19

### Blocking engine stability
- Added serialized rule rebuild queueing to reduce race conditions during rapid state changes.
- Added one-time cleanup for legacy DNR rule IDs that previously caused duplicate-ID conflicts.
- Reworked dynamic rule ID ranges and rule budgeting to stay within Chrome dynamic rule limits.
- Improved allowlist precedence so allowed domains bypass standard domain blocking rules as intended.

### Search and thumbnail protection (internal logic, no SafeSearch dependency)
- Added static DNR keyword interceptor rules in [keyword_interceptor_rules.json](/C:/Users/Abdullah/Desktop/CornBlocker/keyword_interceptor_rules.json) to block/redirect explicit search queries.
- Expanded keyword interception to broad search-query patterns (`q`, `query`, `text`, `p`, `wd`, `k`, `keyword`, `search_query`, `searchterm`) across major search engines.
- Added fail-safe search shielding with [search_shield.js](/C:/Users/Abdullah/Desktop/CornBlocker/search_shield.js) and [search_shield.css](/C:/Users/Abdullah/Desktop/CornBlocker/search_shield.css), injected at `document_start` to hide image results by default.

### Domain/path enforcement improvements
- Strengthened fallback blocking to catch full-site and deep-link routes (for example `x.com/home`).
- Added navigation-level enforcement for both full navigations and SPA route updates:
  - `chrome.webNavigation.onCommitted`
  - `chrome.webNavigation.onHistoryStateUpdated`
- Added protected search-engine domain handling to prevent accidental full-domain blocking of core engines (while explicit keyword queries remain blocked).

### Popup and data consistency
- Refined popup messaging/error handling to reduce noisy runtime connection warnings.
- Updated social preset flow so selected social domains are written into `blockedSites` database state.
- Updated blocked domains rendering so selected social domains appear as visible unblockable items (same concept as “Block this page”).
- Kept “Block this page” behavior aligned with blocked database visibility and unblock flow.

### UI and theming checkpoint work included in this branch
- Modernized popup UX layout and settings drawer behavior.
- Added Shoelace light/dark theme assets:
  - [light.css](/C:/Users/Abdullah/Desktop/CornBlocker/vendor/shoelace/themes/light.css)
  - [dark.css](/C:/Users/Abdullah/Desktop/CornBlocker/vendor/shoelace/themes/dark.css)
- Continued Arabic localization coverage improvements in popup copy and labels.

### Key files changed
- [background.js](/C:/Users/Abdullah/Desktop/CornBlocker/background.js)
- [manifest.json](/C:/Users/Abdullah/Desktop/CornBlocker/manifest.json)
- [popup.js](/C:/Users/Abdullah/Desktop/CornBlocker/popup.js)
- [popup.html](/C:/Users/Abdullah/Desktop/CornBlocker/popup.html)
- [popup.css](/C:/Users/Abdullah/Desktop/CornBlocker/popup.css)
- [keyword_interceptor_rules.json](/C:/Users/Abdullah/Desktop/CornBlocker/keyword_interceptor_rules.json)
- [search_shield.js](/C:/Users/Abdullah/Desktop/CornBlocker/search_shield.js)
- [search_shield.css](/C:/Users/Abdullah/Desktop/CornBlocker/search_shield.css)
- [vendor/shoelace/themes/light.css](/C:/Users/Abdullah/Desktop/CornBlocker/vendor/shoelace/themes/light.css)
- [vendor/shoelace/themes/dark.css](/C:/Users/Abdullah/Desktop/CornBlocker/vendor/shoelace/themes/dark.css)
