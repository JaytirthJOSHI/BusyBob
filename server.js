import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import { router as studentVueRouter } from './api/studentvue.js';
import { router as canvasRouter } from './api/canvas.js';
import { jobs_v3p1beta1 } from 'googleapis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Environment variables for OAuth
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'your-google-client-id';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret';
const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID || 'your-microsoft-client-id';
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET || 'your-microsoft-client-secret';

// Middleware
app.use(express.json());

// API Routes
app.use('/api/studentvue', studentVueRouter);
app.use('/api/canvas', canvasRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

// Static file serving (after API routes)
app.use(express.static('.'));

// Session middleware for storing Spotify tokens temporarily
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-super-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 10 * 60 * 1000 } // 10 minutes, not secure for localhost
}));

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

// Spotify OAuth callback
app.get('/auth/spotify/callback', async (req, res) => {
    try {
        const { code, state, error } = req.query;

        if (error) {
            return res.redirect(`/?error=${error}`);
        }

        // Verify state parameter (stored in localStorage on client)
        // For this implementation, we'll trust the state from the URL

        // Exchange code for access token
        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: `${req.protocol}://${req.get('host')}/auth/spotify/callback`
            })
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
            return res.redirect(`/?error=${tokenData.error}`);
        }

        // Get user profile from Spotify
        const profileResponse = await fetch('https://api.spotify.com/v1/me', {
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`
            }
        });

        const profile = await profileResponse.json();

        if (profile.error) {
            return res.redirect(`/?error=profile_fetch_failed`);
        }

        // Store tokens temporarily in session for the client to retrieve
        req.session.spotify_access_token = tokenData.access_token;
        req.session.spotify_refresh_token = tokenData.refresh_token;
        req.session.spotify_expires_at = Date.now() + (tokenData.expires_in * 1000);
        req.session.spotify_profile = profile;

        // Redirect to a success page where client can complete the auth flow
        res.redirect(`/?spotify_auth=success&state=${state}`);
    } catch (error) {
        console.error('Spotify OAuth error:', error);
        res.redirect(`/?error=oauth_failed`);
    }
});

// Endpoint to get Spotify auth data from session
app.get('/api/spotify/auth-data', (req, res) => {
    try {
        if (req.session.spotify_access_token && req.session.spotify_profile) {
            const authData = {
                access_token: req.session.spotify_access_token,
                refresh_token: req.session.spotify_refresh_token,
                expires_at: req.session.spotify_expires_at,
                profile: req.session.spotify_profile
            };

            // Clear session data after retrieval
            delete req.session.spotify_access_token;
            delete req.session.spotify_refresh_token;
            delete req.session.spotify_expires_at;
            delete req.session.spotify_profile;

            res.json(authData);
        } else {
            res.status(404).json({ error: 'No auth data found' });
        }
    } catch (error) {
        console.error('Error retrieving Spotify auth data:', error);
        res.status(500).json({ error: 'Failed to retrieve auth data' });
    }
});

// Spotify API proxy endpoints
app.get('/api/spotify/recommendations', async (req, res) => {
    try {
        const { seed_genres, target_energy, target_valence, limit = 20 } = req.query;
        const accessToken = req.headers.authorization?.replace('Bearer ', '');

        if (!accessToken) {
            return res.status(401).json({ error: 'Access token required' });
        }

        const params = new URLSearchParams({
            seed_genres,
            target_energy,
            target_valence,
            limit: limit.toString()
        });

        const response = await fetch(`https://api.spotify.com/v1/recommendations?${params}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Spotify recommendations error:', error);
        res.status(500).json({ error: 'Failed to get recommendations' });
    }
});

app.get('/api/spotify/me', async (req, res) => {
    try {
        const accessToken = req.headers.authorization?.replace('Bearer ', '');

        if (!accessToken) {
            return res.status(401).json({ error: 'Access token required' });
        }

        const response = await fetch('https://api.spotify.com/v1/me', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Spotify user profile error:', error);
        res.status(500).json({ error: 'Failed to get user profile' });
    }
});

app.get('/api/spotify/player', async (req, res) => {
    try {
        const accessToken = req.headers.authorization?.replace('Bearer ', '');

        if (!accessToken) {
            return res.status(401).json({ error: 'Access token required' });
        }

        const response = await fetch('https://api.spotify.com/v1/me/player', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (response.status === 204) {
            return res.json({ is_playing: false });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Spotify player error:', error);
        res.status(500).json({ error: 'Failed to get player state' });
    }
});

app.put('/api/spotify/player/play', async (req, res) => {
    try {
        const accessToken = req.headers.authorization?.replace('Bearer ', '');
        const { uris, device_id } = req.body;

        if (!accessToken) {
            return res.status(401).json({ error: 'Access token required' });
        }

        const url = device_id ?
            `https://api.spotify.com/v1/me/player/play?device_id=${device_id}` :
            'https://api.spotify.com/v1/me/player/play';

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ uris })
        });

        if (response.status === 204) {
            res.json({ success: true });
        } else {
            const data = await response.json();
            res.status(response.status).json(data);
        }
    } catch (error) {
        console.error('Spotify play error:', error);
        res.status(500).json({ error: 'Failed to play track' });
    }
});

app.put('/api/spotify/player/pause', async (req, res) => {
    try {
        const accessToken = req.headers.authorization?.replace('Bearer ', '');

        if (!accessToken) {
            return res.status(401).json({ error: 'Access token required' });
        }

        const response = await fetch('https://api.spotify.com/v1/me/player/pause', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (response.status === 204) {
            res.json({ success: true });
        } else {
            const data = await response.json();
            res.status(response.status).json(data);
        }
    } catch (error) {
        console.error('Spotify pause error:', error);
        res.status(500).json({ error: 'Failed to pause playback' });
    }
});

app.post('/api/spotify/player/next', async (req, res) => {
    try {
        const accessToken = req.headers.authorization?.replace('Bearer ', '');

        if (!accessToken) {
            return res.status(401).json({ error: 'Access token required' });
        }

        const response = await fetch('https://api.spotify.com/v1/me/player/next', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (response.status === 204) {
            res.json({ success: true });
        } else {
            const data = await response.json();
            res.status(response.status).json(data);
        }
    } catch (error) {
        console.error('Spotify next error:', error);
        res.status(500).json({ error: 'Failed to skip to next track' });
    }
});

app.post('/api/spotify/player/previous', async (req, res) => {
    try {
        const accessToken = req.headers.authorization?.replace('Bearer ', '');

        if (!accessToken) {
            return res.status(401).json({ error: 'Access token required' });
        }

        const response = await fetch('https://api.spotify.com/v1/me/player/previous', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (response.status === 204) {
            res.json({ success: true });
        } else {
            const data = await response.json();
            res.status(response.status).json(data);
        }
    } catch (error) {
        console.error('Spotify previous error:', error);
        res.status(500).json({ error: 'Failed to skip to previous track' });
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