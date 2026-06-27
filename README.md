# PM Tool — Project Management System

A full-stack project management tool for tracking construction/installation projects through phases (Supply → Installation → Testing → Handover), with material tracking, task management, and Excel import.

## Tech Stack

| Layer     | Technology                       |
|-----------|----------------------------------|
| Frontend  | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend   | Express.js, Node.js              |
| Database  | MongoDB Atlas (Mongoose ODM)     |
| Auth      | JWT (stored in localStorage)     |
| Deploy FE | Vercel                           |
| Deploy BE | Render                           |

---

## Local Development

### Prerequisites
- Node.js >= 18
- MongoDB Atlas account (free tier)

### 1. Clone and install

```bash
git clone <repo-url>
cd project-management-tool

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Backend setup

```bash
cd backend
cp .env.example .env
# Edit .env with your values
npm run dev
# Runs on http://localhost:5000
```

### 3. Frontend setup

```bash
cd frontend
# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local
npm run dev
# Runs on http://localhost:3000
```

---

## MongoDB Atlas Setup

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com) and create a free account
2. Create a new project
3. Click **Build a Database** → select **M0 Free** tier
4. Choose a cloud provider and region (any)
5. Set a username and password (save these)
6. Under **Network Access**, add `0.0.0.0/0` to allow connections from anywhere (for Render)
7. Click **Connect** → **Drivers** → copy the connection string
8. Replace `<username>`, `<password>`, and `<dbname>` with your values:
   ```
   mongodb+srv://myuser:mypass@cluster0.xxxxx.mongodb.net/pm-tool
   ```
9. Paste this as `MONGODB_URI` in your `.env`

---

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/pm-tool
JWT_SECRET=your-super-secret-jwt-key-change-this-to-something-random
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

In production, set `NEXT_PUBLIC_API_URL` to your Render backend URL, e.g.:
```
NEXT_PUBLIC_API_URL=https://pm-tool-backend.onrender.com
```

---

## Deploy to Render (Backend)

1. Push your code to GitHub
2. Go to [https://render.com](https://render.com) and sign up
3. Click **New → Web Service**
4. Connect your GitHub repository
5. Set **Root Directory** to `backend`
6. Render will detect the `render.yaml` config automatically
7. Add environment variables in the Render dashboard:
   - `MONGODB_URI` → your Atlas connection string
   - `JWT_SECRET` → a long random string
   - `FRONTEND_URL` → your Vercel app URL (add after deploying frontend)
8. Click **Deploy**
9. Note your Render URL (e.g. `https://pm-tool-backend.onrender.com`)

---

## Deploy to Vercel (Frontend)

1. Go to [https://vercel.com](https://vercel.com) and sign up
2. Click **Add New → Project**
3. Import your GitHub repository
4. Set **Root Directory** to `frontend`
5. Add environment variable:
   - `NEXT_PUBLIC_API_URL` → your Render backend URL
6. Click **Deploy**
7. Note your Vercel URL and update `FRONTEND_URL` in Render

---

## Excel Template Format

Create an `.xlsx` file with the following sheets:

### Sheet: `Project` (row 1 = headers, row 2 = data)
| name | description | clientName | location | projectCode | startDate | endDate |
|------|-------------|------------|----------|-------------|-----------|---------|
| Solar Installation Site A | Phase 1 deployment | ABC Corp | Mumbai | PRJ-001 | 2025-01-01 | 2025-06-30 |

### Sheet: `Phases`
| phaseName | startDate | endDate | completionPercent | status | notes |
|-----------|-----------|---------|-------------------|--------|-------|
| supply | 2025-01-01 | 2025-02-28 | 75 | in_progress | Panels ordered |
| installation | 2025-03-01 | 2025-04-30 | 0 | not_started | |

Valid `phaseName` values: `supply`, `installation`, `testing`, `handover`  
Valid `status` values: `not_started`, `in_progress`, `completed`, `delayed`

### Sheet: `Materials`
| phaseName | name | description | unit | quantityOrdered | quantityDelivered | unitCost | expectedDeliveryDate |
|-----------|------|-------------|------|-----------------|-------------------|----------|----------------------|
| supply | Solar Panel 400W | Monocrystalline | pcs | 100 | 75 | 8500 | 2025-01-15 |

### Sheet: `Tasks`
| phaseName | name | description | startDate | dueDate | assignedTo | status | completionPercent |
|-----------|------|-------------|-----------|---------|------------|--------|-------------------|
| supply | Order panels | Contact vendor | 2025-01-01 | 2025-01-05 | Raj Kumar | done | 100 |

---

## API Documentation

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user (auth required) |

All other endpoints require `Authorization: Bearer <token>` header.

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List all projects with completion % |
| POST | `/api/projects` | Create project (auto-creates 4 phases) |
| GET | `/api/projects/:id` | Get project details |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project + cascade |
| GET | `/api/projects/:id/stats` | Get computed stats object |

### Phases
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/:id/phases` | List project phases |
| PUT | `/api/projects/:id/phases/:phaseId` | Update phase |

### Materials
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/:id/materials` | List materials |
| GET | `/api/projects/:id/materials/summary` | Aggregated totals |
| POST | `/api/projects/:id/materials` | Add material |
| PUT | `/api/projects/:id/materials/:materialId` | Update material |
| DELETE | `/api/projects/:id/materials/:materialId` | Delete material |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/:id/tasks` | List tasks (optional `?phase=supply`) |
| POST | `/api/projects/:id/tasks` | Create task |
| PUT | `/api/projects/:id/tasks/:taskId` | Update task |
| DELETE | `/api/projects/:id/tasks/:taskId` | Delete task |

### Upload
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload/excel` | Upload Excel file (multipart, field: `file`) |
