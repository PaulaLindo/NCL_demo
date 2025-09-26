/**
 * Booking Form Handler
 * Manages the service booking form functionality
 */

class BookingFormManager {
    constructor() {
        this.form = null;
        this.submitBtn = null;
        this.services = [
            { 
                id: '1', 
                name: 'Standard Cleaning', 
                basePrice: 280,
                estimatedDuration: '2-3 hours',
                description: 'Regular maintenance cleaning'
            },
            { 
                id: '2', 
                name: 'Deep Cleaning', 
                basePrice: 600,
                estimatedDuration: '4-6 hours',
                description: 'Comprehensive deep cleaning service'
            },
            { 
                id: '3', 
                name: 'Move-In/Out Cleaning', 
                basePrice: 800,
                estimatedDuration: '6-8 hours',
                description: 'Complete cleaning for moving'
            },
        ];
        this.selectedService = null;
        this.priceMultipliers = {
            small: 0.8,
            medium: 1.0,
            large: 1.3
        };
        
        this.init();
    }

    /**
     * Initialize the booking form
     */
    init() {
        this.cacheElements();
        this.loadSelectedService();
        this.bindEvents();
        this.setMinDate();
        this.validateForm();
    }

    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.form = document.getElementById('bookingForm');
        this.submitBtn = document.getElementById('continueBtn');
        this.serviceTitleEl = document.querySelector('.service-title');
        this.servicePriceEl = document.querySelector('.service-price');
        this.homeSizeSelect = document.getElementById('home-size');
        this.dateInput = document.getElementById('booking-date');
        this.timeSelect = document.getElementById('preferred-time');
        this.instructionsTextarea = document.getElementById('special-instructions');
    }

    /**
     * Load and display selected service information
     */
    loadSelectedService() {
        try {
            // Get selected service from sessionStorage or use default
            const selectedServiceId = sessionStorage.getItem('selectedServiceId') || '1';
            this.selectedService = this.services.find(s => s.id === selectedServiceId) || this.services[0];
            
            this.updateServiceDisplay();
        } catch (error) {
            console.warn('Unable to load service from storage, using default:', error);
            this.selectedService = this.services[0];
            this.updateServiceDisplay();
        }
    }

    /**
     * Update service information display
     */
    updateServiceDisplay() {
        if (!this.selectedService) return;

        if (this.serviceTitleEl) {
            this.serviceTitleEl.textContent = this.selectedService.name;
        }

        this.updatePriceDisplay();
    }

    /**
     * Update price display based on selected options
     */
    updatePriceDisplay() {
        if (!this.selectedService || !this.servicePriceEl) return;

        const homeSize = this.homeSizeSelect?.value || 'medium';
        const multiplier = this.priceMultipliers[homeSize] || 1.0;
        const estimatedPrice = Math.round(this.selectedService.basePrice * multiplier);
        
        const priceLabel = this.servicePriceEl.querySelector('.price-label');
        const priceAmount = this.servicePriceEl.querySelector('.price-amount');
        const priceDetails = this.servicePriceEl.querySelector('.price-details');

        if (priceLabel && priceAmount && priceDetails) {
            priceLabel.textContent = 'Estimated price:';
            priceAmount.textContent = `R${estimatedPrice}`;
            priceDetails.textContent = `for ${this.getHomeSizeLabel(homeSize)}`;
        } else {
            // Fallback for simpler structure
            this.servicePriceEl.innerHTML = `
                <span class="price-label">Estimated price:</span>
                <span class="price-amount">R${estimatedPrice}</span>
                <span class="price-details">for ${this.getHomeSizeLabel(homeSize)}</span>
            `;
        }
    }

    /**
     * Get human-readable home size label
     */
    getHomeSizeLabel(size) {
        const labels = {
            small: '1-2BR',
            medium: '3-4BR', 
            large: '5+BR'
        };
        return labels[size] || '3-4BR';
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Form submission
        if (this.form) {
            this.form.addEventListener('submit', this.handleFormSubmit.bind(this));
        }

        // Real-time validation
        const inputs = this.form?.querySelectorAll('input, select, textarea');
        inputs?.forEach(input => {
            input.addEventListener('input', this.validateForm.bind(this));
            input.addEventListener('change', this.validateForm.bind(this));
        });

        // Home size change updates price
        if (this.homeSizeSelect) {
            this.homeSizeSelect.addEventListener('change', () => {
                this.updatePriceDisplay();
                this.validateForm();
            });
        }

        // Character count for textarea
        if (this.instructionsTextarea) {
            this.instructionsTextarea.addEventListener('input', this.updateCharacterCount.bind(this));
        }

        // Back button
        const backBtn = document.querySelector('.header-back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', this.handleBackNavigation.bind(this));
        }
    }

    /**
     * Set minimum date to today
     */
    setMinDate() {
        if (!this.dateInput) return;

        const today = new Date();
        const minDate = today.toISOString().split('T')[0];
        this.dateInput.setAttribute('min', minDate);
        
        // Set default date to tomorrow if current value is in the past
        const currentDate = new Date(this.dateInput.value);
        if (currentDate < today) {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            this.dateInput.value = tomorrow.toISOString().split('T')[0];
        }
    }

    /**
     * Update character count for textarea
     */
    updateCharacterCount() {
        if (!this.instructionsTextarea) return;

        const maxLength = parseInt(this.instructionsTextarea.getAttribute('maxlength')) || 500;
        const currentLength = this.instructionsTextarea.value.length;
        const remaining = maxLength - currentLength;

        let countElement = document.getElementById('char-count');
        if (!countElement) {
            countElement = document.createElement('div');
            countElement.id = 'char-count';
            countElement.className = 'character-count';
            this.instructionsTextarea.parentNode.appendChild(countElement);
        }

        countElement.textContent = `${currentLength}/${maxLength} characters`;
        countElement.style.color = remaining < 50 ? '#dc2626' : '#6b7280';
    }

    /**
     * Validate form and update submit button state
     */
    validateForm() {
        if (!this.form || !this.submitBtn) return;

        const formData = new FormData(this.form);
        let isValid = true;
        const errors = [];

        // Check required fields
        const requiredFields = ['bookingDate', 'preferredTime', 'homeSize', 'recurringBooking'];
        requiredFields.forEach(field => {
            const value = formData.get(field);
            if (!value || value.trim() === '') {
                isValid = false;
                errors.push(`${field} is required`);
            }
        });

        // Validate date
        const selectedDate = new Date(formData.get('bookingDate'));
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
            isValid = false;
            errors.push('Booking date cannot be in the past');
        }

        // Update submit button
        this.submitBtn.disabled = !isValid;
        this.submitBtn.setAttribute('aria-describedby', isValid ? '' : 'form-errors');

        // Update button text based on state
        const btnText = this.submitBtn.querySelector('.btn-text');
        if (btnText) {
            btnText.textContent = isValid ? 'Continue to Payment' : 'Please complete all required fields';
        }

        return isValid;
    }

    /**
     * Handle form submission
     */
    async handleFormSubmit(event) {
        event.preventDefault();

        if (!this.validateForm()) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        try {
            this.setLoadingState(true);
            
            const formData = this.collectFormData();
            const bookingResult = await this.submitBooking(formData);
            
            if (bookingResult.success) {
                this.showNotification('Booking submitted successfully!', 'success');
                
                // Store booking data for next screen
                sessionStorage.setItem('pendingBooking', JSON.stringify(formData));
                
                // Redirect to payment or confirmation
                setTimeout(() => {
                    window.location.href = 'payment.html';
                }, 1500);
            } else {
                throw new Error(bookingResult.message || 'Failed to submit booking');
            }
        } catch (error) {
            console.error('Booking submission error:', error);
            this.showNotification('Failed to submit booking. Please try again.', 'error');
        } finally {
            this.setLoadingState(false);
        }
    }

    /**
     * Collect form data
     */
    collectFormData() {
        const formData = new FormData(this.form);
        
        return {
            serviceId: this.selectedService.id,
            serviceName: this.selectedService.name,
            bookingDate: formData.get('bookingDate'),
            preferredTime: formData.get('preferredTime'),
            homeSize: formData.get('homeSize'),
            specialInstructions: formData.get('specialInstructions') || '',
            recurringBooking: formData.get('recurringBooking'),
            estimatedPrice: this.calculateEstimatedPrice(),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Calculate estimated price
     */
    calculateEstimatedPrice() {
        const homeSize = this.homeSizeSelect?.value || 'medium';
        const multiplier = this.priceMultipliers[homeSize] || 1.0;
        return Math.round(this.selectedService.basePrice * multiplier);
    }

    /**
     * Submit booking (mock implementation)
     */
    async submitBooking(bookingData) {
        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(() => {
                // Mock success response
                resolve({
                    success: true,
                    bookingId: `BK${Date.now()}`,
                    message: 'Booking submitted successfully'
                });
            }, 1500);
        });
    }

    /**
     * Set loading state for submit button
     */
    setLoadingState(isLoading) {
        if (!this.submitBtn) return;

        const btnText = this.submitBtn.querySelector('.btn-text');
        const btnIcon = this.submitBtn.querySelector('.btn-icon');

        if (isLoading) {
            this.submitBtn.disabled = true;
            this.submitBtn.classList.add('loading');
            if (btnText) btnText.textContent = 'Processing...';
            if (btnIcon) btnIcon.textContent = '⏳';
        } else {
            this.submitBtn.disabled = false;
            this.submitBtn.classList.remove('loading');
            if (btnText) btnText.textContent = 'Continue to Payment';
            if (btnIcon) btnIcon.textContent = '→';
        }
    }

    /**
     * Show notification to user
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: '9999',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            backgroundColor: type === 'error' ? '#dc2626' : type === 'success' ? '#059669' : '#3b82f6'
        });

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    /**
     * Handle back navigation
     */
    handleBackNavigation(event) {
        event.preventDefault();
        
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = 'services.html';
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new BookingFormManager();
});