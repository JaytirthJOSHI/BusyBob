# Music Integration Setup Guide

This guide will help you set up music integration for BusyBob, enabling Spotify connectivity for focus playlists and mood-based music recommendations.

## Features

- **Spotify Integration**: Connect your Spotify account for personalized music experiences
- **Mood-Based Playlists**: Get playlist recommendations based on your current mood (1-5 scale)
- **Focus Sessions**: Start timed focus sessions with adaptive music
- **Music Analytics**: Track your listening patterns and their correlation with productivity
- **Playback Controls**: Control Spotify playback directly from BusyBob

## Spotify API Setup

### 1. Create a Spotify App

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
2. Log in with your Spotify account
3. Click "Create an App"
4. Fill in the app details:
   - **App Name**: BusyBob Music Integration
   - **App Description**: Student productivity platform with mood-based music recommendations
   - **Website**: Your BusyBob domain (e.g., https://busybob.site)
   - **Redirect URI**: `https://yourdomain.com/auth/spotify/callback`
5. Agree to the terms and create the app

### 2. Configure App Settings

1. In your app dashboard, click "Settings"
2. Note down your **Client ID** and **Client Secret**
3. Under "Redirect URIs", add:
   - `http://localhost:3000/auth/spotify/callback` (for development)
   - `https://yourdomain.com/auth/spotify/callback` (for production)
4. Save the settings

### 3. Environment Variables

Add these environment variables to your `.env` file:

```env
# Spotify API Configuration
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

## Database Setup

Run the music integration migration to set up the required database tables:

```bash
# If using Supabase CLI
supabase db push

# Or apply the migration manually in your Supabase dashboard
# Upload the file: supabase/migrations/20241219000000_add_music_integration.sql
```

This creates the following tables:
- `music_connections` - Store Spotify OAuth tokens
- `listening_history` - Track user's listening habits
- `music_analytics` - Store mood-music correlations
- `focus_playlists` - User's saved focus playlists
- `music_mood_correlations` - Analytics for mood-based recommendations

## Features Overview

### 🎵 Mood-Based Playlists

The system includes 5 preset mood categories, each with different musical characteristics:

1. **Very Bad (😞)** - Calm & Healing
   - Genres: Ambient, Classical, Chill
   - Energy: 0.2, Valence: 0.3
   - Purpose: Gentle music to lift spirits

2. **Bad (😕)** - Comfort Zone
   - Genres: Indie, Folk, Soft Rock
   - Energy: 0.3, Valence: 0.4
   - Purpose: Soothing sounds for difficult days

3. **Okay (😐)** - Study Focus
   - Genres: Lo-fi, Instrumental, Electronic
   - Energy: 0.5, Valence: 0.5
   - Purpose: Balanced beats for steady work

4. **Good (🙂)** - Productive Flow
   - Genres: Pop, Indie, Electronic
   - Energy: 0.7, Valence: 0.7
   - Purpose: Upbeat tracks to keep you moving

5. **Excellent (😄)** - Peak Performance
   - Genres: Electronic, Pop, Rock
   - Energy: 0.8, Valence: 0.8
   - Purpose: High-energy music for maximum productivity

### 🎯 Focus Sessions

- **Timed Sessions**: 25, 45, 60, or 90-minute focus periods
- **Adaptive Music**: Music automatically adjusts to maintain focus
- **Session Tracking**: Analytics on your focus patterns with different music
- **Integration with Tasks**: Correlate focus sessions with task completion

### 📊 Music Analytics

Track and analyze:
- Most productive genres
- Listening patterns throughout the day
- Mood-music correlations
- Focus session effectiveness with different music types

## Usage Instructions

### Connecting Spotify

1. Navigate to the Music page in BusyBob
2. Click "Connect Spotify Account"
3. Authorize BusyBob to access your Spotify account
4. You'll be redirected back with a success message

### Using Mood-Based Playlists

1. Log your current mood in the Home section
2. Go to the Music page
3. Click on a mood playlist card that matches your current state
4. The system will generate a personalized playlist and start playing

### Starting a Focus Session

1. Go to the Music page
2. Select your desired session duration
3. Click "Start Focus Session"
4. The timer will begin, and music will adapt to maintain focus
5. Track your productivity during the session

### Playback Controls

When music is playing, you can:
- Play/Pause tracks
- Skip to next/previous tracks
- View current track information
- Control playback directly from BusyBob

## Technical Implementation

### Frontend Components

- `Music.js` - Main music integration component
- Mood-based playlist selection
- Focus session management
- Playback controls and current track display
- Music analytics visualization

### Backend Endpoints

- `GET /auth/spotify/callback` - OAuth callback handling
- `GET /api/spotify/recommendations` - Get mood-based recommendations
- `GET /api/spotify/me` - User profile information
- `GET /api/spotify/player` - Current playback state
- `PUT /api/spotify/player/play` - Start playback
- `PUT /api/spotify/player/pause` - Pause playback
- `POST /api/spotify/player/next` - Skip to next track
- `POST /api/spotify/player/previous` - Skip to previous track

### Database Schema

The integration uses several tables to store:
- OAuth tokens and connection status
- Listening history and session data
- Music analytics and mood correlations
- User's focus playlists and preferences

## Security Considerations

### Token Management

- Access tokens are stored securely in the database
- Tokens are automatically refreshed when expired
- Session-based authentication for API calls

### Data Privacy

- Only necessary Spotify data is stored
- User can disconnect and delete all music data
- Full compliance with data protection regulations

### API Rate Limits

- Respectful API usage with appropriate rate limiting
- Caching of frequently accessed data
- Graceful handling of API errors

## Troubleshooting

### Common Issues

1. **"Failed to connect to Spotify"**
   - Check your Spotify Client ID and Secret
   - Verify redirect URIs are correctly configured
   - Ensure your app is not in "Development Mode" restrictions

2. **"No music playing" despite connection**
   - Make sure Spotify is open on at least one device
   - Check that BusyBob has playback permissions
   - Try refreshing the connection

3. **Recommendations not loading**
   - Verify the Spotify Web API is accessible
   - Check network connectivity
   - Ensure proper genre seeds are being sent

4. **Focus sessions not starting**
   - Check timer implementation in browser
   - Verify session tracking in database
   - Ensure proper mood data correlation

### Debug Mode

Enable debug logging by adding this to your browser console:

```javascript
localStorage.setItem('musicDebug', 'true')
```

This will provide detailed logging for:
- API requests and responses
- Token refresh cycles
- Mood-playlist correlations
- Focus session analytics

## Future Enhancements

### Planned Features

- **Apple Music Integration**: Support for Apple Music API
- **Advanced Analytics**: Machine learning for better recommendations
- **Social Features**: Share playlists with other BusyBob users
- **Custom Playlists**: Create and save personalized focus playlists
- **Study Groups**: Collaborative listening sessions

### Integration Possibilities

- **Calendar Sync**: Auto-start music based on calendar events
- **Task Correlation**: Suggest music based on task type and difficulty
- **Sleep Tracking**: Evening wind-down playlists
- **Break Reminders**: Transition music for work breaks

## Support

For issues with music integration:

1. Check this documentation first
2. Verify your Spotify app configuration
3. Check browser console for error messages
4. Ensure database migrations have been applied
5. Contact support with detailed error information

## Contributing

To contribute to the music integration:

1. Fork the repository
2. Create a feature branch for music enhancements
3. Test thoroughly with real Spotify accounts
4. Submit a pull request with detailed description
5. Include tests for new music features

---

**Enhance your productivity with the perfect soundtrack!** 🎵✨