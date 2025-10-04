/**
 * NCL Mobile App - Common Utilities
 * Shared functionality and utilities used across all pages
 * Version: 2.0.0
 */

'use strict';

/* ===== CONSTANTS ===== */
const NCL_CONFIG = {
    APP_NAME: 'NCL Cleaning Services',
    VERSION: '2.0.0',
    API_BASE_URL: 'https://api.nclservices.com/v2',
    STORAGE_PREFIX: 'ncl_',
    DEBUG: true,
    FEATURE_FLAGS: {
        OFFLINE_MODE: true,
        PUSH_NOTIFICATIONS: true,
        ANALYTICS: true,
        DARK_MODE: true
    }
};

const STORAGE_KEYS = {
    USER: 'currentUser',
    PREFERENCES: 'userPreferences',
    CACHE: 'appCache',
    SESSIONS: 'userSessions',
    THEME: 'theme',
    LANGUAGE: 'language'
};

const SESSION_KEYS = {
       ACTIVE_JOB: 'activeJobId',
       SELECTED_SERVICE: 'selectedServiceId',
       PENDING_BOOKING: 'pendingBooking'
};

const EVENTS = {
    USER_LOGIN: 'user:login',
    USER_LOGOUT: 'user:logout',
    THEME_CHANGE: 'theme:change',
    NETWORK_CHANGE: 'network:change',
    APP_UPDATE: 'app:update'
};

/* ===== GLOBAL STATE MANAGER ===== */
let appState = null;
class AppState {
    constructor() {
        this.state = {
            user: null,
            preferences: {},
            isOnline: navigator.onLine,
            theme: 'light',
            language: 'en',
            notifications: []
        };
        this.listeners = new Map();
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.bindEvents();
    }

    loadFromStorage() {
        try {
            const user = StorageManager.getItem(STORAGE_KEYS.USER);
            const preferences = StorageManager.getItem(STORAGE_KEYS.PREFERENCES) || {};
            const theme = StorageManager.getItem(STORAGE_KEYS.THEME) || 'light';
            const language = StorageManager.getItem(STORAGE_KEYS.LANGUAGE) || 'en';

            this.setState({
                user,
                preferences,
                theme,
                language
            });
        } catch (error) {
            Logger.error('Failed to load state from storage:', error);
        }
    }

    setState(updates) {
        const prevState = { ...this.state };
        this.state = { ...this.state, ...updates };
        this.notifyListeners(prevState, this.state);
    }

    getState() {
        return { ...this.state };
    }

    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, []);
        }
        this.listeners.get(key).push(callback);
        
        // Return unsubscribe function
        return () => {
            const callbacks = this.listeners.get(key);
            if (callbacks) {
                const index = callbacks.indexOf(callback);
                if (index > -1) {
                    callbacks.splice(index, 1);
                }
            }
        };
    }

    notifyListeners(prevState, newState) {
        this.listeners.forEach((callbacks, key) => {
            if (prevState[key] !== newState[key]) {
                callbacks.forEach(callback => {
                    try {
                        callback(newState[key], prevState[key]);
                    } catch (error) {
                        Logger.error(`Error in state listener for ${key}:`, error);
                    }
                });
            }
        });
    }

    bindEvents() {
        // Network status
        window.addEventListener('online', () => {
            this.setState({ isOnline: true });
            EventBus.emit(EVENTS.NETWORK_CHANGE, { online: true });
        });

        window.addEventListener('offline', () => {
            this.setState({ isOnline: false });
            EventBus.emit(EVENTS.NETWORK_CHANGE, { online: false });
        });

        // Theme detection
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleThemeChange = (e) => {
                if (this.state.theme === 'auto') {
                    ThemeManager.setTheme(e.matches ? 'dark' : 'light');
                }
            };
            mediaQuery.addListener(handleThemeChange);
        }
    }
}

