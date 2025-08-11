/**
 * CloudCore Staged Access Control System
 * Implements progressive access for ISYS6018 assessments
 * 
 * Access Levels:
 * - Public: Always available
 * - Consultant: Week 2+ with password
 * - Auditor: Week 9+ with password
 */

class CloudCoreAccessControl {
    constructor() {
        // Configuration - Update dates for your semester
        this.config = {
            // Week 2 start date (adjust for your semester)
            consultantStartDate: new Date('2025-07-29T00:00:00'),
            // Week 9 start date (adjust for your semester)
            auditorStartDate: new Date('2025-09-16T00:00:00'),
            
            // Passwords - CHANGE THESE EACH SEMESTER
            passwords: {
                consultant: 'CloudcoreConsult2025',
                auditor: 'AuditorAccess2025'
            },
            
            // For testing - set to true to enable date override
            testMode: false,
            testDate: null
        };
        
        // Initialize on page load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }
    
    init() {
        // Check for access upgrade via URL parameter
        this.checkURLParams();
        
        // Apply access restrictions
        this.applyAccessControl();
        
        // Add access indicator
        this.addAccessIndicator();
        
        // Setup access request handlers
        this.setupEventHandlers();
        
        // Log access for analytics
        this.logAccess();
    }
    
    getCurrentDate() {
        // Allow date override for testing
        if (this.config.testMode && this.config.testDate) {
            return new Date(this.config.testDate);
        }
        return new Date();
    }
    
    getCurrentAccessLevel() {
        const now = this.getCurrentDate();
        const storedPassword = localStorage.getItem('cloudcore_access_token');
        
        // Check for auditor access
        if (now >= this.config.auditorStartDate && 
            storedPassword === this.config.passwords.auditor) {
            return 'auditor';
        }
        
        // Check for consultant access
        if (now >= this.config.consultantStartDate && 
            (storedPassword === this.config.passwords.consultant || 
             storedPassword === this.config.passwords.auditor)) {
            return 'consultant';
        }
        
        // Default to public access
        return 'public';
    }
    
    checkURLParams() {
        // Check for access token in URL (for LMS integration)
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('access_token');
        
        if (token) {
            // Validate and store token
            if (Object.values(this.config.passwords).includes(token)) {
                localStorage.setItem('cloudcore_access_token', token);
                // Remove token from URL for security
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }
    }
    
    applyAccessControl() {
        const accessLevel = this.getCurrentAccessLevel();
        
        // Process all elements with data-access attribute
        document.querySelectorAll('[data-access]').forEach(element => {
            const requiredLevel = element.dataset.access;
            
            if (this.hasAccess(requiredLevel, accessLevel)) {
                // Show element
                element.style.display = '';
                element.classList.remove('access-restricted');
            } else {
                // Hide element and show placeholder
                element.style.display = 'none';
                element.classList.add('access-restricted');
                
                // Add placeholder if not already present
                if (!element.previousElementSibling?.classList.contains('access-placeholder')) {
                    const placeholder = this.createPlaceholder(requiredLevel);
                    element.parentNode.insertBefore(placeholder, element);
                }
            }
        });
        
        // Special handling for chatbot elements
        this.handleChatbots(accessLevel);
    }
    
    hasAccess(required, current) {
        const levels = {
            'public': 0,
            'consultant': 1,
            'auditor': 2
        };
        
        return levels[current] >= levels[required];
    }
    
    createPlaceholder(requiredLevel) {
        const placeholder = document.createElement('div');
        placeholder.className = 'access-placeholder alert alert-info';
        
        const now = this.getCurrentDate();
        let availableDate;
        let message;
        
        if (requiredLevel === 'consultant') {
            availableDate = this.config.consultantStartDate;
            message = 'This content requires Consultant access (Available Week 2+)';
        } else if (requiredLevel === 'auditor') {
            availableDate = this.config.auditorStartDate;
            message = 'This content requires Auditor access (Available Week 9+)';
        }
        
        placeholder.innerHTML = `
            <h5>🔒 Restricted Content</h5>
            <p>${message}</p>
            ${now >= availableDate ? `
                <button class="btn btn-primary btn-sm request-access-btn" 
                        data-level="${requiredLevel}">
                    Request ${requiredLevel} Access
                </button>
            ` : `
                <p class="text-muted">
                    Available from: ${availableDate.toLocaleDateString()}
                </p>
            `}
        `;
        
        return placeholder;
    }
    
    handleChatbots(accessLevel) {
        // Hide chatbot embeds for non-auditor access
        if (accessLevel !== 'auditor') {
            document.querySelectorAll('script[data-embed-id]').forEach(script => {
                script.style.display = 'none';
                
                // Add placeholder
                const placeholder = document.createElement('div');
                placeholder.className = 'chatbot-placeholder alert alert-warning';
                placeholder.innerHTML = `
                    <h5>🤖 Employee Interview Unavailable</h5>
                    <p>Employee interviews require full Auditor access (Week 9+)</p>
                    <p class="text-muted">
                        You will be able to interview this employee once audit access is granted.
                    </p>
                `;
                script.parentNode.insertBefore(placeholder, script);
            });
        }
    }
    
    addAccessIndicator() {
        // Remove existing indicator if present
        const existing = document.getElementById('access-level-indicator');
        if (existing) existing.remove();
        
        const level = this.getCurrentAccessLevel();
        const indicator = document.createElement('div');
        indicator.id = 'access-level-indicator';
        
        // Style based on access level
        const styles = {
            public: 'background: #6c757d;',
            consultant: 'background: #007bff;',
            auditor: 'background: #28a745;'
        };
        
        indicator.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            ${styles[level]}
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            z-index: 9999;
            cursor: pointer;
            transition: transform 0.2s;
        `;
        
        indicator.innerHTML = `
            <span>Access: ${level.toUpperCase()}</span>
            ${level !== 'auditor' ? ' (Click to upgrade)' : ''}
        `;
        
        // Add hover effect
        indicator.onmouseover = () => {
            indicator.style.transform = 'scale(1.05)';
        };
        indicator.onmouseout = () => {
            indicator.style.transform = 'scale(1)';
        };
        
        // Add click handler for upgrade
        if (level !== 'auditor') {
            indicator.onclick = () => {
                const nextLevel = level === 'public' ? 'consultant' : 'auditor';
                this.requestAccess(nextLevel);
            };
        }
        
        document.body.appendChild(indicator);
    }
    
    setupEventHandlers() {
        // Handle clicks on request access buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('request-access-btn')) {
                const level = e.target.dataset.level;
                this.requestAccess(level);
            }
        });
    }
    
    requestAccess(level) {
        const now = this.getCurrentDate();
        let requiredDate;
        
        // Check if access period has started
        if (level === 'consultant') {
            requiredDate = this.config.consultantStartDate;
        } else if (level === 'auditor') {
            requiredDate = this.config.auditorStartDate;
        }
        
        if (now < requiredDate) {
            alert(`${level.charAt(0).toUpperCase() + level.slice(1)} access is not available until ${requiredDate.toLocaleDateString()}`);
            return;
        }
        
        // Prompt for password
        const password = prompt(`Enter ${level} access password:`);
        
        if (!password) return;
        
        // Validate password
        if (password === this.config.passwords[level] || 
            (level === 'consultant' && password === this.config.passwords.auditor)) {
            
            // Store access token
            localStorage.setItem('cloudcore_access_token', password);
            
            // Log successful access
            this.logAccessUpgrade(level);
            
            // Reload page to apply new access
            location.reload();
            
        } else {
            // Log failed attempt
            this.logFailedAccess(level, password);
            
            alert('Invalid password. Please check with your instructor if you believe this is an error.');
        }
    }
    
    logAccess() {
        // Log current access level (can be sent to analytics)
        const level = this.getCurrentAccessLevel();
        const logData = {
            timestamp: new Date().toISOString(),
            level: level,
            page: window.location.pathname,
            referrer: document.referrer
        };
        
        // Store in session storage for this session
        const logs = JSON.parse(sessionStorage.getItem('cloudcore_access_logs') || '[]');
        logs.push(logData);
        sessionStorage.setItem('cloudcore_access_logs', JSON.stringify(logs));
        
        // Could send to analytics endpoint here
        console.log('Access logged:', logData);
    }
    
    logAccessUpgrade(level) {
        const logData = {
            timestamp: new Date().toISOString(),
            event: 'access_upgrade',
            level: level,
            page: window.location.pathname
        };
        
        console.log('Access upgrade:', logData);
        // Could send to analytics endpoint
    }
    
    logFailedAccess(level, attemptedPassword) {
        const logData = {
            timestamp: new Date().toISOString(),
            event: 'failed_access',
            level: level,
            page: window.location.pathname,
            // Only log if it's close to correct (potential typo)
            nearMiss: this.isNearMiss(attemptedPassword, level)
        };
        
        console.log('Failed access:', logData);
        // Could send to analytics endpoint
    }
    
    isNearMiss(attempted, level) {
        const correct = this.config.passwords[level];
        // Check if it's within 2 character edits (likely typo)
        return this.levenshteinDistance(attempted, correct) <= 2;
    }
    
    levenshteinDistance(a, b) {
        const matrix = [];
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        return matrix[b.length][a.length];
    }
    
    // Public methods for testing
    setTestMode(enabled, date = null) {
        this.config.testMode = enabled;
        this.config.testDate = date;
        this.init();
    }
    
    clearAccess() {
        localStorage.removeItem('cloudcore_access_token');
        location.reload();
    }
}

// Initialize the access control system
const cloudcoreAccess = new CloudCoreAccessControl();

// Expose for debugging/testing (remove in production)
window.cloudcoreAccess = cloudcoreAccess;