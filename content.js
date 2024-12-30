let observer = null; // To store MutationObserver instance
let recordingState = sessionStorage.getItem("recordingState") || "stopped"; // Store state in sessionStorage
let capturedData = [];
let cursorOverlay = null; // To store the overlay element

// Initialize Extension on Page Load
function initializeExtension() {
  // Check recording state from Chrome Storage
  chrome.storage.local.get(["isRecording", "capturedData"], function (result) {
    if (result.isRecording) {
      console.log("Recording is active.");
      injectButtons(); // Inject buttons if recording is active
      // Optionally, keep the captured data in memory for the session
      capturedData = result.capturedData || [];
      // Hide the start button and show the stop button if they exist
      const startButton = document.getElementById("startRecording");
      const stopButton = document.getElementById("stopRecording");

      if (startButton) {
        startButton.style.display = "none"; // Hide the start button
      }

      if (stopButton) {
        stopButton.style.display = "block"; // Show the stop button
      }
    } else {
      console.log("Recording is not active.");
    }
  });
}

//Session ID
// Check for session ID on page load
chrome.runtime.sendMessage({ action: "getSessionId" }, (response) => {
  console.log("Session ID on page load:", response.sessionId);

  if (response.sessionId !== null) {
    console.log("Active session found. Injecting buttons.");
    injectButtons(); // Inject buttons if session is active
  } else {
    console.log("No active session. Removing buttons.");
    removeButtons(); // Remove buttons if no active session
  }
});


// Check recording state when page loads
initializeExtension();

// Remove buttons
function removeButtons() {
  const startButton = document.getElementById("startRecording");
  const stopButton = document.getElementById("stopRecording");

  if (startButton) startButton.remove();
  if (stopButton) stopButton.remove();
}


// Function to inject buttons into the page
function injectButtons() {
  const startButton = document.createElement("button");
  startButton.id = "startRecording";
  startButton.innerText = "Start Recording";
  startButton.style.position = "fixed";
  startButton.style.top = "10px";
  startButton.style.right = "10px";
  startButton.style.zIndex = "9999";
  startButton.style.padding = "8px 16px";
  startButton.style.backgroundColor = "green";
  startButton.style.color = "white";
  startButton.style.border = "none";
  startButton.style.borderRadius = "4px";
  startButton.style.cursor = "pointer";

  // Attach the event listener to the start button
  startButton.addEventListener("click", function () {
    startRecording(); // Call your startRecording function here
  });

  const stopButton = document.createElement("button");
  stopButton.id = "stopRecording";
  stopButton.innerText = "Stop Recording";
  stopButton.style.position = "fixed";
  stopButton.style.top = "10px";
  stopButton.style.right = "150px";
  stopButton.style.zIndex = "9999";
  stopButton.style.padding = "8px 16px";
  stopButton.style.backgroundColor = "red";
  stopButton.style.color = "white";
  stopButton.style.border = "none";
  stopButton.style.borderRadius = "4px";
  stopButton.style.cursor = "pointer";

  stopButton.style.display = "none"; // Initially hidden

  // Append buttons to body
  document.body.appendChild(startButton);
  document.body.appendChild(stopButton);

  // Add event listeners for buttons
  startButton.addEventListener("click", startRecording);
  stopButton.addEventListener("click", stopRecording);
}

// Start Recording Function
function startRecording() {
  isRecording = true;
  recordingState = "recording";
  chrome.runtime.sendMessage({ action: "startRecording" });
  // Store recording state in chrome storage
  chrome.storage.local.set({ isRecording: true });

  document.getElementById("startRecording").style.display = "none";
  document.getElementById("stopRecording").style.display = "block";

  // Start monitoring the DOM for changes
  monitorDOM();

  // Add cursor overlay when recording starts
  toggleCursorOverlay();

  document.addEventListener("click", clickEventListener); // Add the click listener
}

// Stop Recording Function
function stopRecording() {
  isRecording = false;
  recordingState = "stopped";
  chrome.runtime.sendMessage({ action: "stopRecording" });
  // Store recording state in chrome storage
  chrome.storage.local.set({ isRecording: false });

  // Toggle button visibility
  document.getElementById("startRecording").style.display = "block";
  document.getElementById("stopRecording").style.display = "none";

  // Remove the click event listener
  document.removeEventListener("click", clickEventListener);

  // Remove cursor overlay when recording stops
  toggleCursorOverlay();
  capturedData = JSON.parse(sessionStorage.getItem("capturedData"));
  console.log(capturedData);
  // Send the captured data to the backend
  sendCapturedDataToBackend();

  // Clear captured data from memory
  capturedData = [];
}

