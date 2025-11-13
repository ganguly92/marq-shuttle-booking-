# 🔥 Firebase Setup Checklist - MARQ Shuttle

## ✅ Quick Verification Steps

### **1. Firebase Project Setup**
- [ ] Created Firebase project at https://console.firebase.google.com/
- [ ] Enabled Firestore Database
- [ ] Set location (e.g., asia-southeast1)

### **2. Security Rules**
- [ ] Go to Firestore Database → Rules tab
- [ ] Added the rules for `bookings`, `trips`, `stats` collections
- [ ] Clicked "Publish" button
- [ ] Rules status shows "published successfully"

### **3. App Configuration**
- [ ] Got Firebase config from Project Settings → General → Web app
- [ ] Copied config values (apiKey, projectId, etc.)
- [ ] Updated `firebase.js` file with real values (not "YOUR_API_KEY_HERE")

### **4. Code Integration**
- [ ] Firebase SDK scripts added to `index.html`
- [ ] `firebase.js` file included before `script.js`
- [ ] `saveBookingsToFirebase()` function called in booking submission

### **5. Test Firebase Connection**
- [ ] Open booking form
- [ ] Press F12 → Console
- [ ] Look for: "🔥 Firebase initialized successfully"
- [ ] Submit test booking
- [ ] Check console for: "✅ Booking [ID] saved to Firebase"

### **6. Verify Data in Firebase**
- [ ] Go to Firebase Console → Firestore Database → Data tab
- [ ] After test booking, see `bookings`, `trips`, `stats` collections
- [ ] Check that booking data appears correctly

## 🎯 Quick Status Check

Run this in browser console after opening your booking form:
```javascript
console.log("Firebase enabled:", isFirebaseEnabled);
console.log("Config valid:", firebaseConfig.apiKey !== "YOUR_API_KEY_HERE");
```

Expected result:
```
Firebase enabled: true
Config valid: true
```

## ⚠️ Common Issues

| Problem | Solution |
|---------|----------|
| "Firebase not configured" | Update `firebase.js` with real config values |
| "Permission denied" | Publish security rules properly |
| Collections not appearing | Submit a test booking first |
| Console errors | Check F12 console for specific error messages |

**Status: Ready when all boxes checked ✅**