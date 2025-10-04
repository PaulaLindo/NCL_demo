/**
 * NCL Timekeeping System - Refactored and Consolidated
 * Version: 4.2.4 (FIXED: Uncaught TypeError by moving init() call to constructor)
 */

'use strict';

// =====================================================
// CONFIGURATION & CONSTANTS
// =====================================================

const TIMEKEEPING_CONFIG = {
    UPDATE_INTERVAL: 1000,
    SCAN_SIMULATION_DELAY: 3000,
    NOTIFICATION_DURATION: 4000
};

const MOCK_JOBS = [
    { id: "job001", name: "Deep Cleaning - Smith Residence", serviceType: "Deep Clean", workerRate: 150.00 },
    { id: "job002", name: "Standard Cleaning - Jones Apartment", serviceType: "Standard Clean", workerRate: 100.00 },
    { id: "job003", name: "Elderly Care - Wilson House", serviceType: "Care Service", workerRate: 180.00 },
    { id: "job004", name: "Gardening - Corporate HQ", serviceType: "Gardening", workerRate: 120.00 }
];

const MOCK_ALL_SHIFTS = [
    // External Permanent Job Shifts (e.g., Hotel)
    { date: '2025-10-06', type: 'External', name: 'Hotel Shift (Perm)', hours: '08:00-16:00', location: 'City Center Hotel', isBooked: true },
    { date: '2025-10-13', type: 'External', name: 'Hotel Shift (Perm)', hours: '08:00-16:00', location: 'City Center Hotel', isBooked: true },
    { date: '2025-10-14', type: 'External', name: 'Hotel Shift (Perm)', hours: '08:00-16:00', location: 'City Center Hotel', isBooked: true },
    { date: '2025-10-21', type: 'External', name: 'Hotel Shift (Perm)', hours: '08:00-16:00', location: 'City Center Hotel', isBooked: true },
    { date: '2025-10-22', type: 'External', name: 'Hotel Shift (Perm)', hours: '08:00-16:00', location: 'City Center Hotel', isBooked: true },
    // NCL Booked Jobs/Training
    { date: '2025-10-07', type: 'NCL Shift', name: 'Supervisor Training', hours: '10:00-14:00', location: 'NCL Office', isBooked: true },
    { date: '2025-10-10', type: 'NCL Shift', name: 'Deep Clean - Smith', hours: '14:00-17:00', location: 'Smith Residence', isBooked: true },
    { date: '2025-10-20', type: 'NCL Shift', name: 'Gardening - Corporate HQ', hours: '09:00-12:00', location: 'Corporate HQ', isBooked: true },
    { date: '2025-10-28', type: 'NCL Shift', name: 'Standard Clean - Jones', hours: '11:00-13:00', location: 'Jones Apartment', isBooked: true },
];

const MOCK_PAST_SHIFTS = [
    { id: "rec005", jobName: "Standard Cleaning - Johnson Home", checkIn: '2025-10-01T08:00:00', checkOut: '2025-10-01T15:30:00', totalHours: '7.5', status: 'Approved' },
    { id: "rec006", jobName: "Deep Cleaning - Corporate HQ", checkIn: '2025-09-28T09:30:00', checkOut: '2025-09-28T17:00:00', totalHours: '7.5', status: 'Pending Approval' },
    { id: "rec007", jobName: "Gardening - Wilson Park", checkIn: '2025-09-27T10:00:00', checkOut: '2025-09-27T12:00:00', totalHours: '2.0', status: 'Needs Correction' },
];

const SERVICE_CHECKLISTS = {
    "Deep Clean": [
        "Kitchen cupboards cleaned (inside/out)",
        "Oven and extractor hood degreased",
        "Window frames and tracks cleaned",
        "All surfaces sanitized"
    ],
    "Standard Clean": [
        "Dusting and wiping all surfaces",
        "Vacuuming carpets and mopping floors",
        "Bathroom surfaces sanitized",
        "General tidy-up"
    ],
    "Care Service": [
        "Medication reminders given on time",
        "Meal preparation (as requested)",
        "Light housekeeping completed",
        "Companionship provided"
    ],
    "Gardening": [
        "Lawn mowed and edged",
        "Weeding completed in garden beds",
        "Hedges trimmed (as requested)",
        "Waste disposed of correctly"
    ]
};

