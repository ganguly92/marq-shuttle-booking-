// Application State
const appState = {
    trips: {
        morning: [
            { id: 'morning-1', time: '7:25 AM', arrival: '7:50 AM', booked: 0, capacity: 29 },
            { id: 'morning-2', time: '8:15 AM', arrival: '8:40 AM', booked: 0, capacity: 29 },
            { id: 'morning-3', time: '8:55 AM', arrival: '9:20 AM', booked: 0, capacity: 29 },
            { id: 'morning-4', time: '9:45 AM', arrival: '10:15 AM', booked: 0, capacity: 29 }
        ],
        evening: [
            { id: 'evening-1', time: '5:00 PM', arrival: '5:25 PM', booked: 0, capacity: 29 },
            { id: 'evening-2', time: '6:00 PM', arrival: '6:25 PM', booked: 0, capacity: 29 },
            { id: 'evening-3', time: '7:00 PM', arrival: '7:25 PM', booked: 0, capacity: 29 },
            { id: 'evening-4', time: '8:00 PM', arrival: '8:25 PM', booked: 0, capacity: 29 }
        ]
    },
    bookings: [],
    selectedTrips: {
        morning: null,
        evening: null
    }
};

// DOM Elements
const form = document.getElementById('bookingForm');
const submitButton = document.getElementById('submitButton');
const timeSlotsContainer = document.getElementById('timeSlots');
const bookingTypeInputs = document.querySelectorAll('input[name="bookingType"]');
const directionInputs = document.querySelectorAll('input[name="direction"]');
const dateSelect = document.getElementById('travelDate');
const singleTripSelector = document.getElementById('singleTripSelector');
const modal = document.getElementById('successModal');
const bookingDetails = document.getElementById('bookingDetails');

// Payment Elements
const paymentScreenshot = document.getElementById('paymentScreenshot');
const paymentCompleted = document.getElementById('paymentCompleted');
const fileUploadArea = document.getElementById('fileUploadArea');
const filePreview = document.getElementById('filePreview');
const previewImage = document.getElementById('previewImage');
const fileName = document.getElementById('fileName');
const removeFileBtn = document.getElementById('removeFile');
const totalAmountSpan = document.getElementById('totalAmount');
const paymentReference = document.getElementById('paymentReference');

// Event Listeners
document.addEventListener('DOMContentLoaded', initializeApp);
form.addEventListener('submit', handleFormSubmit);
bookingTypeInputs.forEach(input => input.addEventListener('change', handleBookingTypeChange));
directionInputs.forEach(input => input.addEventListener('change', handleDirectionChange));
dateSelect.addEventListener('change', handleDateChange);

// Hidden admin access shortcuts
// Ctrl+Alt+E - Export data
// Ctrl+Shift+A - Admin panel  
// Ctrl+Shift+S - Quick statistics
// Ctrl+Shift+R - Sync with Firebase (refresh data)
// Ctrl+Shift+Del - Clear all data (emergency)
document.addEventListener('keydown', function(event) {
    if (event.ctrlKey && event.altKey && event.key === 'E') {
        event.preventDefault();
        exportMasterBookingSheet();
    }
    if (event.ctrlKey && event.shiftKey && event.key === 'A') {
        event.preventDefault();
        showEnhancedAdminPanel();
    }
    if (event.ctrlKey && event.shiftKey && event.key === 'S') {
        event.preventDefault();
        showQuickStatistics();
    }
    if (event.ctrlKey && event.shiftKey && event.key === 'R') {
        event.preventDefault();
        if (typeof forceSyncWithFirebase === 'function') {
            forceSyncWithFirebase();
        } else {
            alert('🔄 Firebase sync not available - check Firebase connection');
        }
    }
    if (event.ctrlKey && event.shiftKey && event.key === 'Delete') {
        event.preventDefault();
        clearAllBookingData();
    }
});

// Add click handler to submit button to show validation errors even when disabled
document.addEventListener('click', function(event) {
    if (event.target.matches('#submitButton') || event.target.closest('#submitButton')) {
        if (submitButton.disabled) {
            // Show validation errors when trying to click disabled submit button
            showValidationErrors();
            event.preventDefault();
            event.stopPropagation();
        }
    }
});

// Initialize Application
function initializeApp() {
    loadStoredBookings();
    setDefaultDate();
    updateTripCapacities(); // Update capacities after setting date
    updateTimeSlots();
    setupRealTimeValidation();
    validateFormRealTime(); // Initial validation check
    updatePaymentAmounts(); // Initialize payment amounts
    
    // Initialize email service for admin notifications
    if (typeof emailjs !== 'undefined') {
        initializeEmailService();
    }
}

// Set default date to today if it's within trial period
function setDefaultDate() {
    const today = new Date();
    const trialStart = new Date('2025-11-10');
    const trialEnd = new Date('2025-11-13');
    
    if (today >= trialStart && today <= trialEnd) {
        const dateString = today.toISOString().split('T')[0];
        dateSelect.value = dateString;
        handleDateChange();
    }
}

// Load bookings from localStorage
function loadStoredBookings() {
    const stored = localStorage.getItem('marqShuttleBookings');
    if (stored) {
        try {
            appState.bookings = JSON.parse(stored);
            updateTripCapacities();
        } catch (error) {
            console.error('Error loading bookings:', error);
            appState.bookings = [];
        }
    }
}

// Save bookings to localStorage with size monitoring
function saveBookings() {
    try {
        const bookingData = JSON.stringify(appState.bookings);
        const dataSize = new Blob([bookingData]).size;
        const dataSizeMB = (dataSize / (1024 * 1024)).toFixed(2);
        
        // Check if approaching localStorage limits
        if (dataSize > 3 * 1024 * 1024) { // 3MB warning
            console.warn(`[ADMIN] Large dataset warning: ${dataSizeMB}MB stored`);
            console.warn(`[ADMIN] Consider archiving older bookings for performance`);
        }
        
        localStorage.setItem('marqShuttleBookings', bookingData);
        
        // Store metadata for admin monitoring
        const metadata = {
            totalBookings: appState.bookings.length,
            dataSize: dataSize,
            dataSizeMB: dataSizeMB,
            lastUpdated: new Date().toISOString(),
            performanceLevel: getPerformanceLevel(dataSize)
        };
        localStorage.setItem('marq_data_metadata', JSON.stringify(metadata));
        
        console.log(`[SYSTEM] Data saved: ${appState.bookings.length} bookings (${dataSizeMB}MB)`);
        
    } catch (error) {
        if (error.name === 'QuotaExceededError') {
            console.error('[CRITICAL] LocalStorage quota exceeded!');
            showStorageWarning();
        } else {
            console.error('Error saving bookings:', error);
        }
    }
}

// Update trip capacities based on bookings for selected date
function updateTripCapacities() {
    const selectedDate = dateSelect.value;
    
    // Reset all bookings
    Object.values(appState.trips).flat().forEach(trip => {
        trip.booked = 0;
    });

    // Only count bookings if a date is selected
    if (selectedDate) {
        // Count bookings only for the selected travel date
        appState.bookings.forEach(booking => {
            if (booking.travelDate === selectedDate) {
                const trip = findTripById(booking.tripId);
                if (trip) {
                    trip.booked += parseInt(booking.passengers);
                }
            }
        });
    }
}

// Find trip by ID
function findTripById(tripId) {
    return Object.values(appState.trips).flat().find(trip => trip.id === tripId);
}

// Update payment amounts dynamically
function updatePaymentAmounts() {
    const selectedBookingType = document.querySelector('input[name="bookingType"]:checked');
    const passengersInput = document.getElementById('passengers');
    
    // Get passengers count (default to 1 if not found)
    const passengers = passengersInput ? parseInt(passengersInput.value) || 1 : 1;
    
    // Calculate total amount based on booking type
    let totalAmount = 0;
    if (selectedBookingType) {
        const bookingType = selectedBookingType.value;
        if (bookingType === 'single') {
            totalAmount = passengers * 35; // ₹35 for single trip
        } else if (bookingType === 'roundtrip') {
            totalAmount = passengers * 70; // ₹70 for round trip
        }
    } else {
        // Default to single trip pricing if no booking type selected
        totalAmount = passengers * 35;
    }
    
    // Update all payment amount displays
    const totalAmountSpan = document.getElementById('totalAmount');
    const amountDisplaySpans = document.querySelectorAll('.amount-display');
    
    if (totalAmountSpan) {
        totalAmountSpan.textContent = totalAmount;
    }
    
    amountDisplaySpans.forEach(span => {
        span.textContent = totalAmount;
    });
    
    const bookingType = selectedBookingType ? selectedBookingType.value : 'single (default)';
    console.log(`💰 Updated payment amount: ₹${totalAmount} (${bookingType} trip, ${passengers} passenger${passengers > 1 ? 's' : ''})`);
}

// Handle booking type change
function handleBookingTypeChange() {
    const selectedBookingType = document.querySelector('input[name="bookingType"]:checked');
    
    if (selectedBookingType) {
        if (selectedBookingType.value === 'single') {
            singleTripSelector.style.display = 'block';
            // Make direction required for single trips
            directionInputs.forEach(input => {
                input.required = true;
            });
        } else {
            singleTripSelector.style.display = 'none';
            // Remove direction requirement for round trips
            directionInputs.forEach(input => {
                input.required = false;
                input.checked = false;
            });
        }
        
        // Reset selections
        appState.selectedTrips.morning = null;
        appState.selectedTrips.evening = null;
        updateTimeSlots();
        
        // Update payment amounts
        updatePaymentAmounts();
        
        // Trigger real-time validation
        validateFormRealTime();
    }
}

