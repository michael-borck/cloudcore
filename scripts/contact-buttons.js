// Educational demonstration handlers for contact buttons
document.addEventListener('DOMContentLoaded', function() {
    // Handle Schedule Demo button
    function handleScheduleDemo(event) {
        event.preventDefault();
        
        const demoMessage = `
            <div class="alert alert-info fade show" role="alert">
                <h4 class="alert-heading">📚 Educational Demonstration</h4>
                <p><strong>This is a fictional company website used for educational purposes.</strong></p>
                <hr>
                <p class="mb-2">In a real-world scenario, clicking "Schedule a Demo" would:</p>
                <ul>
                    <li>Open your email client with a pre-filled message to sales@cloudcore.com.au</li>
                    <li>Allow you to request a personalized demonstration of CloudCore's services</li>
                    <li>Connect you with a solution architect within 24 business hours</li>
                    <li>Schedule a video conference to discuss your specific cloud needs</li>
                </ul>
                <hr>
                <p class="mb-0"><small>This educational site demonstrates enterprise sales processes without actually sending emails or scheduling meetings.</small></p>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        
        showEducationalMessage(demoMessage, event.target);
    }
    
    // Handle Support Ticket button
    function handleSupportTicket(event) {
        event.preventDefault();
        
        const supportMessage = `
            <div class="alert alert-warning fade show" role="alert">
                <h4 class="alert-heading">🎓 Educational Demonstration</h4>
                <p><strong>This is a fictional company website used for educational purposes.</strong></p>
                <hr>
                <p class="mb-2">In a real-world scenario, clicking "Open Support Ticket" would:</p>
                <ul>
                    <li>Direct you to CloudCore's customer support portal</li>
                    <li>Create a tracked support ticket with a unique ID</li>
                    <li>Route your issue to the appropriate technical team</li>
                    <li>Provide 24/7 support with guaranteed SLA response times</li>
                </ul>
                <p class="mt-3">Typical support ticket process:</p>
                <ol>
                    <li>Customer submits issue details</li>
                    <li>Ticket assigned priority level (Critical/High/Medium/Low)</li>
                    <li>Technical team responds within SLA timeframe</li>
                    <li>Issue resolved and ticket closed with resolution notes</li>
                </ol>
                <hr>
                <p class="mb-0"><small>This educational site demonstrates enterprise support workflows without actually creating support tickets or contacting support staff.</small></p>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        
        showEducationalMessage(supportMessage, event.target);
    }
    
    // Show educational message near the clicked button
    function showEducationalMessage(messageHTML, targetButton) {
        // Remove any existing messages
        const existingAlerts = document.querySelectorAll('.educational-alert-container');
        existingAlerts.forEach(alert => alert.remove());
        
        // Create container for the message
        const messageContainer = document.createElement('div');
        messageContainer.className = 'educational-alert-container mt-3';
        messageContainer.innerHTML = messageHTML;
        
        // Insert after the button's parent section
        const parentSection = targetButton.closest('.contact-section');
        if (parentSection) {
            parentSection.appendChild(messageContainer);
            
            // Scroll to the message
            messageContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            
            // Auto-hide after 30 seconds
            setTimeout(() => {
                const alert = messageContainer.querySelector('.alert');
                if (alert) {
                    alert.classList.remove('show');
                    setTimeout(() => messageContainer.remove(), 300);
                }
            }, 30000);
        }
    }
    
    // Wait a moment for Quarto to render the page
    setTimeout(() => {
        // Find and update Schedule Demo button
        const demoLinks = document.querySelectorAll('a[href^="mailto:sales@cloudcore.com.au"]');
        demoLinks.forEach(link => {
            link.removeAttribute('href');
            link.style.cursor = 'pointer';
            link.addEventListener('click', handleScheduleDemo);
        });
        
        // Find and update Support Ticket button
        const supportLinks = document.querySelectorAll('a[href^="mailto:support@cloudcore.com.au"]');
        supportLinks.forEach(link => {
            link.removeAttribute('href');
            link.style.cursor = 'pointer';
            link.addEventListener('click', handleSupportTicket);
        });
    }, 100);
});