/* ===== STORAGE MANAGER ===== */
class StorageManager {
    static isSupported() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch {
            return false;
        }
    }

    static getItem(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(NCL_CONFIG.STORAGE_PREFIX + key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            Logger.warn(`Failed to get item ${key} from storage:`, error);
            return defaultValue;
        }
    }

    static setItem(key, value) {
        try {
            localStorage.setItem(NCL_CONFIG.STORAGE_PREFIX + key, JSON.stringify(value));
            return true;
        } catch (error) {
            Logger.error(`Failed to set item ${key} in storage:`, error);
            return false;
        }
    }

    static removeItem(key) {
        try {
            localStorage.removeItem(NCL_CONFIG.STORAGE_PREFIX + key);
            return true;
        } catch (error) {
            Logger.warn(`Failed to remove item ${key} from storage:`, error);
            return false;
        }
    }

    static clear() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(NCL_CONFIG.STORAGE_PREFIX)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            Logger.error('Failed to clear storage:', error);
            return false;
        }
    }

    static getSize() {
        try {
            let total = 0;
            for (const key in localStorage) {
                if (key.startsWith(NCL_CONFIG.STORAGE_PREFIX)) {
                    total += localStorage[key].length;
                }
            }
            return total;
        } catch {
            return 0;
        }
    }
}

/* ===== USER MANAGER ===== */
class UserManager {
    // Updated for safe synchronous access
    static getCurrentUser() {
        // Read from StorageManager directly for synchronous/early checks,
        // as appState is not yet instantiated outside of DOMContentLoaded.
        const user = StorageManager.getItem(STORAGE_KEYS.USER); 
        if (user) {
            try {
                // Return the persistently stored user object
                return (user); 
            } catch (e) {
                Logger.error('Failed to parse stored user object:', e);
                return null;
            }
        }
        
        // Return null if no user is found in storage.
        return null;
    }

    static setCurrentUser(user) {
        if (!user) {
            Logger.warn('Attempting to set null user');
            return false;
        }

        // Validate user object (Require ID OR Email)
        if (!user.id && !user.email) { // MODIFIED LOGIC HERE
            Logger.error('Invalid user object: missing required identifier (id or email)');
            return false;
        }

        // Sanitize user data
        const sanitizedUser = {
            id: user.id || user.email, // Ensure ID field has a fallback for customers
            email: user.email || `${user.id}@nclservices.com`, // Ensure Email field has a fallback for staff
            name: user.name || '',
            phone: user.phone || '',
            avatar: user.avatar || '',
            preferences: user.preferences || {},
            role: user.role || 'customer',
            status: user.status || 'active',
            createdAt: user.createdAt || new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            isStaff: !!user.isStaff
        };

        appState.setState({ user: sanitizedUser });
        StorageManager.setItem(STORAGE_KEYS.USER, sanitizedUser);
        
        EventBus.emit(EVENTS.USER_LOGIN, sanitizedUser);
        // FIX 2: Mask the user identifier (email or ID) for console logging.
        const identifier = sanitizedUser.email || sanitizedUser.id;
        const maskedIdentifier = identifier.replace(/(?<=.{2}).*?(?=@|$)/, '***');

        Logger.info('User logged in:', maskedIdentifier);
                
        return true;
    }

    static logout() {
        const currentUser = UserManager.getCurrentUser();
        
        appState.setState({ user: null });
        StorageManager.removeItem(STORAGE_KEYS.USER);
        
        if (currentUser) {
            EventBus.emit(EVENTS.USER_LOGOUT, currentUser);
            // FIX: Mask the identifier for security reasons
            const identifier = currentUser.email || currentUser.id;
            const maskedIdentifier = identifier.replace(/(?<=.{2}).*?(?=@|$)/, '***');
            Logger.info('User logged out:', maskedIdentifier);
        }
        
        return true;
    }

    static isLoggedIn() {
        const user = UserManager.getCurrentUser();
        return user && user.id && user.status === 'active';
    }

    static hasRole(role) {
        const user = UserManager.getCurrentUser();
        return user && user.role === role;
    }

    static updateProfile(updates) {
        const currentUser = UserManager.getCurrentUser();
        if (!currentUser) {
            Logger.warn('Cannot update profile: no user logged in');
            return false;
        }

        const updatedUser = {
            ...currentUser,
            ...updates,
            updatedAt: new Date().toISOString()
        };

        return UserManager.setCurrentUser(updatedUser);
    }
}

