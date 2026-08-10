# CloudCore Networks Educational Platform

<!-- BADGES:START -->
[![css](https://img.shields.io/badge/-css-1572b6?style=flat-square)](https://github.com/topics/css) [![cybersecurity](https://img.shields.io/badge/-cybersecurity-f44336?style=flat-square)](https://github.com/topics/cybersecurity) [![educational-platform](https://img.shields.io/badge/-educational--platform-blue?style=flat-square)](https://github.com/topics/educational-platform) [![javascript](https://img.shields.io/badge/-javascript-f7df1e?style=flat-square)](https://github.com/topics/javascript) [![lua](https://img.shields.io/badge/-lua-blue?style=flat-square)](https://github.com/topics/lua) [![quarto](https://img.shields.io/badge/-quarto-blue?style=flat-square)](https://github.com/topics/quarto) [![static-site-generator](https://img.shields.io/badge/-static--site--generator-blue?style=flat-square)](https://github.com/topics/static-site-generator) [![systems-analysis](https://img.shields.io/badge/-systems--analysis-blue?style=flat-square)](https://github.com/topics/systems-analysis) [![web-design](https://img.shields.io/badge/-web--design-blue?style=flat-square)](https://github.com/topics/web-design) [![demo](https://img.shields.io/badge/-demo-blue?style=flat-square)](https://github.com/topics/demo)
<!-- BADGES:END -->

Welcome to CloudCore Networks Educational Platform - a comprehensive cybersecurity and systems analysis learning environment designed for university students and professionals.

## 🏗️ Platform Architecture

### **Student Learning Site (GitHub Pages)**
- **URL:** https://cloudcore.eduserver.au
- **Purpose:** Educational content, interactive chatbots, documentation
- **Technology:** Quarto static site generator
- **Features:** Unit-based access control, time-release content, educational scenarios

### **Unit Coordinator Admin Site (Vercel)**
- **URL:** https://cloudcore-uc.vercel.app/
- **Purpose:** Content management and access control for educators
- **Technology:** HTML/JS with Vercel serverless functions
- **Features:** Password management, access control, content editing

## 🎓 Educational Focus

CloudCore Networks simulates a fictional cloud services company experiencing a security incident, providing realistic learning scenarios for:

- **Information Security Audit and Control (ISYS6018)**
- **Systems Analysis and Design (ISYS2002)**
- **AI-Driven Knowledge Systems (ISYS6014)**
- **Information Systems Analysis and Design (ISAD5001)**

## 🔧 For Developers

### Prerequisites
- Git
- [Quarto CLI](https://quarto.org/docs/get-started/)
- Node.js (for admin interface development)

### Local Development
```bash
git clone https://github.com/michael-borck/cloudcore.git
cd cloudcore

# Run student site locally
quarto preview

# Run admin interface locally (from cloudcore-admin folder)
cd cloudcore-admin
npm install
vercel dev
```

## 🎛️ For Unit Coordinators

1. **Access the admin interface:** https://cloudcore-uc.vercel.app/
2. **Login with your unit credentials** (provided by site administrator)
3. **Manage student access:** Set passwords, configure access rules
4. **Upload content:** Add new scenarios, documents, and resources
5. **Monitor usage:** View activity and student progress

## 🏫 For Students

1. **Visit the learning site:** https://cloudcore.eduserver.au
2. **Enter your unit password** (provided by your Unit Coordinator)
3. **Explore scenarios:** Access time-released content based on your unit
4. **Interact with staff:** Chat with AI-powered CloudCore employees
5. **Review documents:** Access policies, logs, and incident reports

## 🔐 Access Control System

The platform uses a sophisticated unit-based access control system:
- **Time-based release:** Content unlocks at specific dates
- **Scenario-based access:** Unit-specific content filtering
- **Password protection:** Unit Coordinators set custom passwords
- **Role simulation:** Students experience consultant/auditor perspectives

## 📁 Repository Structure

```
├── docs/                    # Educational content (policies, interviews, logs)
├── chatbots/               # AI character interfaces
│   ├── bots/              # Individual character interfaces (.qmd files)
│   └── _backstories/      # Character development and scenarios
│       ├── [character files]  # Used by chatbot provider
│       └── development/       # Archived development files
├── blog/                   # Technical articles and tutorials
├── assets/                 # Images and media files
├── scripts/                # Access control JavaScript
├── config/                 # Unit access configuration
├── cloudcore-admin/        # Admin interface (deployed to Vercel)
└── data/                   # Sample financial and operational data
```

## 🤝 Contributing

This platform is actively used in university courses. Contributions should:
- Maintain educational integrity
- Follow existing access control patterns
- Test thoroughly before submitting
- Consider impact on student learning experience

Please refer to [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Curtin University students and staff for feedback and testing
- AnythingLLM for chatbot infrastructure
- Quarto team for the excellent static site generator
- Vercel for seamless admin interface hosting

---

**For support:** Contact your Unit Coordinator or site administrator
**Technical issues:** Check the [Issues](https://github.com/michael-borck/cloudcore/issues) page