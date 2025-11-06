# Google OAuth Scope Justification for TheFitChecked

## App Information
- **App Name**: TheFitChecked
- **App URL**: https://thefitchecked.com
- **Description**: AI-powered fashion and outfit planning application with calendar integration

## Requested OAuth Scopes

### 1. Google Calendar API (`https://www.googleapis.com/auth/calendar`)

**Why We Need This Scope:**

TheFitChecked is an outfit planning and fashion assistant app that helps users plan what to wear for upcoming events. The Google Calendar integration is a **core feature** of our app that allows users to:

1. **Sync Outfit Plans to Calendar**: Automatically add planned outfits as calendar events
2. **Event-Based Outfit Recommendations**: Generate outfit suggestions based on upcoming calendar events
3. **Smart Reminders**: Set reminders for outfit shopping before important events
4. **Visual Calendar View**: See outfit plans alongside other events in their Google Calendar

**How Users Benefit:**
- Never forget what to wear for important occasions
- Plan outfits days or weeks in advance
- See outfit plans in their regular calendar app (mobile, web, desktop)
- Coordinate outfits with travel, meetings, and social events

**What We Do With Calendar Access:**
- **CREATE**: Add outfit event entries when users save outfits to calendar
- **READ**: (Optional future feature) Fetch upcoming events to suggest outfits
- **UPDATE**: Modify outfit events if users change their outfit plans
- **DELETE**: Remove outfit events when users delete them

**What We DON'T Do:**
- L We do NOT read, modify, or delete events we didn't create
- L We do NOT access private event details unrelated to outfits
- L We do NOT share calendar data with third parties
- L We do NOT use calendar data for advertising or profiling

**User Control:**
- Calendar access is **100% optional** - users can use the app without connecting Google Calendar
- Users explicitly grant permission through Google OAuth consent screen
- Users can revoke access at any time through Google Account settings
- We clearly explain the calendar integration before users connect

**Technical Implementation:**
- Events are synced using Google Calendar v3 API
- OAuth tokens are securely stored in Supabase session
- Only events with outfit metadata are managed by our app
- All API calls use HTTPS encryption

**Compliance:**
- We comply with Google API Services User Data Policy
- We follow the Limited Use requirements
- Privacy Policy URL: https://thefitchecked.com/privacy
- Terms of Service URL: https://thefitchecked.com/terms

---

## Additional Context

### App Flow Example:

1. User creates avatar and generates outfit recommendations
2. User selects an outfit for "Dinner Party on Friday"
3. User clicks "Save to Calendar"
4. **If Google Calendar connected**: Outfit event automatically appears in Google Calendar
5. User opens Google Calendar on phone ’ Sees "Dinner Party" outfit with image/details
6. User receives reminder notification before the event

### Screenshot Descriptions for Verification:

**Screenshot 1**: Calendar Entry Modal
- Shows "Save to Calendar" interface
- User can select date, occasion, add notes
- Clear explanation: "Events will sync to Google Calendar"

**Screenshot 2**: Google Calendar Connection Status
- Shows connected/disconnected state
- Button to "Connect Google Calendar"
- Explanation of automatic sync feature

**Screenshot 3**: Calendar Event in Google Calendar
- Shows outfit event created by TheFitChecked
- Includes outfit details, occasion, date/time
- Demonstrates the synced calendar integration

---

## Privacy & Security

**Data We Store:**
- Outfit images and descriptions (user-generated)
- Calendar event metadata (title, date, description) for events we create
- OAuth access tokens (encrypted, Supabase-managed)

**Data We DON'T Store:**
- We do not store other users' calendar events
- We do not create profiles from calendar data
- We do not sell or share calendar information

**User Data Retention:**
- Users can delete their account and all data at any time
- Calendar events remain in Google Calendar unless user deletes them
- OAuth tokens are revoked when user disconnects calendar

---

## Contact Information

**Developer**: TheFitChecked Team
- Website: https://thefitchecked.com
- Privacy Policy: https://thefitchecked.com/privacy
- Terms of Service: https://thefitchecked.com/terms
- GitHub: https://github.com/dripped-bit/thefitchecked

---

## Verification Checklist

 Clear explanation of why Calendar scope is needed
 User benefit clearly communicated
 Privacy Policy published and accessible
 Terms of Service published and accessible
 Limited Use requirements followed
 User consent required before accessing calendar
 Users can revoke access at any time
 Minimal data collection principle followed
 No data sharing with third parties
 HTTPS encryption for all API calls

---

**Last Updated**: {current_date}
