// GitHub API proxy function for repository operations
const { Octokit } = require('@octokit/rest');

// Initialize GitHub client
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

const GITHUB_OWNER = process.env.GITHUB_OWNER || 'michael-borck';
const GITHUB_REPO = process.env.GITHUB_REPO || 'cloudcore';

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Verify authentication token
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authorization required' })
      };
    }

    const token = authHeader.substring(7);
    
    // Verify token is valid (basic check - could be enhanced)
    const validTokens = JSON.parse(process.env.UC_TOKENS || '{}');
    const adminToken = process.env.ADMIN_TOKEN;
    
    const isValidToken = token === adminToken || 
      Object.values(validTokens).some(tokenData => tokenData.token === token);
    
    if (!isValidToken) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Invalid authorization token' })
      };
    }

    // Parse request
    const { operation, path, content, message, branch = 'main' } = JSON.parse(event.body || '{}');

    switch (operation) {
      case 'read':
        return await handleRead(path, branch, headers);
      
      case 'write':
        return await handleWrite(path, content, message, branch, headers);
      
      case 'delete':
        return await handleDelete(path, message, branch, headers);
      
      case 'list':
        return await handleList(path || '', branch, headers);
      
      case 'upload':
        return await handleUpload(path, content, message, branch, headers);
      
      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid operation' })
        };
    }

  } catch (error) {
    console.error('GitHub API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'GitHub operation failed',
        details: error.message 
      })
    };
  }
};

async function handleRead(path, branch, headers) {
  try {
    const response = await octokit.repos.getContent({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: path,
      ref: branch
    });

    // Handle file content
    if (response.data.type === 'file') {
      const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          content: content,
          sha: response.data.sha,
          path: response.data.path,
          type: 'file'
        })
      };
    }

    // Handle directory listing
    if (Array.isArray(response.data)) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          files: response.data.map(file => ({
            name: file.name,
            path: file.path,
            type: file.type,
            size: file.size
          })),
          type: 'directory'
        })
      };
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Unexpected response format' })
    };

  } catch (error) {
    if (error.status === 404) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'File not found' })
      };
    }
    throw error;
  }
}

async function handleWrite(path, content, message, branch, headers) {
  try {
    // Get current file SHA if it exists
    let sha = null;
    try {
      const existingFile = await octokit.repos.getContent({
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        path: path,
        ref: branch
      });
      sha = existingFile.data.sha;
    } catch (error) {
      // File doesn't exist, that's okay for new files
      if (error.status !== 404) throw error;
    }

    const response = await octokit.repos.createOrUpdateFileContents({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: path,
      message: message || `Update ${path} via admin interface`,
      content: Buffer.from(content).toString('base64'),
      sha: sha,
      branch: branch
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        sha: response.data.content.sha,
        commit: response.data.commit.sha
      })
    };

  } catch (error) {
    throw error;
  }
}

async function handleDelete(path, message, branch, headers) {
  try {
    // Get file SHA first
    const existingFile = await octokit.repos.getContent({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: path,
      ref: branch
    });

    const response = await octokit.repos.deleteFile({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: path,
      message: message || `Delete ${path} via admin interface`,
      sha: existingFile.data.sha,
      branch: branch
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        commit: response.data.commit.sha
      })
    };

  } catch (error) {
    if (error.status === 404) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'File not found' })
      };
    }
    throw error;
  }
}

async function handleList(path, branch, headers) {
  try {
    const response = await octokit.repos.getContent({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: path,
      ref: branch
    });

    const files = Array.isArray(response.data) ? response.data : [response.data];
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        files: files.map(file => ({
          name: file.name,
          path: file.path,
          type: file.type,
          size: file.size || 0,
          sha: file.sha
        }))
      })
    };

  } catch (error) {
    if (error.status === 404) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ files: [] })
      };
    }
    throw error;
  }
}

async function handleUpload(path, content, message, branch, headers) {
  // Upload is the same as write for GitHub API
  return await handleWrite(path, content, message, branch, headers);
}