// =====================================================
// TEMP CARD MANAGER
// =====================================================

class TempCardManager {
    constructor(appContext) {
        this.app = appContext;
        this.mockCards = {
            'A1B2C3': { id: 'staff005', name: 'Maria Lopez', role: 'Cleaner' },
            'D4E5F6': { id: 'staff006', name: 'James Kim', role: 'Driver' },
        };

        this.activeProxyCard = sessionStorage.getItem('activeProxyCard') || null;
    }

    /**
     * Handles proxy check-in using a physical temp card ID.
     */
    checkIn(cardNumber) {
        const card = this.mockCards[cardNumber];
        if (!card) {
            this.app.showNotification(`Error: Card ID "${cardNumber}" not recognized.`, 'error');
            return;
        }
        if (this.app.activeJob) {
            this.app.showNotification(`Error: Cannot check in ${card.name}. A job is already active.`, 'error');
            return;
        }

        if (this.app.activeJob || this.activeProxyCard) {
            this.app.showNotification(`Error: The system has an active or an activate proxy card (${this.activeProxyCard || this.app.activeJob}). Please checkout first`, 'error');
            return;
        }

        const assignedJob = this.app.MOCK_JOBS[0]; 
        
        this.app.activeJob = assignedJob.id;
        sessionStorage.setItem('activeJobId', assignedJob.id);

        this.activeProxyCard = cardNumber;
        sessionStorage.setItem('activeProxyCard', cardNumber);
        
        this.app.stats.jobs = '1 (Proxy)';
        this.app.stats.status = 'Proxy Check-In';
        this.app.updateHeaderStats();
        
        this.app.renderContent('timer');
        this.app.showNotification(`PROXY CHECK-IN SUCCESSFUL for ${card.name}. Assigned to ${assignedJob.name}.`, 'success');
    }

    /**
     * Handles proxy check-out using a physical temp card ID.
     */
    checkOut(cardNumber) {
        const card = this.mockCards[cardNumber];
        if (!card) {
            this.app.showNotification(`Error: Card ID "${cardNumber}" not recognized.`, 'error');
            return;
        }
        if (!this.app.activeJob) {
            this.app.showNotification(`Error: No job currently active to check ${card.name} out of.`, 'error');
            return;
        }
        if (!this.activeProxyCard || this.app.activeJob !== cardNumber) {
            this.app.showNotification(`Error: Card ID "${cardNumber}" is not the currently checked-in proxy (${this.activeProxyCard || 'None'}).`, 'error');
        }

        // CAPTURE job ID BEFORE clearing activeJob
        const checkedOutJobId = this.app.activeJob; 
        
        this.app.activeJob = null;
        this.activeProxyCard = null;
        sessionStorage.removeItem('activeJobId');
        sessionStorage.removeItem('activeProxyCard');

        // NEW: Record the check-out for display
        if (checkedOutJobId) {
            this.app.recordCheckOut(checkedOutJobId, true); // true for isProxy
        }

        this.app.stats.jobs = '0';
        this.app.stats.status = 'Off-Duty';
        this.app.updateHeaderStats();

        this.app.renderContent('timer');
        this.app.showNotification(`PROXY CHECK-OUT SUCCESSFUL for ${card.name}.`, 'success');
    }
}


// =====================================================
// TIMEKEEPING APPLICATION MANAGER
// =====================================================

class TimekeepingApp {
    constructor() {
        this.activeTab = 'timer';
        this.currentUser = window.getLoggedInUser ? window.getLoggedInUser() : { name: 'Staff', surname: 'Member', isStaff: true };
        this.activeJob = null;
        this.stats = { hours: '0.0', jobs: '0', status: 'Off-Duty' }; 
        this.timeUpdateInterval = null;
        this.MOCK_JOBS = MOCK_JOBS;
        this.timeRecords = []; 
        
        this.contentArea = null;
        this.qrModal = null;
        this.closeScannerBtn = null;
        this.timeDisplay = null;
        this.staffNameDisplay = null;
        this.statElements = {}; 

        this.currentDate = new Date();

        this.allShifts = MOCK_ALL_SHIFTS;
        this.scheduleContainer = null;
        this.periodLabel = null;

        this.contentArea = null;
        
        this.tempCardManager = new TempCardManager(this);
        
        // FIX: Call init() from the constructor to ensure all methods are attached to 'this'
        this.init(); 
    }
    
