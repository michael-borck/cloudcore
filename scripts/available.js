// Check if this is a public page that shouldn't have time restrictions
var currentPath = window.location.pathname;
var publicPaths = ['/', '/index', '/index.html', '/about', '/about.html', '/contact', '/contact.html', '/pricing', '/pricing.html'];
var isPublicPage = publicPaths.some(function(path) {
    return currentPath === path || currentPath.endsWith(path);
});

// Only apply time restrictions to non-public pages
if (!isPublicPage) {
    var date = new Date(); // Get current date and time
    var currentHour = date.getHours(); // Extract the hour
    var currentDay = date.getDay(); // Get the current day of the week (0 = Sunday, 6 = Saturday)

    console.log('availability.js ' + date);
    console.log('availability.js currentHour: ' + currentHour);

    // Define business hours
    var startHour = 7; // Business starts at 7 AM
    var endHour = 19; // Business ends at 7 PM

    // Check if the current time is outside business hours or if it's a weekend (Saturday or Sunday)
    if (currentHour < startHour || currentHour >= endHour || currentDay === 0 || currentDay === 6) {
        // If outside business hours or on a weekend, display the message
        document.body.innerHTML = '<h1 id="message">This page is only available from 7:00 AM to 7:00 PM on weekdays.</h1>';
        // Redirect after 2 seconds
        setTimeout(function() {
            window.location.href = 'https://cloudcore.serveur.au'; // Redirect to the homepage
        }, 2000);
    }
}