/* ===== THEME MANAGER ===== */
class ThemeManager {
    static getTheme() {
        return appState.getState().theme;
    }

    static setTheme(theme) {
        const validThemes = ['light', 'dark', 'auto'];
        if (!validThemes.includes(theme)) {
            Logger.warn(`Invalid theme: ${theme}`);
            return false;
        }

        appState.setState({ theme });
        StorageManager.setItem(STORAGE_KEYS.THEME, theme);
        
        const actualTheme = theme === 'auto' ? 
            (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : 
            theme;
        
        document.documentElement.setAttribute('data-theme', actualTheme);
        document.documentElement.classList.toggle('dark', actualTheme === 'dark');
        
        EventBus.emit(EVENTS.THEME_CHANGE, { theme, actualTheme });
        
        return true;
    }

    static toggleTheme() {
        const current = ThemeManager.getTheme();
        const next = current === 'light' ? 'dark' : 'light';
        return ThemeManager.setTheme(next);
    }
}

/* ===== EVENT BUS ===== */
class EventBus {
    static listeners = new Map();

    static on(event, callback) {
        if (!EventBus.listeners.has(event)) {
            EventBus.listeners.set(event, []);
        }
        EventBus.listeners.get(event).push(callback);
        
        return () => EventBus.off(event, callback);
    }

    static off(event, callback) {
        const callbacks = EventBus.listeners.get(event);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    static emit(event, data = null) {
        const callbacks = EventBus.listeners.get(event);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    Logger.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
        
        if (NCL_CONFIG.DEBUG) {
            Logger.debug(`Event emitted: ${event}`, data);
        }
    }

    static once(event, callback) {
        const onceCallback = (data) => {
            callback(data);
            EventBus.off(event, onceCallback);
        };
        return EventBus.on(event, onceCallback);
    }
}

/* ===== LOGGER ===== */
class Logger {
    static levels = {
        ERROR: 0,
        WARN: 1,
        INFO: 2,
        DEBUG: 3
    };

    static currentLevel = NCL_CONFIG.DEBUG ? Logger.levels.DEBUG : Logger.levels.INFO;

    static log(level, message, ...args) {
        if (level <= Logger.currentLevel) {
            const timestamp = new Date().toISOString();
            const levelName = Object.keys(Logger.levels)[level];
            const prefix = `[${timestamp}] [${levelName}] [NCL]`;
            
            switch (level) {
                case Logger.levels.ERROR:
                    console.error(prefix, message, ...args);
                    break;
                case Logger.levels.WARN:
                    console.warn(prefix, message, ...args);
                    break;
                case Logger.levels.INFO:
                    console.info(prefix, message, ...args);
                    break;
                case Logger.levels.DEBUG:
                    console.debug(prefix, message, ...args);
                    break;
            }
        }
    }

    static error(message, ...args) {
        Logger.log(Logger.levels.ERROR, message, ...args);
    }

    static warn(message, ...args) {
        Logger.log(Logger.levels.WARN, message, ...args);
    }

    static info(message, ...args) {
        Logger.log(Logger.levels.INFO, message, ...args);
    }

    static debug(message, ...args) {
        Logger.log(Logger.levels.DEBUG, message, ...args);
    }
}

/* ===== UTILITY FUNCTIONS ===== */
const Utils = {
    // DOM utilities
    $(selector) {
        return document.querySelector(selector);
    },

    $$(selector) {
        return document.querySelectorAll(selector);
    },

    createElement(tag, attributes = {}, content = '') {
        const element = document.createElement(tag);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'dataset') {
                Object.entries(value).forEach(([dataKey, dataValue]) => {
                    element.dataset[dataKey] = dataValue;
                });
            } else {
                element.setAttribute(key, value);
            }
        });
        
        if (content) {
            element.innerHTML = content;
        }
        
