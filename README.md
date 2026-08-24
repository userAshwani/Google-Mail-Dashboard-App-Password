# App Password Mail Dashboard

A self-hosted Gmail dashboard — Inbox, Compose, and (soon) Contacts/Calendar — powered
entirely by a **Google App Password** over IMAP/SMTP/CalDAV/CardDAV. No OAuth setup,
no Google Cloud project, no API keys. Generate an app password, drop it in `.env`, and run.

![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![Express](https://img.shields.io/badge/Express-4.x-black)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## Suggested repo names

Pick whichever fits your naming style — all optimized for GitHub search/keywords
(`gmail`, `app-password`, `imap`, `smtp`, `dashboard`, `nodejs`):

| Name | Why |
|---|---|
| **`gmail-app-password-dashboard`** | Most descriptive, best for discoverability |
| `gmail-imap-dashboard` | Short, keyword-forward |
| `app-password-mail` | Matches current folder name |
| `gmail-without-oauth` | Highlights the key differentiator (no OAuth needed) |
| `mailbox-lite` | Catchy, product-like, less keyword-stuffed |
| `node-gmail-client` | Framed as a library/client rather than an app |

**Recommended:** `gmail-app-password-dashboard` — clearly states what it is and why
someone would search for it (people googling "gmail app password node.js" or
"gmail dashboard without oauth" will find it).

---

## What this project does

Uses one Google **App Password** (16-character code, generated when 2FA is enabled)
to authenticate over standard mail protocols — no OAuth consent screen, no Google
Cloud Console project, no refresh tokens to manage.

| Feature | Status | Protocol |
|---|---|---|
| **Read inbox** (latest N mails, full body, attachments list) | ✅ Working | IMAP |
| **Sent folder view** | ✅ Working | IMAP |
| **Compose & send mail** | ✅ Working | SMTP |
| **Contacts (read)** | ✅ Working | CardDAV |
| Calendar (read events) | ⚠️ Blocked by Google | CalDAV |
| Search / filter inbox | 🔜 Planned | IMAP |
| Mark read/unread, delete, move | 🔜 Planned | IMAP |
| Real-time new-mail notifications | 🔜 Planned | IMAP `IDLE` |

> **Calendar note:** Google stopped accepting app passwords for new CalDAV
> connections — it now requires a full OAuth 2.0 client for Calendar access, even
> though Mail (IMAP/SMTP) and Contacts (CardDAV) still work fine with an app
> password. The Calendar tab shows this error directly rather than silently
> failing. To enable it, you'd need to add a Google Cloud OAuth client and swap
> `calendar.js` to authenticate with it instead of Basic auth.

Everything above works with the **same single app password** — see
[GMAIL_APP_PASSWORD_GUIDE.md](GMAIL_APP_PASSWORD_GUIDE.md) for the full breakdown of
what an app password can and can't do, and why.

---

## What you get

A dashboard styled like Gmail itself:

- **Sidebar navigation** — Inbox, Compose, and placeholders for Sent/Contacts/Calendar
  (wired up as those modules are added)
- **Inbox** — sender avatar, subject, clean text preview (HTML/CSS/tracking-link noise
  stripped), unread indicator, attachment list. Click any mail to expand full content
  (HTML body rendered safely in a sandboxed iframe, plain-text fallback otherwise)
- **Compose** — real send via SMTP, right from the browser
- Runs entirely on your machine — your credentials never leave your `.env`

---

## Setup

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

## Project structure

```
.
├── server.js       # Express app — routes for /api/mails, /api/send, /api/account
├── mailer.js        # IMAP logic — fetches & parses inbox mail
├── smtp.js           # SMTP logic — sends mail via nodemailer
├── index.js          # CLI: fetch N mails without starting the server
├── public/
│   └── index.html   # Dashboard frontend (sidebar + inbox + compose)
├── .env.example      # Template for credentials — copy to .env
└── .gitignore         # Excludes .env, node_modules, logs
```

## Adding a new module

Each mail-protocol capability (contacts, calendar, sent-folder, etc.) follows the
same pattern:

1. Add protocol logic in its own file (e.g. `contacts.js` using a CardDAV client).
2. Expose it via a route in `server.js` (e.g. `/api/contacts`).
3. Wire it into the matching sidebar item in `public/index.html` (remove `disabled`
   from the nav item, add a `view-contacts` panel with real content).

All of it authenticates with the same `MAIL_USERNAME` / `MAIL_PASSWORD` pair —
no extra credentials needed per module.

---

## Security notes

- Treat the app password like a real password — never commit it, screenshot it, or
  paste it into chat/issues.
- If a real app password is ever exposed, revoke it immediately in
  **Google Account → Security → App Passwords** and generate a new one.
- Use a separate app password per integration/deployment so you can revoke
  individually without breaking everything else.
- This project reads and sends mail on your behalf — only run it with credentials
  you control, and don't deploy it publicly without adding authentication in front
  of it (it currently has none — anyone who can reach the server can read your
  inbox and send mail as you).

---

## License

MIT — do whatever you want with it.
