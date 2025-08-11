/**
 * CloudCore Simple Multi-Unit Timeline Access System
 * One site, multiple units, different schedules
 * 
 * Units supported:
 * - ISYS6018: Information Security Audit and Control
 * - ISYS2001: Systems Analysis (example)
 * - MGMT5000: AI Strategy (example)
 */

// Configuration - Update these each semester
const UNIT_SCHEDULES = {
    // ISYS6018 - Security Audit
    'SecurityAudit2025': {
        unit: 'ISYS6018 - Security Audit',
        consultantDate: '2025-07-29T00:00:00',  // Week 2
        auditorDate: '2025-09-16T00:00:00'      // Week 9
    },
    
    // ISYS2001 - Systems Analysis (adjust dates as needed)
    'SystemsAnalysis2025': {
        unit: 'ISYS2001 - Systems Analysis', 
        consultantDate: '2025-08-05T00:00:00',  // Week 3
        auditorDate: '2025-09-23T00:00:00'      // Week 10
    },
    
    // MGMT5000 - AI Strategy (adjust dates as needed)
    'AIStrategy2025': {
        unit: 'MGMT5000 - AI Strategy',
        consultantDate: '2025-08-12T00:00:00',  // Week 4
        auditorDate: '2025-10-07T00:00:00'      // Week 12
    }
};

// For testing - set to true and change testDate to simulate different dates
const TEST_MODE = false;
const TEST_DATE = '2025-09-17T00:00:00'; // Change this to test different dates

/**
 * Check if current page requires protection
 */
function isProtectedPage() {
    const path = window.location.pathname;
    // Only protect /chatbots/ and /docs/ sections
    return path.includes('/chatbots/') || path.includes('/docs/');
}

/**
 * Check if access token is still valid (24 hours)
 */
function isTokenValid() {
    const tokenData = localStorage.getItem('cloudcore_token');
    if (!tokenData) return false;
    
    try {
        const token = JSON.parse(tokenData);
        const now = new Date().getTime();
        const tokenAge = now - token.timestamp;
        const twentyFourHours = 24 * 60 * 60 * 1000;
        
        // Check if token is less than 24 hours old
        if (tokenAge < twentyFourHours) {
            return token;
        }
    } catch (e) {
        // Invalid token format
    }
    
    // Token expired or invalid
    localStorage.removeItem('cloudcore_token');
    localStorage.removeItem('cloudcore_password');
    return false;
}

/**
 * Create access token with 24-hour validity
 */
