/**
 * CloudCore Enhanced Multi-Unit Access System
 * Supports time-based, scenario-based, and combined access control
 * 
 * Features:
 * - JSON-based configuration
 * - Allowed/denied resource lists
 * - Time-specific access rules
 * - Multiple access modes per unit
 * - Fallback to legacy configuration
 */

// Global configuration objects
let ACCESS_CONFIG = null;
let UNIT_SCHEDULES = {};

// Legacy fallback configuration - used if JSON config fails to load
const LEGACY_UNIT_SCHEDULES = {
    // ISYS6018 - Information Security Audit and Control
    'SecurityAudit2025': {
        unit: 'ISYS6018 - Information Security Audit and Control',
        consultantDate: '2025-07-29T00:00:00',
        auditorDate: '2025-09-16T00:00:00'
    },
    
    // ISYS2002 - Systems Analysis and Design
    'SystemsAnalysisDesign2025': {
        unit: 'ISYS2002 - Systems Analysis and Design', 
        consultantDate: '2025-08-05T00:00:00',
        auditorDate: '2025-09-23T00:00:00'
    },
    
    // ISYS6014 - Knowledge Management and Intelligent Systems
    'KnowledgeManagement2025': {
        unit: 'ISYS6014 - Knowledge Management and Intelligent Systems',
        consultantDate: '2025-08-12T00:00:00',
        auditorDate: '2025-10-07T00:00:00'
    },
    
    // ISAD5001 - Information Systems Analysis and Design
    'InfoSystemsAnalysis2025': {
        unit: 'ISAD5001 - Information Systems Analysis and Design',
        consultantDate: '2025-08-05T00:00:00',
        auditorDate: '2025-09-23T00:00:00'
    }
};

// For testing - set to true and change testDate to simulate different dates
const TEST_MODE = false;
const TEST_DATE = '2025-09-17T00:00:00'; // Change this to test different dates

/**
 * Load configuration from JSON file
 */
async function loadAccessConfig() {
    try {
        const response = await fetch('/config/unit-access.json');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        ACCESS_CONFIG = await response.json();
        
        // Convert JSON config to UNIT_SCHEDULES format for backward compatibility
        UNIT_SCHEDULES = {};
        for (const [unitCode, unitConfig] of Object.entries(ACCESS_CONFIG.units)) {
            UNIT_SCHEDULES[unitConfig.password] = {
                unit: unitConfig.name,
                unitCode: unitCode,
                consultantDate: unitConfig.timeRelease.consultant,
                auditorDate: unitConfig.timeRelease.auditor,
                accessRules: unitConfig.accessRules
            };
        }
        
        console.log('Access configuration loaded successfully', ACCESS_CONFIG.version);
        return true;
    } catch (error) {
        console.warn('Failed to load access configuration, using legacy fallback:', error.message);
        UNIT_SCHEDULES = LEGACY_UNIT_SCHEDULES;
        return false;
    }
}

/**
 * Check if path matches a pattern (supports wildcards)
 */
function pathMatches(path, pattern) {
    // Convert pattern to regex
    const regexPattern = pattern
        .replace(/\*/g, '.*')  // * becomes .*
        .replace(/\?/g, '.')   // ? becomes .
        .replace(/\[/g, '\\[') // escape brackets
        .replace(/\]/g, '\\]');
    
    const regex = new RegExp('^' + regexPattern + '$', 'i');
    return regex.test(path);
}

/**
 * Check if current path/resource is allowed based on unit configuration
 */
function isResourceAllowed(path, unitConfig, currentLevel) {
    if (!unitConfig.accessRules) {
        // No custom rules, use default behavior
        return true;
    }
    
    const { mode, customRules } = unitConfig.accessRules;
    const now = TEST_MODE ? new Date(TEST_DATE) : new Date();
    
    // Check time-specific rules first
    for (const timeRule of customRules.timeSpecific) {
        if (pathMatches(path, timeRule.path)) {
            const availableFrom = new Date(timeRule.availableFrom);
            const availableUntil = timeRule.availableUntil ? new Date(timeRule.availableUntil) : null;
            
            // Check if current time is within availability window
            const inTimeWindow = now >= availableFrom && (!availableUntil || now <= availableUntil);
            
            // Check if user has required access level
            const hasRequiredLevel = timeRule.level === 'consultant' ? 
                (currentLevel === 'consultant' || currentLevel === 'auditor') :
                currentLevel === 'auditor';
            
            if (!inTimeWindow || !hasRequiredLevel) {
                return false;
            }
        }
    }
    
    // Check denied list
    for (const deniedPattern of customRules.denied) {
        if (pathMatches(path, deniedPattern)) {
            return false;
        }
    }
    
    // For scenario-based mode, check allowed list
    if (mode === 'scenario-based') {
        // If there's an allowed list, path must be in it
        if (customRules.allowed.length > 0) {
            return customRules.allowed.some(pattern => pathMatches(path, pattern));
        }
        // If no allowed list, allow everything not denied
        return true;
    }
    
    // For combined mode, check allowed list for additional restrictions
    if (mode === 'combined' && customRules.allowed.length > 0) {
        return customRules.allowed.some(pattern => pathMatches(path, pattern));
    }
    
    // Default: allow if not explicitly denied
    return true;
}

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
 * Hide protected content and show login form
 * This prevents users from seeing sensitive content before authentication
 */
