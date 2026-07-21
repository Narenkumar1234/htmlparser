const runtimeFrame = document.getElementById("runtimeFrame");
const urlParams = new URLSearchParams(window.location.search);
const sessionToken = urlParams.get("token") || "";
let latestHtml = "";

function renderToFrame() {
  runtimeFrame.srcdoc = latestHtml;
}

window.addEventListener("message", (event) => {
  if (event.source !== window.parent) {
    return;
  }
  if (!event.data) {
    return;
  }
  if (!sessionToken || event.data.token !== sessionToken) {
    return;
  }

  if (event.data.type === "render-html") {
    latestHtml = typeof event.data.html === "string" ? event.data.html : "";
    renderToFrame();
  } else if (event.data.type === "scroll-to-percent") {
    if (runtimeFrame && runtimeFrame.contentWindow) {
      runtimeFrame.contentWindow.postMessage(
        { type: "scroll-to-percent", percent: event.data.percent },
        "*"
      );
    }
  }
});

window.parent.postMessage({ type: "sandbox-ready", token: sessionToken }, "*");
