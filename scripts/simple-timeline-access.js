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
 * Main access control function
 */
function checkAccess() {
    // Get stored password or prompt for one
    let password = localStorage.getItem('cloudcore_password');
    
    if (!password) {
        password = prompt('Enter your unit access password:');
        if (!password) return;
        
        if (!UNIT_SCHEDULES[password]) {
            alert('Invalid password. Please check with your instructor.');
            return;
        }
        
        localStorage.setItem('cloudcore_password', password);
    }
    
    // Get the schedule for this password
    const schedule = UNIT_SCHEDULES[password];
    if (!schedule) {
        // Invalid stored password, clear and retry
        localStorage.removeItem('cloudcore_password');
        checkAccess();
        return;
    }
    
    // Determine current access level based on date
    const accessLevel = getCurrentAccessLevel(schedule);
    
    // Apply access restrictions
    applyAccessLevel(accessLevel, schedule.unit);
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
 * Handle chatbot access (hide for non-auditor levels)
 */
function handleChatbotAccess(level) {
    if (level !== 'auditor') {
        // Hide all chatbot embeds
        document.querySelectorAll('script[data-embed-id]').forEach(script => {
            if (!script.nextElementSibling?.classList.contains('chatbot-placeholder')) {
                script.style.display = 'none';
                
                const placeholder = document.createElement('div');
                placeholder.className = 'chatbot-placeholder alert alert-warning';
                placeholder.innerHTML = `
                    <h5>🤖 Employee Interview Unavailable</h5>
                    <p>Employee interviews require <strong>Full Audit</strong> access (Week 9+).</p>
                `;
                script.parentNode.insertBefore(placeholder, script.nextSibling);
            }
        });
    } else {
        // Show chatbots for auditor level
        document.querySelectorAll('script[data-embed-id]').forEach(script => {
            script.style.display = '';
            
            // Remove placeholder if present
            if (script.nextElementSibling?.classList.contains('chatbot-placeholder')) {
                script.nextElementSibling.remove();
            }
        });
    }
}

/**
 * Add access level indicator to page
 */
function addAccessIndicator(level, unitName) {
    // Remove existing indicator if present
    const existing = document.getElementById('access-indicator');
    if (existing) existing.remove();
    
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
    `;
    
    // Add click handler to change password
    indicator.onclick = () => {
        if (confirm('Change unit password?')) {
            localStorage.removeItem('cloudcore_password');
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