// Function to send captured data to the backend
function sendCapturedDataToBackend() {
  const apiEndpoint = "http://localhost:8080/mfd/getXpath";
  fetch(apiEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(capturedData), // Send captured data
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Data received from backend:", JSON.stringify(data));
    })
    .catch((error) => console.error("Error sending data to backend:", error));
}



// Function to create the cursor overlay
function createCursorOverlay() {
  cursorOverlay = document.createElement("div");
  cursorOverlay.style.position = "absolute";
  cursorOverlay.style.border = "2px solid red"; // Red border for highlight
  cursorOverlay.style.pointerEvents = "none"; // Ensure overlay does not interfere with clicks
  cursorOverlay.style.zIndex = "9999"; // Make sure it’s above other elements
  cursorOverlay.style.transition = "all 0.1s ease"; // Smooth transition for movement
  document.body.appendChild(cursorOverlay);

  // Track mouse movement to update the overlay's position
  document.addEventListener("mousemove", onMouseMove);
}

// Function to handle mousemove event
function onMouseMove(event) {
  if (!isRecording) return; // Only update overlay if recording is active

  const element = document.elementFromPoint(event.clientX, event.clientY);

  if (element) {
    const rect = element.getBoundingClientRect(); // Get the bounding box of the element

    cursorOverlay.style.width = `${rect.width}px`;
    cursorOverlay.style.height = `${rect.height}px`;
    cursorOverlay.style.left = `${rect.left}px`;
    cursorOverlay.style.top = `${rect.top}px`;
  }
}

// Function to remove the cursor overlay
function removeCursorOverlay() {
  if (cursorOverlay) {
    cursorOverlay.remove();
    cursorOverlay = null;
  }

  // Remove the mousemove event listener when stopping
  document.removeEventListener("mousemove", onMouseMove);
}

// Add or remove the cursor overlay based on recording state
function toggleCursorOverlay() {
  if (isRecording) {
    createCursorOverlay();
  } else {
    removeCursorOverlay();
  }
}


function clickEventListener(event) {
  if (!isRecording) return;

  const element = event.target;
  const fieldName = getVisibleText(element);
  const elementXPath = getXPath(element);

  console.log("Captured field name:", fieldName);
  console.log("Captured XPath:", elementXPath);
  // capturedData.push({ fieldName, elementXPath }); // added by
  sendToBackend(fieldName, elementXPath);
}

// Function to send data to the backend
function sendToBackend(fieldName, elementXPath) {
  const data = {
    elementName: fieldName,
    elementXPath: elementXPath,
  };
  capturedData.push(data);
  // Save updated capturedData to sessionStorage
  sessionStorage.setItem("capturedData", JSON.stringify(capturedData));
}

