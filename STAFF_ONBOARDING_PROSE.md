# CloudCore Staff Content Management - Using Prose.io

Since GitHub Pages doesn't support OAuth authentication directly, we'll use Prose.io - a simple content editor that works directly with GitHub.

## Getting Started with Prose.io

### Step 1: Access Prose.io
1. Go to [prose.io](http://prose.io)
2. Click "Authorize on GitHub"
3. Grant access to the CloudCore repository

### Step 2: Navigate to CloudCore
1. After logging in, you'll see your repositories
2. Click on `michael-borck/cloudcore`
3. Navigate to the folder where you want to add content

### Step 3: Creating Content

#### For Learning Scenarios:
1. Navigate to `docs/scenarios/`
2. Click "New File" (green button)
3. Name your file (e.g., `phishing-awareness.md`)
4. The metadata fields will appear on the right
5. Fill in:
   - Title
   - Unit (dropdown)
   - Type (Article, Lab, etc.)
   - Difficulty level
   - Description
6. Write your content in the main editor
7. Click "Save" (icon with disk)
8. Add a commit message and save

#### For Security Incidents:
1. Navigate to `docs/articles/`
2. Follow the same process

### Step 4: Editing Existing Content
1. Navigate to the file
2. Click on it to open
3. Make changes
4. Save with a commit message

## Prose.io Features

- **Visual Editor**: Toggle between markdown and preview
- **Metadata Sidebar**: Easy form fields for frontmatter
- **Image Upload**: Drag and drop images
- **Direct GitHub Integration**: No additional authentication needed
- **Mobile Friendly**: Works on tablets and phones

## Content Guidelines

Use the same guidelines from the original onboarding document, but note:
- Files must end in `.md` or `.qmd`
- Use the metadata sidebar for frontmatter (don't type it manually)
- Preview your content before saving

## Alternative: GitHub Web Editor

For simple edits, you can also use GitHub directly:
1. Go to https://github.com/michael-borck/cloudcore
2. Navigate to the file
3. Click the pencil icon to edit
4. Make changes
5. Commit at the bottom of the page

## Which Method to Use?

- **Prose.io**: Better for creating new content, visual editing
- **GitHub Editor**: Quick fixes, small edits
- **Local Git**: Complex changes, multiple files (advanced users only)

---

*Note: After staff make changes, an administrator needs to run `quarto publish gh-pages` to update the live site.*