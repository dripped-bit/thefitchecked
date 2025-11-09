# 🔐 iOS Google OAuth Setup Guide for TheFitChecked

This guide shows you how to configure Google OAuth to work on iOS with Capacitor.

---

## 📋 Current Configuration

### ✅ What's Already Done

**Google OAuth Client ID** (Web):
```
194241679703-vv1d193c09tkadisnIs2vldiOvujr59.apps.googleusercontent.com
```

**Supabase Configuration**:
- URL: `https://scyprstpwxjxvnszoquy.supabase.co`
- OAuth provider: Google enabled
- Scopes: Google Calendar API access

**iOS Custom URL Scheme** (Already in Info.plist):
```xml
<key>CFBundleURLSchemes</key>
<array>
  <string>com.thefitchecked.app</string>
</array>
```

**Capacitor Plugins Installed**:
- ✅ `@capacitor/browser` - For OAuth flow
- ✅ `@capacitor/app` - For deep link handling

**Code Implementation**:
- ✅ `iOSAuth.ts` - iOS OAuth service
- ✅ `authService.ts` - Updated to use iOS flow
- ✅ `App.tsx` - Deep link handler for OAuth callback
- ✅ `appLifecycle.ts` - App lifecycle management

---

## 🚀 Setup Steps

### 1. Create iOS OAuth Client in Google Cloud Console

1. **Go to Google Cloud Console**:
   - https://console.cloud.google.com/apis/credentials

2. **Select your project** (or create one if needed)

3. **Click "Create Credentials" → "OAuth 2.0 Client ID"**

4. **Configure OAuth Client**:
   - **Application type**: iOS
   - **Name**: TheFitChecked iOS
   - **Bundle ID**: `com.thefitchecked.app`
     - ⚠️ **CRITICAL**: Bundle ID must match exactly what's in your Xcode project

5. **Copy the iOS Client ID** - You'll get something like:
   ```
   194241679703-xxxxxxxxxxxxxxxxx.apps.googleusercontent.com
   ```

6. **Add Authorized Redirect URIs** (click "Edit" on your **Web** OAuth client):
   - Keep existing: `http://localhost:5173`
   - Keep existing: `http://localhost:5173/auth/callback`
   - **Add new**: `https://scyprstpwxjxvnszoquy.supabase.co/auth/v1/callback`
   - **Add new (iOS)**: `com.thefitchecked.app://oauth/callback`

---

### 2. Configure Supabase for iOS OAuth

1. **Go to Supabase Dashboard**:
   - https://supabase.com/dashboard/project/scyprstpwxjxvnszoquy

2. **Navigate to Authentication → URL Configuration**

3. **Add Redirect URLs**:
   - Click "Add URL"
   - Add: `com.thefitchecked.app://oauth/callback`
   - This allows Supabase to redirect back to your iOS app

4. **Update Site URL** (if needed):
   - Development: `http://localhost:5173`
   - Production: `https://thefitchecked.com`

5. **Configure Google Provider**:
   - Go to: Authentication → Providers → Google
   - **Client ID**: Your **WEB** OAuth client ID (not iOS)
     ```
     194241679703-vv1d193c09tkadisnIs2vldiOvujr59.apps.googleusercontent.com
     ```
   - **Client Secret**: Your Google OAuth client secret
   - **Authorized Client IDs**: Add your **iOS** OAuth client ID here
     ```
     194241679703-xxxxxxxxxxxxxxxxx.apps.googleusercontent.com
     ```
   - Enable "Google provider enabled"
   - Save changes

---

### 3. Verify iOS Bundle ID in Xcode

1. **Open Xcode**:
   ```bash
   cd ~/Developer/fit-checked-app
   npx cap open ios
   ```

2. **Select App target** in Project Navigator

3. **Check Bundle Identifier** under "Signing & Capabilities":
   - Should be: `com.thefitchecked.app`
   - ⚠️ If different, update Google Cloud Console to match

4. **Verify URL Scheme** under "Info" tab:
   - Should see: `com.thefitchecked.app` in URL Types
   - Already configured in Info.plist ✅

---

### 4. Add iOS Client ID to .env (Optional)

If you want to reference the iOS OAuth client ID in your code:

**Edit `.env.local`**:
```bash
# Google OAuth - Web Client (existing)
VITE_GOOGLE_CLIENT_ID="194241679703-vv1d193c09tkadisnIs2vldiOvujr59.apps.googleusercontent.com"

# Google OAuth - iOS Client (new)
VITE_GOOGLE_IOS_CLIENT_ID="194241679703-xxxxxxxxxxxxxxxxx.apps.googleusercontent.com"
```

