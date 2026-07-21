# Chrome Web Store Metadata: HTML Viewer

This document acts as the single source of truth for the HTML Viewer Chrome Web Store listing, optimized for CWS search SEO while introducing the new Markdown and scroll-sync features.

## Listing Details

### Extension Name
`HTML Viewer`

### Summary (132 characters max - matches manifest.json)
`Paste HTML or Markdown and instantly preview it.`

### Detailed Description (CWS Store Listing)
```text
HTML Viewer is a lightweight Chrome extension that lets you instantly preview HTML code and Markdown (.md) documents without setting up any local environment. 

Simply paste your HTML snippet or Markdown text and get a live rendered preview in seconds. Whether you're debugging layouts, testing components, learning HTML, or reading documentation, this HTML Viewer extension helps you iterate faster with zero setup.

Now with comprehensive Markdown support! Open `.md` files directly in Chrome with a premium preview mode, use the interactive tab switcher to toggle between formats, and write faster with automatic scroll synchronization.

Key features:
• Live HTML, CSS, and JS preview with instant rendering  
• Complete Markdown (.md) viewer & editor with gorgeous typography
• Real-time Scroll Synchronization (sync scroll) between the editor and preview panels
• Native Chrome file previewer: Renders any `.md` file opened in Chrome with a clean formatted layout
• Seamless drag-and-drop support: Drop `.html` or `.md` files to load them instantly
• Built-in tab switching for separate HTML and Markdown workspaces
• Save state automatically: Preserves your inputs and mode selection across sessions
• Clean, distraction-free, and lightweight interface
• No external tools or complex setups required
```

---

## Permissions & Host Permissions Justifications

| Permission | Justification |
|------------|---------------|
| `storage`  | Required to save user editor inputs (HTML/Markdown contents) and UI settings (active tab) locally so they persist across browser restarts. |

## Host Permissions (Content Scripts)
The extension declares content scripts matching file and web schemes:
- `matches`: `file://*/*.md`, `file://*/*.markdown`, `http://*/*.md`, `http://*/*.markdown`, `https://*/*.md`, `https://*/*.markdown`
- **Justification**: Needed to identify plain-text markdown files loaded directly in the browser and intercept them to render a clean, readable formatted preview.

---

## Release History

### Version 1.1.0 (2026-07-21)
- Added full Markdown (.md) document support.
- Implemented real-time scroll synchronization (sync scroll) between the editor and preview.
- Created native Chrome file viewer content script for rendering raw `.md` files.
- Added drag-and-drop loading support for `.html` and `.md` files.
- Re-styled layout using modern CSS flexbox and Lexend Deca font.
