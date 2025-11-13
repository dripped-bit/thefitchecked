# Outfit Reminder System - Setup Guide

## 📋 Overview

Complete integration guide for the outfit reminder system with push notifications.

---

## 🎯 Architecture

```
React App (Capacitor) ↔️ Supabase Database ↔️ Vercel Edge Functions
                      ↕️
            Apple Push Notification Service (APNs)
```

---

## ✅ Step 1: Database Setup (Supabase)

### 1.1 Run the Migration

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `supabase-migrations/outfit_reminders.sql`
3. Execute the SQL
4. Verify tables created:
   - `occasions`
   - `device_tokens`
   - `notification_history`

### 1.2 Verify RLS Policies

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('occasions', 'device_tokens', 'notification_history');
```

---

## 📱 Step 2: iOS Configuration (Xcode)

### 2.1 Enable Push Notifications Capability

1. Open your project in Xcode: `npx cap open ios`
2. Select your app target
3. Go to **Signing & Capabilities**
4. Click **+ Capability**
5. Add **Push Notifications**
6. Add **Background Modes** → Enable **Remote notifications**

### 2.2 Update Info.plist

Your Info.plist should already have:
```xml
<key>NSUserNotificationsUsageDescription</key>
<string>We need notifications to remind you about your upcoming occasions and outfit planning</string>
```

### 2.3 Update AppDelegate.swift

Navigate to `ios/App/App/AppDelegate.swift` and ensure it includes:

```swift
import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Register for remote notifications
        UNUserNotificationCenter.current().delegate = self
        return true
    }

    // Handle APNs registration
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
        print("📱 [APNs] Device Token: \(token)")

        // Notify Capacitor
        NotificationCenter.default.post(name: Notification.Name("didRegisterForRemoteNotificationsWithDeviceToken"), object: deviceToken)
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        print("❌ [APNs] Failed to register: \(error.localizedDescription)")
    }

    // Rest of AppDelegate...
}

