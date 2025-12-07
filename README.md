# Lottery Frontend

React + Vite frontend for the Lottery application.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:

```env
VITE_BACKEND_URL=http://localhost:5000
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```

## Features
- Ticket purchase with Razorpay integration
- Admin dashboard
- Winner display
- Ticket search by mobile number
