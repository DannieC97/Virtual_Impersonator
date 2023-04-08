// Assign variables to several HTML elements
let charCount = document.getElementById('char-count');
const audioBtn = document.querySelector('.audio-btn');
const inputText = document.querySelector(".input-text");
const noCharsLeft = document.querySelector('.no-chars-left');
const clearTextarea = document.getElementById('clearTextarea');
const myTextarea = document.getElementById('myTextarea');
let starterName = "Joe Rogan"; // Set a default starter name
let rephraseSwitch = false; // Set a default value for the rephrase switch
getAsync('/info'); // Retrieve character count information from the server

// Check if the character count is less than or equal to zero
if (charCount <= 0) {
  // Disable the audio button and display an error message
  audioBtn.classList.add('disabled');
  noCharsLeft.innerHTML = "I'm sorry, but this application is currently unavailable because I need to purchase more space. If you're interested in using it, please feel free to message me using the link provided in the footer.";
}

// Add an event listener to the AI switch to toggle the rephrase switch
const aiSwitch = document.getElementById("ai-switch");
aiSwitch.addEventListener("change", function() {
  if (this.checked) {
    rephraseSwitch = true;
  } else {
    rephraseSwitch = false;
  }
});

// Function to show or hide the 'x' button
function toggleClearIcon() {
  if (myTextarea.value.trim() === '') {
    clearTextarea.classList.add('hidden');
  } else {
    clearTextarea.classList.remove('hidden');
  }
}

// Add event listeners for text area changes and the 'clear' button click
myTextarea.addEventListener('input', toggleClearIcon);
clearTextarea.addEventListener('click', function() {
  myTextarea.value = '';
  toggleClearIcon();
  var charCount = document.querySelector("#char-count-text");
  charCount.textContent = "0" + " / " + "300";
  myTextarea.focus();
});

// Initialize the clear icon state
toggleClearIcon();

// Initialize tooltips and add tooltip text to a question mark icon
$(document).ready(function() {
  $('[data-toggle="tooltip"]').tooltip();
  $('.ai-icon').attr('title', 'hello');
});

// Check if the user is logged in
if (sessionStorage.getItem('isLoggedIn')) {
  // Replace the login link with the user's name and change the text of the 'register' button to 'Log out'
  const link = document.querySelector('.login-btn');
  const text = document.createTextNode('Logged in as ' + sessionStorage.getItem('username'));
  const span = document.createElement('span'); // Create a span element
  span.className = 'cent'; // Add a class to the span element
  span.appendChild(text); // Append the text node to the span element
  link.replaceWith(span); // Replace the link element with the span element
  
  const signOutLink = document.querySelector('.register-btn');
  signOutLink.innerHTML = 'Log out';

  // Add an event listener to the 'register' button to log out the user
  const logoutBtn = document.querySelector('.register-btn');
  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.clear(); // Clear the stored user data
    sessionStorage.clear();
    alert("Logged out Successfully");
    window.location.href = "index.html"; // Redirect to registration page
  });
}

// Function to retrieve new text from the server
async function getNewText() {
  const response = await fetch('/getText', {
    method: 'GET',
  });
  const data = await response.json();
  inputText.value = data;
}



const audioContainer = document.getElementById('audio-container');

// Add an event listener to the 'Create Audio' button
audioBtn.addEventListener('click', async (e) => {
  const spinner = document.createElement('span');
  spinner.classList.add('spinner-border', 'spinner-border-sm', 'me-2');
  audioBtn.innerHTML = '';
  audioBtn.appendChild(spinner);
  audioBtn.appendChild(document.createTextNode('Loading'));

  audioBtn.classList.add('disabled');

  const text = inputText.value;
  const name = starterName;

  try {
    // Send a POST request to the server to retrieve the audio file
    const response = await fetch('/getAudio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, text, rephraseSwitch }),
    });
    if (rephraseSwitch) {
      await getNewText();
    }

    // Convert the response into a blob and create a URL for the audio file
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    // Remove any previously created audio elements and create a new one
    const oldAudioElement = document.getElementById('my-audio');
    if (oldAudioElement) {
      oldAudioElement.remove();
    }
    const audioElement = new Audio();
    audioElement.id = 'my-audio';
    audioElement.controls = true;

    // Add event listeners to the audio element
    audioElement.addEventListener('loadedmetadata', () => {
      audioElement.currentTime = 0;
    }, { once: true });

    audioElement.addEventListener('canplaythrough', () => {
      audioElement.play();
    }, { once: true });

    // Set the audio source to the created URL and append the audio element to the audio container
    audioElement.src = url;
    audioContainer.appendChild(audioElement);

  } catch (error) {
    console.error(error);
  }

  // Re-enable the 'Create Audio' button and call the checkLength() function
  audioBtn.innerHTML = '';
  audioBtn.appendChild(document.createTextNode('Create Audio'));
  audioBtn.classList.remove('disabled');
  checkLength();
});

