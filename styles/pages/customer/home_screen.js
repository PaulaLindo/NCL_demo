/**
 * Modern Home Screen Handler
 * Manages the home dashboard functionality with enhanced UX
 */

class HomeScreenManager {
    constructor() {
        this.user = null;
        this.elements = {};
        this.animations = new Map();
        this.services = {
            'standard-cleaning': {
                name: 'Standard Cleaning',
                basePrice: 280,
                duration: '2-3 hours',
                description: 'Weekly maintenance cleaning for your home'
            },
            'deep-cleaning': {
                name: 'Deep Cleaning',
                basePrice: 600,
                duration: '4-6 hours',
                description: 'Comprehensive seasonal deep cleaning service'
            },
            'elderly-care': {
                name: 'Elderly Care Support',
                basePrice: 150,
                duration: 'Flexible',
                description: 'Non-medical home assistance and companionship',
                isHourly: true
            }
        };
        
        this.init();
    }

    async init() {
        try {
            if (!this.checkAuthentication()) return;
            
            this.cacheElements();
            this.setupEventListeners();
            this.updateUserInterface();
            this.setupAnimations();
            this.loadUserData();
            
        } catch (error) {
            console.error('Failed to initialize home screen:', error);
            this.handleInitializationError();
        }
    }

    checkAuthentication() {
        this.user = getLoggedInUser();
        
        if (!this.user) {
            console.warn('User not authenticated, redirecting to login');
            this.redirectToLogin();
            return false;
        }
        
        return true;
    }

    cacheElements() {
        this.elements = {
            headerTitle: document.querySelector('.header-title'),
            locationText: document.querySelector('.location-text'),
            notificationBtn: document.querySelector('.notification-btn'),
            notificationBadge: document.querySelector('.notification-badge'),
            viewDetailsBtn: document.querySelector('.view-details-btn'),
            bookingCard: document.querySelector('.next-booking-card'),
            serviceCards: document.querySelectorAll('.service-card'),
            bookServiceBtns: document.querySelectorAll('.book-service-btn'),
            navItems: document.querySelectorAll('.nav-item'),
            seeAllBtn: document.querySelector('.see-all-btn'),
            navBadge: document.querySelector('.nav-badge')
        };

        // Validate critical elements
        const criticalElements = ['headerTitle', 'serviceCards', 'navItems'];
        const missingElements = criticalElements.filter(key => !this.elements[key] || this.elements[key].length === 0);
        
        if (missingElements.length > 0) {
            throw new Error(`Missing critical elements: ${missingElements.join(', ')}`);
        }
    }

