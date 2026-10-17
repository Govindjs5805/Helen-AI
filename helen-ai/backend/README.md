# Helen AI API

This FastAPI service verifies Supabase access tokens, reads student accessibility and reading profiles on the server, generates adapted quizzes and tutor replies, extracts text from uploads, and stores private student documents in Supabase. The service-role key stays on the server; requests from the browser use the student's Supabase bearer token.

## Local setup

1. Create a virtual environment and install the Python dependencies:

   ```powershell
   py -3.12 -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```

2. Copy `.env.example` to `.env` and set the Supabase URL, anon key, service-role key, and Gemini API key. The default `GEMINI_MODEL` is `gemini-3.5-flash-lite`. Never put the service-role key or Gemini key in the Vite environment.

3. Install the Tesseract OCR executable separately. Set `TESSERACT_CMD` to its full path on Windows if it is not available on `PATH`.

4. Apply the Supabase migrations in order through `0013_atomic_attention_invite_redemption.sql`. The migrations add private reading and attention preferences, document OCR/readability metadata, student-owned notes, owner-scoped focus sessions/tasks/planner items, and explicit, revocable sharing grants.

5. Start the API from this directory:

   ```powershell
   .\.venv\Scripts\python.exe -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

Set `VITE_DOCUMENT_API_URL` in the frontend `.env` only when the API is hosted at a different address. When it is blank, the frontend uses the same hostname on port `8000`, which supports testing from another device on the local network. For phone testing, set `FRONTEND_ORIGIN` in the backend `.env` to include the frontend's exact origin, such as `http://192.168.1.25:5173`, alongside any localhost origins. `FRONTEND_ORIGIN` accepts a comma-separated list of origins.

## Routes

- `POST /documents/upload` accepts multipart file or pasted-text fields and creates a processing document.
- `PATCH /documents/{id}/text` saves corrected OCR text for the signed-in student's own document.
- `POST /ai/simplify` accepts a `document_id`, optional reading level, preserved terms, sentence-length target, and output type. It returns Flesch–Kincaid grade estimates and a low-confidence flag.
- `POST /ai/simplify-text` accepts JSON with `text`, `reading_level`, `preserve_terms`, `max_sentence_length`, and `output_type`; it stores the source and result as a private document.
- `POST /ai/quiz` accepts JSON with `topic`, optional `source_text`, and optional `question_count` (3–10); it returns validated multiple-choice questions adapted to the student's primary accessibility need.
- `POST /ai/tutor` accepts a question, optional conversation history, reading level, and a follow-up action.
- `GET /documents` and `GET /documents/{id}` return only the signed-in student's own documents.
- `/attention/focus-sessions` creates, lists, and updates the signed-in student's focus sessions; `POST /attention/focus-sessions/{id}/events` records breaks, interruptions, and stuck moments.
- `/attention/tasks` lists private checklists; `POST /attention/tasks/breakdown` generates and validates ordered task steps before saving.
- `/attention/parked-thoughts` privately saves and reviews quick-captured thoughts.
- `/attention/planner` creates and updates the student's daily planner items.
- `/attention/shares/invites` creates a 24-hour, email-bound, one-use parent/teacher invite with student-selected scopes. `/attention/shares/redeem` verifies the account and, for teachers, the active classroom roster. Parents and teachers receive only aggregate summaries covered by the active grant; students can revoke grants or pending invites.
- `/attention/admin/metrics` returns aggregate row counts only.

Sharing tokens are stored as SHA-256 hashes. Sharing tables have RLS enabled without direct client write policies; changes are performed only through the authenticated API after ownership, role, expiry, email, and roster checks. Invite redemption and grant creation are atomic in the `0013` RPC migration.

Image OCR requires the Tesseract executable. Scanned PDFs use PyMuPDF rendering followed by Tesseract. Native PDF text is extracted directly where available. OCR confidence is an average of Tesseract word confidence values; it is not available for native text extraction.

Run backend tests with `.\.venv\Scripts\python.exe -m unittest discover -v -p 'test*.py'`.