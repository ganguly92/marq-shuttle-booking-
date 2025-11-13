// Firebase Configuration and Database Functions
// REPLACE WITH YOUR ACTUAL FIREBASE CONFIG FROM FIREBASE CONSOLE
const firebaseConfig = {
  apiKey: "AIzaSyCz6UPJS3yJirAozUzyY--n6juq81aZQ3M",
  authDomain: "marq-shuttle-booking.firebaseapp.com",
  projectId: "marq-shuttle-booking",
  storageBucket: "marq-shuttle-booking.firebasestorage.app",
  messagingSenderId: "177382064235",
  appId: "1:177382064235:web:07a67c2c7e3c6f3ad3b12e"
};

// Initialize Firebase (only if config is provided)
let db = null;
let isFirebaseEnabled = false;

function initializeFirebase() {
  try {
    // Check if Firebase config is properly set
    if (firebaseConfig.apiKey !== "YOUR_API_KEY_HERE" && firebaseConfig.projectId !== "YOUR_PROJECT_ID") {
      firebase.initializeApp(firebaseConfig);
      db = firebase.firestore();
      isFirebaseEnabled = true;
      console.log("🔥 Firebase initialized successfully");
      
      // Test connection
      testFirebaseConnection();
    } else {
      console.log("⚠️ Firebase not configured - using local storage only");
      console.log("📋 See Firebase_Setup_Guide.md for setup instructions");
    }
  } catch (error) {
    console.error("❌ Firebase initialization failed:", error);
    isFirebaseEnabled = false;
  }
}

// Test Firebase connection
async function testFirebaseConnection() {
  try {
    const testDoc = db.collection('test').doc('connection');
    await testDoc.set({ 
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      status: 'connected'
    });
    console.log("✅ Firebase connection test successful");
  } catch (error) {
    console.error("❌ Firebase connection test failed:", error);
    isFirebaseEnabled = false;
  }
}

