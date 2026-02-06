# 🚀 BFF Smart Vending Complaint Dashboard

A robust, real-time Complaint Management System designed for Smart Vending Machines. This application bridges the gap between customers and support teams with instant chat, live status updates, and a powerful admin dashboard.

## ✨ Key Features

- **Real-time Support Chat**: Seamless communication powered by **Socket.io**.
- **Live Status Tracking**: Customers can track their complaint status (Pending → In Progress → Resolved) in real-time.
- **Admin Dashboard**:
    - Comprehensive analytics & charts.
    - Export reports to **Excel** & **PDF**.
    - Manage complaints efficiently with filtering and search.
- **Push Notifications**: Instant alerts for new messages and status updates.
- **Responsive Design**: Optimized for both Desktop (Admin) and Mobile (User) experiences using **TailwindCSS**.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React.js (Vite)
- **Styling**: TailwindCSS, DaisyUI
- **State Management**: Zustand
- **Real-time**: Socket.io Client
- **Charts**: Recharts

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL
- **Real-time**: Socket.io
- **Notifications**: Web-Push, Telegram Bot Integration

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MySQL Server

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/bff-complaint-dashboard.git
cd bff-complaint-dashboard
```

### 2. Backward Setup
```bash
cd Complain-Dashboard
npm install
```
- Copy `.env.example` to `.env` and configure your Database & Keys.
```bash
cp .env.example .env
```
- Run the server:
```bash
npm start
# or for development
npm run dev
```

### 3. Frontend Setup
```bash
cd ../Frontend/frontend
npm install
```
- Copy `.env.example` to `.env`.
```bash
cp .env.example .env
```
- Start the development server:
```bash
npm run dev
```

## 📸 Screen Previews

*(Add screenshots of your Dashboard and Chat UI here)*

## 📄 License

This project is licensed under the MIT License.
