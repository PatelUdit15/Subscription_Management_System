# SubscriptionFlow Pro - Backend API

FastAPI backend with PostgreSQL database for the Subscription Management System.

## Prerequisites

- Python 3.9+
- PostgreSQL 12+
- pip or pipenv

## Setup Instructions

### 1. Create PostgreSQL Database

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE subscription_db;

# Exit
\q
```

### 2. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 3. Configure Environment

Edit `backend/.env` file with your database credentials:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/subscription_db
SECRET_KEY=your-secret-key-change-in-production
```

### 4. Run the Server

```bash
# From backend directory
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## Database Seeding

On first startup, the application automatically seeds:

- **Admin User**: 
  - Email: `admin@subscriptionflow.com`
  - Password: `admin123`
  - Role: `admin`

- **Company Settings**:
  - Company Name: SubscriptionFlow Pro
  - Default currency: USD
  - Sample address and website

## API Endpoints

### User Management
- `GET /api/me` - Get current user context
- `GET /` - API root
- `GET /health` - Health check

### Company Settings
- `GET /api/settings` - Get company settings
- `POST /api/settings` - Update company settings

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Database Models

### User
- id (Integer, Primary Key)
- name (String)
- email (String, Unique)
- hashed_password (String)
- role (Enum: admin, internal, portal)

### CompanySettings
- id (Integer, Primary Key)
- company_name (String)
- address (Text)
- website (String)
- currency (String)
- logo_url (String)

## RBAC (Role-Based Access Control)

- **Admin**: Full access to all modules
- **Internal**: Limited operational access (no Users, Taxes, Discounts, Settings)
- **Portal**: Customer-facing access only

## Tech Stack

- FastAPI 0.109.0
- SQLAlchemy 2.0.25
- PostgreSQL (psycopg2-binary)
- Pydantic 2.5.3
- Python-Jose (JWT)
- Passlib (Password hashing)
- Alembic (Migrations)
