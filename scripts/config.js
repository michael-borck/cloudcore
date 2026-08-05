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

    // CloudCore API (unit sessions / access config)
    apiUrl: 'https://api.cloudcore.eduserver.au',

    // Gated content host (docs + chatbots, behind the unit session)
    gatedHost: 'gated.cloudcore.eduserver.au',
    gatedUrl: 'https://gated.cloudcore.eduserver.au',

    // Booking API server
    bookingDomain: 'booking.cloudcore.eduserver.au',
    bookingApiUrl: 'https://booking.cloudcore.eduserver.au/api',
    bookingApiLocalUrl: 'http://localhost:8080/api',

    // Brand image URL (used in chatbot embeds)
    brandImageUrl: 'https://cloudcore.eduserver.au/assets/cloudcore_networks.png'
};
