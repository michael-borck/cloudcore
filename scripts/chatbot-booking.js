/**
 * CloudCore Chatbot Booking Integration
 * Controls access to chatbot based on appointment status
 *
 * Flow:
 * 1. Chat widget is hidden by default
 * 2. Student chooses "Attend Interview" or "Schedule Interview"
 * 3. For "Attend": verify email has active appointment, then show chat
 * 4. For "Schedule": open booking modal to book a slot
 */

const ChatbotBooking = {
    employeeId: null,
    employeeName: null,
    chatWidgetScript: null,
    chatWidgetHidden: false,

    /**
     * Initialize booking integration
     */
    init() {
        // Only run on chatbot pages
        const path = window.location.pathname;
        const match = path.match(/\/chatbots\/bots\/([^\/]+)/);
        if (!match) return;

        this.employeeId = match[1];

        // Extract employee name from page
        const pageTitle = document.querySelector('h1, .title');
        if (pageTitle) {
            this.employeeName = pageTitle.textContent.trim();
        } else {
            this.employeeName = this.employeeId?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        }

        // Hide the chat widget initially
        this.hideChatWidget();

        // Add the access control UI
        this.addAccessUI();

        // Check if student already has verified access
        this.checkExistingAccess();
    },

    /**
     * Hide the AnythingLLM chat widget
     */
    hideChatWidget() {
        // Store reference to the widget script
        this.chatWidgetScript = document.querySelector('script[data-embed-id]');

        // Hide any existing chat widget elements
        const hideWidget = () => {
            const widgets = document.querySelectorAll('[id*="anything-llm"], [class*="anything-llm"], #chat-widget, .chat-widget-container');
            widgets.forEach(w => w.style.display = 'none');

            // Also hide the floating button that AnythingLLM creates
            const floatingBtn = document.querySelector('button[style*="position: fixed"]');
            if (floatingBtn && floatingBtn.textContent.includes('+')) {
                floatingBtn.style.display = 'none';
            }
        };

        // Run immediately and after a delay (widget loads async)
        hideWidget();
        setTimeout(hideWidget, 500);
        setTimeout(hideWidget, 1500);

        this.chatWidgetHidden = true;
    },

    /**
     * Show the chat widget after access is verified
     */
    showChatWidget() {
        // Show any hidden widget elements
        const widgets = document.querySelectorAll('[id*="anything-llm"], [class*="anything-llm"], #chat-widget, .chat-widget-container');
        widgets.forEach(w => w.style.display = '');

        // Show floating button
        const floatingBtn = document.querySelector('button[style*="position: fixed"]');
        if (floatingBtn) {
            floatingBtn.style.display = '';
        }

        this.chatWidgetHidden = false;
    },

    /**
     * Add the access control UI to the page
     */
    addAccessUI() {
        // Find insertion point - before the chat widget or at end of content
        const chatWidget = document.querySelector('script[data-embed-id]');
        const pageContent = document.querySelector('.quarto-body, main, article');
        if (!chatWidget && !pageContent) return;

        const accessSection = document.createElement('div');
        accessSection.id = 'chatbot-access-section';
        accessSection.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                border: 2px solid #dee2e6;
                border-radius: 12px;
                padding: 30px;
                margin: 20px 0;
                text-align: center;
            ">
                <h3 style="margin: 0 0 10px 0; color: #333; font-size: 22px;">
                    Interview with ${this.escapeHtml(this.employeeName || 'Employee')}
                </h3>
                <p style="color: #666; margin: 0 0 25px 0; font-size: 15px;">
                    Appointments are required to interview CloudCore staff members.
                </p>

                <!-- Access Options -->
                <div id="access-options" style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                    <button onclick="ChatbotBooking.showAttendForm()" style="
                        padding: 14px 28px;
                        background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
                        <span style="font-size: 20px;">&#128272;</span>
                        Attend Interview
                    </button>

                    <button onclick="ChatbotBooking.openBooking()" style="
                        padding: 14px 28px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
                        <span style="font-size: 20px;">&#128197;</span>
                        Schedule Interview
                    </button>
                </div>

                <!-- Attend Form (hidden initially) -->
                <div id="attend-form" style="display: none; max-width: 400px; margin: 0 auto;">
                    <form onsubmit="ChatbotBooking.verifyAccess(event)">
                        <div style="margin-bottom: 15px; text-align: left;">
                            <label for="attend-email" style="display: block; font-weight: 500; margin-bottom: 6px; color: #333;">
                                Student Email
                            </label>
                            <input type="email" id="attend-email" required placeholder="your.email@student.edu" style="
                                width: 100%;
                                padding: 12px;
                                border: 2px solid #e9ecef;
                                border-radius: 6px;
                                font-size: 16px;
                                box-sizing: border-box;
                            ">
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button type="button" onclick="ChatbotBooking.showOptions()" style="
                                flex: 1;
                                padding: 12px;
                                background: #6c757d;
                                color: white;
                                border: none;
                                border-radius: 6px;
                                font-size: 15px;
                                cursor: pointer;
                            ">Back</button>
                            <button type="submit" id="verify-btn" style="
                                flex: 2;
                                padding: 12px;
                                background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                                color: white;
                                border: none;
                                border-radius: 6px;
                                font-size: 15px;
                                font-weight: 600;
                                cursor: pointer;
                            ">Verify & Join</button>
                        </div>
                    </form>
                </div>

                <!-- Status Messages -->
                <div id="access-status" style="margin-top: 20px;"></div>

                <!-- Active Session (shown when access granted) -->
                <div id="active-session" style="display: none;">
                    <div style="
                        background: #d4edda;
                        border: 1px solid #c3e6cb;
                        color: #155724;
                        padding: 15px 20px;
                        border-radius: 8px;
                        margin-bottom: 15px;
                        text-align: left;
                    ">
                        <strong>Interview Active</strong>
                        <div id="session-details" style="margin-top: 5px; font-size: 14px;"></div>
                    </div>
                    <p style="color: #666; font-size: 14px; margin: 0;">
                        Click the <strong>+</strong> button in the lower right corner to open the chat.
                    </p>
                    <button onclick="ChatbotBooking.endSession()" style="
                        margin-top: 15px;
                        padding: 8px 16px;
                        background: #dc3545;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        font-size: 13px;
                        cursor: pointer;
                    ">End Interview</button>
                </div>
            </div>
        `;

        if (chatWidget && chatWidget.parentNode) {
            chatWidget.parentNode.insertBefore(accessSection, chatWidget);
        } else if (pageContent) {
            pageContent.appendChild(accessSection);
        }
    },

    /**
     * Show the main options
     */
    showOptions() {
        document.getElementById('access-options').style.display = 'flex';
        document.getElementById('attend-form').style.display = 'none';
        document.getElementById('access-status').innerHTML = '';
    },

    /**
     * Show the attend/verify form
     */
    showAttendForm() {
        document.getElementById('access-options').style.display = 'none';
        document.getElementById('attend-form').style.display = 'block';

        // Pre-fill email if stored
        const student = BookingAPI.getStudent();
        if (student) {
            document.getElementById('attend-email').value = student.email;
        }

        document.getElementById('attend-email').focus();
    },

    /**
     * Verify access and show chat if valid
     */
    async verifyAccess(event) {
        event.preventDefault();

        const email = document.getElementById('attend-email').value.trim();
        if (!email) return;

        const verifyBtn = document.getElementById('verify-btn');
        const statusDiv = document.getElementById('access-status');

        verifyBtn.disabled = true;
        verifyBtn.textContent = 'Verifying...';
        statusDiv.innerHTML = '';

        try {
            // Store email for future use
            BookingAPI.setStudent(email);

            const access = await BookingAPI.checkAccess(this.employeeId);

            if (access.access === 'granted') {
                // Access granted - show chat
                this.grantAccess(access);

            } else if (access.access === 'has_appointment_not_now') {
                // Has appointment but not active
                const apt = access.appointment;
                statusDiv.innerHTML = `
                    <div style="
                        background: #fff3cd;
                        border: 1px solid #ffc107;
                        color: #856404;
                        padding: 15px;
                        border-radius: 8px;
                        text-align: left;
                    ">
                        <strong>Your appointment is not active yet</strong>
                        <p style="margin: 10px 0 0 0;">
                            Your interview with ${this.escapeHtml(access.employee_name)} is scheduled for:<br>
                            <strong>${BookingAPI.formatDateTime(apt.scheduled_start)}</strong>
                        </p>
                        <p style="margin: 10px 0 0 0; font-size: 13px;">
                            Please return at your scheduled time.
                            <a href="${BookingAPI.getCalendarUrl(apt.id, email)}" download style="color: #856404;">
                                Add to calendar
                            </a>
                        </p>
                    </div>
                `;
                this.showOptions();

            } else if (access.access === 'outside_hours') {
                statusDiv.innerHTML = `
                    <div style="
                        background: #f8d7da;
                        border: 1px solid #f5c6cb;
                        color: #721c24;
                        padding: 15px;
                        border-radius: 8px;
                    ">
                        <strong>Office Closed</strong>
                        <p style="margin: 10px 0 0 0;">${this.escapeHtml(access.message)}</p>
                    </div>
                `;
                this.showOptions();

            } else {
                // No appointment
                statusDiv.innerHTML = `
                    <div style="
                        background: #cce5ff;
                        border: 1px solid #b8daff;
                        color: #004085;
                        padding: 15px;
                        border-radius: 8px;
                    ">
                        <strong>No active appointment found</strong>
                        <p style="margin: 10px 0 0 0;">
                            You need to schedule an interview before you can chat with ${this.escapeHtml(access.employee_name)}.
                        </p>
                        <button onclick="ChatbotBooking.openBooking()" style="
                            margin-top: 10px;
                            padding: 10px 20px;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                            font-weight: 600;
                        ">Schedule Interview</button>
                    </div>
                `;
                this.showOptions();
            }

        } catch (error) {
            statusDiv.innerHTML = `
                <div style="
                    background: #f8d7da;
                    border: 1px solid #f5c6cb;
                    color: #721c24;
                    padding: 15px;
                    border-radius: 8px;
                ">
                    <strong>Error</strong>
                    <p style="margin: 10px 0 0 0;">${this.escapeHtml(error.message)}</p>
                </div>
            `;
            this.showOptions();
        }

        verifyBtn.disabled = false;
        verifyBtn.textContent = 'Verify & Join';
    },

    /**
     * Grant access and show chat widget
     */
    grantAccess(access) {
        const apt = access.appointment;
        const student = BookingAPI.getStudent();

        // Store access in session
        sessionStorage.setItem('chatbot_access', JSON.stringify({
            employeeId: this.employeeId,
            email: student.email,
            appointmentId: apt.id,
            grantedAt: Date.now(),
            expiresAt: new Date(apt.scheduled_end).getTime()
        }));

        // Hide options, show active session
        document.getElementById('access-options').style.display = 'none';
        document.getElementById('attend-form').style.display = 'none';
        document.getElementById('access-status').innerHTML = '';

        document.getElementById('session-details').innerHTML = `
            With: ${this.escapeHtml(access.employee_name)}<br>
            Until: ${BookingAPI.formatTime(apt.scheduled_end)}
        `;
        document.getElementById('active-session').style.display = 'block';

        // Show the chat widget
        this.showChatWidget();
    },

    /**
     * Check for existing valid access
     */
    async checkExistingAccess() {
        const stored = sessionStorage.getItem('chatbot_access');
        if (!stored) return;

        try {
            const access = JSON.parse(stored);

            // Check if same employee and not expired
            if (access.employeeId !== this.employeeId) return;
            if (Date.now() > access.expiresAt) {
                sessionStorage.removeItem('chatbot_access');
                return;
            }

            // Re-verify with server
            BookingAPI.setStudent(access.email);
            const check = await BookingAPI.checkAccess(this.employeeId);

            if (check.access === 'granted') {
                this.grantAccess(check);
            } else {
                sessionStorage.removeItem('chatbot_access');
            }

        } catch (e) {
            sessionStorage.removeItem('chatbot_access');
        }
    },

    /**
     * End the current session
     */
    async endSession() {
        const stored = sessionStorage.getItem('chatbot_access');
        if (stored) {
            try {
                const access = JSON.parse(stored);
                // Notify server that session ended
                await BookingAPI.request('/access/end-session', {
                    method: 'POST',
                    body: JSON.stringify({
                        student_email: access.email,
                        employee_id: this.employeeId
                    })
                });
            } catch (e) {
                // Ignore errors
            }
        }

        sessionStorage.removeItem('chatbot_access');

        // Hide chat widget and show options
        this.hideChatWidget();
        document.getElementById('active-session').style.display = 'none';
        this.showOptions();
    },

    /**
     * Open the booking modal
     */
    openBooking() {
        if (!this.employeeId) {
            alert('Unable to determine employee. Please refresh the page.');
            return;
        }

        BookingModal.open(this.employeeId, this.employeeName);
    },

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ChatbotBooking.init());
} else {
    ChatbotBooking.init();
}
