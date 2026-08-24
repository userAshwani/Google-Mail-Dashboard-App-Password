require("dotenv").config();
const { fetchLatestMails } = require("./mailer");

const pageSize = Number(process.argv[2]) || 50;

fetchLatestMails({ page: 1, pageSize })
  .then(({ mails, total }) => {
    console.log(`Fetched ${mails.length} of ${total} mail(s). Run "npm start" and open http://localhost:3000 to view them.`);
  })
  .catch((err) => {
    console.error("Failed to fetch mail:", err.message);
    process.exit(1);
  });