        return element;
    },

    // String utilities
    slugify(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    },

    truncate(text, length = 50, suffix = '...') {
        if (text.length <= length) return text;
        return text.substring(0, length) + suffix;
    },

    capitalize(text) {
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    },

    // Number utilities
    formatCurrency(amount, currency = 'ZAR') {
        return new Intl.NumberFormat('en-ZA', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount);
    },

    formatNumber(number, decimals = 0) {
        return new Intl.NumberFormat('en-ZA', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(number);
    },

    // Date utilities
    formatDate(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        
        return new Intl.DateTimeFormat('en-ZA', { ...defaultOptions, ...options })
            .format(new Date(date));
    },

    formatTime(date, options = {}) {
        const defaultOptions = {
            hour: '2-digit',
            minute: '2-digit'
        };
        
        return new Intl.DateTimeFormat('en-ZA', { ...defaultOptions, ...options })
            .format(new Date(date));
    },

    getRelativeTime(date) {
        const now = new Date();
        const target = new Date(date);
        const diffInMs = now - target;
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        if (diffInMinutes < 1) return 'just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInHours < 24) return `${diffInHours}h ago`;
        if (diffInDays < 7) return `${diffInDays}d ago`;
        
        return Utils.formatDate(date);
    },

    // Validation utilities
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    isValidPhone(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
    },

    isValidPassword(password) {
        return password.length >= 8 && 
               /[A-Z]/.test(password) && 
               /[a-z]/.test(password) && 
               /\d/.test(password);
    },

    // Array utilities
    unique(array) {
        return [...new Set(array)];
    },

    groupBy(array, key) {
        return array.reduce((groups, item) => {
            const groupKey = typeof key === 'function' ? key(item) : item[key];
            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push(item);
            return groups;
        }, {});
    },

    // Object utilities
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj);
        if (obj instanceof Array) return obj.map(item => Utils.deepClone(item));
        if (typeof obj === 'object') {
            const cloned = {};
            Object.keys(obj).forEach(key => {
                cloned[key] = Utils.deepClone(obj[key]);
            });
            return cloned;
        }
    },

    // Async utilities
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Network utilities
    async fetchWithTimeout(url, options = {}, timeout = 5000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }
};

/* ===== NAVIGATION MANAGER ===== */
class NavigationManager {
    static updateNavigation() {
        const bottomNav = Utils.$('.bottom-nav');
        const isLoggedIn = UserManager.isLoggedIn();
        
        if (bottomNav) {
            bottomNav.style.display = isLoggedIn ? 'flex' : 'none';
        }
        
        // Update nav badges
        NavigationManager.updateBadges();
    }

    static updateBadges() {
        const user = UserManager.getCurrentUser();
        if (!user) return;

        // Update notification badge
        const notificationBadge = Utils.$('.notification-badge');
        const unreadCount = user.notifications?.filter(n => !n.read).length || 0;
        
        if (notificationBadge) {
            notificationBadge.textContent = unreadCount;
            notificationBadge.style.display = unreadCount > 0 ? 'block' : 'none';
        }

        // Update jobs badge for staff
        if (user.role === 'staff') {
            const jobsBadge = Utils.$('.nav-item .nav-badge');
            const activeJobs = user.activeJobs || 0;
            
            if (jobsBadge) {
                jobsBadge.textContent = activeJobs;
                jobsBadge.style.display = activeJobs > 0 ? 'block' : 'none';
            }
        }
    }

