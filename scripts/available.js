// Check if this is a public page that shouldn't have time restrictions
var currentPath = window.location.pathname;
var publicPaths = ['/', '/index', '/index.html', '/about', '/about.html', '/contact', '/contact.html', '/pricing', '/pricing.html'];
var isPublicPage = publicPaths.some(function(path) {
    return currentPath === path || currentPath.endsWith(path);
});

// Allow bypass with ?test=true URL parameter
var testMode = new URLSearchParams(window.location.search).get('test') === 'true';

// Only apply time restrictions to non-public pages
if (!isPublicPage && !testMode) {
    var date = new Date(); // Get current date and time
    var currentHour = date.getHours(); // Extract the hour
    var currentDay = date.getDay(); // Get the current day of the week (0 = Sunday, 6 = Saturday)

    console.log('availability.js ' + date);
    console.log('availability.js currentHour: ' + currentHour);

    // Define business hours
    var startHour = 7; // Business starts at 7 AM
    var endHour = (currentDay === 2) ? 20 : 19; // Tuesday ends at 8 PM, other weekdays at 7 PM

    // Check if the current time is outside business hours or if it's a weekend (Saturday or Sunday)
    if (currentHour < startHour || currentHour >= endHour || currentDay === 0 || currentDay === 6) {
        // If outside business hours or on a weekend, display the message
        var endTimeMsg = (currentDay === 2) ? '8:00 PM' : '7:00 PM';
        document.body.innerHTML = '<h1 id="message">This page is only available from 7:00 AM to ' + endTimeMsg + ' on weekdays (Tuesday hours extended to 8:00 PM).</h1>';
        // Redirect after 2 seconds
        setTimeout(function() {
            window.location.href = (typeof CloudCoreConfig !== 'undefined' ? CloudCoreConfig.siteUrl : '') + '/'; // Redirect to the homepage
        }, 2000);
    }
}
