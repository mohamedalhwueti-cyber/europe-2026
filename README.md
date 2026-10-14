# Europe 2026 — PWA v5.0 (PUBLIC APP SHELL ONLY)

This public repository contains the application code ONLY. **Never upload any user's travel plan, original boarding pass, train QR, reservation PDF, private ZIP, full JSON backup, booking reference, PIN or personal information.**

## Release v5.0

- Preserves the existing GitHub Pages scope and IndexedDB/localStorage keys, so app data and AES-256-GCM vault remain local on the same phone and same origin.
- Adds local readiness dashboard with 134 private-plan step compatibility, due/future task separation and confirmation before marking a task complete.
- Distinguishes boarding originals, operator-issued dynamic QR codes, non-boarding receipts, historical screenshots and optional unpurchased activities.
- Exports selected critical travel appointments as a local `.ics` calendar. The user MUST import that ICS into a compatible calendar app; download alone does not create any reminders. The ICS is unencrypted and may sync with a cloud calendar.
- Includes clear backup warning: document bytes in the exported JSON are AES-GCM ciphertext, but itinerary, task state, metadata and dates in JSON are NOT encrypted.
- Corrects PWA icon manifest to use existing root `icon-192.png` and `icon-512.png` files. Serviceworker shell cache bumped to v5.0.

## Update a running installation

1. Export the complete current JSON backup in the installed PWA, confirm it exists and save it privately.
2. Create a GitHub branch named `backup-before-v50` from the existing `main` before changing public files.
3. Replace ONLY these six public UTF-8 files on `main`: `app.js`, `index.html`, `style.css`, `sw.js`, `manifest.webmanifest`, `README.md`. Leave `archive-import.js` and both icon files in place.
4. Wait for GitHub Pages deployment success. Open the exact existing Pages URL; refresh when online. Do NOT uninstall the installed PWA and do NOT clear browser storage.
5. In Documents, unlock the private vault; if new private data needs import, use `Europe2026_FINAL_PRIVATE_ALL_IN_ONE_v5_0.zip` downloaded privately. It uses ZIP_STORED, verifies SHA-256 and skips existing entry IDs. Export a backup in the SAME session before any import into a populated vault. Existing manually saved originals should never be replaced automatically.
6. On phone, check Now, Documents, Pending, Calendar export, an encrypted original document, and offline reopening with airplane mode.

## Important limits

No web application can guarantee vendor timetables, hotel responses, weather, check-in procedures, rail platforms or private booking seats for future days. The remaining vendor-dependent procedures are deliberately marked pending until their actual confirmation. The PWA does not track location in the background or deliver push notifications after closure; external monitored automations and imported calendar reminders are separate.
