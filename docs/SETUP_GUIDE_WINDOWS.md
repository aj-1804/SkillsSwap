# SkillSwap Global — Windows Local Setup & Execution Guide

This guide provides step-by-step instructions for installing and running **SkillSwap Global** locally on Windows 10/11 using **Command Prompt (CMD)** or **PowerShell**, with **Node.js (v18+)** and **MySQL Server (v8.0+)**.

---

## 1. Prerequisites Checklist

Before proceeding, ensure you have installed:
1. **Node.js (v18 or v20 LTS):** Check with `node -v` in CMD.
2. **npm (v9+):** Check with `npm -v`.
3. **MySQL Community Server 8.0:** Check with `mysql -u root -p -e "SELECT VERSION();"`.
4. **Git (Optional):** Check with `git --version`.

---

## 2. Step 1: Clone or Extract the Project

Open Windows Command Prompt (`cmd.exe`) or Windows PowerShell:

```powershell
cd C:\Users\YourUsername\Projects
git clone https://github.com/your-username/skillswap-global.git
cd skillswap-global
```

---

## 3. Step 2: Install Node Dependencies

Run npm install in the root folder to download all backend and frontend packages:

```powershell
npm install
```

---

## 4. Step 3: Configure MySQL Database on Windows

1. Open MySQL Command Line Client or run from PowerShell:
   ```powershell
   mysql -u root -p
   ```
   *(Enter your MySQL root password when prompted)*

2. Create the database and grant privileges:
   ```sql
   CREATE DATABASE IF NOT EXISTS skillswap_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   SHOW DATABASES;
   EXIT;
   ```

3. Import the complete Schema and Demo Seed Data using Windows command line:
   ```powershell
   # Import Schema
   mysql -u root -p skillswap_db < database\schema.sql

   # Import Demo Seed Data (Amit Jha admin + 12 Indian Students)
   mysql -u root -p skillswap_db < database\seed.sql
   ```

*(Note: If you run the app without executing manual SQL imports, SkillSwap Global's built-in initialization engine will automatically detect and create all tables and seed records for you on startup!)*

---

## 5. Step 4: Configure Environment Variables (`.env`)

Copy `.env.example` to create your local `.env` file:

```powershell
# In PowerShell:
Copy-Item .env.example .env

# Or in Windows CMD:
copy .env.example .env
```

Open `.env` in Notepad or VS Code and update your MySQL credentials:

```env
PORT=3000
NODE_ENV=development

# JWT Secret
JWT_SECRET="skillswap_super_secret_jwt_key_2026_mca_project"
JWT_EXPIRES_IN="7d"

# MySQL Local Windows Configuration
MYSQL_HOST="localhost"
MYSQL_PORT=3306
MYSQL_USER="root"
MYSQL_PASSWORD="YourActualMySQLPassword"
MYSQL_DATABASE="skillswap_db"

APP_URL="http://localhost:3000"
```

---

## 6. Step 5: Start the Full-Stack Application

SkillSwap Global integrates Express backend REST APIs and the React Vite frontend into a single unified development server:

```powershell
npm run dev
```

You will see output in your terminal:
```
[Database] Successfully connected to MySQL at localhost:3306/skillswap_db
=======================================================
 SkillSwap Global Server running at http://0.0.0.0:3000
 Mode: Development
 Database: MySQL (mysql2)
 Default Admin: admin@skillswap.in | Password@123
=======================================================
```

---

## 7. Step 6: Accessing the Application

Open your browser (Chrome, Edge, or Firefox) and navigate to:
- **Local Application URL:** `http://localhost:3000`
- **Health Check Endpoint:** `http://localhost:3000/api/health`

---

## 8. Step 7: Demo Accounts for Testing & Presentation

All demo accounts share the password: **`Password@123`**

| Role | Name | Email | Focus Area |
| :--- | :--- | :--- | :--- |
| **Super Admin** | **Amit Jha** | `admin@skillswap.in` | System monitoring, statistics, account suspension |
| **Student** | **Brijlal** | `brijlal@skillswap.in` | Core Java OOP, SQL Basics (Teaches SQL @ ₹300) |
| **Student** | **Mohit Verma** | `mohit@skillswap.in` | Modern React.js & Tailwind CSS (Teaches React @ ₹400) |
| **Student** | **Isha Bhati** | `isha@skillswap.in` | UI/UX & Figma Design Systems (Teaches UI/UX @ ₹500) |
| **Student** | **Komal Saroj** | `komal@skillswap.in` | Python Scripting & Basics (Teaches Python @ ₹300) |
| **Student** | **Rahul Sharma** | `rahul@skillswap.in` | Advanced SQL Optimization & Indexing (₹600) |
| **Student** | **Priya Singh** | `priya@skillswap.in` | Graphic Design & Adobe Illustrator (₹450) |
| **Student** | **Ananya Gupta** | `ananya@skillswap.in` | Spoken English & Placement Prep (₹500) |

*Tip: You can also click the **"Demo Accounts"** button in the top navigation bar to switch between student and admin accounts in 1 click!*

---

## 9. Troubleshooting Common Windows Errors

1. **`Client does not support authentication protocol requested by server`:**
   MySQL 8.0 default authentication plugin can be set to `mysql_native_password`:
   ```sql
   ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'YourActualMySQLPassword';
   FLUSH PRIVILEGES;
   ```

2. **`Port 3000 already in use`:**
   Check what process is using port 3000:
   ```powershell
   netstat -ano | findstr :3000
   taskkill /PID <PID_NUMBER> /F
   ```
   Or change `PORT=3001` in `.env`.

3. **`MySQL Service is not running`:**
   Start the Windows service:
   ```powershell
   net start MySQL80
   ```