Note: For Supabase OAuth, you don't need to use the iOS client ID in your app code - it's configured server-side in Supabase.

---

### 5. Sync Capacitor and Build

```bash
cd ~/Developer/fit-checked-app

# Sync iOS changes
npx cap sync ios

# Build the app
npm run build

# Open in Xcode to test
npx cap open ios
```

---

## 🧪 Testing OAuth on iOS

### 1. Run on iPhone/Simulator

1. **Open Xcode**: `npx cap open ios`
2. **Select target device**: iPhone or Simulator
3. **Press Cmd+R** to build and run

### 2. Test OAuth Flow

1. **Open app on iPhone**
2. **Tap "Sign in with Google"** button
3. **Should see**:
   - ✅ In-app browser opens with Google sign-in
   - ✅ Google OAuth consent screen appears
   - ✅ After approving, browser closes automatically
   - ✅ You're signed in to the app

4. **Check Console Logs** (in Xcode):
   ```
   🍎 [iOS Auth] Starting Google OAuth...
   🌐 [iOS Auth] Opening OAuth URL in browser...
   📍 [iOS Auth] Redirect URL: com.thefitchecked.app://oauth/callback
   ✅ [iOS Auth] Browser opened - waiting for callback
   🔗 [APP] Deep link received: com.thefitchecked.app://oauth/callback?code=...
   🔐 [APP] OAuth callback deep link detected
   ✅ [iOS Auth] Authorization code received
   ✅ [iOS Auth] OAuth successful! User: user@example.com
   ✅ [APP] OAuth callback handled successfully
   ```

### 3. Troubleshooting

**Problem**: Browser opens but doesn't redirect back to app
- **Solution**: Check Bundle ID matches Google Cloud Console exactly
- **Solution**: Verify URL scheme in Info.plist: `com.thefitchecked.app`

**Problem**: "Redirect URI mismatch" error
- **Solution**: Add `com.thefitchecked.app://oauth/callback` to:
  - Google Cloud Console → Web OAuth client → Authorized redirect URIs
  - Supabase Dashboard → Authentication → URL Configuration → Redirect URLs

**Problem**: "Invalid client" error
- **Solution**: Verify iOS OAuth client ID is added to Supabase → Google Provider → Authorized Client IDs

**Problem**: Browser doesn't close after OAuth
- **Solution**: Check deep link handler in App.tsx is running
- **Solution**: Check Capacitor Browser plugin is installed: `npm ls @capacitor/browser`

---

## 📝 How It Works

### OAuth Flow Diagram

```
1. User taps "Sign in with Google"
   ↓
2. authService.signInWithGoogle() detects iOS
   ↓
3. iOSAuth.signInWithGoogleIOS() called
   ↓
4. Supabase generates OAuth URL with iOS redirect
   ↓
5. Capacitor Browser opens Google OAuth
   ↓
6. User approves permissions
   ↓
7. Google redirects to: com.thefitchecked.app://oauth/callback?code=xxx
   ↓
8. iOS catches deep link (appLifecycle.ts)
   ↓
9. App.tsx onDeepLink handler receives URL
   ↓
10. iOSAuth.handleOAuthCallback(url) processes code
    ↓
11. Supabase exchanges code for session
    ↓
12. Browser closes, user is signed in ✅
```

### Code Flow

**Sign In** (`authService.ts:94-107`):
```tsx
async signInWithGoogle() {
  if (iOS) {
    return iOSAuth.signInWithGoogleIOS();
  }
  // Web flow...
}
```

**iOS OAuth** (`iOSAuth.ts:48-86`):
```tsx
async signInWithGoogleIOS() {
  // Get OAuth URL with iOS redirect
  const { data } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    redirectTo: 'com.thefitchecked.app://oauth/callback',
    skipBrowserRedirect: true,
  });

  // Open in Capacitor Browser
  await Browser.open({ url: data.url });
}
```

**Deep Link Handler** (`App.tsx:209-227`):
```tsx
appLifecycle.onDeepLink(async (url) => {
  if (url.includes('oauth/callback')) {
    const result = await iOSAuth.handleOAuthCallback(url);

    if (result.success) {
      const user = await authService.getCurrentUser();
      setAuthUser(user);
    }
  }
});
```

**Callback Handler** (`iOSAuth.ts:93-160`):
```tsx
async handleOAuthCallback(url) {
  await Browser.close();

  const code = new URL(url).searchParams.get('code');

  // Supabase automatically handles code exchange
  const { data: { session } } = await supabase.auth.getSession();

  return { success: !!session };
}
```

