/**
 * CloudCore Booking Modal
 * Displays a booking interface for chatbot appointments
 */

const BookingModal = {
    employeeId: null,
    employeeName: null,
    isOpen: false,

    /**
     * Initialize the booking modal styles
     */
    init() {
        if (document.getElementById('booking-modal-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'booking-modal-styles';
        styles.textContent = `
            .booking-overlay {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                z-index: 10000;
                align-items: center;
                justify-content: center;
                animation: fadeIn 0.2s ease;
            }

            .booking-overlay.active {
                display: flex;
            }

            .booking-modal {
                background: white;
                border-radius: 12px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                max-width: 500px;
                width: 95%;
                max-height: 85vh;
                overflow-y: auto;
                animation: slideUp 0.3s ease;
            }

            .booking-header {
                padding: 20px 25px;
                border-bottom: 1px solid #e9ecef;
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 12px 12px 0 0;
            }

            .booking-header h3 {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
            }

            .booking-close {
                background: none;
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                opacity: 0.8;
                transition: opacity 0.2s;
            }

            .booking-close:hover {
                opacity: 1;
            }

            .booking-body {
                padding: 25px;
            }

            .booking-step {
                display: none;
            }

            .booking-step.active {
                display: block;
            }

            .booking-form-group {
                margin-bottom: 20px;
            }

            .booking-form-group label {
                display: block;
                font-weight: 500;
                margin-bottom: 8px;
                color: #333;
            }

            .booking-form-group input {
                width: 100%;
                padding: 12px;
                border: 2px solid #e9ecef;
                border-radius: 6px;
                font-size: 16px;
                box-sizing: border-box;
                transition: border-color 0.2s;
            }

            .booking-form-group input:focus {
                outline: none;
                border-color: #667eea;
            }

            .booking-btn {
                padding: 12px 24px;
                border: none;
                border-radius: 6px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
            }

            .booking-btn-primary {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }

            .booking-btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
            }

            .booking-btn-primary:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: none;
            }

            .booking-btn-secondary {
                background: #6c757d;
                color: white;
            }

            .booking-btn-secondary:hover {
                background: #5a6268;
            }

            .booking-slots {
                max-height: 300px;
                overflow-y: auto;
            }

            .booking-date-group {
                margin-bottom: 20px;
            }

            .booking-date-header {
                font-weight: 600;
                color: #333;
                padding: 10px 0;
                border-bottom: 1px solid #e9ecef;
                margin-bottom: 10px;
            }

            .booking-slot-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
                gap: 8px;
            }

            .booking-slot {
                padding: 10px;
                background: #f8f9fa;
                border: 2px solid #e9ecef;
                border-radius: 6px;
                text-align: center;
                cursor: pointer;
                transition: all 0.2s;
                font-size: 14px;
            }

            .booking-slot:hover {
                border-color: #667eea;
                background: #f0f2ff;
            }

            .booking-slot.selected {
                background: #667eea;
                color: white;
                border-color: #667eea;
            }

            .booking-slot.unavailable {
                opacity: 0.5;
                cursor: not-allowed;
                background: #e9ecef;
            }

            .booking-message {
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 20px;
            }

            .booking-message.success {
                background: #d4edda;
                border: 1px solid #c3e6cb;
                color: #155724;
            }

            .booking-message.error {
                background: #f8d7da;
                border: 1px solid #f5c6cb;
                color: #721c24;
            }

            .booking-message.info {
                background: #cce5ff;
                border: 1px solid #b8daff;
                color: #004085;
            }

            .booking-loading {
                text-align: center;
                padding: 40px;
                color: #666;
            }

            .booking-spinner {
                display: inline-block;
                width: 30px;
                height: 30px;
                border: 3px solid #f3f3f3;
                border-top: 3px solid #667eea;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 10px;
            }

            .booking-confirmation {
                text-align: center;
            }

            .booking-confirmation-icon {
                font-size: 64px;
                margin-bottom: 20px;
            }

            .booking-confirmation h4 {
                color: #28a745;
                margin-bottom: 10px;
            }

            .booking-confirmation-details {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                text-align: left;
            }

            .booking-confirmation-detail {
                margin-bottom: 10px;
            }

            .booking-confirmation-detail strong {
                color: #333;
            }

            .booking-actions {
                display: flex;
                gap: 10px;
                justify-content: center;
                margin-top: 20px;
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes slideUp {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(styles);
    },

    /**
     * Open the booking modal for an employee
     */
    async open(employeeId, employeeName = null) {
        this.init();
        this.employeeId = employeeId;
        this.employeeName = employeeName || employeeId;
        this.isOpen = true;

        // Create modal HTML
        this.createModal();

        // Show email step or slots step based on stored student
        const student = BookingAPI.getStudent();
        if (student) {
            this.showSlotsStep();
        } else {
            this.showEmailStep();
        }
    },

    /**
     * Create the modal DOM structure
     */
    createModal() {
        // Remove existing modal if any
        const existing = document.getElementById('booking-modal-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'booking-modal-overlay';
        overlay.className = 'booking-overlay active';
        overlay.innerHTML = `
            <div class="booking-modal">
                <div class="booking-header">
                    <h3>Book Appointment with ${this.escapeHtml(this.employeeName)}</h3>
                    <button class="booking-close" onclick="BookingModal.close()">&times;</button>
                </div>
                <div class="booking-body">
                    <!-- Step 1: Email -->
                    <div id="booking-step-email" class="booking-step">
                        <div class="booking-message info">
                            To book an appointment, please enter your student email.
                        </div>
                        <form id="booking-email-form" onsubmit="BookingModal.submitEmail(event)">
                            <div class="booking-form-group">
                                <label for="booking-email">Student Email</label>
                                <input type="email" id="booking-email" placeholder="your.email@student.edu" required>
                            </div>
                            <div class="booking-form-group">
                                <label for="booking-name">Name (optional)</label>
                                <input type="text" id="booking-name" placeholder="Your name">
                            </div>
                            <button type="submit" class="booking-btn booking-btn-primary" style="width: 100%;">
                                Continue
                            </button>
                        </form>
                    </div>

                    <!-- Step 2: Select Slot -->
                    <div id="booking-step-slots" class="booking-step">
                        <div id="booking-slots-content">
                            <div class="booking-loading">
                                <div class="booking-spinner"></div>
                                <div>Loading available slots...</div>
                            </div>
                        </div>
                    </div>

                    <!-- Step 3: Confirmation -->
                    <div id="booking-step-confirm" class="booking-step">
                        <div id="booking-confirm-content"></div>
                    </div>
                </div>
            </div>
        `;

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.close();
        });

        // Close on escape key
        document.addEventListener('keydown', this.handleEscape);

        document.body.appendChild(overlay);
    },

    /**
     * Handle escape key press
     */
    handleEscape(e) {
        if (e.key === 'Escape' && BookingModal.isOpen) {
            BookingModal.close();
        }
    },

    /**
     * Close the modal
     */
    close() {
        const overlay = document.getElementById('booking-modal-overlay');
        if (overlay) overlay.remove();
        this.isOpen = false;
        document.removeEventListener('keydown', this.handleEscape);
    },

    /**
     * Show the email input step
     */
    showEmailStep() {
        document.querySelectorAll('.booking-step').forEach(s => s.classList.remove('active'));
        document.getElementById('booking-step-email').classList.add('active');
        document.getElementById('booking-email').focus();
    },

    /**
     * Handle email form submission
     */
    async submitEmail(event) {
        event.preventDefault();

        const email = document.getElementById('booking-email').value.trim();
        const name = document.getElementById('booking-name').value.trim();

        if (!email) return;

        // Get unit code from cloudcore token if available
        let unitCode = null;
        try {
            const token = localStorage.getItem('cloudcore_token');
            if (token) {
                const parsed = JSON.parse(token);
                unitCode = parsed.unit;
            }
        } catch (e) {
            // No token
        }

        BookingAPI.setStudent(email, name || null, unitCode);
        this.showSlotsStep();
    },

    /**
     * Show the slot selection step
     */
    async showSlotsStep() {
        document.querySelectorAll('.booking-step').forEach(s => s.classList.remove('active'));
        document.getElementById('booking-step-slots').classList.add('active');

        const content = document.getElementById('booking-slots-content');
        content.innerHTML = `
            <div class="booking-loading">
                <div class="booking-spinner"></div>
                <div>Loading available slots...</div>
            </div>
        `;

        try {
            const response = await BookingAPI.getSlots(this.employeeId);
            const availableSlots = response.slots.filter(s => s.available);

            if (availableSlots.length === 0) {
                content.innerHTML = `
                    <div class="booking-message info">
                        No available slots for the next 14 days. Please check back later.
                    </div>
                    <button class="booking-btn booking-btn-secondary" onclick="BookingModal.close()">
                        Close
                    </button>
                `;
                return;
            }

            // Group slots by date
            const grouped = BookingAPI.groupSlotsByDate(availableSlots);

            let html = `
                <div class="booking-message info">
                    Select a time slot for your appointment.
                </div>
                <div class="booking-slots">
            `;

            grouped.forEach(group => {
                html += `
                    <div class="booking-date-group">
                        <div class="booking-date-header">${group.date}</div>
                        <div class="booking-slot-grid">
                `;

                group.slots.forEach(slot => {
                    const time = BookingAPI.formatTime(slot.start);
                    const slotClass = slot.available ? '' : 'unavailable';
                    html += `
                        <div class="booking-slot ${slotClass}"
                             data-slot-start="${slot.start}"
                             onclick="BookingModal.selectSlot(this, '${slot.start}')">
                            ${time}
                        </div>
                    `;
                });

                html += '</div></div>';
            });

            html += '</div>';
            html += `
                <div style="margin-top: 20px; display: flex; gap: 10px;">
                    <button class="booking-btn booking-btn-secondary" onclick="BookingAPI.clearStudent(); BookingModal.showEmailStep();">
                        Change Email
                    </button>
                    <button id="booking-confirm-btn" class="booking-btn booking-btn-primary" disabled
                            onclick="BookingModal.confirmBooking()">
                        Book Selected Slot
                    </button>
                </div>
            `;

            content.innerHTML = html;

        } catch (error) {
            content.innerHTML = `
                <div class="booking-message error">
                    Failed to load available slots: ${this.escapeHtml(error.message)}
                </div>
                <button class="booking-btn booking-btn-secondary" onclick="BookingModal.close()">
                    Close
                </button>
            `;
        }
    },

    /**
     * Handle slot selection
     */
    selectedSlot: null,

    selectSlot(element, slotStart) {
        if (element.classList.contains('unavailable')) return;

        // Deselect previous
        document.querySelectorAll('.booking-slot.selected').forEach(s => {
            s.classList.remove('selected');
        });

        // Select new
        element.classList.add('selected');
        this.selectedSlot = slotStart;

        // Enable confirm button
        document.getElementById('booking-confirm-btn').disabled = false;
    },

    /**
     * Confirm the booking
     */
    async confirmBooking() {
        if (!this.selectedSlot) return;

        const confirmBtn = document.getElementById('booking-confirm-btn');
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Booking...';

        try {
            const result = await BookingAPI.bookAppointment(this.employeeId, this.selectedSlot);

            if (result.success) {
                this.showConfirmation(result);
            } else {
                throw new Error(result.message);
            }

        } catch (error) {
            const content = document.getElementById('booking-slots-content');
            content.innerHTML = `
                <div class="booking-message error">
                    Booking failed: ${this.escapeHtml(error.message)}
                </div>
                <button class="booking-btn booking-btn-secondary" onclick="BookingModal.showSlotsStep()">
                    Try Again
                </button>
            `;
        }
    },

    /**
     * Show booking confirmation
     */
    showConfirmation(result) {
        document.querySelectorAll('.booking-step').forEach(s => s.classList.remove('active'));
        document.getElementById('booking-step-confirm').classList.add('active');

        const apt = result.appointment;
        const student = BookingAPI.getStudent();
        const calendarUrl = result.ics_url || BookingAPI.getCalendarUrl(apt.id, student.email);

        document.getElementById('booking-confirm-content').innerHTML = `
            <div class="booking-confirmation">
                <div class="booking-confirmation-icon">&#10003;</div>
                <h4>Appointment Booked!</h4>
                <p>${this.escapeHtml(result.message)}</p>

                <div class="booking-confirmation-details">
                    <div class="booking-confirmation-detail">
                        <strong>With:</strong> ${this.escapeHtml(apt.employee_name)}
                    </div>
                    <div class="booking-confirmation-detail">
                        <strong>Date:</strong> ${BookingAPI.formatDate(apt.scheduled_start)}
                    </div>
                    <div class="booking-confirmation-detail">
                        <strong>Time:</strong> ${BookingAPI.formatTime(apt.scheduled_start)} - ${BookingAPI.formatTime(apt.scheduled_end)}
                    </div>
                    <div class="booking-confirmation-detail">
                        <strong>Appointment ID:</strong> <code>${apt.id}</code>
                    </div>
                </div>

                <div class="booking-actions">
                    <a href="${calendarUrl}" class="booking-btn booking-btn-secondary" download>
                        Add to Calendar
                    </a>
                    <button class="booking-btn booking-btn-primary" onclick="BookingModal.close()">
                        Done
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BookingModal;
}