// Handle direction change
function handleDirectionChange() {
    updateTimeSlots();
    validateFormRealTime();
}

// Handle date change
function handleDateChange() {
    // Update capacities for the newly selected date
    updateTripCapacities();
    updateTimeSlots();
    validateFormRealTime();
}

// Update time slots display
function updateTimeSlots() {
    const selectedBookingType = document.querySelector('input[name="bookingType"]:checked');
    const selectedDirection = document.querySelector('input[name="direction"]:checked');
    const selectedDate = dateSelect.value;
    
    if (!selectedBookingType || !selectedDate) {
        timeSlotsContainer.innerHTML = '<p class="no-selection">Please select booking type and date to view available time slots.</p>';
        return;
    }

    if (selectedBookingType.value === 'single') {
        if (!selectedDirection) {
            timeSlotsContainer.innerHTML = '<p class="no-selection">Please select direction to view available time slots.</p>';
            return;
        }
        renderSingleTripSlots(selectedDirection.value);
    } else {
        renderRoundTripSlots();
    }
}

// Render single trip slots
function renderSingleTripSlots(direction) {
    const trips = appState.trips[direction];
    const routeText = direction === 'morning' 
        ? 'Assetz Marq → Kadugodi Metro' 
        : 'Kadugodi Metro → Assetz Marq';

    timeSlotsContainer.innerHTML = `
        <div class="trip-section">
            <div class="trip-section-header">
                <i class="fas fa-${direction === 'morning' ? 'sun' : 'moon'}"></i>
                ${direction === 'morning' ? 'Morning Trips' : 'Evening Trips'} - ${routeText}
            </div>
            <div class="time-slots-grid">
                ${trips.map(trip => renderTimeSlot(trip, direction)).join('')}
            </div>
        </div>
    `;
}

// Render round trip slots
function renderRoundTripSlots() {
    const morningTrips = appState.trips.morning;
    const eveningTrips = appState.trips.evening;

    timeSlotsContainer.innerHTML = `
        <div class="trip-slots-container">
            <div class="trip-section">
                <div class="trip-section-header">
                    <i class="fas fa-sun"></i>
                    Morning Trip - Assetz Marq → Kadugodi Metro
                </div>
                <div class="time-slots-grid">
                    ${morningTrips.map(trip => renderTimeSlot(trip, 'morning')).join('')}
                </div>
            </div>
            
            <div class="trip-section">
                <div class="trip-section-header">
                    <i class="fas fa-moon"></i>
                    Evening Trip - Kadugodi Metro → Assetz Marq
                </div>
                <div class="time-slots-grid">
                    ${eveningTrips.map(trip => renderTimeSlot(trip, 'evening')).join('')}
                </div>
            </div>
        </div>
    `;
}

// Render individual time slot
function renderTimeSlot(trip, direction) {
    const available = trip.capacity - trip.booked;
    const isFullyBooked = available <= 0;
    const capacityPercentage = (trip.booked / trip.capacity) * 100;
    const isSelected = appState.selectedTrips[direction] === trip.id;
    
    return `
        <div class="time-slot ${isFullyBooked ? 'full' : ''} ${isSelected ? 'selected' : ''}" 
             data-trip-id="${trip.id}" 
             data-direction="${direction}"
             onclick="${isFullyBooked ? '' : `selectTimeSlot('${trip.id}', '${direction}')`}">
            <div class="time-slot-header">
                <div class="time-slot-time">${trip.time}</div>
                <div class="capacity-indicator">
                    <span>${available}/${trip.capacity}</span>
                    <div class="capacity-bar">
                        <div class="capacity-fill" style="width: ${capacityPercentage}%"></div>
                    </div>
                </div>
            </div>
            <small>Arrival: ${trip.arrival}</small>
            ${isFullyBooked ? '<div style="color: #ef4444; font-weight: 600; margin-top: 0.5rem;">Fully Booked</div>' : ''}
        </div>
    `;
}

// Select time slot
function selectTimeSlot(tripId, direction) {
    const selectedBookingType = document.querySelector('input[name="bookingType"]:checked');
    
    if (selectedBookingType.value === 'single') {
        // For single trips, only allow one selection
        appState.selectedTrips.morning = null;
        appState.selectedTrips.evening = null;
        appState.selectedTrips[direction] = tripId;
    } else {
        // For round trips, allow selection of both morning and evening
        appState.selectedTrips[direction] = tripId;
    }
    
    // Clear trip selection highlights
    document.querySelectorAll('.trip-section').forEach(section => {
        section.classList.remove('required-missing');
    });
    
    // Update UI
    updateTimeSlots();
    
    // Trigger real-time validation
    validateFormRealTime();
}

// Handle form submission
async function handleFormSubmit(event) {
    event.preventDefault();
    
    // Perform comprehensive validation and highlight all missing fields
    const validationResult = performFullValidation();
    
    if (!validationResult.isValid) {
        // Small delay to ensure DOM updates complete before scrolling
        setTimeout(() => {
            scrollToFirstMissingField();
        }, 100);
        
        // Count missing fields for better error message
        const missingCount = document.querySelectorAll('.required-missing').length;
        const errorMessage = missingCount === 1 
            ? 'Please fill the highlighted required field to proceed.' 
            : `Please fill all ${missingCount} highlighted required fields to proceed.`;
        
        showAlert(errorMessage, 'error');
        return;
    }

    const selectedBookingType = document.querySelector('input[name="bookingType"]:checked');
    const formData = new FormData(form);
    const passengers = parseInt(formData.get('passengers'));
    
    // Validate capacity for all selected trips
    const selectedTripIds = [appState.selectedTrips.morning, appState.selectedTrips.evening].filter(Boolean);
    for (const tripId of selectedTripIds) {
        const trip = findTripById(tripId);
        const currentBookings = trip.booked;
        
        if (currentBookings + passengers > trip.capacity) {
            showAlert(`Sorry, only ${trip.capacity - currentBookings} seats available for the ${trip.time} trip.`, 'error');
            return;
        }
    }

    // Create bookings for each selected trip
    const bookings = [];
    const isRoundTrip = selectedTripIds.length > 1;
    const farePerPassenger = isRoundTrip ? 70 : 35; // ₹70 for round trip, ₹35 for single trip
    
    selectedTripIds.forEach(tripId => {
        const booking = {
            id: generateBookingId(),
            tripId: tripId,
            fullName: formData.get('fullName'),
            flatNumber: formData.get('flatNumber'),
            travelDate: formData.get('travelDate'),
            bookingType: selectedBookingType.value,
            direction: tripId.startsWith('morning') ? 'morning' : 'evening',
            passengers: passengers,
            specialRequests: formData.get('specialRequests'),
            bookingTime: new Date().toISOString(),
            status: 'confirmed',
            payment: {
                amount: isRoundTrip ? passengers * 70 : passengers * 35,
                totalFare: passengers * farePerPassenger,
                screenshotUploaded: true,
                screenshotFileName: document.getElementById('paymentScreenshot').files[0]?.name || 'payment_screenshot',
                paymentConfirmed: true
            }
        };
        bookings.push(booking);
    });

    // Add all bookings
    appState.bookings.push(...bookings);
    saveBookings();
    updateTripCapacities();
    
    // Save to Firebase (new feature!)
    saveBookingsToFirebase(bookings);
    
    // Verify Firebase save immediately (for testing)
    setTimeout(() => verifyFirebaseSave(bookings), 2000);
    
    // Send booking data to admin email
    sendBookingToAdmin(bookings);
    
    // Store data securely without user download
    storeBookingDataSecurely(bookings);
    
    updateTimeSlots();
    
    // Show success message
    showBookingConfirmation(bookings);
    
    // Reset form to default state
    resetFormToDefault();
}

// Generate unique booking ID
function generateBookingId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5);
    return `MFS-${timestamp}-${random}`.toUpperCase();
}

