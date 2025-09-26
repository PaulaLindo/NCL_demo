/**
 * Modern Login Screen Handler
 * Handles user authentication with enhanced UX and error handling
 */

class LoginManager {
    constructor() {
        this.elements = {};
        this.validationRules = {
            email: {
                required: true,
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Please enter a valid email address'
            },
            password: {
                required: true,
                minLength: 1,
                message: 'Password is required'
            }
        };
        
        // Mock credentials for demo
        this.validCredentials = {
            email: 'user@example.com',
            password: 'password'
        };
        
        this.init();
    }

    init() {
        if (this.checkExistingSession()) return;
        
        this.cacheElements();
        this.bindEvents();
        this.setupAccessibility();
    }

    checkExistingSession() {
        if (getLoggedInUser()) {
            this.redirectToHome();
            return true;
        }
        return false;
    }

    cacheElements() {
        this.elements = {
            form: document.querySelector('.login-form'),
            emailInput: document.getElementById('email-input'),
            passwordInput: document.getElementById('password-input'),
            togglePasswordBtn: document.getElementById('toggle-password'),
            loginButton: document.querySelector('.login-button'),
            errorEmail: document.getElementById('error-email'),
            errorPassword: document.getElementById('error-password')
        };

        // Validate that all required elements exist
        const requiredElements = ['form', 'emailInput', 'passwordInput', 'loginButton', 'errorEmail', 'errorPassword'];
        const missingElements = requiredElements.filter(key => !this.elements[key]);
        
        if (missingElements.length > 0) {
            console.error('Missing required elements:', missingElements);
            return false;
        }
        
        return true;
    }

