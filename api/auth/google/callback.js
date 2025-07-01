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
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'your-google-client-id';
    const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret';

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: 'https://busybob.site/auth/google/callback',
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
          <title>Google Calendar Connected</title>
      </head>
      <body>
          <script>
              if (window.opener) {
                  window.opener.postMessage({
                      type: 'GOOGLE_AUTH_SUCCESS',
                      accessToken: '${tokens.access_token}',
                      refreshToken: '${tokens.refresh_token || ''}'
                  }, 'https://busybob.site');
                  window.close();
              } else {
                  window.location.href = 'https://busybob.site';
              }
          </script>
          <p>Connecting to Google Calendar...</p>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).send('Failed to authenticate with Google');
  }
} 