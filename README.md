# Hostel Maintenance System

A full-stack hostel complaint management and maintenance tracking system designed to streamline operations between students, wardens/administrators, and maintenance staff.

## 🚀 Features

- **Role-Based Access Control**:
  - **Student**: File complaints, upload photos, track resolution progress, submit feedback.
  - **Warden / Admin**: Overview dashboard, assign complaints to staff, view analytics and audit logs.
  - **Maintenance Staff**: View assigned tickets, update status, and log resolution details.
- **Complaint Management**: Real-time status tracking (`SUBMITTED`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`), category filtering, priority tagging.
- **Analytics & Reporting**: Complaint statistics, resolution turnaround times, category breakdown.
- **Responsive UI**: Built with React and modern UI styling.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Lucide Icons
- **Backend**: Node.js, Express.js, SQLite3, JSON Web Tokens (JWT), Multer
- **Database**: SQLite (HostelCare DB)

## 📦 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- npm

### 2. Backend Setup
```bash
cd backend
npm install
npm start
```
The backend server runs on `http://localhost:5000` (or configured port).

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend application will start on `http://localhost:5173`.
