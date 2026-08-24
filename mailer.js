const { ImapFlow } = require("imapflow");
const { simpleParser } = require("mailparser");

function cleanSnippet(text) {
  return text
    .replace(/<style[\s\S]*?<\/style>/gi, " ") // strip css blocks
    .replace(/<script[\s\S]*?<\/script>/gi, " ") // strip js blocks
    .replace(/<!--[\s\S]*?-->/g, " ") // strip html comments
    .replace(/<[^>]*>/g, " ") // strip any leftover html tags
    .replace(/\[https?:\/\/[^\]]*\]/g, " ") // strip [tracking-link] blocks
    .replace(/https?:\/\/\S+/g, " ") // strip bare urls
    .replace(/&nbsp;|&amp;|&lt;|&gt;|&zwnj;|&#\d+;/g, " ")
    .replace(/[​-‏͏⁠]/g, "") // strip zero-width/invisible chars
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

function sanitizeHtml(html) {
  if (!html) return "";
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "");
}

function getClient() {
  const { MAIL_USERNAME, MAIL_PASSWORD, IMAP_HOST, IMAP_PORT } = process.env;

  if (!MAIL_USERNAME || !MAIL_PASSWORD) {
    throw new Error("Missing MAIL_USERNAME or MAIL_PASSWORD in .env");
  }

  return new ImapFlow({
    host: IMAP_HOST || "imap.gmail.com",
    port: Number(IMAP_PORT) || 993,
    secure: true,
    auth: {
      user: MAIL_USERNAME,
      pass: MAIL_PASSWORD,
    },
    logger: false,
  });
}

async function parseMessage(message) {
  const parsed = await simpleParser(message.source);
  return {
    seq: message.seq,
    uid: message.uid,
    fromName: parsed.from?.value?.[0]?.name || parsed.from?.value?.[0]?.address || "Unknown sender",
    fromAddress: parsed.from?.value?.[0]?.address || "",
    to: parsed.to?.text || "(unknown)",
    subject: parsed.subject || "(no subject)",
    date: parsed.date ? parsed.date.toISOString() : null,
    read: message.flags.has("\\Seen"),
    snippet: cleanSnippet(parsed.text || parsed.html || ""),
    bodyText: parsed.text || "",
    bodyHtml: sanitizeHtml(parsed.html || ""),
    attachments: (parsed.attachments || []).map((a) => a.filename),
  };
}

/**
 * Fetches one page of mail from a folder, newest first — mirrors Gmail's
 * "1-50 of N" pagination. Optionally filters by a search query (IMAP TEXT search).
 */
async function fetchMailPage(folder, { page = 1, pageSize = 50, query = "" } = {}) {
  const client = getClient();
  await client.connect();

  const lock = await client.getMailboxLock(folder);
  const results = [];
  let total = 0;

  try {
    const trimmedQuery = (query || "").trim();

    if (trimmedQuery) {
      const uids = await client.search({ gmailRaw: trimmedQuery }, { uid: true });
      const sortedUids = uids.slice().sort((a, b) => b - a); // newest first
      total = sortedUids.length;

      const start = (page - 1) * pageSize;
      const pageUids = sortedUids.slice(start, start + pageSize);

      if (pageUids.length > 0) {
        for await (const message of client.fetch(pageUids, { envelope: true, source: true, flags: true }, { uid: true })) {
          results.push(await parseMessage(message));
        }
      }
    } else {
      total = client.mailbox.exists;

      if (total > 0) {
        const end = Math.max(1, total - (page - 1) * pageSize);
        const start = Math.max(1, end - pageSize + 1);

        if (start <= total && end >= 1 && start <= end) {
          const range = `${start}:${end}`;
          for await (const message of client.fetch(range, { envelope: true, source: true, flags: true })) {
            results.push(await parseMessage(message));
          }
        }
      }
    }
  } finally {
    lock.release();
  }

  await client.logout();

  return {
    mails: results.sort((a, b) => new Date(b.date) - new Date(a.date)),
    total,
    page,
    pageSize,
  };
}

function fetchLatestMails(options) {
  return fetchMailPage("INBOX", options);
}

function fetchSentMails(options) {
  return fetchMailPage("[Gmail]/Sent Mail", options);
}

module.exports = { fetchLatestMails, fetchSentMails };