function hideProtectedContent() {
    // Store original content
    if (!window.originalContent) {
        window.originalContent = document.body.innerHTML;
    }
    
    // Get the computed background color of the body
    const computedStyle = window.getComputedStyle(document.body);
    const bodyBg = computedStyle.backgroundColor || '#ffffff';
    
    // Replace with login form using computed background
    document.body.innerHTML = `
        <div id="login-container" style="
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: ${bodyBg};
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        ">
            <div style="
                background: white;
                border-radius: 10px;
                padding: 40px;
                box-shadow: 0 10px 40px rgba(102, 126, 234, 0.15);
                border: 1px solid rgba(102, 126, 234, 0.1);
                max-width: 450px;
                width: 90%;
            ">
                <div style="text-align: center; margin-bottom: 30px;">
                    <div style="
                        font-size: 48px;
                        margin-bottom: 20px;
                    ">🔐</div>
                    
                    <h1 style="
                        color: #333;
                        margin-bottom: 10px;
                        font-size: 28px;
                    ">CloudCore Access Portal</h1>
                    
                    <p style="
                        color: #666;
                        font-size: 16px;
                        margin: 0;
                    ">Enter your unit password to continue</p>
                </div>
                
                <form id="login-form" style="margin-bottom: 20px;">
                    <div style="margin-bottom: 20px;">
                        <label for="password" style="
                            display: block;
                            color: #555;
                            font-size: 14px;
                            font-weight: 500;
                            margin-bottom: 8px;
                        ">Unit Password</label>
                        <input type="password" id="password" name="password" 
                            placeholder="Enter your unit password" 
                            style="
                                width: 100%;
                                padding: 12px;
                                font-size: 16px;
                                border: 2px solid #e1e4e8;
                                border-radius: 6px;
                                box-sizing: border-box;
                                transition: border-color 0.3s;
                            "
                            onfocus="this.style.borderColor='#667eea'"
                            onblur="this.style.borderColor='#e1e4e8'"
                            required>
                    </div>
                    
                    <button type="submit" style="
                        width: 100%;
                        padding: 12px;
                        font-size: 16px;
                        font-weight: 600;
                        color: white;
                        background: var(--cc-gradient, linear-gradient(135deg, #667eea 0%, #764ba2 100%));
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        transition: transform 0.2s, box-shadow 0.2s;
                    "
                    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 5px 15px rgba(102,126,234,0.4)'"
                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                        Access Protected Content
                    </button>
                </form>
                
                <div id="error-message" style="
                    display: none;
                    padding: 10px;
                    background: #fee;
                    border: 1px solid #fcc;
                    border-radius: 4px;
                    color: #c00;
                    font-size: 14px;
                    margin-bottom: 20px;
                "></div>
                
                <div style="
                    padding: 15px;
                    background: #f6f8fa;
                    border-radius: 6px;
                    border-left: 4px solid #667eea;
                ">
                    <p style="
                        color: #555;
                        font-size: 13px;
                        margin: 0 0 10px 0;
                        font-weight: 500;
                    ">Units Using This Site:</p>
                    <div style="
                        display: flex;
                        flex-direction: column;
                        gap: 8px;
                        font-size: 13px;
                        color: #555;
                    ">
                        <div>• ISYS6018 - Information Security Audit & Control</div>
                        <div>• ISYS2002 - Systems Analysis & Design</div>
                        <div>• ISYS6014 - Knowledge Management & Intelligent Systems</div>
                        <div>• ISAD5001 - Information Systems Analysis & Design</div>
                    </div>
                    <p style="
                        color: #888;
                        font-size: 11px;
                        margin: 10px 0 0 0;
                        font-style: italic;
                    ">Contact your unit coordinator for access credentials</p>
                </div>
                
                <div style="
                    text-align: center;
                    margin-top: 20px;
                ">
                    <a href="/" style="
                        color: #667eea;
                        text-decoration: none;
                        font-size: 14px;
                    ">← Return to Home</a>
                </div>
            </div>
        </div>
    `;
    
    // Add form submission handler
    setTimeout(() => {
        const form = document.getElementById('login-form');
        if (form) {
            form.addEventListener('submit', handleLoginSubmit);
        }
    }, 0);
}

