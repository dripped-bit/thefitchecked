# ✅ iOS OAuth Final Configuration

## 🎯 Configuration Complete

Your TheFitChecked app now has **iOS-specific Google OAuth Client ID** configured!

---

## 📝 Updated Files

### 1. **`.env.local`** - OAuth Client IDs

```env
# Web OAuth Client (original)
VITE_GOOGLE_CLIENT_ID="194241679703-vv1d193c09tkadisnIs2vldiOvujr59.apps.googleusercontent.com"

# iOS OAuth Client (NEW!)
VITE_GOOGLE_CLIENT_ID_IOS="94241679703-a6pv8kse35ajm9c3se0dvjd7h04ntqrm.apps.googleusercontent.com"

# Google API Key (unchanged)
VITE_GOOGLE_API_KEY="AIzaSyAHrKKLJpq7AMNY0oT0ypmClRfrbwCYWrc"
```

### 2. **`src/utils/iOSAuth.ts`** - Platform Detection

**New Method Added**:
```typescript
/**
 * Get the correct Google OAuth Client ID for the current platform
 */
getGoogleClientID(): string {
  if (this.isNative && Capacitor.getPlatform() === 'ios') {
    // iOS OAuth client ID
    return import.meta.env.VITE_GOOGLE_CLIENT_ID_IOS || import.meta.env.VITE_GOOGLE_CLIENT_ID;
  }
  // Web OAuth client ID
  return import.meta.env.VITE_GOOGLE_CLIENT_ID;
}
```

**How It Works**:
- On **iOS**: Returns `VITE_GOOGLE_CLIENT_ID_IOS`
- On **Web**: Returns `VITE_GOOGLE_CLIENT_ID`
- Fallback: Uses web client ID if iOS client ID not found

---

## 🔑 OAuth Client IDs Configured

### Web OAuth Client
**Client ID**: `194241679703-vv1d193c09tkadisnIs2vldiOvujr59.apps.googleusercontent.com`

**Platform**: Web (browser)

**Redirect URIs** (must be configured in Google Cloud Console):
- `http://localhost:5173/auth/callback` (development)
- `https://scyprstpwxjxvnszoquy.supabase.co/auth/v1/callback` (Supabase)
- `com.thefitchecked.app://oauth/callback` (iOS deep link)

**Used by**:
- Web app (localhost, production web)
- Supabase server-side OAuth

### iOS OAuth Client
**Client ID**: `94241679703-a6pv8kse35ajm9c3se0dvjd7h04ntqrm.apps.googleusercontent.com`

**Platform**: iOS (native)

**Bundle ID**: `com.thefitchecked.app`

**Used by**:
- iOS native app (iPhone/iPad)
- Validated server-side by Supabase

**Must be added to Supabase**:
- Dashboard → Authentication → Providers → Google
- Section: "Authorized Client IDs"
- Add: `94241679703-a6pv8kse35ajm9c3se0dvjd7h04ntqrm.apps.googleusercontent.com`

---

## 🚀 OAuth Flow by Platform

### **On Web** (localhost or production):
1. User clicks "Sign in with Google"
2. `authService.signInWithGoogle()` detects web platform
3. Uses **Web OAuth client ID**
4. Redirects to: `${window.location.origin}/auth/callback`
5. Supabase exchanges code for session
6. User signed in ✅

### **On iOS** (iPhone/iPad):
1. User taps "Sign in with Google"
2. `authService.signInWithGoogle()` detects iOS platform
3. `iOSAuth.signInWithGoogleIOS()` called
4. Opens Google OAuth in Capacitor Browser
5. Uses **iOS OAuth client ID** (validated by Supabase)
6. Redirects to: `com.thefitchecked.app://oauth/callback`
7. iOS catches deep link
8. `iOSAuth.handleOAuthCallback()` processes
9. Supabase exchanges code for session
10. Browser closes automatically
11. User signed in ✅

---

## 📋 Supabase Configuration Checklist

### ✅ Already Configured
- [x] Web OAuth client ID in Supabase Google provider
- [x] Client secret in Supabase Google provider

### ⚠️ Still Need to Configure

Go to: https://supabase.com/dashboard/project/scyprstpwxjxvnszoquy

#### 1. **Add Redirect URLs**
- Path: Authentication → URL Configuration
- Click "Add URL"
- Add these URLs:
  - ✅ `http://localhost:5173/auth/callback` (may already exist)
  - ✅ `https://scyprstpwxjxvnszoquy.supabase.co/auth/v1/callback` (may already exist)
  - ⚠️ `com.thefitchecked.app://oauth/callback` **← ADD THIS**
  - ⚠️ `capacitor://localhost` **← ADD THIS** (optional but recommended)

#### 2. **Add iOS OAuth Client ID to Authorized Clients**
- Path: Authentication → Providers → Google
- Scroll to: "Authorized Client IDs"
- Click "Add Client ID"
- Add: `94241679703-a6pv8kse35ajm9c3se0dvjd7h04ntqrm.apps.googleusercontent.com`
- Save changes

---

## 🔒 Google Cloud Console Configuration

### ✅ Already Done
- [x] Web OAuth client created
- [x] iOS OAuth client created with Bundle ID: `com.thefitchecked.app`

