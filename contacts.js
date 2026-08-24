const { DAVClient } = require("tsdav");

async function fetchContacts(limit = 30, credentials) {
  const username = credentials?.username || process.env.MAIL_USERNAME;
  const password = credentials?.password || process.env.MAIL_PASSWORD;

  if (!username || !password) {
    throw new Error("Missing mail username or app password");
  }

  const client = new DAVClient({
    serverUrl: "https://www.googleapis.com/carddav/v1/principals/" + encodeURIComponent(username) + "/lists/default/",
    credentials: { username, password },
    authMethod: "Basic",
    defaultAccountType: "carddav",
  });

  await client.login();
  const addressBooks = await client.fetchAddressBooks();

  const contacts = [];
  for (const book of addressBooks) {
    const cards = await client.fetchVCards({ addressBook: book });
    for (const card of cards) {
      const data = (card.data || "").replace(/\r\n[ \t]/g, ""); // unfold vCard continuation lines
      // vCard lines may be prefixed with a group label (e.g. "item1.EMAIL;TYPE=PREF:")
      const nameMatch = data.match(/^(?:[\w-]+\.)?FN[^:]*:(.*)$/m);
      const emailMatch = data.match(/^(?:[\w-]+\.)?EMAIL[^:]*:(.*)$/m);
      const telMatch = data.match(/^(?:[\w-]+\.)?TEL[^:]*:(.*)$/m);

      const name = nameMatch ? nameMatch[1].trim() : "";
      const email = emailMatch ? emailMatch[1].trim() : "";

      contacts.push({
        name: name || email || "(no name)",
        email,
        phone: telMatch ? telMatch[1].trim() : "",
      });

      if (contacts.length >= limit) return contacts;
    }
  }

  return contacts;
}

module.exports = { fetchContacts };
