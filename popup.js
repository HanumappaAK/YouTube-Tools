// Import necessary functions from utils.js
import { getActiveTabURL, getTime } from "./utils.js";

// Function to show the edit modal for a bookmark
const showEditModal = (bookmark) => {
  const editModal = document.getElementById("editModal");
  const editNoteText = document.getElementById("editNoteText");

  // Set the textarea value to the existing note text
  editNoteText.value = bookmark.desc;

  // Show the modal
  editModal.style.display = "block";

  // Add event listener to save the edited note
  document.getElementById("saveEditNote").onclick = () => {
    saveEditedNote(bookmark, editNoteText.value);
  };

  // Add event listener to close the modal on click of the X button
  document.getElementById("editModalClose").onclick = () => {
    // Hide the modal
    editModal.style.display = "none";
  };
};

// Function to save an edited note for a bookmark
const saveEditedNote = async (bookmark, editedText) => {
  // Update the bookmark's description with the edited text
  bookmark.desc = editedText;

  // Save the updated bookmark to storage
  const activeTab = await getActiveTabURL();
  const currentVideo = new URLSearchParams(activeTab.url.split("?")[1]).get(
    "v"
  );

  chrome.storage.sync.get([currentVideo], (data) => {
    let currentBookmarks = data[currentVideo]
      ? JSON.parse(data[currentVideo])
      : [];

    // Update the note for the corresponding bookmark
    for (let i = 0; i < currentBookmarks.length; i++) {
      if (currentBookmarks[i].time === bookmark.time) {
        currentBookmarks[i].desc = editedText;
        break;
      }
    }

    // Update the stored bookmarks with the new note
    chrome.storage.sync.set(
      { [currentVideo]: JSON.stringify(currentBookmarks) },
      () => {
        console.log("Bookmark note updated.");
      }
    );

    // Refresh the bookmarks view
    viewBookmarks(currentBookmarks);
  });

  // Hide the modal
  document.getElementById("editModal").style.display = "none";
};

// Function to show the full note when clicked on a bookmark
const showFullNote = (bookmarkNoteElement, note) => {
  const fullNote = document.createElement("div");
  fullNote.innerHTML = note;
  fullNote.className = "full-note";
  fullNote.style.display = "none";
  bookmarkNoteElement.appendChild(fullNote);

  // Toggle full note display on click
  bookmarkNoteElement.addEventListener("click", () => {
    if (fullNote.style.display === "none") {
      fullNote.style.display = "block";
    } else {
      fullNote.style.display = "none";
    }
  });
};

// Function to add a new bookmark to the view
const addNewBookmark = (bookmarksElement, bookmark) => {
  const bookmarkTimestampElement = document.createElement("div");
  const bookmarkNoteElement = document.createElement("div");
  const newBookmarkElement = document.createElement("div");
  const controlsElement = document.createElement("div");

  // Set up bookmark elements and controls
  bookmarkTimestampElement.textContent = getTime(bookmark.time);
  bookmarkTimestampElement.className = "bookmark-timestamp";
  bookmarkNoteElement.textContent = bookmark.desc;
  bookmarkNoteElement.className = "bookmark-note";
  showFullNote(bookmarkNoteElement, bookmark.desc);
  controlsElement.className = "bookmark-controls";

  // Set up controls with appropriate attributes and event listeners
  setBookmarkAttributes("play", onPlay, controlsElement);
  setBookmarkAttributes("edit", onEdit, controlsElement);
  const onDeleteClosure = (e) => {
    onDelete(e, bookmark.time);
  };
  setBookmarkAttributes("delete", onDeleteClosure, controlsElement);

  // Set up new bookmark element with its children
  newBookmarkElement.id = "bookmark-" + bookmark.time.toFixed(3);
  newBookmarkElement.className = "bookmark";
  newBookmarkElement.setAttribute("timestamp", bookmark.time);
  newBookmarkElement.appendChild(bookmarkTimestampElement);
  newBookmarkElement.appendChild(bookmarkNoteElement);
  newBookmarkElement.appendChild(controlsElement);
  bookmarksElement.appendChild(newBookmarkElement);
};

// Function to display all bookmarks
const viewBookmarks = (currentBookmarks = []) => {
  const bookmarksElement = document.getElementById("bookmarks");
  bookmarksElement.innerHTML = "";

  // Add "Delete all" button if there are at least 2 bookmarks
  if (currentBookmarks.length >= 2) {
    const deleteAllButton = document.createElement("button");
    deleteAllButton.textContent = "Delete all";
    deleteAllButton.id = "delete-all";
    deleteAllButton.className = "delete-all-button";
    bookmarksElement.appendChild(deleteAllButton);

    deleteAllButton.addEventListener("click", onDeleteAll);
  }

  // Populate bookmarks view
  if (currentBookmarks.length > 0) {
    for (const bookmark of currentBookmarks) {
      addNewBookmark(bookmarksElement, bookmark);
    }
  } else {
    bookmarksElement.innerHTML = '<i class="row">No bookmarks to show.</i>';
  }
};

