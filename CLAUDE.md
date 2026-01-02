# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MuslimGuard is a Chrome extension (Manifest V3) providing parental control features for Muslim families. It blocks inappropriate content, manages prayer time pauses, monitors browsing activity, and provides educational Islamic alternatives.

## Core Architecture

### Multi-Layer Blocking System

The extension implements blocking through three complementary mechanisms:

1. **Navigation Interception** (background.js:168-281)
   - Uses `chrome.webNavigation.onBeforeNavigate` listener
   - Checks blocking conditions in priority order: prayer time → whitelist → protection mode → domains → categories → keywords → schedule
   - Redirects blocked URLs to `blocked/blocked.html` with reason parameter
   - Each check adds a log entry via `addBlockedLog()`

2. **Content Detection** (content.js)
   - Injected into all pages at `document_start`
   - Scans page content for suspicious keywords from `config.contentDetectionKeywords`
   - Shows full-page overlay if content matches, blocking interaction
   - Complements navigation blocking for dynamic content

3. **Declarative Net Request** (rules.json)
   - Currently minimal (placeholder example rule)
   - Can be extended for performance-critical blocking

### Authentication & Security

**PIN System** (utils/auth.js):
- 4-6 digit PIN hashed with SHA-256 + random salt
- Salt generated via `crypto.getRandomValues()`
- Hash comparison for verification (no plaintext storage)
- Session tokens valid for 1 hour to reduce PIN prompts
- No recovery backdoor - PIN must be remembered or extension reinstalled

**Critical**: The options page and settings access require PIN verification. This protection prevents users from disabling the extension or modifying block lists.

### Data Storage Architecture

All data stored in `chrome.storage.local` (no backend server):

**Key storage patterns**:
- `DEFAULT_CONFIG` in utils/storage.js defines all default values
- `getConfig()` merges stored values with defaults
- `setValue()` supports both single values and batch updates
- Storage accessed via helper functions only - never direct chrome.storage calls

**Important storage keys**:
- `parentPinHash/parentPinSalt`: Authentication credentials
- `protectionEnabled`: Master toggle for all blocking
- `protectionMode`: 'strict'/'moderate'/'permissive' determines blocking intensity
- `blockedDomains/blockedKeywords/whitelistedSites`: User-customized lists
- `blockSocialMedia/blockMusicStreaming/etc`: Category toggles
- `prayerTimes`: Array of 5 prayer times (HH:MM format)
- `blockedLog`: Array of blocked URLs (max 1000, FIFO)
- `temporaryWhitelist`: Array with `{domain, expiresAt}` for temporary access

### Module System (ES6)

All utility files use ES6 modules:
```javascript
// Export
export async function getConfig() { ... }
export const DEFAULT_CONFIG = { ... }

// Import
import { getConfig, getValue } from './utils/storage.js';
```

**Important**: Always include `.js` extension in import paths. The `manifest.json` specifies `"type": "module"` for background.js to enable ES6 modules.

## Development Commands

**Loading the extension**:
1. Navigate to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked" and select the project directory
4. Extension appears in toolbar

**Reloading after changes**:
- Click the refresh icon in `chrome://extensions/` for the MuslimGuard entry
- Or use an extension like "Extension Reloader"
- **Note**: Changes to content scripts require page refresh in addition to extension reload

**Debugging**:
- Background service worker: `chrome://extensions/` → "Inspect views: service worker"
- Popup: Right-click extension icon → "Inspect"
- Options page: Right-click on options page → "Inspect"
- Content script: Open DevTools on any web page (F12)

**Testing blocking**:
- Ensure protection is enabled (green indicator in popup)
- Visit blocked sites from categories or add test domains to blocked list
- Check `chrome.storage.local` via DevTools: `chrome.storage.local.get(null, console.log)`

## Key Implementation Patterns

### Prayer Time Checking

Prayer times checked every minute via `chrome.alarms` (background.js:62):
- Alarm fires → `checkPrayerTime()` → compares current time ±15min against each prayer time
- Sets global `isPrayerTime` flag
- Navigation listener checks this flag before other blocking rules
- Whitelisted sites (Islamic sites) bypass prayer pause

### Keyword Matching

**URL keyword matching** (utils/lists.js:1513-1531):
- Uses word boundary regex (`\b${keyword}\b`) for whole-word matching
- Prevents false positives (e.g., "assassin" won't match "ass")
- Case-insensitive matching

**Content keyword matching** (content.js:6-42):
- Scans `document.title` + `document.body.innerText`
- Returns first occurrence by position
- Used to show specific detected keyword in block overlay

### Domain Matching with Wildcards

The `matchesDomain()` function (utils/lists.js:1472-1508) supports:
- Exact match: `example.com`
- Subdomain wildcard: `*.example.com` (matches all subdomains)
- TLD wildcard: `example.*` (matches all TLDs)
- Complex patterns: `*.example.*` (converted to regex)
- Default subdomain matching: pattern `example.com` matches `www.example.com`

### Stats & Logging

**Log structure** (utils/storage.js:301-329):
```javascript
{
  url: "https://...",
  reason: "domain" | "keyword" | "category" | "strict_mode" | "prayer_time" | "outside_schedule",
  timestamp: Date.now(),
  date: new Date().toISOString()
}
```

Logs are:
- Limited to 1000 entries (FIFO circular buffer)
- Cleaned automatically after 30 days
- Aggregated into daily stats with top blocked sites
- Stats reset at midnight via alarm

## Critical Files

**background.js**: Service worker orchestrating all blocking logic and periodic tasks

**content.js**: In-page content scanner with overlay blocker

**utils/storage.js**: Single source of truth for config defaults and storage operations

**utils/auth.js**: PIN hashing, verification, session management

**utils/lists.js**:
- Category definitions with domains
- Pre-loaded recommended block list (500+ sites)
- Domain/keyword matching logic
- Islamic sites whitelist

## Common Modification Patterns

**Adding a new category**:
1. Add category to `CATEGORIES` object in utils/lists.js
2. Add `block[CategoryName]` boolean to `DEFAULT_CONFIG` in utils/storage.js
3. Add category check in `getActiveCategories()` in utils/lists.js
4. Update options.html UI with new toggle

**Adding new blocking rule**:
1. Add condition check in background.js `onBeforeNavigate` listener
2. Use consistent pattern: check condition → call `addBlockedLog(url, reason)` → redirect to blocked page
3. Update blocked.js to handle new reason type if needed

**Modifying prayer pause duration**:
- Change `prayerPauseDuration` in DEFAULT_CONFIG (currently 15 minutes)
- Used in background.js:106 as `diff <= config.prayerPauseDuration`

## Important Notes

- This is a Manifest V3 extension - uses service workers, not persistent background pages
- No build process - pure JavaScript, HTML, CSS (Tailwind via CDN)
- French language UI - all user-facing text in French
- Designed for local-only use (no telemetry, no external API calls except Islamic sites)
- The recommended block list includes 500+ domains across 15+ categories