    bindEvents() {
        // Form submission
        this.elements.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Password toggle
        if (this.elements.togglePasswordBtn) {
            this.elements.togglePasswordBtn.addEventListener('click', () => this.togglePasswordVisibility());
        }
        
        // Real-time validation
        this.elements.emailInput.addEventListener('blur', () => this.validateField('email'));
        this.elements.passwordInput.addEventListener('blur', () => this.validateField('password'));
        
        // Clear errors on input
        this.elements.emailInput.addEventListener('input', () => this.clearError('email'));
        this.elements.passwordInput.addEventListener('input', () => this.clearError('password'));
        
        // Enter key handling
        this.elements.emailInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.elements.passwordInput.focus();
            }
        });
        
        this.elements.passwordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.elements.form.dispatchEvent(new Event('submit'));
            }
        });
    }

    setupAccessibility() {
        // Enhance form accessibility
        this.elements.form.setAttribute('novalidate', 'true');
        
        // Set up ARIA relationships
        this.elements.emailInput.setAttribute('aria-describedby', 'error-email');
        this.elements.passwordInput.setAttribute('aria-describedby', 'error-password');
        
        // Announce errors to screen readers
        this.elements.errorEmail.setAttribute('aria-live', 'polite');
        this.elements.errorPassword.setAttribute('aria-live', 'polite');
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        if (this.elements.loginButton.classList.contains('loading')) return;
        
        const formData = this.getFormData();
        const validation = this.validateForm(formData);
        
        if (!validation.isValid) {
            this.displayErrors(validation.errors);
            this.focusFirstError();
            return;
        }
        
        await this.attemptLogin(formData);
    }

    getFormData() {
        return {
            email: this.elements.emailInput.value.trim(),
            password: this.elements.passwordInput.value.trim()
        };
    }

    validateForm(data) {
        const errors = {};
        let isValid = true;

        // Validate email
        const emailValidation = this.validateEmail(data.email);
        if (!emailValidation.isValid) {
            errors.email = emailValidation.message;
            isValid = false;
        }

        // Validate password
        const passwordValidation = this.validatePassword(data.password);
        if (!passwordValidation.isValid) {
            errors.password = passwordValidation.message;
            isValid = false;
        }

        return { isValid, errors };
    }

    validateEmail(email) {
        if (!email) {
            return { isValid: false, message: 'Email address is required' };
        }
        
        if (!this.validationRules.email.pattern.test(email)) {
            return { isValid: false, message: 'Please enter a valid email address' };
        }
        
        return { isValid: true };
    }

    validatePassword(password) {
        if (!password) {
            return { isValid: false, message: 'Password is required' };
        }
        
        return { isValid: true };
    }

    validateField(fieldName) {
        const value = this.elements[`${fieldName}Input`].value.trim();
        let validation;

        switch (fieldName) {
            case 'email':
                validation = this.validateEmail(value);
                break;
            case 'password':
                validation = this.validatePassword(value);
                break;
            default:
                return;
        }

        if (!validation.isValid) {
            this.displayError(fieldName, validation.message);
        } else {
            this.clearError(fieldName);
        }
    }

    async attemptLogin(data) {
        this.setLoadingState(true);
        
        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Check credentials
            if (this.validateCredentials(data)) {
                this.handleSuccessfulLogin(data);
            } else {
                this.handleFailedLogin(data);
            }
        } catch (error) {
            console.error('Login error:', error);
            this.displayError('password', 'An unexpected error occurred. Please try again.');
        } finally {
            this.setLoadingState(false);
        }
    }

    validateCredentials(data) {
        return data.email === this.validCredentials.email && 
               data.password === this.validCredentials.password;
    }

    handleSuccessfulLogin(data) {
        const mockUser = {
            name: 'Sharon',
            email: data.email,
            type: 'customer',
            loginTime: new Date().toISOString()
        };
        
        setLoggedInUser(mockUser);
        this.showSuccessMessage();
        
        // Redirect after brief success indication
        setTimeout(() => {
            this.redirectToHome();
        }, 500);
    }

    handleFailedLogin(data) {
        // Clear all previous errors
        this.clearError('email');
        this.clearError('password');

        const errors = {};
        
        //Check email against the valid credential
        if (data.email !== this.validCredentials.email) {
            errors.email = 'Email address not found';
        }
        
        // Check password against the valid credential
        if (data.password !== this.validCredentials.password) {
            // If email is correct but password is wrong, show a specific password error
            if (data.email === this.validCredentials.email) {
                errors.password = 'Incorrect password.';
            } else {
                // Otherwise, show a generic error to prevent user from guessing which is wrong
                errors.password = 'Incorrect email address or password.';
            }
        }
        
        this.displayErrors(errors);
        this.focusFirstError();
        
        // Add shake animation for failed attempt
        this.elements.form.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            this.elements.form.style.animation = '';
        }, 500);
    }

    displayErrors(errors) {
        Object.keys(errors).forEach(field => {
            this.displayError(field, errors[field]);
        });
    }

    displayError(field, message) {
        const errorElement = this.elements[`error${field.charAt(0).toUpperCase() + field.slice(1)}`];
        const inputElement = this.elements[`${field}Input`];
        
        if (errorElement && inputElement) {
            errorElement.textContent = message;
            inputElement.setAttribute('aria-invalid', 'true');
            inputElement.classList.add('error');
            
            // Announce error to screen readers
            errorElement.setAttribute('role', 'alert');
        }
    }

    clearError(field) {
        const errorElement = this.elements[`error${field.charAt(0).toUpperCase() + field.slice(1)}`];
        const inputElement = this.elements[`${field}Input`];
        
        if (errorElement && inputElement) {
            errorElement.textContent = '';
            inputElement.setAttribute('aria-invalid', 'false');
            inputElement.classList.remove('error');
            errorElement.removeAttribute('role');
        }
    }

    focusFirstError() {
        const errorFields = ['email', 'password'];
        
        for (const field of errorFields) {
            const errorElement = this.elements[`error${field.charAt(0).toUpperCase() + field.slice(1)}`];
            if (errorElement && errorElement.textContent) {
                this.elements[`${field}Input`].focus();
                break;
            }
        }
    }

    togglePasswordVisibility() {
        const input = this.elements.passwordInput;
        const button = this.elements.togglePasswordBtn;
        const toggleText = button.querySelector('.toggle-text');
        
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        
        if (toggleText) {
            toggleText.textContent = isPassword ? 'Hide' : 'Show';
        }
        
        button.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
        
        // Maintain focus on input after toggle
        input.focus();
    }

    setLoadingState(isLoading) {
        const button = this.elements.loginButton;
        const buttonText = button.querySelector('.button-text');
        
        if (isLoading) {
            button.classList.add('loading');
            button.disabled = true;
            if (buttonText) {
                buttonText.textContent = 'Signing In...';
            }
        } else {
            button.classList.remove('loading');
            button.disabled = false;
            if (buttonText) {
                buttonText.textContent = 'Sign In';
            }
        }
    }

    showSuccessMessage() {
        const button = this.elements.loginButton;
        const buttonText = button.querySelector('.button-text');
        
        if (buttonText) {
            buttonText.textContent = 'Success!';
            button.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        }
    }

    redirectToHome() {
        window.location.href = 'home_screen.html';
    }
}

// Enhanced error handling and initialization
document.addEventListener('DOMContentLoaded', () => {
    try {
        new LoginManager();
    } catch (error) {
        console.error('Failed to initialize login manager:', error);
        
        // Fallback basic functionality
        const form = document.querySelector('.login-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                alert('Login functionality is temporarily unavailable. Please try again later.');
            });
        }
    }
});

// Add CSS for shake animation and error states
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
    
    .form-input.error {
        border-color: var(--red-status);
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }
    
    .form-input.error:focus {
        border-color: var(--red-status);
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
    }
`;
document.head.appendChild(style);