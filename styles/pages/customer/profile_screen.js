document.addEventListener('DOMContentLoaded', () => {
    const currentUser = getLoggedInUser();
    if (!currentUser) {
        window.location.href = 'login_screen.html';
        return;
    }

    // Display user's name and email.
    document.querySelector('.profile-header h3').textContent = currentUser.name;
    document.querySelector('.profile-header p').textContent = currentUser.email;

    // Handle sign-out button click.
    const signOutBtn = document.querySelector('.sign-out-btn');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', () => {
            clearLoggedInUser();
            window.location.href = 'login_screen.html';
        });
    }
});