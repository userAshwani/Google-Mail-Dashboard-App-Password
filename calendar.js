const { DAVClient } = require("tsdav");

async function fetchEvents(limit = 20) {
  const { MAIL_USERNAME, MAIL_PASSWORD } = process.env;

  if (!MAIL_USERNAME || !MAIL_PASSWORD) {
    throw new Error("Missing MAIL_USERNAME or MAIL_PASSWORD in .env");
  }

  const client = new DAVClient({
    serverUrl: "https://apidata.googleusercontent.com/caldav/v2/" + encodeURIComponent(MAIL_USERNAME) + "/events",
    credentials: { username: MAIL_USERNAME, password: MAIL_PASSWORD },
    authMethod: "Basic",
    defaultAccountType: "caldav",
  });

  try {
    await client.login();
  } catch (err) {
    throw new Error(
      "Google Calendar no longer accepts an app password over CalDAV for new connections — it requires OAuth 2.0. " +
      "This module needs a Google Cloud OAuth client to work; see README. (" + err.message + ")"
    );
  }

  const calendars = await client.fetchCalendars();

  const events = [];
  for (const cal of calendars) {
    const objects = await client.fetchCalendarObjects({ calendar: cal });
    for (const obj of objects) {
      const data = obj.data || "";
      const summaryMatch = data.match(/SUMMARY:(.*)/);
      const startMatch = data.match(/DTSTART[^:]*:(.*)/);
      const endMatch = data.match(/DTEND[^:]*:(.*)/);

      events.push({
        summary: summaryMatch ? summaryMatch[1].trim() : "(no title)",
        start: startMatch ? startMatch[1].trim() : "",
        end: endMatch ? endMatch[1].trim() : "",
      });

      if (events.length >= limit) return events;
    }
  }

  return events;
}

module.exports = { fetchEvents };
