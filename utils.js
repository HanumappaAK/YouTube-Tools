// This function retrieves the URL of the currently active tab in Chrome
export async function getActiveTabURL() {
  // Query options to get the active tab in the current window
  let queryOptions = { active: true, currentWindow: true };
  // Use Chrome API to query for the active tab
  let [tab] = await chrome.tabs.query(queryOptions);
  // Return the active tab
  return tab;
}

// This function converts seconds to a formatted time string (HH:MM:SS)
export const getTime = (t) => {
  // Create a new Date object with seconds parameter
  var date = new Date(0);
  date.setSeconds(t); // Set seconds to the provided value

  // Convert the date to ISO string format and extract the time part
  return date.toISOString().substr(11, 8);
};