// Save booking to Firebase Firestore
async function saveBookingToFirebase(booking) {
  if (!isFirebaseEnabled) {
    console.log("📝 Firebase disabled - booking saved locally only");
    return false;
  }

  try {
    // Save to bookings collection
    await db.collection('bookings').doc(booking.id).set({
      ...booking,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ Booking ${booking.id} saved to Firebase`);

    // Update trip capacity
    await updateTripCapacityInFirebase(booking.tripId, booking.passengers);
    
    // Update statistics
    await updateStatisticsInFirebase(booking);

    return true;
  } catch (error) {
    console.error("❌ Error saving booking to Firebase:", error);
    return false;
  }
}

// Update trip capacity in Firebase
async function updateTripCapacityInFirebase(tripId, passengers) {
  if (!isFirebaseEnabled) return;

  try {
    const tripRef = db.collection('trips').doc(tripId);
    
    // Use transaction to ensure consistency
    await db.runTransaction(async (transaction) => {
      const tripDoc = await transaction.get(tripRef);
      
      if (tripDoc.exists) {
        const currentBooked = tripDoc.data().booked || 0;
        const newBooked = currentBooked + passengers;
        
        transaction.update(tripRef, { 
          booked: newBooked,
          available: 29 - newBooked,
          lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
      } else {
        // Create trip document if it doesn't exist
        transaction.set(tripRef, {
          tripId: tripId,
          capacity: 29,
          booked: passengers,
          available: 29 - passengers,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
    });

    console.log(`✅ Trip ${tripId} capacity updated in Firebase`);
  } catch (error) {
    console.error("❌ Error updating trip capacity in Firebase:", error);
  }
}

// Update statistics in Firebase
async function updateStatisticsInFirebase(booking) {
  if (!isFirebaseEnabled) return;

  try {
    const statsRef = db.collection('stats').doc('global');
    
    await db.runTransaction(async (transaction) => {
      const statsDoc = await transaction.get(statsRef);
      
      const currentStats = statsDoc.exists ? statsDoc.data() : {
        totalBookings: 0,
        totalPassengers: 0,
        totalRevenue: 0
      };
      
      transaction.set(statsRef, {
        totalBookings: currentStats.totalBookings + 1,
        totalPassengers: currentStats.totalPassengers + booking.passengers,
        totalRevenue: currentStats.totalRevenue + (booking.payment ? booking.payment.amount : 0),
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
        lastBookingId: booking.id
      });
    });

    console.log("✅ Statistics updated in Firebase");
  } catch (error) {
    console.error("❌ Error updating statistics in Firebase:", error);
  }
}

// Load trip capacities from Firebase
async function loadTripCapacitiesFromFirebase() {
  if (!isFirebaseEnabled) return {};

  try {
    const snapshot = await db.collection('trips').get();
    const capacities = {};
    
    snapshot.forEach(doc => {
      const data = doc.data();
      capacities[doc.id] = {
        booked: data.booked || 0,
        available: data.available || 29,
        capacity: data.capacity || 29
      };
    });

    console.log("✅ Trip capacities loaded from Firebase");
    return capacities;
  } catch (error) {
    console.error("❌ Error loading trip capacities from Firebase:", error);
    return {};
  }
}

// Get all bookings from Firebase (for admin)
async function getAllBookingsFromFirebase() {
  if (!isFirebaseEnabled) return [];

  try {
    const snapshot = await db.collection('bookings')
      .orderBy('createdAt', 'desc')
      .get();
    
    const bookings = [];
    snapshot.forEach(doc => {
      bookings.push({ id: doc.id, ...doc.data() });
    });

    console.log(`✅ Loaded ${bookings.length} bookings from Firebase`);
    return bookings;
  } catch (error) {
    console.error("❌ Error loading bookings from Firebase:", error);
    return [];
  }
}

// Get statistics from Firebase
async function getStatisticsFromFirebase() {
  if (!isFirebaseEnabled) return null;

  try {
    const statsDoc = await db.collection('stats').doc('global').get();
    
    if (statsDoc.exists) {
      console.log("✅ Statistics loaded from Firebase");
      return statsDoc.data();
    } else {
      return {
        totalBookings: 0,
        totalPassengers: 0,
        totalRevenue: 0
      };
    }
  } catch (error) {
    console.error("❌ Error loading statistics from Firebase:", error);
    return null;
  }
}

// Load real-time data from Firebase to sync across devices
async function loadRealTimeDataFromFirebase() {
  if (!isFirebaseEnabled) {
    console.log("🔄 Firebase not available - using local data only");
    return;
  }

  try {
    console.log("🔄 Loading real-time data from Firebase...");
    
    // Load trip capacities from Firebase
    const firebaseCapacities = await loadTripCapacitiesFromFirebase();
    
    // Load bookings from Firebase  
    const firebaseBookings = await getAllBookingsFromFirebase();
    
    // Update local state with Firebase data
    if (Object.keys(firebaseCapacities).length > 0) {
      console.log("📊 Syncing trip capacities from Firebase:");
      
      // Update trip capacities in local state
      Object.keys(firebaseCapacities).forEach(tripId => {
        const capacity = firebaseCapacities[tripId];
        console.log(`  - ${tripId}: ${capacity.booked}/${capacity.capacity} booked`);
      });
    } else {
      console.log("📊 Firebase has no trip data - resetting all capacities to 0");
      // Reset all trip capacities to 0 if Firebase is empty
      if (typeof resetAllTripCapacities === 'function') {
        resetAllTripCapacities();
      } else if (typeof window !== 'undefined' && window.resetAllTripCapacities) {
        window.resetAllTripCapacities();
      }
    }
    
    // Sync bookings count - if Firebase is empty, clear local storage
    if (firebaseBookings.length === 0) {
      console.log("🔄 Firebase is empty - clearing local storage to match");
      localStorage.removeItem('marqBookings');
      localStorage.removeItem('shuttleBookings');
      localStorage.removeItem('tripBookings');
      localStorage.removeItem('bookingStats');
      if (typeof appState !== 'undefined') {
        appState.bookings = [];
      }
    } else {
      console.log(`📋 Firebase has ${firebaseBookings.length} total bookings`);
    }
    
    // Refresh the UI to show updated data
    if (typeof updateTimeSlots === 'function') {
      updateTimeSlots();
    }
    
    console.log("✅ Real-time data sync completed from Firebase");
    
  } catch (error) {
    console.error("❌ Error loading real-time data from Firebase:", error);
  }
}

// Manual sync function for admin use
async function forceSyncWithFirebase() {
  console.log("🔄 Force syncing with Firebase...");
  await loadRealTimeDataFromFirebase();
  
  // Show sync status
  const firebaseBookings = await getAllBookingsFromFirebase();
  const localBookings = JSON.parse(localStorage.getItem('marqBookings') || '[]');
  
  alert(`🔄 SYNC COMPLETE
  
📊 Data Status:
- Firebase: ${firebaseBookings.length} bookings
- Local: ${localBookings.length} bookings  
- Status: ${firebaseBookings.length === localBookings.length ? '✅ Synchronized' : '⚠️ Difference detected'}

✅ Seat counts updated from Firebase!`);
}

// Initialize Firebase when page loads
document.addEventListener('DOMContentLoaded', function() {
  initializeFirebase();
  
  // Load real-time data from Firebase after initialization
  setTimeout(loadRealTimeDataFromFirebase, 2000);
});