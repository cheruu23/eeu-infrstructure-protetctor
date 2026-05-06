# EEU Infrastructure Protector
## Project Documentation

---

## 1. Project Overview

**EEU Infrastructure Protector** is a full-stack web application built for the **Ethiopian Electric Utility (EEU)**. It digitizes the process of submitting electricity service requests, reporting infrastructure damage, and managing field operations — replacing paper-based and manual workflows with a modern, role-based digital system.

The system supports three languages: **English**, **Amharic (አማርኛ)**, and **Afaan Oromoo**.

---

## 2. Problem Statement

Ethiopian Electric Utility faces several operational challenges:

- Citizens have no digital channel to report power outages or infrastructure damage
- Service requests are handled manually, causing delays and lost records
- No tracking system for request status from submission to completion
- Infrastructure assets (poles, transformers, cables) have no digital identity or damage history
- No accountability mechanism — citizens cannot rate the quality of service received

---

## 3. Solution

A web-based service management system that connects four types of users in a structured workflow:

```
Citizen → submits request or reports damage
    ↓
Approver → reviews, approves/rejects, assigns to electrician group
    ↓
Electrician → receives assigned work, completes with verification
    ↓
Citizen → rates the completed service
    ↓
Admin → monitors everything, manages users, assets, and groups
```

---

## 4. System Architecture

```
┌─────────────────┐     HTTP/REST API     ┌─────────────────┐
│   React Frontend │ ◄──────────────────► │  Express Backend │
│   (Vercel)       │                      │  (Render)        │
└─────────────────┘                      └────────┬────────┘
                                                   │
                                          ┌────────▼────────┐
                                          │   MySQL Database │
                                          │   (Aiven)        │
                                          └─────────────────┘
```

**Frontend:** React + Vite, React Router, Recharts, Leaflet maps, i18n (3 languages)  
**Backend:** Node.js + Express.js, JWT authentication, bcrypt password hashing  
**Database:** MySQL with relational schema (foreign keys, ENUM types)  
**Hosting:** Vercel (frontend) + Render (backend) + Aiven (MySQL)

---

## 5. User Roles

| Role | Description | Created By |
|------|-------------|------------|
| **Citizen** | Submits service requests and infrastructure damage reports | Self-registration |
| **Approver** | Reviews requests, approves/rejects, assigns to electrician groups | Admin |
| **Electrician** | Receives assigned work, completes jobs with service ID verification | Admin |
| **Admin** | Full system control — users, assets, groups, analytics | First admin in DB |

---

## 6. Key Features

### 6.1 Citizen Features
- Register and login (public registration for citizens only)
- Submit service requests with category (Power Outage, Billing, Meter, Connection, Maintenance)
- Preview before submitting — review card shows all details before confirmation
- Track request status in real time (Pending → Approved → Assigned → Completed)
- Report infrastructure damage via:
  - **QR Code scan** — scan the code on the physical asset (pole, transformer, etc.)
  - **GPS auto-detect** — browser detects location automatically
  - **Manual entry** — type location and asset code manually
- View location of submitted reports on an interactive map
- Rate completed services (1–5 stars + feedback)

### 6.2 Approver Features
- Dashboard with request statistics by status and category
- Filter requests by category and status
- Approve or reject pending requests (with rejection reason)
- Assign approved requests to electrician groups
- View all requests with full history

### 6.3 Electrician Features
- View requests assigned to their group
- Complete jobs by verifying the citizen's EEU Service ID (prevents false completions)
- View completed jobs and citizen ratings/feedback
- Group membership managed by admin

### 6.4 Admin Features
- **System Overview** — live charts: requests by status, by category, users by role, reports by type, requests over 6 months
- **Infrastructure Management** — add/edit assets (poles, transformers, cables, substations, meters), generate and download QR codes per asset
- **Infrastructure Reports** — view all citizen damage reports with GPS map, assign teams, resolve
- **User Management** — full CRUD: create, edit, delete users for all roles; search and filter by role
- **Electrician Groups** — create groups, add/remove electricians, assign groups to service requests
- **Service Requests** — view all requests across the system

### 6.5 System-wide Features
- **Multilingual** — English, Amharic, Afaan Oromoo (switchable in navbar)
- **Interactive Maps** — OpenStreetMap via Leaflet, no API key required
- **QR Codes** — generated server-side, downloadable as PNG
- **Toast notifications** — slide-in success/error messages for every action
- **JWT Authentication** — secure token-based auth, 7-day expiry
- **Password hashing** — bcrypt with 10 salt rounds