function createAccessToken(password, schedule) {
    const token = {
        password: password,
        unit: schedule.unit,
        timestamp: new Date().getTime(),
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    localStorage.setItem('cloudcore_token', JSON.stringify(token));
    localStorage.setItem('cloudcore_password', password);
    return token;
}

/**
 * Main access control function
 */
function checkAccess() {
    // Check if this page needs protection
    if (!isProtectedPage()) {
        // Public page - no restrictions
        return;
    }
    
    // Check for valid token first
    const existingToken = isTokenValid();
    if (existingToken) {
        // Valid token exists, use it
        const schedule = UNIT_SCHEDULES[existingToken.password];
        if (schedule) {
            const accessLevel = getCurrentAccessLevel(schedule);
            applyAccessLevel(accessLevel, schedule.unit);
            return;
        }
    }
    
    // No valid token, prompt for password
    const password = prompt('Enter your unit access password to access this section:');
    
    // Check if user cancelled or entered blank
    if (!password || password.trim() === '') {
        // Show access denied message
        showAccessDeniedMessage('No password entered');
        return;
    }
    
    // Validate password
    const schedule = UNIT_SCHEDULES[password];
    if (!schedule) {
        // Show invalid password message
        showAccessDeniedMessage('Invalid password');
        return;
    }
    
    // Create token for 24 hours
    createAccessToken(password, schedule);
    
    // Determine current access level based on date
    const accessLevel = getCurrentAccessLevel(schedule);
    
    // Apply access restrictions
    applyAccessLevel(accessLevel, schedule.unit);
}

/**
 * Show access denied message and redirect
 */
function showAccessDeniedMessage(reason) {
    // Replace page content with access denied message
    document.body.innerHTML = `
        <div style="
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        ">
            <div style="
                background: white;
                border-radius: 10px;
                padding: 40px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                max-width: 500px;
                text-align: center;
            ">
                <div style="
                    font-size: 48px;
                    margin-bottom: 20px;
                ">🔒</div>
                
                <h1 style="
                    color: #333;
                    margin-bottom: 20px;
                    font-size: 28px;
                ">Access Denied</h1>
                
                <p style="
                    color: #666;
                    margin-bottom: 10px;
                    font-size: 18px;
                ">${reason === 'No password entered' ? 
                    'You need to enter a valid unit password to access this section.' : 
                    'The password you entered is incorrect.'}</p>
                
                <p style="
                    color: #999;
                    margin-bottom: 30px;
                    font-size: 14px;
                ">This section contains protected CloudCore documentation and employee interviews 
                that require proper authentication.</p>
                
                <div style="
                    color: #666;
                    font-size: 14px;
                    margin-bottom: 20px;
                ">
                    <strong>Valid unit codes:</strong><br>
                    ISYS6018 | ISYS2001 | MGMT5000
                </div>
                
                <p style="
                    color: #007bff;
                    font-size: 16px;
                    margin-bottom: 20px;
                ">Redirecting to home page in <span id="countdown">5</span> seconds...</p>
                
                <div>
                    <button onclick="location.reload()" style="
                        background: #007bff;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 16px;
                        margin-right: 10px;
                    ">Try Again</button>
                    
                    <button onclick="window.location.href='/'" style="
                        background: #6c757d;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 16px;
                    ">Go Home Now</button>
                </div>
            </div>
        </div>
    `;
    
    // Countdown and redirect
    let seconds = 5;
    const countdownElement = document.getElementById('countdown');
    
    const countdown = setInterval(() => {
        seconds--;
        if (countdownElement) {
            countdownElement.textContent = seconds;
        }
        
        if (seconds <= 0) {
            clearInterval(countdown);
            window.location.href = '/';
        }
    }, 1000);
}

/**
 * Determine access level based on current date and schedule
 */
function getCurrentAccessLevel(schedule) {
    const now = TEST_MODE ? new Date(TEST_DATE) : new Date();
    const consultantDate = new Date(schedule.consultantDate);
    const auditorDate = new Date(schedule.auditorDate);
    
    if (now >= auditorDate) {
        return 'auditor';
    } else if (now >= consultantDate) {
        return 'consultant';
    } else {
        return 'public';
    }
}

/**
 * Apply access restrictions based on level
 */
function applyAccessLevel(level, unitName) {
    // Add access indicator
    addAccessIndicator(level, unitName);
    
    // Hide/show content based on access level
    const consultantElements = document.querySelectorAll('[data-access="consultant"]');
    const auditorElements = document.querySelectorAll('[data-access="auditor"]');
    
    if (level === 'public') {
        // Hide consultant and auditor content
        consultantElements.forEach(el => hideElement(el));
        auditorElements.forEach(el => hideElement(el));
    } else if (level === 'consultant') {
        // Show consultant, hide auditor
        consultantElements.forEach(el => showElement(el));
        auditorElements.forEach(el => hideElement(el));
    } else if (level === 'auditor') {
        // Show everything
        consultantElements.forEach(el => showElement(el));
        auditorElements.forEach(el => showElement(el));
    }
    
    // Handle chatbot access (only for auditor level)
    handleChatbotAccess(level);
}

/**
 * Hide element and add placeholder
 */
function hideElement(element) {
    element.style.display = 'none';
    
    // Add placeholder if not already present
    if (!element.previousElementSibling?.classList.contains('access-placeholder')) {
        const placeholder = createPlaceholder(element.dataset.access);
        element.parentNode.insertBefore(placeholder, element);
    }
}

/**
 * Show element and remove placeholder
 */
function showElement(element) {
    element.style.display = '';
    
    // Remove placeholder if present
    if (element.previousElementSibling?.classList.contains('access-placeholder')) {
        element.previousElementSibling.remove();
    }
}

/**
 * Create placeholder for restricted content
 */
function createPlaceholder(requiredLevel) {
    const placeholder = document.createElement('div');
    placeholder.className = 'access-placeholder alert alert-info';
    
    const levelText = requiredLevel === 'consultant' ? 'Consultant' : 'Full Audit';
    const weekText = requiredLevel === 'consultant' ? 'Week 2+' : 'Week 9+';
    
    placeholder.innerHTML = `
        <h5>🔒 Restricted Content</h5>
        <p>This content requires <strong>${levelText}</strong> access.</p>
        <p class="text-muted">Available from ${weekText} with valid unit password.</p>
    `;
    
    return placeholder;
}

/**
 * Handle chatbot access (require at least consultant level)
 * Chatbots should only be available:
 * 1. With at least consultant access (not public)
 * 2. During business hours (7am-7pm weekdays) - handled by available.js
 */
function handleChatbotAccess(level) {
    // Check if we're on a chatbot page
    const isChatbotPage = window.location.pathname.includes('/chatbots/') || 
                          document.querySelector('script[data-embed-id]');
    
    if (!isChatbotPage) return;
    
    // Require at least consultant access for any chatbot
    if (level === 'public') {
        // Block access entirely for public level
        const chatbotEmbeds = document.querySelectorAll('script[data-embed-id]');
        
        if (chatbotEmbeds.length > 0) {
            // Show chatbot-specific access denied message
            showAccessDeniedMessage('Chatbot access requires authentication');
        }
    } else if (level === 'consultant') {
        // Consultant level - show chatbots but add notice
        document.querySelectorAll('script[data-embed-id]').forEach(script => {
            script.style.display = '';
            
            // Add a notice that this is consultant-level access
            if (!script.previousElementSibling?.classList.contains('access-notice')) {
                const notice = document.createElement('div');
                notice.className = 'access-notice alert alert-info mb-3';
                notice.innerHTML = `
                    <small><strong>Note:</strong> You have consultant-level access to this employee interview. 
                    Full audit access may reveal additional information.</small>
                `;
                script.parentNode.insertBefore(notice, script);
            }
        });
    } else if (level === 'auditor') {
        // Full auditor access - show everything
        document.querySelectorAll('script[data-embed-id]').forEach(script => {
            script.style.display = '';
            
            // Add auditor notice
            if (!script.previousElementSibling?.classList.contains('access-notice')) {
                const notice = document.createElement('div');
                notice.className = 'access-notice alert alert-success mb-3';
                notice.innerHTML = `
                    <small><strong>Full Access:</strong> You have auditor-level access to this employee interview.</small>
                `;
                script.parentNode.insertBefore(notice, script);
            }
        });
    }
}

/**
 * Add access level indicator to page
 */
function addAccessIndicator(level, unitName) {
    // Only show indicator on protected pages
    if (!isProtectedPage()) return;
    
    // Remove existing indicator if present
    const existing = document.getElementById('access-indicator');
    if (existing) existing.remove();
    
    // Get token info for expiry display
    const tokenData = localStorage.getItem('cloudcore_token');
    let expiryInfo = '';
    if (tokenData) {
        try {
            const token = JSON.parse(tokenData);
            const expiryDate = new Date(token.expires);
            const hoursLeft = Math.round((expiryDate - new Date()) / (1000 * 60 * 60));
            expiryInfo = `<div style="font-size: 11px; margin-top: 2px; opacity: 0.9;">
                Access expires in ${hoursLeft} hours
            </div>`;
        } catch (e) {
            // Invalid token
        }
    }
    
    // Create new indicator
    const indicator = document.createElement('div');
    indicator.id = 'access-indicator';
    
    // Style based on access level
    const colors = {
        public: '#6c757d',
        consultant: '#007bff',
        auditor: '#28a745'
    };
    
    indicator.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: ${colors[level]};
        color: white;
        padding: 10px 20px;
        border-radius: 25px;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 9999;
        cursor: pointer;
    `;
    
    indicator.innerHTML = `
        <div>${unitName}</div>
        <div style="font-size: 12px; margin-top: 2px;">
            Access: ${level.toUpperCase()}
        </div>
        ${expiryInfo}
    `;
    
    // Add click handler to change password
    indicator.onclick = () => {
        if (confirm('Change unit password or clear access?')) {
            localStorage.removeItem('cloudcore_password');
            localStorage.removeItem('cloudcore_token');
            location.reload();
        }
    };
    
    document.body.appendChild(indicator);
}

/**
 * Initialize on page load
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAccess);
} else {
    checkAccess();
}

/**
 * Add custom styles
 */
const style = document.createElement('style');
style.textContent = `
    .access-placeholder {
        margin: 20px 0;
        padding: 20px;
        text-align: center;
        border-radius: 5px;
    }
    
    .chatbot-placeholder {
        margin: 20px 0;
        padding: 20px;
        text-align: center;
        background: #fff3cd;
        border: 1px solid #ffc107;
        border-radius: 5px;
    }
    
    [data-access] {
        transition: opacity 0.3s ease;
    }
    
    #access-indicator {
        animation: slideIn 0.3s ease;
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);