console.log("Background.js is running!");

// Capture visible screenshot
function CaptureScreenshot(tabId, imageList, callback) {
  chrome.tabs.captureVisibleTab(null, { format: "png" }, (imageUrl) => {
    if (chrome.runtime.lastError) {
      console.error("Error capturing screenshot:", chrome.runtime.lastError.message);
    } else if (!imageUrl) {
      console.error("Screenshot capture returned undefined URL.");
    } else {
      console.log("Screenshot captured:", imageUrl);
      imageList.push(imageUrl); // Add to list
    }
    callback(); // Continue
  });
}

// Scroll and capture sequentially
function ScrollAndCapture(tabId, scrollPositions, imageList, index = 0, retries = 0) {
  if (index >= scrollPositions.length) {
    console.log("All screenshots captured successfully!", imageList);
    return; // End process
  }

  chrome.tabs.sendMessage(tabId, {
    action: "scrollPage",
    currentScroll: scrollPositions[index],
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error("Error sending message to content.js:", chrome.runtime.lastError.message);
      if (retries < 3) {
        console.log("Retrying scroll position...");
        ScrollAndCapture(tabId, scrollPositions, imageList, index, retries + 1);
      } else {
        console.error("Max retries reached. Skipping to next position...");
        ScrollAndCapture(tabId, scrollPositions, imageList, index + 1);
      }
    } else if (response && response.success) {
      console.log(`Scrolled to position ${scrollPositions[index]}, capturing screenshot...`);
      CaptureScreenshot(tabId, imageList, () => {
        ScrollAndCapture(tabId, scrollPositions, imageList, index + 1); // Next position
      });
    } else {
      console.error("No response received from content.js. Skipping...");
      ScrollAndCapture(tabId, scrollPositions, imageList, index + 1);
    }
  });
}

// Listener for screenshot request
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "takeScreenshot") {
    console.log("Page height:", message.Full_Height);
    console.log("Display height:", message.Display_Height);

    const scrollCount = Math.ceil(message.Full_Height / message.Display_Height);
    console.log("Number of scrolls needed:", scrollCount);

    const scrollPositions = Array.from({ length: scrollCount }, (_, i) => i * message.Display_Height);
    const imageList = []; // To store screenshots

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (tabId) {
        ScrollAndCapture(tabId, scrollPositions, imageList); // Begin process
      } else {
        console.error("No active tab found.");
      }
    });

    sendResponse({ farewell: "Screenshot process initiated." });
    return true; // Keeps port open
  }
});