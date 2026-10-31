# Subscription Management System - Frontend

React + Vite frontend for the Subscription Management System with full backend integration.

## Setup Instructions

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment
The `.env` file is already configured:
```env
VITE_API_URL=http://localhost:8000
```

### 3. Start Development Server
```bash
npm run dev
```

The application will run on `http://localhost:3000`

## Features Implemented

### Persistent Sidebar Layout (ERP Style)
- **Collapsible Sidebar**: Toggle with hamburger menu
- **13 Module Links**: Dashboard, Products, Subscriptions, Recurring Plans, Quotation Templates, Invoices, Payments, Discounts, Taxes, Attributes, Users/Contacts, Reports, Settings
- **Role-Based Access Control (RBAC)**:
  - **Admin**: Sees all 13 modules
  - **Internal User**: Sees 9 modules (excludes Users/Contacts, Taxes, Discounts, Settings)
  - **Portal User**: Automatically redirected to `/portal` dashboard
- **Single-Page Navigation**: No page reloads, dynamic content rendering
- **Active State Tracking**: Highlights current module

### Backend Integration
- **Axios Instance**: Configured with interceptors for JWT auth
- **Auth Context**: React Context API for user state management
- **Settings Page**: Full CRUD for company settings with PostgreSQL persistence

### Design System Applied
- **Color Palette**: Custom blue gradient theme (#001D39 → #BDD8E9)
- **Typography**: Gabarito (headings) + Quicksand (body)
- **Modern SaaS UI**: Neumorphic shadows, smooth gradients, micro-animations

## Module Routes

All modules render dynamically within the same page:
- Dashboard
- Products
- Subscriptions
- Recurring Plans
- Quotation Templates
- Invoices
- Payments
- Discounts (Admin only)
- Taxes (Admin only)
- Attributes
- Users/Contacts (Admin only)
- Reports
- Settings (Admin only) - **Connected to PostgreSQL**

## Testing Different Roles

The app fetches the current user from the backend API (`GET /api/me`). To test different roles:

1. Modify the backend seed data in `backend/app/main.py`
2. Or update the fallback mock user in `frontend/src/context/AuthContext.jsx`

## API Integration

### Endpoints Used
- `GET /api/me` - Fetch current user
- `GET /api/settings` - Fetch company settings
- `POST /api/settings` - Update company settings

### Axios Configuration
- Base URL: `http://localhost:8000`
- JWT token interceptor (if token exists)
- Auto-redirect to login on 401 errors

## Tech Stack
- React 18
- Vite (Build tool)
- React Router DOM (Routing)
- Axios (HTTP client)
- CSS3 with CSS Variables (Styling)
- Context API (State management)

## Design System

### Colors
- Primary Dark: #001D39
- Secondary Dark: #0A4174
- Muted Blue: #49769F
- Teal Blue: #4E8EA2
- Soft Blue: #6EA2B3
- Light Accent: #7BBDE8
- Background Light: #BDD8E9

### Typography
- Headings: Gabarito (Google Fonts)
- Body: Quicksand (Google Fonts)

## Next Steps
- Implement authentication with JWT
- Build out individual module pages with CRUD operations
- Add real-time data fetching
- Implement form validations
- Add loading states and error handling

