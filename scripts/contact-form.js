// Contact form handler for educational demonstration
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('consultation-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(contactForm);
            const name = formData.get('name');
            const email = formData.get('email');
            const company = formData.get('company');
            const service = formData.get('service');
            const message = formData.get('message');
            
            // Create educational response
            const responseHTML = `
                <div class="alert alert-info" role="alert">
                    <h4 class="alert-heading">Educational Demonstration</h4>
                    <p><strong>This is a fictional company website used for educational purposes.</strong></p>
                    <hr>
                    <p class="mb-2">In a real-world scenario, your consultation request would be processed as follows:</p>
                    <ul>
                        <li>Contact Name: ${name}</li>
                        <li>Email: ${email}</li>
                        <li>Company: ${company}</li>
                        <li>Service Interest: ${service || 'Not specified'}</li>
                    </ul>
                    <p class="mt-3">Your message would be sent to the CloudCore sales team for review and follow-up within 24 business hours.</p>
                    <hr>
                    <p class="mb-0"><small>This form is part of an educational project demonstrating enterprise web design and user interaction patterns. No actual consultation has been booked, and no data has been transmitted or stored.</small></p>
                </div>
                <button type="button" class="btn btn-secondary mt-3" onclick="location.reload()">Submit Another Request</button>
            `;
            
            // Replace form with response
            const formContainer = contactForm.parentElement;
            formContainer.innerHTML = responseHTML;
            
            // Scroll to the response
            formContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Log to console for educational purposes
            console.log('Educational Form Submission Demo:', {
                name: name,
                email: email,
                company: company,
                service: service,
                message: message,
                timestamp: new Date().toISOString(),
                note: 'This is a demonstration only - no data was actually submitted'
            });
        });
    }
});