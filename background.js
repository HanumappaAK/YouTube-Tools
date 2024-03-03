// A helper function to handle the initialization of content script
const initContentScript = (tabId, url) => {
  // Extract videoId from the URL query parameters
  const videoId = new URLSearchParams(new URL(url).search).get("v");
  // If videoId exists, send a message to content script with videoId
  if (videoId) {
    chrome.tabs.sendMessage(tabId, { type: "NEW", videoId });
  }
};

// Listener for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Check if the tab update is complete and it's a YouTube video page
  if (
    changeInfo.status === "complete" &&
    tab.url.includes("youtube.com/watch")
  ) {
    // Initialize content script for the updated tab
    initContentScript(tabId, tab.url);
  }
});

// Listener for web navigation history state updates
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  // Check if the URL after navigation is a YouTube video page
  if (details.url.includes("youtube.com/watch")) {
    // Initialize content script for the updated tab
    initContentScript(details.tabId, details.url);
  }
});

// Function to show badge icon
const showBadge = () => {
  // Set badge text and background color
  chrome.action.setBadgeText({ text: "\u2713" }); // Checkmark symbol
  chrome.action.setBadgeBackgroundColor({ color: "#32bea6" }); // Green color

  // Remove badge after 1.5 seconds
  setTimeout(() => {
    chrome.action.setBadgeText({ text: "" });
  }, 1500);
};

// Listener for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // If message type is "SHOW_BADGE", call showBadge function
  if (message.type === "SHOW_BADGE") {
    showBadge();
  }
});
