# CMS Recommendations for CloudCore Project

## Overview
This document outlines various Content Management System (CMS) solutions for allowing non-technical staff to contribute content to the CloudCore educational platform without needing to understand Git/GitHub complexities.

## Current Setup Constraints
- **Source Branch**: `main` (contains .qmd source files)
- **Published Branch**: `gh-pages` (contains built HTML)
- **Build Process**: Quarto renders .qmd → HTML
- **Deployment**: GitHub Pages from `gh-pages` branch
- **Challenge**: Most CMS solutions need to edit source files in `main`, not the published `gh-pages`

## Recommended Solutions

### 1. GitHub Web Interface + Actions (⭐ Recommended for Your Setup)
**Cost**: Free  
**Complexity**: Low  
**Technical Requirements**: GitHub account only

**How it works:**
- Staff use GitHub's web interface to edit files directly in `main` branch
- Press "." on any GitHub page to open github.dev (VS Code in browser)
- Changes create automatic pull requests
- You review and merge PRs
- Existing GitHub Actions rebuild site automatically

**Implementation Steps:**
1. Create content templates in `/_templates/` folder
2. Write simple guide with screenshots for staff
3. Set up PR templates for consistency
4. Create bookmarklets for quick access to edit pages

**Pros:**
- No additional services needed
- Works with existing workflow
- Full version control
- Free forever

**Cons:**
- Staff need GitHub accounts
- Some GitHub interface learning required

---

### 2. Prose.io
**Cost**: Free  
**Complexity**: Low  
**Technical Requirements**: GitHub account

**How it works:**
- Web-based editor specifically for GitHub content
- Configure to edit `main` branch (not `gh-pages`)
- WYSIWYG markdown editing
- Creates commits/PRs automatically

**Configuration needed:**
```yaml
# _prose.yml in root of main branch
prose:
  rooturl: ''
  siteurl: 'https://cloudcore.serveur.au/'
  media: 'assets/images'
  metadata:
    _posts:
      - name: "title"
        field:
          element: "text"
          label: "Title"
```

**Pros:**
- Simpler than GitHub interface
- Made for content editing
- Free and open source

**Cons:**
- Less actively maintained
- Still requires GitHub account

---

### 3. Netlify CMS / Decap CMS
**Cost**: Free  
**Complexity**: Medium  
**Technical Requirements**: Configuration setup

**How it works:**
- Add `/admin` folder to your site
- Provides WordPress-like interface
- Can be configured to edit `main` branch
- Supports editorial workflow

**Important Configuration:**
```yaml
# admin/config.yml
backend:
  name: github
  repo: michael-borck/cloudcore
  branch: main  # Critical: point to source, not gh-pages
  base_url: https://cloudcore.serveur.au
```

**Pros:**
- Professional CMS interface
- Role-based access control
- Preview capabilities
- Editorial workflow

**Cons:**
- Requires OAuth app setup
- More complex configuration
- May need separate hosting for auth

---

### 4. Simple Web Form → GitHub API
**Cost**: Free to Low  
**Complexity**: Medium  
**Technical Requirements**: Basic coding

**Options:**

#### A. Google Forms → Apps Script
```javascript
// Google Apps Script example
function onFormSubmit(e) {
  const responses = e.values;
  const github = {
    owner: 'michael-borck',
    repo: 'cloudcore',
    branch: 'main'
  };
  // Create PR via GitHub API
}
```

#### B. Static HTML Form → Netlify Functions
```html
<!-- Simple form on your site -->
<form action="/.netlify/functions/submit-content" method="POST">
  <input name="title" required>
  <textarea name="content" required></textarea>
  <button type="submit">Submit Content</button>
</form>
```

#### C. Microsoft Forms → Power Automate
- Use institutional Microsoft account
- Power Automate creates GitHub issues/PRs
- No coding required

**Pros:**
- No GitHub account needed for contributors
- Fully custom workflow
- Can add validation/approval steps

**Cons:**
- Requires development time
- Need API tokens/secrets management

---

### 5. Two-Repository Solution
**Cost**: Free  
**Complexity**: Medium  
**Technical Requirements**: GitHub Actions knowledge

**Setup:**
1. `cloudcore-source` repo: Contains .qmd files, accepts PRs
2. `cloudcore` repo: Only contains gh-pages for publishing

