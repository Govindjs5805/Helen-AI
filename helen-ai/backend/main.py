from __future__ import annotations

import os
from io import BytesIO
from pathlib import Path
from typing import Any, Literal
from uuid import UUID

import httpx
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from starlette.concurrency import run_in_threadpool

load_dotenv(Path(__file__).resolve().parent / '.env')


MAX_UPLOAD_BYTES = 15 * 1024 * 1024
MAX_TEXT_CHARACTERS = 250_000
SUPPORTED_IMAGES = {'.png', '.jpg', '.jpeg', '.webp', '.tif', '.tiff', '.bmp'}
PRESET_PROMPTS: dict[str, str] = {
    'dyslexia': (
        'Rewrite for a learner with dyslexia. Use short sentences, common vocabulary, '
        'and one idea per sentence. Preserve technical terms exactly as written and '
        'explain them simply without replacing them. Keep all important facts. '
        'Return natural paragraphs, not tables.'
    ),
    'adhd': (
        'Rewrite for a learner with ADHD. Organize the material into a few short '
        'sections with clear Markdown headings and concise numbered or bulleted '
        'steps. Remove tangential detail while preserving key facts. Bold the single '
        'most important point in each section. Keep each section focused.'
    ),
    'visual_impairment': (
        'Rewrite for a learner who will primarily listen to this text with text-to-speech. '
        'Use flowing narrative sentences and clear spoken transitions. Do not use tables, '
        'bullet symbols, numbered lists, visual references, or layout-dependent phrasing. '
        'Preserve the important information.'
    ),
    'hearing_impairment': (
        'Keep the source very close to the original because comprehension is not the '
        'barrier for this learner. Make only light edits for obvious clarity, grammar, '
        'and readability. Do not summarize or restructure.'
    ),
    'learning_disability': (
        'Moderately simplify this material. Use shorter paragraphs and plain-language '
        'substitutions for jargon. Define each necessary technical term inline the '
        'first time it appears. Keep important facts and examples.'
    ),
}

app = FastAPI(title='Helen AI Document Service', version='1.0.0')
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.getenv('FRONTEND_ORIGIN', 'http://localhost:5173,http://127.0.0.1:5173').split(',')
        if origin.strip()
    ],
    allow_credentials=True,
    allow_methods=['GET', 'POST'],
    allow_headers=['Authorization', 'Content-Type'],
)


def required_env(name: str) -> str:
    value = os.getenv(name, '').strip()
    if not value:
        raise HTTPException(status_code=503, detail='The document service is not configured yet.')
    return value


def service_headers() -> dict[str, str]:
    key = required_env('SUPABASE_SERVICE_ROLE_KEY')
    return {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json',
    }


async def rest_request(
    method: str,
    table_or_path: str,
    *,
    params: dict[str, str] | None = None,
    payload: dict[str, Any] | None = None,
) -> Any:
    base_url = required_env('SUPABASE_URL').rstrip('/')
    url = f'{base_url}/rest/v1/{table_or_path}'
    headers = service_headers()
    if method in {'POST', 'PATCH'}:
        headers['Prefer'] = 'return=representation'
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.request(method, url, params=params, json=payload, headers=headers)
    if response.is_error:
        raise HTTPException(status_code=502, detail='We could not save or load your document. Try again.')
    if not response.content:
        return None
    return response.json()


async def current_student(authorization: str | None = Header(default=None)) -> dict[str, str]:
    if not authorization or not authorization.lower().startswith('bearer '):
        raise HTTPException(status_code=401, detail='Please sign in again to continue.')

    access_token = authorization.split(' ', 1)[1].strip()
    supabase_url = required_env('SUPABASE_URL').rstrip('/')
    anon_key = required_env('SUPABASE_ANON_KEY')
    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.get(
            f'{supabase_url}/auth/v1/user',
            headers={'apikey': anon_key, 'Authorization': f'Bearer {access_token}'},
        )
    if response.is_error:
        raise HTTPException(status_code=401, detail='Your session expired. Sign in and try again.')

    user_id = response.json().get('id')
    if not user_id:
        raise HTTPException(status_code=401, detail='Your session could not be verified.')

    profiles = await rest_request(
        'GET', 'profiles',
        params={'id': f'eq.{user_id}', 'select': 'id,student_id,role', 'limit': '1'},
    )
    if not profiles or profiles[0].get('role') != 'student' or not profiles[0].get('student_id'):
        raise HTTPException(status_code=403, detail='Document simplification is available to student accounts.')
    return {'user_id': user_id, 'student_id': profiles[0]['student_id']}


