# Gmail App Password — What It Can and Can't Do

An **App Password** is a 16-character code Google generates for an account that has
**2-Step Verification** enabled. It lets a "less secure" / non-OAuth app authenticate
to a specific Google service **using your regular account credentials format**
(email + app password) instead of your real password.

> ⚠️ Never commit real app passwords or account passwords to a repo, even in `.env`.
> Use `.env` + `.gitignore`, and rotate the password if it was ever exposed.

---

## 1. What Google services accept an App Password

App passwords work for **protocol-level (IMAP/SMTP/POP/CalDAV/CardDAV) sign-in**, not
for Google's web UI or REST APIs. Specifically:

| Protocol | Service | What you can do |
|---|---|---|
| **SMTP** (`smtp.gmail.com:587`) | Gmail sending | Send email programmatically (what you're already doing) |
| **IMAP** (`imap.gmail.com:993`) | Gmail inbox | Read inbox, folders/labels, search, mark read/unread, move, delete, download attachments |
| **POP3** (`pop.gmail.com:995`) | Gmail inbox | Download mail (one-way, limited, mostly legacy) |
| **CalDAV** | Google Calendar | Read/write calendar events via a CalDAV client |
| **CardDAV** | Google Contacts | Read/write contacts via a CardDAV client |

So yes — with the **same app password**, you can also connect via **IMAP** and read
your inbox, not just send mail via SMTP. SMTP and IMAP are separate connections but
authenticate with the same email + app password pair.

---

## 2. Concretely, with your current setup

Using the same app password, in addition to sending mail (SMTP, already working), you can:

- **Read the inbox** — connect via IMAP (`imap.gmail.com:993`, SSL) and:
  - List folders/labels (`INBOX`, `[Gmail]/Sent Mail`, `[Gmail]/Spam`, custom labels)
  - Search/filter messages (by sender, subject, date, unread, has-attachment, etc.)
  - Fetch full message content (headers, body, attachments)
  - Mark messages read/unread, flag/star them
  - Move/copy messages between labels, delete or archive
  - Watch for new mail (polling — IMAP has no native push; see §4)
- **Reply to / forward mail** — read via IMAP, then send the reply via SMTP (two separate connections, same credentials)
- **Sync contacts** — via CardDAV, if you build/use a CardDAV client
- **Sync calendar** — via CalDAV, if you build/use a CalDAV client

### Example: reading inbox with Node.js (`imapflow`)

```js
const { ImapFlow } = require("imapflow");

const client = new ImapFlow({
  host: "imap.gmail.com",
  port: 993,
  secure: true,
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD, // same app password used for SMTP
  },
});

async function readInbox() {
  await client.connect();
  let lock = await client.getMailboxLock("INBOX");
  try {
    for await (let msg of client.fetch({ seen: false }, { envelope: true, source: true })) {
      console.log(msg.envelope.subject, msg.envelope.from);
    }
  } finally {
    lock.release();
  }
  await client.logout();
}

readInbox();
```

### Example: reading inbox with PHP (Laravel-friendly, `php-imap` or native `imap_*`)

```php
$mailbox = imap_open(
    '{imap.gmail.com:993/imap/ssl}INBOX',
    env('MAIL_USERNAME'),
    env('MAIL_PASSWORD') // same app password
);

$emails = imap_search($mailbox, 'UNSEEN');
foreach ($emails as $emailId) {
    $header = imap_headerinfo($mailbox, $emailId);
    echo $header->subject . "\n";
}

imap_close($mailbox);
```

Since your `.env` already looks Laravel-style, you'd typically add:

```env
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_ENCRYPTION=ssl
IMAP_USERNAME=your_email@gmail.com
IMAP_PASSWORD=your_app_password
```

and use a package like `webklex/php-imap` (has a Laravel wrapper) rather than raw `imap_*`.

---

## 3. What an App Password **cannot** do

- ❌ **No Gmail API access** (labels via REST, push notifications, batch operations,
  history API, etc.) — that requires **OAuth 2.0** with a Google Cloud project + scopes.
- ❌ **No access to other Google services** (Drive, Sheets, Photos, YouTube, Admin
  Console, etc.) — app passwords are scoped to mail/contacts/calendar protocols only.
- ❌ **No fine-grained scopes** — it's all-or-nothing for whichever protocol you connect
  with (e.g., IMAP access = full inbox access, no "read-only" restriction at the
  Google auth layer).
- ❌ **No push/webhook notifications** for new mail — IMAP has `IDLE` (near-real-time
  polling-like push) but not a webhook; true push notifications require Gmail API +
  Pub/Sub.
- ❌ **Doesn't work if 2-Step Verification is off** — app passwords require 2FA enabled;
  if 2FA gets disabled, the app password is invalidated.
- ❌ **Not usable for "Sign in with Google" / OAuth-based user login flows.**

---

## 4. IMAP IDLE — near-real-time inbox watching (optional)

If you want to react to new mail quickly without a full Gmail API + Pub/Sub setup,
IMAP supports the `IDLE` command: the connection stays open and the server pushes a
notification when new mail arrives. Most IMAP libraries (`imapflow`, `node-imap`,
`php-imap`) support this. It's not instant push like a webhook, but it's much faster
than polling every N minutes and still only needs the app password.

---

## 5. When to move to OAuth 2.0 / Gmail API instead

Switch away from app passwords if you need:

- Read-only or narrowly scoped access (principle of least privilege)
- Gmail API features: labels management, history API, batch requests, filters, threads
- Real push notifications (Gmail API + Google Cloud Pub/Sub)
- To publish this as a third-party app other users sign into (app passwords are
  tied to *your own* Google account, not delegatable to end users)
- Better long-term support — Google has been steadily nudging developers toward
  OAuth for account security reasons; app passwords still work today but are the
  "legacy/simple" path.

---

## 6. Security notes

- Treat the app password like a real password: keep it only in `.env`
  (gitignored), never in source, never in a public repo, never in chat/screenshots.
- If a real password/app password was ever pasted somewhere it shouldn't be, **revoke
  it in your Google Account → Security → App Passwords** and generate a new one.
- Use **one app password per app/integration** so you can revoke individually without
  breaking everything else.
- App passwords bypass the Google sign-in "suspicious activity" prompts, so protect
  the value itself carefully — anyone with it has full mail send + inbox read access.
