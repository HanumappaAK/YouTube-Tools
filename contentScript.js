// Variables to store references to YouTube player controls and player itself
let youtubeLeftControls, youtubePlayer;
// Variables to store current video ID and its bookmarks
let currentVideo = "";
let currentVideoBookmarks = [];

// Function to fetch bookmarks for the current video from Chrome storage
const fetchBookmarks = () => {
  return new Promise((resolve) => {
    // Check if Chrome runtime is available
    if (chrome.runtime && !chrome.runtime.lastError) {
      // Fetch bookmarks from Chrome storage
      chrome.storage.sync.get([currentVideo], (obj) => {
        // Resolve the promise with bookmarks (empty array if none)
        resolve(obj[currentVideo] ? JSON.parse(obj[currentVideo]) : []);
      });
    } else {
      // Log an error if extension context is invalidated
      console.error("Extension context invalidated.");
      // Resolve the promise with an empty array
      resolve([]);
    }
  });
};

// Event handler function for adding a new bookmark
const addNewBookmarkEventHandler = async () => {
  // Get current time of the YouTube player
  const currentTime = youtubePlayer.currentTime;
  // Create a new bookmark object
  const newBookmark = {
    time: currentTime,
    desc: "Bookmark at " + getTime(currentTime), // Description includes current timestamp
  };

  // Fetch existing bookmarks for the current video
  currentVideoBookmarks = await fetchBookmarks();

  // Add the new bookmark to the existing bookmarks and sort them by time
  chrome.storage.sync.set({
    [currentVideo]: JSON.stringify(
      [...currentVideoBookmarks, newBookmark].sort((a, b) => a.time - b.time)
    ),
  });

  // Send a message to the background script to show the badge
  chrome.runtime.sendMessage({ type: "SHOW_BADGE" });
};

// Function to check if YouTube player and controls are available and add bookmark button
const checkForPlayer = async () => {
  // Find YouTube player controls and player itself
  youtubeLeftControls = document.getElementsByClassName("ytp-left-controls")[0];
  youtubePlayer = document.getElementsByClassName("video-stream")[0];

  // If player controls and player are found
  if (youtubeLeftControls && youtubePlayer) {
    // Fetch existing bookmarks for the current video
    currentVideoBookmarks = await fetchBookmarks();
    // Check if bookmark button already exists
    const bookmarkBtnExists =
      document.getElementsByClassName("bookmark-btn")[0];

    // If bookmark button doesn't exist, create and add it to the player controls
    if (!bookmarkBtnExists) {
      const bookmarkBtn = document.createElement("img");

      bookmarkBtn.src = chrome.runtime.getURL("assets/bookmark.png"); // Bookmark icon
      bookmarkBtn.className = "ytp-button " + "bookmark-btn"; // CSS class for styling
      bookmarkBtn.title = "Click to bookmark current timestamp"; // Tooltip

      // Add event listener to bookmark button to handle bookmarking
      bookmarkBtn.addEventListener("click", addNewBookmarkEventHandler);

      // Append bookmark button to the player controls
      youtubeLeftControls.appendChild(bookmarkBtn);

      return true; // Bookmark button added successfully
    } else {
      return false; // Bookmark button already exists
    }
  }

  return false; // Bookmark button not added (player or controls not found)
};

// Function to add custom styles
const addStyles = () => {
  // Create <style> element
  const style = document.createElement("style");
  // Define CSS rules for bookmark button and player controls
  style.innerHTML = `
    .bookmark-btn {
        width: 46px !important;
        height: 46px !important;
        min-width: 46px !important;
        min-height: 46px !important;
        max-width: 46px !important;
        max-height: 46px !important;
        object-fit: contain;
        margin-left: 8px;
        margin-right: 8px;
        z-index: 9999;
        padding: 0 !important;
        display: inline-block !important;
        justify-content: center;
        position: relative;
      }
     
     .bookmark-btn:hover {
        cursor: pointer;
        background-color: rgba(0, 0, 0, .05);
        border: 1px solid rgba(0, 0, 0, .05);
     }
     
    .ytp-chrome-controls {
      margin-right: 0 !important;
    }
  `;
  // Append the <style> element to the <head> of the document
  document.head.appendChild(style);
};

// Function to initialize bookmarking functionality
const init = async () => {
  // Add custom styles
  addStyles();
  // Check for YouTube player and controls, and add bookmark button if available
  return checkForPlayer();
};

// Listener for messages from background script
chrome.runtime.onMessage.addListener(async (obj, sender, response) => {
  const { type, value, videoId } = obj;

  // Handle different message types
  if (type === "NEW") {
    // Set current video ID and initialize bookmarking functionality
    currentVideo = videoId;
    response(await init());
  } else if (type === "PLAY") {
    // Seek to the specified time in the video
    youtubePlayer.currentTime = value;
  } else if (type === "DELETE") {
    // Remove the bookmark with the specified time from the list of bookmarks
    const bookmarkTime = parseFloat(value);
    currentVideoBookmarks = currentVideoBookmarks.filter((b) => {
      return b.time !== bookmarkTime;
    });
    // Update bookmarks in Chrome storage
    chrome.storage.sync.set({
      [currentVideo]: JSON.stringify(currentVideoBookmarks),
    });
    response(currentVideoBookmarks);
  }
});

// Function to convert time in seconds to HH:MM:SS format
const getTime = (t) => {
  var date = new Date(0);
  date.setSeconds(t);

  return date.toISOString().substr(11, 8);
};
