# Employee Performance Management System (EPMS) Documentation

Welcome to the official documentation for the **Employee Performance Management System (EPMS)**. This full-stack application provides robust tools to track employee check-ins/check-outs, schedule project assignments, and manage competency appraisals.

---

## 🛠️ Technology Stack & System Architecture

### 1. Frontend
* **Core**: React 19 + TypeScript + Vite.
* **Styling**: Modern, high-density Vanilla CSS with built-in micro-animations.
* **Component Library**: Custom lightweight primitives.
* **Data Visualization**: React 19-compatible SVG-based **Radar Charts** (skill-set balances) and **Trend Line Charts** (evaluation metrics progression).

### 2. Backend
* **Engine**: Node.js + Express + TypeScript.
* **Database**: SQLite database running on local environment.
* **ORM Engine**: Prisma ORM (v5) client configurations.
* **Session Security**: JWT (JSON Web Token) with explicit role guards (`ADMIN`, `MANAGER`, `EMPLOYEE`).

---

## 💾 Relational Database Schema

The SQLite schema represents the relational entities:

* **User**:
  - `id`: Unique Auto-increment Key.
  - `email` / `password` / `name` / `role` / `department` / `isActive`.
  - Self-referencing organizational relationship: `managerId` references `User.id` (mapping manager-subordinate hierarchies).
* **Project**:
  - `id` / `name` / `description` / `status` / `priority` / `startDate` / `endDate`.
* **ProjectMember** (Junction Table):
  - Maps Many-to-Many associations between Users and Projects.
* **Attendance**:
  - Enforces a unique composite constraint `[userId, checkDate]` to prevent dual check-ins on the same day.
  - Calculates and stores `hoursWorked` automatically upon Check-Out.
* **PerformanceReview**:
  - Stores appraisal metrics (ratings between 1 and 5) across five parameters: *Communication*, *Technical*, *Delivery*, *Teamwork*, and *Leadership*.
  - Calculates and saves the average overall score.

---

## 👥 Role Workflows & Dashboards

### 👨‍💼 Administrator Portal
* **Employee Directory**: Complete roster of active corporate profiles. Can create/modify accounts and map reporting manager relationships.
* **Project Dashboard**: Set priorities, state limits, timelines, and allocate personnel members.
* **Attendance Matrix**: Fetch all historical presence logs in the corporation.
* **Clock-in Rate Today**: Dashboard indicator displaying the live fraction of present employees (checked-in users vs total users) matching local date logic.

### 🧑‍💻 Manager Portal
* **Team Roster**: Inspect direct subordinates.
* **Competency Appraisals**: Form layout using ranges (1 to 5 stars) to score skills. Submissions instantly recalculate overall scores and map trends.
* **Presence Monitoring**: Real-time Operations Matrix to track team check-in and checkout timings.

### 🧑‍💼 Employee Workspace
* **Interactive Time-Clock**: Color-coded panel tracking check-in state. Features a live ticking clock. Clicking "Check In" logs the start time; clicking "Check Out" closes the record and logs total hours worked.
* **Appraisal Radar Chart**: Displays the latest 5-axis competency matrix.
* **Trend Line Charts**: Visualizes career trajectory across historical evaluations.
* **Deliverables**: View assigned projects.

---

## 🚀 How to Run the Project Locally

### Prerequisites
Ensure you have **Node.js (v18+)** and **npm** installed.

### 1. Backend Server Setup
From the `backend` directory:
```bash
# Install dependencies
npm install

# Push database schema and sync SQLite dev.db
npx prisma db push

# Run initial database seeder
node dist/seed.js

# Start the compiled backend server
node dist/server.js
```
*The backend API will run on **http://localhost:5050***.

### 2. Frontend Application Setup
From the `frontend` directory:
```bash
# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
*The React client will run on **http://localhost:3000***.

---

## 🔑 Default Corporate Accounts

You can test different roles using these pre-seeded accounts:

| Role | Corporate Email | Password |
|---|---|---|
| **Admin** | `admin@epms.com` | `admin123` |
| **Manager** | `manager@epms.com` | `manager123` |
| **Employee** | `employee@epms.com` | `employee123` |