### ⚠️ Verify These Settings

Go to: https://console.cloud.google.com/apis/credentials

#### **Web OAuth Client** (Edit your existing web client)
**Authorized redirect URIs** should include:
- ✅ `http://localhost:5173/auth/callback`
- ⚠️ `https://scyprstpwxjxvnszoquy.supabase.co/auth/v1/callback` **← VERIFY**
- ⚠️ `com.thefitchecked.app://oauth/callback` **← VERIFY**

#### **iOS OAuth Client**
- Application type: **iOS**
- Bundle ID: `com.thefitchecked.app` **← VERIFY EXACT MATCH**
- Client ID: `94241679703-a6pv8kse35ajm9c3se0dvjd7h04ntqrm.apps.googleusercontent.com`

---

## 🧪 Testing

### **1. Test on Web First**
```bash
cd ~/Developer/fit-checked-app
npm run dev
```
- Open http://localhost:5173
- Click "Sign in with Google"
- Should redirect to Google OAuth
- Should redirect back to app
- Should be signed in ✅

### **2. Test on iOS**
```bash
cd ~/Developer/fit-checked-app
npx cap open ios
```
- Press Cmd+R in Xcode
- Tap "Sign in with Google"
- In-app browser should open
- Sign in with Google account
- Browser should close automatically
- Should be signed in ✅

### **3. Check Console Logs (iOS)**

In Xcode Console, look for:
```
🍎 [iOS Auth] Starting Google OAuth...
🌐 [iOS Auth] Opening OAuth URL in browser...
📍 [iOS Auth] Redirect URL: com.thefitchecked.app://oauth/callback
✅ [iOS Auth] Browser opened - waiting for callback
🔗 [APP] Deep link received: com.thefitchecked.app://oauth/callback?code=...
🔐 [APP] OAuth callback deep link detected
✅ [iOS Auth] Authorization code received
✅ [iOS Auth] OAuth successful! User: your-email@gmail.com
✅ [APP] OAuth callback handled successfully
```

---

## 🐛 Troubleshooting

### **Problem**: "Invalid client" error on iOS
**Solution**: Add iOS OAuth client ID to Supabase "Authorized Client IDs"

### **Problem**: "Redirect URI mismatch"
**Solution**:
1. Verify `com.thefitchecked.app://oauth/callback` is in:
   - Google Cloud Console → Web OAuth client → Authorized redirect URIs
   - Supabase → Authentication → URL Configuration → Redirect URLs

### **Problem**: Browser doesn't close after OAuth
**Solution**:
1. Check deep link handler is running in App.tsx
2. Verify URL scheme in Info.plist: `com.thefitchecked.app`
3. Check Bundle ID matches exactly: `com.thefitchecked.app`

### **Problem**: OAuth works on web but not iOS
**Solution**:
1. Rebuild and sync: `npm run build && npx cap sync ios`
2. Clean build in Xcode: Product → Clean Build Folder
3. Restart Xcode and rebuild

---

## 📊 Client ID Usage Summary

| Platform | Client ID Used | Where It's Used | Validated By |
|----------|---------------|-----------------|--------------|
| **Web (localhost)** | Web Client ID | Browser redirect | Supabase |
| **Web (production)** | Web Client ID | Browser redirect | Supabase |
| **iOS (native)** | iOS Client ID | Deep link callback | Supabase |

**Important**:
- The iOS client ID is NOT sent from your app code
- Supabase validates it server-side using "Authorized Client IDs"
- Your app only sends the redirect URL (`com.thefitchecked.app://oauth/callback`)
- Supabase checks if the OAuth request came from an authorized iOS client

---

## ✅ Final Checklist

Before testing OAuth on iOS, ensure:

### Google Cloud Console:
- [ ] iOS OAuth client exists with Bundle ID: `com.thefitchecked.app`
- [ ] Web OAuth client has redirect URI: `https://scyprstpwxjxvnszoquy.supabase.co/auth/v1/callback`
- [ ] Web OAuth client has redirect URI: `com.thefitchecked.app://oauth/callback`

### Supabase Dashboard:
- [ ] Redirect URL added: `com.thefitchecked.app://oauth/callback`
- [ ] Redirect URL added: `capacitor://localhost` (optional)
- [ ] iOS OAuth client ID in "Authorized Client IDs": `94241679703-a6pv8kse35ajm9c3se0dvjd7h04ntqrm.apps.googleusercontent.com`

### Xcode:
- [ ] Bundle ID is: `com.thefitchecked.app`
- [ ] URL Scheme is: `com.thefitchecked.app` (already in Info.plist)

### Local Environment:
- [ ] `.env.local` has both client IDs
- [ ] Built: `npm run build`
- [ ] Synced: `npx cap sync ios`

---

## 🎉 You're Ready!

Your app now has:
- ✅ iOS-specific OAuth client ID
- ✅ Platform detection (iOS vs Web)
- ✅ Automatic OAuth routing
- ✅ Deep link handling
- ✅ Proper redirect URLs

**Next Step**: Configure Supabase (add redirect URLs + iOS client ID), then test on iPhone!

---

Generated: $(date)
Status: ✅ Code Complete + Client IDs Configured
Platform: iOS + Web
OAuth Provider: Google
Auth Backend: Supabase
