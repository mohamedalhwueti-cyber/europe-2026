# Europe 2026 — PWA shell v4.0 (public only)

This repository contains **only executable shell code**. It must NOT include any private itinerary, booking references, boarding-pass QR codes, filenames with personal information, or original hotel confirmations.

## Release and phone safety

- Preserve previous GitHub `main` as a backup branch or a ZIP before replacing source files.
- On the *existing app on the phone*, choose Settings → Export full backup. Check the downloaded backup is available. **Do this before importing a revised private plan into an existing installation.**
- Unzip `Europe2026_PUBLIC_APP_v4.zip` and upload only those public files to the root of the existing GitHub Pages repository. Keep the website origin and manifest scope unchanged to retain the browser's local data.
- Ensure GitHub Pages uses the same repo and path, `https://mohamedalhwueti-cyber.github.io/europe-2026/`, and HTTPS.
- In Chrome Android, visit the published page and choose Install app / Add to Home screen. Open Documents → Create or unlock encrypted vault with a passphrase of at least 12 characters.
- Use Documents → **Import complete private trip (ZIP)**. Select `Europe2026_COMPLETE_PRIVATE_IMPORT_v4.zip` stored on the phone. It contains 134 itinerary steps and 246 unique files. The ZIP file is *not encrypted*; it is not safe to upload publicly or share.
- The import verifies every payload against its SHA-256 checksum before writing, encrypts original bytes with AES-256-GCM via PBKDF2-derived vault key, and skips existing IDs without replacing them. It imports the private itinerary after successful document encryption; if interrupted, previously encrypted files remain available and import can be retried.
- Then export the full local backup (contains encrypted files **but an unencrypted itinerary**), verify it was saved in private storage, and only then consider deleting the unencrypted import ZIP from Downloads. Keep a second encrypted backup in a safe place.
- If an older itinerary or documents exist, the importer blocks updates until a full backup has been downloaded during that app session; confirm it physically exists in Downloads.

## Important trust distinctions

The recovered private ZIP includes: 12 previously verified source files (not all boarding passes), 1 receipt-only, 5 hotel replies, 4 historical PDFs, 218 unverified screenshots, 2 rail evidence, 2 hotel evidence and 2 offline references. **Screenshots, historical PDFs and receipts are not equivalent to valid tickets.** There are still 15 required document IDs with no current original linked in the archive, though many bookings are confirmed. Review ticket validity in carriers' original apps. Images and files are grouped in the private vault by category.

## Behavior and limitations

- Local plan/state use this site's origin-bound localStorage (not encrypted). Attachments are encrypted in IndexedDB; filenames/categories remain local metadata. A passphrase key is held only in memory for that session.
- The private ZIP and full-backup JSON are sensitive **before/after import**. A full-backup JSON exposes plan data in plaintext though the stored attachment bytes are encrypted. Keep these outside the public repository and outside shared cloud folders.
- The PWA caches the public shell offline; after import, trip timeline and stored encrypted ticket files can work offline on the same device. Google Maps route duration/distance is displayed *inside Maps* and needs internet. GPS is only queried on user request, never background tracked. Live gate/platform, delay, weather, or boarding validity updates are not connected.
- Exact timezone conversions rely on IANA zones; the 2026-10-25 European switch to winter time is accounted for.
- Do not clear browser site data or switch origin, which can erase local copies.
- Service Worker cache uses a version-specific key. No public server receives imported travel documents.
- Android/OnePlus 15 on-device tests and GitHub Pages publication must be completed independently: passing static/unit tests doesn't prove mobile installation.

## Test status (2026-10-13)

- `node --check`: passed for `app.js` and `archive-import.js`.
- Full 246-file bundle parsed, SHA-256 verified and AES-GCM encrypted in isolated JS test harness, followed by a successful decrypt roundtrip; tampered payload was rejected **before writing**.
- Headless DOM test with isolated, mocked storage displayed 134 steps across 16 dates and the corrected 15:36 Como–Milano train. This is **not** a live end-to-end browser or phone test.
- Local browser navigation was blocked by environment administrative policy. Android device testing remains pending.
- GitHub connector rejected write-related backup branch request with HTTP 403; files in this ZIP have not been published to the repo through that connector.