---

## 7. Database Schema

```
users
├── id, name, email, password (hashed)
├── phone, role (citizen/approver/electrician/admin)
├── service_id (EEU account number, for citizens)
└── team_name, created_at

infrastructure
├── id, asset_code (unique), asset_type
├── description, location
├── latitude, longitude
└── status (active/damaged/under_repair/decommissioned)

groups
├── id, name, description
└── created_at

group_members
├── group_id → groups.id
└── user_id → users.id

service_requests
├── id, citizen_id → users.id
├── service_id, title, category, description
├── location, photo_url, status
├── approver_id → users.id
├── group_id → groups.id
├── rejection_reason
└── created_at, approved_at, completed_at

infrastructure_reports
├── id, citizen_id → users.id
├── infrastructure_id → infrastructure.id
├── asset_code, report_type, title, description
├── photo_url, latitude, longitude, location_address
├── status (open/assigned/resolved/closed)
├── assigned_team_id → groups.id
└── created_at, resolved_at

ratings
├── id, request_id → service_requests.id
├── citizen_id → users.id
├── rating (1–5), feedback
└── created_at
```

---

## 8. API Endpoints

### Authentication
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public (citizen only) | Register new citizen account |
| POST | `/api/auth/login` | Public | Login, returns JWT token |

### Service Requests
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/requests` | Citizen | Submit new service request |
| GET | `/api/requests/my` | Citizen | Get my requests |

### Approver
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/approver/pending` | Approver | Get pending requests |
| GET | `/api/approver/all` | Approver | Get all requests |
| PUT | `/api/approver/:id/approve` | Approver | Approve a request |
| PUT | `/api/approver/:id/reject` | Approver | Reject with reason |
| PUT | `/api/approver/:id/assign-group` | Approver | Assign to electrician group |
| GET | `/api/approver/groups` | Approver | List all groups |
| GET | `/api/approver/stats` | Approver | Category/status breakdown |

### Electrician
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/electrician/assigned` | Electrician | Get assigned requests |
| PUT | `/api/electrician/:id/complete` | Electrician | Complete with service ID verification |
| GET | `/api/electrician/completed` | Electrician | Get completed requests |
| GET | `/api/electrician/my-group` | Electrician | Get my group info |

### Infrastructure Reports
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/reports` | Citizen | Submit damage report |
| GET | `/api/reports/my` | Citizen | Get my reports |
| GET | `/api/reports/infrastructure` | Any logged-in | List all assets |
| GET | `/api/reports/infrastructure/lookup/:code` | Any logged-in | Lookup asset by QR code |

### Ratings
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/ratings` | Citizen | Rate a completed service |

### Admin
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/admin/stats` | Admin | Dashboard statistics + chart data |
| GET/POST | `/api/admin/users` | Admin | List / create users |
| GET/PUT/DELETE | `/api/admin/users/:id` | Admin | Get / update / delete user |
| GET/POST | `/api/admin/infrastructure` | Admin | List / create assets |
| PUT | `/api/admin/infrastructure/:id/status` | Admin | Update asset status |
| GET | `/api/admin/infrastructure/:id/qr` | Admin | Generate QR code |
| GET | `/api/admin/reports` | Admin | All infrastructure reports |
| PUT | `/api/admin/reports/:id/assign` | Admin | Assign report to team |
| PUT | `/api/admin/reports/:id/resolve` | Admin | Resolve report |
| GET | `/api/admin/service-requests` | Admin | All service requests |

### Groups
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET/POST | `/api/groups` | Admin/Approver | List / create groups |
| PUT/DELETE | `/api/groups/:id` | Admin | Update / delete group |
| POST | `/api/groups/:id/members` | Admin | Add electrician to group |
| DELETE | `/api/groups/:id/members/:userId` | Admin | Remove member |

---

## 9. Security

- **JWT tokens** — all protected routes require `Authorization: Bearer <token>` header
- **Role-based access control** — `requireRole()` middleware enforces permissions per route
- **Password hashing** — bcrypt, never stored in plain text
- **SQL injection prevention** — all queries use parameterized `?` placeholders
- **Public registration restricted** — only citizen role can self-register; all other roles created by admin
- **Self-deletion prevention** — admin cannot delete their own account
- **Service ID verification** — electricians must enter the citizen's EEU service ID to mark a job complete, preventing false completions

