# Helen AI API

This FastAPI service verifies Supabase access tokens, reads the student's primary accessibility need on the server, generates adapted quizzes, extracts text from uploads, and stores documents in Supabase. The service-role key stays on the server; requests from the browser use the student's Supabase bearer token.

## Local setup

1. Create a virtual environment and install the Python dependencies:

   ```powershell
   py -3.12 -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```

2. Copy `.env.example` to `.env` and set the Supabase URL, anon key, service-role key, and Gemini API key. The default `GEMINI_MODEL` is `gemini-3.5-flash-lite`. Never put the service-role key or Gemini key in the Vite environment.

3. Install the Tesseract OCR executable separately. Set `TESSERACT_CMD` to its full path on Windows if it is not available on `PATH`.

4. Apply the Supabase migrations, including `0006_documents.sql` and `0007_teacher_profiles.sql`.

5. Start the API from this directory:

   ```powershell
   .\.venv\Scripts\python.exe -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

Set `VITE_DOCUMENT_API_URL` in the frontend `.env` only when the API is hosted at a different address. When it is blank, the frontend uses the same hostname on port `8000`, which supports testing from another device on the local network. For phone testing, set `FRONTEND_ORIGIN` in the backend `.env` to include the frontend's exact origin, such as `http://192.168.1.25:5173`, alongside any localhost origins. `FRONTEND_ORIGIN` accepts a comma-separated list of origins.

## Routes

- `POST /documents/upload` accepts multipart file or pasted-text fields and creates a processing document.
- `POST /ai/simplify` accepts a `document_id` form field and applies the server-resolved primary accessibility preset.
- `POST /ai/quiz` accepts JSON with `topic`, optional `source_text`, and optional `question_count` (3–10); it returns validated multiple-choice questions adapted to the student's primary accessibility need.
- `GET /documents` and `GET /documents/{id}` return only the signed-in student's own documents.

Image OCR requires the Tesseract executable. Scanned PDFs use PyMuPDF rendering followed by Tesseract. Native PDF text is extracted directly where available.