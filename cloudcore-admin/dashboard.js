// CloudCore UC Dashboard JavaScript

// Global state
let authData = null;
let currentConfig = null;
let quillEditor = null;
let currentEditingFile = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    initializeEditor();
    loadDashboardData();
});

// Authentication and initialization
function checkAuthentication() {
    const auth = sessionStorage.getItem('ucAuth');
    if (!auth) {
        window.location.href = '/login.html';
        return;
    }

    try {
        authData = JSON.parse(auth);
        const loginAge = Date.now() - authData.loginTime;
        const sessionTimeout = 8 * 60 * 60 * 1000; // 8 hours

        if (loginAge > sessionTimeout) {
            sessionStorage.removeItem('ucAuth');
            window.location.href = '/login.html';
            return;
        }

        // Update user badge
        document.getElementById('userBadge').textContent = 
            `${authData.name} (${authData.role === 'admin' ? 'Admin' : authData.unit})`;
        
        // Update unit name in access control
        if (authData.unit) {
            document.getElementById('unitName').textContent = authData.unit;
        }

    } catch (error) {
        sessionStorage.removeItem('ucAuth');
        window.location.href = '/login.html';
    }
}

function logout() {
    sessionStorage.removeItem('ucAuth');
    window.location.href = '/login.html';
}

// Initialize Quill editor
function initializeEditor() {
    quillEditor = new Quill('#editor', {
        theme: 'snow',
        modules: {
            toolbar: [
                ['bold', 'italic', 'underline', 'strike'],
                ['blockquote', 'code-block'],
                [{ 'header': 1 }, { 'header': 2 }],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['link', 'image'],
                ['clean']
            ]
        }
    });
}

// Navigation
function showSection(sectionName) {
    // Remove active class from all nav items and sections
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));

    // Add active class to selected nav item and section
    event.target.classList.add('active');
    document.getElementById(sectionName).classList.add('active');

    // Load section-specific data
    switch(sectionName) {
        case 'overview':
            loadOverviewData();
            break;
        case 'content':
            loadContentFiles();
            break;
        case 'access':
            loadAccessConfig();
            break;
        case 'files':
            loadFileExplorer();
            break;
        case 'settings':
            loadUnitSettings();
            break;
    }
}

// Load dashboard data
async function loadDashboardData() {
    await loadAccessConfig();
    await loadOverviewData();
}

async function refreshData() {
    showMessage('Refreshing data...', 'info');
    await loadDashboardData();
    showMessage('Data refreshed successfully!', 'success');
}

// Overview section
async function loadOverviewData() {
    try {
        // Load file count
        const files = await githubAPI('list', '');
        document.getElementById('totalFiles').textContent = files.files ? files.files.length : '0';

        // Load access config stats
        if (currentConfig && authData.unit) {
            const unitConfig = currentConfig.units[authData.unit];
            if (unitConfig) {
                document.getElementById('allowedResources').textContent = 
                    unitConfig.accessRules.customRules.allowed.length;
                document.getElementById('deniedResources').textContent = 
                    unitConfig.accessRules.customRules.denied.length;
            }
        }

        // Show last update time
        document.getElementById('lastUpdate').textContent = new Date().toLocaleDateString();

    } catch (error) {
        console.error('Error loading overview:', error);
        showMessage('Error loading overview data', 'error');
    }
}

// Content management
async function loadContentFiles() {
    const container = document.getElementById('contentList');
    container.innerHTML = '<div class="loading">Loading content files...</div>';

    try {
        const response = await githubAPI('list', 'docs');
        const files = response.files || [];

        if (files.length === 0) {
            container.innerHTML = '<div class="info">No content files found. Create your first content file!</div>';
            return;
        }

        let html = '';
        files.forEach(file => {
            if (file.type === 'file' && (file.name.endsWith('.qmd') || file.name.endsWith('.md'))) {
                html += `
                    <div class="file-item">
                        <div class="file-info">
                            <div class="file-icon">📄</div>
                            <div class="file-details">
                                <h4>${file.name}</h4>
                                <div class="file-meta">Modified: ${new Date().toLocaleDateString()}</div>
                            </div>
                        </div>
                        <div class="file-actions">
                            <button class="btn btn-primary" onclick="editFile('${file.path}')">Edit</button>
                            <button class="btn btn-danger" onclick="deleteFile('${file.path}')">Delete</button>
                        </div>
                    </div>
                `;
            }
        });

        container.innerHTML = html || '<div class="info">No content files found.</div>';

    } catch (error) {
        console.error('Error loading content files:', error);
        container.innerHTML = '<div class="error">Error loading content files</div>';
    }
}

// Access control
async function loadAccessConfig() {
    try {
        const response = await githubAPI('read', 'config/unit-access.json');
        currentConfig = JSON.parse(response.content);

        if (authData.unit && currentConfig.units[authData.unit]) {
            const unitConfig = currentConfig.units[authData.unit];
            renderResourceList('allowed', unitConfig.accessRules.customRules.allowed);
            renderResourceList('denied', unitConfig.accessRules.customRules.denied);
        }

    } catch (error) {
        console.error('Error loading access config:', error);
        showMessage('Error loading access configuration', 'error');
    }
}

