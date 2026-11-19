#!/usr/bin/env node
// Sends a vocab reminder email to yourself, through the same Amazon SES
// account the website uses, so you can see exactly what students get.
//
// Usage (from the functions folder):
//   node scripts/send-test-vocab.js path/to/vocab.md \
//     --title "Could we build Iron Man's arc reactor?" \
//     --when "Friday 20 November 2026 at 18:00 (Paris time)" \
//     [--to someone@example.com] [--app-url https://...]
//
// SMTP login: uses SMTP_USER / SMTP_PASS if set, otherwise reads them with
// `firebase functions:config:get smtp` (needs the Firebase CLI, logged in).

const fs = require("fs");
const {execSync} = require("child_process");
const nodemailer = require("nodemailer");
const {buildVocabEmail} = require("../vocabEmail");

/**
 * Reads --name value pairs from the command line.
 * @param {string[]} argv arguments after the file path
 * @return {Object} parsed options
 */
function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i += 2) {
    opts[argv[i].replace(/^--/, "")] = argv[i + 1];
  }
  return opts;
}

/**
 * Finds the SMTP login.
 * @return {{user: string, pass: string}} credentials
 */
function smtpLogin() {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    return {user: process.env.SMTP_USER, pass: process.env.SMTP_PASS};
  }
  const raw = execSync("firebase functions:config:get smtp", {
    encoding: "utf8", stdio: ["ignore", "pipe", "inherit"],
  });
  const cfg = JSON.parse(raw);
  if (!cfg.user || !cfg.pass) throw new Error("No smtp.user / smtp.pass found");
  return {user: cfg.user, pass: cfg.pass};
}

/**
 * Builds and sends the test email.
 * @return {Promise<void>}
 */
async function main() {
  const [file, ...rest] = process.argv.slice(2);
  if (!file) {
    console.error("Usage: node scripts/send-test-vocab.js vocab.md " +
      "--title \"...\" --when \"...\" [--to you@example.com]");
    process.exit(2);
  }
  const opts = parseArgs(rest);
  const email = buildVocabEmail({
    vocabMarkdown: fs.readFileSync(file, "utf8"),
    sessionTitle: opts.title || "Test class",
    when: opts.when || "Tomorrow (test)",
    appUrl: opts["app-url"],
  });

  const transporter = nodemailer.createTransport({
    host: "email-smtp.us-east-1.amazonaws.com",
    port: 587,
    secure: false,
    auth: smtpLogin(),
  });
  const to = opts.to || "thomas@languapps.com";
  await transporter.sendMail({
    from: "\"Languapps\" <thomas@languapps.com>",
    to,
    subject: `[TEST] ${email.subject}`,
    html: email.html,
    text: email.text,
  });
  console.log(`Sent "[TEST] ${email.subject}" to ${to}`);
}

main().catch((e) => {
  console.error("Failed:", e.message);
  process.exit(1);
});