/**
 * Handle login form submission
 */
function handleLoginSubmit(e) {
    e.preventDefault();
    
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');
    const password = passwordInput.value.trim();
    
    // Check if password is empty
    if (!password) {
        errorMessage.textContent = 'Please enter a password';
        errorMessage.style.display = 'block';
        return;
    }
    
    // Validate password
    const schedule = UNIT_SCHEDULES[password];
    if (!schedule) {
        errorMessage.textContent = 'Invalid password. Please check your unit code and try again.';
        errorMessage.style.display = 'block';
        passwordInput.value = '';
        passwordInput.focus();
        return;
    }
    
    // Create token for 24 hours
    createAccessToken(password, schedule);
    
    // Reload the page to apply access
    window.location.reload();
}

/**
 * Restore protected content after successful authentication
 */
function showProtectedContent() {
    if (window.originalContent) {
        document.body.innerHTML = window.originalContent;
        // Re-run any scripts that might have been on the page
        const scripts = document.querySelectorAll('script[data-embed-id]');
        scripts.forEach(script => {
            const newScript = document.createElement('script');
            Array.from(script.attributes).forEach(attr => {
                newScript.setAttribute(attr.name, attr.value);
            });
            newScript.textContent = script.textContent;
            script.parentNode.replaceChild(newScript, script);
        });
    }
}

/**
 * Check if current time is within business hours (7am-7pm weekdays)
 * Returns true if within hours or bypassed via ?test=true
 */
function isWithinBusinessHours() {
    // Allow bypass with ?test=true URL parameter
    if (new URLSearchParams(window.location.search).get('test') === 'true') {
        console.log('Business hours check bypassed via ?test=true');
        return true;
    }

    const now = TEST_MODE ? new Date(TEST_DATE) : new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday

    // Business hours: Monday-Friday
    // Tuesday: 4am-8pm (extended for lab sessions)
    // Other weekdays: 7am-7pm
    var startHour = (day === 2) ? 4 : 7;
    var endHour = (day === 2) ? 20 : 19;

    if (hour < startHour || hour >= endHour || day === 0 || day === 6) {
        return false;
    }
    return true;
}

/**
 * Show outside business hours message and redirect
 */