function renderResourceList(type, resources) {
    const container = document.getElementById(type + 'List');
    container.innerHTML = '';

    resources.forEach((resource, index) => {
        const div = document.createElement('div');
        div.className = `resource-item ${type}`;
        div.innerHTML = `
            <span>${resource}</span>
            <button class="btn btn-danger" style="padding: 4px 8px; font-size: 12px;" 
                    onclick="removeResource('${type}', ${index})">×</button>
        `;
        container.appendChild(div);
    });
}

function addResource(type) {
    const input = document.getElementById(type + 'Input');
    const path = input.value.trim();

    if (!path) {
        showMessage('Please enter a resource path', 'error');
        return;
    }

    if (!authData.unit || !currentConfig.units[authData.unit]) {
        showMessage('Unit configuration not found', 'error');
        return;
    }

    const unitConfig = currentConfig.units[authData.unit];
    const list = unitConfig.accessRules.customRules[type];

    if (list.includes(path)) {
        showMessage('Resource already in list', 'error');
        return;
    }

    list.push(path);
    renderResourceList(type, list);
    input.value = '';
    
    showMessage(`Added to ${type} list: ${path}`, 'success');
}

function removeResource(type, index) {
    if (!authData.unit || !currentConfig.units[authData.unit]) return;

    const unitConfig = currentConfig.units[authData.unit];
    const list = unitConfig.accessRules.customRules[type];
    const removed = list.splice(index, 1)[0];
    
    renderResourceList(type, list);
    showMessage(`Removed from ${type} list: ${removed}`, 'success');
}

async function saveAccessConfig() {
    if (!currentConfig) {
        showMessage('No configuration to save', 'error');
        return;
    }

    try {
        // Update timestamp
        currentConfig.lastUpdated = new Date().toISOString();

        const response = await githubAPI('write', 'config/unit-access.json', 
            JSON.stringify(currentConfig, null, 2), 
            `Update access configuration for ${authData.unit}`);

        if (response.success) {
            showMessage('Access configuration saved successfully!', 'success');
        } else {
            showMessage('Error saving configuration', 'error');
        }

    } catch (error) {
        console.error('Error saving access config:', error);
        showMessage('Error saving access configuration', 'error');
    }
}

// File manager
async function loadFileExplorer() {
    const container = document.getElementById('fileExplorer');
    container.innerHTML = '<div class="loading">Loading file structure...</div>';

    try {
        const response = await githubAPI('list', '');
        const files = response.files || [];

        let html = '<div class="file-list">';
        files.forEach(file => {
            const icon = file.type === 'dir' ? '📁' : '📄';
            html += `
                <div class="file-item">
                    <div class="file-info">
                        <div class="file-icon">${icon}</div>
                        <div class="file-details">
                            <h4>${file.name}</h4>
                            <div class="file-meta">${file.type} - ${file.size || 0} bytes</div>
                        </div>
                    </div>
                    <div class="file-actions">
                        ${file.type === 'file' ? `
                            <button class="btn btn-primary" onclick="editFile('${file.path}')">Edit</button>
                            <button class="btn btn-danger" onclick="deleteFile('${file.path}')">Delete</button>
                        ` : `
                            <button class="btn btn-secondary" onclick="exploreFolder('${file.path}')">Open</button>
                        `}
                    </div>
                </div>
            `;
        });
        html += '</div>';

        container.innerHTML = html;

    } catch (error) {
        console.error('Error loading file explorer:', error);
        container.innerHTML = '<div class="error">Error loading files</div>';
    }
}

// Unit settings
function loadUnitSettings() {
    if (!authData.unit || !currentConfig.units[authData.unit]) return;

    const unitConfig = currentConfig.units[authData.unit];
    document.getElementById('scenarioName').value = 
        unitConfig.accessRules.scenarioConfig.name || '';
    document.getElementById('scenarioDescription').value = 
        unitConfig.accessRules.scenarioConfig.description || '';
    document.getElementById('accessMode').value = 
        unitConfig.accessRules.mode || 'time-based';
}

async function saveUnitSettings() {
    if (!authData.unit || !currentConfig.units[authData.unit]) {
        showMessage('Unit configuration not found', 'error');
        return;
    }

    const unitConfig = currentConfig.units[authData.unit];
    unitConfig.accessRules.scenarioConfig.name = document.getElementById('scenarioName').value;
    unitConfig.accessRules.scenarioConfig.description = document.getElementById('scenarioDescription').value;
    unitConfig.accessRules.mode = document.getElementById('accessMode').value;

    await saveAccessConfig();
}

