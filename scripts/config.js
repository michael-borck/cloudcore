/**
 * CloudCore Site Configuration
 * Single source of truth for domain names and URLs.
 * Update these when moving between environments.
 */
const CloudCoreConfig = {
    // Main site domain
    siteDomain: 'cloudcore.eduserver.au',
    siteUrl: 'https://cloudcore.eduserver.au',

    // AnythingLLM chat server
    chatDomain: 'chat.eduserver.au',
    chatApiUrl: 'https://chat.eduserver.au/api/embed',
    chatWidgetSrc: 'https://chat.eduserver.au/embed/anythingllm-chat-widget.min.js',

    // Booking API server
    bookingDomain: 'booking-api.eduserver.au',
    bookingApiUrl: 'https://booking-api.eduserver.au/api',
    bookingApiLocalUrl: 'http://localhost:8080/api',

    // Brand image URL (used in chatbot embeds)
    brandImageUrl: 'https://cloudcore.eduserver.au/assets/cloudcore_networks.png'
};
