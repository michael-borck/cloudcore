/**
 * CloudCore API Client
 * Handles authentication and API calls to cloudcore-api backend
 */

const CloudCoreAPI = {
    // Configure this based on environment
    baseUrl: window.location.hostname === 'localhost'
        ? 'http://localhost:8001'
        : 'https://cloudcore-api.eduserver.au',

    token: null,

    /**
     * Initialize from stored session
     */
    init() {
        const session = sessionStorage.getItem('cloudcore_session');
        if (session) {
            try {
                const data = JSON.parse(session);
                // Check if session is still valid (24 hour expiry)
                if (data.expiresAt && Date.now() < data.expiresAt) {
                    this.token = data.token;
                    return data;
                } else {
                    this.logout();
                }
            } catch (e) {
                this.logout();
            }
        }
        return null;
    },

    /**
     * Login with email and password
     */
    async login(email, password) {
        const response = await fetch(`${this.baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Login failed');
        }

        const data = await response.json();

        // Store session
        const session = {
            token: data.access_token,
            expiresAt: Date.now() + (data.expires_in * 1000),
            lecturer: data.lecturer
        };
        sessionStorage.setItem('cloudcore_session', JSON.stringify(session));
        this.token = data.access_token;

        return data.lecturer;
    },

    /**
     * Logout
     */
    logout() {
        sessionStorage.removeItem('cloudcore_session');
        this.token = null;
    },

    /**
     * Get current user info
     */
    async getMe() {
        return this._fetch('/auth/me');
    },

    /**
     * Request password reset
     */
    async forgotPassword(email) {
        const response = await fetch(`${this.baseUrl}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        return response.json();
    },

    /**
     * Reset password with code
     */
    async resetPassword(email, code, newPassword) {
        const response = await fetch(`${this.baseUrl}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code, new_password: newPassword })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Reset failed');
        }
        return response.json();
    },

    // ========================================================================
    // Units
    // ========================================================================

    async listUnits() {
        return this._fetch('/units');
    },

    async getUnit(code) {
        return this._fetch(`/units/${code}`);
    },

    async updateUnit(code, data) {
        return this._fetch(`/units/${code}`, 'PATCH', data);
    },

    // ========================================================================
    // Visibility Rules
    // ========================================================================

    async getVisibilityRules(unitCode) {
        return this._fetch(`/units/${unitCode}/visibility`);
    },

    async addVisibilityRule(unitCode, rule) {
        return this._fetch(`/units/${unitCode}/visibility`, 'POST', rule);
    },

    async deleteVisibilityRule(unitCode, ruleId) {
        return this._fetch(`/units/${unitCode}/visibility/${ruleId}`, 'DELETE');
    },

    // ========================================================================
    // Files
    // ========================================================================

    async listBaseContent() {
        return this._fetch('/files/base');
    },

    async listUnitFiles(unitCode) {
        return this._fetch(`/files/units/${unitCode}`);
    },

    async uploadFile(unitCode, file, path = '') {
        const formData = new FormData();
        formData.append('file', file);
        if (path) formData.append('path', path);

        const response = await fetch(`${this.baseUrl}/files/units/${unitCode}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Upload failed');
        }
        return response.json();
    },

    async deleteFile(unitCode, path) {
        return this._fetch(`/files/units/${unitCode}/${path}`, 'DELETE');
    },

    // ========================================================================
    // Access Config (for frontend)
    // ========================================================================

    async getAccessConfig(unitCode, password = null) {
        const url = password
            ? `/access/${unitCode}?password=${encodeURIComponent(password)}`
            : `/access/${unitCode}`;

        const response = await fetch(`${this.baseUrl}${url}`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Access denied');
        }
        return response.json();
    },

    async getUnitPhase(unitCode) {
        const response = await fetch(`${this.baseUrl}/access/${unitCode}/phase`);
        return response.json();
    },

    // ========================================================================
    // Admin: Lecturers
    // ========================================================================

    async listLecturers() {
        return this._fetch('/lecturers');
    },

    async createLecturer(data) {
        return this._fetch('/lecturers', 'POST', data);
    },

    async updateLecturer(id, data) {
        return this._fetch(`/lecturers/${id}`, 'PATCH', data);
    },

    async deleteLecturer(id) {
        return this._fetch(`/lecturers/${id}`, 'DELETE');
    },

    // ========================================================================
    // Admin: Git Operations
    // ========================================================================

    async gitStatus() {
        return this._fetch('/git/status');
    },

    async gitHistory(limit = 20) {
        return this._fetch(`/git/history?limit=${limit}`);
    },

    async gitCommitAndPush(message) {
        return this._fetch('/git/commit-and-push', 'POST', { message });
    },

    // ========================================================================
    // Internal
    // ========================================================================

    async _fetch(path, method = 'GET', body = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (this.token) {
            options.headers['Authorization'] = `Bearer ${this.token}`;
        }

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${this.baseUrl}${path}`, options);

        if (response.status === 401) {
            this.logout();
            window.location.href = 'login.html';
            throw new Error('Session expired');
        }

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.detail || `Request failed: ${response.status}`);
        }

        // Handle empty responses
        const text = await response.text();
        return text ? JSON.parse(text) : {};
    }
};

// Initialize on load
CloudCoreAPI.init();
