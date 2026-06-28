# AutoInspect AI — Developer Guide

This guide explains where files are located and how to make changes easily in simple words.

---

## 📂 Project Directory Structure

```
prototype.auto/
├── backend/            # Backend API (Express / Node.js)
│   ├── src/
│   │   ├── index.ts    # Main server configuration (cors, limiters, port)
│   │   ├── data/
│   │   │   └── store.ts # Simulated Database (contains 50 dummy inspections, users, OEMs)
│   │   ├── services/
│   │   │   └── AIService.ts # AI Engine Response simulation (Defects, severity, costs, chat)
│   │   └── routes/     # URL paths for backend endpoints
│   └── uploads/        # Where uploaded inspection images are stored locally
│
└── frontend/           # Web Interface (Next.js / React)
    ├── src/
    │   ├── app/        # Pages and routes
    │   ├── components/ # Common layouts (Sidebar, Topbar, Alerts)
    │   ├── contexts/   # User session and login management
    │   └── lib/        # API Request connector functions
```

---

## ✏️ How to Edit the Project

Here is a quick cheat sheet telling you exactly which file to modify based on what you want to achieve:

### 1. I want to change the Design, Styling, or Colors
- **File to Edit**: `frontend/src/app/globals.css`
- **What to look for**: Search for `:root` at the top of the file to adjust the branding colors (primary, success, error, background shades, etc.).

### 2. I want to change the Sidebar Menu Items
- **File to Edit**: `frontend/src/components/Sidebar.tsx`
- **What to look for**: Edit the `navItems` array at the top of the file to add new pages, change icons, or update role permission requirements.

### 3. I want to tweak the Simulated AI Logic (defects, costs, severities)
- **File to Edit**: `backend/src/services/AIService.ts`
- **What to look for**: Find the `DAMAGE_PROFILES` array to change the confidence ranges, estimated costs, recommended verdicts, or custom negotiation text.

### 4. I want to add more Initial Users or OEMs (Seeded Data)
- **File to Edit**: `backend/src/data/store.ts`
- **What to look for**: Locate `seedUsers()` or `seedOEMs()` functions to add your own technicians, partners, or modify starting parameters.

### 5. I want to add custom questions to the AI Chat Panel
- **File to Edit**: `backend/src/services/AIService.ts`
- **What to look for**: Search for the `chat()` method to customize the automated text replies returned when inspectors ask questions like *"Why rejected?"* or *"What to tell OEM?"*.

### 6. I want to update Profile Badges or performance logic
- **File to Edit**: `frontend/src/app/(dashboard)/profile/page.tsx`
- **What to look for**: Search for the `descriptions` mapping inside the Badge Panel section to add new achievements or update existing badge descriptions.

---

## 🏃 How to Run the App Locally

To launch the system on your computer, run these two commands in separate terminal sessions:

### 1. Start the Backend API
```bash
cd backend
npm run dev
```
*Runs at http://localhost:4000*

### 2. Start the Frontend Website
```bash
cd frontend
npm run dev
```
*Runs at http://localhost:3000*
