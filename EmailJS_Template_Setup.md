# EmailJS Template Setup for MARQ Shuttle Booking

## 📧 Complete Email Template Configuration

### Step 1: EmailJS Account Setup

1. **Go to EmailJS.com** and create free account
2. **Add Email Service**:
   - Choose **Gmail** (most common) or **Outlook**
   - Connect your email account
   - Note down the **Service ID** (e.g., `service_abc123`)

### Step 2: Create Email Template

1. **Go to Email Templates** in EmailJS dashboard
2. **Click "Create New Template"**
3. **Template Name**: `MARQ Shuttle Booking Notification`
4. **Use the template below**:

## 📋 Email Template Content

### **Template ID**: `template_marq_booking`

### **Subject Line**:
```
🚌 New MARQ Shuttle Booking - {{travel_date}}
```

### **Email Body (HTML)**:
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .booking-details { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #2563eb; }
        .summary { background: #e3f2fd; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .footer { background: #333; color: white; padding: 15px; text-align: center; font-size: 12px; }
        .emoji { font-size: 1.2em; }
    </style>
</head>
<body>
    <div class="header">
        <h1><span class="emoji">🚌</span> MARQ FEEDER SHUTTLE</h1>
        <p>New Booking Notification</p>
    </div>
    
    <div class="content">
        <h2>New Booking Received</h2>
        <p><strong>Date:</strong> {{current_date}}</p>
        
        <div class="booking-details">
            <h3><span class="emoji">🎫</span> Booking Information</h3>
            
            <p><strong>Booking ID:</strong> {{booking_id}}</p>
            <p><strong>Full Name:</strong> {{passenger_name}}</p>
            <p><strong>Phone Number:</strong> {{phone_number}}</p>
            <p><strong>Email:</strong> {{email_address}}</p>
            <p><strong>Flat/Block:</strong> {{flat_number}}</p>
            
            <hr>
            
            <h4><span class="emoji">🗓️</span> Trip Details</h4>
            <p><strong>Travel Date:</strong> {{travel_date}}</p>
            <p><strong>Trip Time:</strong> {{trip_time}}</p>
            <p><strong>Arrival Time:</strong> {{arrival_time}}</p>
            <p><strong>Direction:</strong> {{direction}}</p>
            <p><strong>Booking Type:</strong> {{booking_type}}</p>
            
            <hr>
            
            <h4><span class="emoji">👥</span> Passenger Information</h4>
            <p><strong>Number of Passengers:</strong> {{passenger_count}}</p>
            <p><strong>Special Requests:</strong> {{special_requests}}</p>
            <p><strong>Booking Time:</strong> {{booking_timestamp}}</p>
        </div>
        
        <div class="summary">
            <h3><span class="emoji">📊</span> Quick Summary</h3>
            <ul>
                <li>Total Bookings in this submission: {{total_bookings}}</li>
                <li>Total Passengers: {{total_passengers}}</li>
                <li>Route: Assetz Marq ↔ Kadugodi Metro Station</li>
                <li>Booking Status: CONFIRMED</li>
            </ul>
        </div>
        
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 15px 0; border-radius: 5px;">
            <h4><span class="emoji">⚡</span> Admin Actions</h4>
            <p>To access the admin dashboard:</p>
            <ol>
                <li>Open the booking website</li>
                <li>Press <strong>Ctrl+Shift+A</strong> for full admin panel</li>
                <li>Press <strong>Ctrl+Alt+E</strong> for Excel export</li>
                <li>Press <strong>Ctrl+Shift+S</strong> for quick statistics</li>
            </ol>
        </div>
    </div>
    
    <div class="footer">
        <p>This is an automated notification from the MARQ Shuttle Booking System</p>
        <p>Trial Period: November 10-13, 2025 | Route: Assetz Marq ↔ Kadugodi Metro</p>
    </div>
</body>
</html>
```

### **Plain Text Version** (backup):
```
🚌 MARQ FEEDER SHUTTLE - NEW BOOKING NOTIFICATION

New Booking Received: {{current_date}}

🎫 BOOKING DETAILS:
- Booking ID: {{booking_id}}
- Passenger Name: {{passenger_name}}
- Phone: {{phone_number}}
- Email: {{email_address}}
- Flat/Block: {{flat_number}}

🗓️ TRIP DETAILS:
- Travel Date: {{travel_date}}
- Trip Time: {{trip_time}} → {{arrival_time}}
- Direction: {{direction}}
- Booking Type: {{booking_type}}

👥 PASSENGER INFO:
- Passengers: {{passenger_count}}
- Special Requests: {{special_requests}}
- Booked At: {{booking_timestamp}}

📊 SUMMARY:
- Total Bookings: {{total_bookings}}
- Total Passengers: {{total_passengers}}
- Status: CONFIRMED

⚡ ADMIN ACCESS:
Visit the booking website and press Ctrl+Shift+A for admin dashboard.

---
Automated notification from MARQ Shuttle Booking System
Trial: Nov 10-13, 2025 | Route: Assetz Marq ↔ Kadugodi Metro
```

## 🔧 Template Variables Mapping

### **Required Variables** (use exactly these names):

| EmailJS Variable | Description | Example |
|------------------|-------------|---------|
| `booking_id` | Unique booking ID | MARQ-20251110-001 |
| `passenger_name` | Full name | John Doe |
| `phone_number` | Phone number | 9876543210 |
| `email_address` | Email (or "Not provided") | john@example.com |
| `flat_number` | Flat/Block (or "Not provided") | A-101 |
| `travel_date` | Travel date | 2025-11-10 |
| `trip_time` | Departure time | 7:25 AM |
| `arrival_time` | Arrival time | 7:50 AM |
| `direction` | Morning/Evening | MORNING |
| `booking_type` | Single/Round trip | SINGLE |
| `passenger_count` | Number of passengers | 2 |
| `special_requests` | Special requests (or "None") | Wheelchair access |
| `booking_timestamp` | When booked | 10/11/2025, 9:30:00 AM |
| `total_bookings` | Bookings in this submission | 1 |
| `total_passengers` | Total passengers | 2 |
| `current_date` | Today's date | November 10, 2025 |

## 📝 Script.js Configuration

After creating the template, update your script.js with these values:

```javascript
// Replace around line 1035:
emailjs.init("YOUR_EMAILJS_PUBLIC_KEY"); // From EmailJS Integration tab

// Replace around line 1045:
const emailConfig = {
    serviceID: 'service_abc123', // Your Gmail/Outlook service ID
    templateID: 'template_marq_booking', // The template ID from above
    adminEmail: 'your.admin@gmail.com' // Your admin email
};
```

## ✅ Test Configuration

### **Test Email Parameters**:
```javascript
const testParams = {
    booking_id: 'MARQ-TEST-001',
    passenger_name: 'Test User',
    phone_number: '9999999999',
    email_address: 'test@example.com',
    flat_number: 'T-100',
    travel_date: '2025-11-10',
    trip_time: '7:25 AM',
    arrival_time: '7:50 AM',
    direction: 'MORNING',
    booking_type: 'SINGLE',
    passenger_count: '1',
    special_requests: 'Test booking',
    booking_timestamp: new Date().toLocaleString('en-IN'),
    total_bookings: '1',
    total_passengers: '1',
    current_date: new Date().toLocaleDateString('en-IN')
};
```

## 🚀 Quick Setup Checklist

1. ✅ **Create EmailJS account**
2. ✅ **Add Gmail/Outlook service**
3. ✅ **Create template using above HTML**
4. ✅ **Copy Service ID and Template ID**
5. ✅ **Update script.js with your IDs**
6. ✅ **Test with a booking**
7. ✅ **Check your email for notification**

## 📱 Sample Notification Result

When someone books, you'll receive a **professional HTML email** with:
- 🎨 **Branded header** with MARQ Shuttle logo
- 📊 **Complete booking details** in organized sections
- 🔍 **Quick summary** for easy scanning
- ⚡ **Admin action instructions**
- 📱 **Mobile-friendly** formatting

This template ensures you get **all critical information** immediately when someone books! 📧✅