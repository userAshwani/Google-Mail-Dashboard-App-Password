require("dotenv").config();
const path = require("path");
const express = require("express");
const { fetchLatestMails, fetchSentMails } = require("./mailer");
const { sendMail } = require("./smtp");
const { fetchContacts } = require("./contacts");
const { fetchEvents } = require("./calendar");

const app = express();
const PORT = process.env.PORT || 3000;
const DEFAULT_PAGE_SIZE = Number(process.env.MAIL_PAGE_SIZE) || 50;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/account", (req, res) => {
  res.json({ ok: true, email: process.env.MAIL_USERNAME || null });
});

function parsePageParams(req) {
  return {
    page: Math.max(1, Number(req.query.page) || 1),
    pageSize: Number(req.query.pageSize) || DEFAULT_PAGE_SIZE,
    query: req.query.q || "",
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
    await sendMail({ to, subject, text });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get("/api/contacts", async (req, res) => {
  try {
    const contacts = await fetchContacts();
    res.json({ ok: true, contacts });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get("/api/events", async (req, res) => {
  try {
    const events = await fetchEvents();
    res.json({ ok: true, events });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
