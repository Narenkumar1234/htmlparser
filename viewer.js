const editorInput = document.getElementById("editorInput");
const previewFrame = document.getElementById("previewFrame");
const splitRoot = document.getElementById("splitRoot");
const divider = document.getElementById("divider");
const fullPreviewBtn = document.getElementById("fullPreviewBtn");
const showEditorBtn = document.getElementById("showEditorBtn");
const resizeToEndBtn = document.getElementById("resizeToEndBtn");
const copyrightText = document.getElementById("copyrightText");

const htmlModeBtn = document.getElementById("htmlModeBtn");
const mdModeBtn = document.getElementById("mdModeBtn");

const STORAGE_MODE_KEY = "viewerEditorMode";
const STORAGE_HTML_KEY = "savedHtmlInput";
const STORAGE_MD_KEY = "savedMdInput";

const MIN_LEFT_PERCENT = 20;
const MAX_LEFT_PERCENT = 70;

const KNOWN_HTML_TAGS = new Set([
  "a", "article", "aside", "audio", "body", "button", "canvas", "div", "footer", "form",
  "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "html", "iframe", "img", "input",
  "label", "li", "link", "main", "meta", "nav", "ol", "option", "p", "script", "section",
  "select", "span", "style", "svg", "table", "tbody", "td", "textarea", "th", "thead", "tr",
  "title", "ul", "video"
]);

const hasChromeStorage = typeof chrome !== "undefined" && chrome.storage && chrome.storage.local;

let editorMode = "html"; // "html" or "markdown"
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

