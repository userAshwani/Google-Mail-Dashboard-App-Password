const nodemailer = require("nodemailer");

function getTransport(credentials) {
  const username = credentials?.username || process.env.MAIL_USERNAME;
  const password = credentials?.password || process.env.MAIL_PASSWORD;

  if (!username || !password) {
    throw new Error("Missing mail username or app password");
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { user: username, pass: password },
  });
}

async function sendMail({ to, subject, text, credentials }) {
  const transport = getTransport(credentials);
  return transport.sendMail({
    from: credentials?.username || process.env.MAIL_USERNAME,
    to,
    subject,
    text,
  });
}

module.exports = { sendMail };
