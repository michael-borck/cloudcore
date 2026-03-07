# CloudCore Lecturer Dashboard

Web-based dashboard for lecturers to manage their unit's content and access settings. Connects to cloudcore-api for backend operations.

## Setup

The dashboard requires cloudcore-api to be running. Configure the API URL in `cloudcore-api.js`:

```javascript
baseUrl: window.location.hostname === 'localhost'
    ? 'http://localhost:8001'
    : 'https://cloudcore-api.eduserver.au',
```

## Files

| File | Purpose |
|------|---------|
| `index.html` | Landing page with login link |
| `login.html` | Authentication (email/password) |
| `dashboard.html` | Main management interface |
| `dashboard.js` | Dashboard logic |
| `cloudcore-api.js` | API client library |

## Features

### For All Lecturers
- **Unit Settings**: Update name, password, access dates
- **Visibility Rules**: Control which content is visible to students
- **File Uploads**: Upload unit-specific materials
- **Password Reset**: Self-service via email

### For Admins
- View all lecturers and their unit assignments
- Git status and commit history
- Manage all units

## Access Modes

| Mode | Description |
|------|-------------|
| `time-based` | Content unlocks at consultant/auditor dates |
| `scenario-based` | Only allowed content visible, ignores dates |
| `combined` | Time release AND allow/deny lists |

## Visibility Rules

Path patterns control what students can access:

```
/docs/policies/*           - All files in policies folder
/chatbots/bots/karen_lee/* - Specific employee folder
/docs/interviews.qmd       - Exact file
```

Rules can be:
- **Allow** - Explicitly grant access
- **Deny** - Explicitly block access
- Scoped to **consultant** or **auditor** access level

## Authentication

- JWT tokens stored in sessionStorage
- 24-hour token expiry
- Password reset via email codes
- Rate-limited login (5 attempts/minute)

## Development

Run cloudcore-api locally:
```bash
cd /path/to/cloudcore-api
python -m src.server
```

Then open `index.html` in a browser.