// Show booking confirmation
function showBookingConfirmation(bookings) {
    // Handle both single booking and array of bookings
    const bookingArray = Array.isArray(bookings) ? bookings : [bookings];
    
    let bookingDetailsHtml = '';
    
    // Determine if this is a single trip or round trip
    const isRoundTrip = bookingArray.length > 1;
    const farePerPassenger = isRoundTrip ? 70 : 35; // ₹70 for round trip, ₹35 for single trip
    
    bookingArray.forEach((booking, index) => {
        const trip = findTripById(booking.tripId);
        const directionText = booking.direction === 'morning' 
            ? 'Assetz Marq → Kadugodi Metro' 
            : 'Kadugodi Metro → Assetz Marq';
        
        const boardingPoint = booking.direction === 'morning' 
            ? 'Assetz Marq (Near Roundabout)' 
            : 'Kadugodi Metro Station';

        // For display purposes, show individual trip fare as ₹35, but total will be correct
        const fareForTrip = booking.passengers * 35;
        
        bookingDetailsHtml += `
            <div style="background: white; padding: 1rem; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: ${index < bookingArray.length - 1 ? '1rem' : '0'};">
                <h4 style="margin: 0 0 0.75rem 0; color: #1e3c72;">
                    ${booking.direction === 'morning' ? '🌅 Morning' : '🌇 Evening'} Trip
                </h4>
                <div style="display: grid; gap: 0.5rem; font-size: 0.9rem;">
                    <div><strong>Booking ID:</strong> ${booking.id}</div>
                    <div><strong>Date:</strong> ${formatDate(booking.travelDate)}</div>
                    <div><strong>Time:</strong> ${trip.time} (${directionText})</div>
                    <div><strong>Boarding:</strong> ${boardingPoint}</div>
                    <div><strong>Passengers:</strong> ${booking.passengers}</div>
                    <div><strong>Fare:</strong> ₹${fareForTrip}</div>
                </div>
            </div>
        `;
    });
    
    // Calculate total fare based on booking type
    const totalFare = bookingArray[0].passengers * farePerPassenger;
    
    bookingDetails.innerHTML = `
        <div style="display: grid; gap: 1rem;">
            <div style="text-align: center; padding: 1rem; background: #f0f7ff; border-radius: 8px; border: 1px solid #2563eb;">
                <h4 style="margin: 0 0 0.5rem 0; color: #1e3c72;">
                    ${bookingArray.length === 1 ? 'Single Trip Booking' : 'Round Trip Booking'}
                </h4>
                <div style="font-size: 0.9rem;">
                    <div><strong>Name:</strong> ${bookingArray[0].fullName}</div>
                    <div><strong>Total Fare:</strong> ₹${totalFare} (Pay to driver)</div>
                </div>
            </div>
            
            ${bookingDetailsHtml}
            
            <div style="background: #fef3c7; padding: 0.75rem; border-radius: 6px; border: 1px solid #f59e0b; margin-top: 0.5rem;">
                <strong style="color: #92400e;">Important:</strong>
                <span style="color: #92400e; font-size: 0.85rem;">
                    Please arrive 5 minutes before departure. Bring exact change for the driver.
                    ${bookingArray.length > 1 ? ' Keep both booking IDs for reference.' : ''}
                </span>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
}

// Close modal
function closeModal() {
    modal.style.display = 'none';
    // Reset the entire form when modal closes
    resetFormToDefault();
}

// Comprehensive form reset function
function resetFormToDefault() {
    // Reset the HTML form
    form.reset();
    
    // Reset application state
    appState.selectedTrips.morning = null;
    appState.selectedTrips.evening = null;
    
    // Hide trip selector
    singleTripSelector.style.display = 'none';
    
    // Clear payment file upload
    const paymentScreenshot = document.getElementById('paymentScreenshot');
    if (paymentScreenshot) {
        paymentScreenshot.value = '';
    }
    
    // Hide file preview if visible
    const filePreview = document.querySelector('.file-preview');
    const fileName = document.querySelector('.file-name');
    const fileInfo = document.querySelector('.file-info');
    
    if (filePreview) filePreview.style.display = 'none';
    if (fileName) fileName.textContent = '';
    if (fileInfo) fileInfo.textContent = '';
    
    // Reset payment amount display
    const paymentAmount = document.querySelector('.payment-amount');
    if (paymentAmount) {
        paymentAmount.textContent = '₹35';
    }
    
    // Uncheck all checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Uncheck all radio buttons
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.checked = false;
    });
    
    // Clear all validation highlights
    clearValidationHighlights();
    
    // Reset trip sections
    updateTimeSlots();
    
    // Clear any selected dates that might be in the future
    const travelDate = document.getElementById('travelDate');
    if (travelDate) {
        travelDate.value = '';
    }
    
    // Reset passengers to 1
    const passengers = document.getElementById('passengers');
    if (passengers) {
        passengers.value = '1';
    }
    
    // Clear special requests
    const specialRequests = document.getElementById('specialRequests');
    if (specialRequests) {
        specialRequests.value = '';
    }
    
    console.log('Form reset to default state');
}

// Show alert message
function showAlert(message, type = 'info') {
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'error' ? '#fee2e2' : '#dbeafe'};
        color: ${type === 'error' ? '#991b1b' : '#1e40af'};
        border: 1px solid ${type === 'error' ? '#fca5a5' : '#93c5fd'};
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 1001;
        max-width: 400px;
        font-weight: 500;
        animation: slideInRight 0.3s ease-out;
    `;
    alert.textContent = message;
    
    document.body.appendChild(alert);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        alert.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 300);
    }, 5000);
}

