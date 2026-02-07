/**
 * CloudCore Lecturer Dashboard
 * Uses cloudcore-api for all backend operations
 */

// Global state
let currentUser = null;
let currentUnit = null;
let units = [];

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async function() {
    await checkAuthentication();
    await loadDashboardData();
    setupEventListeners();
});

// ============================================================================
// Authentication
// ============================================================================

async function checkAuthentication() {
    const session = CloudCoreAPI.init();

    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    currentUser = session.lecturer;

    // Update UI with user info
    document.getElementById('userBadge').textContent =
        `${currentUser.name} (${currentUser.is_admin ? 'Admin' : 'Lecturer'})`;

    // Show/hide admin-only elements
    if (currentUser.is_admin) {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'block');
    }
}

function logout() {
    CloudCoreAPI.logout();
    window.location.href = 'login.html';
}

// ============================================================================
// Dashboard Data Loading
// ============================================================================

async function loadDashboardData() {
    try {
        showLoading(true);

        // Load units
        units = await CloudCoreAPI.listUnits();

        // Populate unit selector
        const unitSelect = document.getElementById('unitSelect');
        unitSelect.innerHTML = '<option value="">Select a unit...</option>';

        units.forEach(unit => {
            const option = document.createElement('option');
            option.value = unit.code;
            option.textContent = `${unit.code} - ${unit.name}`;
            unitSelect.appendChild(option);
        });

        // If user has only one unit, select it automatically
        if (units.length === 1) {
            unitSelect.value = units[0].code;
            await selectUnit(units[0].code);
        }

        showLoading(false);

    } catch (error) {
        showError('Failed to load dashboard data: ' + error.message);
        showLoading(false);
    }
}

async function selectUnit(unitCode) {
    if (!unitCode) {
        currentUnit = null;
        document.getElementById('unitDetails').style.display = 'none';
        return;
    }

    try {
        showLoading(true);

        currentUnit = await CloudCoreAPI.getUnit(unitCode);

        // Show unit details section
        document.getElementById('unitDetails').style.display = 'block';

        // Populate unit info
        document.getElementById('unitCode').textContent = currentUnit.code;
        document.getElementById('unitName').value = currentUnit.name || '';
        document.getElementById('unitPassword').value = currentUnit.password || '';
        document.getElementById('consultantDate').value = currentUnit.consultant_date?.split('T')[0] || '';
        document.getElementById('auditorDate').value = currentUnit.auditor_date?.split('T')[0] || '';
        document.getElementById('accessMode').value = currentUnit.access_mode || 'time-based';

        // Load visibility rules
        await loadVisibilityRules();

        // Load unit files
        await loadUnitFiles();

        showLoading(false);

    } catch (error) {
        showError('Failed to load unit: ' + error.message);
        showLoading(false);
    }
}

// ============================================================================
// Unit Settings
// ============================================================================

async function saveUnitSettings() {
    if (!currentUnit) return;

    const data = {
        name: document.getElementById('unitName').value,
        password: document.getElementById('unitPassword').value,
        consultant_date: document.getElementById('consultantDate').value || null,
        auditor_date: document.getElementById('auditorDate').value || null,
        access_mode: document.getElementById('accessMode').value
    };

    try {
        showLoading(true);
        await CloudCoreAPI.updateUnit(currentUnit.code, data);
        showSuccess('Unit settings saved');
        showLoading(false);
    } catch (error) {
        showError('Failed to save: ' + error.message);
        showLoading(false);
    }
}

// ============================================================================
// Visibility Rules
// ============================================================================

