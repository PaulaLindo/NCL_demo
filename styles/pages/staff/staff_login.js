/**
 * NCL Staff Timekeeping Login Handler
 * Handles staff authentication using Staff ID and PIN.
 * Uses mock credentials for demo purposes.
 * Now includes robust helper methods mirroring the customer LoginManager.
 */

class StaffLoginManager {
    constructor() {
        this.elements = {};
        // MOCK CREDENTIALS: Use these Staff ID and PINs for testing
        this.validCredentials = {
            'staff001': { id: 'staff001', name: 'Sarah Mitchell', role: 'Cleaner', pin: '1234' },
            'staff002': { id: 'staff002', name: 'David Johnson', role: 'Supervisor', pin: '4321' },
            'staff003': { id: 'staff003', name: 'Thandi Zulu', role: 'Cleaner', pin: '5555' },
            'staff004': { id: 'staff004', name: 'Rajesh Singh', role: 'Driver', pin: '6789' }
        };

        this.init();
    }

    init() {
        // Use global function from common.js to check if a user is already logged in
        const user = getLoggedInUser(); // Fetch user once

        // MODIFIED LOGIC: Only redirect if user exists AND is explicitly staff.
        if (user && user.isStaff) {
            this.redirectToStaffApp(); 
            return;
        }
        
        this.cacheElements();
        this.bindEvents();
    }

    cacheElements() {
        this.elements = {
            // Ensure these IDs match staff_login.html
            form: document.getElementById('staff-login-form'),
            staffIdInput: document.getElementById('staff-id-input'),
            passwordInput: document.getElementById('password-input'),
            togglePasswordBtn: document.getElementById('toggle-password'),
            loginButton: document.getElementById('login-button'),
            // Selectors for nested button elements (CRITICAL for button UX)
            buttonText: document.querySelector('#login-button .button-text'),
            spinner: document.querySelector('#login-button .loading-spinner'),
            staffIdError: document.getElementById('staff-id-error'),
            passwordError: document.getElementById('password-error')
        };
    }

    bindEvents() {
        if (this.elements.form) {
            this.elements.form.addEventListener('submit', this.handleFormSubmit.bind(this));
        }
        if (this.elements.togglePasswordBtn) {
            this.elements.togglePasswordBtn.addEventListener('click', this.togglePasswordVisibility.bind(this));
        }
    }

    // --- REUSABLE UTILITY METHODS (Adopted from LoginManager) ---

    // CRITICAL FIX: Add missing clearErrors function (was causing previous error)
    clearErrors() {
        this.elements.staffIdInput?.classList.remove('error');
        this.elements.passwordInput?.classList.remove('error');
        this.elements.loginButton?.classList.remove('shake');
        
        if (this.elements.staffIdError) this.elements.staffIdError.textContent = '';
        if (this.elements.passwordError) this.elements.passwordError.textContent = '';
    }

    // CRITICAL FIX: Implement robust setLoading function
    setLoading(isLoading) {
        this.elements.loginButton.disabled = isLoading;
        
        // Handle spinner visibility (Fixes the 'null' reading 'style' error if element is missing)
        if (this.elements.spinner) { 
            this.elements.spinner.style.display = isLoading ? 'inline-block' : 'none';
        }

        // Handle button text and state
        this.elements.buttonText.textContent = isLoading ? 'Processing...' : 'Log In';
        
        this.elements.loginButton.classList.remove('btn-success', 'btn-danger', 'shake'); 

        // Clear errors when starting a new loading cycle
        if (isLoading) {
            this.clearErrors();
        }
    }
    
    // CRITICAL FIX: Implement a centralized showError function
    showError(inputElement, errorElement, message) {
        inputElement?.classList.add('error');
        if (errorElement) {
            errorElement.textContent = message;
        }
        this.elements.loginButton?.classList.add('shake');
        this.elements.loginButton?.classList.add('btn-danger');
    }

