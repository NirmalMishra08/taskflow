# ⚡ TaskFlow — Advanced Task & Document Management System

TaskFlow is a premium, enterprise-ready **Go (Golang) + React SPA** application designed for robust task management, secure role-based access control (RBAC), and integrated document attachments. 

The entire system is containerized with **Docker**, allowing both the database and the unified web application to run on the exact same port/URL, dynamically routing API calls and static SPA pages from a single, lightweight server container.

---

## ✨ Features & Capabilities

### 👥 Comprehensive User Roles (RBAC)
- **Admin**: Has full access across all components. Can view all system tasks, create new tasks, update task status and details, assign tasks to any registered user, manage roles, and monitor other users' activities.
- **User / Staff**: Access is tailored to self-assigned or created tasks. Staff can update status, view dashboard insights, download documents, and modify task parameters of their own tasks.

### 📋 Task Management Workflow
- **Creation**: Assign due dates, set descriptions, select priority levels (`Low`, `Medium`, `High`), and designate an assignee.
- **Task Interaction & Update Modal**: Dedicated, sleek in-line modal for quick updates to statuses (`Pending`, `In Progress`, `Completed`), due dates, and priorities.
- **Document Attachments**: Secure document upload system with file persistence powered by remote Supabase Storage backend APIs.

### 🎨 Visual & Theme Design (Premium Human Touch)
- Sleek and vibrant user interfaces built with curated harmonious HSL color systems.
- Intuitive, interactive sidebars, clean status-colored cards, quick modals, and rich micro-hover animations.
- Full dynamic responsive layouts designed for mobile, tablet, and widescreen desktops.
- Dynamic **Dark/Light Mode toggling** throughout the application for absolute user comfort.

---

## 🛠️ Technology Stack
- **Backend Core**: Golang (Go 1.22+) using the lightweight and performance-oriented **Chi Router**.
- **Database Engine**: PostgreSQL 15+ using highly optimized raw SQL statements compiled with **SQLC** and pooled connections via **jackc/pgx/v5**.
- **Frontend SPA**: React (TypeScript) initialized with **Vite** and configured with client-side **React Router v6**.
- **Containerization**: Single-port multi-stage **Docker** container orchestration.
- **File Cloud Host**: Supabase Storage Integration for document attachments.

---

## 🔌 API Routing Reference

All API calls are scoped under the relative path prefix `/api`. 

### 🔑 Authentication Routes (`/api/auth`)
- `POST /api/auth/register` — Register a new user account.
- `POST /api/auth/login` — Authenticate and issue secure JWT cookies/tokens.
- `POST /api/auth/logout` — Terminate user session.
- `GET /api/auth/me` — Retrieve the current logged-in user profile, roles, and timestamps.

### 📝 Task Management Routes (`/api/tasks`) *(Protected)*
- `GET /api/tasks` — Fetch tasks. (Admins see all tasks; Users see tasks assigned to or created by them).
- `POST /api/tasks` — Create a new task with assigned due-date, priority, and user mapping.
- `GET /api/tasks/{id}` — Fetch detailed task metadata, user assignees, and active attachments.
- `PUT /api/tasks/{id}` — Modify task parameters (status, priority, due-date).
- `DELETE /api/tasks/{id}` — Permanent task deletion (Admin only).
- `POST /api/tasks/{id}/attachments` — Upload and persist document attachments to Supabase.

### 👥 User Administration Routes (`/api/users`) *(Protected)*
- `GET /api/users` — List all registered users (useful for task assignment drop-downs).
- `PUT /api/users/{id}/role` — Dynamically update a user's role (Admin only).

---

## 👤 Admin Walkthrough: Checking Actions

Once logged in as an **Admin** (e.g., using `admin@gmail.com`), you have exclusive access to administrative workflows:

### 1. Unified Tasks Dashboard
- Access **`http://localhost:8082/dashboard`** to see analytical graphs showing task distribution, pending metrics, and system-wide workload overviews.

### 2. Task Allocation
- Under **`http://localhost:8082/tasks`**, click the **Create Task** button. 
- You will see a list of **all registered users** in the dropdown. You can assign any task to any user and set priority/due dates.