    setupEventListeners() {
        // Navigation handling
        this.elements.navItems.forEach(navItem => {
            navItem.addEventListener('click', (e) => this.handleNavigation(e));
        });

        // Service booking buttons
        this.elements.bookServiceBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleServiceBooking(e));
        });

        // Booking details button
        if (this.elements.viewDetailsBtn) {
            this.elements.viewDetailsBtn.addEventListener('click', (e) => this.handleViewBookingDetails(e));
        }

        // Notification button
        if (this.elements.notificationBtn) {
            this.elements.notificationBtn.addEventListener('click', (e) => this.handleNotifications(e));
        }

        // See all services button
        if (this.elements.seeAllBtn) {
            this.elements.seeAllBtn.addEventListener('click', (e) => this.handleSeeAllServices(e));
        }

        // Service card hover effects
        this.elements.serviceCards.forEach(card => {
            card.addEventListener('mouseenter', (e) => this.handleServiceCardHover(e, true));
            card.addEventListener('mouseleave', (e) => this.handleServiceCardHover(e, false));
            card.addEventListener('click', (e) => this.handleServiceCardClick(e));
        });

        // Intersection Observer for animations
        this.setupIntersectionObserver();

        // Window events
        window.addEventListener('beforeunload', () => this.cleanup());
        window.addEventListener('online', () => this.handleOnlineStatus(true));
        window.addEventListener('offline', () => this.handleOnlineStatus(false));
    }

    updateUserInterface() {
        // Update welcome message
        if (this.elements.headerTitle && this.user?.name) {
            this.elements.headerTitle.textContent = `Welcome, ${this.user.name}`;
        }

        // Update location (could be fetched from user preferences or geolocation)
        if (this.elements.locationText) {
            const location = this.user?.location || 'Durban North';
            this.elements.locationText.textContent = location;
        }

        // Update time-based greeting
        this.updateTimeBasedGreeting();
    }

    updateTimeBasedGreeting() {
        const hour = new Date().getHours();
        let greeting = 'Welcome';

        if (hour < 12) {
            greeting = 'Good Morning';
        } else if (hour < 17) {
            greeting = 'Good Afternoon';
        } else {
            greeting = 'Good Evening';
        }

        if (this.elements.headerTitle && this.user?.name) {
            this.elements.headerTitle.textContent = `${greeting}, ${this.user.name}`;
        }
    }

    setupAnimations() {
        // Stagger animation for service cards
        this.elements.serviceCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.6s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 100 * (index + 1));
        });

        // Animate booking card
        if (this.elements.bookingCard) {
            this.elements.bookingCard.style.opacity = '0';
            this.elements.bookingCard.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                this.elements.bookingCard.style.transition = 'all 0.8s ease';
                this.elements.bookingCard.style.opacity = '1';
                this.elements.bookingCard.style.transform = 'translateY(0)';
            }, 200);
        }
    }

    setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    this.triggerCountAnimation(entry.target);
                }
            });
        }, { threshold: 0.1 });

        this.elements.serviceCards.forEach(card => {
            observer.observe(card);
        });
    }

    triggerCountAnimation(element) {
        const priceElement = element.querySelector('.service-price');
        if (!priceElement) return;

        const serviceType = element.getAttribute('data-service');
        const service = this.services[serviceType];
        if (!service) return;

        // Animate price counting up
        const finalPrice = service.basePrice;
        let currentPrice = 0;
        const increment = finalPrice / 20;
        
        const countAnimation = setInterval(() => {
            currentPrice += increment;
            if (currentPrice >= finalPrice) {
                currentPrice = finalPrice;
                clearInterval(countAnimation);
            }
            
            const displayPrice = service.isHourly 
                ? `R${Math.round(currentPrice)}/hr`
                : `From R${Math.round(currentPrice)}`;
                
            priceElement.textContent = displayPrice;
        }, 50);
    }

    async loadUserData() {
        try {
            // Simulate loading user-specific data
            await this.loadNotifications();
            await this.loadUpcomingBookings();
            await this.loadBookingHistory();
            
        } catch (error) {
            console.error('Failed to load user data:', error);
            this.showUserFriendlyError('Unable to load some data. Please refresh the page.');
        }
    }

    async loadNotifications() {
        // Simulate API call for notifications
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const notificationCount = 2; // Mock data
        this.updateNotificationBadge(notificationCount);
    }

    async loadUpcomingBookings() {
        // Simulate API call for bookings
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const bookingCount = 3; // Mock data
        this.updateBookingBadge(bookingCount);
    }

    async loadBookingHistory() {
        // Could load recent bookings to show personalized recommendations
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    updateNotificationBadge(count) {
        if (this.elements.notificationBadge) {
            if (count > 0) {
                this.elements.notificationBadge.textContent = count > 99 ? '99+' : count.toString();
                this.elements.notificationBadge.style.display = 'block';
                this.animateBadge(this.elements.notificationBadge);
            } else {
                this.elements.notificationBadge.style.display = 'none';
            }
        }
    }

    updateBookingBadge(count) {
        if (this.elements.navBadge) {
            if (count > 0) {
                this.elements.navBadge.textContent = count > 99 ? '99+' : count.toString();
                this.elements.navBadge.style.display = 'block';
                this.animateBadge(this.elements.navBadge);
            } else {
                this.elements.navBadge.style.display = 'none';
            }
        }
    }

    animateBadge(badge) {
        badge.style.animation = 'none';
        setTimeout(() => {
            badge.style.animation = 'pulse 0.6s ease-in-out';
        }, 10);
    }

    handleNavigation(e) {
        e.preventDefault();
        
        const clickedNav = e.currentTarget;
        const page = clickedNav.getAttribute('data-page');
        
        if (page === 'home') {
            // Already on home page
            this.scrollToTop();
            return;
        }

        // Update active state
        this.elements.navItems.forEach(nav => {
            nav.classList.remove('active');
            nav.removeAttribute('aria-current');
        });
        
        clickedNav.classList.add('active');
        clickedNav.setAttribute('aria-current', 'page');
        
        // Add loading state
        this.setNavigationLoading(clickedNav, true);
        
        // Simulate page navigation with delay
        setTimeout(() => {
            this.setNavigationLoading(clickedNav, false);
            this.navigateToPage(page);
        }, 600);
    }

    setNavigationLoading(navItem, isLoading) {
        const icon = navItem.querySelector('.nav-icon');
        if (isLoading) {
            navItem.style.pointerEvents = 'none';
            icon.style.opacity = '0.5';
        } else {
            navItem.style.pointerEvents = 'auto';
            icon.style.opacity = '1';
        }
    }

    navigateToPage(page) {
        const pageUrls = {
            services: 'services_screen.html',
            bookings: 'booking_screen.html',
            profile: 'profile_screen.html'
        };
        
        if (pageUrls[page]) {
            window.location.href = pageUrls[page];
        }
    }

    async handleServiceBooking(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const button = e.currentTarget;
        const serviceCard = button.closest('.service-card');
        const serviceType = serviceCard.getAttribute('data-service');
        const service = this.services[serviceType];
        
        if (!service) {
            this.showUserFriendlyError('Service not found. Please try again.');
            return;
        }

        // Add loading state
        this.setButtonLoading(button, true);
        
        try {
            // Simulate booking process
            await this.processServiceBooking(serviceType, service);
            
            // Show success feedback
            this.showBookingSuccess(button, service.name);
            
            // Navigate to booking form after delay
            setTimeout(() => {
                this.navigateToBookingForm(serviceType);
            }, 1500);
            
        } catch (error) {
            console.error('Booking error:', error);
            this.showUserFriendlyError('Unable to process booking. Please try again.');
        } finally {
            this.setButtonLoading(button, false);
        }
    }

    async processServiceBooking(serviceType, service) {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Log booking attempt (could send analytics)
        console.log(`Booking initiated for ${service.name}`);
        
        return { success: true, bookingId: Date.now() };
    }

    setButtonLoading(button, isLoading) {
        const originalText = button.textContent;
        
        if (isLoading) {
            button.classList.add('loading');
            button.disabled = true;
            button.textContent = 'Booking...';
        } else {
            button.classList.remove('loading');
            button.disabled = false;
            button.textContent = originalText;
        }
    }

    showBookingSuccess(button, serviceName) {
        const originalText = button.textContent;
        button.textContent = 'Success!';
        button.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        
        // Add success animation
        button.style.transform = 'scale(1.05)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 200);
        
        // Show toast notification
        this.showToast(`${serviceName} booking started!`, 'success');
    }

    navigateToBookingForm(serviceType) {
        window.location.href = `booking_form.html?service=${serviceType}`;
    }

    handleServiceCardHover(e, isHover) {
        const card = e.currentTarget;
        const icon = card.querySelector('.service-icon');
        
        if (isHover) {
            this.animateServiceCardHover(card, icon, true);
        } else {
            this.animateServiceCardHover(card, icon, false);
        }
    }

    animateServiceCardHover(card, icon, isHover) {
        if (isHover) {
            card.style.transform = 'translateY(-8px) scale(1.02)';
            if (icon) icon.style.transform = 'scale(1.1) rotate(5deg)';
        } else {
            card.style.transform = 'translateY(0) scale(1)';
            if (icon) icon.style.transform = 'scale(1) rotate(0deg)';
        }
    }

    handleServiceCardClick(e) {
        // If click is not on button, show service details
        if (!e.target.closest('.book-service-btn')) {
            const serviceType = e.currentTarget.getAttribute('data-service');
            this.showServiceDetails(serviceType);
        }
    }

    showServiceDetails(serviceType) {
        const service = this.services[serviceType];
        if (!service) return;
        
        // Could open a modal or navigate to service details page
        this.showToast(`Learn more about ${service.name}`, 'info');
        
        // For demo, just scroll to service section
        setTimeout(() => {
            window.location.href = `service_details.html?service=${serviceType}`;
        }, 500);
    }

    handleViewBookingDetails(e) {
        e.preventDefault();
        
        const bookingId = e.currentTarget.getAttribute('data-booking-id');
        
        // Add click animation
        const button = e.currentTarget;
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 150);
        
        setTimeout(() => {
            window.location.href = `booking_details.html?id=${bookingId}`;
        }, 300);
    }

    handleNotifications(e) {
        e.preventDefault();
        
        // Add click animation
        const button = e.currentTarget;
        button.style.transform = 'scale(0.9)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 150);
        
        // Navigate to notifications
        setTimeout(() => {
            window.location.href = 'notifications.html';
        }, 300);
    }

    handleSeeAllServices(e) {
        e.preventDefault();
        
        // Add click animation
        e.currentTarget.style.transform = 'scale(0.95)';
        setTimeout(() => {
            e.currentTarget.style.transform = 'scale(1)';
        }, 150);
        
        setTimeout(() => {
            window.location.href = 'services_screen.html';
        }, 300);
    }

    handleOnlineStatus(isOnline) {
        if (isOnline) {
            this.showToast('Connection restored', 'success');
            this.loadUserData(); // Refresh data when back online
        } else {
            this.showToast('No internet connection', 'warning');
        }
    }

    showToast(message, type = 'info') {
    document.querySelectorAll('.toast').forEach(t => t.remove());
    
    const toast = this.createToastElement(message, type);
    document.body.appendChild(toast);
    
    this.animateToast(toast);
    this.scheduleToastRemoval(toast, 3000);
    }

    // Extract helpers
    createToastElement(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        this.applyToastStyles(toast, type);
        return toast;
    }

    showUserFriendlyError(message) {
        this.showToast(message, 'error');
    }

    scrollToTop() {
        const contentArea = document.querySelector('.content-area');
        if (contentArea) {
            contentArea.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    redirectToLogin() {
        window.location.href = 'login_screen.html';
    }

    handleInitializationError() {
        // Show fallback UI or redirect
        this.showUserFriendlyError('Unable to load the home screen. Please refresh the page.');
        
        // Provide basic functionality
        document.addEventListener('click', (e) => {
            if (e.target.matches('.book-service-btn')) {
                e.preventDefault();
                alert('Booking functionality is temporarily unavailable. Please try again later.');
            }
        });
    }

    cleanup() {
        // Clear any running animations or intervals
        this.animations.forEach(animation => {
            if (animation) clearInterval(animation);
        });
        
        // Remove event listeners if needed
        // (automatic cleanup on page unload)
    }
}

// Initialize the home screen manager
document.addEventListener('DOMContentLoaded', () => {
    try {
        new HomeScreenManager();
    } catch (error) {
        console.error('Failed to initialize home screen manager:', error);
        
        // Fallback error handling
        document.body.insertAdjacentHTML('beforeend', `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                        background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                        text-align: center; z-index: 9999; max-width: 90%;"> 
                <h3 style="margin: 0 0 10px 0; color: #ef4444;">Something went wrong</h3>
                <p style="margin: 0 0 15px 0; color: #64748b;">Please refresh the page to try again.</p>
                <button onclick="window.location.reload()" 
                        style="background: #3b82f6; color: white; border: none; padding: 8px 16px; 
                               border-radius: 6px; cursor: pointer;">Refresh Page</button>
            </div>
        `);
    }
});

// Add pulse animation for badges
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);