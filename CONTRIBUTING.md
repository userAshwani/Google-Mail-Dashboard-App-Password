# Contributing

Thanks for considering a contribution — this project is open source and pull
requests, issues, and ideas are all welcome.

## Getting started

```bash
git clone https://github.com/userAshwani/Google-Mail-Dashboard-App-Password.git
cd Google-Mail-Dashboard-App-Password
npm install
cp .env.example .env   # add your own Gmail address + app password for local testing
npm start
```

Open http://localhost:3000. See [README.md](README.md) for the full setup and
[GMAIL_APP_PASSWORD_GUIDE.md](GMAIL_APP_PASSWORD_GUIDE.md) for background on what
an app password can/can't do.

## Project layout

- `server.js` — Express routes (`/api/mails`, `/api/sent`, `/api/send`, `/api/contacts`, `/api/account`)
- `mailer.js` — IMAP (inbox + sent, pagination, Gmail-style search)
- `smtp.js` — SMTP send (nodemailer)
- `contacts.js` — CardDAV contacts
- `public/index.html` — the entire frontend (no build step — plain HTML/CSS/JS + Bootstrap 5 via CDN)

## Ways to contribute

- **New modules** — anything else reachable with an app password: Drafts, labels,
  mark read/unread, delete/archive, IMAP `IDLE` for near-real-time updates.
- **Bug fixes** — if something's broken, a minimal repro in the issue helps a lot.
- **UI/UX polish** — the frontend is intentionally plain HTML/CSS/JS; keep it that
  way (no framework/build-step additions) unless discussed first.
- **Docs** — README clarity, comments where genuinely non-obvious, etc.

## Adding a new backend module

Follow the existing pattern in `mailer.js` / `smtp.js` / `contacts.js`:

1. Accept an optional `credentials` param (`{ username, password }`) that falls
   back to `process.env.MAIL_USERNAME` / `MAIL_PASSWORD` when not provided — this
   is what makes both the self-hosted `.env` mode and the public "Profile Setup"
   (bring-your-own-account) mode work through the same code path.
2. Add a route in `server.js` using `credentialsFromRequest(req)` to pull
   per-request credentials.
3. Wire a sidebar item + view into `public/index.html`, using the existing
   `apiFetch()` helper (it automatically attaches session credential headers).

## Code style

- No build step, no frontend framework — plain HTML/CSS/JS in `public/index.html`.
- No unnecessary abstractions — this is a small, readable codebase; keep it that way.
- Match existing formatting (2-space indent, no semicolon-omission changes, etc.)

## Security

- Never commit real credentials, `.env`, or anything resembling an app password.
- If you find a security issue (e.g. a way to leak another user's Profile Setup
  credentials), please open an issue describing it — this is a small hobby/utility
  project, not a security-critical service, but real issues are still worth fixing.

## Submitting a PR

1. Fork the repo, create a branch off `main`.
2. Keep PRs focused — one feature/fix per PR is easier to review.
3. Describe what changed and why in the PR description.
4. If you touched the backend, mention how you tested it (a live Gmail account is
   needed for full IMAP/SMTP/CardDAV testing — a screenshot or curl output is fine).
