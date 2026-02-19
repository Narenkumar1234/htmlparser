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
  if (!event.data || event.data.type !== "render-html") {
    return;
  }
  if (!sessionToken || event.data.token !== sessionToken) {
    return;
  }

  latestHtml = typeof event.data.html === "string" ? event.data.html : "";
  renderToFrame();
});

window.parent.postMessage({ type: "sandbox-ready", token: sessionToken }, "*");
