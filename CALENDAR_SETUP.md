# Calendar Integration Setup Guide

This guide will help you set up Google Calendar and Outlook Calendar integration for BusyBob.

## Features

- **Google Calendar Integration**: Connect your Google Calendar to view events alongside your tasks
- **Outlook Calendar Integration**: Connect your Outlook/Microsoft 365 Calendar
- **Multiple Calendar Support**: Connect multiple calendars and view them together
- **Modern UI**: Beautiful calendar interface with month/week/day views
- **Event Indicators**: Visual indicators for events on calendar days
- **Existing Google OAuth**: Leverages your existing Google sign-in setup

## Google Calendar Integration

BusyBob already has Google OAuth set up for user authentication. The calendar integration extends this to include calendar access:

1. **Automatic Integration**: If you're already signed in with Google, the calendar integration will use your existing session
2. **Additional Scopes**: When connecting your calendar, you'll be prompted to grant calendar read access
3. **Seamless Experience**: No need for separate OAuth setup - it uses your existing Google account

## Setting Up OAuth Credentials

### Google Calendar Setup

Since you already have Google OAuth working, you just need to ensure your Google Cloud Console project has the Calendar API enabled:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top of the page and select your existing BusyBob project
3. In the left sidebar, click "APIs & Services" > "Library"
4. Search for "Google Calendar API" in the search bar
5. Click on "Google Calendar API" in the results
6. Click the "Enable" button if the API is not already enabled

Next, configure the OAuth consent screen:

1. In the left sidebar, click "APIs & Services" > "OAuth consent screen"
2. Under "Scopes for Google APIs", click "Add or Remove Scopes"
3. Search for "calendar" in the filter box
4. Check the box for `https://www.googleapis.com/auth/calendar.readonly`
5. Click "Update" to save the changes

Verify your OAuth credentials:

1. Go to "APIs & Services" > "Credentials"
2. Find your existing OAuth 2.0 Client ID
3. Click the edit (pencil) icon 
4. Ensure the following are configured:
   - Authorized JavaScript origins: `https://busybob.site`
   - Authorized redirect URIs: `https://busybob.site/auth/google/callback`
5. Click "Save" if you made any changes

Test the integration:

1. Sign out of BusyBob if currently logged in
2. Sign back in using Google OAuth
3. Navigate to the Calendar page
4. You should now see the option to connect Google Calendar

### Microsoft Outlook Setup

1. Go to the [Microsoft Azure Portal](https://portal.azure.com/)
2. Register a new application
3. Add th e Microsoft Graph API permission: `Calendars.Read`
4. Set the redirect URI to: `https://busybob.site/auth/microsoft/callback`
5. Copy the Client ID and Client Secret

## Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# Google OAuth (already configured for busybob.site)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Microsoft OAuth (for Outlook integration)
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
```

## Installation

1. Install the required dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `https://busybob.site`

## Usage

### Connecting Google Calendar

1. Navigate to the Calendar page in BusyBob
2. Click the settings gear icon in the calendar header
3. Click "Google Calendar" to connect
4. If you're already signed in with Google, it will use your existing session
5. If not, you'll be prompted to sign in with Google
6. Grant calendar access when prompted
7. Your Google Calendar events will appear on the calendar

### Connecting Outlook Calendar

1. Navigate to the Calendar page in BusyBob
2. Click the settings gear icon in the calendar header
3. Click "Outlook Calendar" to connect
4. Complete the Microsoft OAuth flow
5. Your Outlook Calendar events will appear on the calendar

### Calendar Management

- **Toggle Calendars**: Use the toggle switches to show/hide specific calendars
- **Remove Calendars**: Click the trash icon to remove a calendar connection
- **View Options**: Switch between Month, Week, and Day views
- **Event Indicators**: Events are shown as colored dots on calendar days

### Calendar Views

- **Month View**: Default view showing the full month with event indicators
- **Week View**: Coming soon - will show a detailed week view
- **Day View**: Coming soon - will show a detailed day view

## API Endpoints

The server provides the following endpoints for calendar integration:

- `GET /auth/google/callback` - Google OAuth callback
- `GET /auth/microsoft/callback` - Microsoft OAuth callback
- `GET /api/google/calendar` - Fetch Google Calendar events
- `GET /api/microsoft/calendar` - Fetch Outlook Calendar events
- `POST /api/google/refresh` - Refresh Google access tokens

## Security Notes

- OAuth credentials are stored securely on the server
- Access tokens are stored locally in the browser
- Refresh tokens are used to automatically renew access
- All API calls are proxied through the server for security
- Google integration leverages your existing Supabase OAuth setup

## Troubleshooting

### Common Issues

1. **"Please sign in with Google first"**
   - Make sure you're signed in with Google in BusyBob
   - Try signing out and signing back in with Google

2. **"Failed to connect Google Calendar"**
   - Check that the Google Calendar API is enabled in your Google Cloud Console
   - Ensure the calendar scope is included in your OAuth consent screen

3. **"Failed to connect Outlook Calendar"**
   - Check that your Azure app registration is correct
   - Ensure the Microsoft Graph API permission is granted
   - Verify the redirect URI matches exactly: `https://busybob.site/auth/microsoft/callback`

4. **Events not showing**
   - Check that the calendar is enabled in settings
   - Verify the access token hasn't expired
   - Check the browser console for error messages

### Debug Mode

Enable debug logging by adding this to your browser console:
```javascript
localStorage.setItem('calendarDebug', 'true')
```

## Future Features

- **Calendar Merge (Beta)**: Advanced merging of multiple calendars
- **Event Creation**: Create events directly from BusyBob
- **Recurring Events**: Better support for recurring calendar events
- **Calendar Sync**: Two-way sync between BusyBob tasks and calendar events
- **Import/Export**: Import calendar events as tasks and vice versa

## Support

If you encounter any issues with the calendar integration, please:

1. Check the browser console for error messages
2. Verify your OAuth credentials are correct
3. Ensure all required APIs are enabled
4. Check that your redirect URIs are properly configured

For additional help, refer to the official documentation:
- [Google Calendar API](https://developers.google.com/calendar)
- [Microsoft Graph API](https://docs.microsoft.com/en-us/graph/) 