**GitHub Action in source repo:**
```yaml
name: Build and Deploy
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build with Quarto
        run: quarto render
      - name: Deploy to cloudcore repo
        run: |
          git push https://github.com/michael-borck/cloudcore.git 
          gh-pages
```

**Pros:**
- Clean separation of concerns
- Any CMS can work with source repo
- Published site remains protected

**Cons:**
- More complex setup
- Two repos to manage

---

### 6. GitHub Codespaces
**Cost**: Free tier available (60 hours/month)  
**Complexity**: Low-Medium  
**Technical Requirements**: GitHub account

**How it works:**
- Full VS Code in browser
- Can create simplified workspace
- Extensions for markdown preview
- Integrated git operations

**Pros:**
- Familiar VS Code interface
- Full development environment
- Can add custom extensions

**Cons:**
- Might be overkill for content editing
- Limited free hours

---

### 7. Alternative: Simple Contribution Page
**Cost**: Free  
**Complexity**: Very Low  
**Technical Requirements**: None

**Implementation:**
Create `/contribute.qmd` page with:
- Structured email template
- Content guidelines
- Submission form that emails you
- You manually create PRs

```html
<!-- In contribute.qmd -->
<form action="mailto:coordinator@university.edu" method="post" enctype="text/plain">
  <label>Unit Code: <input name="unit"></label>
  <label>Scenario Title: <input name="title"></label>
  <label>Content: <textarea name="content"></textarea></label>
  <button type="submit">Email Submission</button>
</form>
```

**Pros:**
- Zero complexity
- No accounts needed
- Full control

**Cons:**
- Manual PR creation
- No direct integration

---

## Decision Matrix

| Solution | Technical Skill Needed | Setup Time | Ongoing Maintenance | Cost | Best For |
|----------|----------------------|------------|-------------------|------|-----------|
| GitHub Web | Low | 1 hour | None | Free | Tech-comfortable staff |
| Prose.io | Low | 2 hours | Low | Free | Markdown editors |
| Netlify CMS | Medium | 4 hours | Low | Free | Professional CMS needs |
| Web Forms | Medium | 8 hours | Low | Free | Non-technical contributors |
| Two Repos | Medium | 3 hours | Low | Free | Clean separation |
| Codespaces | Low | 1 hour | None | Free* | Power users |
| Email Form | None | 30 min | High | Free | Minimal needs |

---

## Recommended Implementation Path

### Phase 1: Quick Win (Week 1)
1. Set up GitHub web editing guide
2. Create content templates
3. Document the process with screenshots
4. Test with one staff member

### Phase 2: Evaluate (Week 2-3)
1. Gather feedback from Phase 1
2. If GitHub is too complex, implement Prose.io
3. Create video tutorials

### Phase 3: Scale (Month 2)
1. If needing more features, consider Netlify CMS
2. Or implement simple web form solution
3. Establish content review workflow

---

## Content Templates to Create

Regardless of solution chosen, create these templates:

```markdown
<!-- /_templates/scenario.md -->
---
title: "Scenario Title"
unit: "ISYS6018"
week: 1
difficulty: "beginner|intermediate|advanced"
---

## Scenario Overview
[Brief description]

## Learning Objectives
- Objective 1
- Objective 2

## Scenario Details
[Full scenario content]

## Resources Required
- Resource 1
- Resource 2

## Assessment Criteria
[How students will be evaluated]
```

```markdown
<!-- /_templates/character.md -->
---
name: "Character Name"
role: "Job Title"
department: "Department"
---

## Background
[Character background]

## Personality Traits
- Trait 1
- Trait 2

## Key Information
[What this character knows]

## Interview Responses
[Typical responses to questions]
```

---

## Security Considerations

1. **API Tokens**: Store in GitHub Secrets, never in code
2. **Permissions**: Use least-privilege principle
3. **Validation**: Validate all user input
4. **Review**: Always require PR review before merge
5. **Backup**: Regular backups of content

---

## Getting Help

- **GitHub Docs**: https://docs.github.com/en/github/managing-files-in-a-repository
- **Prose.io**: http://prose.io/#about
- **Netlify CMS**: https://www.netlifycms.org/docs/
- **Quarto**: https://quarto.org/docs/websites/

---

## Next Steps

1. **Review** this document with your team
2. **Choose** a solution based on your staff's technical comfort
3. **Pilot** with one willing staff member
4. **Document** the chosen process thoroughly
5. **Train** all content contributors
6. **Iterate** based on feedback

---

*Last Updated: January 2025*