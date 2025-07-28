// Unit-based access control configuration

// Helper functions if not already defined
if (typeof setCookie === 'undefined') {
  window.setCookie = function(name, value, hours) {
    const date = new Date();
    date.setTime(date.getTime() + (hours * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
  }
}

if (typeof getCookie === 'undefined') {
  window.getCookie = function(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }
}

if (typeof goBack === 'undefined') {
  window.goBack = function() {
    history.back();
  }
}

const unitConfig = {
  // Basic cybersecurity unit
  "CyberSec101!2025": {
    unit: "cybersecurity-basics",
    description: "Introduction to Cybersecurity",
    accessiblePaths: [
      "/docs/policies/privacy",
      "/docs/policies/access",
      "/docs/support/approved_software",
      "/chatbots/bots/samuel_torres",
      "/chatbots/bots/emily_chen"
    ],
    hiddenContent: {
      // Hide sensitive breach info
      "/docs/articles/data_breach_": "hidden",
      "/docs/interviews/interview_data_breach_": "hidden"
    }
  },
  
  // Incident response unit
  "IncidentResp2025!": {
    unit: "incident-response",
    description: "Security Incident Response",
    accessiblePaths: [
      "/docs/policies/",
      "/docs/articles/data_breach_",
      "/docs/interviews/interview_",
      "/docs/support/logs/",
      "/chatbots/bots/"
    ],
    hiddenContent: {
      // Show everything for this unit
    }
  },
  
  // Web development unit
  "WebDev2025!": {
    unit: "web-development",
    description: "Web Development & Security",
    accessiblePaths: [
      "/blog/",
      "/docs/policies/privacy",
      "/docs/policies/cookie_policy",
      "/docs/support/erd",
      "/chatbots/bots/michael_thompson",
      "/chatbots/bots/dr_mina_chowdhury"
    ],
    hiddenContent: {
      "/docs/articles/": "hidden",
      "/docs/support/logs/": "hidden"
    }
  },
  
  // Systems analysis unit
  "SysAnalysis2025!": {
    unit: "systems-analysis",
    description: "Systems Analysis & Design",
    accessiblePaths: [
      "/docs/support/erd",
      "/docs/support/network_logical",
      "/docs/support/org_chart",
      "/docs/policies/sdlc",
      "/docs/support/cost_analysis",
      "/chatbots/bots/"
    ],
    hiddenContent: {
      "/docs/articles/data_breach_": "hidden",
      "/docs/support/logs/": "hidden"
    }
  },
  
  // ISYS6014 Information Security Audit and Control - Full access
  "InfoSecAdtCtrl!2025": {
    unit: "info-security-audit",
    description: "ISYS6014 Information Security Audit and Control",
    accessiblePaths: [
      "/" // Root access grants access to everything
    ],
    hiddenContent: {
      // Full access - nothing hidden
    }
  }
};

// Check if path matches any pattern
function pathMatches(currentPath, patterns) {
  return patterns.some(pattern => {
    // Handle both exact matches and prefix matches
    if (pattern.endsWith('/')) {
      return currentPath.startsWith(pattern);
    }
    return currentPath === pattern || currentPath.startsWith(pattern + '/');
  });
}

// Get unit access based on stored authentication
function getUnitAccess() {
  const authData = getCookie("unitAuth");
  console.log('Getting unit access, cookie value:', authData);
  if (!authData) return null;
  
  try {
    const parsed = JSON.parse(decodeURIComponent(authData));
    console.log('Parsed auth data:', parsed);
    return unitConfig[parsed.password] || null;
  } catch (e) {
    console.error('Error parsing auth data:', e);
    return null;
  }
}

// Check if current page is accessible
function checkPageAccess(checkPath) {
  const unitAccess = getUnitAccess();
  const currentPath = checkPath || window.location.pathname;
  
  // No auth required for homepage, about, contact
  const publicPaths = ['/', '/index', '/index.html', '/about', '/about.html', '/contact', '/contact.html', '/pricing', '/pricing.html'];
  if (pathMatches(currentPath, publicPaths)) {
    return true;
  }
  
  // Check if authenticated
  if (!unitAccess) {
    return false;
  }
  
  // Check if path is explicitly hidden
  const hiddenPatterns = Object.keys(unitAccess.hiddenContent || {});
  if (pathMatches(currentPath, hiddenPatterns)) {
    return false;
  }
  
  // Check if path is accessible
  return pathMatches(currentPath, unitAccess.accessiblePaths);
}

// Modified password check function
function checkUnitPassword() {
  const unitAccess = getUnitAccess();
  
  // Already authenticated for this session
  if (unitAccess) {
    if (!checkPageAccess()) {
      document.body.innerHTML = `
        <div style="text-align: center; padding: 50px;">
          <h1>Access Restricted</h1>
          <p>This content is not available for your unit: ${unitAccess.description}</p>
          <p><a href="/">Return to Homepage</a></p>
        </div>
      `;
      return false;
    }
    return true;
  }
  
  // Need authentication
  const userPassword = prompt('Please enter your unit password:');
  if (userPassword === null) {
    goBack();
    return false;
  }
  
  const unitData = unitConfig[userPassword];
  if (!unitData) {
    document.body.innerHTML = '<h1>Invalid Password</h1>';
    setTimeout(goBack, 2000);
    return false;
  }
  
  // Store authentication
  const authData = {
    password: userPassword,
    unit: unitData.unit,
    timestamp: new Date().getTime()
  };
  const cookieValue = encodeURIComponent(JSON.stringify(authData));
  console.log('Setting unitAuth cookie:', cookieValue);
  setCookie("unitAuth", cookieValue, 24);
  
  // Check access for current page
  if (!checkPageAccess()) {
    document.body.innerHTML = `
      <div style="text-align: center; padding: 50px;">
        <h1>Access Granted</h1>
        <p>Welcome to ${unitData.description}</p>
        <p>However, this specific page is not part of your unit's curriculum.</p>
        <p><a href="/">Go to Homepage</a></p>
      </div>
    `;
    return false;
  }
  
  return true;
}

// Hide navigation items based on unit access
function updateNavigation() {
  // Don't hide anything if user is not authenticated - public pages should show all nav
  const unitAccess = getUnitAccess();
  if (!unitAccess) {
    console.log('No authentication - showing all navigation items');
    // Make sure all nav items are visible
    document.querySelectorAll('nav a').forEach(link => {
      if (link.parentElement) {
        link.parentElement.style.display = '';
      }
    });
    return;
  }
  
  console.log('Updating navigation for unit:', unitAccess.unit);
  
  // For full access units, show everything
  if (unitAccess.accessiblePaths.includes('/')) {
    console.log('Full access unit - showing all navigation items');
    document.querySelectorAll('nav a').forEach(link => {
      if (link.parentElement) {
        link.parentElement.style.display = '';
      }
    });
    return;
  }
  
  // Hide nav items that aren't accessible
  document.querySelectorAll('nav a').forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    
    // Convert relative URLs to absolute paths for checking
    let checkPath = href;
    if (href.startsWith('../')) {
      // Handle relative paths
      const currentPath = window.location.pathname;
      const pathParts = currentPath.split('/').filter(p => p);
      pathParts.pop(); // Remove current file
      const upLevels = (href.match(/\.\.\//g) || []).length;
      for (let i = 0; i < upLevels; i++) {
        pathParts.pop();
      }
      checkPath = '/' + pathParts.join('/') + '/' + href.replace(/\.\.\//g, '');
    } else if (!href.startsWith('/') && !href.startsWith('http')) {
      // Handle relative paths without ../
      const currentDir = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
      checkPath = currentDir + '/' + href;
    }
    
    // Normalize the path
    checkPath = checkPath.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
    
    console.log('Checking nav link:', href, '->', checkPath);
    
    // Don't hide links to public pages or external links
    if (href.startsWith('http') || href.startsWith('mailto:')) {
      return;
    }
    
    if (!checkPageAccess(checkPath)) {
      console.log('Hiding nav link:', href);
      link.parentElement.style.display = 'none';
    } else {
      // Make sure accessible links are visible
      link.parentElement.style.display = '';
    }
  });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Check if this is a public page
  const currentPath = window.location.pathname;
  const publicPaths = ['/', '/index', '/index.html', '/about', '/about.html', '/contact', '/contact.html', '/pricing', '/pricing.html'];
  const isPublicPage = publicPaths.some(path => currentPath === path || currentPath.endsWith(path));
  
  // Only run password check on non-public pages
  if (!isPublicPage) {
    // Check if we should run password check
    // Only run if not blocked by time restrictions
    if (document.body.innerHTML.indexOf('only available from 7:00 AM to 7:00 PM') === -1) {
      // Replace the old checkPassword with unit-based check
      window.checkPassword = checkUnitPassword;
      
      // Run the unit password check
      checkUnitPassword();
    }
  }
  
  // Always update navigation - it will show all items if not authenticated
  updateNavigation();
});