    togglePasswordVisibility() {
        const passwordInput = this.elements.passwordInput;
        const toggleBtn = this.elements.togglePasswordBtn;
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleBtn.querySelector('.toggle-text').textContent = 'Hide';
            toggleBtn.setAttribute('aria-label', 'Hide password');
        } else {
            passwordInput.type = 'password';
            toggleBtn.querySelector('.toggle-text').textContent = 'Show';
            toggleBtn.setAttribute('aria-label', 'Show password');
        }
    }

    // --- STAFF-SPECIFIC LOGIC ---

    async handleFormSubmit(event) {
        event.preventDefault();
        this.setLoading(true);

        const staffId = this.elements.staffIdInput.value.trim();
        const pin = this.elements.passwordInput.value;

        // 1. Client-Side Validation (Basic)
        if (!staffId || !pin) {
            this.setLoading(false);
            if (!staffId) this.showError(this.elements.staffIdInput, this.elements.staffIdError, 'Staff ID is required.');
            if (!pin) this.showError(this.elements.passwordInput, this.elements.passwordError, 'PIN is required.');
            return;
        }

        // 2. Mock Authentication Check
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay

        const user = this.validCredentials[staffId];

        if (user && user.pin === pin) {
            this.handleSuccess(user);
        } else {
            this.handleFailure();
        }

        this.setLoading(false); // Reset loading state
    }

    handleSuccess(user) {
        this.elements.buttonText.textContent = 'Success!';
        this.elements.loginButton.classList.add('btn-success'); 
        
        // 1. Set global user session using common.js function
        if (typeof setLoggedInUser !== 'undefined') {
            setLoggedInUser({ 
                ...user,
                isStaff: true // Mark as staff
            }); 
        }

        // 2. Redirect after a small delay, checking the session again. 
        setTimeout(() => { 
        if (typeof getLoggedInUser !== 'undefined' && getLoggedInUser()?.isStaff) { this.redirectToStaffApp(); 

        } else { 
        Logger.error('Login session failed to save, not redirecting.');
        } 
    }, 500);
    }

    handleFailure() {
        this.elements.buttonText.textContent = 'Log In'; // Reset button text
        this.elements.loginButton.classList.remove('btn-success'); 
        // Use the new showError to highlight both fields for security/simplicity
        this.showError(this.elements.passwordInput, this.elements.passwordError, 'Invalid Staff ID or PIN.');
        this.showError(this.elements.staffIdInput, this.elements.staffIdError, 'Invalid Staff ID or PIN.');
    }

    redirectToStaffApp() {
        // Redirect to the main staff app area
        window.location.href = 'timekeeping.html'; 
    }
}

// timekeeping.js

// ... (Keep existing code above) ...

// Placeholder Staff Data (can be removed later as staff name is auto-populated)
const STAFF_MEMBERS = [
    { id: "staff001", name: "Sarah Mitchell", role: "Cleaner" },
    // ...
];

// Define the function that auto-populates the staff member
function populateStaffDropdowns() {
    // getLoggedInUser is a global function exported from common.js
    const currentUser = getLoggedInUser(); 
    
    // Safety check - though checkLoginStatus() should prevent this
    if (!currentUser || !currentUser.isStaff) {
        console.warn('Attempted to populate staff input without a logged-in staff member.');
        return; 
    }

    // --- 1. Auto-Populate Staff Member Name ---
    // Target the container that holds the staff selection element in your HTML
    // You should use this ID for the container element in timekeeping.html's Manual Tab
    const staffInputContainer = document.getElementById('staff-member-input-container'); 
    
    if (staffInputContainer) {
        // Replace the dropdown HTML with a static text display
        staffInputContainer.innerHTML = `
            <div class="form-group staff-auto-populated">
                <label for="staff-name-display" class="form-label">Staff Member</label>
                <p id="staff-name-display" class="input-display">${currentUser.name}</p>
                <input type="hidden" id="manual-staff-id" name="staffId" value="${currentUser.id}">
            </div>
        `;
    }
    
    // --- 2. Populate Job Assignment Dropdown ---
    // Keep the Job Assignment dropdown dynamic
    const jobSelect = document.getElementById('job-assignment-dropdown');
    
    // MOCK JOB DATA: Replace this with your actual job retrieval API call later
    const MOCK_JOBS = [
        { id: "job001", name: "Deep Cleaning - Smith Residence" },
        { id: "job002", name: "Standard Cleaning - Jones Apartment" },
        { id: "job003", name: "Window Washing - Corporate HQ" }
    ];
    
    if (jobSelect) {
        jobSelect.innerHTML = '<option value="" disabled selected>Select a Job</option>';
        MOCK_JOBS.forEach(job => {
            jobSelect.innerHTML += `<option value="${job.id}">${job.name}</option>`;
        });
    }
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    try {
        new StaffLoginManager();
    } catch (error) {
        console.error('Failed to initialize Staff Login Manager:', error);
        // Fallback for extreme failure
        const form = document.getElementById('staff-login-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                alert('Login functionality is temporarily unavailable. Check console for errors.');
            });
        }
    }
});

