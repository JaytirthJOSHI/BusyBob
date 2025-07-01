export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).send('Authorization code not found');
    }

    // Environment variables for OAuth
    const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID || 'your-microsoft-client-id';
    const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET || 'your-microsoft-client-secret';

    // Exchange code for tokens
    const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: MICROSOFT_CLIENT_ID,
        client_secret: MICROSOFT_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: 'https://busybob.site/auth/microsoft/callback',
      }),
    });

    const tokens = await tokenResponse.json();

    if (tokens.error) {
      throw new Error(tokens.error_description || tokens.error);
    }

    // Send tokens back to the client
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
          <title>Outlook Calendar Connected</title>
      </head>
      <body>
          <script>
              if (window.opener) {
                  window.opener.postMessage({
                      type: 'OUTLOOK_AUTH_SUCCESS',
                      accessToken: '${tokens.access_token}'
                  }, 'https://busybob.site');
                  window.close();
              } else {
                  window.location.href = 'https://busybob.site';
              }
          </script>
          <p>Connecting to Outlook Calendar...</p>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (error) {
    console.error('Microsoft OAuth error:', error);
    res.status(500).send('Failed to authenticate with Microsoft');
  }
} 