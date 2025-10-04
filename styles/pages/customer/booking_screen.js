/**
 * Booking Screen Manager
 * Manages the bookings list and filtering functionality
 */

class BookingScreenManager {
    constructor() {
        this.bookings = [];
        this.filteredBookings = [];
        this.currentFilter = 'all';
        this.bookingsContainer = null;
        this.filterTabs = [];
        this.emptyState = null;
        
        this.init();
    }

    /**
     * Initialize the booking screen
     */
    init() {
        this.cacheElements();
        this.loadBookings();
        this.bindEvents();
        this.applyFilter(this.currentFilter);
    }

    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.bookingsContainer = document.getElementById('bookingsContainer');
        this.emptyState = document.getElementById('emptyState');
        this.filterTabs = document.querySelectorAll('.filter-tab');
        this.searchBtn = document.querySelector('.header-action-btn');
    }

    /**
     * Load bookings data
     */
    loadBookings() {
        // Mock booking data with more comprehensive information
        this.bookings = [
            {
                id: 'BK001',
                serviceName: 'Deep Cleaning',
                serviceType: 'cleaning',
                status: 'confirmed',
                category: 'upcoming',
                date: '2024-11-20',
                time: '10:00 AM',
                duration: '4 hours',
                address: '123 Marine Drive, Durban North',
                serviceProvider: 'Sarah Johnson',
                rating: null,
                price: 650,
                specialInstructions: 'Please focus on kitchen and bathrooms',
                createdAt: '2024-11-15T08:30:00Z',
                updatedAt: '2024-11-16T14:22:00Z'
            },
            {
                id: 'BK002',
                serviceName: 'Standard Cleaning',
                serviceType: 'cleaning',
                status: 'pending',
                category: 'upcoming',
                date: '2024-11-25',
                time: 'Morning Slot',
                duration: '2-3 hours',
                address: '456 Musgrave Road, Musgrave',
                serviceProvider: null,
                rating: null,
                price: 320,
                specialInstructions: '',
                createdAt: '2024-11-18T12:15:00Z',
                updatedAt: '2024-11-18T12:15:00Z'
            },
            {
                id: 'BK003',
                serviceName: 'Garden Services',
                serviceType: 'gardening',
                status: 'completed',
                category: 'completed',
                date: '2024-11-15',
                time: '2:00 PM - 4:00 PM',
                duration: '2 hours',
                address: '789 Morningside Drive',
                serviceProvider: 'Mike Thompson',
                rating: null,
                price: 280,
                specialInstructions: 'Hedge trimming and lawn mowing',
                createdAt: '2024-11-10T09:45:00Z',
                updatedAt: '2024-11-15T16:30:00Z'
            }
        ];

        // Check for any pending bookings from form submission
        this.checkPendingBookings();
    }

    /**
     * Check for pending bookings from session storage
     */
    checkPendingBookings() {
        try {
            const pendingBooking = sessionStorage.getItem('pendingBooking');
            if (pendingBooking) {
                const bookingData = JSON.parse(pendingBooking);
                
                // Add to bookings list with pending status
                const newBooking = {
                    id: `BK${Date.now()}`,
                    serviceName: bookingData.serviceName,
                    serviceType: 'cleaning',
                    status: 'pending',
                    category: 'upcoming',
                    date: bookingData.bookingDate,
                    time: this.formatTimeSlot(bookingData.preferredTime),
                    address: 'Your Selected Address', // Would come from user profile
                    serviceProvider: null,
                    price: bookingData.estimatedPrice,
                    specialInstructions: bookingData.specialInstructions,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                this.bookings.unshift(newBooking);
                sessionStorage.removeItem('pendingBooking');
            }
        } catch (error) {
            console.warn('Error checking pending bookings:', error);
        }
    }

    /**
     * Format time slot for display
     */
    formatTimeSlot(timeSlot) {
        const timeSlots = {
            morning: 'Morning (8:00 - 12:00)',
            afternoon: 'Afternoon (12:00 - 16:00)',
            flexible: 'Flexible timing'
        };
        return timeSlots[timeSlot] || timeSlot;
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Filter tabs
        this.filterTabs.forEach(tab => {
            tab.addEventListener('click', this.handleFilterChange.bind(this));
        });

        // Search functionality
        if (this.searchBtn) {
            this.searchBtn.addEventListener('click', this.handleSearch.bind(this));
        }

        // Dynamic action buttons (using event delegation)
        if (this.bookingsContainer) {
            this.bookingsContainer.addEventListener('click', this.handleBookingAction.bind(this));
        }

        // Keyboard navigation
        document.addEventListener('keydown', this.handleKeyNavigation.bind(this));
    }

    /**
     * Handle filter tab changes
     */
    handleFilterChange(event) {
        const filterValue = event.target.getAttribute('data-filter');
        
        // Update active tab
        this.filterTabs.forEach(tab => {
            tab.classList.remove('active');
            tab.setAttribute('aria-selected', 'false');
        });
        
        event.target.classList.add('active');
        event.target.setAttribute('aria-selected', 'true');
        
        // Apply filter
        this.applyFilter(filterValue);
    }

    /**
     * Apply booking filter
     */
    applyFilter(filterValue) {
        this.currentFilter = filterValue;
        
        switch (filterValue) {
            case 'upcoming':
                this.filteredBookings = this.bookings.filter(booking => 
                    booking.category === 'upcoming'
                );
                break;
            case 'completed':
                this.filteredBookings = this.bookings.filter(booking => 
                    booking.category === 'completed'
                );
                break;
            case 'all':
            default:
                this.filteredBookings = [...this.bookings];
                break;
        }

        this.renderBookings();
    }

    /**
     * Render bookings list
     */
    renderBookings() {
        if (!this.bookingsContainer) return;

        // Clear container
        this.bookingsContainer.innerHTML = '';

        if (this.filteredBookings.length === 0) {
            this.showEmptyState();
            return;
        }

        this.hideEmptyState();

        // Render each booking
        this.filteredBookings.forEach((booking, index) => {
            const bookingElement = this.createBookingElement(booking, index);
            this.bookingsContainer.appendChild(bookingElement);
        });
    }

    /**
     * Create booking card element
     */
    createBookingElement(booking, index) {
        const article = document.createElement('article');
        article.className = 'booking-card';
        article.setAttribute('data-status', booking.status);
        article.setAttribute('data-category', booking.category);
        article.style.animationDelay = `${index * 0.05}s`;

        const statusClass = `status-${booking.status}`;
        const statusText = booking.status.charAt(0).toUpperCase() + booking.status.slice(1);
        
        article.innerHTML = `
            <div class="booking-header">
                <div class="booking-status ${statusClass}" role="status" aria-label="Booking ${statusText.toLowerCase()}">
                    <span class="status-dot"></span>
                    <span class="status-text">${statusText}</span>
                </div>
                <button class="booking-menu-btn" aria-label="Booking options" data-booking-id="${booking.id}">⋮</button>
            </div>
            
            <div class="booking-content">
                <h3 class="booking-title">${this.escapeHtml(booking.serviceName)}</h3>
                <div class="booking-details">
                    <div class="booking-info">
                        <span class="info-icon">📅</span>
                        <span class="info-text">${this.formatDate(booking.date)} • ${this.escapeHtml(booking.time)}</span>
                    </div>
                    <div class="booking-info">
                        <span class="info-icon">📍</span>
                        <span class="info-text">${this.escapeHtml(booking.address)}</span>
                    </div>
                    ${this.renderBookingInfoLine(booking)}
                </div>
            </div>

            <div class="booking-actions">
                ${this.renderActionButtons(booking)}
            </div>
        `;

        return article;
    }

    /**
     * Render additional booking info line based on status
     */
    renderBookingInfoLine(booking) {
        switch (booking.status) {
            case 'confirmed':
                return booking.serviceProvider ? `
                    <div class="booking-info">
                        <span class="info-icon">👤</span>
                        <span class="info-text">${this.escapeHtml(booking.serviceProvider)}</span>
                    </div>
                ` : '';
            case 'pending':
                return `
                    <div class="booking-info">
                        <span class="info-icon">⏳</span>
                        <span class="info-text">Awaiting confirmation</span>
                    </div>
                `;
            case 'completed':
                return `
                    <div class="booking-info">
                        <span class="info-icon">⭐</span>
                        <span class="info-text">${booking.rating ? `Rated ${booking.rating}/5` : 'Rate your experience'}</span>
                    </div>
                `;
            default:
                return '';
        }
    }

    /**
     * Render action buttons based on booking status
     */
    renderActionButtons(booking) {
        const baseViewButton = `
            <button class="action-btn primary-btn" data-action="view" data-booking-id="${booking.id}">
                <span class="btn-icon">👁️</span>
                <span class="btn-text">View Details</span>
            </button>
        `;

        switch (booking.status) {
            case 'confirmed':
                return baseViewButton + `
                    <button class="action-btn secondary-btn" data-action="reschedule" data-booking-id="${booking.id}">
                        <span class="btn-icon">📅</span>
                        <span class="btn-text">Reschedule</span>
                    </button>
                `;
            case 'pending':
                return baseViewButton + `
                    <button class="action-btn cancel-btn" data-action="cancel" data-booking-id="${booking.id}">
                        <span class="btn-icon">❌</span>
                        <span class="btn-text">Cancel</span>
                    </button>
                `;
            case 'completed':
                const ratingButton = booking.rating ? 
                    '<button class="action-btn secondary-btn" data-action="view-rating" data-booking-id="' + booking.id + '"><span class="btn-icon">⭐</span><span class="btn-text">View Rating</span></button>' :
                    '<button class="action-btn rating-btn" data-action="rate" data-booking-id="' + booking.id + '"><span class="btn-icon">⭐</span><span class="btn-text">Rate Service</span></button>';
                
                return ratingButton + `
                    <button class="action-btn secondary-btn" data-action="book-again" data-booking-id="${booking.id}">
                        <span class="btn-icon">🔄</span>
                        <span class="btn-text">Book Again</span>
                    </button>
                `;
            default:
                return baseViewButton;
        }
    }

    /**
     * Handle booking action clicks
     */
    handleBookingAction(event) {
        const button = event.target.closest('button[data-action]');
        if (!button) return;

        const action = button.getAttribute('data-action');
        const bookingId = button.getAttribute('data-booking-id');
        const booking = this.bookings.find(b => b.id === bookingId);

        if (!booking) {
            console.error('Booking not found:', bookingId);
            return;
        }

        switch (action) {
            case 'view':
                this.viewBookingDetails(booking);
                break;
            case 'reschedule':
                this.rescheduleBooking(booking);
                break;
            case 'cancel':
                this.cancelBooking(booking);
                break;
            case 'rate':
                this.rateService(booking);
                break;
            case 'book-again':
                this.bookAgain(booking);
                break;
            case 'view-rating':
                this.viewRating(booking);
                break;
            default:
                console.warn('Unknown action:', action);
        }
    }

    /**
     * View booking details
     */
    viewBookingDetails(booking) {
        // In a real app, this would navigate to a details page
        this.showNotification(`Viewing details for ${booking.serviceName}`, 'info');
        // window.location.href = `booking-details.html?id=${booking.id}`;
    }

    /**
     * Reschedule booking
     */
    rescheduleBooking(booking) {
        if (confirm(`Reschedule ${booking.serviceName}?`)) {
            this.showNotification('Redirecting to reschedule...', 'info');
            // window.location.href = `reschedule.html?id=${booking.id}`;
        }
    }

    /**
     * Cancel booking
     */
    cancelBooking(booking) {
        if (confirm(`Are you sure you want to cancel ${booking.serviceName}?`)) {
            // Update booking status
            booking.status = 'cancelled';
            booking.updatedAt = new Date().toISOString();
            
            this.showNotification('Booking cancelled successfully', 'success');
            this.applyFilter(this.currentFilter);
        }
    }

    /**
     * Rate service
     */
    rateService(booking) {
        // Simple rating implementation
        const rating = prompt('Rate this service (1-5 stars):');
        const numRating = parseInt(rating);
        
        if (numRating >= 1 && numRating <= 5) {
            booking.rating = numRating;
            booking.updatedAt = new Date().toISOString();
            
            this.showNotification(`Thank you for rating ${booking.serviceName}!`, 'success');
            this.applyFilter(this.currentFilter);
        } else if (rating !== null) {
            this.showNotification('Please enter a rating between 1 and 5', 'error');
        }
    }

    /**
     * Book again
     */
    bookAgain(booking) {
        // Store service info and redirect to booking form
        sessionStorage.setItem('selectedServiceId', booking.serviceType === 'cleaning' ? '1' : '3');
        sessionStorage.setItem('previousBooking', JSON.stringify(booking));
        
        this.showNotification('Redirecting to booking form...', 'info');
        setTimeout(() => {
            window.location.href = 'booking_form.html';
        }, 1000);
    }

    /**
     * View rating
     */
    viewRating(booking) {
        this.showNotification(`You rated ${booking.serviceName} ${booking.rating}/5 stars`, 'info');
    }

    /**
     * Handle search functionality
     */
    handleSearch() {
        const searchTerm = prompt('Search bookings by service name or address:');
        if (!searchTerm) return;

        const searchResults = this.bookings.filter(booking => 
            booking.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booking.address.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (searchResults.length > 0) {
            this.filteredBookings = searchResults;
            this.renderBookings();
            this.showNotification(`Found ${searchResults.length} booking(s)`, 'success');
        } else {
            this.showNotification('No bookings found matching your search', 'info');
        }
    }

    /**
     * Handle keyboard navigation
     */
    handleKeyNavigation(event) {
        // Filter tabs navigation with arrow keys
        if (event.target.classList.contains('filter-tab')) {
            const tabs = Array.from(this.filterTabs);
            const currentIndex = tabs.indexOf(event.target);
            
            if (event.key === 'ArrowLeft' && currentIndex > 0) {
                tabs[currentIndex - 1].focus();
                tabs[currentIndex - 1].click();
            } else if (event.key === 'ArrowRight' && currentIndex < tabs.length - 1) {
                tabs[currentIndex + 1].focus();
                tabs[currentIndex + 1].click();
            }
        }

        // Quick search with Ctrl/Cmd + F
        if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
            event.preventDefault();
            this.handleSearch();
        }
    }

    /**
     * Show empty state
     */
    showEmptyState() {
        if (this.emptyState) {
            this.emptyState.style.display = 'block';
            
            // Update empty state content based on current filter
            const title = this.emptyState.querySelector('.empty-title');
            const description = this.emptyState.querySelector('.empty-description');
            
            if (title && description) {
                switch (this.currentFilter) {
                    case 'upcoming':
                        title.textContent = 'No upcoming bookings';
                        description.textContent = 'You don\'t have any upcoming service bookings.';
                        break;
                    case 'completed':
                        title.textContent = 'No completed bookings';
                        description.textContent = 'You haven\'t completed any service bookings yet.';
                        break;
                    default:
                        title.textContent = 'No bookings found';
                        description.textContent = 'You don\'t have any bookings yet.';
                }
            }
        }
    }

    /**
     * Hide empty state
     */
    hideEmptyState() {
        if (this.emptyState) {
            this.emptyState.style.display = 'none';
        }
    }

    /**
     * Format date for display
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // Reset time for accurate comparison
        const resetTime = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const dateReset = resetTime(date);
        const todayReset = resetTime(today);
        const tomorrowReset = resetTime(tomorrow);
        const yesterdayReset = resetTime(yesterday);

        if (dateReset.getTime() === todayReset.getTime()) {
            return 'Today';
        } else if (dateReset.getTime() === tomorrowReset.getTime()) {
            return 'Tomorrow';
        } else if (dateReset.getTime() === yesterdayReset.getTime()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-GB', { 
                day: 'numeric', 
                month: 'short',
                year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
            });
        }
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Show notification to user
     */
    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

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
            fontSize: '0.9rem',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            backgroundColor: this.getNotificationColor(type),
            animation: 'slideInDown 0.3s ease-out'
        });

        // Add animation keyframes if not already present
        this.addNotificationStyles();

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutUp 0.3s ease-in forwards';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 3000);
    }

    /**
     * Get notification color based on type
     */
    getNotificationColor(type) {
        const colors = {
            error: 'var(--red-status, #dc2626)',
            success: 'var(--green-status, #059669)',
            info: '#3b82f6',
            warning: '#f59e0b'
        };
        return colors[type] || colors.info;
    }

    /**
     * Add notification animation styles
     */
    addNotificationStyles() {
        if (document.getElementById('notification-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            @keyframes slideInDown {
                from {
                    transform: translateX(-50%) translateY(-100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(-50%) translateY(0);
                    opacity: 1;
                }
            }
            @keyframes slideOutUp {
                from {
                    transform: translateX(-50%) translateY(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(-50%) translateY(-100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    /**
     * Refresh bookings data
     */
    refreshBookings() {
        this.showNotification('Refreshing bookings...', 'info');
        
        // In a real app, this would fetch from API
        setTimeout(() => {
            this.loadBookings();
            this.applyFilter(this.currentFilter);
            this.showNotification('Bookings updated', 'success');
        }, 1000);
    }

    /**
     * Export bookings data
     */
    exportBookings() {
        const exportData = this.bookings.map(booking => ({
            'Booking ID': booking.id,
            'Service': booking.serviceName,
            'Status': booking.status,
            'Date': booking.date,
            'Time': booking.time,
            'Address': booking.address,
            'Price': `R${booking.price}`,
            'Provider': booking.serviceProvider || 'Not assigned'
        }));

        const csv = this.convertToCSV(exportData);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        this.showNotification('Bookings exported successfully', 'success');
    }

    /**
     * Convert array to CSV format
     */
    convertToCSV(data) {
        if (data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csvHeaders = headers.join(',');
        const csvRows = data.map(row => 
            headers.map(header => `"${row[header] || ''}"`).join(',')
        );
        
        return [csvHeaders, ...csvRows].join('\n');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new BookingScreenManager();
});