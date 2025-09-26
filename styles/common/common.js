// This file will contain functions and data used across all pages.
// You can store user data in localStorage to persist it between pages.

function getLoggedInUser() {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
}

function setLoggedInUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
}

function clearLoggedInUser() {
    localStorage.removeItem('currentUser');
}

// Function to handle showing/hiding navigation based on login status.
function updateNavigation() {
    const bottomNav = document.querySelector('.bottom-nav');
    if (getLoggedInUser()) {
        if (bottomNav) {
            bottomNav.style.display = 'flex';
        }
    } else {
        if (bottomNav) {
            bottomNav.style.display = 'none';
        }
    }
}