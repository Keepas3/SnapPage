(function () {
  // Prevent multiple injections by checking if already running
  if (window.__contentScriptRunning) {
    console.warn("Content script is already running. Preventing re-injection.");
    return;
  }
  window.__contentScriptRunning = true;

  console.log("Content.js script is running!");

  // Define page dimensions
  const pageHeight = document.documentElement.scrollHeight;
  const displayHeight = window.innerHeight;
  console.log("Page Height:", pageHeight);
  console.log("Display Height:", displayHeight);

  // Listener for scrolling actions
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "scrollPage") {
      console.log("Scrolling to:", message.currentScroll);
      window.scrollTo(0, message.currentScroll);

      // Delay response to ensure scrolling visually completes
      setTimeout(() => {
        sendResponse({ success: true });
        console.log("Scroll response sent.");
      }, 100);
    }
  });

  // Send page dimensions to background.js
  chrome.runtime.sendMessage({
    action: "takeScreenshot",
    Full_Height: pageHeight,
    Display_Height: displayHeight,
  });
})();