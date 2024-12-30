document.getElementById('startRecording').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'startRecording' }, (response) => {
      console.log('Recording started:', response);
      document.getElementById('stopRecording').disabled = false;
    });
  });
  
  document.getElementById('stopRecording').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'stopRecording' }, (response) => {
      console.log('Recording stopped:', response);
      document.getElementById('stopRecording').disabled = true;
    });
  });
  