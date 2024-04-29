var date = new Date(); // Get current date and time
var currentHour = date.getHours(); // Extract the hour

// Define business hours
var startHour = 7; // Business starts at 7 AM
var endHour = 19; // Business ends at 7 PM

// Check if current time is outside business hours
if (currentHour < startHour || currentHour >= endHour) {
    // If outside business hours, display the message
    document.body.innerHTML = '<h1 id="message">This page is only available from 9:00 AM to 5:00 PM.</h1>';
    // Redirect after 2 seconds
    setTimeout(function() {
        window.location.href = 'https://cloudcore.serveur.au'; // Redirect to the homepage
    }, 2000);
}