    static setActiveNavItem(pathname) {
        const navItems = Utils.$('.nav-item');

    // FIX: Use Array.from() to safely convert the collection into an iterable Array
    if (navItems) {
        Array.from(navItems).forEach(item => {
            item.classList.remove('active');
            item.removeAttribute('aria-current');
        });

        // Determine active item based on pathname
        let activeSelector = null;
        if (pathname.includes('home') || pathname === '/') {
            activeSelector = '.nav-item[aria-label*="Home"]';
        } else if (pathname.includes('services')) {
            activeSelector = '.nav-item[aria-label*="Services"]';
        } else if (pathname.includes('booking')) {
            activeSelector = '.nav-item[aria-label*="Bookings"]';
        } else if (pathname.includes('profile')) {
            activeSelector = '.nav-item[aria-label*="Profile"]';
        } else if (pathname.includes('jobs') || pathname.includes('dashboard')) {
            activeSelector = '.nav-item[aria-label*="Jobs"]';
        }

        if (activeSelector) {
            const activeItem = Utils.$(activeSelector);
            if (activeItem) {
                activeItem.classList.add('active');
                activeItem.setAttribute('aria-current', 'page');
            }
        }
    }
}
}
/* ===== NOTIFICATION MANAGER ===== */
class NotificationManager {
    static show(message, type = 'info', duration = 3000) {
        const notification = Utils.createElement('div', {
            className: `notification notification-${type}`,
            role: 'alert',
            'aria-live': 'polite'
        });

        const icon = NotificationManager.getIcon(type);
        notification.innerHTML = `
            <span class="notification-icon">${icon}</span>
            <span class="notification-message">${message}</span>
            <button class="notification-close" aria-label="Close notification">&times;</button>
        `;

        NotificationManager.styleNotification(notification, type);
        
        const container = NotificationManager.getContainer();
        container.appendChild(notification);

        // Handle close button
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            NotificationManager.remove(notification);
        });

        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                NotificationManager.remove(notification);
            }, duration);
        }

        // Animate in
        requestAnimationFrame(() => {
            notification.classList.add('notification-enter');
        });

        return notification;
    }

    static getIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }

    static styleNotification(notification, type) {
        const colors = {
            success: 'var(--green-status, #10b981)',
            error: 'var(--red-status, #ef4444)',
            warning: '#f59e0b',
            info: '#3b82f6'
        };

        Object.assign(notification.style, {
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px 20px',
            margin: '8px 0',
            backgroundColor: 'white',
            color: colors[type] || colors.info,
            border: `1px solid ${colors[type] || colors.info}`,
            borderLeft: `4px solid ${colors[type] || colors.info}`,
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            fontSize: '14px',
            fontWeight: '500',
            transform: 'translateY(-20px)',
            opacity: '0',
            transition: 'all 0.3s ease'
        });
    }

    static getContainer() {
        let container = Utils.$('.notification-container');
        if (!container) {
            container = Utils.createElement('div', {
                className: 'notification-container'
            });

            Object.assign(container.style, {
                position: 'fixed',
                top: '20px',
                right: '20px',
                zIndex: '9999',
                maxWidth: '400px',
                width: '100%'
            });

            document.body.appendChild(container);
        }
        return container;
    }

    static remove(notification) {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    static clear() {
        const container = Utils.$('.notification-container');
        if (container) {
            container.innerHTML = '';
        }
    }

    setButtonLoading(button, isLoading) {
       const btnText = button.querySelector('.btn-text');
       const btnIcon = button.querySelector('.btn-icon');
       
       button.disabled = isLoading;
       button.classList.toggle('loading', isLoading);
       
       if (btnText) {
           btnText.textContent = isLoading ? 'Processing...' : 'Original Text';
       }
   }

   displayError(field, message) {
       errorElement.innerHTML = `<span class="error-icon">⚠️</span>${message}`;
       inputElement.classList.add('error');
       inputElement.setAttribute('aria-invalid', 'true');
   }
}

/* ===== PERFORMANCE MONITOR ===== */
class PerformanceMonitor {
    static init() {
        if ('performance' in window) {
            window.addEventListener('load', PerformanceMonitor.measureLoadTime);
        }
    }

    static measureLoadTime() {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        Logger.info(`Page loaded in ${loadTime}ms`);
        
        if (loadTime > 3000) {
            Logger.warn('Slow page load detected');
        }
    }

    static startTimer(name) {
        performance.mark(`${name}-start`);
    }

    static endTimer(name) {
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
        
        const measure = performance.getEntriesByName(name)[0];
        Logger.debug(`${name} took ${measure.duration.toFixed(2)}ms`);
        
        return measure.duration;
    }
}

/* ===== ACCESSIBILITY HELPERS ===== */
class A11yHelper {
    static init() {
        A11yHelper.setupKeyboardNavigation();
        A11yHelper.setupFocusManagement();
        A11yHelper.setupAnnouncements();
    }

