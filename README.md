# Typeform Clone — SDE Fullstack Assignment

A pixel-perfect, highly responsive, fullstack clone of the Typeform platform built with Next.js (TypeScript) and Python (FastAPI + SQLite). It replicates Typeform's signature design, user experience, 3-panel drag-and-drop form builder, conversational one-question-at-a-time respondent flow, and real-time responses analytics.

---

## 🚀 Live Demo & Key Highlights

- **Dashboard**: Workspace management with form search, status filters (All/Published/Draft), and CRUD operations (Create, Duplicate, Delete, Rename).
- **Form Builder**: 3-panel layout matching Typeform's builder with:
  - Outline panel with drag-and-drop reordering via `@dnd-kit`
  - Live WYSIWYG interactive canvas with in-place text editing
  - Question settings inspector & theme customizer (accent colors, hex codes)
  - Fullscreen interactive in-builder live preview
- **Respondent Flow (`/to/[slug]`)**: Shareable public link requiring **zero authentication**:
  - Full-screen conversational one-question-at-a-time interface
  - Smooth animated transitions powered by `motion/react` (Framer Motion)
  - Progress bar tracking completion percentage
  - Full keyboard shortcuts:
    - `Enter` / `↓`: Advance to next question or submit
    - `↑`: Go to previous question
    - `A`, `B`, `C`...: Instantly select multiple-choice / dropdown options
    - `Y` / `N`: Instantly answer Yes / No questions
    - `1` – `5`: Instantly pick rating scores
  - Client + server validation (required checks, email regex, min/max numbers)
  - Celebratory Thank-You screen