extension AppDelegate: UNUserNotificationCenterDelegate {
    // Handle notifications when app is in foreground
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                willPresent notification: UNNotification,
                                withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([.banner, .sound, .badge])
    }
}
```

---

## 🔐 Step 3: Apple Push Notification Service (APNs) Setup

### 3.1 Create APNs Authentication Key

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Click **Keys** in the sidebar
4. Click the **+** button to create a new key
5. Name it "FitChecked APNs Key"
6. Check **Apple Push Notifications service (APNs)**
7. Click **Continue** → **Register** → **Download**

**IMPORTANT:** Save the `.p8` file securely. You can only download it once!

### 3.2 Note Your Credentials

After creating the key, note down:
- **Key ID**: 10-character string (e.g., `ABC123DEFG`)
- **Team ID**: Found in top-right of developer portal (e.g., `XYZ456HIJK`)
- **Bundle ID**: Your app's bundle identifier (e.g., `com.fitchecked.app`)

---

## 🚀 Step 4: Vercel Edge Function (Optional - for server-side push)

If you want server-side push notifications (recommended for production):

### 4.1 Create Edge Function

Create `vercel-backend/api/notifications/send-reminder.ts`:

```typescript
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Get occasions needing reminders
    const { data: occasions, error } = await supabase
      .rpc('get_occasions_needing_reminders');

    if (error) throw error;

    console.log(`📬 Found ${occasions?.length || 0} reminders to send`);

    // Send push notifications using APNs
    // Implementation depends on your APNs setup
    // You can use libraries like 'node-apn' or 'apn'

    return new Response(
      JSON.stringify({
        success: true,
        count: occasions?.length || 0
      }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Failed to send reminders:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
}
```

### 4.2 Add to vercel.json

```json
{
  "crons": [
    {
      "path": "/api/notifications/send-reminder",
      "schedule": "0 9 * * *"
    }
  ]
}
```

### 4.3 Set Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```bash
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
APNS_KEY_ID=your-apns-key-id
APNS_TEAM_ID=your-team-id
APNS_TOPIC=your-bundle-id
CRON_SECRET=generate-random-secret
```

---

## 🧪 Step 5: Testing

### 5.1 Initialize the Service

In your `App.tsx` or main component:

```typescript
import { useEffect } from 'react';
import { outfitReminderService } from './services/outfitReminderService';

function App() {
  useEffect(() => {
    // Initialize on app startup
    outfitReminderService.initialize();
  }, []);

  return (
    // Your app content
  );
}
```

### 5.2 Test Creating an Occasion

```typescript
import { outfitReminderService } from './services/outfitReminderService';

// Create a test occasion
const occasion = await outfitReminderService.createOccasion({
  name: 'Test Wedding',
  date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
  type: 'wedding',
  reminder_days: [7, 3, 1],
  outfit_purchased: false,
  location: 'Test Venue'
});

console.log('Occasion created:', occasion);
```

### 5.3 Check Pending Notifications

```typescript
import { pushNotificationService } from './services/pushNotificationService';

const pending = await pushNotificationService.getPendingNotifications();
console.log('Pending notifications:', pending);
```

### 5.4 Test on Physical Device

**IMPORTANT:** Push notifications don't work on iOS Simulator!

1. Build to physical device: `npm run build && npx cap sync ios`
2. Open Xcode: `npx cap open ios`
3. Select your device in Xcode
4. Run the app (⌘R)
5. Grant notification permission when prompted
6. Check console for device token
7. Create a test occasion
8. Verify notification is scheduled

---

## 📊 Step 6: Monitor & Debug

### 6.1 Check Device Token Registration

```sql
SELECT * FROM device_tokens WHERE user_id = 'your-user-id';
```

### 6.2 Check Scheduled Occasions

```sql
SELECT
  id,
  name,
  date,
  reminder_days,
  outfit_purchased,
  created_at
FROM occasions
WHERE user_id = 'your-user-id'
ORDER BY date ASC;
```

### 6.3 Test Reminder Query

```sql
SELECT * FROM get_occasions_needing_reminders();
```

### 6.4 Console Logs to Watch

```
✅ [OUTFIT-REMINDER] Service initialized
📱 [APNs] Device Token: <token>
✅ [OUTFIT-REMINDER] Device token registered
✅ [OUTFIT-REMINDER] Occasion created: <name>
✅ [OUTFIT-REMINDER] Scheduled X reminders for <name>
```

---

## 🔧 Troubleshooting

### Problem: No device token received

**Solution:**
- Ensure Push Notifications capability is enabled in Xcode
- Check you're testing on a physical device (not simulator)
- Verify Apple Developer account has push notification entitlements
- Check Xcode console for registration errors

### Problem: Notifications not scheduling

**Solution:**
- Verify `reminder_days` array is not empty
- Check occasion date is in the future
- Verify notification permission was granted
- Check console logs for errors

### Problem: Push notifications not received

**Solution:**
- Verify APNs credentials are correct
- Check device token is registered in database
- Ensure app is properly signed with valid provisioning profile
- Check notification payload format is correct

---

## 🎨 Next Steps

### UI Components to Build

1. **Occasions List View** - Display all upcoming occasions
2. **Add Occasion Form** - Create new occasions with date picker
3. **Occasion Detail View** - View/edit occasion details
4. **Dashboard Widget** - Show upcoming reminders and stats
5. **Settings Panel** - Manage notification preferences

### Example Component Usage

```typescript
import { outfitReminderService, Occasion } from '../services/outfitReminderService';

function OccasionsPage() {
  const [occasions, setOccasions] = useState<Occasion[]>([]);

  useEffect(() => {
    loadOccasions();
  }, []);

  const loadOccasions = async () => {
    const data = await outfitReminderService.getUpcomingOccasions();
    setOccasions(data);
  };

  return (
    <div>
      <h1>Upcoming Occasions</h1>
      {occasions.map(occasion => (
        <div key={occasion.id}>
          <h3>{occasion.name}</h3>
          <p>{new Date(occasion.date).toLocaleDateString()}</p>
          <p>Type: {occasion.type}</p>
          {!occasion.outfit_purchased && (
            <button onClick={() => markPurchased(occasion.id!)}>
              Mark Outfit Purchased
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## ✅ Checklist

- [ ] Database tables created in Supabase
- [ ] RLS policies verified
- [ ] Push Notifications capability enabled in Xcode
- [ ] Background Modes enabled
- [ ] APNs key created and credentials saved
- [ ] Device token registration working
- [ ] Local notifications scheduling correctly
- [ ] Tested on physical iOS device
- [ ] Vercel edge function deployed (optional)
- [ ] Environment variables configured

---

## 📚 Resources

- [Capacitor Push Notifications Docs](https://capacitorjs.com/docs/apis/push-notifications)
- [Apple Push Notification Service](https://developer.apple.com/documentation/usernotifications)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)

---

## 🆘 Support

If you encounter issues:
1. Check Xcode console for errors
2. Verify Supabase logs
3. Test SQL queries in Supabase SQL Editor
4. Check Capacitor documentation for platform-specific issues