async function loadVisibilityRules() {
    if (!currentUnit) return;

    try {
        const rules = await CloudCoreAPI.getVisibilityRules(currentUnit.code);

        const rulesContainer = document.getElementById('visibilityRules');
        rulesContainer.innerHTML = '';

        if (rules.length === 0) {
            rulesContainer.innerHTML = '<p class="no-data">No visibility rules configured. All content follows default access.</p>';
            return;
        }

        rules.forEach(rule => {
            const ruleEl = document.createElement('div');
            ruleEl.className = `rule-item ${rule.is_visible ? 'allow' : 'deny'}`;
            ruleEl.innerHTML = `
                <div class="rule-info">
                    <span class="rule-pattern">${escapeHtml(rule.path_pattern)}</span>
                    <span class="rule-type">${rule.is_visible ? 'ALLOW' : 'DENY'}</span>
                    ${rule.access_level ? `<span class="rule-level">${rule.access_level}</span>` : ''}
                    ${rule.available_from ? `<span class="rule-date">From: ${rule.available_from.split('T')[0]}</span>` : ''}
                </div>
                <button class="btn-delete" onclick="deleteVisibilityRule(${rule.id})">Delete</button>
            `;
            rulesContainer.appendChild(ruleEl);
        });

    } catch (error) {
        showError('Failed to load visibility rules: ' + error.message);
    }
}

async function addVisibilityRule() {
    if (!currentUnit) return;

    const pattern = document.getElementById('newRulePattern').value.trim();
    const isVisible = document.getElementById('newRuleType').value === 'allow';
    const accessLevel = document.getElementById('newRuleLevel').value || null;

    if (!pattern) {
        showError('Please enter a path pattern');
        return;
    }

    try {
        showLoading(true);

        await CloudCoreAPI.addVisibilityRule(currentUnit.code, {
            path_pattern: pattern,
            is_visible: isVisible,
            access_level: accessLevel
        });

        // Clear form
        document.getElementById('newRulePattern').value = '';
        document.getElementById('newRuleType').value = 'allow';
        document.getElementById('newRuleLevel').value = '';

        // Reload rules
        await loadVisibilityRules();

        showSuccess('Rule added');
        showLoading(false);

    } catch (error) {
        showError('Failed to add rule: ' + error.message);
        showLoading(false);
    }
}

async function deleteVisibilityRule(ruleId) {
    if (!currentUnit) return;

    if (!confirm('Delete this visibility rule?')) return;

    try {
        showLoading(true);
        await CloudCoreAPI.deleteVisibilityRule(currentUnit.code, ruleId);
        await loadVisibilityRules();
        showSuccess('Rule deleted');
        showLoading(false);
    } catch (error) {
        showError('Failed to delete rule: ' + error.message);
        showLoading(false);
    }
}

// ============================================================================
// File Management
// ============================================================================

async function loadUnitFiles() {
    if (!currentUnit) return;

    try {
        const response = await CloudCoreAPI.listUnitFiles(currentUnit.code);

        const filesContainer = document.getElementById('unitFiles');
        filesContainer.innerHTML = '';

        if (!response.files || response.files.length === 0) {
            filesContainer.innerHTML = '<p class="no-data">No files uploaded for this unit.</p>';
            return;
        }

        response.files.forEach(file => {
            const fileEl = document.createElement('div');
            fileEl.className = 'file-item';
            fileEl.innerHTML = `
                <div class="file-info">
                    <span class="file-name">${escapeHtml(file.name)}</span>
                    <span class="file-size">${formatFileSize(file.size)}</span>
                </div>
                <button class="btn-delete" onclick="deleteFile('${escapeHtml(file.path)}')">Delete</button>
            `;
            filesContainer.appendChild(fileEl);
        });

    } catch (error) {
        showError('Failed to load files: ' + error.message);
    }
}

async function uploadFile() {
    if (!currentUnit) return;

    const fileInput = document.getElementById('fileUpload');
    const file = fileInput.files[0];

    if (!file) {
        showError('Please select a file');
        return;
    }

    try {
        showLoading(true);
        await CloudCoreAPI.uploadFile(currentUnit.code, file);

        // Clear input and reload
        fileInput.value = '';
        await loadUnitFiles();

        showSuccess('File uploaded');
        showLoading(false);

    } catch (error) {
        showError('Failed to upload: ' + error.message);
        showLoading(false);
    }
}

