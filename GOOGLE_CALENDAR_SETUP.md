# Google Calendar Integration Setup Guide

This guide will walk you through setting up Google Calendar OAuth integration for your Fit Checked app.

## Prerequisites

- Google account
- Google Cloud Console access
- Your app running locally at `http://localhost:5173`

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Enter project name: `Fit Checked App`
4. Click **Create**

## Step 2: Enable Google Calendar API

1. In your project dashboard, go to **APIs & Services** → **Library**
2. Search for "Google Calendar API"
3. Click on **Google Calendar API**
4. Click **Enable**

## Step 3: Create OAuth 2.0 Credentials

### Create OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** user type
3. Click **Create**
4. Fill in the required fields:
   - **App name**: Fit Checked
   - **User support email**: your email
   - **Developer contact information**: your email
5. Click **Save and Continue**
6. **Scopes**: Click **Add or Remove Scopes**
   - Add: `https://www.googleapis.com/auth/calendar.readonly`
7. Click **Save and Continue**
8. **Test users**: Add your Google email as a test user
9. Click **Save and Continue**

### Create OAuth Client ID

1. Go to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth client ID**
3. Choose **Web application**
4. Name it: `Fit Checked Web Client`
5. Add **Authorized JavaScript origins**:
   ```
   http://localhost:5173
   ```
6. Add **Authorized redirect URIs**:
   ```
   http://localhost:5173
   ```
7. Click **Create**
8. **Copy** the Client ID that appears

### Create API Key

1. In **Credentials** page, click **+ Create Credentials** → **API key**
2. **Copy** the API key
3. (Optional) Click **Restrict Key**:
   - **Application restrictions**: HTTP referrers
   - Add: `http://localhost:5173/*`
   - **API restrictions**: Restrict key → Select **Google Calendar API**
4. Click **Save**

## Step 4: Update Environment Variables

1. Open `.env.local` in your project root
2. Replace the placeholder values:

```env
VITE_GOOGLE_CLIENT_ID="your-actual-client-id-here.apps.googleusercontent.com"
VITE_GOOGLE_API_KEY="your-actual-api-key-here"
```

3. Save the file
4. Restart your development server:
```bash
npm run dev
```

## Step 5: Test the Integration

1. Navigate to **Smart Calendar** in your app
2. Click on **Settings** (gear icon)
3. Click **Connect Google Calendar**
4. Sign in with your Google account
5. Grant calendar read permissions
6. Your Google Calendar events should now sync!

## Troubleshooting

### "Access blocked: This app's request is invalid"
- Make sure your OAuth consent screen is properly configured
- Verify that your email is added as a test user
- Check that the redirect URIs match exactly

### "API key not valid"
- Ensure the API key is correctly copied to `.env.local`
- Verify the API key has Google Calendar API enabled
- Check that HTTP referrer restrictions include your localhost URL

### Events not syncing
- Check browser console for errors
- Verify calendar connection status in Settings
- Try disconnecting and reconnecting
- Ensure you granted calendar.readonly scope

### "Origin not allowed"
- Add `http://localhost:5173` to Authorized JavaScript origins
- Make sure there are no trailing slashes

## Security Notes

- **Never commit** `.env.local` to Git (already in `.gitignore`)
- API keys are restricted to localhost for development
- For production, update authorized origins to your production domain
- Consider moving API calls to a backend server for enhanced security

## Features

Once connected, the app will:
- Sync upcoming events (next 60 days) from your primary Google Calendar
- Auto-categorize events (work, personal, travel, formal, casual)
- Generate AI outfit suggestions based on calendar events
- Provide weather-appropriate clothing recommendations
- Track outfit history for style learning

## Production Deployment

For production:

1. Update **OAuth consent screen** to Production
2. Add production domain to **Authorized JavaScript origins**:
   ```
   https://yourdomain.com
   ```
3. Add production domain to **Authorized redirect URIs**:
   ```
   https://yourdomain.com
   ```
4. Update API key restrictions to production domain
5. Set production environment variables in your hosting platform

## Support

For issues specific to Google Calendar API:
- [Google Calendar API Documentation](https://developers.google.com/calendar/api/guides/overview)
- [OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)

For app-specific issues:
- Check the browser console for detailed error messages
- Verify all environment variables are set correctly
- Ensure you're using the latest version of the app
