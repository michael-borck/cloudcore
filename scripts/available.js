var date = new Date(); // Get current date and time
var currentHour = date.getHours(); // Extract the hour
var currentDay = date.getDay(); // Get the current day of the week (0 = Sunday, 6 = Saturday)

console.log('avaialbility.js' + date);
console.log('availability.js' + currentHour);

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
