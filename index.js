require("dotenv").config();
const { fetchLatestMails } = require("./mailer");

const LIMIT = Number(process.argv[2]) || 5;

fetchLatestMails(LIMIT)
  .then((mails) => {
    console.log(`Fetched ${mails.length} mail(s). Run "npm start" and open http://localhost:3000 to view them.`);
  })
  .catch((err) => {
    console.error("Failed to fetch mail:", err.message);
    process.exit(1);
  });