    /**
     * Initialize the app
     */
    init() {
        this.cacheElements();
        this.loadData();
        this.bindEvents();
        this.startRealtimeUpdates(); 
        this.updateHeaderStats();
        this.updateHeaderName();
        
        // Initial mock record for demonstration
        if (this.timeRecords.length === 0) {
            this.timeRecords.push({
                jobName: "Window Washing - Corporate HQ",
                timeIn: "08:00 AM",
                timeOut: "12:00 PM",
                duration: "4h 00m",
                type: "Self",
                date: "Oct 3"
            });
        }
        
        this.renderContent(this.activeTab); 
    }

    /**
     * Cache DOM elements from the new HTML structure
     */
    cacheElements() {
        this.contentArea = document.getElementById('timekeeping-content-area');
        this.qrModal = document.getElementById('qrScannerModal');
        this.closeScannerBtn = document.getElementById('closeScannerModal');
        this.timeDisplay = document.getElementById('currentTimeDisplay');
        this.staffNameDisplay = document.getElementById('staffNameDisplay');

        this.scheduleContainer = document.getElementById('scheduleCalendar');
        this.periodLabel = document.getElementById('currentPeriodLabel');
        
        this.statElements = {
            hours: document.getElementById('stat-hours'),
            jobs: document.getElementById('stat-jobs'),
            status: document.getElementById('stat-status')
        };
    }

    /**
     * Load initial user and active job data
     */
    loadData() {
        const user = window.getLoggedInUser ? window.getLoggedInUser() : null;
        if (user) {
            this.currentUser = user;
        }

        this.activeJob = sessionStorage.getItem('activeJobId') || null;

        this.stats = {
            hours: '4.5', 
            jobs: this.activeJob ? '1' : '0', 
            status: this.activeJob ? 'On-Duty' : 'Off-Duty'
        };
    }