- **Results & Analytics (`/forms/[id]/results`)**:
  - Aggregated metrics: Total submissions, completion rate, question counts
  - Visual breakdown charts: Choice distribution bars, Yes/No split bar, average rating score & histogram
  - Submissions data table with timestamp and preview
  - Individual Submission Inspector Modal with previous/next response pagination
  - **One-click CSV Export** with direct browser file download

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Turbopack)
- **Language**: TypeScript (Strict type safety, zero `any` types)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: `motion/react` (Framer Motion)
- **Drag & Drop**: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- **Icons**: [Lucide React](https://lucide.dev/)

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.13)
- **ORM & Database**: [SQLAlchemy 2.0](https://www.sqlalchemy.org/) with [SQLite](https://www.sqlite.org/)
- **Data Validation**: [Pydantic v2](https://docs.pydantic.dev/) & [email-validator](https://github.com/JoshData/python-email-validator)
- **ASGI Server**: [Uvicorn](https://www.uvicorn.org/)

---

## 🗄️ Database Architecture & Schema

Designed with clean relational integrity, cascade deletions, and index optimization in SQLite.

```
┌────────────────────────────────────────┐
│                 Form                   │
├────────────────────────────────────────┤
│ id: String(36) [PK]                    │
│ title: String(200)                     │
│ description: Text                      │
│ status: Enum('draft', 'published')     │
│ public_slug: String(32) [UNIQUE, INDEX]│
│ welcome_title: String(300)             │
│ welcome_message: Text                  │
│ thank_you_title: String(300)           │
│ thank_you_message: Text                │
│ accent_color: String(16)               │
│ created_at: DateTime                   │
│ updated_at: DateTime                   │
└──────────────────┬─────────────────────┘
                   │ 1:N
                   ▼
┌────────────────────────────────────────┐       ┌────────────────────────────────────────┐
│               Question                 │       │               Submission               │
├────────────────────────────────────────┤       ├────────────────────────────────────────┤
│ id: String(36) [PK]                    │       │ id: String(36) [PK]                    │
│ form_id: ForeignKey('forms.id') [INDEX]│       │ form_id: ForeignKey('forms.id') [INDEX]│
│ kind: QuestionKind                     │       │ submitted_at: DateTime                 │
│ prompt: Text                           │       └──────────────────┬─────────────────────┘
│ help_text: Text                        │                          │
│ required: Boolean                      │                          │ 1:N
│ position: Integer                      │                          │
│ placeholder: String(200)               │                          │
│ rating_max: Integer                    │                          │
│ number_min: Float [Nullable]           │                          │
│ number_max: Float [Nullable]           │                          │
└────────┬───────────────────────────────┘                          │
         │ 1:N                                                      │
         ▼                                                          ▼
┌────────────────────────────────────────┐       ┌────────────────────────────────────────┐
│                Choice                  │       │                 Answer                 │
├────────────────────────────────────────┤       ├────────────────────────────────────────┤
│ id: String(36) [PK]                    │       │ id: String(36) [PK]                    │
│ question_id: ForeignKey [INDEX]        │◄──────┤ submission_id: ForeignKey [INDEX]      │
│ label: String(300)                     │       │ question_id: ForeignKey [INDEX]        │
│ position: Integer                      │       │ text_value: Text [Nullable]            │
│ UNIQUE(question_id, position)          │       │ number_value: Float [Nullable]         │
└────────────────────────────────────────┘       │ bool_value: Boolean [Nullable]         │
                                                 │ choice_id: ForeignKey [Nullable]       │
                                                 │ UNIQUE(submission_id, question_id)     │
                                                 └────────────────────────────────────────┘
```

### Supported Question Types (`QuestionKind`):
1. `short_text` — Single-line text input
2. `long_text` — Multi-line textarea input
3. `multiple_choice` — Selectable choice cards with letter shortcuts (`A`, `B`, `C`...)
4. `dropdown` — Clean dropdown menu with option selection
5. `email` — Email input with syntax validation
6. `number` — Numeric input with min/max bounds validation
7. `yes_no` — Split binary cards with `Y` / `N` hotkeys
8. `rating` — 1-to-5 or 1-to-10 rating scale

---

## 📡 API Overview

### Form Management & Builder
- `GET /api/forms` — List all creator forms with submission and question counts
- `POST /api/forms` — Create a new form (blank or with title)
- `GET /api/forms/{id}` — Fetch form details, ordered questions, and choices
- `PATCH /api/forms/{id}` — Update form settings (title, theme color, welcome/thank you texts)
- `DELETE /api/forms/{id}` — Delete form and all associated questions/submissions
- `POST /api/forms/{id}/duplicate` — Clone a form with all its questions and choices
- `POST /api/forms/{id}/publish` — Publish form for public responses
- `POST /api/forms/{id}/unpublish` — Revert form to draft mode
- `POST /api/forms/{id}/questions` — Add a new question of specified kind
- `PATCH /api/forms/{id}/questions/{qid}` — Update question prompt, kind, settings, or choices
- `DELETE /api/forms/{id}/questions/{qid}` — Delete question and reindex positions
- `PUT /api/forms/{id}/questions/reorder` — Update question order from drag-and-drop

### Respondent Public Flow (No Auth Required)
- `GET /api/public/{slug}` — Fetch published form structure
- `POST /api/public/{slug}/submit` — Validate and persist respondent answers

### Analytics & Results
- `GET /api/forms/{id}/stats` — Aggregated counts, averages, and choice breakdowns
- `GET /api/forms/{id}/submissions` — List submissions with date and answer preview
- `GET /api/forms/{id}/submissions/{sid}` — Get full answers for an individual submission
- `GET /api/forms/{id}/export.csv` — Stream CSV file with `Content-Disposition` attachment

---

## 💻 Setup & Running Locally

### Prerequisites
- **Node.js**: v18+ (tested on v24)
- **Python**: 3.10+ (tested on 3.13)
- **npm** or **pnpm**

### 1. Start the Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server (runs on http://localhost:8000)
python run.py
```

> **Note**: On first startup, the database `app.db` is automatically created and seeded with realistic sample forms (`Product pulse check`, `Studio internship application`, and `Event RSVP`) with pre-existing responses!

### 2. Start the Frontend

In a separate terminal:

```bash
# Navigate to frontend directory
cd frontend

# Install npm dependencies (if not already installed)
npm install

# Start Next.js development server (runs on http://localhost:3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Verify Production Build

```bash
cd frontend
npm run build
npm start
```

---

## 🧪 Automated Testing

A test suite verifying all API endpoints, validation logic, submission storage, and CSV export is included:

```bash
cd backend
python test_api.py
```

---

## 🎯 Evaluation Criteria Checklist

| Requirement | Implementation Details | Status |
| :--- | :--- | :---: |
| **Form Builder** | 3-panel layout, drag-and-drop reordering, in-place prompt editing, live interactive canvas, settings inspector | ✅ Complete |
| **8 Question Types** | Short text, long text, multiple choice, dropdown, email, number, yes/no, rating | ✅ Complete |
| **Form Management** | Create, rename, duplicate, delete with confirmation modal, publish/unpublish | ✅ Complete |
| **Respondent Flow** | Full-screen one-question-at-a-time, smooth animated transitions, progress bar | ✅ Complete |
| **Keyboard Navigation** | `Enter` to advance, `↑`/`↓` arrows, `A`/`B`/`C` keys for choices, `Y`/`N` for yes/no, `1`-`5` for rating | ✅ Complete |
| **No Auth Public Form** | Public forms accessible via `/to/[slug]` without login | ✅ Complete |
| **Validation** | Required check, email regex, number bounds on client & server | ✅ Complete |
| **Results & Analytics** | Response counts, choice breakdown bars, rating average & histogram, full response inspector | ✅ Complete |
| **CSV Export** | Direct browser download from `/api/forms/{id}/export.csv` | ✅ Complete |
| **Custom Themes** | Palette presets and custom hex color picker applied dynamically across builder and fill flow | ✅ Complete |
| **Pre-seeded Data** | 3 pre-built published & draft forms with sample responses | ✅ Complete |

---

## 📄 License

MIT License — Developed for the SDE Fullstack Assignment.
"# typeform-clone" 