function renderPreview() {
  pendingPreviewHtml = toRenderableDocument(editorInput.value, editorMode);
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

function toRenderableDocument(source, mode) {
  const raw = typeof source === "string" ? source : "";
  const trimmed = raw.trim();

  if (!trimmed) {
    return "";
  }

  const scrollScript = `
<script>
  window.addEventListener("message", (event) => {
    if (event.data && event.data.type === "scroll-to-percent") {
      const docEl = document.documentElement;
      const maxScroll = docEl.scrollHeight - window.innerHeight;
      window.scrollTo({
        top: event.data.percent * maxScroll,
        behavior: "auto"
      });
    }
  });
</script>
`;

  if (mode === "markdown") {
    let parsedHtml = "";
    try {
      parsedHtml = marked.parse(raw);
    } catch (err) {
      console.error("Markdown parsing failed:", err);
      parsedHtml = `<div style="color: red; padding: 20px;">Markdown parsing error: ${err.message}</div>`;
    }

    return `<!doctype html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    :root {
      --color-bg: #ffffff;
      --color-text: #1f2937;
      --color-primary: #2563eb;
      --color-border: #e5e7eb;
      --color-code-bg: #f3f4f6;
      --color-quote-border: #d1d5db;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: var(--color-text);
      background-color: var(--color-bg);
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem 1.5rem;
    }
    
    h1, h2, h3, h4, h5, h6 {
      font-weight: 700;
      line-height: 1.25;
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      color: #111827;
    }
    
    h1 { font-size: 2.25rem; border-bottom: 1px solid var(--color-border); padding-bottom: 0.3em; }
    h2 { font-size: 1.75rem; border-bottom: 1px solid var(--color-border); padding-bottom: 0.3em; }
    h3 { font-size: 1.5rem; }
    h4 { font-size: 1.25rem; }
    
    p { margin-top: 0; margin-bottom: 1.25rem; }
    
    a { color: var(--color-primary); text-decoration: none; font-weight: 500; }
    a:hover { text-decoration: underline; }
    
    img { max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    
    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.875em;
      background-color: var(--color-code-bg);
      padding: 0.2em 0.4em;
      border-radius: 6px;
      color: #eb5757;
    }
    
    pre {
      background-color: var(--color-code-bg);
      padding: 1.25rem;
      overflow-x: auto;
      border-radius: 8px;
      border: 1px solid var(--color-border);
      margin-bottom: 1.25rem;
    }
    
    pre code {
      background-color: transparent;
      padding: 0;
      border-radius: 0;
      color: inherit;
      font-size: 0.9em;
    }
    
    blockquote {
      margin: 0 0 1.25rem 0;
      padding: 0.5rem 0 0.5rem 1rem;
      border-left: 4px solid var(--color-quote-border);
      color: #4b5563;
      font-style: italic;
      background-color: #f9fafb;
      border-radius: 0 8px 8px 0;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1.25rem;
      font-size: 0.95rem;
    }
    
    th, td {
      padding: 0.75rem 1rem;
      border: 1px solid var(--color-border);
      text-align: left;
    }
    
    th {
      background-color: #f9fafb;
      font-weight: 600;
    }
    
    tr:nth-child(even) {
      background-color: #f9fafb;
    }
    
    ul, ol {
      padding-left: 1.5rem;
      margin-bottom: 1.25rem;
    }
    
    li {
      margin-bottom: 0.25rem;
    }
    
    hr {
      height: 1px;
      border: none;
      background-color: var(--color-border);
      margin: 2rem 0;
    }
  </style>
</head>
<body>
  ${parsedHtml}
  ${scrollScript}
</body>
</html>`;
  }

  // HTML Mode
  if (isLikelyHtmlDocument(trimmed)) {
    if (raw.includes("</body>")) {
      return raw.replace("</body>", `${scrollScript}</body>`);
    } else {
      return raw + scrollScript;
    }
  }

  return `<!doctype html><html><head><meta charset="UTF-8"></head><body><script>\n${raw}\n</script>${scrollScript}</body></html>`;
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

function saveState() {
  const currentVal = editorInput.value;
  const storageKey = editorMode === "markdown" ? STORAGE_MD_KEY : STORAGE_HTML_KEY;
  
  if (hasChromeStorage) {
    chrome.storage.local.set({
      [storageKey]: currentVal,
      [STORAGE_MODE_KEY]: editorMode
    });
  } else {
    localStorage.setItem(storageKey, currentVal);
    localStorage.setItem(STORAGE_MODE_KEY, editorMode);
  }
}

function handleStateLoaded(result) {
  // Check if there's a temporary imported Markdown file
  if (result.tempImportedMd) {
    editorMode = "markdown";
    editorInput.value = result.tempImportedMd;
    
    // Update tabs UI
    htmlModeBtn.classList.remove("active");
    mdModeBtn.classList.add("active");
    editorInput.placeholder = "# Markdown Input\n\nStart writing markdown...";
    
    // Save it and clear the temp key
    if (hasChromeStorage) {
      chrome.storage.local.set({ 
        [STORAGE_MD_KEY]: result.tempImportedMd,
        [STORAGE_MODE_KEY]: "markdown" 
      });
      chrome.storage.local.remove("tempImportedMd");
    } else {
      localStorage.setItem(STORAGE_MD_KEY, result.tempImportedMd);
      localStorage.setItem(STORAGE_MODE_KEY, "markdown");
      localStorage.removeItem("tempImportedMd");
    }
    
    renderPreview();
    return;
  }

  // Default load path
  editorMode = result[STORAGE_MODE_KEY] || "html";
  
  if (editorMode === "markdown") {
    htmlModeBtn.classList.remove("active");
    mdModeBtn.classList.add("active");
    editorInput.value = result[STORAGE_MD_KEY] || "";
    editorInput.placeholder = "# Markdown Input\n\nStart writing markdown...";
  } else {
    htmlModeBtn.classList.add("active");
    mdModeBtn.classList.remove("active");
    editorInput.value = result[STORAGE_HTML_KEY] || "";
    editorInput.placeholder = "<h1>Hello</h1>";
  }
  
  renderPreview();
}

function loadState() {
  if (hasChromeStorage) {
    chrome.storage.local.get(["tempImportedMd", STORAGE_MODE_KEY, STORAGE_HTML_KEY, STORAGE_MD_KEY], (result) => {
      handleStateLoaded(result);
    });
  } else {
    const result = {
      tempImportedMd: localStorage.getItem("tempImportedMd"),
      [STORAGE_MODE_KEY]: localStorage.getItem(STORAGE_MODE_KEY),
      [STORAGE_HTML_KEY]: localStorage.getItem(STORAGE_HTML_KEY),
      [STORAGE_MD_KEY]: localStorage.getItem(STORAGE_MD_KEY)
    };
    handleStateLoaded(result);
  }
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
  previewFrame.style.pointerEvents = "none"; // Disable iframe mouse events during resize
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
  if (isDragging) {
    isDragging = false;
    document.body.style.userSelect = "";
    previewFrame.style.pointerEvents = ""; // Restore iframe mouse events after resize
  }
}

function updateModeUI(newMode) {
  if (newMode === "markdown") {
    htmlModeBtn.classList.remove("active");
    mdModeBtn.classList.add("active");
    editorInput.placeholder = "# Markdown Input\n\nStart writing markdown...";
  } else {
    htmlModeBtn.classList.add("active");
    mdModeBtn.classList.remove("active");
    editorInput.placeholder = "<h1>Hello</h1>";
  }
  renderPreview();
}

function switchMode(newMode) {
  if (editorMode === newMode) return;
  
  // Save current before switching
  const prevKey = editorMode === "markdown" ? STORAGE_MD_KEY : STORAGE_HTML_KEY;
  if (hasChromeStorage) {
    chrome.storage.local.set({ [prevKey]: editorInput.value });
  } else {
    localStorage.setItem(prevKey, editorInput.value);
  }
  
  editorMode = newMode;
  if (hasChromeStorage) {
    chrome.storage.local.set({ [STORAGE_MODE_KEY]: newMode });
  } else {
    localStorage.setItem(STORAGE_MODE_KEY, newMode);
  }
  
  // Update UI and load content
  const targetKey = newMode === "markdown" ? STORAGE_MD_KEY : STORAGE_HTML_KEY;
  if (hasChromeStorage) {
    chrome.storage.local.get([targetKey], (result) => {
      editorInput.value = result[targetKey] || "";
      updateModeUI(newMode);
    });
  } else {
    const val = localStorage.getItem(targetKey) || "";
    editorInput.value = val;
    updateModeUI(newMode);
  }
}

// Drag and drop handler
editorInput.addEventListener("dragover", (event) => {
  event.preventDefault();
  editorInput.style.borderColor = "#2563eb"; // highlight border on hover
});

editorInput.addEventListener("dragleave", () => {
  editorInput.style.borderColor = ""; // reset border
});

editorInput.addEventListener("drop", (event) => {
  event.preventDefault();
  editorInput.style.borderColor = "";
  
  const file = event.dataTransfer.files[0];
  if (!file) return;

  const fileName = file.name.toLowerCase();
  const isMarkdown = fileName.endsWith(".md") || fileName.endsWith(".markdown");
  const isHtml = fileName.endsWith(".html") || fileName.endsWith(".htm");

  if (!isMarkdown && !isHtml) {
    alert("Unsupported file type! Please drag and drop a .html or .md file.");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    
    if (isMarkdown) {
      switchMode("markdown");
      editorInput.value = text;
      if (hasChromeStorage) {
        chrome.storage.local.set({ [STORAGE_MD_KEY]: text });
      } else {
        localStorage.setItem(STORAGE_MD_KEY, text);
      }
    } else if (isHtml) {
      switchMode("html");
      editorInput.value = text;
      if (hasChromeStorage) {
        chrome.storage.local.set({ [STORAGE_HTML_KEY]: text });
      } else {
        localStorage.setItem(STORAGE_HTML_KEY, text);
      }
    }
    
    renderPreview();
  };
  reader.readAsText(file);
});

editorInput.addEventListener("input", () => {
  renderPreview();
  saveState();
});

editorInput.addEventListener("scroll", () => {
  if (!previewFrame.contentWindow) return;
  const maxScroll = editorInput.scrollHeight - editorInput.clientHeight;
  if (maxScroll <= 0) return;
  const scrollPercent = editorInput.scrollTop / maxScroll;
  
  previewFrame.contentWindow.postMessage(
    {
      type: "scroll-to-percent",
      token: previewSessionToken,
      percent: scrollPercent
    },
    "*"
  );
});

htmlModeBtn.addEventListener("click", () => switchMode("html"));
mdModeBtn.addEventListener("click", () => switchMode("markdown"));

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
loadState();