// Format date for display
function formatDate(dateString) {
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Add CSS animations for alerts
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .no-selection {
        text-align: center;
        color: #6b7280;
        padding: 2rem;
        font-style: italic;
    }
`;
document.head.appendChild(style);

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    if (event.target === modal) {
        closeModal();
    }
});

// Keyboard navigation
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && modal.style.display === 'block') {
        closeModal();
    }
});

// Form validation enhancements
// Real-time form validation
form.addEventListener('input', function(e) {
    // Clear validation highlighting when user starts typing
    if (e.target.classList.contains('required-missing')) {
        e.target.classList.remove('required-missing');
        const label = e.target.closest('.form-group')?.querySelector('label');
        if (label) {
            label.classList.remove('required-missing');
        }
    }
    
    // Update payment amounts when passengers field changes
    if (e.target.id === 'passengers') {
        updatePaymentAmounts();
    }
    
    validateForm();
});

// Add specific event listener for passengers dropdown
const passengersSelect = document.getElementById('passengers');
if (passengersSelect) {
    passengersSelect.addEventListener('change', function() {
        updatePaymentAmounts();
        console.log(`👥 Passengers changed to: ${this.value}`);
    });
}

// Add validation on change events too
bookingTypeInputs.forEach(input => {
    input.addEventListener('change', function() {
        // Clear booking type highlighting when selected
        const bookingTypeSelector = document.querySelector('.booking-type-selector');
        if (bookingTypeSelector) {
            bookingTypeSelector.classList.remove('required-missing');
        }
        
        // Update payment amounts when booking type changes
        updatePaymentAmounts();
        
        validateForm();
    });
});

// Clear direction highlighting when direction is selected
directionInputs.forEach(input => {
    input.addEventListener('change', function() {
        const directionSelector = document.querySelector('.direction-selector');
        if (directionSelector) {
            directionSelector.classList.remove('required-missing');
        }
        validateForm();
    });
});

// Clear terms highlighting when checkbox is checked
document.getElementById('terms').addEventListener('change', function() {
    const termsLabel = document.querySelector('label[for="terms"]');
    const checkboxGroup = this.closest('.checkbox-group');
    if (this.checked) {
        if (termsLabel) {
            termsLabel.classList.remove('required-missing');
        }
        if (checkboxGroup) {
            checkboxGroup.classList.remove('required-missing');
        }
    }
    validateForm();
});

// Payment functionality
paymentScreenshot.addEventListener('change', handleFileUpload);
paymentCompleted.addEventListener('change', validateForm);
removeFileBtn.addEventListener('click', removeUploadedFile);

// Handle file upload for payment screenshot
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        showAlert('Please upload an image file (JPG, PNG, JPEG)', 'error');
        event.target.value = '';
        return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
        showAlert('File size must be less than 5MB', 'error');
        event.target.value = '';
        return;
    }

    // Display file preview
    const reader = new FileReader();
    reader.onload = function(e) {
        previewImage.src = e.target.result;
        fileName.textContent = file.name;
        fileUploadArea.style.display = 'none';
        filePreview.style.display = 'block';
        validateForm();
    };
    reader.readAsDataURL(file);
}

// Remove uploaded file
function removeUploadedFile() {
    paymentScreenshot.value = '';
    previewImage.src = '';
    fileName.textContent = '';
    fileUploadArea.style.display = 'block';
    filePreview.style.display = 'none';
    validateForm();
}

// Update payment amount based on selection
function updatePaymentAmount() {
    const passengers = parseInt(document.getElementById('passengers').value) || 1;
    const selectedBookingType = document.querySelector('input[name="bookingType"]:checked');
    
    let tripCount = 1;
    if (selectedBookingType && selectedBookingType.value === 'roundtrip') {
        tripCount = 2;
    }
    
    const totalAmount = passengers * tripCount * 35; // ₹35 per person per trip
    totalAmountSpan.textContent = totalAmount;
    
    // Update all amount displays
    document.querySelectorAll('.amount-display').forEach(span => {
        span.textContent = totalAmount;
    });
    
    // Update payment reference
    const travelDate = document.getElementById('travelDate').value;
    if (travelDate) {
        const dateStr = travelDate.replace(/-/g, '');
        paymentReference.textContent = `SHUTTLE-${dateStr}`;
    }
}

function validateForm() {
    const submitButton = form.querySelector('button[type="submit"]');
    const requiredFields = form.querySelectorAll('input[required], select[required]');
    const selectedBookingType = document.querySelector('input[name="bookingType"]:checked');
    
    // For real-time validation, just check if form is complete (don't highlight errors)
    const basicFieldsValid = Array.from(requiredFields).every(field => {
        // Skip direction fields if booking type is round trip
        if (field.name === 'direction' && selectedBookingType?.value === 'roundtrip') {
            return true;
        }
        return field.value.trim() !== '';
    });
    
    const termsChecked = document.getElementById('terms').checked;
    const paymentCompletedChecked = document.getElementById('paymentCompleted').checked;
    const paymentScreenshotUploaded = document.getElementById('paymentScreenshot').files.length > 0;
    
    let isValid = basicFieldsValid && termsChecked && selectedBookingType && paymentCompletedChecked && paymentScreenshotUploaded;
    
    // Additional validation for trip selection
    if (selectedBookingType && isValid) {
        if (selectedBookingType.value === 'single') {
            isValid = isValid && (appState.selectedTrips.morning || appState.selectedTrips.evening);
            submitButton.innerHTML = '<i class="fas fa-check-circle"></i> Book Single Trip';
        } else if (selectedBookingType.value === 'roundtrip') {
            isValid = isValid && appState.selectedTrips.morning && appState.selectedTrips.evening;
            submitButton.innerHTML = '<i class="fas fa-check-circle"></i> Book Round Trip';
        }
    } else {
        submitButton.innerHTML = '<i class="fas fa-check-circle"></i> Book My Slot(s)';
    }
    
    submitButton.disabled = !isValid;
    submitButton.style.opacity = isValid ? '1' : '0.6';
}

function performFullValidation() {
    const selectedBookingType = document.querySelector('input[name="bookingType"]:checked');
    const selectedDirection = document.querySelector('input[name="direction"]:checked');
    const requiredFields = form.querySelectorAll('input[required], select[required]');
    const termsChecked = document.getElementById('terms').checked;
    
    let isValid = true;
    let firstMissingElement = null;
    
    // Clear previous validation highlights
    clearValidationHighlights();
    
    // Validate basic required fields
    Array.from(requiredFields).forEach(field => {
        // Skip direction fields if booking type is round trip
        if (field.name === 'direction' && selectedBookingType?.value === 'roundtrip') {
            return;
        }
        
        if (field.value.trim() === '') {
            highlightMissingField(field);
            if (!firstMissingElement) {
                firstMissingElement = field;
            }
            isValid = false;
        }
    });
    
    // Validate booking type selection
    if (!selectedBookingType) {
        highlightMissingBookingType();
        if (!firstMissingElement) {
            firstMissingElement = document.querySelector('.booking-type-selector');
        }
        isValid = false;
    }
    
    // Validate direction for single trips
    if (selectedBookingType?.value === 'single' && !selectedDirection) {
        highlightMissingDirection();
        if (!firstMissingElement) {
            firstMissingElement = document.querySelector('.direction-selector');
        }
        isValid = false;
    }
    
    // Validate trip selection
    if (selectedBookingType) {
        if (selectedBookingType.value === 'single') {
            const hasSelectedTrip = appState.selectedTrips.morning || appState.selectedTrips.evening;
            if (!hasSelectedTrip) {
                highlightMissingTripSelection('single');
                if (!firstMissingElement) {
                    firstMissingElement = document.querySelector('.trip-section');
                }
                isValid = false;
            }
        } else if (selectedBookingType.value === 'roundtrip') {
            const hasSelectedBothTrips = appState.selectedTrips.morning && appState.selectedTrips.evening;
            if (!hasSelectedBothTrips) {
                highlightMissingTripSelection('roundtrip');
                if (!firstMissingElement) {
                    firstMissingElement = document.querySelector('.trip-section.required-missing');
                }
                isValid = false;
            }
        }
    }
    
    // Validate terms checkbox
    if (!termsChecked) {
        highlightMissingTerms();
        if (!firstMissingElement) {
            firstMissingElement = document.getElementById('terms').closest('.form-group');
        }
        isValid = false;
    }
    
    // Validate payment completion
    const paymentCompleted = document.getElementById('paymentCompleted');
    const paymentScreenshot = document.getElementById('paymentScreenshot');
    
    if (!paymentCompleted.checked) {
        highlightMissingPayment(paymentCompleted);
        if (!firstMissingElement) {
            firstMissingElement = paymentCompleted.closest('.form-group');
        }
        isValid = false;
    }
    
    if (paymentScreenshot.files.length === 0) {
        highlightMissingScreenshot();
        if (!firstMissingElement) {
            firstMissingElement = paymentScreenshot.closest('.form-group');
        }
        isValid = false;
    }
    
    return {
        isValid: isValid,
        firstMissingElement: firstMissingElement
    };
}

function scrollToFirstMissingField() {
    // Find the first missing field in document order
    const missingFields = document.querySelectorAll('.required-missing');
    
    console.log('Missing fields found:', missingFields.length); // Debug log
    
    if (missingFields.length > 0) {
        const firstMissingField = missingFields[0];
        console.log('First missing field:', firstMissingField); // Debug log
        
        // Try multiple scroll approaches for better compatibility
        
        // Method 1: scrollIntoView (most reliable)
        firstMissingField.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
        });
        
        // Method 2: Manual scroll calculation as backup
        setTimeout(() => {
            const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
            const bannerHeight = document.querySelector('.trial-banner')?.offsetHeight || 0;
            const offset = headerHeight + bannerHeight + 30;
            
            const elementRect = firstMissingField.getBoundingClientRect();
            const absoluteElementTop = elementRect.top + window.pageYOffset;
            const targetPosition = absoluteElementTop - offset;
            
            window.scrollTo({
                top: Math.max(0, targetPosition),
                behavior: 'smooth'
            });
            
            console.log('Scrolled to position:', targetPosition); // Debug log
        }, 200);
        
        // Focus the input field if it exists and is focusable
        setTimeout(() => {
            let inputField = firstMissingField;
            
            // If it's not directly an input, try to find one inside
            if (firstMissingField.tagName !== 'INPUT' && firstMissingField.tagName !== 'SELECT') {
                inputField = firstMissingField.querySelector('input:not([type="radio"]):not([type="checkbox"]), select');
            }
            
            if (inputField && (inputField.tagName === 'INPUT' || inputField.tagName === 'SELECT')) {
                inputField.focus();
                inputField.select(); // Select text in field for better UX
                console.log('Focused field:', inputField); // Debug log
            }
        }, 1000);
    }
}

function clearValidationHighlights() {
    // Clear field highlights
    document.querySelectorAll('.required-missing').forEach(element => {
        element.classList.remove('required-missing');
    });
}

function highlightMissingField(field) {
    // Highlight the field itself
    field.classList.add('required-missing');
    
    // Highlight the label
    const label = field.closest('.form-group')?.querySelector('label');
    if (label) {
        label.classList.add('required-missing');
    }
}

function highlightMissingTerms() {
    const termsLabel = document.querySelector('label[for="terms"]');
    const checkboxGroup = document.getElementById('terms').closest('.checkbox-group');
    if (termsLabel) {
        termsLabel.classList.add('required-missing');
    }
    if (checkboxGroup) {
        checkboxGroup.classList.add('required-missing');
    }
}

function highlightMissingBookingType() {
    const bookingTypeSelector = document.querySelector('.booking-type-selector');
    if (bookingTypeSelector) {
        bookingTypeSelector.classList.add('required-missing');
    }
}

function highlightMissingDirection() {
    const directionSelector = document.querySelector('.direction-selector');
    if (directionSelector) {
        directionSelector.classList.add('required-missing');
    }
}

function highlightMissingPayment(paymentElement) {
    const paymentGroup = paymentElement.closest('.form-group');
    if (paymentGroup) {
        paymentGroup.classList.add('required-missing');
    }
}

function highlightMissingScreenshot() {
    const uploadArea = document.querySelector('.file-upload-area');
    if (uploadArea) {
        uploadArea.classList.add('required-missing');
    }
}

function highlightMissingTripSelection(bookingType) {
    if (bookingType === 'single') {
        // Highlight the visible trip section
        const selectedDirection = document.querySelector('input[name="direction"]:checked');
        if (selectedDirection) {
            const tripSection = document.querySelector('.trip-section');
            if (tripSection) {
                tripSection.classList.add('required-missing');
            }
        }
    } else if (bookingType === 'roundtrip') {
        // Highlight trip sections that are missing selections
        const tripSections = document.querySelectorAll('.trip-section');
        tripSections.forEach((section, index) => {
            const isMorning = index === 0;
            const hasSelection = isMorning ? appState.selectedTrips.morning : appState.selectedTrips.evening;
            if (!hasSelection) {
                section.classList.add('required-missing');
            }
        });
    }
}

// Accessibility improvements
document.querySelectorAll('.time-slot').forEach(slot => {
    slot.setAttribute('role', 'button');
    slot.setAttribute('tabindex', '0');
    
    slot.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            const tripId = this.dataset.tripId;
            if (!this.classList.contains('full')) {
                selectTimeSlot(tripId);
            }
        }
    });
});

// Admin functions (for debugging/testing)
window.marqShuttleAdmin = {
    viewBookings: () => {
        console.table(appState.bookings);
        return appState.bookings;
    },
    clearBookings: () => {
        if (confirm('Are you sure you want to clear all bookings?')) {
            appState.bookings = [];
            saveBookings();
            updateTripCapacities();
            updateTimeSlots();
            console.log('All bookings cleared');
        }
    },
    exportBookings: () => {
        const dataStr = JSON.stringify(appState.bookings, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `marq-shuttle-bookings-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }
};

// Real-time validation functions
function setupRealTimeValidation() {
    // Add event listeners to all form inputs for real-time validation
    const allInputs = form.querySelectorAll('input, select');
    allInputs.forEach(input => {
        input.addEventListener('input', validateFormRealTime);
        input.addEventListener('change', validateFormRealTime);
    });
    
    // Listen for trip selection changes
    document.addEventListener('click', function(e) {
        if (e.target.matches('.time-slot') || e.target.closest('.time-slot')) {
            setTimeout(validateFormRealTime, 100); // Delay to ensure state is updated
        }
    });
}

function validateFormRealTime() {
    const isValid = checkFormValidity();
    submitButton.disabled = !isValid;
}

function checkFormValidity() {
    const selectedBookingType = document.querySelector('input[name="bookingType"]:checked');
    const selectedDirection = document.querySelector('input[name="direction"]:checked');
    const requiredFields = form.querySelectorAll('input[required], select[required]');
    const termsChecked = document.getElementById('terms').checked;
    
    // Check basic required fields
    for (const field of requiredFields) {
        // Skip direction fields if booking type is round trip
        if (field.name === 'direction' && selectedBookingType?.value === 'roundtrip') {
            continue;
        }
        
        if (field.value.trim() === '') {
            return false;
        }
    }
    
    // Check booking type selection
    if (!selectedBookingType) {
        return false;
    }
    
    // Check direction for single trips
    if (selectedBookingType?.value === 'single' && !selectedDirection) {
        return false;
    }
    
    // Check trip selection
    if (selectedBookingType) {
        if (selectedBookingType.value === 'single') {
            const hasSelectedTrip = appState.selectedTrips.morning || appState.selectedTrips.evening;
            if (!hasSelectedTrip) {
                return false;
            }
        } else if (selectedBookingType.value === 'roundtrip') {
            const hasSelectedBothTrips = appState.selectedTrips.morning && appState.selectedTrips.evening;
            if (!hasSelectedBothTrips) {
                return false;
            }
        }
    }
    
    // Check terms checkbox
    if (!termsChecked) {
        return false;
    }
    
    return true;
}

