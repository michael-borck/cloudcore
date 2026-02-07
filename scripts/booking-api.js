/**
 * CloudCore Booking API Client
 * Connects to sim-booking-api for chatbot appointment scheduling
 */

const BookingAPI = {
    // API base URL - switches between local dev and production
    baseUrl: window.location.hostname === 'localhost'
        ? 'http://localhost:8080/api'
        : 'https://booking-api.serveur.au/api',

    // Student identification (set during booking flow)
    studentEmail: null,
    studentName: null,
    unitCode: null,

    /**
     * Set student info for booking requests
     */
    setStudent(email, name = null, unitCode = null) {
        this.studentEmail = email;
        this.studentName = name;
        this.unitCode = unitCode;

        // Persist to sessionStorage
        sessionStorage.setItem('booking_student', JSON.stringify({
            email, name, unitCode
        }));
    },

    /**
     * Get stored student info
     */
    getStudent() {
        if (this.studentEmail) {
            return {
                email: this.studentEmail,
                name: this.studentName,
                unitCode: this.unitCode
            };
        }

        const stored = sessionStorage.getItem('booking_student');
        if (stored) {
            const data = JSON.parse(stored);
            this.studentEmail = data.email;
            this.studentName = data.name;
            this.unitCode = data.unitCode;
            return data;
        }

        return null;
    },

    /**
     * Clear student info
     */
    clearStudent() {
        this.studentEmail = null;
        this.studentName = null;
        this.unitCode = null;
        sessionStorage.removeItem('booking_student');
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
            throw new Error('Please enter your student email before booking.');
        }

        const payload = {
            student_email: student.email,
            student_name: student.name,
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
            throw new Error('Student email required to cancel.');
        }

        return this.request(`/appointments/${appointmentId}`, {
            method: 'DELETE',
            body: JSON.stringify({
                student_email: student.email,
                reason: reason
            })
        });
    },

    /**
     * Get calendar invite URL for an appointment
     */
    getCalendarUrl(appointmentId, email) {
        return `${this.baseUrl}/appointments/${appointmentId}/calendar?email=${encodeURIComponent(email)}`;
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
                message: 'Please enter your student email to check access.'
            };
        }

        return this.request('/access/check', {
            method: 'POST',
            body: JSON.stringify({
                student_email: student.email,
                employee_id: employeeId,
                unit_code: student.unitCode
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
