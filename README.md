# 🚀 BFF Smart Vending - Complaint Management System

![Project Badge](https://img.shields.io/badge/Status-Production%20Ready-success?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-MERN-blue?style=for-the-badge&logo=react)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

A robust, enterprise-grade Complaint Management System designed for Smart Vending Machines ("Beverages For Friends"). This application bridges the gap between customers and support teams with instant chat, live status monitoring, and a comprehensive admin dashboard.

---

## ✨ Key Features

### 🏢 For Admin & Support
- **Live Chat Dashboard**: Real-time bi-directional communication powered by **Socket.io**.
- **Instant Alerts**: Audio and visual notifications for new tickets and messages.
- **Analytics Suite**: Visual charts for complaint trends, resolution times, and vending machine health.
- **Export Tools**: Generate detailed reports in **Excel** & **PDF** formats.
- **Team Management**: Manage support agents and track individual performance.

### 📱 For Customers
- **Seamless Reporting**: Scan QR code to instantly report issues with pre-filled machine data.
- **Live Status Tracking**: Watch complaint status move from *Pending* → *In Progress* → *Resolved*.
- **Direct Support Chat**: Chat directly with agents without leaving the browser.
- **Push Notifications**: Receive updates even when the app is closed (PWA/Service Workers).

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: [React.js](https://react.dev/) (Vite)
- **Styling**: [TailwindCSS](https://tailwindcss.com/) + DaisyUI
- **State Management**: Zustand
- **Real-time**: Socket.io Client
- **Icons**: Lucide React

### **Backend**
- **Runtime**: Node.js (Express.js) - [v20+]
- **Database**: MySQL (via Prisma ORM)
- **Real-time**: Socket.io
- **Notifications**: Web-Push (VAPID), Telegram Bot API
- **Process Manager**: PM2

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js (v18 or higher)
- MySQL Server running locally or remotely
- Git

### 1. Installation

Clone the repository and install dependencies for both services.

```bash
# Clone the repository
git clone https://github.com/your-username/bff-complaint-dashboard.git
cd bff-complaint-dashboard

# Install Backend
cd Complain-Dashboard
npm install

# Install Frontend
cd ../Frontend/frontend
npm install
```

### 2. Environment Configuration

Create a `.env` file in the `Complain-Dashboard` directory:

```env
# Server Configuration
PORT=4000
HOST=0.0.0.0
NODE_ENV=development

# Database (Prisma)
DATABASE_URL="mysql://user:password@localhost:3306/bff_db"

# Security (JWT)
JWT_SECRET="your_super_secret_key_change_this"

# Push Notifications (VAPID)
PUBLIC_VAPID_KEY="generated_key"
PRIVATE_VAPID_KEY="generated_key"

# Telegram Integration (Optional)
TELEGRAM_BOT_TOKEN="your_bot_token"
TELEGRAM_CHAT_ID="your_chat_id"
```

### 3. Database Migration

Sync your MySQL database schema using Prisma.

```bash
cd Complain-Dashboard
npx prisma db push
```

### 4. Running the Application

**Development Mode (Hot Reloading)**:
Open two terminal windows.

**Backend:**
```bash
cd Complain-Dashboard
npm run dev
# Server running on http://localhost:4000
```

**Frontend:**
```bash
cd Frontend/frontend
npm run dev
# Client running on http://localhost:5173
```

---

## � Deployment

For detailed production deployment instructions on Windows Server (IIS), please refer to the deployment guide:

👉 [**Read Production Deployment Guide**](./production_Deployment.md)

---

## 📂 Project Structure

```bash
BFF_Copmlain_Dashboard/
├── Complain-Dashboard/       # Backend (Node.js/Express)
│   ├── config/               # DB and External Service Configs
│   ├── controller/           # Business Logic
│   ├── models/               # Database Queries & Schema
│   ├── routes/               # API Endpoints
│   ├── prisma/               # Prisma ORM Schema
│   └── server.js             # Entry Point
│
├── Frontend/frontend/        # Frontend (React/Vite)
│   ├── src/
│   │   ├── api/              # Axios Configuration
│   │   ├── components/       # Reusable UI Components
│   │   ├── pages/            # App Screens (Chat, Dashboard, Login)
│   │   └── store.js          # Zustand State Store
│   └── public/               # Static Assets (Manifest, Service Worker)
└── production_Deployment.md  # Server Setup Guide
```

---

## 📸 Project Gallery

A glimpse into the **BFF Support Dashboard** interface.

### 🖥️ Admin Dashboard & Analytics
> *Comprehensive view for support agents to manage tickets and view live stats.*

<p align="center">
  <img src="screenshots/preview-1.png" width="45%" alt="Admin Dashboard Main" style="border-radius: 10px; border: 1px solid #333;">
  <img src="screenshots/preview-2.png" width="45%" alt="Analytics View" style="border-radius: 10px; border: 1px solid #333;">
  <img src="screenshots/image.png" width="45%" alt="Analytics View" style="border-radius: 10px; border: 1px solid #333;">
</p>

### 📱 Mobile User Chat Experience
> *Seamless, native-app like experience for customers to chat with support.*

<p align="center">
  <img src="screenshots/preview-3.png" width="30%" alt="Mobile Chat UI" style="border-radius: 10px; border: 1px solid #333;">
  <img src="screenshots/preview-4.png" width="30%" alt="Status Timeline" style="border-radius: 10px; border: 1px solid #333;">
  <img src="screenshots/preview-5.png" width="30%" alt="Notification View" style="border-radius: 10px; border: 1px solid #333;">
</p>

---

## 🤝 Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Built with ❤️ by the BFF Engineering Team
</p>
