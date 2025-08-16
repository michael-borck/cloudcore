// Authentication function for UC login
exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { token, unit } = JSON.parse(event.body);
    
    if (!token) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Token required' })
      };
    }

    // Get valid tokens from environment variables
    const validTokens = JSON.parse(process.env.UC_TOKENS || '{}');
    const adminToken = process.env.ADMIN_TOKEN;

    // Check if it's admin token
    if (token === adminToken) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          role: 'admin',
          units: ['ISYS6018', 'ISYS2002', 'ISYS6014', 'ISAD5001'],
          name: 'Administrator'
        })
      };
    }

    // Check unit coordinator tokens
    for (const [unitCode, tokenData] of Object.entries(validTokens)) {
      if (tokenData.token === token) {
        // Optional: Check if specific unit requested matches token
        if (unit && unit !== unitCode) {
          return {
            statusCode: 403,
            headers,
            body: JSON.stringify({ error: 'Token not valid for requested unit' })
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            role: 'uc',
            units: [unitCode],
            unit: unitCode,
            name: tokenData.name || `${unitCode} Coordinator`
          })
        };
      }
    }

    // Invalid token
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Invalid token' })
    };

  } catch (error) {
    console.error('Auth error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Authentication failed' })
    };
  }
};