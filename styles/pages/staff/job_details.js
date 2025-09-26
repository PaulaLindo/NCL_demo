/**
 * Job Details Manager
 * Manages job details, time tracking, and job completion functionality
 */

class JobDetailsManager {
    constructor() {
        this.jobId = this.getJobIdFromUrl();
        this.jobData = null;
        this.timeTracker = {
            startTime: null,
            totalTime: 0,
            breakTime: 0,
            isRunning: false,
            isPaused: false,
            intervals: []
        };
        this.photoManager = null;
        this.locationManager = null;
        
        this.init();
    }

    /**
     * Initialize the job details manager
     */
    init() {
        this.cacheElements();
        this.loadJobData();
        this.initializeTimeTracker();
        this.initializePhotoManager();
        this.initializeLocationManager();
        this.bindEvents();
        this.startRealtimeUpdates();
        this.updateUI();
    }

    /**
     * Cache DOM elements
     */
    cacheElements() {
        // Header elements
        this.backBtn = document.querySelector('.header-back-btn');
        this.jobMenuBtn = document.getElementById('jobMenuBtn');
        this.emergencyBtn = document.getElementById('emergencyBtn');

        // Status elements
        this.statusBanner = document.getElementById('statusBanner');
        this.elapsedTimeEl = document.getElementById('elapsedTime');

        // Time tracker elements
        this.timeDisplay = document.getElementById('timeDisplay');
        this.breakTimeEl = document.getElementById('breakTime');
        this.activeTimeEl = document.getElementById('activeTime');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.stopBtn = document.getElementById('stopBtn');

        // Progress elements
        this.progressPercentage = document.getElementById('progressPercentage');
        this.progressFill = document.getElementById('progressFill');

        // Photo elements
        this.photoCount = document.getElementById('photoCount');
        this.photoGrid = document.getElementById('photoGrid');
        this.addPhotoBtn = document.getElementById('addPhotoBtn');
        this.takePhotoBtn = document.getElementById('takePhotoBtn');
        this.viewPhotosBtn = document.getElementById('viewPhotosBtn');

        // Location elements
        this.mapPlaceholder = document.getElementById('mapPlaceholder');
        this.navigateBtn = document.getElementById('navigateBtn');
        this.shareLocationBtn = document.getElementById('shareLocationBtn');

        // Phone buttons
        this.phoneBtns = document.querySelectorAll('.phone-btn');
        this.smsBtns = document.querySelectorAll('.sms-btn');
    }

    /**
     * Load job data from URL parameter or storage
     */
    loadJobData() {
        // Mock job data - in real app would fetch from API
        this.jobData = {
            id: this.jobId || 'JOB001',
            serviceName: 'Deep Cleaning - Smith Residence',
            serviceType: 'deep-cleaning',
            status: 'in-progress',
            priority: 'high',
            startTime: '10:00 AM',
            endTime: '1:00 PM',
            estimatedDuration: 180, // minutes
            actualStartTime: '2024-11-20T10:00:00Z',
            client: {
                name: 'Mrs. Sarah Smith',
                phone: '+27725556789',
                email: 'sarah.smith@email.com',
                address: '123 Marine Drive, Durban North, 4051',
                specialInstructions: 'Please use eco-friendly products only. Focus extra attention on the kitchen and master bathroom. Pet cat may be present - please keep doors closed.',
                preferences: ['eco-friendly', 'pet-safe']
            },
            location: {
                latitude: -29.8587,
                longitude: 31.0218,
                distance: 2.3,
                parkingNotes: 'Street parking available',
                accessNotes: 'Main entrance - Ring doorbell',
                keyLocation: 'Key under flower pot (left side)'
            },
            payment: {
                estimated: 350,
                method: 'card',
                status: 'pending'
            },
            equipment: [
                { name: 'Vacuum cleaner', required: true, checked: true },
                { name: 'Mop and bucket', required: true, checked: true },
                { name: 'Cleaning supplies', required: true, checked: true },
                { name: 'Steam cleaner', required: false, checked: false }
            ],
            supplies: [
                { name: 'All-purpose cleaner', category: 'eco', checked: true },
                { name: 'Bathroom cleaner', category: 'eco', checked: true },
                { name: 'Floor cleaner', category: 'eco', checked: false }
            ],
            rooms: [
                { name: 'Living Room', status: 'completed', timeSpent: 25 },
                { name: 'Kitchen', status: 'completed', timeSpent: 35 },
                { name: 'Master Bathroom', status: 'in-progress', timeSpent: 15 },
                { name: 'Bedrooms (2)', status: 'pending', estimatedTime: 40 }
            ],
            progress: 45,
            photos: [
                { id: 1, type: 'before', timestamp: '2024-11-20T10:00:00Z', url: 'before1.jpg' },
                { id: 2, type: 'progress', timestamp: '2024-11-20T11:15:00Z', url: 'progress1.jpg' }
            ]
        };

        // Initialize time tracking if job is in progress
        if (this.jobData.status === 'in-progress' && this.jobData.actualStartTime) {
            const startTime = new Date(this.jobData.actualStartTime);
            const now = new Date();
            this.timeTracker.totalTime = Math.floor((now - startTime) / 1000);
            this.timeTracker.startTime = startTime;
            this.timeTracker.isRunning = true;
        }
    }