// Function to check character limit and display error message if it is exceeded
function checkLength() {
  // Get character limit from server
  getAsync('/info');
  // Set maximum character limit to 300
  var maxLength = 300;
  // Get input textarea element
  var textArea = document.querySelector(".input-text");
  // Get character count element
  var charCount = document.querySelector("#char-count-text");
  // Get current length of input text
  var currentLength = textArea.value.length;
  
  if (currentLength >= maxLength) {
    // If character limit is exceeded, display error message and trim input text
    textArea.value = textArea.value.substring(0, maxLength);
    textArea.classList.add("textarea-error");
    charCount.classList.add("textarea-error-message");
    charCount.textContent = "Maximum character limit reached";
  } else {
    // Otherwise, remove error message and display current character count
    textArea.classList.remove("textarea-error");
    charCount.classList.remove("textarea-error-message");
    charCount.textContent = currentLength + " / " + maxLength;
  }
}
 

// Asynchronous function to fetch data from server and update character count element
async function getAsync(url) {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    
    // Update character count element with remaining characters
    charCount.textContent = (data.subscription.character_limit - data.subscription.character_count) - 300;
  } catch (error) {
    console.error(`Error fetching data: ${error}`);
  }
}

// Variable to hold reference to profile picture container element
const profilePics = document.querySelector('.row-profiles');
// Variable to hold currently selected profile picture
let currentProfilePic = null;

// Find the first profile picture and click it
const firstProfilePic = profilePics.querySelector('.profile-pic');
if (firstProfilePic) {
  firstProfilePic.click();
  currentProfilePic = firstProfilePic;
}

// Add click event listener to profile picture container element
profilePics.addEventListener('click', (event) => {
  // Find closest profile picture element that was clicked
  const clickedProfilePic = event.target.closest('.profile-pic');

  if (clickedProfilePic) {
    // If a profile picture is clicked, remove "clicked" class from previous selection
    if (currentProfilePic) {
      currentProfilePic.classList.remove('clicked');
    }

    // Add "clicked" class to selected profile picture and update starter name variable
    clickedProfilePic.classList.add('clicked');
    currentProfilePic = clickedProfilePic;
    starterName = currentProfilePic.getAttribute('data-name');
    console.log(starterName)
  }
});
//speech recognizion
let recognition;
let recognizing = false;

function initSpeechRecognition() {
  if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = function() {
      recognizing = true;
      document.getElementById('microphoneIcon').style.backgroundImage = 'none'; // Remove the microphone icon
      document.getElementById('microphoneIcon').classList.add('red-blinking-circle');
    };

    recognition.onerror = function(event) {
      console.error(event.error);
    };
    
    recognition.onend = function() {
      recognizing = false;
      document.getElementById('microphoneIcon').style.backgroundImage = 'url(/imgs/microphone.png)'; // Restore the microphone icon
      document.getElementById('microphoneIcon').classList.remove('red-blinking-circle');
    };

    recognition.onresult = function(event) {
      let interim_transcript = '';
      let final_transcript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final_transcript += event.results[i][0].transcript;
        } else {
          interim_transcript += event.results[i][0].transcript;
        }
      }

      document.getElementById('myTextarea').value = final_transcript + interim_transcript;
      toggleClearIcon(); // Call the toggleClearIcon function here
    };
  } else {
    console.error('Speech recognition is not supported in this browser.');
  }
}

function toggleSpeechRecognition() {
  if (recognizing) {
    recognition.stop();
  } else {
    recognition.start();
  }
}

// Initialize speech recognition when the page loads
document.addEventListener('DOMContentLoaded', initSpeechRecognition);