// Show validation errors when submit button is clicked while disabled
function showValidationErrors() {
    // Perform comprehensive validation and highlight all missing fields
    const validationResult = performFullValidation();
    
    if (!validationResult.isValid) {
        // Small delay to ensure DOM updates complete before scrolling
        setTimeout(() => {
            scrollToFirstMissingField();
        }, 100);
        
        // Count missing fields for better error message
        const missingCount = document.querySelectorAll('.required-missing').length;
        const errorMessage = missingCount === 1 
            ? 'Please fill the highlighted required field to proceed.' 
            : `Please fill all ${missingCount} highlighted required fields to proceed.`;
        
        showAlert(errorMessage, 'error');
    }
}

// Securely store booking data without user access
function storeBookingDataSecurely(newBookings) {
    // Data is stored in browser's localStorage, completely invisible to users
    // Only admin can access through hidden keyboard shortcuts
    
    // Create detailed log entry
    const logEntry = {
        timestamp: new Date().toISOString(),
        bookingCount: newBookings.length,
        totalPassengers: newBookings.reduce((sum, b) => sum + b.passengers, 0),
        bookingIds: newBookings.map(b => b.id)
    };
    
    // Store in hidden admin log
    const adminLogs = JSON.parse(localStorage.getItem('marq_admin_logs') || '[]');
    adminLogs.push(logEntry);
    localStorage.setItem('marq_admin_logs', JSON.stringify(adminLogs));
    
    // Console log for admin debugging (invisible to users)
    console.log(`[ADMIN] New booking stored. Total bookings: ${appState.bookings.length}`);
}

// Initialize EmailJS (you'll need to configure this with your email)
function initializeEmailService() {
    // EmailJS configuration - you'll need to set this up
    emailjs.init("G6AZ7WBJysmNW7-YZ"); // Your EmailJS Public Key from Account → API Keys
}

// Send booking data to admin email
async function sendBookingToAdmin(bookings) {
    try {
        // Email service configuration
        const emailConfig = {
            serviceID: 'service_y3xt2pe', // Your Gmail/Outlook Service ID from Email Services
            templateID: 'template_4fcyf4m', // Your Template ID from the template you created
            adminEmail: 'ganguly92@gmail.com' // Your actual admin email address
        };
        
        // Send individual email for each booking (in case of round trip = 2 emails)
        for (const booking of bookings) {
            const trip = findTripById(booking.tripId);
            
            // Email parameters matching the template variables exactly
            const emailParams = {
                // Basic booking info
                booking_id: booking.id,
                passenger_name: booking.fullName,
                flat_number: booking.flatNumber || 'Not provided',
                
                // Trip details
                travel_date: booking.travelDate,
                trip_time: trip ? trip.time : 'Unknown',
                arrival_time: trip ? trip.arrival : 'Unknown',
                direction: booking.direction.toUpperCase(),
                booking_type: booking.bookingType.toUpperCase(),
                
                // Passenger details
                passenger_count: booking.passengers.toString(),
                special_requests: booking.specialRequests || 'None',
                booking_timestamp: new Date(booking.bookingTime).toLocaleString('en-IN'),
                
                // Payment details
                payment_amount: booking.payment ? `₹${booking.payment.amount}` : 'Not available',
                payment_confirmed: booking.payment ? (booking.payment.paymentConfirmed ? 'YES' : 'NO') : 'Unknown',
                screenshot_uploaded: booking.payment ? (booking.payment.screenshotUploaded ? 'YES' : 'NO') : 'Unknown',
                screenshot_filename: booking.payment ? booking.payment.screenshotFileName : 'Not available',
                
                // Summary information
                total_bookings: bookings.length.toString(),
                total_passengers: bookings.reduce((sum, b) => sum + b.passengers, 0).toString(),
                total_amount: `₹${bookings.reduce((sum, b) => sum + (b.payment ? b.payment.amount : 0), 0)}`,
                current_date: new Date().toLocaleDateString('en-IN', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                }),
                
                // Admin email (for template routing)
                to_email: emailConfig.adminEmail,
                from_name: 'MARQ Shuttle Booking System',
                reply_to: 'noreply@marqshuttle.com'
            };
            
            // Send email (only if EmailJS is properly configured)
            if (emailConfig.serviceID !== 'YOUR_SERVICE_ID') {
                await emailjs.send(emailConfig.serviceID, emailConfig.templateID, emailParams);
                console.log(`[ADMIN] Booking notification sent for ${booking.id}`);
            } else {
                console.log('[ADMIN] Email service not configured - booking saved locally only');
                console.log('[ADMIN] See EmailJS_Template_Setup.md for configuration instructions');
            }
        }
        
        console.log(`[ADMIN] All booking notifications processed (${bookings.length} emails)`);
        
    } catch (error) {
        console.error('Error sending admin notification:', error);
        // Booking still saved locally even if email fails
        showAlert('Booking saved successfully! (Email notification may have failed)', 'info');
    }
}

// Hidden admin panel - only accessible via Ctrl+Shift+A
function showAdminPanel() {
    const password = prompt('Enter admin password:');
    if (password !== 'marq2025admin') {
        alert('Access denied.');
        return;
    }
    
    const stats = getDataStatistics();
    const totalBookings = appState.bookings.length;
    const totalPassengers = appState.bookings.reduce((sum, b) => sum + b.passengers, 0);
    const adminLogs = JSON.parse(localStorage.getItem('marq_admin_logs') || '[]');
    
    const dateBreakdownText = stats.dateBreakdown.map(d => 
        `${d.date}: ${d.bookings} bookings, ${d.passengers} passengers`
    ).join('\n');
    
    // Check if XLSX library is loaded
    const xlsxStatus = typeof XLSX !== 'undefined' ? '✅ Ready' : '❌ Not Loaded';
    
    const adminInfo = `
MARQ Shuttle Admin Dashboard
============================
📊 DATA OVERVIEW:
• Total Bookings: ${totalBookings}
• Total Passengers: ${totalPassengers}
• Booking Sessions: ${adminLogs.length}

💾 STORAGE STATUS:
• Storage Size: ${stats.storageSizeMB}MB
• Performance: ${stats.performanceLevel}
• Capacity Usage: ${totalBookings} records

📊 EXCEL EXPORT STATUS:
• XLSX Library: ${xlsxStatus}
• Export Available: ${totalBookings > 0 ? '✅ Yes' : '⚠️ Empty Template Only'}

📅 DATE BREAKDOWN:
${dateBreakdownText || 'No bookings yet'}

⚠️ PERFORMANCE THRESHOLDS:
• EXCELLENT: < 1,000 bookings (< 1MB)
• GOOD: < 2,000 bookings (< 2MB)  
• FAIR: < 3,000 bookings (< 3MB)
• WARNING: < 4,000 bookings (< 4MB)
• CRITICAL: > 4,000 bookings (> 4MB)

Available Actions:
    `;
    
    const action = prompt(adminInfo + '\n\nChoose action:\nE - Export all data to Excel\nS - Show detailed statistics\nA - Archive old data\nT - Test Excel Export\nM - Manual Data Entry (Multi-device)\nI - Import from Email Instructions\n\n🚨 DANGER ZONE (Admin Only):\nC - Clear all data\nCLEAR - Direct clear\nESC - Close');
    
    if (action && action.toLowerCase() === 'e') {
        exportMasterBookingSheet();
    } else if (action && action.toLowerCase() === 's') {
        showDetailedStatistics();
    } else if (action && action.toLowerCase() === 'a') {
        archiveOldData();
    } else if (action && action.toLowerCase() === 'c') {
        clearAllBookingData();
    } else if (action && action.toUpperCase() === 'CLEAR') {
        // Direct clear without additional password prompt
        const confirmation = confirm('⚠️ DANGER: This will permanently delete ALL data from both local storage and Firebase!\n\nThis cannot be undone. Continue?');
        if (confirmation) {
            const finalConfirm = confirm('🚨 FINAL WARNING: Are you absolutely sure you want to delete ALL booking data?');
            if (finalConfirm) {
                directClearAllData();
            }
        }
    } else if (action && action.toLowerCase() === 't') {
        testExcelExport();
    } else if (action && action.toLowerCase() === 'm') {
        showManualDataEntry();
    } else if (action && action.toLowerCase() === 'i') {
        showEmailImportInstructions();
    }
}

