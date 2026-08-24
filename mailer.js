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

async function fetchMailsFromFolder(folder, limit = 5) {
  const client = getClient();
  await client.connect();

  const lock = await client.getMailboxLock(folder);
  const results = [];

  try {
    const total = client.mailbox.exists;
    if (total === 0) return results;

    const start = Math.max(1, total - limit + 1);
    const range = `${start}:${total}`;

    for await (const message of client.fetch(range, {
      envelope: true,
      source: true,
      flags: true,
    })) {
      const parsed = await simpleParser(message.source);
      results.push({
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
      });
    }
  } finally {
    lock.release();
  }

  await client.logout();

  return results.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function fetchLatestMails(limit = 5) {
  return fetchMailsFromFolder("INBOX", limit);
}

function fetchSentMails(limit = 5) {
  return fetchMailsFromFolder("[Gmail]/Sent Mail", limit);
}

module.exports = { fetchLatestMails, fetchSentMails };
