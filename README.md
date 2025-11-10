# 🚍 MARQ Feeder Shuttle - Slot Booking System

A responsive web application for booking slots on the MARQ Feeder Shuttle service between Assetz Marq and Kadugodi Metro Station during the trial period.

## 🌟 Features

- **Single & Round Trip Booking**: Book either one-way or both morning and evening trips in a single form
- **Real-time Slot Booking**: Book available seats for morning and evening trips
- **Capacity Management**: Real-time tracking of 30-seater capacity (29 passengers + 1 driver)
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Local Storage**: Bookings are saved locally in the browser
- **Trip Schedule Display**: Clear view of all morning and evening trip timings
- **Form Validation**: Comprehensive validation with user-friendly error messages
- **Booking Confirmation**: Detailed confirmation with booking ID and trip information

## 🚌 Service Details

### Route
**Assetz Marq ↔ Kadugodi Metro Station**

### Trial Period
**Monday–Thursday (November 10-13, 2025)**

### Boarding Points
- **Morning Trips**: Near Roundabout (Main Entry) at Assetz Marq
- **Evening Trips**: Kadugodi Metro Station

### Fare
**₹35 per person per trip** (paid directly to the driver)

### Trip Timings

#### 🌅 Morning Trips (Marq → Kadugodi Metro)
| Trip | Departure | Expected Arrival |
|------|-----------|------------------|
| 1    | 7:25 AM   | ~7:50 AM        |
| 2    | 8:15 AM   | ~8:40 AM        |
| 3    | 8:55 AM   | ~9:20 AM        |
| 4    | 9:45 AM   | ~10:15 AM       |

#### 🌇 Evening Trips (Kadugodi Metro → Marq)
| Trip | Departure | Expected Arrival |
|------|-----------|------------------|
| 1    | 5:00 PM   | ~5:25 PM        |
| 2    | 6:00 PM   | ~6:25 PM        |
| 3    | 7:00 PM   | ~7:25 PM        |
| 4    | 8:00 PM   | ~8:25 PM        |

## 🚀 Quick Start

1. **Open the Application**
   - Simply open `index.html` in any modern web browser
   - No installation or setup required

2. **Book Your Slot**
   - Fill in your personal information
   - Select travel date
   - Choose booking type (Single Trip or Round Trip)
   - For Single Trip: Select direction and choose one time slot
   - For Round Trip: Select both morning and evening time slots
   - Confirm your booking

3. **Confirmation**
   - Receive booking confirmation with unique ID
   - Note the boarding point and timing
   - Arrive 5 minutes early with exact change

## 💻 Technical Requirements

### Browser Compatibility
- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

### Device Support
- Desktop computers
- Tablets (iPad, Android tablets)
- Mobile phones (iOS, Android)

## 📱 How to Use

### For Residents

1. **Access the App**: Open `index.html` in your web browser
2. **Fill Personal Details**: Enter your name, phone number, and flat details
3. **Select Trip**: Choose date, direction, and time slot
4. **Confirm Booking**: Review details and submit your booking
5. **Save Confirmation**: Note your booking ID and trip details

### For Administrators

The application includes admin functions accessible via browser console:

```javascript
// View all bookings
marqShuttleAdmin.viewBookings()

// Clear all bookings (use with caution)
marqShuttleAdmin.clearBookings()

// Export bookings as JSON
marqShuttleAdmin.exportBookings()
```

## 🏗️ Project Structure

```
Slot Booking/
├── index.html          # Main HTML file
├── styles.css          # CSS styles and responsive design
├── script.js           # JavaScript functionality
├── README.md           # This file
└── .github/
    └── copilot-instructions.md
```

## 🎨 Key Features Implemented

### User Interface
- Modern, clean design with gradient themes
- Intuitive form layout with clear sections
- Single and round-trip booking options
- Real-time capacity indicators with visual progress bars
- Modal confirmations for successful bookings
- Responsive grid layouts for different screen sizes

### Functionality
- Single trip and round-trip booking options
- Real-time seat availability tracking
- Form validation with immediate feedback
- Local storage for persistent bookings
- Booking ID generation for reference
- Capacity management with overflow protection

### Accessibility
- Keyboard navigation support
- Screen reader friendly markup
- High contrast color schemes
- Mobile-first responsive design
- Clear focus indicators

## ⚠️ Important Notes

- **Trial Service**: This is a pilot program to assess demand
- **Payment**: ₹35 per person paid directly to the driver
- **Capacity**: No standing passengers - seating only (29 seats available)
- **Service**: First come, first serve basis during trial
- **Data**: Bookings are stored locally in your browser
- **Responsibility**: Organizing team collects feedback but is not responsible for service quality

## 🔧 Development

### Local Development
1. Clone or download the project files
2. Open `index.html` in a web browser
3. No build process or dependencies required

### Customization
- Modify trip timings in `script.js` (appState.trips object)
- Update styling in `styles.css`
- Adjust capacity limits in the JavaScript configuration

### Deployment
- Upload all files to any web server
- Ensure all files are in the same directory
- No server-side processing required

## 📞 Support

For questions, feedback, or technical issues during the trial period, please contact the organizing team through your resident community channels.

## 📄 License

This project is created for the MARQ community trial program and is provided as-is for free use by residents.

---

**🚍 Safe travels with MARQ Feeder Shuttle!**