const logoutBtn = document.querySelector('#logout-btn');

        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.clear(); // clear the stored user data
            sessionStorage.clear();
            window.location.href = "index.html"; // redirect to registration page
        });
        const username = sessionStorage.getItem('username');
document.querySelector('#username-dashboard').textContent = username;