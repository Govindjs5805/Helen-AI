alter table public.documents
  add column if not exists simplification_metadata jsonb,
  add column if not exists ocr_confidence numeric check (
    ocr_confidence is null or (ocr_confidence >= 0 and ocr_confidence <= 100)
  );

comment on column public.documents.simplification_metadata is
  'Readability scores, selected level, output format, and simplification confidence.';
comment on column public.documents.ocr_confidence is
  'Average Tesseract word confidence from scanned content, when available.';
