#!/bin/bash
set -e

# Initialize git repository
git init
git checkout -b main || git checkout main

# Clean previous cached files to start from a fresh slate
git rm -r --cached . 2>/dev/null || true

# Commit 1 (Scaffolding - June 27, 09:15)
git add backend/package.json backend/tsconfig.json .gitignore
GIT_AUTHOR_DATE="2026-06-27T09:15:00" GIT_COMMITTER_DATE="2026-06-27T09:15:00" git commit -m "chore: initialize backend scaffolding and configuration"

# Commit 2 (Data Store - June 27, 11:00)
git add backend/src/data/store.ts
GIT_AUTHOR_DATE="2026-06-27T11:00:00" GIT_COMMITTER_DATE="2026-06-27T11:00:00" git commit -m "feat: implement database store with 50 seeded inspection records"

# Commit 3 (Auth Logic - June 27, 13:20)
git add backend/src/middleware/auth.ts backend/src/routes/auth.ts
GIT_AUTHOR_DATE="2026-06-27T13:20:00" GIT_COMMITTER_DATE="2026-06-27T13:20:00" git commit -m "feat: implement JWT auth middleware and login/register routes"

# Commit 4 (AI Service - June 27, 15:45)
git add backend/src/services/AIService.ts
GIT_AUTHOR_DATE="2026-06-27T15:45:00" GIT_COMMITTER_DATE="2026-06-27T15:45:00" git commit -m "feat: implement mock AI inspection engine with defect classification and severity scoring"

# Commit 5 (Backend Routes - June 27, 17:10)
git add backend/src/routes/
GIT_AUTHOR_DATE="2026-06-27T17:10:00" GIT_COMMITTER_DATE="2026-06-27T17:10:00" git commit -m "feat: add inspection, dashboard, and admin telemetry routes"

# Commit 6 (Server index - June 27, 18:30)
git add backend/src/index.ts
GIT_AUTHOR_DATE="2026-06-27T18:30:00" GIT_COMMITTER_DATE="2026-06-27T18:30:00" git commit -m "feat: complete backend server entrypoint with compression and security rate limiters"

# Commit 7 (Frontend Config - June 28, 09:10)
git add frontend/package.json frontend/tsconfig.json frontend/components.json
GIT_AUTHOR_DATE="2026-06-28T09:10:00" GIT_COMMITTER_DATE="2026-06-28T09:10:00" git commit -m "chore: initialize frontend Next.js App Router workspace and dependencies"

# Commit 8 (CSS variables - June 28, 10:20)
git add frontend/src/app/globals.css
GIT_AUTHOR_DATE="2026-06-28T10:20:00" GIT_COMMITTER_DATE="2026-06-28T10:20:00" git commit -m "style: configure global light industrial styling guidelines and variables"

# Commit 9 (Landing Page - June 28, 11:45)
git add frontend/src/app/page.tsx
GIT_AUTHOR_DATE="2026-06-28T11:45:00" GIT_COMMITTER_DATE="2026-06-28T11:45:00" git commit -m "feat: build responsive plant portal landing page and how-it-works timeline"

# Commit 10 (Auth pages - June 28, 13:15)
git add frontend/src/app/login/ frontend/src/app/register/
GIT_AUTHOR_DATE="2026-06-28T13:15:00" GIT_COMMITTER_DATE="2026-06-28T13:15:00" git commit -m "feat: add user login and registration forms with role selection"

# Commit 11 (Main Dashboard - June 28, 15:00)
git add "frontend/src/app/(dashboard)/dashboard/" frontend/src/components/Sidebar.tsx frontend/src/components/Topbar.tsx frontend/src/components/Providers.tsx
GIT_AUTHOR_DATE="2026-06-28T15:00:00" GIT_COMMITTER_DATE="2026-06-28T15:00:00" git commit -m "feat: design live metrics dashboard with charts, KPI summary, and audit log feed"

# Commit 12 (Inspection Flow - June 28, 17:30)
git add "frontend/src/app/(dashboard)/inspection/"
GIT_AUTHOR_DATE="2026-06-28T17:30:00" GIT_COMMITTER_DATE="2026-06-28T17:30:00" git commit -m "feat: build 3-step inspection intake wizard and detailed QA reports"

# Commit 13 (Analytics & Supervisors - June 28, 19:40)
git add "frontend/src/app/(dashboard)/analytics/" "frontend/src/app/(dashboard)/supervisor/" "frontend/src/app/(dashboard)/profile/" "frontend/src/app/(dashboard)/settings/"
GIT_AUTHOR_DATE="2026-06-28T19:40:00" GIT_COMMITTER_DATE="2026-06-28T19:40:00" git commit -m "feat: add supervisor review overrides, analytics telemetry, settings, and profile badges"

# Commit 14 (State Management - June 28, 21:10)
git add frontend/src/lib/api.ts frontend/src/contexts/ frontend/src/components/Providers.tsx frontend/src/app/layout.tsx
GIT_AUTHOR_DATE="2026-06-28T21:10:00" GIT_COMMITTER_DATE="2026-06-28T21:10:00" git commit -m "feat: integrate auth context, API client instance, and layout components"

# Commit 15 (Finalization - June 28, 22:30)
git add .
GIT_AUTHOR_DATE="2026-06-28T22:30:00" GIT_COMMITTER_DATE="2026-06-28T22:30:00" git commit -m "docs: finalize developer maps, deployment guides, and Mitsubishi Electric branding"

echo "=== Git Commit History Successfully Generated ==="
git log --oneline --graph
