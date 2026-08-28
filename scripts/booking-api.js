/**
 * CloudCore Booking API Client
 * Connects to sim-booking-api for chatbot appointment scheduling
 */

const BookingAPI = {
    // API base URL - switches between local dev and production
    baseUrl: window.location.hostname === 'localhost'
        ? (typeof CloudCoreConfig !== 'undefined' ? CloudCoreConfig.bookingApiLocalUrl : 'http://localhost:8080/api')
        : (typeof CloudCoreConfig !== 'undefined' ? CloudCoreConfig.bookingApiUrl : 'https://booking.cloudcore.eduserver.au/api'),

    // Student identification: an issued "contractor badge" code — no emails
    // or names anywhere. localStorage (not session) so it survives the tab.
    badgeCode: null,
    unitCode: null,

    /**
     * Set the badge for booking requests
     */
    setStudent(badge, unitCode = null) {
        this.badgeCode = badge.trim().toUpperCase();
        this.unitCode = unitCode;
        localStorage.setItem('booking_badge', JSON.stringify({
            badge: this.badgeCode, unitCode
        }));
    },

    /**
     * Get stored badge info ({badge, unitCode} or null)
     */
    getStudent() {
        if (this.badgeCode) {
            return { badge: this.badgeCode, unitCode: this.unitCode };
        }
        const stored = localStorage.getItem('booking_badge');
        if (stored) {
            const data = JSON.parse(stored);
            this.badgeCode = data.badge;
            this.unitCode = data.unitCode;
            return data;
        }
        return null;
    },

    /**
     * Clear badge info
     */
    clearStudent() {
        this.badgeCode = null;
        this.unitCode = null;
        localStorage.removeItem('booking_badge');
    },

    /**
     * Make API request with error handling
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;

        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            if (error.message === 'Failed to fetch') {
                throw new Error('Cannot connect to booking service. Please try again later.');
            }
            throw error;
        }
    },

    // =========================================================================
    // Employee Endpoints
    // =========================================================================

    /**
     * List all available employees (chatbot characters)
     */
    async listEmployees() {
        return this.request('/employees');
    },

    /**
     * Get info about a specific employee
     */
    async getEmployee(employeeId) {
        return this.request(`/employees/${employeeId}`);
    },

    /**
     * Get available booking slots for an employee
     * @param {string} employeeId - Employee ID
     * @param {number} days - Number of days to look ahead (default 14)
     */
    async getSlots(employeeId, days = 14) {
        return this.request(`/employees/${employeeId}/slots?days=${days}`);
    },

    /**
     * Get a student's meeting usage with an employee (drives the "use wisely" note)
     */
    async getMeetingStatus(employeeId, badge) {
        return this.request(`/employees/${employeeId}/meeting-status?badge=${encodeURIComponent(badge)}`);
    },

    /**
     * Get employee info incl. availability constraints (days, hours, notice)
     */
    async getEmployee(employeeId) {
        return this.request(`/employees/${employeeId}`);
    },

    /**
     * Link the student to the AnythingLLM embed session they're using, so their
     * transcript can be retrieved later by badge code.
     */
    async recordSession(payload) {
        return this.request('/conversations/record', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },

    /**
     * Fetch a student's stored transcript(s) from AnythingLLM by badge code.
     * STAFF-ONLY (needs the analytics key) — for grading/recovery, not students.
     */
    async getConversation(badge, employeeId = '') {
        const q = `badge=${encodeURIComponent(badge)}` +
                  (employeeId ? `&employee_id=${encodeURIComponent(employeeId)}` : '');
        return this.request(`/conversations?${q}`);
    },

    /**
     * Student self-download: fetch transcripts for the (embed, session) pairs the
     * browser holds. No key — possession of the session id is the credential.
     * Sent in the body so session ids don't land in server logs.
     */
    async conversationsBySessions(sessions) {
        return this.request('/conversations/by-sessions', {
            method: 'POST',
            body: JSON.stringify({ sessions })
        });
    },

    /**
     * Offer-3: propose several times; the office confirms one.
     * @param {string} employeeId
     * @param {string[]} proposedTimes - datetime-local strings (local = sim timezone)
     */
    async requestAppointment(employeeId, proposedTimes, options = {}) {
        const student = this.getStudent();
        if (!student) {
            throw new Error('Please enter your badge code before booking.');
        }
        const payload = {
            badge_code: student.badge,
            unit_code: student.unitCode,
            employee_id: employeeId,
            proposed_times: proposedTimes,
            ...options
        };
        return this.request('/appointments/request', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },

    // =========================================================================
    // Appointment Endpoints
    // =========================================================================

    /**
     * Book an appointment
     * @param {string} employeeId - Employee to book with
     * @param {string} slotStart - ISO datetime of slot start
     * @param {object} options - Additional booking options
     */
    async bookAppointment(employeeId, slotStart, options = {}) {
        const student = this.getStudent();
        if (!student) {
            throw new Error('Please enter your badge code before booking.');
        }

        const payload = {
            badge_code: student.badge,
            unit_code: student.unitCode,
            employee_id: employeeId,
            slot_start: slotStart,
            ...options
        };

        return this.request('/appointments', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },

    /**
     * Get appointment details
     */
    async getAppointment(appointmentId) {
        return this.request(`/appointments/${appointmentId}`);
    },

    /**
     * Cancel an appointment
     */
    async cancelAppointment(appointmentId, reason = null) {
        const student = this.getStudent();
        if (!student) {
            throw new Error('Badge code required to cancel.');
        }

        return this.request(`/appointments/${appointmentId}`, {
            method: 'DELETE',
            body: JSON.stringify({
                badge_code: student.badge,
                reason: reason
            })
        });
    },

    /**
     * Get calendar invite URL for an appointment
     */
    getCalendarUrl(appointmentId) {
        return `${this.baseUrl}/appointments/${appointmentId}/calendar`;
    },

    // =========================================================================
    // Access Check
    // =========================================================================

    /**
     * Check if student can access a chatbot right now
     */
    async checkAccess(employeeId) {
        const student = this.getStudent();
        if (!student) {
            return {
                access: 'needs_booking',
                message: 'Please enter your badge code to check access.'
            };
        }

        return this.request('/access/check', {
            method: 'POST',
            body: JSON.stringify({
                badge_code: student.badge,
                employee_id: employeeId,
                unit_code: student.unitCode || ''
            })
        });
    },

    // =========================================================================
    // UI Helpers
    // =========================================================================

    /**
     * Format datetime for display
     */
    formatDateTime(isoString) {
        const date = new Date(isoString);
        return date.toLocaleString('en-AU', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    },

    /**
     * Format date for display
     */
    formatDate(isoString) {
        const date = new Date(isoString);
        return date.toLocaleDateString('en-AU', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
    },

    /**
     * Format time for display
     */
    formatTime(isoString) {
        const date = new Date(isoString);
        return date.toLocaleTimeString('en-AU', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    },

    /**
     * Group slots by date for display
     */
    groupSlotsByDate(slots) {
        const groups = {};

        slots.forEach(slot => {
            const dateKey = slot.start.split('T')[0];
            if (!groups[dateKey]) {
                groups[dateKey] = {
                    date: this.formatDate(slot.start),
                    slots: []
                };
            }
            groups[dateKey].slots.push(slot);
        });

        return Object.values(groups);
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BookingAPI;
}
