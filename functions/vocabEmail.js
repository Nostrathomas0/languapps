// vocabEmail.js: turns a session's vocab.md into the reminder email.
// Supports the Markdown used in vocab packets: # / ## headings, ---,
// numbered and bulleted lists (with indented lines under an item),
// **bold**, *italic*, and plain paragraphs. Everything else is escaped,
// so a stray < or & can't break the email.

/**
 * Escapes text for HTML.
 * @param {string} s raw text
 * @return {string} escaped text
 */
function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;"})[c]);
}

/**
 * Applies **bold** and *italic* to already-escaped text.
 * @param {string} s raw text
 * @return {string} HTML
 */
function inline(s) {
  return esc(s)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em style=\"color:#555\">$1</em>");
}

const STYLE = {
  h1: "font-size:22px;margin:0 0 16px;color:#0a58ca",
  h2: "font-size:17px;margin:28px 0 8px;color:#0a58ca;" +
    "border-bottom:1px solid #e3e8ef;padding-bottom:4px",
  p: "margin:0 0 12px",
  hr: "border:none;border-top:1px solid #e3e8ef;margin:24px 0",
  ol: "margin:4px 0 14px;padding-left:22px",
  ul: "margin:4px 0 14px;padding-left:20px",
  li: "margin:0 0 6px",
};

/**
 * Joins lines into HTML: a line that starts lowercase continues the
 * previous sentence (it was just wrapped in the file); other lines
 * keep their own line.
 * @param {string[]} parts raw lines
 * @return {string} HTML
 */
function joinLines(parts) {
  return parts.reduce((acc, line, i) =>
    i === 0 ? inline(line) :
      acc + (/^[a-z(]/.test(line) ? " " : "<br>") + inline(line), "");
}

/**
 * Converts vocab Markdown to email-safe HTML.
 * @param {string} md the vocab.md text
 * @return {string} HTML fragment
 */
function markdownToHtml(md) {
  const lines = String(md).replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let list = null; // {tag, items: [[lines]]}
  let para = [];

  const flushPara = () => {
    if (para.length) out.push(`<p style="${STYLE.p}">${joinLines(para)}</p>`);
    para = [];
  };
  const flushList = () => {
    if (!list) return;
    const items = list.items.map((it) =>
      `<li style="${STYLE.li}">${joinLines(it)}</li>`).join("");
    out.push(`<${list.tag} style="${STYLE[list.tag]}">${items}</${list.tag}>`);
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const ol = line.match(/^\d+\.\s+(.*)$/);
    const ul = line.match(/^[-*]\s+(.*)$/);
    const indented = /^\s{2,}\S/.test(line);

    if (!line.trim()) {
      flushPara();
      continue; // a blank line inside a list keeps the list open
    }
    if (/^#\s+/.test(line)) {
      flushPara(); flushList();
      const text = inline(line.replace(/^#\s+/, ""));
      out.push(`<h1 style="${STYLE.h1}">${text}</h1>`);
    } else if (/^##\s+/.test(line)) {
      flushPara(); flushList();
      const text = inline(line.replace(/^##\s+/, ""));
      out.push(`<h2 style="${STYLE.h2}">${text}</h2>`);
    } else if (/^-{3,}$/.test(line.trim())) {
      flushPara(); flushList();
      out.push(`<hr style="${STYLE.hr}">`);
    } else if (ol || ul) {
      flushPara();
      const tag = ol ? "ol" : "ul";
      if (!list || list.tag !== tag) {
        flushList(); list = {tag, items: []};
      }
      list.items.push([(ol || ul)[1]]);
    } else if (indented && list) {
      list.items[list.items.length - 1].push(line.trim());
    } else {
      flushList();
      para.push(line.trim());
    }
  }
  flushPara();
  flushList();
  return out.join("\n");
}

/**
 * Builds the full reminder email for one session.
 * @param {Object} o details
 * @param {string} o.vocabMarkdown contents of vocab.md
 * @param {string} o.sessionTitle e.g. "Could we build Iron Man's arc reactor?"
 * @param {string} o.when formatted date and time of the class
 * @param {string} [o.appUrl] link to the session's lesson in the app
 * @return {{subject: string, html: string, text: string}} the email
 */
function buildVocabEmail({vocabMarkdown, sessionTitle, when, appUrl}) {
  const body = markdownToHtml(vocabMarkdown);
  const button = appUrl ?
    "<p style=\"margin:28px 0 8px\">" +
      `<a href="${esc(appUrl)}" style="background:#0a58ca;` +
      "color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;" +
      "display:inline-block\">Open the class exercises in the app</a></p>" :
    "";
  const html =
    "<div style=\"background:#f4f6fa;padding:24px 12px\">" +
    "<div style=\"max-width:600px;margin:0 auto;background:#fff;" +
    "border-radius:8px;" +
    "padding:28px 24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;" +
    "line-height:1.5;color:#222\">" +
    "<p style=\"margin:0 0 20px;padding:10px 14px;background:#eef4ff;" +
    `border-radius:6px">📅 <strong>Tomorrow:</strong> ${esc(when)}</p>` +
    body + button +
    "</div></div>";
  const text = `Tomorrow: ${when}\n\n${vocabMarkdown}` +
    (appUrl ? `\n\nClass exercises: ${appUrl}` : "");
  return {subject: `Tomorrow's class: ${sessionTitle}`, html, text};
}

module.exports = {buildVocabEmail, markdownToHtml};