---

## 🔒 Security Considerations

### ✅ What's Secure

- **Custom URL Scheme**: `com.thefitchecked.app` is unique to your app
- **In-App Browser**: Uses Capacitor Browser (SFSafariViewController on iOS) which is secure
- **OAuth Code Flow**: Uses authorization code, not implicit flow
- **Supabase Handles Tokens**: Your app never sees client secret
- **HTTPS Required**: OAuth redirects use HTTPS (Supabase endpoint)

### ⚠️ Important Security Notes

1. **Never commit client secrets** to Git
   - Web OAuth client secret goes in Supabase dashboard only
   - Don't add to .env files in the repo

2. **Custom URL Scheme Limitations**:
   - iOS custom URL schemes are not as secure as Universal Links
   - For production, consider implementing Universal Links (e.g., `https://thefitchecked.com/oauth/callback`)

3. **Authorized Client IDs**:
   - Always add iOS OAuth client ID to Supabase's "Authorized Client IDs"
   - This prevents other apps from using your OAuth flow

---

## 📊 Comparison: Web vs iOS OAuth

| Feature | Web OAuth | iOS OAuth (Capacitor) |
|---------|-----------|----------------------|
| **Browser** | System browser | In-app browser (SFSafariViewController) |
| **Redirect URL** | `http://localhost:5173/auth/callback` | `com.thefitchecked.app://oauth/callback` |
| **OAuth Client** | Web OAuth client | iOS OAuth client (+ Web for Supabase) |
| **Deep Linking** | None (page navigation) | Custom URL scheme |
| **Auto-Close** | Manual navigation | Automatic via deep link |
| **Security** | HTTPS required | Custom URL scheme |
| **User Experience** | Tab switching | Stays in app |

---

## 🎉 Next Steps After Setup

Once OAuth is working on iOS:

### 1. Test on Real Device
- Build to physical iPhone (not just simulator)
- Test with real Google account
- Verify Calendar API permissions work

### 2. Add Apple Sign In (Optional)
- Already configured in authService.ts
- Just need Apple Developer account setup
- Similar flow to Google OAuth

### 3. Implement Universal Links (Production)
- More secure than custom URL scheme
- Better user experience
- Required for App Store submission

### 4. Add OAuth to Onboarding
- Show "Sign in with Google" on welcome screen
- Explain benefits (save outfits, sync calendar)
- Add haptic feedback to OAuth button

---

## 📚 Resources

**Google OAuth Documentation**:
- https://developers.google.com/identity/protocols/oauth2/native-app

**Supabase OAuth Guide**:
- https://supabase.com/docs/guides/auth/social-login/auth-google

**Capacitor Browser Plugin**:
- https://capacitorjs.com/docs/apis/browser

**Capacitor Deep Linking**:
- https://capacitorjs.com/docs/guides/deep-links

**iOS URL Schemes**:
- https://developer.apple.com/documentation/xcode/defining-a-custom-url-scheme-for-your-app

---

## ✅ Checklist

Before testing, ensure:

- [ ] Google Cloud Console: iOS OAuth client created with Bundle ID `com.thefitchecked.app`
- [ ] Google Cloud Console: Web OAuth client has redirect URI `https://scyprstpwxjxvnszoquy.supabase.co/auth/v1/callback`
- [ ] Google Cloud Console: Web OAuth client has redirect URI `com.thefitchecked.app://oauth/callback`
- [ ] Supabase: Google provider configured with Web OAuth client ID + secret
- [ ] Supabase: iOS OAuth client ID added to "Authorized Client IDs"
- [ ] Supabase: Redirect URL `com.thefitchecked.app://oauth/callback` added
- [ ] Xcode: Bundle ID is `com.thefitchecked.app`
- [ ] Xcode: URL Scheme `com.thefitchecked.app` in Info.plist (✅ already done)
- [ ] Terminal: `npm install @capacitor/browser` (✅ already done)
- [ ] Terminal: `npx cap sync ios` (run before testing)
- [ ] Code: App.tsx has deep link handler (✅ already done)
- [ ] Code: authService.ts uses iOS flow (✅ already done)

---

## 🐛 Debug Mode

To see detailed OAuth logs on iOS:

**In Xcode Console**, filter for:
- `[iOS Auth]` - OAuth flow events
- `[APP]` - Deep link handling
- `[AUTH]` - Supabase auth events

Enable verbose logging in `iOSAuth.ts` by uncommenting debug statements.

---

Generated: $(date)
App: TheFitChecked
Platform: iOS (Capacitor)
OAuth Provider: Google
Auth Service: Supabase