// Content editor
function openEditor(mode, filePath = null) {
    currentEditingFile = filePath;
    
    if (mode === 'new') {
        document.getElementById('editorTitle').textContent = 'Create New Content';
        document.getElementById('fileName').value = '';
        quillEditor.setContents([]);
    } else if (mode === 'edit' && filePath) {
        document.getElementById('editorTitle').textContent = 'Edit Content';
        document.getElementById('fileName').value = filePath.split('/').pop();
        loadFileContent(filePath);
    }

    document.getElementById('editorModal').style.display = 'block';
}

async function loadFileContent(filePath) {
    try {
        const response = await githubAPI('read', filePath);
        // Convert markdown/qmd to delta format for Quill
        quillEditor.setText(response.content);
    } catch (error) {
        console.error('Error loading file:', error);
        showMessage('Error loading file content', 'error');
    }
}

function closeEditor() {
    document.getElementById('editorModal').style.display = 'none';
    currentEditingFile = null;
}

async function saveContent() {
    const fileName = document.getElementById('fileName').value.trim();
    const content = quillEditor.getText();

    if (!fileName || !content) {
        showMessage('Please provide file name and content', 'error');
        return;
    }

    // Determine file path
    let filePath = fileName.startsWith('/') ? fileName.substring(1) : fileName;
    if (currentEditingFile && currentEditingFile !== fileName) {
        filePath = currentEditingFile;
    } else if (!filePath.includes('/')) {
        filePath = 'docs/' + filePath;
    }

    try {
        const response = await githubAPI('write', filePath, content, 
            `${currentEditingFile ? 'Update' : 'Create'} ${filePath} via admin interface`);

        if (response.success) {
            showMessage('Content saved successfully!', 'success');
            closeEditor();
            // Refresh content list if we're on that section
            if (document.getElementById('content').classList.contains('active')) {
                loadContentFiles();
            }
        } else {
            showMessage('Error saving content', 'error');
        }

    } catch (error) {
        console.error('Error saving content:', error);
        showMessage('Error saving content', 'error');
    }
}

async function editFile(filePath) {
    openEditor('edit', filePath);
}

async function deleteFile(filePath) {
    if (!confirm(`Are you sure you want to delete ${filePath}?`)) {
        return;
    }

    try {
        const response = await githubAPI('delete', filePath, null, 
            `Delete ${filePath} via admin interface`);

        if (response.success) {
            showMessage('File deleted successfully!', 'success');
            // Refresh current view
            if (document.getElementById('content').classList.contains('active')) {
                loadContentFiles();
            } else if (document.getElementById('files').classList.contains('active')) {
                loadFileExplorer();
            }
        } else {
            showMessage('Error deleting file', 'error');
        }

    } catch (error) {
        console.error('Error deleting file:', error);
        showMessage('Error deleting file', 'error');
    }
}

// File upload
function openUploadModal() {
    document.getElementById('uploadModal').style.display = 'block';
}

function closeUploadModal() {
    document.getElementById('uploadModal').style.display = 'none';
    document.getElementById('fileUpload').value = '';
    document.getElementById('uploadPath').value = 'docs/';
}

async function uploadFiles() {
    const fileInput = document.getElementById('fileUpload');
    const uploadPath = document.getElementById('uploadPath').value.trim();
    const files = fileInput.files;

    if (!files.length) {
        showMessage('Please select files to upload', 'error');
        return;
    }

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filePath = `${uploadPath}${uploadPath.endsWith('/') ? '' : '/'}${file.name}`;

        try {
            const content = await readFileAsText(file);
            const response = await githubAPI('upload', filePath, content, 
                `Upload ${file.name} via admin interface`);

            if (response.success) {
                showMessage(`Uploaded ${file.name} successfully!`, 'success');
            } else {
                showMessage(`Error uploading ${file.name}`, 'error');
            }

        } catch (error) {
            console.error('Error uploading file:', error);
            showMessage(`Error uploading ${file.name}`, 'error');
        }
    }

    closeUploadModal();
    // Refresh file explorer if active
    if (document.getElementById('files').classList.contains('active')) {
        loadFileExplorer();
    }
}

function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

// GitHub API wrapper
async function githubAPI(operation, path, content = null, message = null) {
    try {
        const response = await fetch('/api/github-api', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authData.token}`
            },
            body: JSON.stringify({
                operation,
                path,
                content,
                message
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        return await response.json();

    } catch (error) {
        console.error('GitHub API error:', error);
        throw error;
    }
}

// Utility functions
function showMessage(message, type) {
    // Remove existing messages
    document.querySelectorAll('.error, .success, .info').forEach(el => {
        if (!el.closest('.content-section')) { // Don't remove static messages
            el.remove();
        }
    });

    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = type;
    messageDiv.textContent = message;
    
    // Insert at top of current section
    const activeSection = document.querySelector('.content-section.active');
    if (activeSection) {
        activeSection.insertBefore(messageDiv, activeSection.firstChild);
        
        // Auto-remove success messages
        if (type === 'success') {
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.remove();
                }
            }, 3000);
        }
    }
}

// Close modals when clicking outside
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
};