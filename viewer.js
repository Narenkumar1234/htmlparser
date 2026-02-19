const htmlInput = document.getElementById("htmlInput");
const previewFrame = document.getElementById("previewFrame");
const splitRoot = document.getElementById("splitRoot");
const divider = document.getElementById("divider");
const fullPreviewBtn = document.getElementById("fullPreviewBtn");
const showEditorBtn = document.getElementById("showEditorBtn");
const resizeToEndBtn = document.getElementById("resizeToEndBtn");
const copyrightText = document.getElementById("copyrightText");

const STORAGE_KEY = "savedHtmlInput";
const MIN_LEFT_PERCENT = 20;
const MAX_LEFT_PERCENT = 70;
const KNOWN_HTML_TAGS = new Set([
  "a", "article", "aside", "audio", "body", "button", "canvas", "div", "footer", "form",
  "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "html", "iframe", "img", "input",
  "label", "li", "link", "main", "meta", "nav", "ol", "option", "p", "script", "section",
  "select", "span", "style", "svg", "table", "tbody", "td", "textarea", "th", "thead", "tr",
  "title", "ul", "video"
]);

let isDragging = false;
let previousGridTemplate = "45% 8px 1fr";
let pendingPreviewHtml = "";
const previewSessionToken = (globalThis.crypto && crypto.randomUUID)
  ? crypto.randomUUID()
  : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

function initializeSandboxFrame() {
  const sandboxUrl = new URL("sandbox.html", window.location.href);
  sandboxUrl.searchParams.set("token", previewSessionToken);
  previewFrame.src = sandboxUrl.toString();
}

function renderHTML() {
  pendingPreviewHtml = toRenderableDocument(htmlInput.value);
  sendPreviewToSandbox();
}

function isLikelyHtmlDocument(text) {
  if (/<!doctype\s+html|<!--/i.test(text)) {
    return true;
  }

  const matches = text.match(/<\/?([A-Za-z][\w:-]*)(?:\s[^<>]*)?>/g);
  if (!matches || matches.length === 0) {
    return false;
  }

  if (matches.length > 1) {
    return true;
  }

  const singleTagMatch = /<\/?([A-Za-z][\w:-]*)/i.exec(matches[0]);
  if (!singleTagMatch) {
    return false;
  }

  const tagName = singleTagMatch[1].toLowerCase();
  return KNOWN_HTML_TAGS.has(tagName) || tagName.includes("-");
}

function toRenderableDocument(source) {
  const raw = typeof source === "string" ? source : "";
  const trimmed = raw.trim();

  if (!trimmed) {
    return "";
  }

  if (isLikelyHtmlDocument(trimmed)) {
    return raw;
  }

  return `<!doctype html><html><head><meta charset="UTF-8"></head><body><script>\n${raw}\n</script></body></html>`;
}

function sendPreviewToSandbox() {
  if (!previewFrame.contentWindow) {
    return;
  }
  previewFrame.contentWindow.postMessage(
    { type: "render-html", token: previewSessionToken, html: pendingPreviewHtml },
    "*"
  );
}

function setFooterYear() {
  const year = new Date().getFullYear();
  copyrightText.textContent = `© ${year} All rights received.`;
}

function saveHTML() {
  chrome.storage.local.set({ [STORAGE_KEY]: htmlInput.value });
}

function loadHTML() {
  chrome.storage.local.get([STORAGE_KEY], (result) => {
    htmlInput.value = result[STORAGE_KEY] || "";
    renderHTML();
  });
}

function setSplitPercent(leftPercent) {
  const next = Math.max(MIN_LEFT_PERCENT, Math.min(MAX_LEFT_PERCENT, leftPercent));
  previousGridTemplate = `${next}% 8px 1fr`;
  splitRoot.style.gridTemplateColumns = previousGridTemplate;
}

function collapseEditor() {
  splitRoot.classList.add("collapsed");
  splitRoot.style.gridTemplateColumns = "1fr";
  fullPreviewBtn.classList.add("hidden");
  resizeToEndBtn.classList.add("hidden");
  showEditorBtn.classList.remove("hidden");
}

function expandEditor() {
  splitRoot.classList.remove("collapsed");
  splitRoot.style.gridTemplateColumns = previousGridTemplate;
  fullPreviewBtn.classList.remove("hidden");
  resizeToEndBtn.classList.remove("hidden");
  showEditorBtn.classList.add("hidden");
}

function startDragging(event) {
  if (splitRoot.classList.contains("collapsed")) {
    return;
  }
  isDragging = true;
  document.body.style.userSelect = "none";
  event.preventDefault();
}

function onDrag(event) {
  if (!isDragging || window.innerWidth <= 900) {
    return;
  }
  const rect = splitRoot.getBoundingClientRect();
  const offset = event.clientX - rect.left;
  const percent = (offset / rect.width) * 100;
  setSplitPercent(percent);
}

function stopDragging() {
  isDragging = false;
  document.body.style.userSelect = "";
}

htmlInput.addEventListener("input", () => {
  renderHTML();
  saveHTML();
});

fullPreviewBtn.addEventListener("click", collapseEditor);
resizeToEndBtn.addEventListener("click", collapseEditor);
showEditorBtn.addEventListener("click", expandEditor);

divider.addEventListener("mousedown", startDragging);
document.addEventListener("mousemove", onDrag);
document.addEventListener("mouseup", stopDragging);
previewFrame.addEventListener("load", sendPreviewToSandbox);

window.addEventListener("message", (event) => {
  if (event.source !== previewFrame.contentWindow) {
    return;
  }
  if (!event.data || event.data.type !== "sandbox-ready") {
    return;
  }
  if (event.data.token !== previewSessionToken) {
    return;
  }
  sendPreviewToSandbox();
});

initializeSandboxFrame();
setFooterYear();
loadHTML();