async def owned_document(document_id: UUID, student_id: str) -> dict[str, Any]:
    documents = await rest_request(
        'GET', 'documents',
        params={
            'id': f'eq.{document_id}',
            'student_id': f'eq.{student_id}',
            'select': 'id,student_id,title,original_text,simplified_text,source_type,status,error_message,created_at',
            'limit': '1',
        },
    )
    if not documents:
        raise HTTPException(status_code=404, detail='We could not find that document in your history.')
    return documents[0]


async def update_document(document_id: UUID, student_id: str, values: dict[str, Any]) -> None:
    await rest_request(
        'PATCH', 'documents',
        params={'id': f'eq.{document_id}', 'student_id': f'eq.{student_id}'},
        payload=values,
    )


def extract_image_text(file_bytes: bytes) -> str:
    import pytesseract
    from PIL import Image

    command = os.getenv('TESSERACT_CMD', '').strip()
    if command:
        pytesseract.pytesseract.tesseract_cmd = command
    with Image.open(BytesIO(file_bytes)) as image:
        return pytesseract.image_to_string(image).strip()


def extract_pdf_text(file_bytes: bytes) -> str:
    import pytesseract
    import pymupdf
    from PIL import Image

    command = os.getenv('TESSERACT_CMD', '').strip()
    if command:
        pytesseract.pytesseract.tesseract_cmd = command
    pages: list[str] = []
    with pymupdf.open(stream=file_bytes, filetype='pdf') as document:
        for page in document:
            page_text = page.get_text().strip()
            if not page_text:
                pixmap = page.get_pixmap(matrix=pymupdf.Matrix(2, 2), alpha=False)
                image = Image.open(BytesIO(pixmap.tobytes('png')))
                page_text = pytesseract.image_to_string(image).strip()
            pages.append(page_text)
    return '\n\n'.join(page for page in pages if page).strip()


def source_for_file(upload: UploadFile) -> Literal['pdf', 'image', 'text']:
    suffix = Path(upload.filename or '').suffix.lower()
    content_type = (upload.content_type or '').lower()
    if suffix == '.pdf' or content_type == 'application/pdf':
        return 'pdf'
    if suffix in SUPPORTED_IMAGES or content_type.startswith('image/'):
        return 'image'
    if suffix in {'.txt', '.md'} or content_type.startswith('text/'):
        return 'text'
    raise HTTPException(status_code=415, detail='Choose a PDF, image, or plain-text file.')


async def create_document(student_id: str, title: str, source_type: str) -> dict[str, Any]:
    result = await rest_request(
        'POST', 'documents',
        params={'select': 'id,title,source_type,status,created_at'},
        payload={
            'student_id': student_id,
            'title': title,
            'original_text': '',
            'source_type': source_type,
            'status': 'processing',
        },
    )
    if not result:
        raise HTTPException(status_code=502, detail='We could not start this upload. Try again.')
    return result[0]


@app.get('/health')
async def health() -> dict[str, str]:
    return {'status': 'ok'}


@app.get('/documents')
async def list_documents(student: dict[str, str] = Depends(current_student)) -> list[dict[str, Any]]:
    return await rest_request(
        'GET', 'documents',
        params={
            'student_id': f"eq.{student['student_id']}",
            'select': 'id,title,source_type,status,error_message,created_at',
            'order': 'created_at.desc',
            'limit': '100',
        },
    ) or []


@app.get('/documents/{document_id}')
async def get_document(
    document_id: UUID,
    student: dict[str, str] = Depends(current_student),
) -> dict[str, Any]:
    return await owned_document(document_id, student['student_id'])


