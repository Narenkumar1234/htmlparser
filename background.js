chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({
    url: chrome.runtime.getURL("viewer.html")
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "open_viewer") {
    chrome.tabs.create({
      url: chrome.runtime.getURL("viewer.html")
    });
    sendResponse({ success: true });
  }
  return true;
});
