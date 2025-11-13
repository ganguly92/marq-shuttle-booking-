# MARQ Shuttle Booking - Deployment Guide

## 🚀 Option 3: GitHub Pages + Email Notifications

This guide helps you deploy the MARQ Shuttle booking system as a public website where:
- ✅ Anyone can access it via a public URL
- ✅ All booking data is sent to your email automatically
- ✅ You maintain admin access to all bookings
- ✅ Works on any device/network worldwide

## 📋 Step-by-Step Setup

### Step 1: Create GitHub Repository

1. **Go to GitHub.com** and sign in (create account if needed)
2. **Click "New Repository"**
3. **Repository name**: `marq-shuttle-booking`
4. **Make it Public** (required for free GitHub Pages)
5. **Click "Create repository"**

### Step 2: Upload Your Files

1. **Click "uploading an existing file"**
2. **Drag and drop ALL files** from your `Slot Booking` folder:
   - index.html
   - script.js
   - styles.css
   - README.md
   - DEPLOYMENT_GUIDE.md
3. **Commit message**: "Initial MARQ Shuttle booking system"
4. **Click "Commit changes"**

### Step 3: Enable GitHub Pages

1. **Go to repository Settings tab**
2. **Scroll to "Pages" section**
3. **Source**: Select "Deploy from a branch"
4. **Branch**: Select "main"
5. **Folder**: Select "/ (root)"
6. **Click Save**

🎉 **Your website will be live at**: `https://yourusername.github.io/marq-shuttle-booking`

### Step 4: Set Up Email Notifications (Optional but Recommended)

1. **Go to EmailJS.com** and create free account
2. **Add email service** (Gmail, Outlook, etc.)
3. **Create email template** for booking notifications
4. **Get your Service ID, Template ID, and User ID**
5. **Update script.js** with your EmailJS configuration:

```javascript
// Replace in script.js lines around 1035:
emailjs.init("YOUR_ACTUAL_USER_ID");

// Replace in script.js lines around 1045:
const emailConfig = {
    serviceID: 'YOUR_ACTUAL_SERVICE_ID',
    templateID: 'YOUR_ACTUAL_TEMPLATE_ID', 
    adminEmail: 'your.admin@email.com'
};
```

## 🌐 How It Helps Your Requirements

### ✅ **Public Access**
- **Anyone in Assetz Marq** can book from anywhere
- **Works on any device** (phone, laptop, tablet)
- **No network restrictions** (WiFi, mobile data, any location)

### ✅ **Central Data Collection**
- **Email notifications** for every new booking
- **Admin dashboard** accessible via keyboard shortcuts
- **Excel export** functionality maintained
- **Local backup** on your device

### ✅ **Real-World Usage**
```
🏢 Resident at office → Books via mobile data → You get email
🏠 Resident at home → Books via WiFi → You get email  
🚗 Resident traveling → Books from anywhere → You get email
```

### ✅ **Admin Control**
- **Ctrl+Shift+A**: Full admin dashboard
- **Ctrl+Alt+E**: Export all data to Excel
- **Ctrl+Shift+S**: Quick statistics
- **Email alerts**: Immediate notification of new bookings

## 📧 Email Notification Sample

When someone books, you'll receive an email like:
```
Subject: 🚌 New MARQ Shuttle Booking - 2025-11-10

NEW MARQ SHUTTLE BOOKING RECEIVED
==================================

🎫 BOOKING ID: MARQ-20251110-001
👤 Name: John Doe
🏠 Flat/Block: A-101
📅 Travel Date: 2025-11-10
🕐 Trip Time: 7:25 AM → 7:50 AM
🔄 Direction: MORNING
👥 Passengers: 2
📝 Special Requests: None
⏰ Booked At: 10/11/2025, 9:30:00 AM

📊 SUMMARY:
• Total Bookings: 1
• Total Passengers: 2
• Booking Type: SINGLE
```

## 🎯 Perfect for MARQ Shuttle Trial

This setup is **ideal for your 4-day trial** because:
- ✅ **No ongoing costs** (GitHub Pages free forever)
- ✅ **Immediate deployment** (live in 10 minutes)
- ✅ **Professional appearance** (custom domain possible later)
- ✅ **Reliable data collection** (email + local storage)
- ✅ **Scalable** (can handle hundreds of bookings easily)

## 🚀 Next Steps

1. **Deploy to GitHub Pages** (10 minutes)
2. **Test with a few bookings** (5 minutes)
3. **Set up EmailJS** (15 minutes) 
4. **Share the public URL** with Assetz Marq residents
5. **Monitor bookings** via email and admin dashboard

Your MARQ Shuttle booking system will be **publicly accessible** and **professionally managed**! 🚌📱🌐