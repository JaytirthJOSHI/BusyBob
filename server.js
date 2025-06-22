import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { router as studentVueRouter } from './api/studentvue.js';
import { router as canvasRouter } from './api/canvas.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Environment variables for OAuth
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'your-google-client-id';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret';
const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID || 'your-microsoft-client-id';
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET || 'your-microsoft-client-secret';

// Middleware
app.use(express.json());
app.use(express.static('.'));

// API Routes
app.use('/api/studentvue', studentVueRouter);
app.use('/api/canvas', canvasRouter);

// Google OAuth callback
app.get('/auth/google/callback', async (req, res) => {
    try {
        const { code } = req.query;
        
        if (!code) {
            return res.status(400).send('Authorization code not found');
        }

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
        
        res.send(html);
    } catch (error) {
        console.error('Google OAuth error:', error);
        res.status(500).send('Failed to authenticate with Google');
    }
});

// Microsoft OAuth callback
app.get('/auth/microsoft/callback', async (req, res) => {
    try {
        const { code } = req.query;
        
        if (!code) {
            return res.status(400).send('Authorization code not found');
        }

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
        
        res.send(html);
    } catch (error) {
        console.error('Microsoft OAuth error:', error);
        res.status(500).send('Failed to authenticate with Microsoft');
    }
});

// Google Calendar API proxy
app.get('/api/google/calendar', async (req, res) => {
    try {
        const { accessToken, timeMin, timeMax } = req.query;
        
        if (!accessToken) {
            return res.status(400).json({ error: 'Access token required' });
        }

        const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Google Calendar API error:', error);
        res.status(500).json({ error: 'Failed to fetch Google Calendar events' });
    }
});

// Microsoft Graph API proxy
app.get('/api/microsoft/calendar', async (req, res) => {
    try {
        const { accessToken, startDateTime, endDateTime } = req.query;
        
        if (!accessToken) {
            return res.status(400).json({ error: 'Access token required' });
        }

        const url = `https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=${startDateTime}&endDateTime=${endDateTime}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Microsoft Graph API error:', error);
        res.status(500).json({ error: 'Failed to fetch Outlook Calendar events' });
    }
});

// Google token refresh endpoint
app.post('/api/google/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token required' });
        }

        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                refresh_token: refreshToken,
                grant_type: 'refresh_token',
            }),
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error_description || data.error);
        }

        res.json({
            accessToken: data.access_token,
            refreshToken: data.refresh_token || refreshToken, // Use new refresh token if provided
        });
    } catch (error) {
        console.error('Google token refresh error:', error);
        res.status(500).json({ error: 'Failed to refresh Google token' });
    }
});

// Legal pages routes
app.get('/privacy-policy', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/terms-of-service', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve the main app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});