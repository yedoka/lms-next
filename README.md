# LMS Platform (Next.js)

A modern, full-stack Learning Management System (LMS) built with Next.js 16.2, TypeScript, and Prisma. This platform provides a robust environment for educators to create and manage courses, and for students to enroll, track their progress, and complete assessments.

## 🚀 Tech Stack

### Core
- **Framework:** Next.js 16.2 (App Router)
- **Language:** TypeScript (Strict Mode)
- **Database:** PostgreSQL (via Neon)
- **ORM:** Prisma
- **Authentication:** Auth.js v5 (NextAuth) with Role-Based Access Control

### Frontend & Styling
- **Styling:** Tailwind CSS v4, shadcn/ui
- **Icons:** Lucide React
- **Rich Text Editor:** Tiptap
- **Drag & Drop:** dnd-kit

### Media & Storage
- **Media Hosting:** Cloudinary

### Realtime Backend (Separate Microservice)
- **Stack:** Bun, Express, Socket.io
- **Message Broker:** Redis (Upstash)

## ✨ Core Features

### 🔐 Authentication & Authorization
- Secure login and registration.
- Role-based access control (Student, Teacher, Admin).
- "Remember me" functionality and secure session management.

### 📚 Course Management (Teacher Dashboard)
- Create, edit, and publish courses.
- Manage course categories, thumbnails, and descriptions via rich text.
- Create lessons with drag-and-drop reordering.
- Attach video URLs and downloadable resources to lessons.

### 🎓 Student Experience
- Browse and enroll in available courses.
- Dedicated learning dashboard with course progress tracking.
- Distraction-free lesson viewing and rich text reading.

### 📝 Quiz & Assessment System
- Teachers can create quizzes linked to specific lessons.
- Support for multiple-choice and boolean questions.
- Configurable time limits and passing scores.
- Automated grading system with student attempts tracking.
- Teacher overrides for manual score adjustments.

## 📁 Project Architecture

This repository follows a **Feature-Sliced Architecture** to maintain modularity and scalability.

```text
lms-next/
├── app/                  # Next.js App Router (Pages, Layouts, API Routes)
├── features/             # Domain-specific logic
│   ├── auth/             # Authentication feature (actions, components, services...)
│   └── courses/          # Course management feature
├── shared/               # Globally shared resources
│   ├── components/       # Generic UI components
│   ├── db/               # Prisma client and database config
│   ├── lib/              # Utility functions and hooks
│   └── ui/               # Base shadcn/ui components
└── prisma/               # Database schema, migrations, and seeds
```

## 🛠️ Getting Started

### Prerequisites
- Node.js 20+ or [Bun](https://bun.sh/)
- PostgreSQL database
- Cloudinary account

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd lms-next
   ```

2. **Install dependencies:**
   ```bash
   bun install
   # or
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory and add the following variables:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@host:port/db?schema=public"

   # Auth.js
   AUTH_SECRET="your-secret-key"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"

   # Cloudinary (Media Uploads)
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
   CLOUDINARY_API_KEY="your-api-key"
   CLOUDINARY_API_SECRET="your-api-secret"
   ```

4. **Database Setup:**
   Run the setup script to migrate the database and generate the Prisma client:
   ```bash
   bun run db:setup
   ```

5. **Start the development server:**
   ```bash
   bun run dev
   ```
   The application will be available at [http://localhost:3000](http://localhost:3000).

## 📜 Available Scripts

- `bun run dev` - Starts the development server.
- `bun run build` - Builds the app for production (generates Prisma client first).
- `bun run start` - Runs the built application.
- `bun run lint` - Lints the codebase using ESLint.
- `bun run db:generate` - Generates Prisma client.
- `bun run db:push` - Pushes schema changes to the database.
- `bun run db:studio` - Opens Prisma Studio to view database records.
- `bun run db:setup` - Runs migrations, generates client, and seeds the database.

## 🎨 UI/UX Guidelines
The application follows a minimalist, "Notion-like" aesthetic:
- Clean whitespace with reduced heavy borders.
- Subtle off-white sidebars and flat cards.
- Typography driven by Geist and Inter fonts.

## 🤝 Development Conventions
- **Commit Messages:** Must be prefixed with the ticket number (e.g., `[LMS-001] Fix login bug`).
- **Separation of Concerns (SoC):**
  - **Server Actions** (`actions/`) handle HTTP context, routing, and Zod validation.
  - **Services** (`services/`) encapsulate business logic and Prisma queries.
  - **Components** (`components/`) handle presentation.
- **Validation:** Zod schemas are used uniformly across client and server.
