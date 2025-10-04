/**
 * Modern Services Screen Handler
 * Manages the services catalog with advanced filtering and interactions
 */

class ServicesScreenManager {
    constructor() {
        this.elements = {};
        this.currentFilter = 'all';
        this.services = [
            {
                id: '1',
                name: 'Standard Cleaning',
                description: 'Regular weekly or bi-weekly cleaning to maintain your home\'s cleanliness and hygiene',
                basePrice: 280,
                category: 'cleaning',
                duration: '2-3 hours',
                rating: 4.8,
                reviews: 156,
                // icon: '🧽',
                popular: false,
                featured: true
            },
            {
                id: '2',
                name: 'Deep Cleaning',
                description: 'Comprehensive cleaning including appliances, fittings, and detailed sanitization',
                basePrice: 600,
                category: 'cleaning',
                duration: '4-6 hours',
                rating: 4.9,
                reviews: 243,
                // icon: '✨',
                popular: true,
                featured: false
            },
            {
                id: '3',
                name: 'Move-In/Out Cleaning',
                description: 'Thorough cleaning for property transitions and relocations with detailed checklist',
                basePrice: 800,
                category: 'cleaning',
                duration: '5-8 hours',
                rating: 4.7,
                reviews: 89,
                // icon: '📦',
                popular: false,
                featured: false
            },
            {
                id: '4',
                name: 'Garden Services',
                description: 'Lawn mowing, weeding, hedge trimming, and basic garden maintenance services',
                basePrice: 200,
                category: 'garden',
                duration: 'Flexible',
                rating: 4.6,
                reviews: 134,
                // icon: '🌿',
                isHourly: true,
                popular: false,
                featured: false
            },
            {
                id: '5',
                name: 'Elderly Care Support',
                description: 'Non-medical home assistance and companionship services for seniors',
                basePrice: 150,
                category: 'care',
                duration: 'Flexible',
                rating: 4.9,
                reviews: 78,
                // icon: '💙',
                isHourly: true,
                popular: true,
                featured: false
            },
            {
                id: '6',
                name: 'Post-Construction Cleanup',
                description: 'Specialized cleaning after renovations, construction, or major repairs',
                basePrice: 950,
                category: 'cleaning',
                duration: '6-10 hours',
                rating: 4.8,
                reviews: 45,
                // icon: '🔨',
                popular: false,
                featured: false
            },
            {
                id: '7',
                name: 'Pool Maintenance',
                description: 'Complete pool cleaning, chemical balancing, and equipment maintenance',
                basePrice: 250,
                category: 'garden',
                duration: '2-3 hours',
                rating: 4.7,
                reviews: 92,
                // icon: '🏊‍♂️',
                popular: false,
                featured: false
            }
        ];
        
        this.filteredServices = [...this.services];
        this.init();
    }

    async init() {
        try {
            this.cacheElements();
            this.setupEventListeners();
            this.setupFilterScroll(); // <-- MUST be included
            this.setupFilterSelection(); // <-- MUST be included
            this.showLoadingState();
            
            // Simulate API loading delay
            await new Promise(resolve => setTimeout(resolve, 800));
            
            this.renderServices();
            this.hideLoadingState();
            
        } catch (error) {
            console.error('Failed to initialize services screen:', error);
            this.handleInitializationError();
        }
    }

    cacheElements() {
        this.elements = {
            backBtn: document.querySelector('.header-back-btn'),
            searchBtn: document.querySelector('.search-btn'),
            filterTabs: document.querySelectorAll('.filter-tab'),
            servicesContainer: document.querySelector('.services-container'),
            loadingState: document.querySelector('.loading-state'),
            emptyState: document.querySelector('.empty-state'),
            navItems: document.querySelectorAll('.nav-item')
        };

        // Validate critical elements
        const criticalElements = ['servicesContainer', 'filterTabs'];
        const missingElements = criticalElements.filter(key => 
            !this.elements[key] || this.elements[key].length === 0
        );
        
        if (missingElements.length > 0) {
            throw new Error(`Missing critical elements: ${missingElements.join(', ')}`);
        }
    }

