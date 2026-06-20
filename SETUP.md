# Hisaab Kitaab — Setup Guide

A free bookkeeping PWA for your dad. No login, shared online database (Google
Sheets), data survives a broken phone, and a daily email reminder for payments
due. Total cost: **Rs 0**.

---

## What you have

| File | What it is |
|------|------------|
| `index.html` | The whole app (boxie UI, EN/Urdu/Roman Urdu) |
| `manifest.json`, `sw.js` | Make it installable + work offline (PWA) |
| `icon-192.png`, `icon-512.png` | App icons |
| `AppsScript-Backend.gs` | The free online database + email reminders |

---

## Part 1 — Set up the database (Google Sheets) — 5 min

1. Go to **sheets.google.com** → create a blank spreadsheet. Name it `Hisaab Kitaab`.
2. Menu: **Extensions → Apps Script**.
3. Delete the sample code. Open `AppsScript-Backend.gs`, copy **all** of it, paste it in.
4. Click **Save** (disk icon).
5. Click **Deploy → New deployment**.
   - Gear icon → **Web app**.
   - **Execute as:** Me.
   - **Who has access:** **Anyone**.  ← important, this is what makes it work with no login.
   - **Deploy** → approve the permissions (it will warn "unsafe", choose
     *Advanced → Go to project → Allow*; it's your own script).
6. Copy the **Web app URL** it gives you (ends in `/exec`).

## Part 2 — Connect the app to the database — 1 min

1. Open `index.html` in any text editor.
2. Find this line near the top of the `<script>`:
   ```js
   const API_URL = "PASTE_YOUR_APPS_SCRIPT_URL_HERE";
   ```
3. Replace the placeholder with your Web app URL from Part 1. Save.

> The app still works fully **without** this step — it just stores data only on
> the phone. Adding the URL is what gives you the shared, broken-phone-proof
> online database.

## Part 3 — Turn on the daily reminders — 1 min

1. Back in Apps Script, in the function dropdown at the top, pick
   **`installDailyTrigger`** → click **Run**. Approve if asked.
2. Done. This sets up **two** daily emails to **you**:
   - **8 AM** — the list of customers whose udhaar is overdue or due within 3 days.
   - **8 PM** — an end-of-day nudge to log any entries you missed and recheck the
     ledger (it also tells you how many entries were recorded today).

**Important — timezone.** Triggers fire in the *script's* timezone, which may not
be Pakistan time. Set it once: in Apps Script click the gear (Project Settings) →
tick **"Show appsscript.json"** → open `appsscript.json` and set
`"timeZone": "Asia/Karachi"`, save, then run `installDailyTrigger` again.

To change the times, edit `.atHour(8)` (morning) and `.atHour(20)` (8 PM) in the
code. To email someone else, replace `Session.getActiveUser().getEmail()` with
`"someone@gmail.com"` in the reminder functions.

### Phone notification at 8 PM (optional, in the app)
Inside the app, open the **Ahmed** section and tap **Daily 8 PM reminder** to turn
it ON. This shows a phone notification at 8 PM (works while the installed app is
active). The 8 PM email above is the always-on backup if the app is closed.

## Part 4 — Host the app on Netlify (free) — 3 min

1. Put `index.html`, `manifest.json`, `sw.js`, `icon-192.png`, `icon-512.png`
   in one folder.
2. Go to **app.netlify.com** → drag-and-drop that folder onto the page.
3. Netlify gives you a link like `https://your-name.netlify.app`.

## Part 5 — Install on your dad's phone

1. Open the Netlify link in **Chrome** (Android) or **Safari** (iPhone).
2. Android: menu **⋮ → Add to Home screen / Install app**.
   iPhone: **Share → Add to Home Screen**.
3. It now opens like a real app, full screen, works offline.

---

## How the requirements are met

- **PWA, native feel** → installable, offline, full-screen. ✓
- **Boxie elder-friendly UI** → big chunky tiles, large text, high contrast,
  one action per tap, thick borders + drop shadows. ✓
- **Online shared database** → one Google Sheet, all data lands there. You can
  open it and see/edit everything any time. ✓
- **Broken phone = no data loss** → entries sync to the Sheet; reinstall the app
  on a new phone and the Sheet still has the history. ✓
- **No login / signup** → "Anyone" access on the web app; the app never asks
  who you are. ✓
- **Self-correcting errors** → both the app and the backend reject bad data with
  a plain-language reason **and an example fix** (e.g. wrong amount → shows what
  you typed and `Try: 1500`). ✓
- **Reminders** → daily email of due/overdue payments (free, via your Google
  account). ✓

## Notes & limits (being honest)

- **SMS reminders aren't free.** Every SMS gateway (Twilio etc.) charges. The
  free, reliable channel is **email**, which is what's wired up. If your dad
  wants a phone nudge, the email lands on his phone's Gmail with a notification.
- **Shared database = everyone shares one ledger.** That's what you asked for.
  If two people use it, they see the same entries. If you ever want them
  separate, add a "shop name" field — easy to do later.
- **Google Sheets free limits** are generous (millions of cells, ~20k script
  calls/day) — far beyond a single shop's bookkeeping.

## Want an APK instead of the web app?

The PWA installs like an app already, so most people stop here. If you truly
need a `.apk` file to share directly, wrap this same folder with **PWABuilder**
(pwabuilder.com — free): paste your Netlify URL, it generates a signed APK.
No Play Store fee needed for direct sharing.
