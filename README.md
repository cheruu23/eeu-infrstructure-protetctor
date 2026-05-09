# ⚡ EEU Infrastructure Protector

> A digital service management platform for the **Ethiopian Electric Utility (EEU)** — replacing paper-based workflows with a modern, role-based web system.

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js)](https://nodejs.org)
[![MySQL](https://img.shields.io/badge/MySQL-Aiven-4479A1?style=flat-square&logo=mysql)](https://aiven.io)
[![Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?style=flat-square&logo=vercel)](https://vercel.com)
[![Render](https://img.shields.io/badge/Backend-Render-46E3B7?style=flat-square&logo=render)](https://render.com)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Key Features](#key-features)
- [User Roles](#user-roles)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Security](#security)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Future Enhancements](#future-enhancements)

---

## Overview

**EEU Infrastructure Protector** is a full-stack web application that digitizes the process of submitting electricity service requests, reporting infrastructure damage, and managing field operations for the Ethiopian Electric Utility.

The system connects four types of users — Citizens, Approvers, Electricians, and Admins — in a structured workflow that brings transparency and accountability to utility service management.

---

## Problem Statement

Ethiopian Electric Utility faced several operational challenges:

- No digital channel for citizens to report power outages or infrastructure damage
- Service requests handled manually, causing delays and lost records
- No status tracking from submission through to completion
- Infrastructure assets (poles, transformers, cables) lacked digital identity or damage history
- No accountability mechanism — citizens could not rate service quality

---

## Key Features

### For Citizens
- Register and log in (public self-registration)
- Submit service requests across 5 categories: Power Outage, Billing, Meter, Connection, Maintenance
- Preview requests before submission
- Track request status in real time: `Pending → Approved → Assigned → Completed`
- Report infrastructure damage via:
  - **QR Code scan** — scan the code on a physical asset
  - **GPS auto-detect** — browser detects location automatically
  - **Manual entry** — type location and asset code by hand
- View report locations on an interactive map
- Rate completed services (1–5 stars + written feedback)

### For Approvers
- Dashboard with request statistics by status and category
- Filter requests by category and status
- Approve or reject pending requests (rejection requires a reason)
- Assign approved requests to electrician groups
- View full request history

### For Electricians
- View requests assigned to their group
- Complete jobs by verifying the citizen's EEU Service ID (prevents false completions)
- View completed jobs and citizen ratings

### For Admins
- **System Overview** — live charts: requests by status/category, users by role, 6-month trends
- **Infrastructure Management** — add/edit assets, generate and download QR codes per asset
- **Infrastructure Reports** — GPS map view, team assignment, resolution tracking
- **User Management** — full CRUD for all user roles, search and filter
- **Electrician Groups** — create groups, add/remove members, assign to requests
- **Service Requests** — full system-wide visibility

---

## User Roles

| Role | Description | Created By |
|------|-------------|------------|
| **Citizen** | Submits service requests and damage reports | Self-registration |
| **Approver** | Reviews, approves/rejects, and assigns requests | Admin |
| **Electrician** | Receives and completes assigned work orders | Admin |
| **Admin** | Full system control — users, assets, groups, analytics | First admin in DB |

---

## System Architecture

```
┌──────────────────┐     HTTP / REST API     ┌──────────────────┐
│  React Frontend  │ ◄────────────────────► │  Express Backend  │
│    (Vercel)      │                         │    (Render)       │
└──────────────────┘                         └────────┬─────────┘
                                                      │
                                             ┌────────▼─────────┐
                                             │  MySQL Database   │
                                             │    (Aiven)        │
                                             └──────────────────┘
```

All protected routes use JWT authentication with role-based access control enforced at the middleware level.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend Framework | React 18 + Vite |
| Routing | React Router v6 |
| HTTP Client | Axios |
| Charts | Recharts |
| Maps | Leaflet + React-Leaflet (OpenStreetMap) |
| QR Scanning | html5-qrcode |
| QR Generation | qrcode.react |
| Styling | Custom CSS (green `#2E7D32`, orange `#F5A623`) |
| Backend Framework | Express.js 4 |
| Database Driver | mysql2 |
| Authentication | jsonwebtoken (JWT) |
| Password Hashing | bcrypt |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |
| Database Hosting | Aiven (Managed MySQL) |

---

## Getting Started

### Prerequisites

- Node.js v18+
- MySQL (local) or an Aiven account
- Git

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/cheruu23/eeu-infrstructure-protetctor.git
cd eeu-infrstructure-protetctor
```

### Backend Setup

```bash
cd backend
npm install

# Create your .env file (see Environment Variables below)
cp .env.example .env

npm run dev
# Backend runs at http://localhost:5000
```

### Frontend Setup

```bash
cd frontend
npm install

# Set VITE_API_URL in a .env file
echo "VITE_API_URL=http://localhost:5000/api" > .env

npm run dev
# Frontend runs at http://localhost:5173
```

---

## Environment Variables

### Backend (`.env`)

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=eeu_service_db
JWT_SECRET=your_jwt_secret_key
```

For production on Render, also set:

```env
DB_PORT=<aiven_port>
DB_SSL=true
DB_SSL_CA=<base64_encoded_ca_cert>
FRONTEND_URL=https://your-app.vercel.app
```

### Frontend (`.env`)

```env
VITE_API_URL=https://eeu-backend.onrender.com/api
```

---

## API Reference

### Authentication

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/api/auth/register` | Public | Register a citizen account |
| `POST` | `/api/auth/login` | Public | Login and receive a JWT token |

### Service Requests (Citizen)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/requests` | Submit a new service request |
| `GET` | `/api/requests/my` | Get the current citizen's requests |

### Approver

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/approver/pending` | Get all pending requests |
| `GET` | `/api/approver/all` | Get all requests |
| `PUT` | `/api/approver/:id/approve` | Approve a request |
| `PUT` | `/api/approver/:id/reject` | Reject with a reason |
| `PUT` | `/api/approver/:id/assign-group` | Assign to an electrician group |
| `GET` | `/api/approver/groups` | List all groups |
| `GET` | `/api/approver/stats` | Category and status breakdown |

### Electrician

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/electrician/assigned` | Get requests assigned to this group |
| `PUT` | `/api/electrician/:id/complete` | Complete job (requires service ID) |
| `GET` | `/api/electrician/completed` | Get completed jobs |
| `GET` | `/api/electrician/my-group` | Get current group info |

### Infrastructure Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/reports` | Submit a damage report |
| `GET` | `/api/reports/my` | Get the current citizen's reports |
| `GET` | `/api/reports/infrastructure` | List all registered assets |
| `GET` | `/api/reports/infrastructure/lookup/:code` | Lookup asset by QR code |

### Ratings

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ratings` | Rate a completed service |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/stats` | Dashboard statistics and chart data |
| `GET/POST` | `/api/admin/users` | List or create users |
| `GET/PUT/DELETE` | `/api/admin/users/:id` | Get, update, or delete a user |
| `GET/POST` | `/api/admin/infrastructure` | List or create assets |
| `PUT` | `/api/admin/infrastructure/:id/status` | Update asset status |
| `GET` | `/api/admin/infrastructure/:id/qr` | Generate QR code for an asset |
| `GET` | `/api/admin/reports` | View all infrastructure reports |
| `PUT` | `/api/admin/reports/:id/assign` | Assign a report to a team |
| `PUT` | `/api/admin/reports/:id/resolve` | Resolve a report |
| `GET` | `/api/admin/service-requests` | View all service requests |

### Groups

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST` | `/api/groups` | List or create groups |
| `PUT/DELETE` | `/api/groups/:id` | Update or delete a group |
| `POST` | `/api/groups/:id/members` | Add an electrician to a group |
| `DELETE` | `/api/groups/:id/members/:userId` | Remove a member |

> All protected routes require the header: `Authorization: Bearer <token>`

---

## Database Schema

```
users                          infrastructure
├── id                         ├── id
├── name                       ├── asset_code (unique)
├── email                      ├── asset_type
├── password (hashed)          ├── description
├── phone                      ├── location
├── role                       ├── latitude / longitude
├── service_id                 └── status
└── created_at
                               groups               group_members
service_requests               ├── id               ├── group_id → groups.id
├── id                         ├── name             └── user_id → users.id
├── citizen_id → users.id      └── description
├── service_id
├── title / category           infrastructure_reports
├── description                ├── id
├── status                     ├── citizen_id → users.id
├── approver_id → users.id     ├── infrastructure_id
├── group_id → groups.id       ├── report_type / status
├── rejection_reason           ├── assigned_team_id → groups.id
└── created_at                 └── latitude / longitude

ratings
├── id
├── request_id → service_requests.id
├── citizen_id → users.id
├── rating (1–5)
└── feedback
```

---

## Security

| Measure | Details |
|---------|---------|
| JWT Authentication | All protected routes require `Authorization: Bearer <token>`; tokens expire after 7 days |
| Role-Based Access Control | `requireRole()` middleware enforces permissions per route |
| Password Hashing | bcrypt with 10 salt rounds; passwords never stored in plain text |
| SQL Injection Prevention | All queries use parameterized `?` placeholders |
| Registration Restriction | Only citizens can self-register; other roles require admin creation |
| Self-Deletion Prevention | Admins cannot delete their own account |
| Service ID Verification | Electricians must enter the citizen's EEU Service ID to mark a job complete |

---

## Deployment

| Service | Platform | URL |
|---------|----------|-----|
| Frontend | Vercel | `https://your-app.vercel.app` |
| Backend | Render | `https://eeu-backend.onrender.com` |
| Database | Aiven | Managed MySQL Cloud |

---

## Project Structure

```
eeu-service/
├── backend/
│   ├── config/
│   │   └── db.js               # MySQL connection pool
│   ├── middleware/
│   │   └── auth.js             # JWT verify + role check
│   ├── routes/
│   │   ├── auth.js             # Register, Login
│   │   ├── requests.js         # Citizen service requests
│   │   ├── approver.js         # Approver actions
│   │   ├── electrician.js      # Electrician actions
│   │   ├── ratings.js          # Service ratings
│   │   ├── reports.js          # Infrastructure reports
│   │   ├── groups.js           # Electrician groups
│   │   └── admin.js            # Admin CRUD + stats
│   └── server.js               # Express app entry point
│
└── frontend/
    └── src/
        ├── api/
        │   └── axios.js        # Axios instance + JWT interceptor
        ├── context/
        │   ├── AuthContext.jsx  # User auth state
        │   └── LangContext.jsx  # i18n translations
        ├── components/
        │   ├── Navbar.jsx
        │   ├── Toast.jsx        # Slide-in notifications
        │   ├── LocationMap.jsx  # Leaflet map component
        │   ├── LangSwitcher.jsx
        │   └── UserModal.jsx    # Create/Edit user modal
        └── pages/
            ├── Home.jsx
            ├── Login.jsx
            ├── CitizenDashboard.jsx
            ├── ApproverDashboard.jsx
            ├── ElectricianDashboard.jsx
            ├── AdminDashboard.jsx
            └── ReportInfrastructure.jsx
```

---

## Future Enhancements

- [ ] Push notifications when request status changes
- [ ] Direct photo upload (currently URL-based)
- [ ] Mobile application (React Native)
- [ ] SMS notifications via Ethio Telecom API
- [ ] Offline support for field electricians
- [ ] Analytics exports (PDF / Excel)
- [ ] Integration with EEU billing system

---

*Ethiopian Electric Utility — Service Management System*