// Secure master sheet export - only for admin
function exportMasterBookingSheet() {
    try {
        // Check if XLSX library is loaded
        if (typeof XLSX === 'undefined') {
            alert('Excel library not loaded. Please refresh the page and try again.');
            console.error('XLSX library not found');
            return;
        }
        
        // Check if there are bookings to export
        if (appState.bookings.length === 0) {
            // Create empty template even if no bookings
            alert('No bookings found. Creating empty template.');
            createEmptyBookingTemplate();
            return;
        }
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
        const timeStr = today.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
        }).replace(':', ''); // HHMM
        
        // Create comprehensive booking data - ALL bookings in one sheet
        const masterData = appState.bookings.map((booking, index) => {
            const trip = findTripById(booking.tripId);
            return {
                'Serial No': index + 1,
                'Booking ID': booking.id,
                'Full Name': booking.fullName,
                'Flat/Block': booking.flatNumber || 'Not provided',
                'Travel Date': booking.travelDate,
                'Trip Time': trip ? trip.time : 'Unknown',
                'Arrival Time': trip ? trip.arrival : 'Unknown',
                'Direction': booking.direction.charAt(0).toUpperCase() + booking.direction.slice(1),
                'Booking Type': booking.bookingType.charAt(0).toUpperCase() + booking.bookingType.slice(1),
                'Passengers Count': booking.passengers,
                'Special Requests': booking.specialRequests || 'None',
                'Booking Date & Time': new Date(booking.bookingTime).toLocaleString('en-IN'),
                'Status': booking.status.toUpperCase(),
                'Route': 'Assetz Marq ↔ Kadugodi Metro'
            };
        });
        
        // Sort by travel date and then by trip time for better organization
        masterData.sort((a, b) => {
            if (a['Travel Date'] !== b['Travel Date']) {
                return a['Travel Date'].localeCompare(b['Travel Date']);
            }
            return a['Trip Time'].localeCompare(b['Trip Time']);
        });
        
        // Create Excel workbook with single master sheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(masterData);
        
        // Auto-fit column widths
        const colWidths = [
            { wch: 8 },   // Serial No
            { wch: 12 },  // Booking ID
            { wch: 20 },  // Full Name
            { wch: 12 },  // Flat/Block
            { wch: 12 },  // Travel Date
            { wch: 10 },  // Trip Time
            { wch: 12 },  // Arrival Time
            { wch: 10 },  // Direction
            { wch: 12 },  // Booking Type
            { wch: 10 },  // Passengers Count
            { wch: 20 },  // Special Requests
            { wch: 20 },  // Booking Date & Time
            { wch: 10 },  // Status
            { wch: 25 }   // Route
        ];
        worksheet['!cols'] = colWidths;
        
        // Add title and summary info
        const summary = [
            [`MARQ Feeder Shuttle - Master Booking Sheet`],
            [`Generated on: ${today.toLocaleString('en-IN')}`],
            [`Total Bookings: ${appState.bookings.length}`],
            [`Total Passengers: ${appState.bookings.reduce((sum, b) => sum + b.passengers, 0)}`],
            [``] // Empty row before data
        ];
        
        // Insert summary at top
        XLSX.utils.sheet_add_aoa(worksheet, summary, { origin: 'A1' });
        
        // Add data starting from row 6 (after summary)
        XLSX.utils.sheet_add_json(worksheet, masterData, { origin: 'A6', skipHeader: false });
        
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Master Bookings');
        
        // Download with timestamp for version control
        const filename = `MARQ_Master_Bookings_${dateStr}_${timeStr}.xlsx`;
        XLSX.writeFile(workbook, filename);
        
        console.log(`[ADMIN] Master booking sheet exported: ${filename}`);
        console.log(`[ADMIN] Total bookings: ${appState.bookings.length}`);
        alert(`Excel file exported successfully! \nFilename: ${filename}\nBookings: ${appState.bookings.length}`);
        
    } catch (error) {
        console.error('Error exporting master booking sheet:', error);
        alert(`Error exporting data: ${error.message}\nPlease try again or contact support.`);
    }
}

// Create empty booking template for admin
function createEmptyBookingTemplate() {
    try {
        if (typeof XLSX === 'undefined') {
            alert('Excel library not loaded. Please refresh the page.');
            return;
        }
        
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        const timeStr = today.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
        }).replace(':', '');
        
        // Create empty template with headers
        const templateData = [{
            'Serial No': '',
            'Booking ID': '',
            'Full Name': '',
            'Flat/Block': '',
            'Travel Date': '',
            'Trip Time': '',
            'Arrival Time': '',
            'Direction': '',
            'Booking Type': '',
            'Passengers Count': '',
            'Special Requests': '',
            'Booking Date & Time': '',
            'Status': '',
            'Route': 'Assetz Marq ↔ Kadugodi Metro'
        }];
        
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(templateData);
        
        // Auto-fit column widths
        const colWidths = [
            { wch: 8 }, { wch: 12 }, { wch: 20 }, { wch: 12 },
            { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 10 },
            { wch: 12 }, { wch: 10 }, { wch: 20 }, { wch: 20 }, 
            { wch: 10 }, { wch: 25 }
        ];
        worksheet['!cols'] = colWidths;
        
        // Add header info
        const summary = [
            [`MARQ Feeder Shuttle - Booking Template`],
            [`Generated on: ${today.toLocaleString('en-IN')}`],
            [`Status: No bookings found - Empty template`],
            [`Instructions: This template shows the format for booking data`],
            [``]
        ];
        
        XLSX.utils.sheet_add_aoa(worksheet, summary, { origin: 'A1' });
        XLSX.utils.sheet_add_json(worksheet, templateData, { origin: 'A6', skipHeader: false });
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Booking Template');
        
        const filename = `MARQ_Booking_Template_${dateStr}_${timeStr}.xlsx`;
        XLSX.writeFile(workbook, filename);
        
        console.log(`[ADMIN] Empty template exported: ${filename}`);
        alert(`Empty booking template exported!\nFilename: ${filename}`);
        
    } catch (error) {
        console.error('Error creating template:', error);
        alert(`Error creating template: ${error.message}`);
    }
}

// Admin function to clear all booking data (hidden, password protected)
async function clearAllBookingData() {
    const password = prompt('Enter admin password to clear all data:');
    if (password !== 'marq2025admin') {
        alert('Access denied.');
        return;
    }
    
    const confirmation = prompt('Type "DELETE ALL" to confirm data deletion (includes Firebase):');
    if (confirmation !== 'DELETE ALL') {
        alert('Deletion cancelled.');
        return;
    }
    
    try {
        // Clear local data
        appState.bookings = [];
        localStorage.removeItem('marqShuttleBookings');
        localStorage.removeItem('shuttleBookings');
        localStorage.removeItem('tripBookings');
        localStorage.removeItem('bookingStats');
        localStorage.removeItem('marq_admin_logs');
        
        // Clear Firebase data if available
        if (typeof db !== 'undefined') {
            console.log('🧹 Clearing Firebase data...');
            
            const collections = ['bookings', 'trips', 'stats', 'test'];
            
            for (const collectionName of collections) {
                const snapshot = await db.collection(collectionName).get();
                console.log(`📊 Found ${snapshot.size} documents in ${collectionName}`);
                
                if (snapshot.size > 0) {
                    // Delete all documents in batches
                    const batch = db.batch();
                    snapshot.docs.forEach(doc => {
                        batch.delete(doc.ref);
                    });
                    
                    await batch.commit();
                    console.log(`✅ Cleared ${collectionName} collection`);
                }
            }
            
            console.log('🎉 Firebase data cleared successfully!');
        }
        
        updateTripCapacities();
        updateTimeSlots();
        
        alert('✅ All booking data has been cleared from both local storage and Firebase!');
        console.log('[ADMIN] All booking data cleared (local + Firebase)');
        
        // Refresh page to update UI
        setTimeout(() => window.location.reload(), 1000);
        
    } catch (error) {
        console.error('❌ Error clearing data:', error);
        alert(`❌ Error clearing Firebase data: ${error.message}`);
    }
}

// Direct clear function without password prompt (already authenticated)
async function directClearAllData() {
    try {
        console.log('🧹 Starting direct clear of all data...');
        
        // Clear local data
        appState.bookings = [];
        localStorage.removeItem('marqShuttleBookings');
        localStorage.removeItem('shuttleBookings');
        localStorage.removeItem('tripBookings');
        localStorage.removeItem('bookingStats');
        localStorage.removeItem('marq_admin_logs');
        
        // Clear Firebase data if available
        if (typeof db !== 'undefined') {
            console.log('🧹 Clearing Firebase data...');
            
            const collections = ['bookings', 'trips', 'stats', 'test'];
            
            for (const collectionName of collections) {
                const snapshot = await db.collection(collectionName).get();
                console.log(`📊 Found ${snapshot.size} documents in ${collectionName}`);
                
                if (snapshot.size > 0) {
                    // Delete all documents in batches
                    const batch = db.batch();
                    snapshot.docs.forEach(doc => {
                        batch.delete(doc.ref);
                    });
                    
                    await batch.commit();
                    console.log(`✅ Cleared ${collectionName} collection`);
                }
            }
            
            console.log('🎉 Firebase data cleared successfully!');
        }
        
        updateTripCapacities();
        updateTimeSlots();
        
        alert('✅ ALL DATA CLEARED!\n\n🧹 Local storage: Cleared\n🔥 Firebase: Cleared\n🔄 UI: Reset\n\nPage will refresh in 2 seconds...');
        console.log('[ADMIN] Direct clear completed - all data removed');
        
        // Refresh page to update UI
        setTimeout(() => window.location.reload(), 2000);
        
    } catch (error) {
        console.error('❌ Error in direct clear:', error);
        alert(`❌ Error clearing data: ${error.message}`);
    }
}

// Test Excel export functionality
function testExcelExport() {
    try {
        if (typeof XLSX === 'undefined') {
            alert('❌ XLSX Library NOT LOADED!\n\nThe Excel library failed to load.\nPlease refresh the page and try again.\n\nIf problem persists:\n1. Check internet connection\n2. Try a different browser\n3. Check browser console for errors');
            return;
        }
        
        // Create test data
        const testData = [{
            'Test': 'Excel Export Working',
            'Status': '✅ Success',
            'Time': new Date().toLocaleString('en-IN'),
            'Library': 'XLSX v' + (XLSX.version || 'Unknown')
        }];
        
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(testData);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Test Export');
        
        const filename = `MARQ_Excel_Test_${Date.now()}.xlsx`;
        XLSX.writeFile(workbook, filename);
        
        alert(`✅ EXCEL EXPORT TEST SUCCESSFUL!\n\nLibrary Status: ✅ XLSX Loaded\nTest File: ${filename}\nFile Downloaded: ✅ Yes\n\nYour Excel export is working perfectly!`);
        console.log('[ADMIN] Excel export test successful');
        
    } catch (error) {
        alert(`❌ EXCEL EXPORT TEST FAILED!\n\nError: ${error.message}\n\nTroubleshooting:\n1. Refresh the page\n2. Check browser console\n3. Try different browser\n4. Check internet connection`);
        console.error('[ADMIN] Excel export test failed:', error);
    }
}