// Capture the visible text
function getVisibleText(element) {
  const ind = 1;
  // Handle input, textarea, and select elements
  if (
    element.tagName === "INPUT" ||
    element.tagName === "TEXTAREA" ||
    element.tagName === "SELECT"
  ) {
    // For reset buttons
    if (element.type === "reset") {
      return element.getAttribute("value");
    }

    // Check for associated <label> element
    const label = document.querySelector(`label[for='${element.id}']`);
    if (label) {
      return label.textContent.trim();
    }

    // Check for 'aria-labelledby' attribute
    const labelId = element.getAttribute("aria-labelledby");
    if (labelId) {
      const labelParts = labelId.split(" ");
      for (const part of labelParts) {
        const labelElement = document.getElementById(part);
        if (labelElement && labelElement.textContent.trim()) {
          return labelElement.textContent.trim();
        }
      }
    }

    // Avoid returning placeholder text here
    const ariaLabel = element.getAttribute("aria-label")?.trim();
    if (ariaLabel) return ariaLabel;

    //check fro placeholder
    const placeholder = element.getAttribute("placeholder")?.trim();
    if (placeholder) return placeholder;

    // Handle SELECT elements specifically
    if (element.tagName === "SELECT") {
      // Return the currently selected option's text
      const selectedOption = element.options[element.selectedIndex];
      if (selectedOption) {
        const optionText = selectedOption.textContent.trim();
        return "Dropdown " + optionText;
      }
      return "Dropdown " + ind++;
    }
  }

  //Check for Buttons
  if (element.tagName === "BUTTON") {
    // Check for the 'value' attribute of the button
    const buttonValue = element.getAttribute("value");
    if (buttonValue && buttonValue.trim() !== "") {
      return buttonValue.trim();
    }

    // If no 'value' attribute, check for text content directly within the button
    const buttonText = element.textContent.trim();
    if (buttonText !== "") {
      return buttonText;
    }

    // Check for a span inside the button
    const span = element.querySelector("span");
    if (span) {
      return span.textContent.trim();
    }

    // Check for other child elements' text (if needed)
    const childText = element.querySelector("*");
    if (childText) {
      return childText.textContent.trim();
    }

    return "Button " + ind++; // Default if no value or text is found
  }

  // Check for text within <span> elements first
  const spanText = element.querySelector("span");
  if (spanText && spanText.textContent.trim()) {
    return spanText.textContent.trim();
  }

  // Check preceding siblings with text
  let sibling = element.previousElementSibling;
  while (sibling) {
    const siblingText = sibling.textContent.trim();
    if (siblingText) {
      return siblingText; // Return if sibling has meaningful text
    }
    sibling = sibling.previousElementSibling;
  }

  // Check preceding siblings in parent
  const parent = element.parentElement;
  if (parent) {
    const siblings = Array.from(parent.children);
    for (let i = siblings.indexOf(element) - 1; i >= 0; i--) {
      const text = siblings[i].textContent.trim();
      if (text) {
        return text;
      }
    }
  }

  // Traverse parent hierarchy
  let currentElement = element;
  while (currentElement) {
    try {
      // 1. Check for label using 'aria-labelledby'
      const labelId = currentElement.getAttribute("aria-labelledby");
      if (labelId) {
        const labelElement = document.getElementById(labelId.split(" ")[0]); // Use the first ID
        if (labelElement && labelElement.textContent.trim()) {
          return labelElement.textContent.trim();
        }
      }

      // Handle radio buttons
      if (element.type === "radio") {
        const value = element.getAttribute("value");
        if (value && value.trim()) {
          return "Radio: " + value.trim();
        }
      }

      // 2. Check for direct text in <span> or other visible elements
      const spanText = currentElement.querySelector("span");
      if (spanText && spanText.textContent.trim()) {
        return spanText.textContent.trim();
      }

      // 3. Traverse up the parent hierarchy for meaningful text
      if (currentElement.textContent.trim()) {
        return currentElement.textContent.trim();
      }

      // Move to parent element if no text is found
      currentElement = currentElement.parentElement;
    } catch (e) {
      console.error("Error:", e);
      break; // Exit loop on error
    }
  }

  return "No visible text"; // Return if no text is found
}

// Function to generate XPath dynamically
function getXPath(element) {
  // If the element has an 'id', return the XPath based on the 'id'
  if (element.id) {
    return `//*[@id="${element.id}"]`;
  }

  // If the element is the 'body' tag, return its path
  if (element === document.body) {
    return "/html/" + element.tagName.toLowerCase();
  }

  let index = 1; // Initialize index for the element
  let siblings = element.parentNode.children; // Use 'children' to get element siblings only

  // Iterate through siblings to calculate the index of the current element
  for (let i = 0; i < siblings.length; i++) {
    let sibling = siblings[i];

    // If the sibling matches the current element, build the XPath
    if (sibling === element) {
      return (
        getXPath(element.parentNode) +
        "/" +
        element.tagName.toLowerCase() +
        "[" +
        index +
        "]"
      );
    }

    // Increment index if the sibling is of the same tag type
    if (sibling.tagName === element.tagName) {
      index++;
    }
  }
}

// Monitor outer DOM changes using MutationObserver
function monitorDOM() {
  if (observer) observer.disconnect(); // Clear any previous observer

  observer = new MutationObserver((mutations) => {
    if (!isRecording) return; // Stop processing if not recording
  });

  // Start observing the entire body for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true, // Observe all descendants
  });
}

// Initialize the extension when the page loads
initializeExtension();
