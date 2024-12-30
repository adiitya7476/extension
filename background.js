let sessionId = null;
let targetUrl = "";

// Consolidated message listener for background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case "startRecording":
      console.log("Starting recording");
      chrome.storage.local.set({ isRecording: true });
      sendResponse({ success: true });
      break;

    case "stopRecording":
      console.log("Stopping recording");
      chrome.storage.local.set({ isRecording: false, sessionId: null }, () => {
        console.log("Session ID cleared.");
        sendResponse({ success: true, sessionId: null });
      });
      break;

    case "startSession":
      const url = message.url;

      // Check if a session is already active
      if (!sessionId) {
        sessionId = Date.now().toString(); // Generate new session ID
        chrome.storage.local.set({ sessionId, targetUrl: url }, () => {
          console.log("Session started with ID:", sessionId);
          sendResponse({ success: true, sessionId: sessionId });
        });
      } else {
        console.log("Session already active");
        sendResponse({ success: false, message: "Session already active" });
      }
      return true; // Async response

    case "stopSession":
      // Stop the session and clear sessionId
      sessionId = null;
      chrome.storage.local.remove("sessionId", () => {
        console.log("Session stopped.");
        sendResponse({ success: true });
      });
      return true; // Async response

    case "getSessionId":
      // Get the current session ID
      chrome.storage.local.get("sessionId", (result) => {
        console.log("Retrieved Session ID:", result.sessionId);
        sendResponse({ sessionId: result.sessionId || null });
      });
      return true; // Indicates async response

    default:
      sendResponse({ success: false, message: "Unknown action" });
  }
});

// Listen for tab updates and inject content script when required
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url.includes(targetUrl)) {
    chrome.storage.local.get("isRecording", (data) => {
      if (data.isRecording) {
        // Inject content script to the tab if recording is active
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ["content.js"],
        });
        console.log(`Injected content script to tab ${tabId}`);
      }
    });
  }
});

// Handle extension installation or update
chrome.runtime.onInstalled.addListener(() => {
  // Set default recording status to false
  chrome.storage.local.set({ isRecording: false });
  console.log("Extension installed. Recording status set to false.");
});