@app.post('/documents/upload')
async def upload_document(
    file: UploadFile | None = File(default=None),
    text: str | None = Form(default=None),
    title: str | None = Form(default=None),
    student: dict[str, str] = Depends(current_student),
) -> dict[str, Any]:
    pasted_text = (text or '').strip()
    if not file and not pasted_text:
        raise HTTPException(status_code=400, detail='Choose a file or paste text to get started.')
    if len(pasted_text) > MAX_TEXT_CHARACTERS:
        raise HTTPException(status_code=413, detail='That text is too long. Split it into a smaller section and retry.')

    if file:
        source_type = source_for_file(file)
        file_bytes = await file.read(MAX_UPLOAD_BYTES + 1)
        if len(file_bytes) > MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=413, detail='This file is larger than 15 MB. Choose a smaller file.')
        filename = Path(file.filename or 'Document').stem
        document_title = (title or '').strip()[:180] or (filename or 'Document')[:180]
    else:
        source_type = 'text'
        file_bytes = b''
        document_title = (title or '').strip()[:180] or 'Pasted text'

    document = await create_document(student['student_id'], document_title, source_type)
    document_id = UUID(document['id'])

    try:
        if source_type == 'pdf':
            original_text = await run_in_threadpool(extract_pdf_text, file_bytes)
        elif source_type == 'image':
            original_text = await run_in_threadpool(extract_image_text, file_bytes)
        else:
            original_text = pasted_text if pasted_text else file_bytes.decode('utf-8-sig', errors='replace').strip()

        if not original_text.strip():
            message = 'We could not read text from that file. Try a clearer scan or paste the text instead.'
            await update_document(document_id, student['student_id'], {
                'status': 'failed', 'error_message': message,
            })
            raise HTTPException(
                status_code=422,
                detail={'message': message, 'document_id': str(document_id)},
            )
        if len(original_text) > MAX_TEXT_CHARACTERS:
            message = 'This document is too long to process at once. Split it into smaller sections and retry.'
            await update_document(document_id, student['student_id'], {
                'status': 'failed', 'error_message': message,
            })
            raise HTTPException(
                status_code=413,
                detail={'message': message, 'document_id': str(document_id)},
            )

        await update_document(document_id, student['student_id'], {
            'original_text': original_text,
            'status': 'processing',
            'error_message': None,
        })
    except HTTPException:
        raise
    except Exception as error:
        message = 'We could not read this file. Try a clearer scan or paste its text instead.'
        await update_document(document_id, student['student_id'], {
            'status': 'failed', 'error_message': message,
        })
        raise HTTPException(
            status_code=422,
            detail={'message': message, 'document_id': str(document_id)},
        ) from error

    return {
        'id': str(document_id),
        'title': document_title,
        'source_type': source_type,
        'status': 'processing',
        'message': 'Text extracted. Preparing your personalized version.',
    }


async def simplify_with_gemini(text: str, preset: str) -> str:
    api_key = required_env('GEMINI_API_KEY')
    model = os.getenv('GEMINI_MODEL', 'gemini-2.0-flash').strip()
    prompt = (
        f'{PRESET_PROMPTS[preset]}\n\n'
        'Return only the rewritten document. Do not mention accessibility settings or add a preamble.\n\n'
        f'SOURCE DOCUMENT:\n{text}'
    )
    async with httpx.AsyncClient(timeout=90) as client:
        response = await client.post(
            f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',
            params={'key': api_key},
            json={
                'contents': [{'parts': [{'text': prompt}]}],
                'generationConfig': {'temperature': 0.2},
            },
        )

    if response.status_code == 429:
        raise HTTPException(status_code=503, detail='The simplifier is busy right now. Please try again shortly.')
    if response.is_error:
        raise HTTPException(status_code=502, detail='The simplifier is temporarily unavailable. Please retry.')
    payload = response.json()
    candidates = payload.get('candidates') or []
    parts = (candidates[0].get('content') or {}).get('parts') or [] if candidates else []
    simplified = '\n'.join(part.get('text', '') for part in parts).strip()
    if not simplified:
        raise HTTPException(status_code=502, detail='The simplifier returned an empty result. Please retry.')
    return simplified


@app.post('/ai/simplify')
async def simplify_document(
    document_id: UUID = Form(...),
    student: dict[str, str] = Depends(current_student),
) -> dict[str, Any]:
    document = await owned_document(document_id, student['student_id'])
    if not document.get('original_text', '').strip():
        raise HTTPException(status_code=422, detail='This document has no readable text. Upload it again or paste the text.')

    needs = await rest_request(
        'GET', 'accessibility_needs',
        params={
            'student_id': f"eq.{student['user_id']}",
            'priority': 'eq.primary',
            'select': 'need_type',
            'limit': '1',
        },
    ) or []
    preset = needs[0].get('need_type') if needs else 'learning_disability'
    if preset not in PRESET_PROMPTS:
        preset = 'learning_disability'

    await update_document(document_id, student['student_id'], {
        'status': 'processing', 'error_message': None,
    })
    try:
        simplified = await simplify_with_gemini(document['original_text'], preset)
    except HTTPException as error:
        await update_document(document_id, student['student_id'], {
            'status': 'failed', 'error_message': str(error.detail),
        })
        raise
    except Exception as error:
        message = 'The simplifier could not finish this document. Please retry in a moment.'
        await update_document(document_id, student['student_id'], {
            'status': 'failed', 'error_message': message,
        })
        raise HTTPException(status_code=502, detail=message) from error

    await update_document(document_id, student['student_id'], {
        'simplified_text': simplified,
        'status': 'done',
        'error_message': None,
    })
    return {'id': str(document_id), 'status': 'done', 'preset': preset, 'simplified_text': simplified}