### 3. Inline Task Update Modal
- Click **Edit** on any task to open the custom Inline Modal. 
- You can instantly transition the task status, adjust the due date, and alter the priority level.

### 4. Admin User Management Panel
- Navigate to **`http://localhost:8082/users`** to view a clean tabular grid showing all registered users, their exact emails, and creation timestamps.
- Admins can instantly alter another user's role (e.g. promoting a standard `User` to `Admin` or vice-versa) using simple, inline dropdown controls.

---

##  Local Quick Start & Development

### 1. Clone & Configure local Environment
Create a `.env` file in the root workspace folder with the following variables:
```env
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_api_key_here
```

### 2. Spin Up Local Environment
Launch both the Go application and database using Docker Compose:
```bash
docker compose up -d
```

### 3. Initialize Database Schema
Create the database and apply the table layout:
```bash
# Create the database inside Postgres
docker exec postgres_db psql -U postgres -c "CREATE DATABASE taskdb;"

# Apply migrations
docker exec -i postgres_db psql -U postgres -d taskdb < backend/internal/db/migrations/001_init.sql
```

The application is now live at: **`http://localhost:8082`**!

---

## 🌎 Cloud Production Deployment (DigitalOcean)

TaskFlow includes a pre-built Docker image hosted on Docker Hub (`nirmal08/taskflow-app:latest`) cross-compiled for **linux/amd64** architecture.

### Deploying to DigitalOcean in 60 Seconds:
1. Copy [docker-compose.yml](docker-compose.yml) and your secure private `.env` to your remote droplet directory `/app`.
2. Run `docker compose up -d` on the remote server.
3. Apply migrations and database creation using:
   ```bash
   docker exec postgres_db psql -U postgres -c "CREATE DATABASE taskdb;"
   curl -sL https://raw.githubusercontent.com/NirmalMishra08/taskflow/main/backend/internal/db/migrations/001_init.sql | docker exec -i postgres_db psql -U postgres -d taskdb
   ```
Your app is fully live and listening on HTTP standard port `80` at **`http://<YOUR_DROPLET_IP>`**!


## 🛠️ Development Workflow

### Backend

- Run Go backend locally (if not using Docker):
  ```bash
  cd backend
  go run main.go
  ```

### Frontend

- Start React dev server:
  ```bash
  cd frontend
  npm install
  npm run dev
  ```

### Lint / Type Check

- Frontend Lint:
  ```bash
  npm run lint
  ```

### Database

- Manage migrations:
  ```bash
  cd backend/internal/db/migrations
  # edit or add migration files
  ```

## ⚙️ GitHub Actions CI/CD

By default, on every push or PR:
- Run backend unit tests (`backend/tests/`)
- Lint and type-check frontend code
- Build multi-stage Docker image and optionally push to Docker Hub
- Run integration tests (if you have them set up)

*See `.github/workflows/` for exact workflow files.*

## 🗂️ Example `.env` files

### Backend `.env`
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your_supabase_key
DATABASE_URL=postgresql://user:pass@localhost:5432/taskdb
PORT=8082
JWT_SECRET=your_super_secret
```

### Frontend `.env`
```
VITE_BACKEND_URL=http://localhost:8082
```

## 👥 Demo/Test Accounts

| Role | Email              | Password |
|------|--------------------|----------|
| Admin| admin@gmail.com    | admin123 |
| User | user1@gmail.com    | user123  |

*Do not use these in production!*

## ⚡ Typical User Journey (Diagram)
```mermaid
graph TD
    A[Create Task] --> B[Assign User]
    B --> C[Attach Documents]
    C --> D[User Updates Status]
    D --> E[Admin Review]
```

## 🧑‍💻 Contributing

* Fork the repository
* Create a new branch (`feature/your-feature`)
* Run all tests/lints before committing
* Open a pull request with a clear description

## 🛠️ Troubleshooting

| Problem | Solution |
|---|---|
| Port already in use | Run `docker compose down` then `up -d` again |
| Supabase auth fail | Check `.env` values; ensure correct URL/key |
| DB migration error | Ensure database exists, rerun init migration |
