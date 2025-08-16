// Authentication function for UC login (Vercel format)
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, unit } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    // Get valid tokens from environment variables
    const validTokens = JSON.parse(process.env.UC_TOKENS || '{}');
    const adminToken = process.env.ADMIN_TOKEN;

    // Check if it's admin token
    if (token === adminToken) {
      return res.status(200).json({
        success: true,
        role: 'admin',
        units: ['ISYS6018', 'ISYS2002', 'ISYS6014', 'ISAD5001'],
        name: 'Administrator'
      });
    }

    // Check unit coordinator tokens
    for (const [unitCode, tokenData] of Object.entries(validTokens)) {
      if (tokenData.token === token) {
        // Optional: Check if specific unit requested matches token
        if (unit && unit !== unitCode) {
          return res.status(403).json({ error: 'Token not valid for requested unit' });
        }

        return res.status(200).json({
          success: true,
          role: 'uc',
          units: [unitCode],
          unit: unitCode,
          name: tokenData.name || `${unitCode} Coordinator`
        });
      }
    }

    // Invalid token
    return res.status(401).json({ error: 'Invalid token' });

  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}