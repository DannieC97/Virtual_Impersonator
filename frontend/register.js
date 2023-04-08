
const registerForm = document.querySelector('#register-form'); // select the register form

if (sessionStorage.getItem('isLoggedIn')){
  window.location.href = 'index.html'
}

registerForm.addEventListener('submit', async (e) => { // add a submit event listener to the form
  e.preventDefault(); // prevent default form submission behavior
  
  const username = document.querySelector('#username').value; // get the entered username
  const password = document.querySelector('#password').value; // get the entered password
  const email = document.querySelector('#email').value; // get the entered email
  
  const response = await fetch('/register', { // send a POST request to the server to register a new user
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ // send the user data in JSON format in the request body
      username,
      password,
      email
    })
  });
  
  const data = await response.json(); // parse the response data as JSON
  
   // display the response message as an alert
  if (response.ok) { // if the response status code is ok (200-299)
    alert(data.message); // show a success message to the user
    window.location.href = 'login.html'; // redirect the user to the dashboard page
  } else {
    alert(data.message); // show an error message to the user
  }
});

