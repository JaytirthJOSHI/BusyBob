# Spotify Authentication Setup Guide

This guide will walk you through setting up Spotify OAuth authentication for BusyBob, allowing users to sign in with their Spotify accounts and automatically access music features.

## Prerequisites

- Spotify Developer Account
- BusyBob application running
- Supabase database access

## Step 1: Create Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click "Create App"
3. Fill in the details:
   - **App Name**: BusyBob
   - **App Description**: Student productivity platform with music integration
   - **Website**: Your BusyBob domain (e.g., https://busybob.site)
   - **Redirect URI**: `https://yourdomain.com/auth/spotify/callback`
   - **Which API/SDKs are you planning to use**: Web API

4. Accept the terms and create the app
5. Note down your **Client ID** and **Client Secret**

## Step 2: Configure Environment Variables

Add these environment variables to your `.env` file:

```bash
# Spotify OAuth Configuration
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

## Step 3: Update Client-Side Configuration

In your frontend code, replace `YOUR_SPOTIFY_CLIENT_ID` with your actual client ID:

1. **AuthPages.js** - Update the Spotify auth buttons
2. **main.js** - Update the `handleSpotifyAuth` function
3. **Settings.js** - Update the `connectSpotify` method

## Step 4: Database Migration

Run the Spotify authentication migration:

```bash
# Apply the migration
supabase db push
```

This will add the `spotify_id` column to your users table.

## Step 5: Configure Redirect URIs

Add these redirect URIs to your Spotify app settings:

- **Development**: `http://localhost:3000/auth/spotify/callback`
- **Production**: `https://yourdomain.com/auth/spotify/callback`

## Step 6: Test the Integration

1. Start your development server
2. Go to the login page
3. Click "Continue with Spotify" or "Sign up with Spotify"
4. Complete the OAuth flow
5. Verify that the user is created and logged in
6. Check that music features are automatically available

## Features Provided

### Authentication Flow
- **Sign In**: Users can sign in with their existing Spotify account
- **Sign Up**: New users can create BusyBob accounts using Spotify
- **Auto-Integration**: Music features are automatically enabled upon Spotify auth

### Settings Integration
- **Connection Status**: Users can see if Spotify is connected
- **Connect/Disconnect**: Users can manage their Spotify connection
- **Profile Display**: Shows connected Spotify user info

### Music Features
- **Automatic Access**: Users signed in with Spotify get immediate music access
- **Mood Playlists**: AI-curated playlists based on mood tracking
- **Focus Sessions**: Productivity timers with music
- **Listening Analytics**: Track music habits and productivity correlation

## Scopes Required

The following Spotify scopes are requested:

- `user-read-email` - Get user email for account creation
- `user-read-private` - Get user profile information
- `user-read-playback-state` - Check current playback
- `user-modify-playback-state` - Control playback
- `user-read-currently-playing` - Get current track
- `streaming` - Play music through Web Playback SDK
- `user-library-read` - Access user's saved music
- `user-top-read` - Get user's top tracks/artists
- `user-read-recently-played` - Get listening history
- `playlist-read-private` - Access user's playlists

## Security Considerations

1. **State Parameter**: Always validate the state parameter to prevent CSRF attacks
2. **Token Storage**: Store refresh tokens securely in the database
3. **Token Refresh**: Implement automatic token refresh for expired access tokens
4. **Secure Redirect**: Use HTTPS for all redirect URIs in production

## Troubleshooting

### Common Issues

1. **Invalid Redirect URI**: Ensure redirect URIs match exactly in Spotify app settings
2. **Scope Errors**: Make sure all required scopes are requested
3. **Token Expiration**: Implement proper token refresh handling
4. **Profile Fetch Errors**: Handle API errors gracefully when fetching user profiles

### Error Handling

The implementation includes comprehensive error handling for:
- OAuth flow failures
- Token exchange errors
- Profile fetch failures
- Database connection issues

## Development vs Production

### Development
- Use `http://localhost:3000` for local testing
- Set `show_dialog=true` for easier testing
- Log detailed error messages

### Production
- Use HTTPS domains only
- Set `show_dialog=false` for better UX
- Implement proper error logging
- Use environment variables for sensitive data

## Next Steps

After setup, you can enhance the integration with:

1. **Advanced Music Features**: Implement playlist creation, music recommendations
2. **Social Features**: Allow users to share playlists and music stats
3. **Analytics**: Track user engagement with music features
4. **Premium Features**: Add Spotify Premium-only features for subscribers

## Support

For issues with this setup:
1. Check Spotify Developer documentation
2. Verify environment variables are set correctly
3. Test with different Spotify accounts
4. Check browser console for detailed error messages

The Spotify authentication integration provides a seamless way for users to access BusyBob's music features while maintaining a smooth sign-in experience.