async function deleteFile(path) {
    if (!currentUnit) return;

    if (!confirm('Delete this file?')) return;

    try {
        showLoading(true);

        // Extract just the filename from the full path
        const filename = path.split('/').pop();
        await CloudCoreAPI.deleteFile(currentUnit.code, filename);

        await loadUnitFiles();
        showSuccess('File deleted');
        showLoading(false);

    } catch (error) {
        showError('Failed to delete: ' + error.message);
        showLoading(false);
    }
}

// ============================================================================
// Admin Functions
// ============================================================================

async function showLecturers() {
    if (!currentUser.is_admin) return;

    try {
        const lecturers = await CloudCoreAPI.listLecturers();

        let html = '<h3>Lecturers</h3><table class="data-table"><thead><tr><th>Name</th><th>Email</th><th>Admin</th><th>Units</th></tr></thead><tbody>';

        lecturers.forEach(l => {
            html += `<tr>
                <td>${escapeHtml(l.name)}</td>
                <td>${escapeHtml(l.email)}</td>
                <td>${l.is_admin ? 'Yes' : 'No'}</td>
                <td>${l.units.join(', ') || '-'}</td>
            </tr>`;
        });

        html += '</tbody></table>';

        document.getElementById('adminContent').innerHTML = html;
        document.getElementById('adminModal').style.display = 'block';

    } catch (error) {
        showError('Failed to load lecturers: ' + error.message);
    }
}

async function showGitStatus() {
    if (!currentUser.is_admin) return;

    try {
        const status = await CloudCoreAPI.gitStatus();
        const history = await CloudCoreAPI.gitHistory(10);

        let html = '<h3>Git Status</h3>';
        html += `<p><strong>Branch:</strong> ${status.current_branch}</p>`;
        html += `<p><strong>Clean:</strong> ${status.clean ? 'Yes' : 'No'}</p>`;

        if (!status.clean) {
            html += '<p><strong>Changes:</strong></p><ul>';
            status.modified.forEach(f => html += `<li>Modified: ${escapeHtml(f)}</li>`);
            status.staged.forEach(f => html += `<li>Staged: ${escapeHtml(f)}</li>`);
            status.untracked.forEach(f => html += `<li>Untracked: ${escapeHtml(f)}</li>`);
            html += '</ul>';
        }

        html += '<h4>Recent Commits</h4><ul>';
        history.forEach(c => {
            html += `<li><code>${c.sha}</code> - ${escapeHtml(c.message)} (${c.author})</li>`;
        });
        html += '</ul>';

        document.getElementById('adminContent').innerHTML = html;
        document.getElementById('adminModal').style.display = 'block';

    } catch (error) {
        showError('Failed to load git status: ' + error.message);
    }
}

function closeAdminModal() {
    document.getElementById('adminModal').style.display = 'none';
}

// ============================================================================
// Event Listeners
// ============================================================================

function setupEventListeners() {
    // Unit selector
    document.getElementById('unitSelect').addEventListener('change', (e) => {
        selectUnit(e.target.value);
    });

    // Close modal on outside click
    document.getElementById('adminModal').addEventListener('click', (e) => {
        if (e.target.id === 'adminModal') {
            closeAdminModal();
        }
    });
}

// ============================================================================
// UI Helpers
// ============================================================================

function showLoading(show) {
    document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
}

function showError(message) {
    const toast = document.getElementById('toast');
    toast.className = 'toast error';
    toast.textContent = message;
    toast.style.display = 'block';

    setTimeout(() => {
        toast.style.display = 'none';
    }, 5000);
}

function showSuccess(message) {
    const toast = document.getElementById('toast');
    toast.className = 'toast success';
    toast.textContent = message;
    toast.style.display = 'block';

    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatFileSize(bytes) {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