function showOutsideHoursMessage() {
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
                <div style="font-size: 48px; margin-bottom: 20px;">🕐</div>
                <h1 style="color: #333; margin-bottom: 20px; font-size: 28px;">Outside Business Hours</h1>
                <p style="color: #666; font-size: 18px; margin-bottom: 10px;">
                    CloudCore Networks offices are closed.
                </p>
                <p style="color: #999; font-size: 16px; margin-bottom: 30px;">
                    Protected content is available <strong>7:00 AM – 7:00 PM, Monday to Friday</strong>
                    (Tuesday hours extended: <strong>4:00 AM – 8:00 PM</strong>).
                </p>
                <p style="color: #007bff; font-size: 16px; margin-bottom: 20px;">
                    Redirecting to home page in <span id="countdown">5</span> seconds...
                </p>
                <button onclick="window.location.href='/'" style="
                    background: #667eea;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 16px;
                ">Go Home Now</button>
            </div>
        </div>
    `;

    let seconds = 5;
    const countdownEl = document.getElementById('countdown');
    const countdown = setInterval(() => {
        seconds--;
        if (countdownEl) countdownEl.textContent = seconds;
        if (seconds <= 0) {
            clearInterval(countdown);
            window.location.href = '/';
        }
    }, 1000);
}

/**
 * Main access control function
 */
async function checkAccess() {
    // Load configuration first
    await loadAccessConfig();

    // Check if this page needs protection
    if (!isProtectedPage()) {
        // Public page - no restrictions
        return;
    }

    // Check business hours before anything else
    if (!isWithinBusinessHours()) {
        showOutsideHoursMessage();
        return;
    }

    // Check for valid token first
    const existingToken = isTokenValid();
    if (existingToken) {
        // Valid token exists, use it
        const schedule = UNIT_SCHEDULES[existingToken.password];
        if (schedule) {
            const accessLevel = getCurrentAccessLevel(schedule);
            
            // Check if current page/resource is allowed
            const currentPath = window.location.pathname;
            if (!isResourceAllowed(currentPath, schedule, accessLevel)) {
                showResourceDeniedMessage(schedule, accessLevel);
                return;
            }
            
            applyAccessLevel(accessLevel, schedule.unit, schedule);
            return;
        }
    }
    
    // No valid token, show login form
    hideProtectedContent();
    // Login form will handle authentication via form submission
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
                    <strong>Authorized Units:</strong><br>
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
 * Apply access restrictions based on level and unit configuration
 */
function applyAccessLevel(level, unitName, unitConfig) {
    // Add access indicator
    addAccessIndicator(level, unitName, unitConfig);
    
    // Hide/show content based on access level and unit rules
    const consultantElements = document.querySelectorAll('[data-access="consultant"]');
    const auditorElements = document.querySelectorAll('[data-access="auditor"]');
    
    if (level === 'public') {
        // Hide consultant and auditor content
        consultantElements.forEach(el => hideElement(el));
        auditorElements.forEach(el => hideElement(el));
    } else if (level === 'consultant') {
        // Show consultant, check auditor based on rules
        consultantElements.forEach(el => {
            if (isElementAllowed(el, unitConfig, level)) {
                showElement(el);
            } else {
                hideElement(el);
            }
        });
        auditorElements.forEach(el => {
            if (isElementAllowed(el, unitConfig, level)) {
                showElement(el);
            } else {
                hideElement(el);
            }
        });
    } else if (level === 'auditor') {
        // Show content based on unit rules
        consultantElements.forEach(el => {
            if (isElementAllowed(el, unitConfig, level)) {
                showElement(el);
            } else {
                hideElement(el);
            }
        });
        auditorElements.forEach(el => {
            if (isElementAllowed(el, unitConfig, level)) {
                showElement(el);
            } else {
                hideElement(el);
            }
        });
    }
    
    // Handle chatbot access with unit-specific rules
    handleChatbotAccess(level, unitConfig);
}

/**
 * Check if a specific content element is allowed based on unit configuration
 */
function isElementAllowed(element, unitConfig, currentLevel) {
    // If no unit config or access rules, use default behavior
    if (!unitConfig || !unitConfig.accessRules) {
        return true;
    }
    
    // Get element identifier (could be data attribute, class, or content)
    const elementId = element.getAttribute('data-resource-id') || 
                     element.getAttribute('data-access') || 
                     element.className || 
                     'unknown';
    
    // Check against unit's access rules
    return isResourceAllowed(`/element/${elementId}`, unitConfig, currentLevel);
}

/**
 * Show resource denied message for specific resources
 */
function showResourceDeniedMessage(unitConfig, currentLevel) {
    const currentPath = window.location.pathname;
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
                ">🚫</div>
                
                <h1 style="
                    color: #333;
                    margin-bottom: 20px;
                    font-size: 28px;
                ">Resource Not Available</h1>
                
                <p style="
                    color: #666;
                    margin-bottom: 10px;
                    font-size: 18px;
                ">This resource is not included in your unit's scenario configuration.</p>
                
                <div style="
                    background: #f8f9fa;
                    border-radius: 8px;
                    padding: 20px;
                    margin: 20px 0;
                    border-left: 4px solid #667eea;
                ">
                    <p style="
                        color: #555;
                        margin: 0 0 10px 0;
                        font-weight: 500;
                    ">Your Access Details:</p>
                    <div style="
                        color: #666;
                        font-size: 14px;
                    ">
                        <div><strong>Unit:</strong> ${unitConfig.unit}</div>
                        <div><strong>Access Level:</strong> ${currentLevel.toUpperCase()}</div>
                        <div><strong>Scenario:</strong> ${unitConfig.accessRules?.scenarioConfig?.name || 'Default'}</div>
                    </div>
                </div>
                
                <p style="
                    color: #999;
                    margin-bottom: 30px;
                    font-size: 14px;
                ">This resource has been excluded from your learning scenario. 
                Contact your unit coordinator if you believe this is an error.</p>
                
                <div>
                    <button onclick="history.back()" style="
                        background: #007bff;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 16px;
                        margin-right: 10px;
                    ">Go Back</button>
                    
                    <button onclick="window.location.href='/docs/'" style="
                        background: #6c757d;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 16px;
                    ">Browse Available Content</button>
                </div>
            </div>
        </div>
    `;
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
 * Handle chatbot access with unit-specific rules
 * Chatbots should only be available:
 * 1. With at least consultant access (not public)
 * 2. During business hours (weekdays) - handled by isWithinBusinessHours()
 * 3. Based on unit's access configuration
 */
function handleChatbotAccess(level, unitConfig) {
    // Check if we're on a chatbot page
    const isChatbotPage = window.location.pathname.includes('/chatbots/') || 
                          document.querySelector('script[data-embed-id]');
    
    if (!isChatbotPage) return;
    
    const currentPath = window.location.pathname;
    
    // Check if this chatbot is allowed for this unit
    if (!isResourceAllowed(currentPath, unitConfig, level)) {
        showResourceDeniedMessage(unitConfig, level);
        return;
    }
    
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
                const scenarioName = unitConfig?.accessRules?.scenarioConfig?.name || 'Standard Access';
                notice.innerHTML = `
                    <small><strong>Scenario:</strong> ${scenarioName} | 
                    <strong>Access Level:</strong> Consultant | 
                    Some content may be restricted based on your unit's configuration.</small>
                `;
                script.parentNode.insertBefore(notice, script);
            }
        });
    } else if (level === 'auditor') {
        // Full auditor access - show everything allowed
        document.querySelectorAll('script[data-embed-id]').forEach(script => {
            script.style.display = '';
            
            // Add auditor notice
            if (!script.previousElementSibling?.classList.contains('access-notice')) {
                const notice = document.createElement('div');
                notice.className = 'access-notice alert alert-success mb-3';
                const scenarioName = unitConfig?.accessRules?.scenarioConfig?.name || 'Full Access';
                notice.innerHTML = `
                    <small><strong>Scenario:</strong> ${scenarioName} | 
                    <strong>Full Access:</strong> You have auditor-level access within your unit's scenario configuration.</small>
                `;
                script.parentNode.insertBefore(notice, script);
            }
        });
    }
}