    setupEventListeners() {
        // Back button
        if (this.elements.backBtn) {
            this.elements.backBtn.addEventListener('click', () => this.handleBack());
        }

        // Search button
        if (this.elements.searchBtn) {
            this.elements.searchBtn.addEventListener('click', () => this.handleSearch());
        }

        // Filter tabs
        this.elements.filterTabs.forEach(tab => {
            tab.addEventListener('click', (e) => this.handleFilterChange(e));
        });

        // Navigation items
        this.elements.navItems.forEach(navItem => {
            navItem.addEventListener('click', (e) => this.handleNavigation(e));
        });

        // Service selection (event delegation)
        this.elements.servicesContainer.addEventListener('click', (e) => {
            this.handleServiceInteraction(e);
        });

        // Window events
        window.addEventListener('beforeunload', () => this.cleanup());
    }

    // ADDED: Method to enable horizontal scroll for filter tabs (desktop fix)
    setupFilterScroll() {
        // Correctly targets the filter-tabs container
        const filterTabsContainer = document.querySelector('.filter-tabs');
        if (!filterTabsContainer) return;

        // FIX: Enable Horizontal Mouse Wheel Scroll for Desktop
        filterTabsContainer.addEventListener('wheel', (e) => {
            // Only convert scroll if the vertical movement is dominant
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                e.preventDefault(); // Stop the screen from scrolling vertically
                // Scroll horizontally by the amount of vertical scroll
                filterTabsContainer.scrollLeft += e.deltaY;
            }
        }, { passive: false }); // { passive: false } is critical to allow preventDefault
    }
    
    // ADDED: Method to scroll the selected filter tab into view
    setupFilterSelection() {
        const filterTabs = document.querySelectorAll('.filter-tab');
        
        filterTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                
                // Part 1: Manage 'active' state
                filterTabs.forEach(t => t.classList.remove('active'));
                e.currentTarget.classList.add('active');
                
                // Part 2: Scroll the selected tab to the beginning
                e.currentTarget.scrollIntoView({
                    behavior: 'smooth',
                    inline: 'start' // Scrolls the clicked element to the start of the visible container
                });
                
                // OPTIONAL: Call your actual filter logic here (if you have one)
                // this.applyFilter(e.currentTarget.dataset.filter);
            });
        });
        
        // Scroll the initially active tab into view on page load
        const activeTab = document.querySelector('.filter-tab.active');
        if (activeTab) {
            // Use setTimeout to ensure the layout is fully rendered before scrolling
            setTimeout(() => {
                activeTab.scrollIntoView({
                    behavior: 'auto', // Use 'auto' or 'smooth'
                    inline: 'start'
                });
            }, 100);  
        }
    }


    showLoadingState() {
        if (this.elements.loadingState) {
            this.elements.loadingState.style.display = 'flex';
        }
        if (this.elements.servicesContainer) {
            this.elements.servicesContainer.style.display = 'none';
        }
        if (this.elements.emptyState) {
            this.elements.emptyState.style.display = 'none';
        }
    }

    hideLoadingState() {
        if (this.elements.loadingState) {
            this.elements.loadingState.style.display = 'none';
        }
        if (this.elements.servicesContainer) {
            this.elements.servicesContainer.style.display = 'flex';
        }
    }

    showEmptyState() {
        if (this.elements.servicesContainer) {
            this.elements.servicesContainer.style.display = 'none';
        }
        if (this.elements.loadingState) {
            this.elements.loadingState.style.display = 'none';
        }
        if (this.elements.emptyState) {
            this.elements.emptyState.style.display = 'flex';
        }
    }

    handleFilterChange(e) {
        e.preventDefault();
        
        const clickedTab = e.currentTarget;
        const category = clickedTab.getAttribute('data-category');
        
        if (category === this.currentFilter) return;
        
        // Update active state
        this.elements.filterTabs.forEach(tab => {
            tab.classList.remove('active');
            tab.setAttribute('aria-selected', 'false');
        });
        
        clickedTab.classList.add('active');
        clickedTab.setAttribute('aria-selected', 'true');
        
        // Add click animation
        clickedTab.style.transform = 'scale(0.95)';
        setTimeout(() => {
            clickedTab.style.transform = 'scale(1)';
        }, 150);
        
        this.currentFilter = category;
        this.filterServices();
    }

    filterServices() {
        this.showLoadingState();
        
        setTimeout(() => {
            if (this.currentFilter === 'all') {
                this.filteredServices = [...this.services];
            } else {
                this.filteredServices = this.services.filter(service => 
                    service.category === this.currentFilter
                );
            }
            
            this.renderServices();
            this.hideLoadingState();
            
            // Announce filter change to screen readers
            this.announceFilterChange();
        }, 300);
    }

    announceFilterChange() {
        const count = this.filteredServices.length;
        const category = this.currentFilter === 'all' ? 'all services' : `${this.currentFilter} services`;
        const message = `Showing ${count} ${category}`;
        
        // Create temporary announcement element
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    renderServices() {
        if (this.filteredServices.length === 0) {
            this.showEmptyState();
            return;
        }

        const servicesHTML = this.filteredServices.map((service, index) => {
            return this.createServiceCardHTML(service, index);
        }).join('');

        this.elements.servicesContainer.innerHTML = servicesHTML;
        
        // Trigger entrance animations
        this.animateServiceCards();
    }

    createServiceCardHTML(service, index) {
        const priceText = service.isHourly 
            ? `R${service.basePrice}/hr`
            : `From R${service.basePrice}`;
            
        const ratingStars = '⭐'.repeat(Math.floor(service.rating));
        
        const featuredClass = service.featured ? 'featured' : '';
        const popularBadge = service.popular ? 
            '<span class="service-popular">Popular</span>' : '';

        return `
            <article class="service-card ${featuredClass}" 
                     data-service-id="${service.id}" 
                     data-category="${service.category}"
                     style="animation-delay: ${index * 0.1}s">
                <div class="service-header">
                    <div class="service-info">
                        <h3 class="service-title">${service.name}</h3>
                        <p class="service-description">${service.description}</p>
                    </div>
                </div>
                
                <div class="service-meta">
                    <span class="service-price">${priceText}</span>
                    <span class="service-duration">${service.duration}</span>
                    <div class="service-rating">
                        <span>${ratingStars}</span>
                        <span>${service.rating} (${service.reviews})</span>
                    </div>
                    ${popularBadge}
                </div>
                
                <div class="service-actions">
                    <button class="select-btn" 
                            data-service-id="${service.id}"
                            data-service-name="${service.name}">
                        Select Service
                    </button>
                    <button class="info-btn" 
                            data-service-id="${service.id}"
                            aria-label="More info about ${service.name}">
                        View More
                    </button>
                </div>
            </article>
        `;
    }

    animateServiceCards() {
        const cards = this.elements.servicesContainer.querySelectorAll('.service-card');
        
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    handleServiceInteraction(e) {
        const selectBtn = e.target.closest('.select-btn');
        const infoBtn = e.target.closest('.info-btn');
        const serviceCard = e.target.closest('.service-card');

        if (selectBtn) {
            this.handleServiceSelection(e, selectBtn);
        } else if (infoBtn) {
            this.handleServiceInfo(e, infoBtn);
        } else if (serviceCard && !e.target.closest('button')) {
            this.handleServiceCardClick(e, serviceCard);
        }
    }

    async handleServiceSelection(e, button) {
        e.preventDefault();
        e.stopPropagation();

        const serviceId = button.getAttribute('data-service-id');
        const serviceName = button.getAttribute('data-service-name');
        const service = this.services.find(s => s.id === serviceId);

        if (!service) {
            this.showToast('Service not found. Please try again.', 'error');
            return;
        }

        // Add loading state to button
        this.setButtonLoading(button, true);

        try {
            // Store selected service
            this.storeSelectedService(service);
            
            // Show success feedback
            this.showSelectionSuccess(button, serviceName);
            
            // Navigate after delay
            setTimeout(() => {
                this.navigateToBookingForm(serviceId);
            }, 1200);

        } catch (error) {
            console.error('Service selection error:', error);
            this.showToast('Unable to select service. Please try again.', 'error');
        } finally {
            setTimeout(() => {
                this.setButtonLoading(button, false);
            }, 1200);
        }
    }

    storeSelectedService(service) {
        try {
            // Store in sessionStorage for booking form
            sessionStorage.setItem('selectedServiceId', service.id);
            sessionStorage.setItem('selectedService', JSON.stringify(service));
            
            // Log selection for analytics
            console.log(`Service selected: ${service.name} (ID: ${service.id})`);
            
        } catch (error) {
            console.warn('Failed to store service selection:', error);
            // Continue anyway as this is not critical
        }
    }

    setButtonLoading(button, isLoading) {
        if (isLoading) {
            button.disabled = true;
            button.style.pointerEvents = 'none';
            button.textContent = 'Selecting...';
            button.classList.add('loading');
        } else {
            button.disabled = false;
            button.style.pointerEvents = 'auto';
            button.textContent = 'Select Service';
            button.classList.remove('loading');
        }
    }

    showSelectionSuccess(button, serviceName) {
        button.textContent = 'Selected!';
        button.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        
        // Add success animation
        button.style.transform = 'scale(1.05)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 200);

        this.showToast(`${serviceName} selected successfully!`, 'success');
    }

    handleServiceInfo(e, button) {
        e.preventDefault();
        e.stopPropagation();

        const serviceId = button.getAttribute('data-service-id');
        const service = this.services.find(s => s.id === serviceId);

        if (!service) return;

        // Add click animation
        button.style.transform = 'scale(0.9)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 150);

        // Show service details modal or navigate to details page
        setTimeout(() => {
            this.showServiceDetails(service);
        }, 200);
    }

    handleServiceCardClick(e, card) {
        const serviceId = card.getAttribute('data-service-id');
        
        // Add click animation
        card.style.transform = 'scale(0.98)';
        setTimeout(() => {
            card.style.transform = 'scale(1)';
        }, 150);

        // Navigate to service details
        setTimeout(() => {
            window.location.href = `service_details.html?id=${serviceId}`;
        }, 200);
    }

    showServiceDetails(service) {
        const details = `
            Service: ${service.name}
            Price: ${service.isHourly ? `R${service.basePrice}/hr` : `From R${service.basePrice}`}
            Duration: ${service.duration}
            Rating: ${service.rating}/5 (${service.reviews} reviews)
            
            ${service.description}
        `;
        
        // For demo purposes, show an alert
        // In production, this would open a modal or navigate to a details page
        this.showToast(`View details for ${service.name}`, 'info');
        
        setTimeout(() => {
            window.location.href = `service_details.html?id=${service.id}`;
        }, 1000);
    }

    navigateToBookingForm(serviceId) {
        const url = `booking_form.html?service=${serviceId}`;
        window.location.href = url;
    }

    handleBack() {
        // Add click animation
        this.elements.backBtn.style.transform = 'scale(0.9)';
        setTimeout(() => {
            this.elements.backBtn.style.transform = 'scale(1)';
        }, 150);

        // Navigate back
        setTimeout(() => {
            this.navigateBack();
        }, 200);
    }

    navigateBack() {
        // Check if there's a referrer or default to home
        if (document.referrer && document.referrer.includes('home_screen.html')) {
            window.history.back();
        } else {
            window.location.href = 'home_screen.html';
        }
    }

    handleSearch() {
        // Add click animation
        this.elements.searchBtn.style.transform = 'scale(0.9)';
        setTimeout(() => {
            this.elements.searchBtn.style.transform = 'scale(1)';
        }, 150);

        // For demo, show a toast
        this.showToast('Search functionality coming soon!', 'info');
        
        // In production, this would open a search modal or navigate to search page
        // setTimeout(() => {
        //     window.location.href = 'search.html';
        // }, 500);
    }

    handleNavigation(e) {
        e.preventDefault();
        
        const clickedNav = e.currentTarget;
        const page = clickedNav.getAttribute('data-page');
        
        if (page === 'services') {
            // Already on services page
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
        
        // Add loading animation
        this.setNavigationLoading(clickedNav, true);
        
        setTimeout(() => {
            this.setNavigationLoading(clickedNav, false);
            this.navigateToPage(page);
        }, 400);
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
            home: 'home_screen.html',
            bookings: 'booking_screen.html',
            profile: 'profile_screen.html'
        };
        
        if (pageUrls[page]) {
            window.location.href = pageUrls[page];
        }
    }

    scrollToTop() {
        const contentArea = document.querySelector('.content-area');
        if (contentArea) {
            contentArea.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    showToast(message, type = 'info') {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        // Add toast styles
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            fontSize: '14px',
            zIndex: '1000',
            opacity: '0',
            transform: 'translateY(-20px)',
            transition: 'all 0.3s ease',
            maxWidth: '300px',
            wordWrap: 'break-word'
        });
        
        // Set background based on type
        const backgrounds = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        
        toast.style.background = backgrounds[type] || backgrounds.info;
        
        document.body.appendChild(toast);
        
        // Animate in
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        });
        
        // Remove after delay
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    handleInitializationError() {
        console.error('Services screen initialization failed');
        
        // Show error message
        if (this.elements.servicesContainer) {
            this.elements.servicesContainer.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <h3>Unable to load services</h3>
                    <p>Please check your connection and try again.</p>
                    <button class="retry-btn" onclick="window.location.reload()">
                        Retry
                    </button>
                </div>
            `;
        }
        
        // Add error state styles
        const errorStyles = `
            .error-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 3rem 1rem;
                text-align: center;
                color: #64748b;
            }
            
            .error-icon {
                font-size: 3rem;
                margin-bottom: 1rem;
                opacity: 0.7;
            }
            
            .error-state h3 {
                font-size: 1.125rem;
                font-weight: 600;
                color: #374151;
                margin: 0 0 0.5rem 0;
            }
            
            .error-state p {
                font-size: 0.875rem;
                margin: 0 0 1.5rem 0;
                line-height: 1.4;
            }
            
            .retry-btn {
                background: #3b82f6;
                color: white;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                font-size: 0.875rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .retry-btn:hover {
                background: #2563eb;
                transform: translateY(-1px);
            }
        `;
        
        const style = document.createElement('style');
        style.textContent = errorStyles;
        document.head.appendChild(style);
    }

    cleanup() {
        // Clear any running timeouts or intervals
        // Remove event listeners if needed (automatic on page unload)
        console.log('Services screen cleanup completed');
    }
}

// Add screen reader only class
const screenReaderStyle = document.createElement('style');
screenReaderStyle.textContent = `
    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }
`;
document.head.appendChild(screenReaderStyle);

// Initialize the services screen manager (Moved to a correct place after class definition)
try {
    new ServicesScreenManager();
} catch (error) {
    console.error('Failed to initialize services screen manager:', error);
    
    // Fallback error handling
    document.body.insertAdjacentHTML('beforeend', `
        <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                    background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    text-align: center; z-index: 9999; max-width: 90%;">
            <h3 style="margin: 0 0 10px 0; color: #ef4444;">Unable to Load Services</h3>
            <p style="margin: 0 0 15px 0; color: #64748b;">Please refresh the page to try again.</p>
            <button onclick="window.location.reload()" 
                    style="background: #3b82f6; color: white; border: none; padding: 8px 16px; 
                           border-radius: 6px; cursor: pointer;">Refresh Page</button>
        </div>
    `);
}