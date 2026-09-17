/**
 * CloudCore Chatbot Booking Integration
 * Controls access to chatbot based on appointment status
 *
 * Flow:
 * 1. Chat widget is hidden by default
 * 2. Student chooses "Attend Interview" or "Schedule Interview"
 * 3. For "Attend": verify the badge has an active appointment, then show chat
 * 4. For "Schedule": open booking modal to book a slot
 */

const ChatbotBooking = {
    employeeId: null,
    employeeName: null,
    chatWidgetScript: null,
    chatWidgetHidden: false,

    // Whether the booking API is available
    bookingAvailable: false,

    /**
     * Initialize booking integration
     */
    async init() {
        // Only run on chatbot pages
        const path = window.location.pathname;
        const match = path.match(/\/chatbots\/bots\/([^\/]+)/);
        if (!match) return;

        this.employeeId = match[1];

        // Help bot is freely accessible — no booking required
        if (this.employeeId === 'help_bot') return;

        // Extract employee name from page
        const pageTitle = document.querySelector('h1, .title');
        if (pageTitle) {
            this.employeeName = pageTitle.textContent.trim();
        } else {
            this.employeeName = this.employeeId?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        }

        // Check if the booking API is reachable before setting up booking UI
        this.bookingAvailable = await this.checkBookingAPI();

        if (!this.bookingAvailable) {
            // Booking API not available — fall back to direct chatbot access
            // Chat widget remains visible (pre-booking behavior)
            console.log('Booking API not available — chatbot access is open.');
            return;
        }

        // Booking API is available — enforce appointment-based access
        // Hide the chat widget initially
        this.hideChatWidget();

        // Add the access control UI
        this.addAccessUI();

        // Our own floating chat-style button: the single entry point students
        // see (native '+' stays hidden until access is granted)
        this.addFloatingButton();

        // Check if student already has verified access
        this.checkExistingAccess();
    },

    /**
     * Check if the booking API is reachable
     * Returns true if API responds, false otherwise
     */
    async checkBookingAPI() {
        try {
            const response = await fetch(BookingAPI.baseUrl() + '/employees', {
                method: 'GET',
                signal: AbortSignal.timeout(3000)
            });
            return response.ok;
        } catch (e) {
            // Network error, timeout, or API not running
            return false;
        }
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

        // Run immediately, then watch for the widget mounting asynchronously.
        // Fixed timeouts raced the loader (the '+' flashed visible); the
        // observer hides it the moment it enters the DOM.
        hideWidget();
        setTimeout(hideWidget, 800);
        if (typeof MutationObserver !== 'undefined' && !this._widgetMo) {
            this._widgetMo = new MutationObserver(() => {
                if (this.chatWidgetHidden) hideWidget();
            });
            this._widgetMo.observe(document.body, { childList: true, subtree: true });
        }

        this.chatWidgetHidden = true;
    },

    /**
     * Show the chat widget after access is verified
     */
    showChatWidget() {
        // Stop racing the observer — the widget is allowed through now
        if (this._widgetMo) { this._widgetMo.disconnect(); this._widgetMo = null; }

        // Show any hidden widget elements
        const widgets = document.querySelectorAll('[id*="anything-llm"], [class*="anything-llm"], #chat-widget, .chat-widget-container');
        widgets.forEach(w => w.style.display = '');

        // Show floating button
        const floatingBtn = document.querySelector('button[style*="position: fixed"]');
        if (floatingBtn) {
            floatingBtn.style.display = '';
        }

        // The native '+' is back — retire our stand-in button
        this.hideFab();

        this.chatWidgetHidden = false;
    },

    /**
     * Add the access control UI to the page
     */
    addAccessUI() {
        // Find insertion point - the card leads the content column and stays
        // pinned (sticky) while the bio scrolls, so it is always reachable.
        const pageContent = document.querySelector('.quarto-body, main, article');
        if (!pageContent) return;

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

                    <button onclick="ChatbotBooking.downloadConversation()" title="Downloads interviews held in this browser" style="
                        padding: 14px 28px;
                        background: #fff;
                        color: #495057;
                        border: 1px solid #ced4da;
                        border-radius: 8px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
                        <span style="font-size: 20px;">&#11015;</span>
                        Download conversation
                    </button>
                </div>

                <!-- Attend Form (hidden initially) -->
                <div id="attend-form" style="display: none; max-width: 400px; margin: 0 auto;">
                    <form onsubmit="ChatbotBooking.verifyAccess(event)">
                        <div style="margin-bottom: 15px; text-align: left;">
                            <label for="attend-badge" style="display: block; font-weight: 500; margin-bottom: 6px; color: #333;">
                                Badge Code
                            </label>
                            <input type="text" id="attend-badge" required placeholder="CC-XXXX-XXXX"
                                   autocomplete="off" autocapitalize="characters" spellcheck="false" style="
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
                    <button onclick="ChatbotBooking.downloadConversation()" style="
                        margin-top: 15px;
                        margin-right: 8px;
                        padding: 8px 16px;
                        background: #667eea;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        font-size: 13px;
                        cursor: pointer;
                    ">Download my conversations</button>
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
                    <p style="color: #888; font-size: 12px; margin-top: 10px;">
                        Tip: download your conversation before ending — you'll need it for your submission.
                    </p>
                </div>
            </div>
        `;

        // Lead the content column — combined with sticky CSS (below) the card
        // stays on screen while the bio scrolls past on desktop.
        pageContent.insertBefore(accessSection, pageContent.firstChild);

        // Sticky pinning on tablet/desktop; natural flow on phones (the card
        // is already the first thing under the title there).
        if (!document.getElementById('cc-access-card-style')) {
            const style = document.createElement('style');
            style.id = 'cc-access-card-style';
            style.textContent = '@media(min-width:768px){#chatbot-access-section'
                + '{position:sticky;top:85px;z-index:40;}}';
            document.head.appendChild(style);
        }
    },

    /**
     * Show the main options
     */
    showOptions() {
        document.getElementById('access-options').style.display = 'flex';
        document.getElementById('attend-form').style.display = 'none';
    },

    /**
     * Show the attend/verify form
     */
    showAttendForm() {
        document.getElementById('access-options').style.display = 'none';
        document.getElementById('attend-form').style.display = 'block';
        document.getElementById('access-status').innerHTML = '';

        // Pre-fill badge if stored
        const student = BookingAPI.getStudent();
        if (student) {
            document.getElementById('attend-badge').value = student.badge;
        }

        document.getElementById('attend-badge').focus();
    },

    /**
     * Verify access and show chat if valid
     */
    async verifyAccess(event) {
        event.preventDefault();

        const badge = document.getElementById('attend-badge').value.trim().toUpperCase();
        if (!badge) return;

        const verifyBtn = document.getElementById('verify-btn');
        const statusDiv = document.getElementById('access-status');

        verifyBtn.disabled = true;
        verifyBtn.textContent = 'Verifying...';
        statusDiv.innerHTML = '';

        try {
            // Store badge for future use (unit code from the unit gate if present)
            BookingAPI.setStudent(badge, localStorage.getItem('cloudcore_unit_code') || null);

            const access = await BookingAPI.checkAccess(this.employeeId);

            if (access.access === 'granted') {
                // Access granted - show chat
                this.grantAccess(access);

            } else if (access.access === 'appointment_missed') {
                // Appointment window has passed - they missed it
                const apt = access.appointment;
                statusDiv.innerHTML = `
                    <div style="
                        background: #f8d7da;
                        border: 1px solid #f5c6cb;
                        color: #721c24;
                        padding: 15px;
                        border-radius: 8px;
                        text-align: left;
                    ">
                        <strong>Appointment Missed</strong>
                        <p style="margin: 10px 0 0 0;">
                            Your interview with ${this.escapeHtml(access.employee_name)} was scheduled for:<br>
                            <strong>${BookingAPI.formatDateTime(apt.scheduled_start)}</strong><br>
                            but the appointment window has now closed.
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
                        ">Book New Appointment</button>
                    </div>
                `;
                this.showOptions();

            } else if (access.access === 'has_appointment_not_now') {
                // Has appointment but it's in the future
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
                        <strong>You have an upcoming appointment</strong>
                        <p style="margin: 10px 0 0 0;">
                            Your interview with ${this.escapeHtml(access.employee_name)} is scheduled for:<br>
                            <strong>${BookingAPI.formatDateTime(apt.scheduled_start)}</strong>
                        </p>
                        ${apt.reschedule_count > 0 ? `
                        <p style="margin: 10px 0 0 0; font-size: 13px; color: #856404;">
                            Please note: our office moved this booking — the date and time above is the current one.
                            If you kept an earlier confirmation email or screenshot, it may be out of date.
                        </p>` : ""}
                        <p style="margin: 10px 0 0 0; font-size: 13px;">
                            Please return at your scheduled time.
                            <a href="${BookingAPI.getCalendarUrl(apt.id)}" download style="color: #856404;">
                                Add to calendar
                            </a>
                        </p>
                        <p style="margin: 10px 0 0 0; font-size: 13px;">
                            Need a different time?
                            <button onclick="ChatbotBooking.cancelAppointment('${apt.id}')" style="
                                background: none;
                                border: 1px solid #dc3545;
                                color: #dc3545;
                                padding: 3px 10px;
                                border-radius: 6px;
                                cursor: pointer;
                                font-size: 12px;
                            ">Cancel appointment</button>
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
            badge: student.badge,
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

        // Link this student to the widget's chat session once it has spun up.
        setTimeout(() => this.recordChatSession(), 5000);
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
            BookingAPI.setStudent(access.badge, localStorage.getItem('cloudcore_unit_code') || null);
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
     * Link this chat to the student so their transcript is retrievable by badge
     * later (durable, survives a cache clear). The AnythingLLM widget stores its
     * session id at localStorage `allm_{embedId}_session_id`.
     */
    recordChatSession() {
        try {
            const script = this.chatWidgetScript || document.querySelector('script[data-embed-id]');
            const embedId = script && (script.dataset ? script.dataset.embedId
                                                       : script.getAttribute('data-embed-id'));
            if (!embedId) return;
            const sessionId = localStorage.getItem('allm_' + embedId + '_session_id');
            if (!sessionId) return;

            const access = JSON.parse(sessionStorage.getItem('chatbot_access') || '{}');
            const student = (typeof BookingAPI !== 'undefined' && BookingAPI.getStudent()) || {};
            const badge = student.badge || access.badge;
            if (!badge) return;

            BookingAPI.recordSession({
                badge_code: badge,
                employee_id: this.employeeId || access.employeeId,
                embed_id: embedId,
                session_id: sessionId,
                appointment_id: access.appointmentId || null
            }).catch(() => {});
        } catch (e) { /* non-fatal */ }
    },

    /**
     * Every AnythingLLM session this browser holds — one per chatbot the student
     * has used. The localStorage key is `allm_{embedId}_session_id`.
     */
    sweepSessions() {
        const out = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            const m = k && k.match(/^allm_(.+)_session_id$/);
            if (m) {
                const sid = localStorage.getItem(k);
                if (sid) out.push({ embed_id: m[1], session_id: sid });
            }
        }
        return out;
    },

    /**
     * Download conversations. Pulls the durable transcript(s) from the server by
     * the session ids this browser holds (a student can only ever fetch their own
     * sessions). One conversation → download it; several → show a chooser with
     * "download all" + per-conversation links. Falls back to the on-screen text.
     */
    async downloadConversation() {
        this.recordChatSession();  // make sure the current session is linked first

        const pairs = this.sweepSessions();
        if (pairs.length === 0) return this._downloadOnScreen();

        let data;
        try {
            data = await BookingAPI.conversationsBySessions(pairs);
        } catch (e) {
            return this._downloadOnScreen();
        }
        const sessions = (data && data.sessions) || [];
        if (sessions.length <= 1) {
            this._downloadText(data.transcript || '', {}, this._badge());
            return;
        }
        this._showChooser(sessions, data.transcript);
    },

    _showChooser(sessions, combined) {
        this._chooserData = { sessions, combined };
        const host = document.getElementById('active-session') || document.body;
        let panel = document.getElementById('conversation-chooser');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'conversation-chooser';
            panel.style.cssText = 'margin-top:15px;padding:12px;background:#f8f9fa;'
                + 'border-radius:8px;text-align:left;';
            host.appendChild(panel);
        }
        let html = '<strong>Your conversations</strong>'
            + '<div style="margin:10px 0;"><button onclick="ChatbotBooking._downloadCombined()" '
            + 'style="padding:6px 12px;background:#667eea;color:#fff;border:none;border-radius:6px;'
            + `cursor:pointer;">Download all (${sessions.length})</button></div>`
            + '<ul style="list-style:none;padding:0;margin:0;">';
        sessions.forEach((s, i) => {
            html += `<li style="padding:4px 0;"><a href="#" onclick="ChatbotBooking._downloadOne(${i});return false;">`
                + `${this.escapeHtml(s.employee_name)}</a> <span style="color:#888;font-size:12px;">`
                + `(${s.turns.length} messages)</span></li>`;
        });
        panel.innerHTML = html + '</ul>';
    },

    _downloadCombined() {
        if (this._chooserData) this._downloadText(this._chooserData.combined, {}, this._badge());
    },

    _downloadOne(i) {
        const s = this._chooserData && this._chooserData.sessions[i];
        if (!s) return;
        const body = s.turns.map(t =>
            (String(t.role).toLowerCase() === 'user' ? 'Student' : s.employee_name)
            + ': ' + t.content).join('\n');
        this._downloadText(`=== ${s.employee_name} ===\n${body}`, {}, this._badge());
    },

    _badge() {
        const access = JSON.parse(sessionStorage.getItem('chatbot_access') || '{}');
        const student = (typeof BookingAPI !== 'undefined' && BookingAPI.getStudent()) || {};
        return student.badge || access.badge || '';
    },

    _downloadOnScreen() {
        const roots = document.querySelectorAll(
            '[id*="anything-llm"], [class*="anything-llm"], [class*="allm-"]');
        let text = '';
        roots.forEach(r => {
            const t = (r.innerText || '').trim();
            if (t.length > text.length) text = t;
        });
        if (!text || text.length < 5) {
            alert('No saved conversations found in this browser. If you cleared your '
                + 'cache, ask your lecturer to retrieve them for you.');
            return;
        }
        this._downloadText(text, {}, this._badge());
    },

    _downloadText(body, access, badge) {
        const header = 'CloudCore Networks — interview transcript\n'
            + `Employee: ${access.employeeId || this.employeeId || ''}\n`
            + `Badge: ${badge || ''}\n`
            + `Downloaded: ${new Date().toLocaleString()}\n`
            + '\n----------------------------------------\n\n';
        const blob = new Blob([header + body], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `cloudcore-interview-${access.employeeId || 'chat'}-`
            + `${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    },

    /**
     * End the current session
     */
    async endSession() {
        this.recordChatSession();  // capture the session link before they leave
        const stored = sessionStorage.getItem('chatbot_access');
        if (stored) {
            try {
                const access = JSON.parse(stored);
                // Notify server that session ended
                await BookingAPI.request('/access/end-session', {
                    method: 'POST',
                    body: JSON.stringify({
                        badge_code: access.badge,
                        employee_id: this.employeeId,
                        unit_code: localStorage.getItem('cloudcore_unit_code') || ''
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
     * Our stand-in for the AnythingLLM '+' launcher. Always visible while the
     * native widget is hidden; clicking routes by access state:
     *   granted  → reveal the native widget and open the chat
     *   not yet  → scroll to the Attend / Schedule card
     */
    addFloatingButton() {
        if (document.getElementById('cc-chat-fab')) return;
        const fab = document.createElement('button');
        fab.id = 'cc-chat-fab';
        fab.type = 'button';
        fab.title = 'Interview access';
        fab.setAttribute('aria-label', 'Interview access');
        fab.style.cssText = 'position:fixed;bottom:22px;right:22px;width:56px;height:56px;'
            + 'border-radius:50%;border:none;background:#2563eb;color:#fff;cursor:pointer;'
            + 'box-shadow:0 4px 16px rgba(0,0,0,.28);z-index:99990;display:flex;'
            + 'align-items:center;justify-content:center;transition:transform .15s;';
        fab.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" '
            + 'stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" '
            + 'aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 '
            + '8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 '
            + '8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';
        fab.addEventListener('mouseenter', () => { fab.style.transform = 'scale(1.06)'; });
        fab.addEventListener('mouseleave', () => { fab.style.transform = 'none'; });
        fab.addEventListener('click', () => this.handleFabClick());
        document.body.appendChild(fab);
    },

    hideFab() {
        document.getElementById('cc-chat-fab')?.remove();
    },

    handleFabClick() {
        if (!this.chatWidgetHidden) {
            // Granted: hand over to the native widget, best-effort open
            this.showChatWidget();
            try {
                if (window.AnythingLLM && typeof window.AnythingLLM.toggleOpenChat === 'function') {
                    window.AnythingLLM.toggleOpenChat(true);
                }
            } catch (e) { /* student clicks the native '+' instead */ }
            return;
        }

        // Not granted (yet): bring the Attend / Schedule card into view
        const card = document.getElementById('chatbot-access-section');
        if (!card) return;
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        card.style.boxShadow = '0 0 0 4px rgba(37,99,235,.35)';
        setTimeout(() => { card.style.boxShadow = 'none'; }, 1400);
    },

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Cancel the student's upcoming appointment, then re-check access so the
     * panel flips to the rebook flow. Cancelling frees the meeting allowance.
     */
    async cancelAppointment(appointmentId) {
        if (!confirm('Cancel this interview? Your meeting allowance is freed and you can rebook another time.')) {
            return;
        }
        try {
            await BookingAPI.cancelAppointment(appointmentId, 'Cancelled by student from booking page');
            await this.verifyAccess({ preventDefault() {} });
        } catch (e) {
            alert('Could not cancel the appointment: ' + e.message);
        }
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ChatbotBooking.init());
} else {
    ChatbotBooking.init();
}
