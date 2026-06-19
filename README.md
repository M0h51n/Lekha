# Lekha — Your Family Ledger

A simple, free bookkeeping app for everyday shop and family accounts. Big
buttons, three languages (English, Urdu, Roman Urdu), works offline, and keeps
your data safe online so a broken phone never means lost records.

No login. No sign-up. No monthly cost.

---

## Screenshots

| Home | Add an entry | Full ledger |
|------|--------------|-------------|
| ![Home screen](screenshots/01-home.png) | ![Add entry](screenshots/02-add-entry.png) | ![Ledger](screenshots/03-ledger.png) |

Inside, the app is split into three named sections:

- **Osama Khata** — book keeping (Money In, Money Out, Full Ledger)
- **Mohsin Inventory** — stock and sales (Stock/Sale, Udhaar)
- **Ahmed** — your reminder helper, who nudges you about money to collect

---

## What it does

- Record **Money In**, **Money Out**, **Stock / Sales**, and **Udhaar** (money owed to you)
- See a running total of In / Out / Due at a glance
- **Ahmed** emails you every morning about payments that are overdue or due soon
- Everything saves to a private **Google Sheet** you control — open it any time
- Works with no internet; syncs when you're back online
- Dates shown the easy way: **1 Jul 2026**

---

## Install on a phone (easiest — recommended)

Lekha is a PWA, which means it installs straight from the browser like a normal app.

**Android (Chrome)**
1. Open the app link (your Netlify address, e.g. `https://lekha.netlify.app`).
2. Tap the menu **⋮** in the top right.
3. Tap **Install app** (or **Add to Home screen**).
4. Lekha now sits on the home screen and opens full-screen.

**iPhone (Safari)**
1. Open the app link in Safari.
2. Tap the **Share** button (the square with an arrow).
3. Tap **Add to Home Screen**.
4. Tap **Add**. Done.

That's it — no app store, no account.

---

## Set it up for the first time (one-time, ~10 min)

If someone has already deployed Lekha for you, skip this — just install it using
the steps above. If you're the one setting it up, the full walkthrough is in
**[SETUP.md](SETUP.md)**. In short:

1. **Make the database** — create a Google Sheet, paste `AppsScript-Backend.gs`
   into Extensions → Apps Script, deploy it as a Web app with access set to
   **Anyone**. Copy the URL it gives you.
2. **Connect the app** — paste that URL into the one marked line near the top of
   `index.html`.
3. **Turn on Ahmed's reminders** — in Apps Script, run `installDailyTrigger`
   once. Ahmed now emails you each morning at 8am.
4. **Host it free** — drag the app folder onto [Netlify](https://app.netlify.com)
   to get a shareable link.

---

## Want a downloadable APK?

The PWA already installs like a real app, so most people don't need one. If you
specifically want an `.apk` file to share directly:

1. Host the app on Netlify (above).
2. Go to [pwabuilder.com](https://www.pwabuilder.com), paste your Netlify link.
3. Download the generated Android package. No Play Store fee for sharing it directly.

---

## Files in this folder

| File | Purpose |
|------|---------|
| `index.html` | The whole app |
| `manifest.json`, `sw.js` | Make it installable and work offline |
| `icon-192.png`, `icon-512.png` | App icons |
| `AppsScript-Backend.gs` | The free online database + Ahmed's email reminders |
| `SETUP.md` | Full step-by-step setup guide |
| `screenshots/` | The images used in this README |

---

## Good to know

- **Shared ledger:** everyone using the app shares one set of books — that's by
  design. If you ever want separate books per person, a "shop name" field can be
  added.
- **Reminders are by email**, not SMS. SMS gateways all cost money; email is the
  free, reliable channel and still pops up as a notification on the phone.
- **Your data lives in your Google Sheet.** You can view, edit, or back it up
  whenever you like.

Made with care for the family business. 📒