/**
 * Add access level indicator to page with scenario information
 */
function addAccessIndicator(level, unitName, unitConfig) {
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
                Expires in ${hoursLeft}h
            </div>`;
        } catch (e) {
            // Invalid token
        }
    }
    
    // Get scenario information
    const scenarioInfo = unitConfig?.accessRules?.scenarioConfig || null;
    let scenarioDisplay = '';
    if (scenarioInfo) {
        scenarioDisplay = `<div style="font-size: 10px; margin-top: 2px; opacity: 0.8;">
            ${scenarioInfo.name}
        </div>`;
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
        padding: 12px 18px;
        border-radius: 20px;
        font-size: 13px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        cursor: pointer;
        max-width: 250px;
        line-height: 1.3;
    `;
    
    indicator.innerHTML = `
        <div style="font-weight: 600;">${unitConfig?.unitCode || 'Unknown'}</div>
        <div style="font-size: 11px; margin-top: 2px;">
            ${level.toUpperCase()} Access
        </div>
        ${scenarioDisplay}
        ${expiryInfo}
    `;
    
    // Add click handler with more options
    indicator.onclick = () => {
        const action = confirm('Click OK to change password/unit, or Cancel to view scenario details');
        if (action) {
            localStorage.removeItem('cloudcore_password');
            localStorage.removeItem('cloudcore_token');
            location.reload();
        } else if (scenarioInfo) {
            alert(`Scenario: ${scenarioInfo.name}\n\nDescription: ${scenarioInfo.description}\n\nAccess Mode: ${unitConfig.accessRules.mode}`);
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
 * Debug function for testing access rules
 */
window.debugAccessConfig = function() {
    console.log('Current ACCESS_CONFIG:', ACCESS_CONFIG);
    console.log('Current UNIT_SCHEDULES:', UNIT_SCHEDULES);
    
    const token = localStorage.getItem('cloudcore_token');
    if (token) {
        try {
            const parsedToken = JSON.parse(token);
            console.log('Current token:', parsedToken);
            const schedule = UNIT_SCHEDULES[parsedToken.password];
            if (schedule) {
                console.log('Unit config:', schedule);
                console.log('Current access level:', getCurrentAccessLevel(schedule));
                console.log('Current path allowed:', isResourceAllowed(window.location.pathname, schedule, getCurrentAccessLevel(schedule)));
            }
        } catch (e) {
            console.error('Invalid token:', e);
        }
    } else {
        console.log('No token found');
    }
};

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