# Smart Campus

A MERN-stack campus management system I built as a college project. It's not just another CRUD app with login/dashboard/CRUD tables, it actually has some intelligence baked in: live attendance codes, auto-prioritized helpdesk tickets, attendance risk alerts, timetable conflict checks, and a campus copilot that can answer questions using the data already in MongoDB.

## What it does

- **Campus Copilot** - answers questions by pulling from courses, notices, timetable, tickets, attendance and assignments. Doesn't need a paid API.
- **Live attendance** - faculty can generate a 6-digit code that expires in 10 minutes, students check in with it
- **Attendance risk flags** - anyone below 75% gets flagged automatically for faculty/admin
- **Helpdesk with auto-priority** - a keyword classifier assigns priority to tickets and guesses the category
- **Timetable conflicts** - stops you from double-booking a faculty member or room
- **Dashboards** - separate views for student/faculty/admin with Recharts
- **Notifications** - assignments, ticket updates and notices show up in a bell icon
- **Theme toggle** - light/dark/system, remembered across sessions
- **Events + RSVP** - separate from notices, shows going counts
- **Command search** - Ctrl+K to find courses, tickets, events, people

## Tech stack

- MongoDB + Mongoose (users, courses, assignments, submissions, attendance, sessions, tickets, notices, timetable, notifications)
- Express REST API, JWT auth, role middleware for student/faculty/admin
- React + Vite frontend
- Recharts for the analytics

## Folder structure

Two main folders, backend and frontend, run as separate servers:

```
smart-campus/
  backend/     -> Express API, localhost:5000
  frontend/    -> React + Vite, localhost:5173
  docs/
  README.md
```

You need two terminals open, one for each.

## Setting it up

### Prerequisites

Node.js LTS (18+). Check with:

```bash
node -v
npm -v
```

You'll also need a MongoDB Atlas cluster, or MongoDB running locally.

### Clone and open

Grab the repo and open the root folder (the one with both `backend` and `frontend` in it).

### Environment variables

Backend reads from `backend/.env`. Copy `backend/.env.example` to `backend/.env` and fill in:

```
MONGO_URI=mongodb+srv://USER:PASSWORD@HOST/smartcampus
JWT_SECRET=any-long-random-string
PORT=5000
```

Running Mongo locally instead of Atlas:

```
MONGO_URI=mongodb://127.0.0.1:27017/smartcampus
```

If you're on Atlas, go whitelist your IP first or every login will just hang:

1. Log in at cloud.mongodb.com
2. Open your cluster
3. Network Access -> Add IP Address -> Add Current IP Address
4. (For a personal demo only, `0.0.0.0/0` works too, don't do this for anything real)
5. Give it a minute or two to apply

### Install and run

```bash
# backend
cd backend
npm install
npm run seed
npm run dev

# frontend, in a new terminal
cd frontend
npm install
npm run dev
```

Then open `http://localhost:5173`.

Heads up, `npm run seed` wipes existing users/courses/tickets and replaces them with demo data. Only run it again if you actually want to reset things.

### Day to day

After the first setup you don't need to install or seed again, just:

1. `cd backend && npm run dev`, wait for "MongoDB connected"
2. `cd frontend && npm run dev` in another terminal
3. Open `http://localhost:5173`

### Demo logins

| Role | Email | Password |
|------|--------|----------|
| Student | student@campus.edu | campus123 |
| Faculty | faculty@campus.edu | campus123 |
| Admin | admin@campus.edu | campus123 |
| Faculty | neha@campus.edu | campus123 |
| Faculty | arjun@campus.edu | campus123 |
| Student | rahul@campus.edu | campus123 |
| Student | meera@campus.edu | campus123 |
| Student | dev@campus.edu | campus123 |
| Student | fatima@campus.edu | campus123 |
| Student | ishaan@campus.edu | campus123 |

Default student is Ananya Pillai. Public signup only allows student/faculty, admins get promoted from the People page.

## API routes

| Area | Prefix |
|------|--------|
| Auth | `/api/auth` |
| Courses + enroll | `/api/courses` |
| Assignments + grading | `/api/assignments` |
| Attendance + live codes | `/api/attendance` |
| Tickets | `/api/tickets` |
| Notices | `/api/notices` |
| Timetable | `/api/timetable` |
| Insights | `/api/insights` |
| Campus Copilot | `/api/assistant/ask` |
| Notifications | `/api/notifications` |
| Events + RSVP | `/api/events` |
| Search | `/api/search` |

Frontend hits the API at `http://localhost:5000/api` by default (see `frontend/src/services/api.js`). To override, add `frontend/.env`:

```
VITE_API_URL=http://localhost:5000/api
```

Restart Vite after adding that.

## Notes to self / resume points

- Built a role-based platform (JWT + RBAC) covering academics, ops, and helpdesk in one app
- Added a rule + retrieval layer on top of the basic CRUD, attendance risk, ticket priority, conflict detection, and the copilot
- Live attendance check-in with codes that expire
- Full analytics dashboards and in-app notifications, all on MERN
