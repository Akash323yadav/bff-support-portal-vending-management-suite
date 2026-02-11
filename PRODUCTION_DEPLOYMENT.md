# 🚀 Deployment Guide: Windows Server (IIS)

This guide details the steps to deploy the **BFF Complaint Dashboard** (Node.js Backend & React Frontend) on a Windows Server using **IIS (Internet Information Services)** as a Reverse Proxy. This configuration ensures SSL termination, proper routing, and process management.

---

## 📋 Prerequisites

Before starting, ensure your Windows Server has the following installed:

1.  **Node.js (LTS Version)**: [Download Here](https://nodejs.org/)
2.  **IIS (Internet Information Services)**: Enable via *Server Manager > Add Roles and Features > Web Server (IIS)*.
3.  **URL Rewrite Module** (Critical for Reverse Proxy): [Download Here](https://www.iis.net/downloads/microsoft/url-rewrite)
4.  **Application Request Routing (ARR)** (Critical for Reverse Proxy): [Download Here](https://www.iis.net/downloads/microsoft/application-request-routing)
5.  **PM2** (Process Manager): Install globally via `npm install -g pm2`.
6.  **Git**: [Download Here](https://git-scm.com/) (Optional, for pulling code).

---

## 🏗️ Step 1: Prepare the Application

1.  **Copy Files**: Move your project folder (e.g., `BFF_Complaint_Dashboard`) to the server (e.g., `C:\BFF_Dashboard`).
2.  **Install Dependencies**:
    *   **Backend**:
        ```powershell
        cd C:\BFF_Dashboard\Complain-Dashboard
        npm install --production
        ```
    *   **Frontend** (Build Process):
        ```powershell
        cd C:\BFF_Dashboard\Frontend\frontend
        npm install
        npm run build
        ```
        *This will generate a `dist` folder containing the static assets.*

3.  **Environment Variables**:
    *   Create `.env` in `Complain-Dashboard` with your production DB credentials and keys.
    *   **Important**: Set `PORT=4000` (or your preferred port).

---

## ⚙️ Step 2: Configure IIS

### 1. Create a New Website
1.  Open **IIS Manager**.
2.  Right-click **Sites** -> **Add Website**.
    *   **Site name**: `BFFDashboard`
    *   **Physical path**: `C:\inetpub\wwwroot\bff-dashboard` (Create an empty folder here first).
    *   **Port**: `80`
    *   **Host name**: `yourdomain.com` (e.g., `dashboard.bffvending.com`).
3.  Click **OK**.

### 2. Setup Reverse Proxy (To Node.js)
1.  Click on your new site (`BFFDashboard`) in the left sidebar.
2.  Double-click **URL Rewrite**.
3.  In the **Actions** pane (right side), click **Add Rule(s)...** -> **Reverse Proxy**.
4.  **Server name**: `localhost:4000` (This matches your Node.js PORT).
5.  Uncheck "Enable SSL Offloading" if you are handling SSL at the IIS level (Recommended).
6.  Click **OK**.
7.  *Note: This creates a `web.config` file in your Physical Path. Ensure Node.js is running for this to work.*

---

## 🔒 Step 3: SSL Certificate (HTTPS)

For Notifications and PWA features to work, **HTTPS is mandatory**.

1.  Download **win-acme** (RESTful Let's Encrypt client) from [win-acme.com](https://www.win-acme.com/).
2.  Extract and run `wacs.exe` as **Administrator**.
3.  Select **N** (Create new certificate).
4.  Select **1** (Single binding of an IIS site).
5.  Choose your site (`BFFDashboard`) from the list.
6.  Follow the prompts. The tool will automatically:
    *   Validate your domain.
    *   Generate the certificate.
    *   Bind it to Port 443 in IIS.
    *   Setup a scheduled task for auto-renewal.

---

## 🚀 Step 4: Start the Application (PM2)

We use PM2 to keep the Node.js server running in the background and restart it on crashes/reboots.

1.  Open PowerShell as Administrator.
2.  Navigate to your backend folder:
    ```powershell
    cd C:\BFF_Dashboard\Complain-Dashboard
    ```
3.  Start the app:
    ```powershell
    pm2 start server.js --name "bff-backend"
    ```
4.  Save the process list (so it restarts on reboot):
    ```powershell
    pm2 save
    ```
5.  *(Optional)* Install PM2 Windows Startup script:
    ```powershell
    npm install pm2-windows-startup -g
    pm2-startup install
    ```

---

## 📂 Step 5: Serving the Frontend

Your `server.js` is already configured to serve the frontend static files from `../Frontend/frontend/dist`.
However, if you want IIS to serve proper MIME types efficiently, ensure your `web.config` created in Step 2 includes rules for static files or let Node.js handle it (Simpler).

**Verification**:
1.  Open `https://yourdomain.com` in a browser.
2.  You should see the login page.
3.  Open Developer Tools (F12) -> Console. Ensure no WebSocket connection errors.

---

## 🔄 Updating the Application

To deploy updates:

1.  **Pull changes**:
    ```powershell
    git pull origin main
    ```
2.  **Rebuild Frontend** (if frontend changed):
    ```powershell
    cd Frontend/frontend
    npm run build
    ```
3.  **Restart Backend**:
    ```powershell
    pm2 restart bff-backend
    ```

---

## 🛠️ Troubleshooting

-   **502 Bad Gateway**: Check if Node.js server is running (`pm2 list`). Check logs (`pm2 logs bff-backend`).
-   **WebSocket Errors**: Ensure IIS WebSocket compatibility.
    *   Enable **WebSocket Protocol** in *Server Manager > Add Roles > Web Server > Application Development*.
    *   In `web.config`, ensure `<webSocket enabled="false" />` is NOT present or configured correctly for proxying.
-   **Notifications Not Working**: Verify you are accessing via `HTTPS`. Check console for Service Worker registration errors.
