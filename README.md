# Helen AI — Adaptive AI Accessibility Platform for Inclusive Learning

Helen AI is an AI-powered, adaptive learning platform designed to make digital learning more accessible and personalised for students with diverse learning and accessibility needs. It combines accessible user interfaces, AI-assisted learning tools, document processing and learning-support features in one platform.

The platform aims to support learners with needs such as dyslexia, ADHD, autism spectrum disorder, visual impairment, hearing impairment and other learning difficulties, while also providing tools for teachers to support classroom learning.

> **Project goal:** Making education more accessible through adaptive artificial intelligence.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Application Workflow](#application-workflow)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Backend API](#backend-api)
- [Database and Security](#database-and-security)
- [Accessibility and Personalisation](#accessibility-and-personalisation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Future Enhancements](#future-enhancements)
- [Contributing](#contributing)
- [Team](#team)

## Overview

Traditional learning platforms often provide the same content and interface to every learner. Helen AI aims to address this limitation by adapting learning content, reading presentation and study-support tools to individual needs.

The application provides separate experiences for students and teachers. Students can access learning resources, document-processing tools, focus support and personalised accessibility settings. Teacher-facing pages provide classroom and student-progress interfaces.

## Key Features

### 1. Authentication and Onboarding
- User authentication through Supabase.
- User profile and role handling.
- Student onboarding and profile setup.
- Protected application routes.
- Separate student and teacher dashboard experiences.

### 2. Adaptive Accessibility
- Accessibility profiles and learning-need preferences.
- Dyslexia-oriented reading presentation.
- ADHD-oriented interface and calm-mode support.
- Light and dark themes.
- Reading preferences such as font, text size, spacing and line height.
- Persistent reading and attention preferences.

### 3. AI Document Analyser and Simplifier
- Upload supported PDF documents and images, or submit text.
- Extract text from PDFs and images.
- Use OCR for scanned documents when required.
- Simplify text according to reading-level and accessibility preferences.
- Generate alternative output formats, including summaries, glossaries, outlines and audio-oriented scripts.
- Estimate text readability and report OCR confidence when available.
- Save and retrieve document-processing results.

### 4. AI Learning Assistant
- AI-powered tutoring and question answering.
- Follow-up actions for simpler explanations, examples, key points and step-by-step breakdowns.
- Generate multiple-choice quizzes.
- Adapt generated learning content to accessibility needs.

### 5. Focus and Study Support
- Focus-session tracking.
- Recording interruptions, breaks and moments when a student gets stuck.
- Breaking larger tasks into smaller steps.
- Capturing and reviewing distracting thoughts.
- Daily planner and task tracking.
- Optional, explicitly scoped sharing of attention-support summaries.

### 6. Classroom and Progress Features
- Student and teacher dashboard pages.
- Classroom management interfaces.
- Student-progress views.
- Assignments, notes, reports and learning-planner pages.
- Parent/teacher sharing workflows with permission and scope checks.

*The presence of a page or API does not necessarily mean every feature has been fully tested or is production-ready.*

## System Architecture

```text
                  Student / Teacher
                         |
                         v
              React + TypeScript UI
               Vite / React Router
                         |
              +----------+----------+
              |                     |
              v                     v
       Supabase Client         FastAPI Backend
              |                     |
              v           +---------+----------+
       Supabase Auth       |         |          |
              |            v         v          v
              |         Document    Gemini   Focus and
              |         Processing   AI      Study APIs
              |            |
              |       +----+-----+
              |       |          |
              |       v          v
              |   PDF Text      Tesseract
              |   Extraction    OCR
              |       |          |
              +-------+----------+
                      |
                      v
             Supabase PostgreSQL
       Profiles / Documents / Preferences
          Activity / Classroom Data
```

### Architecture Overview

- **Frontend:** React renders the application pages and manages navigation, session-aware UI and accessibility preferences.
- **Authentication and database:** Supabase provides authentication and PostgreSQL-backed data storage.
- **Backend:** FastAPI exposes authenticated APIs for document processing, AI tutoring, quiz generation and focus-support workflows.
- **AI processing:** The backend uses the configured Gemini API for supported AI-generated outputs.
- **Document extraction:** PyMuPDF extracts native PDF text and renders scanned pages when OCR is needed. Tesseract processes images and scanned pages.
- **Security:** The backend validates Supabase access tokens and uses server-side configuration for privileged database operations.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite |
| Styling | Tailwind CSS, CSS variables |
| Routing | React Router |
| UI and animation | Lucide React, Framer Motion |
| Authentication | Supabase Auth |
| Database | Supabase PostgreSQL |
| Backend | Python, FastAPI, Uvicorn |
| AI | Google Gemini API |
| PDF processing | PyMuPDF |
| OCR | Tesseract, pytesseract |
| Image processing | Pillow |
| API communication | Fetch API, HTTPX |
| Frontend deployment configuration | Vercel |
| Version control | Git, GitHub |

## Project Structure

```text
Helen-AI/
├── README.md
└── helen-ai/
    ├── public/
    ├── src/
    │   ├── components/
    │   │   ├── layout/
    │   │   └── ...
    │   ├── context/
    │   │   ├── AuthContext.tsx
    │   │   ├── ThemeContext.tsx
    │   │   └── ReadingThemeContext.tsx
    │   ├── hooks/
    │   ├── pages/
    │   │   ├── Auth.tsx
    │   │   ├── Onboarding.tsx
    │   │   ├── Dashboard.tsx
    │   │   ├── AIAssistant.tsx
    │   │   ├── Documents.tsx
    │   │   ├── Notes.tsx
    │   │   ├── FocusMode.tsx
    │   │   ├── Planner.tsx
    │   │   ├── Progress.tsx
    │   │   └── teacher/
    │   ├── services/
    │   │   ├── api.ts
    │   │   ├── attentionApi.ts
    │   │   └── supabase.ts
    │   ├── theme/
    │   ├── types/
    │   ├── App.tsx
    │   ├── main.tsx
    │   └── index.css
    ├── backend/
    │   ├── main.py
    │   ├── requirements.txt
    │   ├── .env.example
    │   ├── README.md
    │   ├── test_attention.py
    │   └── test_readability.py
    ├── supabase/
    │   └── migrations/
    ├── .env.example
    ├── package.json
    ├── package-lock.json
    ├── tsconfig.json
    ├── vite.config.ts
    └── vercel.json
```

## Application Workflow

### User Authentication

1. A user signs in through the authentication interface.
2. Supabase manages the authentication session.
3. The application retrieves the user's profile and role.
4. Student users are directed through onboarding where required.
5. Protected routes use the application's onboarding and authentication guards.
6. The dashboard experience is selected according to the user's role.

### Document Analysis and Simplification

1. The student submits a document, image or text.
2. The frontend sends the request to the FastAPI backend with the user's access token.
3. The backend verifies the token against Supabase Auth and checks the user's profile.
4. Native PDF text is extracted directly where possible. Scanned pages and images are processed using OCR.
5. The extracted text can be corrected and submitted for simplification.
6. The backend prepares the AI request using reading-level and accessibility instructions.
7. The generated output is validated and associated with the student's document record.
8. The frontend displays the resulting content.

OCR confidence is available for OCR-processed content when confidence values can be calculated. Native PDF text extraction does not produce an OCR confidence score.

### AI Tutoring and Quiz Generation

1. The student submits a question or topic.
2. The frontend sends the request through the API service.
3. The backend verifies the authenticated user and retrieves relevant accessibility preferences.
4. The backend prepares the AI request.
5. Quiz responses are validated against the expected question structure.
6. The frontend presents the result to the student.

### Accessibility Preferences

Reading and attention preferences are managed through frontend contexts and stored in the student's profile where supported. Theme preferences influence interface styling, while reading preferences control properties such as typography, spacing and reading aids.

## Getting Started

### Prerequisites

Install the following:

- Node.js and npm.
- Python 3.12 recommended for the backend setup documented in the backend README.
- A Supabase project.
- A Google Gemini API key.
- Tesseract OCR installed on your operating system for image and scanned-PDF OCR.

### 1. Clone the Repository

```bash
git clone https://github.com/Govindjs5805/Helen-AI.git
cd Helen-AI/helen-ai
```

### 2. Configure the Frontend

Create a `.env` file inside the `helen-ai` directory using `.env.example` as a reference.

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_DOCUMENT_API_URL=
```

Use your own Supabase project values. Do not commit real environment files or credentials.

### 3. Install Frontend Dependencies

```bash
npm install
```

### 4. Configure the Backend

Move into the backend directory:

```bash
cd backend
```

Create and activate a virtual environment in PowerShell:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create a backend `.env` file based on `backend/.env.example`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3.5-flash-lite
FRONTEND_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
TESSERACT_CMD=tesseract
```

If Tesseract is not available on your system `PATH`, set `TESSERACT_CMD` to the full path of the installed Tesseract executable.

**Security:** The Supabase service-role key and Gemini API key must remain on the backend. Never expose either as a `VITE_` variable or commit it to GitHub.

### 5. Apply Database Migrations

Apply the SQL migrations in `supabase/migrations/` to your Supabase project in numerical order, following the backend README and any migration prerequisites.

The migrations define application tables and policies for profiles, student preferences, documents, classroom-related data and focus-support workflows.

Use a development or staging database first, and back up existing data before applying schema changes to a populated project.

### 6. Start the Backend

From the `backend` directory:

```powershell
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend API will be available locally at:

```text
http://localhost:8000
```

The health endpoint is:

```text
http://localhost:8000/health
```

### 7. Start the Frontend

Open a separate terminal in the `helen-ai` directory:

```bash
npm run dev
```

Open the local URL printed by Vite, normally:

```text
http://localhost:5173
```

During development, the frontend API service defaults to port `8000` when `VITE_DOCUMENT_API_URL` is not configured. Set that variable if the backend runs at another address.

## Environment Variables

### Frontend

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase public/anonymous client key |
| `VITE_DOCUMENT_API_URL` | Optional base URL for the document and AI API |

### Backend

| Variable | Purpose |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Used to validate user access tokens with Supabase Auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side privileged database operations |
| `GEMINI_API_KEY` | API key for Gemini requests |
| `GEMINI_MODEL` | Configured Gemini model name |
| `FRONTEND_ORIGIN` | Comma-separated list of permitted frontend origins |
| `TESSERACT_CMD` | Tesseract executable or command path |
| `FASTAPI_ROOT_PATH` | Optional deployment root path |

Never publish secret values in the README, screenshots, logs or repository history.

## Backend API

The backend is implemented in `backend/main.py`. Its main API groups include:

| Endpoint | Purpose |
|---|---|
| `GET /health` | Health check |
| `GET /documents` | List the authenticated student's documents |
| `GET /documents/{document_id}` | Retrieve a document belonging to the student |
| `POST /documents/upload` | Upload a file or submit text for document processing |
| `PATCH /documents/{document_id}/text` | Save corrected document text |
| `POST /ai/simplify` | Simplify a stored document |
| `POST /ai/simplify-text` | Simplify submitted text and save the result |
| `POST /ai/tutor` | Generate an AI tutor response |
| `POST /ai/quiz` | Generate validated multiple-choice questions |
| `/attention/focus-sessions` | Manage focus sessions and session events |
| `/attention/tasks` | Retrieve and manage study task breakdowns |
| `/attention/parked-thoughts` | Capture and review thoughts |
| `/attention/planner` | Manage planner items |
| `/attention/shares` | Manage scoped attention-support sharing |

Additional endpoints support attention-sharing invitations, redemption, permitted summaries and aggregate administrative metrics.

See [the backend README](helen-ai/backend/README.md) for additional API details and request behaviour.

## Database and Security

Helen AI uses Supabase Auth and PostgreSQL. SQL migrations in `supabase/migrations/` maintain the database schema and security policies.

Key design principles include:

- User profiles are linked to Supabase Auth identities.
- Student-owned records are scoped to their owners.
- Row-Level Security is enabled on relevant tables.
- The backend verifies bearer tokens before serving protected requests.
- The service-role key is restricted to server-side use.
- Attention-support sharing is designed around explicit scopes and revocable permissions.
- Invite tokens are stored as hashes, according to the backend documentation.

Database policies and endpoint permissions should be reviewed and tested whenever a new feature or table is introduced.

## Accessibility and Personalisation

Helen AI includes mechanisms for adapting the interface and generated content to user preferences.

Examples include:

- Reading fonts, text scaling and letter spacing.
- Line height and paragraph spacing.
- Background tint and reading aids.
- Text-to-speech preferences and word highlighting settings.
- ADHD-oriented calm mode and reduced-motion preferences.
- Accessibility-specific prompts for document simplification and quiz generation.

These are software accommodations intended to support learning. They do not replace professional assessment or guarantee the same experience for every learner.

## Testing

The backend repository includes tests for attention-support behaviour and readability calculations.

From the `backend` directory, run:

```powershell
.\.venv\Scripts\python.exe -m unittest discover -v -p "test*.py"
```

To build the frontend, run this from the `helen-ai` directory:

```bash
npm run build
```

The build runs TypeScript checking followed by the Vite production build.

A successful build or unit-test run does not by itself verify the complete application. Integration testing should also cover authentication, database permissions, document uploads, OCR, AI responses, accessibility settings and deployment configuration.

## Deployment

The repository contains Vercel configuration for the frontend and a FastAPI backend intended to run as a separate service when necessary.

For deployment:

1. Configure frontend environment variables in the hosting provider.
2. Configure backend environment variables in the backend hosting environment.
3. Apply the required Supabase migrations.
4. Install Tesseract on the backend host if OCR is required.
5. Configure the frontend API URL to point to the deployed backend.
6. Configure `FRONTEND_ORIGIN` to include the exact deployed frontend origin.
7. Verify authentication, CORS, database policies and file-processing behaviour in the deployed environment.

The frontend and backend must be configured consistently. Do not assume that local development configuration automatically works in production.

## Future Enhancements

Potential areas for further development include:

- Expanded multilingual accessibility support.
- More comprehensive text-to-speech and speech-to-text workflows.
- Additional assistive learning formats.
- Improved OCR handling for complex layouts and handwritten content.
- Deeper learning analytics and personalised learning recommendations.
- Broader automated integration and accessibility testing.
- Improved documentation and deployment automation.

These are potential improvements and should not be interpreted as completed functionality unless verified in the implementation.

## Contributing

Contributions and improvements are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make a focused change.
4. Run the relevant tests and build checks.
5. Commit and push your changes.
6. Open a pull request describing the change and its verification.

Example:

```bash
git checkout -b feature/your-feature
git add .
git commit -m "Describe your change"
git push origin feature/your-feature
```

Do not commit `.env` files, API keys, service-role keys, local virtual environments or generated build directories.

## Team

**Helen AI Development Team**  
Department of Computer Science and Engineering

## License

See the repository's [LICENSE](LICENSE) file for licensing terms.

---

*Helen AI — Making education accessible through adaptive artificial intelligence.*

For questions, suggestions, or collaborations, please open an issue in this repository or contact the development team.

---

*"Making education accessible through adaptive artificial intelligence."*
