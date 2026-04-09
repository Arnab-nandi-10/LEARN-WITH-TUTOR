# Tutor LMS

Tutor LMS is a full-stack learning management system with a Next.js frontend and an Express + MongoDB backend. The repository is now split into `client/` for the web app and `server/backend/` for the API.

## Current Repo Layout

```text
tutor-landing/
├── client/                    # Next.js Frontend
│   ├── app/                   # App Router pages
│   │   ├── (auth)/            # Auth pages (login, signup)
│   │   ├── admin/             # Admin dashboard & management
│   │   ├── faculty/           # Faculty course & assessment management
│   │   ├── student/           # Student learning portal
│   │   ├── page.tsx           # Public landing page
│   │   └── layout.tsx         # Root layout
│   ├── components/            # Reusable UI components
│   │   ├── auth/              # Auth-related components
│   │   ├── faculty/           # Faculty-specific components
│   │   ├── student/           # Student-specific components
│   │   ├── sections/          # Landing page sections
│   │   ├── ui/                # Base UI components
│   │   └── layouts/           # Layout components
│   ├── lib/                   # Core application logic
│   │   ├── api/               # API client functions
│   │   ├── stores/            # Zustand state stores
│   │   ├── types/             # TypeScript type definitions
│   │   ├── hooks/             # Custom React hooks
│   │   └── utils/             # Utility functions
│   └── package.json
│
└── server/backend/            # Express API Server
    ├── configs/               # Database & AWS configuration
    ├── controllers/           # HTTP request handlers
    ├── middlewares/           # Auth, validation, error handling
    ├── models/                # Mongoose schemas
    │   └── businesses/        # Business/commerce models
    ├── repositories/          # Data access layer
    ├── routes/                # API route definitions
    │   └── admin/             # Admin-specific routes
    ├── services/              # Business logic layer
    ├── validations/           # Joi validation schemas
    ├── utils/                 # Backend utilities
    ├── app.js                 # Express app configuration
    ├── server.js              # Server entry point
    └── package.json

```

## Product Areas

- Public landing page with course marketing sections
- Authentication for admin, faculty, and student users
- Faculty course creation, editing, lesson management, and assessments
- Student course enrollment, lesson progress, exams, and results
- Admin dashboards for users, courses, and analytics
- File upload support through AWS S3 presigned URLs

## Tech Stack

- Frontend: Next.js 14, React 18, TypeScript, Tailwind CSS
- Client state and forms: Zustand, React Query, React Hook Form, Zod
- Backend: Express, Mongoose, Joi, JWT
- Database: MongoDB
- Storage: AWS S3

## Prerequisites

- Node.js 18+
- npm
- MongoDB database
- AWS S3 credentials if you want upload features enabled

## Environment Setup

### Frontend

Create `client/.env.local` from `client/.env.example`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Backend

Create `server/backend/.env` with:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
AWS_REGION=your_aws_region
AWS_ACCESS_KEY=your_aws_access_key
AWS_SECRET_KEY=your_aws_secret_key
AWS_BUCKET_NAME=your_bucket_name
FRONTEND_URL=http://localhost:3001
```

Notes:

- `MONGO_URI` and `JWT_SECRET` are required.
- AWS variables are required for upload endpoints.
- The backend currently allows local frontend origins on `http://localhost:3000` and `http://localhost:3001`.

## Install Dependencies

Frontend:

```bash
cd client
npm install
```

Backend:

```bash
cd server/backend
npm install
```

## Run Locally

Use two terminals.

### Terminal 1: backend

```bash
cd server/backend
npm run dev
```

Backend URL:

```text
http://localhost:5000
```

### Terminal 2: frontend

```bash
cd client
npm run dev
```

Frontend URL:

```text
http://localhost:3001
```

## Production Build

Frontend:

```bash
cd client
npm run build
npm start
```

Backend:

```bash
cd server/backend
npm start
```

## Main Frontend Areas

- `client/app/page.tsx`: landing page
- `client/app/(auth)`: auth pages
- `client/app/admin`: admin pages
- `client/app/faculty`: faculty dashboard, courses, assessments
- `client/app/student`: student dashboard, courses, exams

## Main Backend API Areas

- `/api/auth`
- `/api/courses`
- `/api/modules`
- `/api/lessons`
- `/api/enrollments`
- `/api/progress`
- `/api/exams`
- `/api/questions`
- `/api/attempts`
- `/api/analytics`
- `/api/upload`
- `/api/users`

## Useful Scripts

### `client/package.json`

```bash
npm run dev
npm run build
npm run start
npm run lint
```

### `server/backend/package.json`

```bash
npm run dev
npm start
```

## Troubleshooting

### Frontend cannot reach backend

- Make sure the backend is running on port `5000`
- Check `client/.env.local`
- Verify `NEXT_PUBLIC_API_URL=http://localhost:5000`
- The frontend client can also recover on local port `5001` if you intentionally use it

### Backend does not start

- Check that `server/backend/.env` exists
- Verify `MONGO_URI`
- Verify `JWT_SECRET`

### Uploads fail

- Verify all AWS environment variables
- Check the S3 bucket name and region

## Notes

- This repo no longer uses the old single-root app structure.
- Frontend work should happen inside `client/`.
- Backend work should happen inside `server/backend/`.