// Event handler to play a bookmarked time
const onPlay = async (e) => {
  const bookmarkTime = e.target.parentNode.parentNode.getAttribute("timestamp");
  const activeTab = await getActiveTabURL();

  chrome.tabs.sendMessage(activeTab.id, {
    type: "PLAY",
    value: bookmarkTime,
  });
};

// Event handler to edit a bookmarked note
const onEdit = async (e) => {
  const bookmarkTime = e.target.parentNode.parentNode.getAttribute("timestamp");
  const activeTab = await getActiveTabURL();
  const currentVideo = new URLSearchParams(activeTab.url.split("?")[1]).get(
    "v"
  );

  chrome.storage.sync.get([currentVideo], (data) => {
    let currentBookmarks = data[currentVideo]
      ? JSON.parse(data[currentVideo])
      : [];

    // Find the corresponding bookmark
    const bookmarkToEdit = currentBookmarks.find(
      (bookmark) => bookmark.time === parseFloat(bookmarkTime)
    );

    if (bookmarkToEdit) {
      showEditModal(bookmarkToEdit);
    }
  });
};

// Event handler to delete a bookmark
const onDelete = async (e, bookmarkTime) => {
  const activeTab = await getActiveTabURL();
  const queryParameters = activeTab.url.split("?")[1];
  const urlParameters = new URLSearchParams(queryParameters);
  const currentVideo = urlParameters.get("v");
  const bookmarkElementToDelete = document.getElementById(
    "bookmark-" + bookmarkTime.toFixed(3)
  );

  // Remove the bookmark element from the view
  bookmarkElementToDelete.parentNode.removeChild(bookmarkElementToDelete);

  // Fetch the stored bookmarks
  chrome.storage.sync.get([currentVideo], (data) => {
    let currentBookmarks = data[currentVideo]
      ? JSON.parse(data[currentVideo])
      : [];

    // Filter out the deleted bookmark
    currentBookmarks = currentBookmarks.filter(
      (bookmark) => Math.abs(bookmark.time - bookmarkTime) > 0.001
    );

    // Update the stored bookmarks
    chrome.storage.sync.set(
      { [currentVideo]: JSON.stringify(currentBookmarks) },
      () => {
        console.log("Bookmark deleted and storage updated.");
      }
    );
  });

  // Send message to content script to update player state
  chrome.tabs.sendMessage(activeTab.id, {
    type: "DELETE",
    value: bookmarkTime,
  });
};

// Event handler to delete all bookmarks
const onDeleteAll = async () => {
  const activeTab = await getActiveTabURL();
  const currentVideo = new URLSearchParams(activeTab.url.split("?")[1]).get(
    "v"
  );

  // Clear all stored bookmarks for the current video
  chrome.storage.sync.set({ [currentVideo]: JSON.stringify([]) }, () => {
    console.log("All bookmarks deleted and storage updated.");
  });

  // Refresh the bookmarks view
  viewBookmarks([]);
};

// Function to set attributes for bookmark controls
const setBookmarkAttributes = (src, eventListener, controlParentElement) => {
  const controlElement = document.createElement("img");

  controlElement.src = "assets/" + src + ".png";
  controlElement.title = src;
  controlElement.addEventListener("click", eventListener);
  controlParentElement.appendChild(controlElement);

  return eventListener;
};

// When the DOM is loaded, check if it's a YouTube video page and load bookmarks accordingly
document.addEventListener("DOMContentLoaded", async () => {
  const activeTab = await getActiveTabURL();
  const queryParameters = activeTab.url.split("?")[1];
  const urlParameters = new URLSearchParams(queryParameters);
  const currentVideo = urlParameters.get("v");

  if (activeTab.url.includes("youtube.com/watch") && currentVideo) {
    // Load bookmarks for the current video
    chrome.storage.sync.get([currentVideo], (data) => {
      const currentVideoBookmarks = data[currentVideo]
        ? JSON.parse(data[currentVideo])
        : [];

      viewBookmarks(currentVideoBookmarks);
    });
  } else {
    // Show message if it's not a YouTube video page
    const container = document.getElementsByClassName("container")[0];
    container.innerHTML =
      '<div class="title">This is not a YouTube video page.</div>';
  }
});
