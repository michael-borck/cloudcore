# CloudCore Staff Content Management Guide

## Getting Started

Welcome to the CloudCore content management system! This guide will help you contribute educational content to our cybersecurity learning platform.

## Access Requirements

1. **GitHub Account**: You need a GitHub account. If you don't have one:
   - Go to [github.com](https://github.com)
   - Click "Sign up" and create a free account
   - Share your GitHub username with the administrator

2. **Repository Access**: The administrator will add you as a collaborator to the CloudCore repository.

## Accessing the Content Manager

1. Navigate to: `https://cloudcore.serveur.au/admin/`
2. Click "Login with GitHub"
3. Authorize the application when prompted
4. You'll see the CloudCore Content Manager dashboard

## Content Types You Can Create

### 📚 Learning Scenarios
Educational content for different units:
- **Cybersecurity Basics**: Introductory security concepts
- **Incident Response**: Breach scenarios and response procedures
- **Web Development**: Secure coding practices
- **Systems Analysis**: System design and security architecture

### 🚨 Security Incidents
Mock security incidents for students to analyze:
- Data breaches
- Malware infections
- Phishing campaigns
- Insider threats
- DDoS attacks

### 🎤 Character Interviews
Interviews with CloudCore staff personas that provide different perspectives on security incidents

### 📋 Company Policies
Security and compliance policy documents

### 📝 Blog Posts
Technical articles and tutorials

## Creating Content: Step-by-Step

### Example: Creating a New Security Scenario

1. **From the Dashboard**:
   - Click "📚 Learning Scenarios"
   - Click "New Learning Scenario"

2. **Fill Out the Form**:
   ```
   Title: Introduction to SQL Injection Attacks
   Unit: Cybersecurity Basics
   Type: Lab
   Difficulty: Intermediate
   Description: Students learn about SQL injection vulnerabilities through hands-on exercises
   Content: [Write or paste your markdown content]
   ```

3. **Writing Content**:
   - Use the visual editor or switch to markdown mode
   - Add headings with the toolbar
   - Include code blocks for technical content
   - Upload images using the media button

4. **Preview Your Content**:
   - Click "Preview" to see how it will look
   - Make any necessary adjustments

5. **Save and Publish**:
   - Click "Save" to publish immediately
   - Or click "Save draft" to continue later

## Content Guidelines

### For Security Scenarios
- Include clear learning objectives
- Provide step-by-step instructions
- Add questions for student reflection
- Include realistic but educational vulnerabilities

### For Incident Reports
- Follow the timeline format
- Include technical details appropriate for the unit level
- Reference relevant CloudCore staff characters
- Provide evidence (logs, screenshots) where appropriate

### For Interviews
- Stay in character for the persona
- Reference actual CloudCore policies and procedures
- Include security insights appropriate to the role
- Make interviews feel authentic and educational

## Markdown Quick Reference

```markdown
# Heading 1
## Heading 2
### Heading 3

**Bold text**
*Italic text*
`inline code`

```python
# Code block
def example():
    return "Hello"
```

- Bullet point
1. Numbered list

[Link text](https://example.com)
![Image alt text](image.jpg)
```

## Unit-Specific Content Access

Content is filtered based on student unit passwords:

| Unit | Password | Access Level |
|------|----------|--------------|
| Cybersecurity Basics | CyberSec101!2024 | Basic policies, introductory content |
| Incident Response | IncidentResp2024! | All incident reports, logs, interviews |
| Web Development | WebDev2024! | Technical blogs, development policies |
| Systems Analysis | SysAnalysis2024! | Architecture docs, cost analysis |

When creating content, consider which unit(s) should have access.

## Best Practices

1. **Save Frequently**: The CMS auto-saves, but click "Save" regularly
2. **Use Descriptive Titles**: Help students find content easily
3. **Tag Appropriately**: Use correct categories and units
4. **Test Your Content**: Preview before publishing
5. **Follow Naming Conventions**: 
   - Interviews: Start with "Interview with..."
   - Incidents: Include date and type
   - Policies: Use document numbers (DOC-XXX-000)

## Media Guidelines

- **Images**: Max 2MB, use PNG or JPG
- **Naming**: Use descriptive filenames (not IMG_1234.jpg)
- **Alt Text**: Always add alt text for accessibility
- **Screenshots**: Blur any real sensitive data

## Publishing Workflow

1. **Create/Edit Content** → Your changes are saved to GitHub
2. **Automatic Build** → GitHub Actions builds the site (3-5 minutes)
3. **Live Site** → Content appears on cloudcore.serveur.au

You can check build status at: https://github.com/teaching-repositories/cloudcore/actions

## Getting Help

- **Technical Issues**: Contact the repository administrator
- **Content Questions**: Refer to existing examples in each category
- **CMS Problems**: Try refreshing the page or logging out/in

## Common Tasks

### Editing Existing Content
1. Navigate to the content type
2. Click on the item you want to edit
3. Make changes
4. Click "Save"

### Deleting Content
1. Open the content item
2. Click "Delete" (top right)
3. Confirm deletion
⚠️ **Note**: Deletions cannot be undone

### Adding Images
1. In the editor, click the image icon
2. Choose "Upload" or select existing
3. Add alt text for accessibility
4. Insert into your content

### Creating Related Content
When creating scenarios about incidents:
1. First create the incident report
2. Then create related interviews
3. Reference both in your learning scenario

## Security Notes

- Don't include real passwords or sensitive data
- Use fictional data for all examples
- Keep security vulnerabilities educational, not exploitable
- Remember this is a learning platform - include hints for students

---

**Welcome to the team!** Your contributions help students learn crucial cybersecurity concepts in a safe, controlled environment.