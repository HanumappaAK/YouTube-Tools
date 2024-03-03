// When the window loads, set up the observer on the target node
window.onload = () => {
  // Find the target node, default to document body if not found
  const targetNode = document.getElementById("movie_player") || document.body;
  // Call the selfObserver function to set up mutation observer
  selfObserver(targetNode);
};

// Function to set up a mutation observer on a given document node
function selfObserver(documentNode) {
  // Create a new MutationObserver instance with a callback function
  const observer = new MutationObserver(function () {
    // Call the adFunction whenever a mutation is observed
    adFunction();
  });

  // Configuration options for the observer
  const config = {
    subtree: true, // Observe changes in the subtree of the target node
    childList: true, // Observe addition/removal of child nodes
  };

  // Start observing the target node with the given configuration
  observer.observe(documentNode, config);
}

// Function to handle ad-related actions
function adFunction() {
  // Find elements related to ads
  const mainDocument = document.getElementsByClassName(
    "video-ads ytp-ad-module"
  );
  const playerOverlay = document.getElementsByClassName(
    "ytp-ad-player-overlay"
  );
  const imageOverlay = document.getElementsByClassName("ytp-ad-image-overlay");
  const skipBtn = document.getElementsByClassName(
    "ytp-ad-skip-button ytp-button"
  );
  const newSkipBtn = document.getElementsByClassName(
    "ytp-ad-skip-button-modern ytp-button"
  );
  const videoDocument = document.getElementsByClassName(
    "video-stream html5-main-video"
  );
  const textOverlay = document.getElementsByClassName("ytp-ad-text-overlay");
  const playerAds = document.getElementById("player-ads");

  // Function to handle clicking skip button
  function handleSkipBtn() {
    if (skipBtn.length > 0) {
      skipBtn[0].click();
    }
  }

  // Function to handle clicking new skip button
  function handleNewSkipBtn() {
    if (newSkipBtn.length > 0) {
      newSkipBtn[0].click();
    }
  }

  // If main ad document exists
  if (mainDocument.length > 0) {
    // Perform actions related to ad handling
    handleSkipBtn();
    handleNewSkipBtn();
    // If there's a player overlay
    if (playerOverlay.length > 0) {
      // Hide player overlay and seek to the end of the video
      playerOverlay[0].style.visibility = "hidden";
      for (let i = 0; i < videoDocument.length; i++) {
        if (videoDocument[i] && videoDocument[i].duration) {
          videoDocument[i].currentTime = videoDocument[i].duration;
        }
      }
      // Attempt to skip again
      handleSkipBtn();
      handleNewSkipBtn();
    }
    // If there's an image overlay, hide it
    if (imageOverlay.length > 0) {
      imageOverlay[0].style.visibility = "hidden";
    }
  }

  // If player ads exist, hide them
  if (playerAds) {
    playerAds.style.display = "none";
  }

  // If text overlay exists, hide it
  if (textOverlay.length > 0) {
    textOverlay[0].style.display = "none";
  }
}
