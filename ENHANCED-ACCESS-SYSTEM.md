# CloudCore Enhanced Access Control System

## Overview

The CloudCore site now features an enhanced multi-unit access control system that supports:
- **Time-based access** (traditional consultant/auditor progression)
- **Scenario-based access** (custom allowed/denied lists)
- **Combined access** (time-based + scenario restrictions)
- **Management interface** for easy configuration
- **Testing tools** for validation

## System Architecture

### Core Components

1. **Configuration System** (`/config/unit-access.json`)
   - JSON-based configuration with schema validation
   - Per-unit access rules and scenarios
   - Backwards compatible with existing system

2. **Enhanced Access Script** (`/scripts/simple-timeline-access.js`)
   - Async configuration loading
   - Path pattern matching with wildcards
   - Resource-level access control
   - Fallback to legacy behavior

3. **Management Interface** (`/admin/access-manager.html`)
   - Visual configuration editor
   - Site structure tree view
   - Export/import functionality
   - Real-time preview

4. **Testing Interface** (`/admin/test-access.html`)
   - Configuration validation
   - Access rule testing
   - Different scenario simulation
   - Debug information

## Access Modes

### 1. Time-Based Mode
**When to use:** Traditional semester progression with consultant/auditor levels

**Behavior:**
- Content unlocks based on consultant/auditor dates
- Uses existing time-release mechanism
- No additional restrictions

**Configuration:**
```json
{
  "mode": "time-based",
  "customRules": {
    "allowed": [],
    "denied": [],
    "timeSpecific": []
  }
}
```

### 2. Scenario-Based Mode
**When to use:** Specific learning scenarios with curated content

**Behavior:**
- Immediate access to allowed content only
- Ignores time-release dates
- Perfect for focused assignments

**Configuration:**
```json
{
  "mode": "scenario-based",
  "customRules": {
    "allowed": [
      "/docs/policies/*",
      "/chatbots/bots/david_wilson/*"
    ],
    "denied": [
      "/docs/logs/*",
      "/chatbots/bots/karen_lee/*"
    ]
  }
}
```

### 3. Combined Mode
**When to use:** Time progression with scenario restrictions

**Behavior:**
- Time-release applies to allowed content
- Denied content is always blocked
- Maximum flexibility

**Configuration:**
```json
{
  "mode": "combined",
  "customRules": {
    "allowed": ["/docs/policies/*"],
    "denied": ["/docs/logs/*"],
    "timeSpecific": [
      {
        "path": "/docs/special-report.qmd",
        "availableFrom": "2025-08-15T00:00:00Z",
        "availableUntil": "2025-08-25T00:00:00Z",
        "level": "consultant"
      }
    ]
  }
}
```

## Configuration Management

### Using the Management Interface

1. **Access the Manager:**
   - Open `/admin/access-manager.html` in your browser
   - No authentication required (local tool)

2. **Select a Unit:**
   - Choose unit from dropdown
   - View current configuration
   - See unit schedule and passwords

3. **Configure Scenario:**
   - Set scenario name and description
   - Choose access mode (time-based/scenario-based/combined)

4. **Manage Resources:**
   - Add/remove allowed resources
   - Add/remove denied resources
   - Use site tree for easy selection

5. **Export Configuration:**
   - Click "Save Changes" or "Export Config"
   - Download updated JSON file
   - Upload to replace `/config/unit-access.json`

### Path Patterns

The system supports glob-style patterns:

| Pattern | Matches | Example |
|---------|---------|---------|
| `/docs/policies/*` | All files in policies folder | `/docs/policies/hr.md` |
| `/chatbots/bots/*/` | All bot folders | `/chatbots/bots/david_wilson/` |
| `/docs/*.qmd` | All QMD files in docs | `/docs/interviews.qmd` |
| `/specific/file.md` | Exact file match | `/specific/file.md` only |

### Resource Precedence

Access decisions follow this priority order:

1. **Time-specific rules** (if applicable and in date range)
2. **Denied list** (always blocks access)
3. **Allowed list** (scenario-based and combined modes)
4. **Default behavior** (time-based progression)

## Unit Configuration Examples

### Example 1: Security Audit Focus (Scenario-Based)

```json
"ISYS6018": {
  "name": "Information Security Audit and Control",
  "password": "SecurityAudit2025",
  "accessRules": {
    "mode": "scenario-based",
    "scenarioConfig": {
      "name": "Security Audit Focus",
      "description": "Focused on security policies and audit evidence"
    },
    "customRules": {
      "allowed": [
        "/docs/policies/*",
        "/docs/logs.qmd",
        "/chatbots/bots/karen_lee/*",
        "/chatbots/bots/samuel_torres/*",
        "/docs/support/network_logical.qmd"
      ],
      "denied": [
        "/docs/interviews.qmd",
        "/chatbots/bots/michael_thompson/*"
      ]
    }
  }
}
```

### Example 2: Business Analysis (Combined Mode)

