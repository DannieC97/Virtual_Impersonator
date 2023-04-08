const loginForm = document.querySelector('#form-signIn'); // select the login form

if (sessionStorage.getItem('isLoggedIn')){
  window.location.href = 'index.html'
}

loginForm.addEventListener('submit', async (e) => { // add a submit event listener to the form
  e.preventDefault(); // prevent default form submission behavior
  
  const email = document.querySelector('#username-signin').value; // get the entered email
  const password = document.querySelector('#password-signin').value; // get the entered password
  
  const response = await fetch('/login', { // send a POST request to the server to login the user
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ // send the user data in JSON format in the request body
      email,
      password
    })
  });
  
  const dataSignIn = await response.json(); // parse the response data as JSON
  console.log(dataSignIn)
  
  // if(response.redirected){
  //   window.location.href = response.url;
  // }
  if (response.ok) { // if the response status code is ok (200-299)
    alert(dataSignIn.message); // show a success message to the user
    sessionStorage.setItem('isLoggedIn', true);
    sessionStorage.setItem('username', dataSignIn.username); // store the username in session storage
    window.location.href = 'index.html'; // redirect the user to the dashboard page
    
  } else {
    alert(dataSignIn.error); // show an error message to the user
  }
});