    /**
     * Bind all event listeners
     */
    bindEvents() {
        // Tab switching events 
        document.getElementById('actionTabs')?.addEventListener('click', (e) => {
            const tab = e.target.closest('.action-tab');
            if (!tab) return;

            const tabId = tab.dataset.tab;
            this.handleTabSwitching(tabId);
        });
        
        // Logout and Back button handlers
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            window.clearLoggedInUser?.();
            window.location.href = 'staff_login.html';
        });

        document.getElementById('backToJobsBtn')?.addEventListener('click', () => {
            window.location.href = 'staff_dashboard.html';
        });

        // QR Scanner close button
        this.closeScannerBtn?.addEventListener('click', () => {
            this.hideQrScanner();
        });

        const scheduleView = document.getElementById('scheduleView');
        if (scheduleView) {
            scheduleView.addEventListener('click', (e) => {
                if (e.target.id === 'prevPeriodBtn') {
                    this.changeCalendarPeriod(-1);
                } else if (e.target.id === 'nextPeriodBtn') {
                    this.changeCalendarPeriod(1);
                }
            });
        }

        const contentArea = document.getElementById('timekeeping-content-area');
        if (contentArea) {
            // Use a delegated event listener on the content area since the schedule view is rendered dynamically
            contentArea.addEventListener('click', (e) => {
                if (e.target.id === 'prevPeriodBtn') {
                    this.changeCalendarPeriod(-1);
                } else if (e.target.id === 'nextPeriodBtn') {
                    this.changeCalendarPeriod(1);
                }
            });
        }
    }

    /**
     * Start the interval for updating the current time display
     */
    startRealtimeUpdates() {
        this.stopRealtimeUpdates(); 
        this.timeUpdateInterval = setInterval(() => {
            this.updateTimeDisplay();
        }, TIMEKEEPING_CONFIG.UPDATE_INTERVAL);
    }
    
    stopRealtimeUpdates() {
        if (this.timeUpdateInterval) {
            clearInterval(this.timeUpdateInterval);
            this.timeUpdateInterval = null;
        }
    }

    updateHeaderName() {
        if (this.staffNameDisplay && this.currentUser) {
            this.staffNameDisplay.textContent = this.currentUser.name || 'Staff Member';
        }
    }
    
    updateHeaderStats() {
        if (this.statElements.hours) this.statElements.hours.textContent = `${this.stats.hours}h`;
        if (this.statElements.jobs) this.statElements.jobs.textContent = this.stats.jobs;
        if (this.statElements.status) this.statElements.status.textContent = this.stats.status;
    }

    updateTimeDisplay() {
        if (this.timeDisplay) {
            const now = new Date();
            const options = { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
            this.timeDisplay.textContent = now.toLocaleDateString('en-ZA', options).replace(/,/g, ' •');
        }
    }

    /**
     * Helper to show notifications 
     */
    showNotification(message, type = 'info') {
        window.UIManager?.showNotification?.(message, type);
    }

    /**
     * Handles the tab switching logic.
     */
    handleTabSwitching(tabId) {
        if (this.activeTab === tabId) return;

        this.activeTab = tabId;

        // Update active class on buttons
        document.querySelectorAll('.action-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.tab === tabId) {
                tab.classList.add('active');
            }
        });

        this.renderContent(tabId);
    }

    /**
     * Renders the specific content for the selected tab into the content area.
     */
    renderContent(tabId) {
        if (!this.contentArea) return;
        this.contentArea.innerHTML = ''; 

        switch (tabId) {
            case 'timer':
                this.contentArea.innerHTML = this.renderTimerView();
                this.bindTimerEvents(); 
                break;
            case 'schedule':
                this.contentArea.innerHTML = this.renderScheduleView();
                this.bindScheduleEvents(); 
                break;
            case 'history':
                this.contentArea.innerHTML = this.renderTimeRecords();
                break;
        }
    }

    /**
     * Changes the current month displayed in the calendar.
     * @param {number} monthOffset - +1 for next month, -1 for previous month.
     */
    changeCalendarPeriod(monthOffset) {
        // This logic only works if the tab is already open. Re-render after changing the date.
        this.currentDate.setMonth(this.currentDate.getMonth() + monthOffset);
        this.renderContent('schedule'); // Re-render the schedule tab content
    }

    /**
     * Attaches click listeners to all free slots to simulate a job search.
     */
    attachFreeSlotListeners() {
        const freeSlots = document.querySelectorAll('.clickable-free-slot');
        freeSlots.forEach(slot => {
            slot.addEventListener('click', (event) => {
                const date = event.currentTarget.getAttribute('data-date');
                // Use the existing logic to handle the job search
                this.handleFindJobsForDay(date); 
            });
        });
    }

    /**
     * Renders the HTML structure for the schedule tab content.
     * This replaces or updates the existing placeholder renderScheduleView().
     */
    renderScheduleView() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const today = new Date().toISOString().split('T')[0];
        
        // Use the month/year of the current date for the label
        const monthName = this.currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

        let calendarHTML = '';

        // Day Headers
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        calendarHTML += dayNames.map(day => `<div class="day-header">${day}</div>`).join('');

        // Pad the start with days from the previous month
        const startDayOfWeek = firstDayOfMonth.getDay(); 
        for (let i = 0; i < startDayOfWeek; i++) {
            calendarHTML += `<div class="calendar-day day-off-month"></div>`;
        }

        // Create a map for quick shift lookup
        const shiftsMap = this.allShifts.reduce((map, shift) => {
            if (!map[shift.date]) map[shift.date] = [];
            map[shift.date].push(shift);
            return map;
        }, {});

        // Render the days of the current month
        for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            const shiftsForDay = shiftsMap[dateString] || [];
            
            let dayClasses = 'calendar-day';
            
            if (dateString === today) {
                dayClasses += ' day-today';
            }
            
            let shiftHTML = '';
            let isFree = shiftsForDay.length === 0;

            if (isFree) {
                dayClasses += ' day-free clickable-free-slot';
                shiftHTML += `<div class="available-job-label">Click to Check Jobs</div>`;
            } else {
                shiftsForDay.forEach(shift => {
                    // Differentiate between External (Hotel) and Platform (NCL) shifts
                    const shiftTypeClass = shift.type === 'External' ? 'shift-external' : 'shift-platform';
                    shiftHTML += `<div class="shift-item ${shiftTypeClass}" title="${shift.name} (${shift.hours})">
                                      ${shift.hours} ${shift.type === 'External' ? ' (Hotel)' : ''}
                                  </div>`;
                });
            }

            calendarHTML += `<div class="${dayClasses}" data-date="${dateString}">
                                 <span class="day-number">${day}</span>
                                 ${shiftHTML}
                             </div>`;
        }
        
        // Pad the end 
        const totalCells = startDayOfWeek + lastDayOfMonth.getDate();
        const endPadding = 42 - totalCells; 
        for (let i = 0; i < endPadding && (totalCells + i) % 7 !== 0; i++) {
            calendarHTML += `<div class="calendar-day day-off-month"></div>`;
        }
        
        // Final structure for the entire schedule tab content
        return `
            <div id="scheduleView" class="schedule-view-container"> 
                <h3 class="section-title">Schedule</h3>
                <p class="section-subtitle">View your permanent job (Hotel) and platform shifts. Click a green day to find new jobs!</p>
                
                <div class="schedule-controls">
                    <button id="prevPeriodBtn" class="control-btn">&lt; Prev</button>
                    <span id="currentPeriodLabel" class="period-label">${monthName}</span>
                    <button id="nextPeriodBtn" class="control-btn">&gt; Next</button>
                </div>
                <div class="calendar-scroll-wrapper">
                    <div id="scheduleCalendar" class="schedule-calendar">
                        ${calendarHTML}
                    </div>
                </div>
            </div>
        `;
    }
    
    // =====================================================
    // CORE LOGIC METHODS
    // =====================================================

    /**
     * Records a completed job check-out as a mock time record.
     */
    recordCheckOut(jobId, isProxy = false) {
        const job = this.MOCK_JOBS.find(j => j.id === jobId);
        const jobName = job?.name || 'Unknown Job';
        const duration = '4h 00m'; // Mock duration
        const type = isProxy ? 'Proxy' : 'Self';
        
        const now = new Date();
        const timeFormat = { hour: '2-digit', minute: '2-digit', hour12: true };

        // Create new record and add to the start of the array
        const newRecord = {
            jobName: jobName,
            timeIn: now.toLocaleTimeString('en-ZA', timeFormat),
            timeOut: now.toLocaleTimeString('en-ZA', timeFormat),
            duration: duration,
            type: type,
            date: now.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })
        };
        
        this.timeRecords.unshift(newRecord);
    }

    // =====================================================
    // VIEW RENDERING METHODS
    // =====================================================

    renderTimeRecords() {
        if (this.timeRecords.length === 0) {
            return '<p class="empty-state">No time records found for today.</p>';
        }

        // Use simple HTML classes that are likely styled in components/timekeeping.css
        return this.timeRecords.map(record => `
            <div class="record-item card-style" style="margin-bottom: 10px; padding: 12px; border-left: 5px solid var(--primary-color);">
                <div class="record-details">
                    <strong class="record-job">${record.jobName}</strong>
                    <span class="record-time" style="font-size: 0.9em; color: #64748b;">${record.date} | ${record.timeIn} - ${record.timeOut}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 5px;">
                    <span class="record-duration" style="font-weight: 700; color: #059669;">Duration: ${record.duration}</span>
                    <span class="record-type" style="font-size: 0.8em; padding: 4px 8px; border-radius: 4px; background: #e2f0f9; color: #3b82f6;">${record.type}</span>
                </div>
            </div>
        `).join('');
    }

    renderTimerView() {
        const currentJobName = this.activeJob 
            ? this.MOCK_JOBS.find(j => j.id === this.activeJob)?.name || 'Unknown Job'
            : 'No job currently active.';
        
        const scanDisabled = this.activeJob ? 'disabled' : '';
        const checkoutDisabled = !this.activeJob ? 'disabled' : '';

        return `
            <section class="job-assignment-card card-style">
                <div class="current-job">
                    <h3>Current Job</h3>
                    <p id="currentJobName">${currentJobName}</p>
                </div>
                <div class="job-actions">
                    <button class="action-btn primary-btn" id="scanQrBtn" ${scanDisabled}>Scan QR Code</button>
                    <button class="action-btn secondary-btn" id="checkOutBtn" ${checkoutDisabled}>Check Out</button>
                </div>
            </section>
            
            <section class="temp-card-section card-style">
                <h3>Temp Card / Proxy Check-In</h3>
                <p class="section-info">For staff without a phone, supervisor enters their temp card ID (Try: **A1B2C3**)</p>
                <div class="input-group">
                    <input type="text" id="tempCardInput" placeholder="Enter Temp Card ID (e.g., A1B2C3)" class="form-input" style="text-transform: uppercase;">
                </div>
                <div class="job-actions temp-actions">
                    <button class="action-btn primary-btn" id="tempCardCheckInBtn">Proxy Check-In</button>
                    <button class="action-btn secondary-btn" id="tempCardCheckOutBtn">Proxy Check-Out</button>
                </div>
            </section>
            
            <section class="time-records-section">
                <h3>Recent Time Records</h3>
                <div id="recordsContainer">
                    ${this.renderTimeRecords()}
                </div>
            </section>
        `;
    }
    
    // =====================================================
    // EVENT BINDING & HANDLERS
    // =====================================================

    bindTimerEvents() {
        // QR Scanner Events
        document.getElementById('scanQrBtn')?.addEventListener('click', () => {
            this.showQrScanner();
        });
        
        document.getElementById('checkOutBtn')?.addEventListener('click', () => {
            this.handleCheckOut();
        });

        // Temp Card Events
        document.getElementById('tempCardCheckInBtn')?.addEventListener('click', () => {
            const cardNumber = document.getElementById('tempCardInput').value.trim().toUpperCase();
            this.tempCardManager.checkIn(cardNumber);
        });
        
        document.getElementById('tempCardCheckOutBtn')?.addEventListener('click', () => {
            const cardNumber = document.getElementById('tempCardInput').value.trim().toUpperCase();
            this.tempCardManager.checkOut(cardNumber);
        });
    }

    bindScheduleEvents() {
        document.querySelector('.schedule-view')?.addEventListener('click', (e) => {
            const button = e.target.closest('.schedule-filter-btn');
            if (!button) return;

            // 1. Update active class
            document.querySelectorAll('.schedule-filter-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // 2. Load mock content
            const filter = button.dataset.filter;
            const contentEl = document.getElementById('scheduleContent');
            
            if (contentEl) {
                contentEl.innerHTML = this.getMockScheduleContent(filter);
            }
            this.showNotification(`Schedule filtered to **${filter.toUpperCase()}** mock data.`, 'info');

            this.attachFreeSlotListeners();
        });
    }
    
    showQrScanner() {
        if (this.qrModal) {
            this.qrModal.style.display = 'flex';
            setTimeout(() => {
                this.handleQrScanSuccess('job001');
                this.hideQrScanner();
                this.showNotification('Successfully checked in!', 'success');
            }, TIMEKEEPING_CONFIG.SCAN_SIMULATION_DELAY); 
        }
    }

    hideQrScanner() {
        if (this.qrModal) {
            this.qrModal.style.display = 'none';
        }
    }
    
    handleQrScanSuccess(jobId) {
        this.activeJob = jobId;
        sessionStorage.setItem('activeJobId', jobId);
        
        this.stats.jobs = '1';
        this.stats.status = 'On-Duty';
        this.updateHeaderStats();
        
        this.renderContent('timer');
    }

    /**
     * Handles the regular check-out process.
     */
    handleCheckOut() {
        // CAPTURE job ID BEFORE clearing activeJob
        const checkedOutJobId = this.activeJob; 
        
        this.activeJob = null;
        sessionStorage.removeItem('activeJobId');

        // NEW: Record the check-out for display
        if (checkedOutJobId) {
            this.recordCheckOut(checkedOutJobId, false);
        }

        this.stats.jobs = '0';
        this.stats.status = 'Off-Duty';
        this.updateHeaderStats();

        this.renderContent('timer');
        this.showNotification('Successfully checked out. Well done!', 'success');
    }
}

// =====================================================
// INITIALIZATION
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.getLoggedInUser === 'function') {
        // FIX: The class constructor now calls init(), so we only need to instantiate the class here.
        new TimekeepingApp(); 
    } else {
        const errorMessage = "System Error: Missing authentication or UIManager. Cannot initialize.";
        if (window.UIManager && window.UIManager.showNotification) {
            window.UIManager.showNotification(errorMessage, 'error');
        } else {
            console.error(errorMessage);
        }
        // Fallback: instantiate anyway
        new TimekeepingApp();
    }
});