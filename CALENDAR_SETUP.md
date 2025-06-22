# Calendar Integration Setup Guide

This guide will help you set up Google Calendar and Outlook Calendar integration for BusyBob.

## Features

- **Google Calendar Integration**: Connect your Google Calendar to view events alongside your tasks
- **Outlook Calendar Integration**: Connect your Outlook/Microsoft 365 Calendar
- **Multiple Calendar Support**: Connect multiple calendars and view them together
- **Modern UI**: Beautiful calendar interface with month/week/day views
- **Event Indicators**: Visual indicators for events on calendar days
- **Demo Mode**: Test the functionality without setting up OAuth credentials

## Demo Mode

The calendar integration includes a demo mode that allows you to test the functionality without setting up OAuth credentials. In demo mode:

1. Click the settings gear icon in the calendar header
2. Click "Google Calendar" or "Outlook Calendar" to add demo calendars
3. Demo events will be added to show how the integration works
4. You can toggle calendars on/off and remove them

## Setting Up OAuth Credentials

### Google Calendar Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Calendar API
4. Go to "Credentials" and create an OAuth 2.0 Client ID
5. Set the authorized redirect URI to: `http://localhost:3000/auth/google/callback`
6. Copy the Client ID and Client Secret

### Microsoft Outlook Setup

1. Go to the [Microsoft Azure Portal](https://portal.azure.com/)
2. Register a new application
3. Add the Microsoft Graph API permission: `Calendars.Read`
4. Set the redirect URI to: `http://localhost:3000/auth/microsoft/callback`
5. Copy the Client ID and Client Secret

## Environment Variables

Create a `.env` file in your project root with the following variables:

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
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

3. Open your browser and navigate to `http://localhost:3000`

## Usage

### Connecting Calendars

1. Navigate to the Calendar page in BusyBob
2. Click the settings gear icon in the calendar header
3. Click "Google Calendar" or "Outlook Calendar" to connect
4. Complete the OAuth flow in the popup window
5. Your calendar events will appear on the calendar

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

## Troubleshooting

### Common Issues

1. **"Failed to connect Google Calendar"**
   - Check that your OAuth credentials are correct
   - Ensure the redirect URI matches exactly
   - Verify the Google Calendar API is enabled

2. **"Failed to connect Outlook Calendar"**
   - Check that your Azure app registration is correct
   - Ensure the Microsoft Graph API permission is granted
   - Verify the redirect URI matches exactly

3. **Events not showing**
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