// Manual data entry for multi-device consolidation
function showManualDataEntry() {
    const instructions = `
MULTI-DEVICE DATA CONSOLIDATION
===============================

Since localStorage is device-specific, here are your options:

📧 OPTION 1: USE EMAIL DATA (RECOMMENDED)
• All bookings automatically sent to: ganguly92@gmail.com
• Each booking = one email with complete details
• Copy data from emails to create master Excel

📱 OPTION 2: EXPORT FROM EACH DEVICE
• Mobile: Triple-click footer → Admin → Export
• Desktop: Ctrl+Shift+A → Export  
• Tablet: Same as mobile
• Manually merge Excel files

🔧 OPTION 3: MANUAL ENTRY (THIS OPTION)
• Add booking data from other devices manually
• Enter data you see on mobile/tablet here

Would you like to manually add a booking from another device?
    `;
    
    const proceed = confirm(instructions + "\n\nClick OK to manually add booking data, Cancel to return to admin menu.");
    
    if (proceed) {
        addManualBooking();
    }
}

// Add manual booking entry
function addManualBooking() {
    try {
        const bookingId = prompt("Enter Booking ID (from other device):\nExample: MFS-1731234567890-ABC12") || "";
        if (!bookingId) return;
        
        const fullName = prompt("Enter Full Name:") || "";
        const flatNumber = prompt("Enter Flat/Block:") || "";
        const travelDate = prompt("Enter Travel Date (YYYY-MM-DD):\nExample: 2025-11-10") || "";
        const direction = prompt("Enter Direction (morning/evening):") || "morning";
        const passengers = parseInt(prompt("Enter Number of Passengers:") || "1");
        
        // Create manual booking entry
        const manualBooking = {
            id: bookingId,
            tripId: direction === "morning" ? "morning_725" : "evening_530",
            fullName: fullName,
            flatNumber: flatNumber,
            travelDate: travelDate,
            bookingType: "single",
            direction: direction,
            passengers: passengers,
            specialRequests: "Manually entered from " + prompt("Device source (mobile/tablet/desktop):"),
            bookingTime: new Date().toISOString(),
            status: "confirmed",
            manualEntry: true
        };
        
        // Add to bookings
        appState.bookings.push(manualBooking);
        saveBookings();
        updateTripCapacities();
        
        alert(`✅ Manual booking added successfully!\n\nBooking ID: ${bookingId}\nName: ${fullName}\nPassengers: ${passengers}\n\nTotal bookings now: ${appState.bookings.length}`);
        
        const addMore = confirm("Booking added successfully!\n\nWould you like to add another booking from a different device?");
        if (addMore) {
            addManualBooking();
        }
        
    } catch (error) {
        alert("Error adding manual booking: " + error.message);
    }
}

// Show email import instructions
function showEmailImportInstructions() {
    const instructions = `
EMAIL-TO-EXCEL CONVERSION GUIDE
===============================

Since ALL bookings are sent to ganguly92@gmail.com, 
you can use your email as the master database:

📧 EMAIL FORMAT (what you receive):
🎫 BOOKING ID: MFS-1731234567890-ABC12
👤 Name: John Doe
🏠 Flat/Block: A-101
📅 Travel Date: 2025-11-10
🕐 Trip Time: 7:25 AM → 7:50 AM
🔄 Direction: MORNING
👥 Passengers: 2

📊 EXCEL CONVERSION STEPS:
1. Go to Gmail: ganguly92@gmail.com
2. Search: "MARQ Shuttle Booking"
3. Copy each booking email data to Excel:
   - Column A: Booking ID
   - Column B: Name  
   - Column C: Flat
   - Column D: Date
   - Column E: Time
   - Column F: Direction
   - Column G: Passengers

🚀 AUTOMATED OPTIONS:
• Use Gmail filters to forward to Google Sheets
• Use Zapier to auto-convert emails to spreadsheet
• Use Gmail export tools for bulk processing

💡 TIP: Your email inbox contains ALL bookings from ALL devices!
This is actually more reliable than localStorage.
    `;
    
    alert(instructions);
    
    const openGmail = confirm("Would you like to open Gmail now to check your booking emails?");
    if (openGmail) {
        window.open('https://gmail.com', '_blank');
    }
}

// Performance monitoring functions
function getPerformanceLevel(dataSize) {
    if (dataSize < 1024 * 1024) return 'EXCELLENT'; // < 1MB
    if (dataSize < 2 * 1024 * 1024) return 'GOOD'; // < 2MB
    if (dataSize < 3 * 1024 * 1024) return 'FAIR'; // < 3MB
    if (dataSize < 4 * 1024 * 1024) return 'WARNING'; // < 4MB
    return 'CRITICAL'; // >= 4MB
}

function showStorageWarning() {
    const warning = `
STORAGE QUOTA EXCEEDED!
======================
The booking database has reached maximum capacity.
Please contact admin to archive old data.

Current solutions:
1. Export and clear old bookings
2. Archive completed trip data
3. Consider database migration
    `;
    alert(warning);
}

function getDataStatistics() {
    try {
        const metadata = JSON.parse(localStorage.getItem('marq_data_metadata') || '{}');
        const bookings = appState.bookings;
        
        // Group by date for analysis
        const bookingsByDate = {};
        bookings.forEach(booking => {
            const date = booking.travelDate;
            if (!bookingsByDate[date]) {
                bookingsByDate[date] = [];
            }
            bookingsByDate[date].push(booking);
        });
        
        return {
            metadata: metadata,
            totalBookings: bookings.length,
            totalPassengers: bookings.reduce((sum, b) => sum + b.passengers, 0),
            dateBreakdown: Object.keys(bookingsByDate).map(date => ({
                date: date,
                bookings: bookingsByDate[date].length,
                passengers: bookingsByDate[date].reduce((sum, b) => sum + b.passengers, 0)
            })).sort((a, b) => a.date.localeCompare(b.date)),
            performanceLevel: metadata.performanceLevel || 'UNKNOWN',
            storageSizeMB: metadata.dataSizeMB || 'Unknown'
        };
    } catch (error) {
        console.error('Error getting statistics:', error);
        return null;
    }
}

// Show detailed statistics
function showDetailedStatistics() {
    const stats = getDataStatistics();
    if (!stats) {
        alert('Error retrieving statistics');
        return;
    }
    
    const detailedInfo = `
DETAILED SYSTEM STATISTICS
===========================
📈 PERFORMANCE METRICS:
• Current Level: ${stats.performanceLevel}
• Storage Used: ${stats.storageSizeMB}MB
• Total Records: ${stats.totalBookings}
• Average per Date: ${(stats.totalBookings / Math.max(stats.dateBreakdown.length, 1)).toFixed(1)}

🔄 CAPACITY ANALYSIS:
• Records per MB: ~${Math.round(stats.totalBookings / parseFloat(stats.storageSizeMB || 1))}
• Estimated Max Capacity: ~4,000-6,000 bookings
• Current Usage: ${((stats.totalBookings / 5000) * 100).toFixed(1)}%

⏰ SYSTEM HEALTH:
• Last Updated: ${stats.metadata.lastUpdated ? new Date(stats.metadata.lastUpdated).toLocaleString() : 'Unknown'}
• Browser: ${navigator.userAgent.split(' ')[0]}
• Platform: ${navigator.platform}

📊 RECOMMENDATIONS:
${getRecommendations(stats)}
    `;
    
    alert(detailedInfo);
}

function getRecommendations(stats) {
    const level = stats.performanceLevel;
    const bookingCount = stats.totalBookings;
    
    switch (level) {
        case 'EXCELLENT':
            return '✅ System running optimally. No action needed.';
        case 'GOOD':
            return '✅ Good performance. Monitor growth rate.';
        case 'FAIR':
            return '⚠️ Consider archiving bookings older than 7 days.';
        case 'WARNING':
            return '🔶 Archive old data soon. Performance may degrade.';
        case 'CRITICAL':
            return '🚨 URGENT: Archive or clear old data immediately!';
        default:
            return '📊 Unable to assess current performance level.';
    }
}

// Archive old data (bookings older than specified days)
function archiveOldData() {
    const days = prompt('Archive bookings older than how many days? (Enter number):');
    if (!days || isNaN(days)) {
        alert('Invalid input. Operation cancelled.');
        return;
    }
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];
    
    const oldBookings = appState.bookings.filter(b => b.travelDate < cutoffDateStr);
    const recentBookings = appState.bookings.filter(b => b.travelDate >= cutoffDateStr);
    
    if (oldBookings.length === 0) {
        alert(`No bookings found older than ${days} days.`);
        return;
    }
    
    const confirmation = confirm(`Found ${oldBookings.length} bookings older than ${days} days.\n\nThis will:\n1. Export old bookings to Excel\n2. Keep only ${recentBookings.length} recent bookings\n3. Free up storage space\n\nProceed with archival?`);
    
    if (!confirmation) return;
    
    // Export old bookings first
    exportArchiveData(oldBookings, days);
    
    // Keep only recent bookings
    appState.bookings = recentBookings;
    saveBookings();
    updateTripCapacities();
    updateTimeSlots();
    
    alert(`Archive completed!\n\nArchived: ${oldBookings.length} old bookings\nRemaining: ${recentBookings.length} recent bookings\n\nOld data exported to Excel file.`);
}

