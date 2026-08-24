require("dotenv").config();
const path = require("path");
const express = require("express");
const { fetchLatestMails, fetchSentMails } = require("./mailer");
const { sendMail } = require("./smtp");
const { fetchContacts } = require("./contacts");

const app = express();
const PORT = process.env.PORT || 3000;
const DEFAULT_PAGE_SIZE = Number(process.env.MAIL_PAGE_SIZE) || 50;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/**
 * Credentials can come from the request (x-mail-username / x-mail-password
 * headers, set by the "Profile Setup" page for temporary/anonymous use) or
 * fall back to the server's own .env — never persisted anywhere.
 */
function credentialsFromRequest(req) {
  const username = req.get("x-mail-username");
  const password = req.get("x-mail-password");
  if (!username || !password) return undefined;
  return { username, password };
}

app.get("/api/account", (req, res) => {
  const creds = credentialsFromRequest(req);
  res.json({ ok: true, email: creds?.username || process.env.MAIL_USERNAME || null });
});

function parsePageParams(req) {
  return {
    page: Math.max(1, Number(req.query.page) || 1),
    pageSize: Number(req.query.pageSize) || DEFAULT_PAGE_SIZE,
    query: req.query.q || "",
    credentials: credentialsFromRequest(req),
  };
}

app.get("/api/mails", async (req, res) => {
  try {
    const result = await fetchLatestMails(parsePageParams(req));
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get("/api/sent", async (req, res) => {
  try {
    const result = await fetchSentMails(parsePageParams(req));
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post("/api/send", async (req, res) => {
  const { to, subject, text } = req.body || {};

  if (!to || !subject || !text) {
    return res.status(400).json({ ok: false, error: "to, subject and text are required" });
  }

  try {
    await sendMail({ to, subject, text, credentials: credentialsFromRequest(req) });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get("/api/contacts", async (req, res) => {
  try {
    const contacts = await fetchContacts(30, credentialsFromRequest(req));
    res.json({ ok: true, contacts });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Export the app for serverless platforms (e.g. Vercel); only listen directly
// when this file is run as the entry point (local `npm start`).
module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}
