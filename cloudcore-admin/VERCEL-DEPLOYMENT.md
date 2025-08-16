# 🚀 CloudCore Admin - Vercel Deployment Guide

## Quick Setup

### 1. **Create Vercel Project**
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"New Project"**
3. **Import from folder** or **drag this folder** to Vercel dashboard

### 2. **Environment Variables** 
Add these in Vercel project settings:

```bash
UC_TOKENS={"ISYS6018":{"token":"b2e0ce1d6d99ba3c056ee8c8f90c2b6228240dbe6e957c14dd268726bdadbc4d","name":"ISYS6018 Coordinator"}}

ADMIN_TOKEN=a1b2c3d4e5f6789

GITHUB_TOKEN=ghp_your_github_personal_access_token

GITHUB_OWNER=michael-borck

GITHUB_REPO=cloudcore
```

### 3. **GitHub Token Setup**
1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Create token with permissions: `repo`, `contents:write`
3. Copy token to `GITHUB_TOKEN` environment variable

### 4. **Test Login**
- **URL:** `https://your-project.vercel.app/`
- **Unit:** `ISYS6018`  
- **Token:** `b2e0ce1d6d99ba3c056ee8c8f90c2b6228240dbe6e957c14dd268726bdadbc4d`

## 🎯 **Advantages of Vercel**

✅ **Simple drag-and-drop deployment**  
✅ **Automatic HTTPS**  
✅ **Built-in serverless functions**  
✅ **Free tier: 100GB bandwidth**  
✅ **No complex configuration**  
✅ **Better interface than current Netlify**  

## 🔧 **Files Included**

- `index.html` - Main admin portal
- `login.html` - Authentication page  
- `dashboard.html` - Main dashboard
- `dashboard.js` - All dashboard functionality
- `api/auth.js` - Authentication endpoint
- `api/github-api.js` - GitHub repository operations
- `package.json` - Dependencies
- `vercel.json` - Vercel configuration

## 🎓 **For Unit Coordinators**

Once deployed, you can:
- **Login** with your unit-specific token
- **Manage access controls** for your unit's resources
- **Upload and edit content** files
- **Configure scenarios** and time-based access
- **View activity logs** and statistics

All changes sync directly to the main CloudCore repository and appear on the student site within minutes.

---

**Ready to deploy!** Just drag this folder to Vercel dashboard! 🎯