```json
"ISAD5001": {
  "name": "Information Systems Analysis and Design",
  "password": "BusinessAnalysis2025",
  "accessRules": {
    "mode": "combined",
    "scenarioConfig": {
      "name": "Business Analysis Scenario",
      "description": "Business-focused with time progression"
    },
    "customRules": {
      "allowed": [
        "/docs/policies/*",
        "/docs/support/org_chart.qmd",
        "/chatbots/bots/michael_thompson/*",
        "/chatbots/bots/sophia_martines/*"
      ],
      "denied": [
        "/docs/logs/*",
        "/docs/support/network_logical.qmd"
      ],
      "timeSpecific": [
        {
          "path": "/docs/interviews.qmd",
          "availableFrom": "2025-08-10T00:00:00Z",
          "availableUntil": "2025-09-20T00:00:00Z",
          "level": "consultant"
        }
      ]
    }
  }
}
```

### Example 3: Traditional Time-Based

```json
"ISYS2002": {
  "name": "Systems Analysis and Design",
  "password": "SystemsAnalysis2025",
  "accessRules": {
    "mode": "time-based",
    "scenarioConfig": {
      "name": "Standard Progression",
      "description": "Traditional consultant/auditor progression"
    },
    "customRules": {
      "allowed": [],
      "denied": [],
      "timeSpecific": []
    }
  }
}
```

## Testing and Validation

### Using the Test Interface

1. **Access the Tester:**
   - Open `/admin/test-access.html`
   - Load automatically detects configuration

2. **Run Tests:**
   - Select unit and access level
   - Choose test date (optional)
   - Click "Run Access Tests" or use quick test buttons

3. **Interpret Results:**
   - Green = Allowed access
   - Red = Denied access
   - Hover for reason/rule that applied

4. **Validate Configuration:**
   - Test different access levels
   - Verify time-specific rules
   - Check pattern matching

### Debug Mode

Add `?debug=true` to any page URL to enable debug logging:

```javascript
// Browser console commands
debugAccessConfig();  // Show current configuration
localStorage.clear(); // Reset authentication
```

## Deployment Process

### 1. Development and Testing

1. **Configure units** using `/admin/access-manager.html`
2. **Test configuration** using `/admin/test-access.html`
3. **Export configuration** as JSON file

### 2. Production Deployment

1. **Upload configuration:**
   ```bash
   # Replace the configuration file
   cp new-unit-access.json config/unit-access.json
   ```

2. **Deploy to GitHub Pages:**
   ```bash
   git add config/unit-access.json
   git commit -m "Update unit access configuration"
   git push origin main
   ```

3. **Verify deployment:**
   - Check access with different unit passwords
   - Test resource availability
   - Confirm scenarios work as expected

### 3. Semester Updates

1. **Update passwords and dates** in configuration
2. **Modify scenarios** as needed for new assignments
3. **Test thoroughly** before semester start
4. **Deploy and communicate** changes to students

## Migration from Legacy System

### Automatic Fallback

The enhanced system provides automatic fallback:
- If JSON config fails to load, uses legacy schedules
- Existing passwords continue to work
- Time-based progression remains unchanged

### Migration Steps

1. **Keep existing system** running during transition
2. **Create JSON configuration** matching current setup
3. **Test thoroughly** with existing passwords
4. **Deploy gradually** (one unit at a time if desired)
5. **Monitor for issues** and maintain legacy fallback

## Troubleshooting

### Common Issues

**Configuration Not Loading:**
- Check JSON syntax with online validator
- Verify file path `/config/unit-access.json`
- Check browser console for errors

**Resources Not Showing/Hiding:**
- Verify path patterns match exactly
- Check access mode (scenario vs time-based)
- Test with access tester tool

**Time-Specific Rules Not Working:**
- Verify date format (ISO 8601)
- Check timezone considerations
- Ensure level requirements are met

### Debug Information

```javascript
// Browser console debugging
console.log('Access Config:', window.ACCESS_CONFIG);
console.log('Unit Schedules:', window.UNIT_SCHEDULES);
window.debugAccessConfig(); // Detailed debug info
```

### Support

For technical issues:
1. **Check configuration** with test interface
2. **Review browser console** for errors
3. **Verify JSON syntax** with validator
4. **Test with legacy fallback** if needed

## Future Enhancements

### Planned Features

1. **Dynamic Site Discovery:**
   - Automatic detection of site resources
   - Real-time site structure updates

2. **Advanced Time Rules:**
   - Recurring availability windows
   - Dependency-based unlocking

3. **Analytics Integration:**
   - Access tracking and reporting
   - Usage pattern analysis

4. **API Integration:**
   - CMS connectivity
   - Automated configuration updates

### Contributing

The system is designed for extensibility:
- JSON schema allows for new fields
- JavaScript modules can be extended
- Additional access modes can be added
- Custom validation rules supported

---

*For questions or support, refer to the main CloudCore documentation or contact the system administrator.*