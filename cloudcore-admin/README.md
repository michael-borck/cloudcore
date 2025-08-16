# CloudCore Admin Tools

This directory contains administrative tools for managing the CloudCore access control system.

## Quick Start

### 1. Configure Unit Access
Open `access-manager.html` in your browser to:
- Select a unit from the dropdown
- Configure scenario settings
- Add/remove allowed and denied resources
- Export configuration for deployment

### 2. Test Configuration
Open `test-access.html` in your browser to:
- Test access rules for different units
- Simulate different access levels and dates
- Validate configuration before deployment

## Files in This Directory

| File | Purpose | When to Use |
|------|---------|-------------|
| `access-manager.html` | Visual configuration editor | Setting up unit scenarios |
| `test-access.html` | Access rule testing tool | Validating configurations |
| `README.md` | This documentation | Reference and help |

## Quick Reference

### Access Modes
- **time-based**: Traditional time-release system
- **scenario-based**: Only allowed content, ignores time
- **combined**: Time-release + allowed/denied lists

### Path Patterns
- `/docs/policies/*` - All files in policies folder
- `/chatbots/bots/karen_lee/*` - Specific employee folder
- `/docs/interviews.qmd` - Exact file

### Typical Workflow
1. Open access-manager.html
2. Select unit to configure
3. Set scenario name and description
4. Choose access mode
5. Add allowed/denied resources
6. Export configuration
7. Test with test-access.html
8. Deploy to /config/unit-access.json

## Common Scenarios

### Security Audit Unit
- Mode: scenario-based
- Allowed: Security policies, logs, security staff interviews
- Denied: HR content, non-security staff

### Business Analysis Unit  
- Mode: combined
- Allowed: Business policies, management interviews
- Denied: Technical logs, security details
- Time-release: Interviews unlock week 3

### Traditional Unit
- Mode: time-based
- No custom restrictions
- Uses existing consultant/auditor dates

## Troubleshooting

### Configuration Not Loading
1. Check JSON syntax
2. Verify file is at `/config/unit-access.json`
3. Check browser console for errors

### Access Not Working as Expected
1. Use test-access.html to debug
2. Check path patterns match exactly
3. Verify access mode is correct

### Need Help?
- Review ENHANCED-ACCESS-SYSTEM.md for full documentation
- Use browser console for debug information
- Test with legacy fallback if needed

## Security Notes

⚠️ **Important Security Considerations:**

1. **Admin tools are client-side only** - no server authentication
2. **Configuration files contain passwords** - manage access carefully  
3. **Test thoroughly** before deploying to production
4. **Keep backups** of working configurations

## Quick Tips

💡 **Pro Tips:**

- Use the site tree in access-manager to click-add resources
- Test with different dates to validate time-specific rules
- Export configurations with descriptive filenames
- Use scenario descriptions to document the intent
- Test edge cases (exactly on date boundaries)

---

*Tools developed for CloudCore educational platform*