// Export archive data
function exportArchiveData(archivedBookings, daysOld) {
    try {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        
        const archiveData = archivedBookings.map((booking, index) => {
            const trip = findTripById(booking.tripId);
            return {
                'Archive Date': dateStr,
                'Days Old': daysOld,
                'Serial No': index + 1,
                'Booking ID': booking.id,
                'Full Name': booking.fullName,
                'Flat/Block': booking.flatNumber || 'Not provided',
                'Travel Date': booking.travelDate,
                'Trip Time': trip ? trip.time : 'Unknown',
                'Direction': booking.direction.charAt(0).toUpperCase() + booking.direction.slice(1),
                'Passengers': booking.passengers,
                'Booking Time': new Date(booking.bookingTime).toLocaleString('en-IN'),
                'Status': booking.status.toUpperCase()
            };
        });
        
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(archiveData);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Archived Bookings');
        
        const filename = `MARQ_Archive_${daysOld}days_${dateStr}.xlsx`;
        XLSX.writeFile(workbook, filename);
        
        console.log(`[ADMIN] Archived ${archivedBookings.length} bookings to ${filename}`);
        
    } catch (error) {
        console.error('Error exporting archive:', error);
        alert('Error creating archive file. Data not archived.');
    }
}

// Quick statistics view
function showQuickStatistics() {
    const stats = getDataStatistics();
    if (!stats) {
        alert('Error retrieving statistics');
        return;
    }
    
    const quickStats = `
📊 QUICK STATISTICS
===================
Records: ${stats.totalBookings}
Size: ${stats.storageSizeMB}MB  
Performance: ${stats.performanceLevel}
Passengers: ${stats.totalPassengers}

${stats.performanceLevel === 'CRITICAL' ? '🚨 CRITICAL: Archive needed!' : 
  stats.performanceLevel === 'WARNING' ? '⚠️ WARNING: Consider archiving' : 
  '✅ System healthy'}
    `;
    
    alert(quickStats);
}

// Firebase Integration Functions
async function saveBookingsToFirebase(bookings) {
    if (typeof saveBookingToFirebase === 'function') {
        console.log(`🔥 Saving ${bookings.length} bookings to Firebase...`);
        
        for (const booking of bookings) {
            try {
                await saveBookingToFirebase(booking);
                console.log(`✅ Booking ${booking.id} saved to Firebase`);
            } catch (error) {
                console.error(`❌ Failed to save booking ${booking.id} to Firebase:`, error);
            }
        }
        
        console.log("🔥 Firebase save operation completed");
    } else {
        console.log("⚠️ Firebase not available - bookings saved locally only");
    }
}

// Enhanced admin panel with Firebase data
async function showEnhancedAdminPanel() {
    if (typeof getAllBookingsFromFirebase === 'function') {
        try {
            const firebaseBookings = await getAllBookingsFromFirebase();
            const firebaseStats = await getStatisticsFromFirebase();
            
            let adminInfo = `
🔥 FIREBASE + LOCAL DATA COMPARISON
==================================

📊 LOCAL STORAGE:
- Bookings: ${appState.bookings.length}
- Last Updated: ${new Date().toLocaleString('en-IN')}

🔥 FIREBASE DATABASE:
- Bookings: ${firebaseBookings.length}
- Total Passengers: ${firebaseStats?.totalPassengers || 0}
- Total Revenue: ₹${firebaseStats?.totalRevenue || 0}
- Last Updated: ${firebaseStats?.lastUpdated ? new Date(firebaseStats.lastUpdated.toDate()).toLocaleString('en-IN') : 'Never'}

📈 DATA SYNC STATUS:
${firebaseBookings.length === appState.bookings.length ? '✅ Synchronized' : '⚠️ Sync difference detected'}

Available Actions:
E - Export Firebase data to Excel
S - Show Firebase statistics
L - Load Firebase data to local
F - Force sync Firebase
C - Clear all data (LOCAL + FIREBASE)
            `;
            
            const action = prompt(adminInfo + '\n\nChoose action:');
            
            if (action && action.toLowerCase() === 'e') {
                exportFirebaseDataToExcel(firebaseBookings);
            } else if (action && action.toLowerCase() === 's') {
                showFirebaseStatistics(firebaseStats);
            } else if (action && action.toLowerCase() === 'l') {
                loadFirebaseDataToLocal(firebaseBookings);
            } else if (action && action.toLowerCase() === 'f') {
                forceSyncWithFirebase();
            } else if (action && action.toLowerCase() === 'c') {
                clearAllDataIncludingFirebase();
            }
            
        } catch (error) {
            console.error("❌ Error accessing Firebase data:", error);
            showAdminPanel(); // Fallback to local admin panel
        }
    } else {
        showAdminPanel(); // Fallback to local admin panel
    }
}

async function exportFirebaseDataToExcel(firebaseBookings) {
    if (!firebaseBookings || firebaseBookings.length === 0) {
        alert('No Firebase data to export');
        return;
    }
    
    try {
        // Convert Firebase data to Excel format
        const excelData = firebaseBookings.map(booking => ({
            'Booking ID': booking.id,
            'Full Name': booking.fullName,
            'Flat Number': booking.flatNumber || 'Not provided',
            'Travel Date': booking.travelDate,
            'Trip Time': findTripById(booking.tripId)?.time || 'Unknown',
            'Direction': booking.direction.toUpperCase(),
            'Booking Type': booking.bookingType.toUpperCase(),
            'Passengers': booking.passengers,
            'Payment Amount': booking.payment?.amount || 0,
            'Payment Confirmed': booking.payment?.paymentConfirmed ? 'YES' : 'NO',
            'Screenshot Uploaded': booking.payment?.screenshotUploaded ? 'YES' : 'NO',
            'Special Requests': booking.specialRequests || 'None',
            'Booking Time': booking.createdAt ? new Date(booking.createdAt.toDate()).toLocaleString('en-IN') : booking.bookingTime,
            'Status': booking.status
        }));
        
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Firebase Bookings');
        
        const fileName = `MARQ_Firebase_Bookings_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName);
        
        alert(`✅ Firebase data exported to ${fileName}`);
        
    } catch (error) {
        console.error('Error exporting Firebase data:', error);
        alert('❌ Error exporting Firebase data');
    }
}

// Reset all trip capacities to default (for Firebase sync)
function resetAllTripCapacities() {
    console.log("🔄 Resetting all trip capacities to default (empty Firebase)");
    
    // Reset the trips data structure
    const defaultTrips = [
        {
            id: 'morning_0725_weekday',
            time: '7:25 AM',
            arrival: '7:50 AM',
            capacity: 29,
            booked: 0,
            available: 29,
            direction: 'morning'
        },
        {
            id: 'morning_0815_weekday',
            time: '8:15 AM', 
            arrival: '8:40 AM',
            capacity: 29,
            booked: 0,
            available: 29,
            direction: 'morning'
        },
        {
            id: 'morning_0850_weekday',
            time: '8:50 AM',
            arrival: '9:15 AM', 
            capacity: 29,
            booked: 0,
            available: 29,
            direction: 'morning'
        }
    ];
    
    // Update the global trips data if it exists
    if (typeof appState !== 'undefined' && appState.trips) {
        // Reset morning trips
        if (Array.isArray(appState.trips.morning)) {
            appState.trips.morning.forEach(trip => {
                trip.booked = 0;
                trip.available = trip.capacity || 29;
            });
        }
        
        // Reset evening trips
        if (Array.isArray(appState.trips.evening)) {
            appState.trips.evening.forEach(trip => {
                trip.booked = 0;
                trip.available = trip.capacity || 29;
            });
        }
    }
    
    // Update the UI to reflect the reset
    updateTimeSlots();
    
    console.log("✅ Trip capacities reset to empty state");
}

// Immediate Firebase verification after booking
async function verifyFirebaseSave(bookings) {
    if (typeof getAllBookingsFromFirebase !== 'function') {
        console.log("🔍 Firebase verification: Firebase not available");
        return;
    }
    
    try {
        console.log("🔍 Verifying Firebase save...");
        const firebaseBookings = await getAllBookingsFromFirebase();
        const recentBookingIds = bookings.map(b => b.id);
        
        let foundCount = 0;
        for (const bookingId of recentBookingIds) {
            const found = firebaseBookings.find(fb => fb.id === bookingId);
            if (found) {
                foundCount++;
                console.log(`✅ Verified: Booking ${bookingId} found in Firebase`);
            } else {
                console.log(`❌ Warning: Booking ${bookingId} NOT found in Firebase`);
            }
        }
        
        if (foundCount === bookings.length) {
            console.log("🎉 VERIFICATION SUCCESS: All bookings saved to Firebase!");
            
            // Optional: Show user confirmation
            const verificationAlert = `
🔥 FIREBASE VERIFICATION SUCCESS!

✅ ${foundCount}/${bookings.length} bookings saved to Firebase
✅ Data is safely stored in cloud database
✅ Admin can access via Firebase Console

Your booking is confirmed and backed up! 🎯
            `;
            
            // Uncomment this line if you want to show user confirmation:
            // alert(verificationAlert);
            
        } else {
            console.log(`⚠️ VERIFICATION PARTIAL: ${foundCount}/${bookings.length} bookings found in Firebase`);
        }
        
    } catch (error) {
        console.error("❌ Firebase verification failed:", error);
    }
}