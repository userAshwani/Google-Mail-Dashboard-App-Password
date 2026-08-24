# App Password Mail Dashboard

A Gmail-styled inbox — Inbox, Sent, Compose, and Contacts — powered entirely by a
**Google App Password** over IMAP/SMTP/CardDAV. No OAuth setup, no Google Cloud
project, no API keys. Generate an app password, run it, done.

![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![Express](https://img.shields.io/badge/Express-4.x-black)
![License](https://img.shields.io/badge/license-MIT-blue)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)

Built by [Ashwani Tiwari](https://ashwanitiwari.com). Open source — contributions welcome, see [CONTRIBUTING.md](CONTRIBUTING.md).

---

## What this project does

Uses one Google **App Password** (16-character code, generated when 2FA is enabled)
to authenticate over standard mail protocols — no OAuth consent screen, no Google
Cloud Console project, no refresh tokens to manage.

| Feature | Status | Protocol |
|---|---|---|
| **Inbox** — 50-per-page, full body, attachments | ✅ Working | IMAP |
| **Sent folder** — 50-per-page | ✅ Working | IMAP |
| **Search** (Inbox + Sent) — Gmail-style, not plain-text | ✅ Working | IMAP (`X-GM-RAW`) |
| **Compose & send mail** | ✅ Working | SMTP |
| **Contacts (read)** | ✅ Working | CardDAV |
| Calendar | ❌ Removed | — |

> **Why no Calendar:** Google stopped accepting app passwords for new CalDAV
> connections — it now requires a full OAuth 2.0 client. Since Mail (IMAP/SMTP)
> and Contacts (CardDAV) work fine with an app password but Calendar categorically
> doesn't, that module was removed rather than shipped broken.

Everything above works with the **same single app password** — see
[GMAIL_APP_PASSWORD_GUIDE.md](GMAIL_APP_PASSWORD_GUIDE.md) for the full breakdown of
what an app password can and can't do, and why.

---

## What you get

A dashboard styled like Gmail: collapsible sidebar (desktop icon-only collapse,
mobile off-canvas overlay), Inbox/Sent with Gmail-style pagination ("1–50 of N")
and real search, Compose that actually sends, Contacts, an About page, and a
Profile Setup page (see below).

Click any mail to expand it in place — HTML body rendered safely in a sandboxed
iframe, plain-text fallback otherwise.

---

## Two ways to use it

### 1. Self-hosted, one account (`.env`)

Run it for yourself with one fixed Gmail account configured server-side.

### 2. Public deployment, any visitor's account ("Profile Setup")

Deploy it (e.g. to Vercel) with **no** `.env` credentials at all. Each visitor opens
the **Profile Setup** tab and enters their own Gmail address + app password. Those
credentials are stored only in that browser tab's `sessionStorage` — sent straight
to this app's own API on each request via headers, never written to a database or
file on the server, and gone the moment the tab closes or "Clear" is clicked.

The server picks credentials in this order: request headers (`x-mail-username` /
`x-mail-password`, set by Profile Setup) → falls back to `.env` if present.

---

## Setup (self-hosted)

### 1. Generate a Google App Password

1. Enable **2-Step Verification** on your Google account.
2. Go to **Google Account → Security → App Passwords**.
3. Generate one (any name, e.g. "mail-dashboard") — copy the 16-character code.

### 2. Install & configure

```bash
git clone <this-repo-url>
cd <repo-folder>
npm install
cp .env.example .env
```

Edit `.env`:

```env
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_16_char_app_password
```

`.env` is gitignored — your credentials never get committed. Rotate the app password
any time by just updating this file; no code changes needed.

### 3. Run

```bash
npm start
```

Open **http://localhost:3000**.

---

## Deploying to Vercel

This repo ships with a `vercel.json` that runs `server.js` as a serverless
function and serves `public/` alongside it.

```bash
npm install -g vercel   # if you don't have it
vercel
```

- **If you want a fixed account:** set `MAIL_USERNAME` / `MAIL_PASSWORD` as
  Environment Variables in the Vercel project settings.
- **If you want a public, bring-your-own-account instance:** set nothing — leave
  the env vars empty and let every visitor use their own credentials via
  **Profile Setup**.

Note: Vercel's free tier caps serverless function execution time (~10s), which is
generally enough for a 50-mail page fetch but can be tight on a slow IMAP
response — if you hit timeouts, lower `MAIL_PAGE_SIZE`.

---

## Project structure

```
.
├── server.js       # Express app — routes for /api/mails, /api/sent, /api/send, /api/contacts, /api/account
├── mailer.js        # IMAP logic — fetches & parses inbox/sent mail (pagination + search)
├── smtp.js           # SMTP logic — sends mail via nodemailer
├── contacts.js        # CardDAV logic — reads contacts
├── index.js          # CLI: fetch mail without starting the server
├── public/
│   └── index.html   # Dashboard frontend (sidebar + inbox + sent + compose + contacts + profile + about)
├── vercel.json        # Serverless deployment config
├── .env.example      # Template for credentials — copy to .env (self-hosted use only)
└── .gitignore         # Excludes .env, node_modules, logs
```

## Adding a new module

Each mail-protocol capability follows the same pattern:

1. Add protocol logic in its own file, accepting an optional `credentials`
   override (see `mailer.js`/`smtp.js`/`contacts.js` for the pattern) so it works
   for both self-hosted and Profile Setup users.
2. Expose it via a route in `server.js`, reading credentials with
   `credentialsFromRequest(req)`.
3. Wire it into a new sidebar item + view in `public/index.html`, using
   `apiFetch()` (already attaches the session credential headers).

---

## Security notes

- Treat any app password like a real password — never commit it, screenshot it,
  or paste it into chat/issues.
- If a real app password is ever exposed, revoke it immediately in
  **Google Account → Security → App Passwords** and generate a new one.
- Use a separate app password per integration/deployment so you can revoke
  individually without breaking everything else.
- Profile Setup credentials live only in the visitor's own browser tab
  (`sessionStorage`) and are sent only to this app's own `/api/*` routes over
  HTTPS when deployed — never persisted server-side. Still, only use this on a
  deployment you trust, since the server process does see the plaintext
  credentials in memory for the duration of each request.

---

## Contributing

This project is open source and welcomes contributions — new modules (Drafts,
labels, mark read/unread, `IDLE`-based live updates), bug fixes, or UI polish.
See [CONTRIBUTING.md](CONTRIBUTING.md) for setup steps, the code layout, and how
to add a new module using the existing credential pattern. Issues and PRs both
welcome.

---

## License

MIT — do whatever you want with it.
