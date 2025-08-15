# CloudCore Netlify Deployment Guide

## 🚀 **Complete Setup for Netlify + GitHub Actions**

This guide shows how to deploy the CloudCore site with the enhanced UC admin interface to Netlify, with automatic builds from GitHub.

## 📋 **Prerequisites**

- GitHub repository with CloudCore code
- Netlify account (free tier works)
- GitHub personal access token
- Basic understanding of environment variables

## 🔧 **Step 1: Set Up Netlify Site**

### **1.1 Create New Site**
1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Click "New site from Git"
3. Choose GitHub and authorize Netlify
4. Select your CloudCore repository
5. **Important**: Leave build settings empty (we'll use GitHub Actions)
6. Click "Deploy site"

### **1.2 Get Netlify Credentials**
1. In your site dashboard, go to **Site settings**
2. Note your **Site ID** (under Site details)
3. Go to **User settings** → **Applications** → **Personal access tokens**
4. Generate a new token with full access
5. Copy the token (you'll need both Site ID and token)

## 🔑 **Step 2: Configure GitHub Secrets**

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**

Add these **Repository secrets**:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `NETLIFY_AUTH_TOKEN` | Your Netlify personal access token | For GitHub Actions to deploy |
| `NETLIFY_SITE_ID` | Your Netlify site ID | Target site for deployment |
| `GITHUB_TOKEN` | Personal access token with repo access | For Netlify Functions to access repo |
| `UC_TOKENS` | JSON string of UC tokens (see below) | Unit coordinator authentication |
| `ADMIN_TOKEN` | Random secure string | Master admin access |

### **UC_TOKENS Format**
```json
{
  "ISYS6018": {
    "token": "secure_random_string_1",
    "name": "Dr. Smith"
  },
  "ISYS2002": {
    "token": "secure_random_string_2", 
    "name": "Prof. Johnson"
  },
  "ISYS6014": {
    "token": "secure_random_string_3",
    "name": "Dr. Williams"
  },
  "ISAD5001": {
    "token": "secure_random_string_4",
    "name": "Prof. Brown"
  }
}
```

## ⚙️ **Step 3: Configure Netlify Environment Variables**

In Netlify Dashboard → **Site settings** → **Environment variables**:

| Variable | Value | Description |
|----------|-------|-------------|
| `GITHUB_TOKEN` | Same as GitHub secret | For API access |
| `GITHUB_OWNER` | Your GitHub username | Repository owner |
| `GITHUB_REPO` | Repository name | Usually "cloudcore" |
| `UC_TOKENS` | Same JSON as GitHub secret | UC authentication |
| `ADMIN_TOKEN` | Same as GitHub secret | Admin access |

## 📁 **Step 4: Verify File Structure**

Ensure your repository has these files:

```
cloudcore/
├── .github/workflows/netlify-deploy.yml
├── netlify.toml
├── config/
│   ├── unit-access.json
│   └── unit-access-schema.json
├── netlify/functions/
│   ├── auth.js
│   ├── github-api.js
│   └── package.json
├── admin/
│   ├── index.html
│   ├── login.html
│   ├── dashboard.html
│   └── dashboard.js
└── [existing Quarto files]
```

## 🚀 **Step 5: Deploy**

### **5.1 Trigger First Deployment**
1. Push any change to main branch
2. Check **Actions** tab in GitHub - should see workflow running
3. Monitor build progress (typically 3-5 minutes)
4. Check Netlify dashboard for deployment status

### **5.2 Test Deployment**
1. Visit your Netlify site URL
2. Verify main site loads correctly
3. Go to `/admin/` - should see admin portal
4. Test login with UC tokens

## 🔐 **Step 6: Set Up UC Access**

### **6.1 Generate Secure Tokens**
```bash
# Generate random tokens (run locally)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### **6.2 Share Credentials with UCs**
Create secure document with:
- Unit coordinator name
- Their specific token  
- Login URL: `https://your-site.netlify.app/admin/login.html`
- Their unit code

### **6.3 Test UC Access**
1. Each UC logs in with their token
2. Verify they see only their unit
3. Test content editing
4. Test access control configuration

## 🛠 **Troubleshooting**

### **Build Fails in GitHub Actions**

**Problem**: R dependencies error
```yaml
# Add to workflow if you use R code
- name: Setup R
  uses: r-lib/actions/setup-r@v2
```

**Problem**: Quarto not found
```yaml
# Ensure Quarto setup step exists
- uses: quarto-dev/quarto-actions/setup@v2
```

### **Netlify Functions Not Working**

**Problem**: Function cold starts
- Add warming mechanism or upgrade to Pro plan

**Problem**: Environment variables not accessible
- Verify variables set in Netlify dashboard
- Check case sensitivity

### **Authentication Issues**

**Problem**: "Invalid token" errors
- Verify `UC_TOKENS` is valid JSON
- Check token format in environment variables
- Ensure GitHub token has repo permissions

**Problem**: Session expires quickly
- Adjust session timeout in `dashboard.js`
- Check browser localStorage

### **GitHub API Errors**

**Problem**: Rate limiting
- Implement request caching
- Use more specific API calls

**Problem**: Permission denied
- Verify GitHub token permissions
- Check repository access

## 🔄 **Ongoing Maintenance**

### **Weekly Tasks**
- Monitor deployment status
- Check function logs in Netlify
- Verify UC access still working

### **Semester Tasks**
- Update UC tokens and credentials
- Review and update access configurations
- Test with new unit requirements

### **As Needed**
- Update GitHub token (expires annually)
- Scale up Netlify plan if needed
- Monitor usage and costs

## 📊 **Monitoring**

### **GitHub Actions**
- Check workflow status regularly
- Monitor build times
- Set up notifications for failures

### **Netlify Analytics**
- Track admin interface usage
- Monitor function execution times
- Watch for errors in function logs

### **Security**
- Rotate tokens annually
- Monitor login attempts
- Review access logs

## 🆘 **Emergency Procedures**

### **If Site Goes Down**
1. Check GitHub Actions status
2. Verify Netlify deployment status
3. Check environment variables still set
4. Test with backup deployment method

### **If UC Can't Access**
1. Verify their token in `UC_TOKENS`
2. Check Netlify function logs
3. Test admin token access
4. Provide temporary workaround

### **If Data Lost**
1. Check GitHub commit history
2. Use git to rollback if needed
3. Restore from configuration backups
4. Re-deploy from known good commit

## 📈 **Scaling Considerations**

### **Performance Optimization**
- Enable Netlify CDN
- Optimize function cold starts
- Implement request caching

### **Security Enhancements**
- Add IP restrictions
- Implement proper rate limiting
- Set up monitoring alerts

### **Feature Additions**
- Add user management interface
- Implement audit logging
- Create backup/restore functionality

---

## ✅ **Quick Verification Checklist**

After deployment, verify:

- [ ] Main site loads at Netlify URL
- [ ] `/admin/` shows admin portal
- [ ] UC login works with test tokens
- [ ] Dashboard loads for authenticated users
- [ ] Content editing works (create/edit/delete)
- [ ] Access control changes save
- [ ] File upload/download works
- [ ] GitHub commits appear for changes
- [ ] Site rebuilds on config changes

## 🎯 **Success Criteria**

Your deployment is successful when:

1. **UCs can log in** with their tokens
2. **Content management works** (CRUD operations)
3. **Access control saves** to GitHub
4. **Site rebuilds automatically** on changes
5. **All changes are version-controlled**

---

*Need help? Check Netlify function logs and GitHub Actions logs for detailed error information.*