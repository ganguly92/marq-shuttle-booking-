# Firebase Verification Commands

## 🔍 Console Commands to Check Firebase Data

After submitting a booking, open browser console (F12) and run these commands:

### **1. Check Firebase Connection Status**
```javascript
console.log("Firebase enabled:", isFirebaseEnabled);
console.log("Database object:", db);
```

### **2. Check Latest Booking in Firebase**
```javascript
// Get all bookings from Firebase
getAllBookingsFromFirebase().then(bookings => {
    console.log("Firebase bookings count:", bookings.length);
    console.log("Latest booking:", bookings[0]);
});
```

### **3. Check Trip Capacities**
```javascript
// Check trip capacity updates
loadTripCapacitiesFromFirebase().then(trips => {
    console.log("Trip capacities:", trips);
});
```

### **4. Check Statistics**
```javascript
// Check Firebase statistics
getStatisticsFromFirebase().then(stats => {
    console.log("Firebase stats:", stats);
});
```

### **5. Force Sync Test**
```javascript
// Test Firebase connection
if (typeof testFirebaseConnection === 'function') {
    testFirebaseConnection();
} else {
    console.log("Firebase test function not available");
}
```

## 🎯 Expected Console Messages After Successful Save

When you submit a booking, you should see these messages in console:

```
🔥 Saving 1 bookings to Firebase...
✅ Booking MFS-1699876543-ABC12 saved to Firebase
🔥 Firebase save operation completed
✅ Trip morning_0725_weekday capacity updated in Firebase
✅ Statistics updated in Firebase
🔍 Verifying Firebase save...
✅ Verified: Booking MFS-1699876543-ABC12 found in Firebase
🎉 VERIFICATION SUCCESS: All bookings saved to Firebase!
```

## ❌ Messages That Indicate Firebase Issues

If you see these messages, Firebase is NOT working:

```
⚠️ Firebase not configured - using local storage only
📋 See Firebase_Setup_Guide.md for setup instructions
⚠️ Firebase not available - bookings saved locally only
❌ Firebase initialization failed: [error message]
🔍 Firebase verification: Firebase not available
```

## 🔧 Quick Verification Steps

1. **Submit a test booking**
2. **Open console (F12)**
3. **Look for "🔥" and "✅" messages**
4. **Run**: `getAllBookingsFromFirebase().then(console.log)`
5. **Check Firebase Console online**

## 📊 Firebase Console Verification

1. Go to: https://console.firebase.google.com
2. Select your project
3. Click: Firestore Database
4. Check collections:
   - `bookings` → Your booking data
   - `trips` → Capacity updates
   - `stats` → Statistics

If you see your booking data there, Firebase is working! 🎉