---

## 10. Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | React 18 + Vite |
| Routing | React Router v6 |
| HTTP client | Axios |
| Charts | Recharts |
| Maps | Leaflet + React-Leaflet (OpenStreetMap) |
| QR scanning | html5-qrcode |
| QR generation | qrcode.react |
| Styling | Custom CSS (EEU brand colors: green #2e7d32, orange #F5A623) |
| Backend framework | Express.js 4 |
| Database driver | mysql2 |
| Authentication | jsonwebtoken (JWT) |
| Password hashing | bcrypt |
| Environment config | dotenv |
| Dev server | nodemon |
| Frontend hosting | Vercel |
| Backend hosting | Render |
| Database hosting | Aiven (MySQL) |

---

## 11. Deployment

| Service | Platform | URL |
|---------|----------|-----|
| Frontend | Vercel | `https://your-app.vercel.app` |
| Backend | Render | `https://eeu-backend.onrender.com` |
| Database | Aiven | Managed MySQL cloud |

### Environment Variables (Backend — Render)
```
DB_HOST        Aiven MySQL hostname
DB_PORT        Aiven MySQL port
DB_USER        Aiven username
DB_PASSWORD    Aiven password
DB_NAME        Aiven database name
DB_SSL         true
DB_SSL_CA      Base64-encoded CA certificate
JWT_SECRET     Random secret string
FRONTEND_URL   Vercel app URL
```

### Environment Variables (Frontend — Vercel)
```
VITE_API_URL   https://eeu-backend.onrender.com/api
```

---

## 12. How to Run Locally

```bash
# 1. Clone the repository
git clone https://github.com/cheruu23/eeu-infrstructure-protetctor.git
cd eeu-infrstructure-protetctor

# 2. Setup backend
cd backend
npm install
# Create .env with your local MySQL credentials (see .env.example)
npm run dev

# 3. Setup frontend (new terminal)
cd frontend
npm install
npm run dev

# 4. Open browser
# Frontend: http://localhost:5173
# Backend:  http://localhost:5000
```

### Local .env (backend)
```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=eeu_service_db
JWT_SECRET=any_secret_key
```

---

## 13. Project Structure

```
eeu-service/
├── backend/
│   ├── config/
│   │   └── db.js              # MySQL connection pool
│   ├── middleware/
│   │   └── auth.js            # JWT verify + role check
│   ├── routes/
│   │   ├── auth.js            # Register, Login
│   │   ├── requests.js        # Citizen service requests
│   │   ├── approver.js        # Approver actions
│   │   ├── electrician.js     # Electrician actions
│   │   ├── ratings.js         # Service ratings
│   │   ├── reports.js         # Infrastructure reports
│   │   ├── groups.js          # Electrician groups
│   │   └── admin.js           # Admin CRUD + stats
│   └── server.js              # Express app entry point
│
└── frontend/
    └── src/
        ├── api/
        │   └── axios.js       # Axios instance + JWT interceptor
        ├── context/
        │   ├── AuthContext.jsx # User auth state
        │   └── LangContext.jsx # i18n translations (EN/AM/OR)
        ├── components/
        │   ├── Navbar.jsx
        │   ├── Toast.jsx       # Slide-in notifications
        │   ├── LocationMap.jsx # Leaflet map component
        │   ├── LangSwitcher.jsx
        │   └── UserModal.jsx   # Create/Edit user modal
        └── pages/
            ├── Home.jsx              # Landing page
            ├── Login.jsx             # Login + Register
            ├── CitizenDashboard.jsx
            ├── ApproverDashboard.jsx
            ├── ElectricianDashboard.jsx
            ├── AdminDashboard.jsx
            └── ReportInfrastructure.jsx
```

---

## 14. Future Enhancements

- Push notifications when request status changes
- Photo upload (currently URL-based)
- Mobile app (React Native)
- SMS notifications via Ethio Telecom API
- Offline support for field electricians
- Advanced analytics and reporting exports (PDF/Excel)
- Integration with EEU billing system

---

*Ethiopian Electric Utility — Service Management System*  
*የኢትዮጵያ ኤሌክትሪክ አገልግሎት · Tajaajila Elektirikii Itoophiyaa*
