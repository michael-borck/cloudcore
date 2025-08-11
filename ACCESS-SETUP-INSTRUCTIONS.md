# CloudCore Multi-Unit Access System - Setup Instructions

## Overview
The CloudCore site now has a simple multi-unit timeline access system that provides different content access levels based on unit passwords and dates.

## Current Configuration

### Unit Passwords and Schedules

| Unit | Password | Consultant Access | Audit Access |
|------|----------|------------------|--------------|
| ISYS6018 - Security Audit | `SecurityAudit2025` | Week 2 (July 29, 2025) | Week 9 (Sept 16, 2025) |
| ISYS2001 - Systems Analysis | `SystemsAnalysis2025` | Week 3 (Aug 5, 2025) | Week 10 (Sept 23, 2025) |
| MGMT5000 - AI Strategy | `AIStrategy2025` | Week 4 (Aug 12, 2025) | Week 12 (Oct 7, 2025) |

## How It Works

1. **Students enter their unit password** when first accessing the site
2. **Content automatically unlocks** based on the current date and their unit's schedule
3. **Three access levels:**
   - **Public:** Always available
   - **Consultant:** Unlocks on unit-specific date (policies, documentation)
   - **Auditor:** Unlocks on later date (full evidence, chatbots)

## Updating for Next Semester

Edit `/scripts/simple-timeline-access.js` and update:

1. **Passwords** (line 13-30):
```javascript
'NewPassword2026': {
    unit: 'ISYS6018 - Security Audit',
    consultantDate: '2026-01-29T00:00:00',  // Your Week 2
    auditorDate: '2026-03-16T00:00:00'      // Your Week 9
}
```

2. **Dates** for each unit according to your teaching calendar

## Marking Content as Restricted

In any `.qmd` file, wrap restricted content:

```html
<!-- Always visible -->
<div>
Public content here
</div>

<!-- Consultant level (Week 2/3/4 depending on unit) -->
<div data-access="consultant">
Policies and documentation here
</div>

<!-- Auditor level (Week 9/10/12 depending on unit) -->
<div data-access="auditor">
Evidence and chatbot interviews here
</div>
```

## Testing

To test different dates without waiting:

1. Edit `/scripts/simple-timeline-access.js`
2. Set `TEST_MODE = true` (line 33)
3. Change `TEST_DATE` to desired date (line 34)
4. Refresh the page
5. **Remember to set TEST_MODE back to false before deploying!**

## Student Instructions

### For ISYS6018 (via Blackboard):
```
Access CloudCore: https://cloudcoresolutions.com
Password: SecurityAudit2025

Week 1: Public content only
Week 2: Consultant documentation unlocks
Week 9: Full audit evidence and interviews unlock
```

### For Other Units:
Similar instructions with their specific passwords and dates.

## Deployment

After making changes:

```bash
cd cloudcore
git add .
git commit -m "Update access system for new semester"
git push origin main
```

If using GitHub Pages, changes will be live in a few minutes.

## Important Files

- `/scripts/simple-timeline-access.js` - Main access control system
- `/docs/access-demo.qmd` - Example page showing all access levels
- `/_quarto.yml` - Site configuration (script is auto-included)

## Troubleshooting

**Issue:** Content not hiding/showing properly
- Check that `data-access` attributes are correct
- Verify dates in configuration
- Test in incognito/private browser window

**Issue:** Password not working
- Check for typos (case-sensitive)
- Verify password is in configuration
- Clear browser localStorage and try again

**Issue:** Wrong content showing for unit
- Student may have wrong password
- Check date configuration for that unit
- Verify TEST_MODE is set to false

## Privacy & Security Notes

- No student tracking or IDs collected
- Passwords stored in browser localStorage only
- Passwords visible in JavaScript (intentional for teaching)
- Different passwords prevent cross-unit access

## Support

The system is intentionally simple to maintain. Each semester:
1. Update passwords
2. Update dates
3. Deploy

That's it!