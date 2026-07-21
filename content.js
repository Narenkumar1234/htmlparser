(function () {
  // Check if we are actually viewing a raw markdown page.
  // Chrome natively displays plain-text files by wrapping them in a single <pre> element.
  const preElement = document.querySelector("body > pre");
  if (!preElement || document.body.children.length !== 1) {
    return;
  }

  const rawText = preElement.textContent;
  
  // Extract filename from URL
  const path = window.location.pathname;
  const filename = decodeURIComponent(path.substring(path.lastIndexOf("/") + 1)) || "document.md";

  // Hide the raw pre element
  preElement.style.display = "none";

  // Inject Google Font link elements
  const fontLink1 = document.createElement("link");
  fontLink1.rel = "preconnect";
  fontLink1.href = "https://fonts.googleapis.com";
  document.head.appendChild(fontLink1);

  const fontLink2 = document.createElement("link");
  fontLink2.rel = "preconnect";
  fontLink2.href = "https://fonts.gstatic.com";
  fontLink2.crossOrigin = "anonymous";
  document.head.appendChild(fontLink2);

  const fontLink3 = document.createElement("link");
  fontLink3.rel = "stylesheet";
  fontLink3.href = "https://fonts.googleapis.com/css2?family=Lexend+Deca:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(fontLink3);

  // Inject CSS styles
  const styleEl = document.createElement("style");
  styleEl.textContent = `
    button, input, select {
      font-family: inherit;
    }

    body {
      margin: 0;
      padding: 0;
      background-color: #f9fafb;
      font-family: 'Lexend Deca', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #1f2937;
      display: flex;
      flex-direction: column;
      height: 100vh;
      box-sizing: border-box;
    }

    .md-viewer-header {
      position: sticky;
      top: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 24px;
      background-color: #ffffff;
      border-bottom: 1px solid #e5e7eb;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
      flex-shrink: 0;
    }

    .md-viewer-filename {
      font-size: 14px;
      font-weight: 600;
      color: #111827;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .md-viewer-filename svg {
      width: 16px;
      height: 16px;
      color: #4b5563;
    }

    .md-viewer-tabs {
      display: flex;
      background: #e5e7eb;
      border-radius: 8px;
      padding: 2px;
      gap: 2px;
    }

    .md-viewer-tab-btn {
      border: none;
      background: transparent;
      color: #4b5563;
      padding: 6px 16px;
      font-size: 13px;
      font-weight: 500;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .md-viewer-tab-btn:hover {
      color: #111827;
    }

    .md-viewer-tab-btn.active {
      background: #ffffff;
      color: #111827;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }

    .md-viewer-edit-btn {
      background-color: #111827;
      color: #ffffff;
      border: 1px solid #111827;
      padding: 6px 12px;
      font-size: 13px;
      font-weight: 500;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .md-viewer-edit-btn:hover {
      background-color: #1f2937;
    }

    .md-viewer-content {
      flex: 1;
      overflow-y: auto;
      padding: 32px 16px;
      display: flex;
      justify-content: center;
    }

    .md-viewer-body {
      background-color: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
      width: 100%;
      max-width: 800px;
      padding: 40px;
      box-sizing: border-box;
      height: fit-content;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }

    .md-viewer-raw-body {
      width: 100%;
      max-width: 900px;
      background: #1e1e2e;
      color: #cdd6f4;
      border-radius: 12px;
      padding: 24px;
      box-sizing: border-box;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 14px;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-all;
      overflow-x: auto;
      border: 1px solid #313244;
      height: fit-content;
      margin: 0;
    }

    .hidden {
      display: none !important;
    }

    /* Beautiful Markdown Typography */
    .md-viewer-body h1, 
    .md-viewer-body h2, 
    .md-viewer-body h3, 
    .md-viewer-body h4 {
      color: #111827;
      font-weight: 700;
      line-height: 1.25;
      margin-top: 1.5em;
      margin-bottom: 0.5em;
    }

    .md-viewer-body h1 {
      font-size: 2.25em;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 0.3em;
    }

    .md-viewer-body h2 {
      font-size: 1.75em;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 0.3em;
    }

    .md-viewer-body h3 {
      font-size: 1.35em;
    }

    .md-viewer-body p {
      margin-top: 0;
      margin-bottom: 1.25em;
      line-height: 1.7;
    }

    .md-viewer-body a {
      color: #2563eb;
      text-decoration: none;
      font-weight: 500;
    }

    .md-viewer-body a:hover {
      text-decoration: underline;
    }

    .md-viewer-body pre {
      background-color: #f3f4f6;
      padding: 1.25em;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      overflow-x: auto;
      margin-bottom: 1.25em;
    }

    .md-viewer-body code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.875em;
      background-color: #f3f4f6;
      padding: 0.2em 0.4em;
      border-radius: 6px;
      color: #eb5757;
    }

    .md-viewer-body pre code {
      background-color: transparent;
      padding: 0;
      border-radius: 0;
      color: inherit;
      font-size: 0.9em;
    }

    .md-viewer-body blockquote {
      margin: 0 0 1.25rem 0;
      padding: 0.5rem 0 0.5rem 1rem;
      border-left: 4px solid #d1d5db;
      color: #4b5563;
      font-style: italic;
      background-color: #f9fafb;
      border-radius: 0 8px 8px 0;
    }

    .md-viewer-body table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1.25rem;
    }

    .md-viewer-body th, 
    .md-viewer-body td {
      padding: 0.75rem 1rem;
      border: 1px solid #e5e7eb;
    }

    .md-viewer-body th {
      background-color: #f9fafb;
      font-weight: 600;
    }

    .md-viewer-body tr:nth-child(even) {
      background-color: #f9fafb;
    }

    .md-viewer-body img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
    }

    .md-viewer-body ul, 
    .md-viewer-body ol {
      padding-left: 1.5rem;
      margin-bottom: 1.25rem;
    }

    .md-viewer-body li {
      margin-bottom: 0.25rem;
    }

    .md-viewer-body hr {
      height: 1px;
      border: none;
      background-color: #e5e7eb;
      margin: 2rem 0;
    }
  `;
  document.head.appendChild(styleEl);

  // Parse HTML
  let parsedHtml = "";
  try {
    // marked is loaded in the page via manifest.json content scripts definition
    parsedHtml = marked.parse(rawText);
  } catch (err) {
    console.error("Failed to parse Markdown:", err);
    parsedHtml = `<div style="color: #ef4444;">Error parsing markdown file.</div>`;
  }

  // Create document elements
  const container = document.createElement("div");
  container.className = "md-viewer-container";
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.height = "100%";

  container.innerHTML = `
    <header class="md-viewer-header">
      <div class="md-viewer-filename">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
        <span>${filename}</span>
      </div>
      <div class="md-viewer-tabs">
        <button id="tabPreview" class="md-viewer-tab-btn active">Preview</button>
        <button id="tabRaw" class="md-viewer-tab-btn">Raw Source</button>
      </div>
      <button id="btnOpenEditor" class="md-viewer-edit-btn">Open in Editor</button>
    </header>
    <main class="md-viewer-content">
      <article id="previewArea" class="md-viewer-body">${parsedHtml}</article>
      <pre id="rawArea" class="md-viewer-raw-body hidden"></pre>
    </main>
  `;

  // Populate raw code area
  container.querySelector("#rawArea").textContent = rawText;

  // Append new structure to body
  document.body.innerHTML = "";
  document.body.appendChild(container);

  // Wire up tabs
  const tabPreview = document.getElementById("tabPreview");
  const tabRaw = document.getElementById("tabRaw");
  const previewArea = document.getElementById("previewArea");
  const rawArea = document.getElementById("rawArea");

  tabPreview.addEventListener("click", () => {
    tabPreview.classList.add("active");
    tabRaw.classList.remove("active");
    previewArea.classList.remove("hidden");
    rawArea.classList.add("hidden");
  });

  tabRaw.addEventListener("click", () => {
    tabRaw.classList.add("active");
    tabPreview.classList.remove("active");
    rawArea.classList.remove("hidden");
    previewArea.classList.add("hidden");
  });

  // Wire up open in editor button
  const btnOpenEditor = document.getElementById("btnOpenEditor");
  btnOpenEditor.addEventListener("click", () => {
    // Write markdown to storage temp key and notify background to open viewer
    chrome.storage.local.set(
      {
        tempImportedMd: rawText,
        editorMode: "markdown"
      },
      () => {
        chrome.runtime.sendMessage({ action: "open_viewer" });
      }
    );
  });
})();