    static setupKeyboardNavigation() {
        document.addEventListener('keydown', (event) => {
            // ESC key handling
            if (event.key === 'Escape') {
                const modal = Utils.$('.modal.active');
                if (modal) {
                    A11yHelper.closeModal(modal);
                    return;
                }
            }

            // Tab trapping in modals
            if (event.key === 'Tab') {
                const modal = Utils.$('.modal.active');
                if (modal) {
                    A11yHelper.trapFocus(modal, event);
                }
            }
        });
    }

    static setupFocusManagement() {
        let focusTimeout;
        
        document.addEventListener('focusin', () => {
            clearTimeout(focusTimeout);
            document.body.classList.add('user-is-tabbing');
        });
        
        document.addEventListener('mousedown', () => {
            clearTimeout(focusTimeout);
            focusTimeout = setTimeout(() => {
                document.body.classList.remove('user-is-tabbing');
            }, 100);
        });
    }

    static setupAnnouncements() {
        if (!Utils.$('#aria-announcements')) {
            const announcer = Utils.createElement('div', {
                id: 'aria-announcements',
                'aria-live': 'polite',
                'aria-atomic': 'true',
                className: 'sr-only'
            });
            document.body.appendChild(announcer);
        }
    }

    static announce(message, priority = 'polite') {
        const announcer = Utils.$('#aria-announcements');
        if (announcer) {
            announcer.setAttribute('aria-live', priority);
            announcer.textContent = message;
            
            setTimeout(() => {
                announcer.textContent = '';
            }, 1000);
        }
    }

    static trapFocus(modal, event) {
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
            if (document.activeElement === firstElement) {
                lastElement.focus();
                event.preventDefault();
            }
        } else {
            if (document.activeElement === lastElement) {
                firstElement.focus();
                event.preventDefault();
            }
        }
    }
}

/* ===== INITIALIZATION ===== */

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Initialize global state
        appState = new AppState();
        
        // Initialize managers
        PerformanceMonitor.init();
        A11yHelper.init();
        
        // Set initial theme
        const savedTheme = StorageManager.getItem(STORAGE_KEYS.THEME, 'light');
        ThemeManager.setTheme(savedTheme);
        
        // Update navigation
        NavigationManager.updateNavigation();
        NavigationManager.setActiveNavItem(window.location.pathname);
        
        // Setup global error handling
        window.addEventListener('error', (event) => {
            Logger.error('Global error:', event.error);
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            Logger.error('Unhandled promise rejection:', event.reason);
        });
        
        Logger.info('NCL App initialized successfully');
        
    } catch (error) {
        Logger.error('Failed to initialize app:', error);
    }
});

// Export for global access
window.NCL = {
    config: NCL_CONFIG,
    UserManager,
    ThemeManager,
    StorageManager,
    EventBus,
    Logger,
    Utils,
    NavigationManager,
    NotificationManager,
    A11yHelper,
    getState: () => appState?.getState() || {}
};

// Legacy function exports for backward compatibility
window.getLoggedInUser = UserManager.getCurrentUser;
window.setLoggedInUser = UserManager.setCurrentUser;
window.clearLoggedInUser = UserManager.logout;
window.updateNavigation = NavigationManager.updateNavigation;

/**
 * Global Synchronous Security Guard
 * Runs immediately to check if the current page is protected and requires a logged-in user.
 * This runs BEFORE DOMContentLoaded in timekeeping.js can fire, preventing the race condition.
 */
(function() {
    const currentPage = window.location.pathname.split('/').pop();
    
    // List all staff-only pages here
    const protectedStaffPages = ['timekeeping.html', 'staff_dashboard.html']; 

    if (protectedStaffPages.includes(currentPage)) {
        // We ensure getLoggedInUser exists before calling it
        if (typeof getLoggedInUser === 'function') {
            const user = getLoggedInUser();
            
            // Check if there is NO user OR if the user is not marked as staff
            if (!user || !user.isStaff) { 
                // The staff_login.html file is in the same directory as timekeeping.html
                window.location.href = 'staff_login.html'; 
                
                // CRITICAL: Stop the rest of the script (including timekeeping.js) from running
                // by throwing an error or using return (in an IIFE like this)
                throw new Error('Unauthorized Access. Redirecting to login page.'); 
            }
        }
    }
})();