    /**
     * Get job ID from URL parameters
     */
    getJobIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    /**
     * Initialize time tracking functionality
     */
    initializeTimeTracker() {
        this.updateTimeDisplay();
        
        if (this.timeTracker.isRunning) {
            this.startTimeTracking();
        }
    }

    /**
     * Initialize photo management
     */
    initializePhotoManager() {
        this.photoManager = {
            photos: this.jobData.photos || [],
            maxPhotos: 10,
            supportedTypes: ['image/jpeg', 'image/png', 'image/webp']
        };
        
        this.updatePhotoDisplay();
    }

    /**
     * Initialize location services
     */
    initializeLocationManager() {
        this.locationManager = {
            currentLocation: null,
            jobLocation: {
                lat: this.jobData.location.latitude,
                lng: this.jobData.location.longitude
            },
            watchId: null
        };
        
        this.requestLocationPermission();
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Navigation
        if (this.backBtn) {
            this.backBtn.addEventListener('click', this.handleBackNavigation.bind(this));
        }

        // Job menu
        if (this.jobMenuBtn) {
            this.jobMenuBtn.addEventListener('click', this.handleJobMenu.bind(this));
        }

        // Emergency
        if (this.emergencyBtn) {
            this.emergencyBtn.addEventListener('click', this.handleEmergency.bind(this));
        }

        // Time controls
        if (this.pauseBtn) {
            this.pauseBtn.addEventListener('click', this.handleTimeControl.bind(this));
        }
        if (this.stopBtn) {
            this.stopBtn.addEventListener('click', this.handleTimeControl.bind(this));
        }

        // Communication
        this.phoneBtns.forEach(btn => {
            btn.addEventListener('click', this.handlePhoneCall.bind(this));
        });
        this.smsBtns.forEach(btn => {
            btn.addEventListener('click', this.handleSMS.bind(this));
        });

        // Location & Navigation
        if (this.mapPlaceholder) {
            this.mapPlaceholder.addEventListener('click', this.openMap.bind(this));
        }
        if (this.navigateBtn) {
            this.navigateBtn.addEventListener('click', this.openNavigation.bind(this));
        }
        if (this.shareLocationBtn) {
            this.shareLocationBtn.addEventListener('click', this.shareLocation.bind(this));
        }

        // Photo management
        if (this.addPhotoBtn) {
            this.addPhotoBtn.addEventListener('click', this.handleAddPhoto.bind(this));
        }
        if (this.takePhotoBtn) {
            this.takePhotoBtn.addEventListener('click', this.takePhoto.bind(this));
        }
        if (this.viewPhotosBtn) {
            this.viewPhotosBtn.addEventListener('click', this.viewAllPhotos.bind(this));
        }

        // Equipment checklist
        const checkboxes = document.querySelectorAll('.checklist-item input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', this.handleEquipmentCheck.bind(this));
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));

        // Page visibility
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }

    /**
     * Handle back navigation
     */
    handleBackNavigation() {
        if (this.timeTracker.isRunning) {
            const confirmed = confirm('Job is still in progress. Are you sure you want to go back?');
            if (!confirmed) return;
        }

        this.cleanup();
        
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = 'staff_dashboard.html';
        }
    }

    /**
     * Handle job menu actions
     */
    handleJobMenu() {
        const actions = [
            'Report Issue',
            'Request Help',
            'Contact Supervisor',
            'View Job History'
        ];
        
        // Simple implementation - in real app would show proper menu
        const selected = prompt('Job Actions:\n' + actions.map((action, i) => `${i + 1}. ${action}`).join('\n') + '\n\nSelect option (1-4):');
        
        if (selected && selected >= 1 && selected <= 4) {
            this.executeJobAction(actions[selected - 1]);
        }
    }

    /**
     * Execute job action
     */
    executeJobAction(action) {
        switch (action) {
            case 'Report Issue':
                this.reportIssue();
                break;
            case 'Request Help':
                this.requestHelp();
                break;
            case 'Contact Supervisor':
                this.contactSupervisor();
                break;
            case 'View Job History':
                this.viewJobHistory();
                break;
            default:
                console.warn('Unknown action:', action);
        }
    }

    /**
     * Report an issue
     */
    reportIssue() {
        const issue = prompt('Describe the issue:');
        if (issue) {
            this.showNotification('Issue reported to supervisor', 'success');
            // In real app, send to server
            console.log('Reported issue:', issue);
        }
    }

    /**
     * Request help
     */
    requestHelp() {
        const helpType = prompt('What kind of help do you need?\n1. Equipment\n2. Supplies\n3. Technical Support\n4. Other\n\nSelect (1-4):');
        if (helpType && helpType >= 1 && helpType <= 4) {
            this.showNotification('Help request sent', 'success');
            // In real app, send to server
        }
    }

    /**
     * Contact supervisor
     */
    contactSupervisor() {
        const supervisorPhone = '+27800123456';
        if (confirm(`Call supervisor at ${supervisorPhone}?`)) {
            window.location.href = `tel:${supervisorPhone}`;
        }
    }

    /**
     * View job history
     */
    viewJobHistory() {
        this.showNotification('Opening job history...', 'info');
        // In real app, navigate to job history page
    }

    /**
     * Handle emergency button
     */
    handleEmergency() {
        if (confirm('Contact emergency support? This will immediately connect you with our emergency team.')) {
            // Log emergency event
            console.log('Emergency activated for job:', this.jobData.id);
            
            // Show emergency notification
            this.showNotification('Contacting emergency support...', 'error');
            
            // In real app, trigger emergency protocol
            setTimeout(() => {
                window.location.href = 'tel:+27800911911';
            }, 1000);
        }
    }

    /**
     * Handle time control actions
     */
    handleTimeControl(event) {
        const action = event.currentTarget.getAttribute('data-action');
        
        switch (action) {
            case 'pause':
                this.toggleBreak();
                break;
            case 'complete':
                this.completeJob();
                break;
            default:
                console.warn('Unknown time control action:', action);
        }
    }

    /**
     * Toggle break/resume
     */
    toggleBreak() {
        if (this.timeTracker.isPaused) {
            this.resumeJob();
        } else {
            this.pauseJob();
        }
    }

    /**
     * Pause job for break
     */
    pauseJob() {
        if (!this.timeTracker.isRunning) return;
        
        this.timeTracker.isPaused = true;
        this.timeTracker.breakStartTime = new Date();
        
        // Update button
        const btnIcon = this.pauseBtn.querySelector('.btn-icon');
        const btnText = this.pauseBtn.querySelector('.btn-text');
        if (btnIcon) btnIcon.textContent = '▶️';
        if (btnText) btnText.textContent = 'Resume';
        
        this.showNotification('Break started', 'info');
        this.logJobEvent('break_started');
    }

    /**
     * Resume job from break
     */
    resumeJob() {
        if (!this.timeTracker.isPaused) return;
        
        // Calculate break duration
        const breakDuration = (new Date() - this.timeTracker.breakStartTime) / 1000;
        this.timeTracker.breakTime += breakDuration;
        
        this.timeTracker.isPaused = false;
        this.timeTracker.breakStartTime = null;
        
        // Update button
        const btnIcon = this.pauseBtn.querySelector('.btn-icon');
        const btnText = this.pauseBtn.querySelector('.btn-text');
        if (btnIcon) btnIcon.textContent = '⏸️';
        if (btnText) btnText.textContent = 'Break';
        
        this.showNotification('Work resumed', 'success');
        this.logJobEvent('work_resumed');
    }

    /**
     * Complete job
     */
    async completeJob() {
        if (!this.timeTracker.isRunning) return;
        
        const confirmed = confirm('Are you sure you want to complete this job?');
        if (!confirmed) return;
        
        try {
            // Stop time tracking
            this.stopTimeTracking();
            
            // Update job status
            this.jobData.status = 'completed';
            this.jobData.completedAt = new Date().toISOString();
            this.jobData.actualDuration = this.timeTracker.totalTime;
            
            // Update UI
            this.updateJobStatus('completed');
            
            // Log completion
            this.logJobEvent('job_completed');
            
            this.showNotification('Job completed successfully!', 'success');
            
            // Show completion summary
            setTimeout(() => {
                this.showCompletionSummary();
            }, 2000);
            
        } catch (error) {
            console.error('Error completing job:', error);
            this.showNotification('Error completing job. Please try again.', 'error');
        }
    }

    /**
     * Show job completion summary
     */
    showCompletionSummary() {
        const totalHours = Math.floor(this.timeTracker.totalTime / 3600);
        const totalMinutes = Math.floor((this.timeTracker.totalTime % 3600) / 60);
        const breakMinutes = Math.floor(this.timeTracker.breakTime / 60);
        
        const summary = `Job Completed!\n\nTime Summary:\n• Total time: ${totalHours}h ${totalMinutes}m\n• Break time: ${breakMinutes}m\n• Photos taken: ${this.photoManager.photos.length}\n• Estimated pay: R${this.jobData.payment.estimated}\n\nRedirecting to dashboard...`;
        
        alert(summary);
        
        setTimeout(() => {
            window.location.href = 'staff_dashboard.html';
        }, 3000);
    }

    /**
     * Start time tracking
     */
    startTimeTracking() {
        if (this.timeTracker.interval) return;
        
        this.timeTracker.interval = setInterval(() => {
            if (!this.timeTracker.isPaused) {
                this.timeTracker.totalTime += 1;
                this.updateTimeDisplay();
                this.updateJobProgress();
            }
        }, 1000);
    }

    /**
     * Stop time tracking
     */
    stopTimeTracking() {
        if (this.timeTracker.interval) {
            clearInterval(this.timeTracker.interval);
            this.timeTracker.interval = null;
        }
        
        this.timeTracker.isRunning = false;
        this.timeTracker.isPaused = false;
    }

    /**
     * Update time display
     */
    updateTimeDisplay() {
        const totalSeconds = this.timeTracker.totalTime;
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (this.timeDisplay) {
            this.timeDisplay.textContent = timeString;
        }
        
        // Update elapsed time in status banner
        const elapsedHours = Math.floor(totalSeconds / 3600);
        const elapsedMinutes = Math.floor((totalSeconds % 3600) / 60);
        let elapsedString;
        
        if (elapsedHours > 0) {
            elapsedString = `${elapsedHours}h ${elapsedMinutes}m elapsed`;
        } else {
            elapsedString = `${elapsedMinutes}m elapsed`;
        }
        
        if (this.elapsedTimeEl) {
            this.elapsedTimeEl.textContent = elapsedString;
        }
        
        // Update breakdown times
        const activeSeconds = totalSeconds - this.timeTracker.breakTime;
        const activeHours = Math.floor(activeSeconds / 3600);
        const activeMinutes = Math.floor((activeSeconds % 3600) / 60);
        const breakMinutes = Math.floor(this.timeTracker.breakTime / 60);
        
        if (this.breakTimeEl) {
            this.breakTimeEl.textContent = `Break: ${breakMinutes}m`;
        }
        
        if (this.activeTimeEl) {
            if (activeHours > 0) {
                this.activeTimeEl.textContent = `Active: ${activeHours}h ${activeMinutes}m`;
            } else {
                this.activeTimeEl.textContent = `Active: ${activeMinutes}m`;
            }
        }
    }

    /**
     * Update job progress based on time
     */
    updateJobProgress() {
        if (!this.jobData.estimatedDuration) return;
        
        const progressPercent = Math.min(
            Math.floor((this.timeTracker.totalTime / 60) / this.jobData.estimatedDuration * 100),
            100
        );
        
        this.jobData.progress = progressPercent;
        this.updateProgressDisplay();
    }

    /**
     * Update progress display
     */
    updateProgressDisplay() {
        if (this.progressPercentage) {
            this.progressPercentage.textContent = `${this.jobData.progress}%`;
        }
        
        if (this.progressFill) {
            this.progressFill.style.width = `${this.jobData.progress}%`;
        }
    }

    /**
     * Update job status display
     */
    updateJobStatus(status) {
        const statusBadge = this.statusBanner?.querySelector('.status-badge');
        const statusText = this.statusBanner?.querySelector('.status-text');
        
        if (statusBadge && statusText) {
            statusBadge.className = `status-badge status-${status.replace('-', '')}`;
            statusText.textContent = status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
    }

    /**
     * Handle phone calls
     */
    handlePhoneCall(event) {
        const phoneNumber = event.currentTarget.getAttribute('data-phone');
        
        if (confirm(`Call ${this.jobData.client.name} at ${phoneNumber}?`)) {
            window.location.href = `tel:${phoneNumber}`;
            this.logJobEvent('client_called', { phone: phoneNumber });
        }
    }

    /**
     * Handle SMS
     */
    handleSMS(event) {
        const phoneNumber = event.currentTarget.getAttribute('data-phone');
        const message = prompt('Enter message:');
        
        if (message) {
            const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
            window.location.href = smsUrl;
            this.logJobEvent('client_texted', { phone: phoneNumber, message });
        }
    }

    /**
     * Open map application
     */
    openMap() {
        const { latitude, longitude } = this.jobData.location;
        const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
        window.open(url, '_blank');
        this.logJobEvent('map_opened');
    }

    /**
     * Open navigation
     */
    openNavigation() {
        const { latitude, longitude } = this.jobData.location;
        const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
        window.open(url, '_blank');
        this.logJobEvent('navigation_opened');
        this.showNotification('Opening navigation...', 'success');
    }

    /**
     * Share current location
     */
    async shareLocation() {
        try {
            const position = await this.getCurrentPosition();
            const { latitude, longitude } = position.coords;
            
            if (navigator.share) {
                await navigator.share({
                    title: 'My Current Location',
                    text: 'Here is my current location',
                    url: `https://www.google.com/maps?q=${latitude},${longitude}`
                });
            } else {
                // Fallback - copy to clipboard
                const locationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
                await navigator.clipboard.writeText(locationUrl);
                this.showNotification('Location copied to clipboard', 'success');
            }
            
            this.logJobEvent('location_shared');
        } catch (error) {
            console.error('Error sharing location:', error);
            this.showNotification('Unable to share location', 'error');
        }
    }

    /**
     * Handle equipment checklist
     */
    handleEquipmentCheck(event) {
        const itemText = event.target.parentNode.querySelector('.item-text').textContent;
        const isChecked = event.target.checked;
        
        this.logJobEvent('equipment_checked', { item: itemText, checked: isChecked });
        
        // Update equipment list
        const equipment = this.jobData.equipment.find(item => item.name === itemText);
        if (equipment) {
            equipment.checked = isChecked;
        }
    }

    /**
     * Photo management methods
     */
    handleAddPhoto() {
        this.takePhoto();
    }

    takePhoto() {
        // In real app, would open camera
        this.showNotification('Opening camera...', 'info');
        
        // Simulate photo capture
        setTimeout(() => {
            const newPhoto = {
                id: Date.now(),
                type: 'progress',
                timestamp: new Date().toISOString(),
                url: `photo_${Date.now()}.jpg`
            };
            
            this.photoManager.photos.push(newPhoto);
            this.updatePhotoDisplay();
            this.showNotification('Photo added successfully', 'success');
            this.logJobEvent('photo_taken', { type: newPhoto.type });
        }, 2000);
    }

    viewAllPhotos() {
        const photoCount = this.photoManager.photos.length;
        this.showNotification(`Viewing ${photoCount} photo(s)`, 'info');
        // In real app, open photo gallery
    }

    updatePhotoDisplay() {
        if (this.photoCount) {
            const count = this.photoManager.photos.length;
            this.photoCount.textContent = `${count} photo${count !== 1 ? 's' : ''}`;
        }
    }

    /**
     * Location services
     */
    async requestLocationPermission() {
        if (!navigator.geolocation) return;
        
        try {
            const position = await this.getCurrentPosition();
            this.locationManager.currentLocation = position.coords;
            
            // Start watching position
            this.locationManager.watchId = navigator.geolocation.watchPosition(
                (position) => {
                    this.locationManager.currentLocation = position.coords;
                },
                (error) => console.warn('Location tracking error:', error),
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
            );
            
        } catch (error) {
            console.warn('Location permission denied:', error);
        }
    }

    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            });
        });
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboardShortcuts(event) {
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;
        
        switch (event.key) {
            case ' ': // Spacebar
                event.preventDefault();
                this.toggleBreak();
                break;
            case 'c':
            case 'C':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.handlePhoneCall({ currentTarget: this.phoneBtns[0] });
                }
                break;
            case 'p':
            case 'P':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.takePhoto();
                }
                break;
            case 'n':
            case 'N':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.openNavigation();
                }
                break;
        }
    }

    /**
     * Handle page visibility changes
     */
    handleVisibilityChange() {
        if (document.visibilityState === 'visible') {
            // Resume time tracking if job was in progress
            if (this.timeTracker.isRunning && !this.timeTracker.interval) {
                this.startTimeTracking();
            }
        }
    }

    /**
     * Start real-time updates
     */
    startRealtimeUpdates() {
        if (this.timeTracker.isRunning) {
            this.startTimeTracking();
        }
    }

    /**
     * Update UI with current data
     */
    updateUI() {
        this.updateProgressDisplay();
        this.updatePhotoDisplay();
        this.updateTimeDisplay();
    }

    /**
     * Log job events for analytics
     */
    logJobEvent(eventType, data = {}) {
        const event = {
            jobId: this.jobData.id,
            eventType,
            timestamp: new Date().toISOString(),
            data
        };
        
        console.log('Job event:', event);
        // In real app, send to analytics service
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
     * Get notification icon
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
     * Get notification color
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
     * Add notification styles
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
    cleanup() {
        // Stop time tracking
        this.stopTimeTracking();
        
        // Stop location tracking
        if (this.locationManager.watchId) {
            navigator.geolocation.clearWatch(this.locationManager.watchId);
        }
        
        // Clear any other intervals
        this.timeTracker.intervals.forEach(intervalId => clearInterval(intervalId));
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.jobDetailsManager = new JobDetailsManager();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.jobDetailsManager) {
        window.jobDetailsManager.cleanup();
    }
});