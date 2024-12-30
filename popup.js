document.addEventListener("DOMContentLoaded", () => {
  const openUrlButton = document.getElementById("open-url-btn");

  openUrlButton.addEventListener("click", () => {
    const url = document.getElementById("url-input").value;

    if (url) {
        // Send message to background script to start session and open URL
        chrome.runtime.sendMessage({ action: 'startSession', url: url }, function(response) {
            if (response.success) {
                // Open the URL in a new tab
                chrome.tabs.create({ url: url }, function(tab) {
                    console.log("Opened URL:", url);
                });
            } else {
                console.log("Failed to start session: " + response.message);  // Log the failure message
            }
        });
    } else {
        alert("Please enter a valid URL");
    }
  });
});
