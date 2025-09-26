/**
 * Staff Dashboard Manager
 * Manages job listings, real-time updates, and staff interactions
 */

class StaffDashboardManager {
    constructor() {
        this.jobs = [];
        this.filteredJobs = [];
        this.currentFilter = 'today';
        this.staffStats = null;
        this.jobsContainer = null;
        this.filterTabs = [];
        this.emptyState = null;
        this.refreshInterval = null;
        this.locationTracking = false;
        
        this.init();
    }

    /**
     * Initialize the staff dashboard
     */
    init() {
        this.cacheElements();
        this.loadStaffData();
        this.bindEvents();
        this.startRealtimeUpdates();
        this.requestLocationPermission();
        this.applyFilter(this.currentFilter);
    }

    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.jobsContainer = document.getElementById('jobsContainer');
        this.emptyState = document.getElementById('emptyState');
        this.filterTabs = document.querySelectorAll('.filter-tab');
        this.jobsCountEl = document.getElementById('jobsCount');
        this.todayEarningsEl = document.getElementById('todayEarnings');
        this.hoursWorkedEl = document.getElementById('hoursWorked');
        this.ratingEl = document.getElementById('rating');
        this.notificationBadge = document.getElementById('notificationBadge');
        this.emergencyBtn = document.getElementById('emergencyBtn');
        this.filterBtn = document.getElementById('filterBtn');
        this.notificationsBtn = document.getElementById('notificationsBtn');
    }

    /**
     * Load staff data including jobs and statistics
     */
    loadStaffData() {
        // Mock staff statistics
        this.staffStats = {
            todayEarnings: 550,
            hoursScheduled: 6,
            rating: 4.8,
            completedJobs: 23,
            totalEarnings: 12450,
            unreadNotifications: 2
        };

        // Mock job data with comprehensive information
        this.jobs = [
            {
                id: 'JOB001',
                serviceName: 'Deep Cleaning - Smith Residence',
                serviceType: 'deep-cleaning',
                status: 'in-progress',
                priority: 'high',
                category: 'today',
                startTime: '10:00 AM',
                endTime: '1:00 PM',
                timeRemaining: '45 minutes',
                progress: 65,
                client: {
                    name: 'Mrs. Sarah Smith',
                    phone: '+27 82 123 4567',
                    address: '123 Marine Drive, Durban North',
                    specialInstructions: 'Focus on kitchen and bathrooms'
                },
                location: {
                    latitude: -29.8587,
                    longitude: 31.0218,
                    distance: 2.3
                },
                payment: {
                    estimated: 350,
                    method: 'card',
                    status: 'pending'
                },
                equipment: ['vacuum', 'mop', 'cleaning_supplies'],
                photos: [],
                startedAt: '2024-11-20T10:00:00Z',
                updatedAt: '2024-11-20T11:15:00Z'
            },
            {
                id: 'JOB002',
                serviceName: 'Standard Cleaning - Jones Apartment',
                serviceType: 'standard-cleaning',
                status: 'scheduled',
                priority: 'normal',
                category: 'today',
                startTime: '2:00 PM',
                endTime: '4:00 PM',
                timeUntil: '3 hours',
                client: {
                    name: 'Mr. David Jones',
                    phone: '+27 83 987 6543',
                    address: '456 Musgrave Road, Musgrave',
                    specialInstructions: 'Focus on kitchen and bathrooms'
                },
                location: {
                    latitude: -29.8499,
                    longitude: 30.9947,
                    distance: 5.1
                },
                payment: {
                    estimated: 200,
                    method: 'cash',
                    status: 'pending'
                },
                equipment: ['vacuum', 'mop', 'cleaning_supplies'],
                photos: [],
                createdAt: '2024-11-19T14:30:00Z',
                updatedAt: '2024-11-19T14:30:00Z'
            },
            {
                id: 'JOB003',
                serviceName: 'Move-out Cleaning - Wilson House',
                serviceType: 'move-out-cleaning',
                status: 'completed',
                priority: 'normal',
                category: 'completed',
                startTime: '8:00 AM',
                endTime: '12:00 PM',
                completedAt: '2024-11-19T12:00:00Z',
                client: {
                    name: 'Ms. Emily Wilson',
                    phone: '+27 81 456 7890',
                    address: '789 Westville Road, Westville'
                },
                location: {
                    latitude: -29.8833,
                    longitude: 30.9333,
                    distance: 8.2
                },
                payment: {
                    estimated: 450,
                    actual: 450,
                    method: 'transfer',
                    status: 'completed'
                },
                rating: {
                    score: 5,
                    feedback: 'Excellent work! Very thorough cleaning.'
                },
                photos: ['before1.jpg', 'after1.jpg', 'after2.jpg']
            }
        ];

        this.updateStaffStats();
    }

    /**
     * Update staff statistics display
     */
    updateStaffStats() {
        if (this.todayEarningsEl) {
            this.todayEarningsEl.textContent = `R${this.staffStats.todayEarnings}`;
        }
        if (this.hoursWorkedEl) {
            this.hoursWorkedEl.textContent = `${this.staffStats.hoursScheduled}h`;
        }
        if (this.ratingEl) {
            this.ratingEl.textContent = this.staffStats.rating.toFixed(1);
        }
        if (this.notificationBadge) {
            this.notificationBadge.textContent = this.staffStats.unreadNotifications;
            this.notificationBadge.style.display = this.staffStats.unreadNotifications > 0 ? 'block' : 'none';
        }

        // Update jobs count
        const todayJobs = this.jobs.filter(job => job.category === 'today').length;
        if (this.jobsCountEl) {
            this.jobsCountEl.textContent = `${todayJobs} job${todayJobs !== 1 ? 's' : ''} today`;
        }
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Filter tabs
        this.filterTabs.forEach(tab => {
            tab.addEventListener('click', this.handleFilterChange.bind(this));
        });

        // Job actions (using event delegation)
        if (this.jobsContainer) {
            this.jobsContainer.addEventListener('click', this.handleJobAction.bind(this));
        }

        // Header actions
        if (this.filterBtn) {
            this.filterBtn.addEventListener('click', this.handleFilterOptions.bind(this));
        }
        if (this.notificationsBtn) {
            this.notificationsBtn.addEventListener('click', this.handleNotifications.bind(this));
        }

        // Emergency button
        if (this.emergencyBtn) {
            this.emergencyBtn.addEventListener('click', this.handleEmergency.bind(this));
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));

        // Page visibility change (for real-time updates)
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

        // Online/offline status
        window.addEventListener('online', () => this.showNotification('Connection restored', 'success'));
        window.addEventListener('offline', () => this.showNotification('Working offline', 'warning'));
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
     * Apply job filter
     */
    applyFilter(filterValue) {
        this.currentFilter = filterValue;
        
        switch (filterValue) {
            case 'today':
                this.filteredJobs = this.jobs.filter(job => job.category === 'today');
                break;
            case 'upcoming':
                this.filteredJobs = this.jobs.filter(job => 
                    job.status === 'scheduled' || job.status === 'confirmed'
                );
                break;
            case 'completed':
                this.filteredJobs = this.jobs.filter(job => job.category === 'completed');
                break;
            default:
                this.filteredJobs = [...this.jobs];
        }

        // Sort jobs by priority and time
        this.filteredJobs.sort((a, b) => {
            const priorityOrder = { 'high': 0, 'normal': 1, 'low': 2 };
            const statusOrder = { 'in-progress': 0, 'scheduled': 1, 'completed': 2 };
            
            // First by status
            const statusDiff = statusOrder[a.status] - statusOrder[b.status];
            if (statusDiff !== 0) return statusDiff;
            
            // Then by priority
            const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
            if (priorityDiff !== 0) return priorityDiff;
            
            // Finally by start time
            return a.startTime.localeCompare(b.startTime);
        });

        this.renderJobs();
    }

    /**
     * Render jobs list
     */
    renderJobs() {
        if (!this.jobsContainer) return;

        // Clear container
        this.jobsContainer.innerHTML = '';

        if (this.filteredJobs.length === 0) {
            this.showEmptyState();
            return;
        }

        this.hideEmptyState();

        // Render each job
        this.filteredJobs.forEach((job, index) => {
            const jobElement = this.createJobElement(job, index);
            this.jobsContainer.appendChild(jobElement);
        });
    }

    /**
     * Create job card element
     */
    createJobElement(job, index) {
        const article = document.createElement('article');
        article.className = `job-card ${job.status === 'in-progress' ? 'active-job' : 'upcoming-job'}`;
        article.setAttribute('data-job-id', job.id);
        article.setAttribute('data-status', job.status);
        article.style.animationDelay = `${index * 0.1}s`;

        const statusClass = `status-${job.status.replace('-', '')}`;
        const statusText = job.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());

        article.innerHTML = `
            <div class="job-status-badge ${statusClass}" role="status" aria-label="Job ${job.status}">
                <span class="status-dot"></span>
                <span class="status-text">${statusText}</span>
            </div>
            
            <div class="job-header">
                <div class="job-main-info">
                    <h3 class="job-title">${this.escapeHtml(job.serviceName)}</h3>
                    <div class="job-client">
                        <span class="client-icon">👤</span>
                        <span class="client-name">${this.escapeHtml(job.client.name)}</span>
                        <span class="client-phone" data-phone="${job.client.phone}" title="Call client">📞</span>
                    </div>
                </div>
                <div class="job-priority">
                    ${job.priority === 'high' ? '<span class="priority-badge high">High Priority</span>' : ''}
                    <button class="job-menu-btn" aria-label="Job options" data-job-id="${job.id}">⋮</button>
                </div>
            </div>

            <div class="job-details">
                <div class="job-timing">
                    <span class="timing-icon">${this.getTimingIcon(job.status)}</span>
                    <div class="timing-info">
                        <span class="job-time">Today • ${job.startTime} - ${job.endTime}</span>
                        ${this.renderTimingSubtext(job)}
                    </div>
                </div>
                
                <div class="job-location">
                    <span class="location-icon">📍</span>
                    <div class="location-info">
                        <span class="job-address">${this.escapeHtml(job.client.address)}</span>
                        <span class="distance">${job.location.distance} km away</span>
                    </div>
                </div>

                <div class="job-payment">
                    <span class="payment-icon">💳</span>
                    <div class="payment-info">
                        <span class="estimated-pay">R${job.payment.actual || job.payment.estimated} ${job.payment.actual ? 'earned' : 'estimated'}</span>
                        <span class="payment-method">${this.formatPaymentMethod(job.payment.method)}</span>
                    </div>
                </div>
            </div>

            <div class="job-type-badge ${job.serviceType.replace('-', '')}">${this.formatServiceType(job.serviceType)}</div>

            ${this.renderJobProgress(job)}
            ${this.renderSpecialInstructions(job)}

            <div class="job-actions">
                ${this.renderActionButtons(job)}
            </div>
        `;

        return article;
    }

    /**
     * Get timing icon based on job status
     */
    getTimingIcon(status) {
        const icons = {
            'in-progress': '🕘',
            'scheduled': '🕐',
            'completed': '✅',
            'cancelled': '❌'
        };
        return icons[status] || '⏰';
    }

    /**
     * Render timing subtext
     */
    renderTimingSubtext(job) {
        if (job.status === 'in-progress' && job.timeRemaining) {
            return `<span class="time-remaining">${job.timeRemaining} remaining</span>`;
        } else if (job.status === 'scheduled' && job.timeUntil) {
            return `<span class="time-until">Starts in ${job.timeUntil}</span>`;
        } else if (job.status === 'completed' && job.completedAt) {
            const completedTime = new Date(job.completedAt).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit' 
            });
            return `<span class="completed-time">Completed at ${completedTime}</span>`;
        }
        return '';
    }

    /**
     * Format payment method for display
     */
    formatPaymentMethod(method) {
        const methods = {
            'card': 'Card payment',
            'cash': 'Cash payment',
            'transfer': 'Bank transfer'
        };
        return methods[method] || method;
    }

    /**
     * Format service type for display
     */
    formatServiceType(type) {
        return type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    /**
     * Render job progress bar (for in-progress jobs)
     */
    renderJobProgress(job) {
        if (job.status !== 'in-progress' || !job.progress) return '';
        
        return `
            <div class="job-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${job.progress}%;"></div>
                </div>
                <span class="progress-text">${job.progress}% Complete</span>
            </div>
        `;
    }

    /**
     * Render special instructions
     */
    renderSpecialInstructions(job) {
        if (!job.client.specialInstructions) return '';
        
        return `
            <div class="job-special-instructions">
                <span class="instructions-icon">📝</span>
                <span class="instructions-text">${this.escapeHtml(job.client.specialInstructions)}</span>
            </div>
        `;
    }

    /**
     * Render action buttons based on job status
     */
    renderActionButtons(job) {
        switch (job.status) {
            case 'in-progress':
                return `
                    <button class="action-btn primary-btn" data-action="continue" data-job-id="${job.id}">
                        <span class="btn-icon">▶️</span>
                        <span class="btn-text">Continue Job</span>
                    </button>
                    <button class="action-btn secondary-btn" data-action="navigate" data-job-id="${job.id}">
                        <span class="btn-icon">🗺️</span>
                        <span class="btn-text">Navigate</span>
                    </button>
                `;
            case 'scheduled':
                return `
                    <button class="action-btn primary-btn" data-action="start" data-job-id="${job.id}">
                        <span class="btn-icon">🚀</span>
                        <span class="btn-text">Start Job</span>
                    </button>
                    <button class="action-btn secondary-btn" data-action="navigate" data-job-id="${job.id}">
                        <span class="btn-icon">🗺️</span>
                        <span class="btn-text">Navigate</span>
                    </button>
                    <button class="action-btn info-btn" data-action="details" data-job-id="${job.id}">
                        <span class="btn-icon">ℹ️</span>
                        <span class="btn-text">Details</span>
                    </button>
                `;
            case 'completed':
                return `
                    <button class="action-btn secondary-btn" data-action="view-photos" data-job-id="${job.id}">
                        <span class="btn-icon">📸</span>
                        <span class="btn-text">View Photos</span>
                    </button>
                    <button class="action-btn info-btn" data-action="receipt" data-job-id="${job.id}">
                        <span class="btn-icon">🧾</span>
                        <span class="btn-text">Receipt</span>
                    </button>
                `;
            default:
                return `
                    <button class="action-btn info-btn" data-action="details" data-job-id="${job.id}">
                        <span class="btn-icon">ℹ️</span>
                        <span class="btn-text">Details</span>
                    </button>
                `;
        }
    }

    /**
     * Handle job action clicks
     */
    handleJobAction(event) {
        // Handle phone calls
        if (event.target.classList.contains('client-phone')) {
            const phone = event.target.getAttribute('data-phone');
            this.initiateCall(phone);
            return;
        }

        // Handle action buttons
        const button = event.target.closest('button[data-action]');
        if (!button) return;

        const action = button.getAttribute('data-action');
        const jobId = button.getAttribute('data-job-id');
        const job = this.jobs.find(j => j.id === jobId);

        if (!job) {
            console.error('Job not found:', jobId);
            return;
        }

        this.executeJobAction(action, job, button);
    }

    /**
     * Execute job actions
     */
    async executeJobAction(action, job, button) {
        // Set loading state
        this.setButtonLoading(button, true);

        try {
            switch (action) {
                case 'start':
                    await this.startJob(job);
                    break;
                case 'continue':
                    await this.continueJob(job);
                    break;
                case 'navigate':
                    await this.navigateToJob(job);
                    break;
                case 'details':
                    this.viewJobDetails(job);
                    break;
                case 'view-photos':
                    this.viewJobPhotos(job);
                    break;
                case 'receipt':
                    this.viewJobReceipt(job);
                    break;
                default:
                    console.warn('Unknown action:', action);
            }
        } catch (error) {
            console.error('Action failed:', error);
            this.showNotification('Action failed. Please try again.', 'error');
        } finally {
            this.setButtonLoading(button, false);
        }
    }

    /**
     * Start a job
     */
    async startJob(job) {
        // Simulate API call
        await this.delay(1000);
        
        // Update job status
        job.status = 'in-progress';
        job.progress = 10;
        job.startedAt = new Date().toISOString();
        job.timeRemaining = this.calculateTimeRemaining(job);
        
        this.showNotification(`Started ${job.serviceName}`, 'success');
        this.applyFilter(this.currentFilter);
        
        // Start location tracking
        this.startLocationTracking(job);
    }

    /**
     * Continue an in-progress job
     */
    async continueJob(job) {
        this.showNotification('Opening job details...', 'info');
        // In a real app, this would navigate to job details/timer screen
        setTimeout(() => {
            window.location.href = `job-details.html?id=${job.id}`;
        }, 1000);
    }

    /**
     * Navigate to job location
     */
    async navigateToJob(job) {
        if (!job.location.latitude || !job.location.longitude) {
            this.showNotification('Location not available', 'error');
            return;
        }

        const url = `https://www.google.com/maps/dir/?api=1&destination=${job.location.latitude},${job.location.longitude}`;
        window.open(url, '_blank');
        
        this.showNotification('Opening navigation...', 'success');
    }

    /**
     * View job details
     */
    viewJobDetails(job) {
        this.showNotification(`Viewing details for ${job.serviceName}`, 'info');
        // window.location.href = `job-details.html?id=${job.id}`;
    }

    /**
     * View job photos
     */
    viewJobPhotos(job) {
        if (!job.photos || job.photos.length === 0) {
            this.showNotification('No photos available for this job', 'info');
            return;
        }
        
        this.showNotification(`Viewing ${job.photos.length} photo(s)`, 'info');
        // In a real app, open photo gallery
    }

    /**
     * View job receipt
     */
    viewJobReceipt(job) {
        this.showNotification('Generating receipt...', 'info');
        // In a real app, generate and download receipt
    }

    /**
     * Initiate phone call
     */
    initiateCall(phoneNumber) {
        if (confirm(`Call ${phoneNumber}?`)) {
            window.location.href = `tel:${phoneNumber}`;
            this.showNotification('Initiating call...', 'info');
        }
    }

    /**
     * Handle filter options
     */
    handleFilterOptions() {
        // Simple implementation - in real app would show filter modal
        const filterOptions = ['All Jobs', 'High Priority Only', 'Nearby Jobs', 'My Specialties'];
        const selected = prompt('Filter options:\n' + filterOptions.map((opt, i) => `${i + 1}. ${opt}`).join('\n') + '\n\nSelect option (1-4):');
        
        if (selected && selected >= 1 && selected <= 4) {
            this.showNotification(`Applied filter: ${filterOptions[selected - 1]}`, 'success');
        }
    }

    /**
     * Handle notifications
     */
    handleNotifications() {
        const notifications = [
            'New job assigned: Garden Services',
            'Payment received for Deep Cleaning job',
            'Customer rating: 5 stars for your last job!'
        ];
        
        // Simple implementation - in real app would show notifications panel
        this.showNotification(`${notifications.length} new notifications`, 'info');
        
        // Mark as read
        this.staffStats.unreadNotifications = 0;
        this.updateStaffStats();
    }

    /**
     * Handle emergency button
     */
    handleEmergency() {
        if (confirm('Contact emergency support? This will immediately connect you with our support team.')) {
            // In a real app, this would initiate emergency protocol
            this.showNotification('Contacting emergency support...', 'error');
            
            // Simulate emergency call
            setTimeout(() => {
                window.location.href = 'tel:+27800123456';
            }, 1000);
        }
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboardShortcuts(event) {
        // Only handle shortcuts when not typing in input fields
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;

        switch (event.key) {
            case '1':
                this.switchFilter('today');
                break;
            case '2':
                this.switchFilter('upcoming');
                break;
            case '3':
                this.switchFilter('completed');
                break;
            case 'r':
            case 'R':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.refreshJobs();
                }
                break;
            case 'n':
            case 'N':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.handleNotifications();
                }
                break;
            case 'e':
            case 'E':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.handleEmergency();
                }
                break;
        }
    }

    /**
     * Switch filter programmatically
     */
    switchFilter(filterValue) {
        const targetTab = Array.from(this.filterTabs).find(tab => 
            tab.getAttribute('data-filter') === filterValue
        );
        
        if (targetTab) {
            targetTab.click();
        }
    }

    /**
     * Handle page visibility changes
     */
    handleVisibilityChange() {
        if (document.visibilityState === 'visible') {
            // Resume real-time updates when page becomes visible
            this.startRealtimeUpdates();
            this.refreshJobs();
        } else {
            // Pause updates when page is hidden
            this.stopRealtimeUpdates();
        }
    }

    /**
     * Start real-time updates
     */
    startRealtimeUpdates() {
        if (this.refreshInterval) return;
        
        // Update every 30 seconds
        this.refreshInterval = setInterval(() => {
            this.updateJobProgress();
            this.updateTimeRemaining();
        }, 30000);
    }

    /**
     * Stop real-time updates
     */
    stopRealtimeUpdates() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    /**
     * Update job progress for in-progress jobs
     */
    updateJobProgress() {
        const inProgressJobs = this.jobs.filter(job => job.status === 'in-progress');
        
        inProgressJobs.forEach(job => {
            if (job.progress < 100) {
                // Simulate progress increment
                job.progress = Math.min(job.progress + Math.random() * 5, 100);
                job.timeRemaining = this.calculateTimeRemaining(job);
                
                if (job.progress >= 100) {
                    job.status = 'completed';
                    job.completedAt = new Date().toISOString();
                    this.showNotification(`${job.serviceName} completed!`, 'success');
                }
            }
        });
        
        // Re-render if viewing today's jobs
        if (this.currentFilter === 'today') {
            this.renderJobs();
        }
    }

    /**
     * Update time remaining for scheduled jobs
     */
    updateTimeRemaining() {
        const scheduledJobs = this.jobs.filter(job => job.status === 'scheduled');
        
        scheduledJobs.forEach(job => {
            // Update time until job starts
            const now = new Date();
            const jobTime = this.parseJobTime(job.startTime);
            const timeDiff = jobTime.getTime() - now.getTime();
            
            if (timeDiff <= 0) {
                // Job should have started
                job.timeUntil = 'Starting now';
            } else {
                const hours = Math.floor(timeDiff / (1000 * 60 * 60));
                const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
                
                if (hours > 0) {
                    job.timeUntil = `${hours}h ${minutes}m`;
                } else {
                    job.timeUntil = `${minutes} minutes`;
                }
            }
        });
    }

    /**
     * Parse job time string to Date object
     */
    parseJobTime(timeString) {
        const today = new Date();
        const [time, period] = timeString.split(' ');
        const [hours, minutes] = time.split(':').map(Number);
        
        let adjustedHours = hours;
        if (period === 'PM' && hours !== 12) {
            adjustedHours += 12;
        } else if (period === 'AM' && hours === 12) {
            adjustedHours = 0;
        }
        
        const jobDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), adjustedHours, minutes);
        return jobDate;
    }

    /**
     * Calculate time remaining for in-progress job
     */
    calculateTimeRemaining(job) {
        if (!job.endTime) return null;
        
        const now = new Date();
        const endTime = this.parseJobTime(job.endTime);
        const timeDiff = endTime.getTime() - now.getTime();
        
        if (timeDiff <= 0) return 'Overtime';
        
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
            return `${hours}h ${minutes}m remaining`;
        } else {
            return `${minutes} minutes remaining`;
        }
    }

    /**
     * Request location permission
     */
    async requestLocationPermission() {
        if (!navigator.geolocation) {
            console.warn('Geolocation not supported');
            return;
        }

        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutes
                });
            });
            
            this.locationTracking = true;
            console.log('Location permission granted');
            
            // Update job distances based on current location
            this.updateJobDistances(position.coords);
            
        } catch (error) {
            console.warn('Location permission denied:', error);
            this.showNotification('Location access denied. Distance calculations may be inaccurate.', 'warning');
        }
    }

    /**
     * Start location tracking for active job
     */
    startLocationTracking(job) {
        if (!this.locationTracking || !navigator.geolocation) return;

        // Track location every 5 minutes during active job
        const trackingInterval = setInterval(() => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    console.log('Location updated for job:', job.id);
                    // In a real app, send location to server
                },
                (error) => {
                    console.warn('Location tracking failed:', error);
                },
                { enableHighAccuracy: true, timeout: 5000 }
            );
        }, 300000); // 5 minutes

        // Store interval ID to clear later
        job.trackingInterval = trackingInterval;
    }

    /**
     * Update job distances based on current location
     */
    updateJobDistances(coords) {
        this.jobs.forEach(job => {
            if (job.location.latitude && job.location.longitude) {
                const distance = this.calculateDistance(
                    coords.latitude, coords.longitude,
                    job.location.latitude, job.location.longitude
                );
                job.location.distance = Math.round(distance * 10) / 10; // Round to 1 decimal
            }
        });

        // Re-render jobs if currently viewing
        this.renderJobs();
    }

    /**
     * Calculate distance between two coordinates
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of Earth in kilometers
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Convert degrees to radians
     */
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    /**
     * Set button loading state
     */
    setButtonLoading(button, isLoading) {
        if (!button) return;

        const btnText = button.querySelector('.btn-text');
        const btnIcon = button.querySelector('.btn-icon');

        if (isLoading) {
            button.disabled = true;
            button.classList.add('loading');
            if (btnText) btnText.textContent = 'Processing...';
            if (btnIcon) btnIcon.textContent = '⏳';
        } else {
            button.disabled = false;
            button.classList.remove('loading');
            // Restore original text and icon would need to be handled per action
        }
    }

    /**
     * Show/hide empty state
     */
    showEmptyState() {
        if (this.emptyState) {
            this.emptyState.style.display = 'block';
        }
    }

    hideEmptyState() {
        if (this.emptyState) {
            this.emptyState.style.display = 'none';
        }
    }

    /**
     * Refresh jobs data
     */
    async refreshJobs() {
        try {
            this.showNotification('Refreshing jobs...', 'info');
            
            // Simulate API call
            await this.delay(1000);
            
            // In a real app, fetch fresh data from server
            this.updateStaffStats();
            this.applyFilter(this.currentFilter);
            
            this.showNotification('Jobs updated', 'success');
        } catch (error) {
            console.error('Failed to refresh jobs:', error);
            this.showNotification('Failed to refresh jobs', 'error');
        }
    }

    /**
     * Utility: Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Utility: Delay function for simulating async operations
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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
        notification.innerHTML = `
            <span class="notification-icon">${this.getNotificationIcon(type)}</span>
            <span class="notification-text">${message}</span>
        `;
        
        // Style notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: '9999',
            padding: '12px 20px',
            borderRadius: '12px',
            color: 'white',
            fontWeight: '500',
            fontSize: '0.9rem',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            backgroundColor: this.getNotificationColor(type),
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            minWidth: '200px',
            maxWidth: '90vw'
        });

        this.addNotificationStyles();
        document.body.appendChild(notification);

        // Auto-remove after 3 seconds
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
     * Get notification icon based on type
     */
    getNotificationIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }

    /**
     * Get notification color based on type
     */
    getNotificationColor(type) {
        const colors = {
            error: '#ef4444',
            success: '#10b981',
            warning: '#f59e0b',
            info: '#3b82f6'
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
            .notification {
                animation: slideInDown 0.3s ease-out;
            }
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
     * Cleanup function
     */
    destroy() {
        this.stopRealtimeUpdates();
        
        // Clear location tracking intervals
        this.jobs.forEach(job => {
            if (job.trackingInterval) {
                clearInterval(job.trackingInterval);
            }
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.staffDashboard = new StaffDashboardManager();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.staffDashboard) {
        window.staffDashboard.destroy();
    }
});